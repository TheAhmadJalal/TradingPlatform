const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * A CRM operator (back-office staff). Completely separate from the
 * platform's `users` collection, which holds trading clients — a client
 * must never be able to sign into the CRM.
 */
const crmUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["admin", "agent"],
      default: "agent",
      lowercase: true,
      trim: true
    },

    // Lets you revoke access without deleting the account
    active: { type: Boolean, default: true },

    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Hash on create and whenever the password is changed
crmUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

crmUserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("CrmUser", crmUserSchema);
