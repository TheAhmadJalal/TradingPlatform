const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName:     { type: String, default: '', trim: true },
  lastName:      { type: String, default: '', trim: true },
  username:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:      { type: String, required: true },
  phone:         { type: String, trim: true },
  country:       { type: String, trim: true },
  accountNumber: { type: String, unique: true, trim: true },

  balance:       { type: Number, default: 0, min: 0 },
  credit:        { type: Number, default: 0, min: 0 },
  bonus:         { type: Number, default: 0, min: 0 },
  equity:        { type: Number, default: 0 },
  usedMargin:    { type: Number, default: 0, min: 0 },
  freeMargin:    { type: Number, default: 0 },
  pnlTotal:      { type: Number, default: 0 },

  accountType: {
    type: String,
    enum: ['vip', 'gold', 'silver', 'bronze', 'standard', 'student account'],
    default: 'student account',
    lowercase: true,
    trim: true
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    immutable: true
  },

  documents: [
    {
      filename:    { type: String, trim: true },
      contentType: { type: String, trim: true },
      base64:      { type: String },
      uploadedAt:  { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
