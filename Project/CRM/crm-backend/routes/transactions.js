const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * ✅ GET all transactions with user info
 */
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'username accountNumber')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

/**
 * ✅ GET summary of total deposits and withdrawals
 */
router.get('/summary', async (req, res) => {
  try {
    const deposits = await Transaction.aggregate([
      { $match: { type: "deposit", status: "successful" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const withdrawals = await Transaction.aggregate([
      { $match: { type: "withdrawal", status: "successful" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalDeposits = deposits[0]?.total || 0;
    const totalWithdrawals = withdrawals[0]?.total || 0;

    res.json({ totalDeposits, totalWithdrawals });
  } catch (err) {
    console.error("❌ Error generating summary:", err.message);
    res.status(500).json({ success: false, message: "Summary fetch failed" });
  }
});

/**
 * ✅ CREATE a new transaction
 */
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, coin, status, date } = req.body;

    if (!userId || !type || !amount || !coin || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const transactionData = {
      userId,
      type,
      coin,
      status,
      date: date || Date.now(),
    };

    if (type === "withdrawal") {
      const fee = amount * 0.04;
      const net = amount - fee;

      if (user.availableBalance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient funds" });
      }

      // Deduct from balances
      user.balance -= amount;
      user.availableBalance -= amount;

      // Update equity and free margin
      user.equity = user.balance;
      user.freeMargin = user.equity - user.usedMargin;

      // Round all fields
      user.balance = parseFloat(user.balance.toFixed(2));
      user.availableBalance = parseFloat(user.availableBalance.toFixed(2));
      user.equity = parseFloat(user.equity.toFixed(2));
      user.freeMargin = parseFloat(user.freeMargin.toFixed(2));

      transactionData.amount = parseFloat(net.toFixed(2));
      transactionData.withdrawDetails = {
        requested: parseFloat(amount.toFixed(2)),
        fee: parseFloat(fee.toFixed(2)),
        net: parseFloat(net.toFixed(2))
      };
    } else {
      transactionData.amount = amount;

      if (status === "successful") {
        user.balance += amount;
        user.availableBalance += amount;

        user.equity = user.balance;
        user.freeMargin = user.equity - user.usedMargin;

        user.balance = parseFloat(user.balance.toFixed(2));
        user.availableBalance = parseFloat(user.availableBalance.toFixed(2));
        user.equity = parseFloat(user.equity.toFixed(2));
        user.freeMargin = parseFloat(user.freeMargin.toFixed(2));
      }
    }

    const tx = await Transaction.create(transactionData);
    await user.save();

    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    console.error("❌ Error creating transaction:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ APPROVE a withdrawal (no balance changes needed — already deducted)
 */
router.put('/:id/approve', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

    if (tx.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: "Only withdrawals can be approved" });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Only pending withdrawals can be approved" });
    }

    tx.status = 'successful';
    await tx.save();

    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ CANCEL a pending withdrawal (restore balance, equity, freeMargin)
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

    if (tx.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: "Only withdrawals can be canceled" });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Only pending withdrawals can be canceled" });
    }

    const user = await User.findById(tx.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const originalAmount = tx.withdrawDetails?.requested;
    if (!originalAmount || isNaN(originalAmount)) {
      return res.status(400).json({ success: false, message: "Missing or invalid original requested amount" });
    }

    // Refund original amount
    user.balance += originalAmount;
    user.availableBalance += originalAmount;

    // Recalculate margin metrics
    user.equity = user.balance;
    user.freeMargin = user.equity - user.usedMargin;

    // Round everything
    user.balance = parseFloat(user.balance.toFixed(2));
    user.availableBalance = parseFloat(user.availableBalance.toFixed(2));
    user.equity = parseFloat(user.equity.toFixed(2));
    user.freeMargin = parseFloat(user.freeMargin.toFixed(2));

    await user.save();

    tx.status = 'canceled';
    await tx.save();

    res.json({ success: true, refunded: originalAmount, transaction: tx });
  } catch (err) {
    console.error("❌ Error in /cancel:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ Get all transactions for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching client transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;



