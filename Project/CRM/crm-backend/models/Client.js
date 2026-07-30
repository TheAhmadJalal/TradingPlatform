const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, unique: true },
  username: String,
  email: String,
  phone: String,
  balance: Number,
  credit:Number,
  bonus: Number, 
  equity: Number,
  usedMargin: Number,
  freeMargin: Number,
  pnlTotal: Number,
  country: String,
  status: String,
  documents: Number,
  transactions: Number,
  openedTrades: Number,
  closedTrades: Number
});

module.exports = mongoose.model("Client", clientSchema);
