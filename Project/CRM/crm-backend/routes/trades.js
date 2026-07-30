const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const User = require('../models/User'); // 👈 Add User model for updates

console.log('✅ Trades routes loaded');

// POST /api/trades - Create a trade and update user's account values
router.post('/', async (req, res) => {
  try {
    const newTrade = new Trade(req.body);
    await newTrade.save();

    // Update user account values
    const user = await User.findById(req.body.userId);
    if (user) {
      // Update PNL total
      user.pnlTotal += newTrade.pnl;

      // Apply trade PNL to balance if it's closed
      if (!newTrade.open) {
        user.balance += newTrade.pnl;
      }

      // Recalculate equity and margin
      const equity = user.balance;
      const usedMargin = 0; // only for open trades
      const freeMargin = equity - usedMargin;

      user.equity = equity;
      user.usedMargin = usedMargin;
      user.freeMargin = freeMargin;

      await user.save();
    }

    res.status(201).json(newTrade);
  } catch (err) {
    console.error('Error saving trade:', err);
    res.status(500).json({ error: 'Failed to save trade' });
  }
});
// GET /api/trades/user/:userId - Get trades for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    console.error('Error fetching user trades:', err);
    res.status(500).json({ error: 'Failed to fetch user trades' });
  }
});


module.exports = router;


