const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const Lead = require("../models/Lead");

const router = express.Router();

/**
 * POST /api/leads   — public signup form (frontend/inscription.html)
 *
 * Deliberately unauthenticated: it is a lead capture form for visitors who
 * do not have an account yet. Protected instead by a tight rate limit and a
 * honeypot field, and it can only ever create a Lead — never a User.
 */

// Stricter than the app-wide limiter, since this route is open to anyone.
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, msg: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const validators = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Please enter your full name."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("phone")
    .trim()
    .matches(/^\+?[0-9\s().-]{8,25}$/)
    .withMessage("Please enter a valid phone number."),
  body("language").optional().isIn(["en", "fr"]),
  body("source").optional().trim().isLength({ max: 60 })
];

router.post("/", leadLimiter, validators, async (req, res) => {
  // Honeypot: a field hidden from humans by CSS. If it arrived filled in it
  // was a bot, so answer 200 (so it does not retry) but store nothing.
  if (req.body.website) {
    return res.status(200).json({ success: true });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  const { fullName, email, phone, language = "fr", source = "website" } = req.body;

  try {
    // The same person submitting twice should update their lead, not spawn a
    // duplicate for the CRM operator to sift through.
    const existing = await Lead.findOne({ email });

    if (existing) {
      existing.fullName = fullName;
      existing.phone = phone;
      existing.language = language;
      existing.submissions += 1;
      await existing.save();

      return res.status(200).json({ success: true, duplicate: true });
    }

    await Lead.create({ fullName, email, phone, language, source });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Lead create error:", err.message);
    return res.status(500).json({ success: false, msg: "Could not save your details." });
  }
});

module.exports = router;
