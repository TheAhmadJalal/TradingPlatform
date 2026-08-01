const mongoose = require("mongoose");

/**
 * Mirror of Platform/backend/models/Lead.js — both services share one
 * database, so this must stay in step with it (same collection: "leads").
 * The platform writes leads from the public signup form; the CRM reads and
 * works them.
 */
const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, maxlength: 40 },

    status: {
      type: String,
      enum: ["new", "contacted", "converted", "rejected"],
      default: "new",
      lowercase: true,
      trim: true
    },

    source: { type: String, default: "website", trim: true, maxlength: 60 },
    language: { type: String, enum: ["en", "fr"], default: "fr" },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
    submissions: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
