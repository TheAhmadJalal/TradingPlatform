const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');

const Trade = require('../models/Trade');
const User = require('../models/User');
const { authenticate } = require('./auth');

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// ✅ Fetch Binance price with timeout
async function fetchLivePrice(symbol) {
  try {
    const res = await axios.get(`${BINANCE_API_BASE}/ticker/price`, {
      params: { symbol },
      timeout: 5000
    });
    return parseFloat(res.data.price);
  } catch (err) {
    console.error(`Price fetch failed for ${symbol}:`, err.message);
    return null;
  }
}

// ✅ Determine account type based on balance
function determineAccountType(balance) {
  if (balance >= 100000) return "VIP";
  if (balance >= 50000) return "Gold";
  if (balance >= 25000) return "Silver";
  if (balance >= 10000) return "Bronze";
  if (balance >= 5000)  return "Standard";
  return "Student Account";
}

// ✅ Update user metrics
async function updateUserMetrics(userRecord, userId) {
  const positions = await Trade.find({ userId, open: true }).lean();
  const history = await Trade.find({ userId, open: false }).lean();

  let usedMargin = 0;
  let unrealisedPnL = 0;

  const symbols = [...new Set(positions.map(t => t.instrument))];
  const pricesMap = {};
  await Promise.all(symbols.map(async sym => {
    const price = await fetchLivePrice(sym);
    pricesMap[sym] = price;
  }));

  positions.forEach(t => {
    usedMargin += t.size / t.leverage;
    const current = pricesMap[t.instrument] ?? t.entry;
    const diff = t.type === 'buy' ? current - t.entry : t.entry - current;
    const pnl = diff * 100 * (t.size / t.entry) * t.leverage;
    unrealisedPnL += pnl;
  });

  const realisedPnL = history.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const equity = userRecord.balance + unrealisedPnL;
  const freeMargin = equity - usedMargin;
  const pnlTotal = realisedPnL + unrealisedPnL;

  userRecord.equity = equity;
  userRecord.usedMargin = usedMargin;
  userRecord.freeMargin = freeMargin;
  userRecord.pnlTotal = pnlTotal;
  userRecord.accountType = determineAccountType(userRecord.balance);

  await userRecord.save();
}

// 📊 Total P&L of closed trades
router.get('/closed/:id', authenticate, async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ msg: 'Forbidden' });

  try {
    const closedTrades = await Trade.find({ userId: req.userId, open: false }).lean();
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    res.json({ totalPnl });
  } catch (err) {
    console.error("Closed PnL error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// 🟢 Place a new trade
router.post(
  '/place',
  authenticate,
  [
    body('instrument').isString(),
    body('type').isIn(['buy', 'sell']),
    body('size').isFloat({ gt: 0 }),
    body('entry').isFloat({ gt: 0 }),
    body('leverage').isFloat({ gt: 0 }),
    body('sl').optional().isFloat(),
    body('tp').optional().isFloat()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { instrument, type, size, entry, sl, tp, leverage } = req.body;

    try {
      const margin = size / leverage;
      const userRecord = await User.findById(req.userId);
      if (!userRecord) return res.status(404).json({ msg: 'User not found' });
      if (userRecord.balance < margin) {
        return res.status(400).json({ msg: 'Insufficient margin' });
      }

const trade = await Trade.create({
  userId: req.userId,
  instrument,
  type: type.toLowerCase(), // ensures it's always stored as 'buy' or 'sell'
  size,
  entry,
  sl,
  tp,
  leverage
});

      userRecord.balance -= margin;
      await updateUserMetrics(userRecord, req.userId);

      res.json({ trade, balance: userRecord.balance });
    } catch (err) {
      console.error("Trade placement error:", err.message);
      res.status(500).json({ msg: "Trade placement failed" });
    }
  }
);

// 🔴 Close a trade
router.post(
  '/close',
  authenticate,
  [
    body('tradeId').custom(id => mongoose.Types.ObjectId.isValid(id)),
    body('closePrice').isFloat({ gt: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tradeId, closePrice } = req.body;

    try {
      const trade = await Trade.findOne({ _id: tradeId, userId: req.userId, open: true });
      if (!trade) return res.status(404).json({ msg: 'Trade not found or already closed' });

      const priceDiff = trade.type === 'buy' ? closePrice - trade.entry : trade.entry - closePrice;
      const pnl = parseFloat((priceDiff * 100 * (trade.size / trade.entry) * trade.leverage).toFixed(2));

      trade.open = false;
      trade.close = closePrice;
      trade.pnl = pnl;
      trade.closeTime = new Date();
      await trade.save();

      const margin = trade.size / trade.leverage;
      const userRecord = await User.findById(req.userId);
      userRecord.balance += margin + pnl;

      await updateUserMetrics(userRecord, req.userId);

      res.json({ trade, pnl, balance: userRecord.balance });
    } catch (err) {
      console.error("Trade close error:", err.message);
      res.status(500).json({ msg: "Failed to close trade" });
    }
  }
);

// 📄 List all user trades
router.get('/user/:id/trades', authenticate, async (req, res) => {
  if (req.userId !== req.params.id) return res.status(403).json({ msg: 'Forbidden' });

  try {
    const all = await Trade.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.error("Fetch trades error:", err.message);
    res.status(500).json({ msg: "Failed to fetch trades" });
  }
});

// 📊 Dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const positions = await Trade.find({ userId: req.userId, open: true }).lean();
    const history = await Trade.find({ userId: req.userId, open: false }).lean();

    let usedMargin = 0;
    let unrealisedPnL = 0;

    const symbols = [...new Set(positions.map(t => t.instrument))];
    const pricesMap = {};
    await Promise.all(symbols.map(async sym => {
      const price = await fetchLivePrice(sym);
      pricesMap[sym] = price;
    }));

    positions.forEach(t => {
      usedMargin += t.size / t.leverage;
      const current = pricesMap[t.instrument] ?? t.entry;
      const diff = t.type.toLowerCase() === 'buy' ? current - t.entry : t.entry - current;

      const pnl = diff * 100 * (t.size / t.entry) * t.leverage;
      unrealisedPnL += pnl;
    });

    const realisedPnL = history.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const equity = user.balance + unrealisedPnL;
    const freeMargin = equity - usedMargin;
    const pnlTotal = realisedPnL + unrealisedPnL;

    user.equity = equity;
    user.usedMargin = usedMargin;
    user.freeMargin = freeMargin;
    user.pnlTotal = pnlTotal;
    user.accountType = determineAccountType(user.balance);
    await user.save();

    res.json({
      balance: user.balance,
      equity,
      usedMargin,
      freeMargin,
      pnlTotal,
      positions,
      history,
      accountType: user.accountType,
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
