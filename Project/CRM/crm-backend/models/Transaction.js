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
  },
  coin: {
    type: String,
    enum: ["btc", "eth", "usdt"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  fee: {
    type: Number,
    default: 0,
  },
  address: String,
  txHash: String,
  status: {
    type: String,
    enum: ["pending", "successful", "failed", "canceled"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  withdrawDetails: {
    requested: { type: Number },
    fee: { type: Number },
    net: { type: Number }
  }
});

module.exports = mongoose.model("transaction", transactionSchema);

