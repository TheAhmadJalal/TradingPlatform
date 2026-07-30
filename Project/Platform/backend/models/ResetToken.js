const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    trim: true
  },
  expires: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
});

resetTokenSchema.index({ token: 1 });

module.exports = mongoose.model('ResetToken', resetTokenSchema);
