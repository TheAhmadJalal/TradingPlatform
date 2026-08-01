const mongoose = require("mongoose");

/**
 * A prospect who filled in the public signup form (frontend/inscription.html).
 * Not a User — no account, no password, no balance. The CRM reads this
 * collection to work the leads (crm-backend/routes/leads.js).
 */
const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: { type: String, required: true, trim: true, maxlength: 40 },

    status: {
      type: String,
      enum: ["new", "contacted", "converted", "rejected"],
      default: "new",
      lowercase: true,
      trim: true
    },

    // Where the lead came from, so several landing pages can be told apart
    source: { type: String, default: "website", trim: true, maxlength: 60 },

    // Which language they filled the form in — useful for assigning an adviser
    language: { type: String, enum: ["en", "fr"], default: "fr" },

    // Free-text follow-up notes written by the CRM operator
    notes: { type: String, trim: true, default: "", maxlength: 2000 },

    // Bumped when the same email submits again, instead of creating duplicates
    submissions: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
