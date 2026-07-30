const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  password: String,
  phone: String,
  country: String,
  accountNumber: String,
  balance: Number,
  credit: Number,
  bonus:  Number,
  equity: Number,
  usedMargin: Number,
  freeMargin: Number,
  pnlTotal: Number,
  accountType: String,
  role: String,
  status: {                 // ✅ ADDED status field
    type: String,
    default: "New"
  },
  documents: Array,
  comments: [
    {
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);



