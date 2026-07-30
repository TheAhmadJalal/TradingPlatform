const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcrypt');

// ✅ GET total number of clients
router.get('/count', async (req, res) => {
  try {
    const totalClients = await User.countDocuments(); // Count all user documents
    res.json({ count: totalClients }); // Return the count
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET all clients (basic info)
router.get('/', async (req, res) => {
  try {
    const clients = await User.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      country: 1,
      accountNumber: 1,
      balance: 1,
      status: 1,
      comments: 1,
      createdAt: 1
    }); // Fetch selected fields from all users

    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ✅ GET a specific client by account number
router.get('/:accountNumber', async (req, res) => {
  try {
    const client = await User.findOne({ accountNumber: req.params.accountNumber }); // Find by accountNumber
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client); // Return client object
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET trade counts for a client (opened and closed)
router.get('/:accountNumber/trade-counts', async (req, res) => {
  try {
    const client = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Count open and closed trades
    const openedCount = await Trade.countDocuments({ userId: client._id, open: true });
    const closedCount = await Trade.countDocuments({ userId: client._id, open: false });

    res.json({ openedTrades: openedCount, closedTrades: closedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trade counts' });
  }
});

// ✅ GET transaction count for a client
router.get('/:accountNumber/transaction-count', async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!user) return res.status(404).json({ error: "User not found" });

    const count = await Transaction.countDocuments({ userId: user._id });
    res.json({ transactionCount: count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ PATCH: Add a new comment to a client
router.patch('/:accountNumber/comment', async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Comment is required" });

  try {
    const updated = await User.findOneAndUpdate(
      { accountNumber: req.params.accountNumber },
      {
        $push: {
          comments: {
            text: comment,
            createdAt: new Date() // Add timestamped comment
          }
        }
      },
      { new: true } // Return updated document
    );

    res.json(updated.comments); // Return all comments
  } catch (err) {
    res.status(500).json({ error: "Failed to save comment" });
  }
});

// ✅ PUT: Update client data (including password if present)
// ✅ PUT: Update client data (including password if present)
router.put('/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;
  const updates = req.body;

  try {
    const user = await User.findOne({ accountNumber });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Hash password if provided
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
      user.password = updates.password; // ✅ FIX: Assign to user
    }

    // Update status and accountType explicitly
    if (typeof updates.status !== 'undefined') user.status = updates.status;
    if (typeof updates.accountType !== 'undefined') user.accountType = updates.accountType;

    // Update names and regenerate username
    if (typeof updates.firstName !== 'undefined') user.firstName = updates.firstName;
    if (typeof updates.lastName !== 'undefined') user.lastName = updates.lastName;
    user.username = `${user.firstName} ${user.lastName}`;

    // Update contact info
    if (typeof updates.email !== 'undefined') user.email = updates.email;
    if (typeof updates.phone !== 'undefined') user.phone = updates.phone;
    if (typeof updates.country !== 'undefined') user.country = updates.country;

    await user.save();

    res.json(user); // Return updated user
  } catch (err) {
    console.error("PUT /api/clients/:accountNumber failed", err);
    res.status(500).json({ msg: "Failed to update client" });
  }
});



////////DOCUMENT VIEW//////////////////
// ✅ GET documents uploaded by a client
// ✅ GET: Return base64 documents for a client
router.get('/:accountNumber/documents', async (req, res) => {
  try {
    const client = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!client) return res.status(404).json({ error: "Client not found" });

    if (!client.documents || client.documents.length === 0) {
      return res.json([]);
    }

    res.json(client.documents); // Return the full array of document objects
  } catch (err) {
    console.error("Failed to fetch documents", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ POST: Update user's bonus and credit + log transaction
router.post('/update-financials', async (req, res) => {
  const { userId, bonus, credit } = req.body;

  if (!userId) return res.status(400).json({ msg: "Missing userId" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const bonusAmount = parseFloat(bonus) || 0;
    const creditAmount = parseFloat(credit) || 0;

    // Update bonus and credit
    if (bonus !== undefined) user.bonus = bonusAmount;
    if (credit !== undefined) user.credit = creditAmount;

    // Update balance = balance + bonus + credit (or recalculate however you prefer)
    user.balance = (user.balance || 0) + bonusAmount + creditAmount;

    await user.save();

    // Create transaction logs
    const logs = [];

    if (bonusAmount > 0) {
      logs.push(new Transaction({
        userId,
        type: "bonus",
        coin: "usdt",
        amount: bonusAmount,
        status: "successful"
      }));
    }

    if (creditAmount > 0) {
      logs.push(new Transaction({
        userId,
        type: "credit",
        coin: "usdt",
        amount: creditAmount,
        status: "successful"
      }));
    }

    if (logs.length > 0) {
      await Transaction.insertMany(logs);
    }

    res.json({ msg: "Financials updated", user });
  } catch (err) {
    console.error("Financial update error:", err);
    res.status(500).json({ error: err.message });
  }
});
// PUT /api/clients/update-financials
// ✅ Add this at the bottom of routes/clients.js
router.put("/update-financials", async (req, res) => {
  const { userId, field, amount } = req.body;

  if (!userId || !field || typeof amount !== "number") {
    return res.status(400).json({ msg: "Missing or invalid fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!["bonus", "credit"].includes(field)) {
      return res.status(400).json({ msg: "Invalid field" });
    }

    // ✅ Update field
    user[field] = (user[field] || 0) + amount;
    await user.save();

    res.json({ success: true, [field]: user[field] });
  } catch (err) {
    console.error("Update financials error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


// Export router to use in your Express app
module.exports = router;


