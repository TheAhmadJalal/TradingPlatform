const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "bonus", "credit"],
    required: true,
    lowercase: true,
    trim: true
  },
  coin: {
    type: String,
    enum: ["btc", "eth", "usdt", "usd"],
    default: "usdt",
    lowercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  address: {
    type: String,
    trim: true
  },
  txHash: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed", "canceled"],
    default: "pending",
    lowercase: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  withdrawDetails: {
    requested: { type: Number, min: 0 },
    fee: { type: Number, min: 0 },
    net: { type: Number }
  }
});

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
