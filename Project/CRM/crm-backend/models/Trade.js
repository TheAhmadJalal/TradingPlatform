const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  instrument: String,
  type: String,
  size: Number,
  entry: Number,
  sl: Number,
  tp: Number,
  leverage: Number,
  open: Boolean,
  close: Number,
  closeTime: Date,
  pnl: Number,
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
