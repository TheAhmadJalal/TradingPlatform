const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const { authenticate } = require('./auth');

// Middleware to allow only admins
const adminOnly = async (req, res, next) => {
  if (!req.userId) return res.status(401).json({ msg: "unauthorized" });
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ msg: "forbidden" });
    next();
  } catch {
    res.status(500).json({ msg: "server error" });
  }
};

// GET: List users
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const users = await User.find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password')
      .lean();
    const total = await User.countDocuments();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: User details
router.get('/user/:id', authenticate, adminOnly, [
  param('id').custom(id => mongoose.Types.ObjectId.isValid(id)).withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update user info
router.put('/user/:id', authenticate, adminOnly, [
  param('id').custom(id => mongoose.Types.ObjectId.isValid(id)).withMessage('Invalid user ID'),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['user', 'admin']),
  body('balance').optional().isNumeric(),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updates = {};
    const allowedFields = ['email', 'role', 'balance', 'firstName', 'lastName', 'username', 'phone', 'country'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: User trades
router.get('/user/:id/trades', authenticate, adminOnly, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.params.id }).lean();
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Admin closes trade
router.post('/trade/:tradeId/close', authenticate, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.tradeId)) {
      return res.status(400).json({ msg: "Invalid trade ID" });
    }

    const trade = await Trade.findById(req.params.tradeId);
    if (!trade) return res.status(404).json({ msg: "Trade not found" });
    if (!trade.open) return res.status(400).json({ msg: "Trade already closed" });

    trade.open = false;
    trade.closedAt = new Date();
    trade.closedByAdmin = req.userId;

    await trade.save();

    res.json({ msg: "Trade closed", trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: User transactions
router.get('/user/:id/transactions', authenticate, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.id }).sort({ date: -1 }).lean();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Admin adds deposit
router.post('/user/:id/deposit', authenticate, adminOnly, [
  body('amount').isNumeric().custom(val => val > 0).withMessage('Amount must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { amount, coin = "USDT", txHash = "admin-deposit", status = "successful" } = req.body;

    user.balance += amount;
    await user.save();

    const transaction = new Transaction({
      userId: req.params.id,
      type: "deposit",
      coin,
      amount,
      status,
      txHash,
      date: new Date()
    });

    await transaction.save();

    res.json({ msg: "Deposit added", transaction, newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update withdrawal status
router.put('/transaction/:id/status', authenticate, adminOnly, [
  body('status').isIn(["pending", "approved", "canceled", "rejected"])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.type.toLowerCase() !== "withdrawal") {
      return res.status(400).json({ msg: "Only withdrawals can be updated" });
    }

    if (transaction.status === "approved" && req.body.status !== "approved") {
      return res.status(400).json({ msg: "Approved withdrawals cannot be modified" });
    }

    if (req.body.status === "canceled") {
      const user = await User.findById(transaction.userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const refund = (transaction.amount || 0) + (transaction.fee || 0);
      user.balance += refund;
      await user.save();
    }

    transaction.status = req.body.status;
    await transaction.save();

    res.json({ msg: "Withdrawal status updated", transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;