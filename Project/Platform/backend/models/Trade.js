const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId:    { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  instrument:{ type: String, required: true, trim: true },
  type:      { type: String, enum: ['buy','sell'], required: true, lowercase: true, trim: true },
  size:      { type: Number, required: true, min: 0.01 },
  entry:     { type: Number, required: true, min: 0 },
  sl:        { type: Number, default: null },
  tp:        { type: Number, default: null },
  leverage:  { type: Number, default: 1, min: 1 },
  open:      { type: Boolean, default: true },
  close:     { type: Number },
  pnl:       { type: Number },
  closeTime: { type: Date }
}, { timestamps: true });

TradeSchema.index({ userId: 1, open: 1 });

module.exports = mongoose.model('Trade', TradeSchema);
