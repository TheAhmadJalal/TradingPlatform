const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");

const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Trade = require("../models/Trade");

const { authenticate } = require("./auth");

// OPTIONAL: define admin whitelist
const ADMIN_IDS = process.env.ADMIN_IDS?.split(",") || [];

const requireAdmin = (req, res, next) => {
  if (!ADMIN_IDS.includes(req.userId)) {
    return res.status(403).json({ msg: "Admin access required" });
  }
  next();
};

// ===================== Update User Metrics =====================
async function updateUserMetrics(userRecord, userId) {
  const positions = await Trade.find({ userId, open: true }).lean();
  const history = await Trade.find({ userId, open: false }).lean();

  let usedMargin = 0;
  let unrealisedPnL = 0;

  positions.forEach(t => {
    usedMargin += t.size / t.leverage;
    const current = t.entry;
    const diff = t.type === 'Buy' ? current - t.entry : t.entry - current;
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

  await userRecord.save();
}

// ===================== Verify Deposit =====================
router.post(
  "/verify",
  authenticate,
  [
    body("userId").notEmpty(),
    body("coin").isString().toLowerCase(),
    body("txHash").notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, coin, txHash } = req.body;

    if (req.userId !== userId) return res.status(403).json({ msg: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

      try {
      const existing = await Transaction.findOne({ txHash });
      if (existing) {
        return res.status(400).json({ msg: "Transaction already verified" });
      }

      let toAddress, amountUsd;

      if (coin === "btc") {
        toAddress = process.env.BTC_TO_ADDRESS;
        const { data } = await axios.get(
          `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
          { timeout: 8000 }
        );
        const match = data.outputs.find(o => o.addresses.includes(toAddress));
        if (!match) return res.status(400).json({ msg: "Deposit address mismatch" });
        if (!data.confirmations || data.confirmations < 1)
          return res.status(400).json({ msg: "Transaction not confirmed" });

        const { data: priceData } = await axios.get(
          "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
          { timeout: 5000 }
        );
        const btcPrice = parseFloat(priceData.price);
        amountUsd = (match.value / 1e8) * btcPrice;
      } else if (coin === "eth" || coin === "usdt") {
        toAddress = process.env.ETH_TO_ADDRESS.toLowerCase();
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${toAddress}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
        const { data } = await axios.get(url, { timeout: 8000 });
        const tx = data.result.find(t => t.hash.toLowerCase() === txHash.toLowerCase());
        if (!tx || tx.to.toLowerCase() !== toAddress)
          return res.status(400).json({ msg: "Deposit address mismatch or not found" });
        if (parseInt(tx.confirmations) < 1)
          return res.status(400).json({ msg: "Transaction not confirmed" });

        const tokenDecimals = parseInt(tx.tokenDecimal, 10);
        amountUsd = parseFloat(tx.value) / 10 ** tokenDecimals;
      } else {
        return res.status(400).json({ msg: "Unsupported coin" });
      }

      amountUsd = +parseFloat(amountUsd).toFixed(2);
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      user.balance += amountUsd;
      await user.save();

      await new Transaction({
        userId,
        type: "deposit",
        coin,
        amount: amountUsd,
        status: "successful",
        txHash,
        date: new Date()
      }).save();

      await updateUserMetrics(user, userId);

      res.json({ success: true, amount: amountUsd, newBalance: user.balance });
    } catch (err) {
      console.error("Verification error:", err.message);
      res.status(500).json({ error: "Verification failed" });
    }
  }
);

// ===================== Withdraw Funds =====================
router.post(
  "/withdrawal",
  authenticate,
  [
    body("userId").notEmpty(),
    body("coin").isString(),
    body("address").isString(),
    body("amount").isFloat({ gt: 0 })
  ],
  async (req, res) => {
    const { userId, coin, address, amount } = req.body;
    if (req.userId !== userId) return res.status(403).json({ msg: "Unauthorized" });

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const fee = parseFloat((amount * 0.04).toFixed(2));
      const net = parseFloat((amount - fee).toFixed(2));

      if (amount > user.withdrawAvailable) {
        return res.status(400).json({ msg: "Insufficient available balance" });
      }

      user.balance -= amount;
      user.withdrawAvailable -= amount;
      user.equity = user.balance;
      user.freeMargin = user.equity - user.usedMargin;

      ["balance", "withdrawAvailable", "equity", "freeMargin"].forEach(field => {
        user[field] = parseFloat(user[field].toFixed(2));
      });

      await user.save();

      await new Transaction({
        userId,
        type: "withdrawal",
        status: "pending",
        date: new Date(),
        coin,
        address,
        amount,
        fee,
        net,
        withdrawDetails: { requested: amount, fee, net }
      }).save();

      await updateUserMetrics(user, userId);

      res.json({ success: true, withdrawal: { amount, fee, net, newBalance: user.balance } });
    } catch (err) {
      console.error("Withdrawal error:", err.message);
      res.status(500).json({ error: "Withdrawal failed" });
    }
  }
);

// ===================== Cancel Withdrawal =====================
router.patch("/cancel/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid transaction ID" });
  }

  try {
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });
    if (tx.userId.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (tx.type !== "withdrawal" || tx.status !== "pending") {
      return res.status(400).json({ msg: "Cannot cancel this withdrawal" });
    }

    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const refund = tx.withdrawDetails?.requested;
    if (!refund || isNaN(refund)) {
      return res.status(400).json({ msg: "Invalid or missing requested amount" });
    }

    user.balance += refund;
    user.withdrawAvailable += refund;
    user.equity = user.balance;
    user.freeMargin = user.equity - user.usedMargin;

    ["balance", "withdrawAvailable", "equity", "freeMargin"].forEach(field => {
      user[field] = parseFloat(user[field].toFixed(2));
    });

    await user.save();

    tx.status = "canceled";
    await tx.save();

    await updateUserMetrics(user, user._id);

    res.json({ success: true, canceled: true, refunded: refund, newBalance: user.balance });
  } catch (err) {
    console.error("Cancel error:", err.message);
    res.status(500).json({ error: "Failed to cancel withdrawal" });
  }
});

// ===================== Get User Transactions =====================
router.get("/:userId", authenticate, async (req, res) => {
  const { userId } = req.params;

  if (req.userId !== userId) return res.status(403).json({ msg: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "Invalid user ID" });
  }

  try {
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ===================== Deposit Intent (for tracking only) =====================
router.post("/deposit", authenticate, [
  body("userId").notEmpty(),
  body("coin").isString(),
  body("address").isString()
], (req, res) => {
  const { userId, coin, address } = req.body;
  if (req.userId !== userId) return res.status(403).json({ msg: "Unauthorized" });

  try {
    console.log(`Deposit initiated for ${coin} → ${address} by user ${userId}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Deposit init error:", err.message);
    res.status(500).json({ error: "Failed to register deposit intent" });
  }
});

// ===================== Bonus or Credit (Admin only) =====================
router.post("/finance", authenticate, requireAdmin, [
  body("userId").notEmpty(),
  body("type").isIn(["bonus", "credit"]),
  body("amount").isFloat({ gt: 0 })
], async (req, res) => {
  const { userId, type, amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const amountNum = parseFloat(amount);
    user.balance += amountNum;

    if (type === "bonus") user.bonus = (user.bonus || 0) + amountNum;
    else if (type === "credit") user.credit = (user.credit || 0) + amountNum;

    await user.save();

    await new Transaction({
      userId,
      type,
      coin: "usdt",
      amount: amountNum,
      status: "successful",
      date: new Date()
    }).save();

    await updateUserMetrics(user, userId);

    res.json({ success: true, newBalance: user.balance });
  } catch (err) {
    console.error("Finance error:", err.message);
    res.status(500).json({ error: "Failed to apply finance transaction" });
  }
});

module.exports = router;
