const express = require("express");
const rateLimit = require("express-rate-limit");
const CrmUser = require("../models/CrmUser");
const { authenticate, signToken } = require("../middleware/auth");

const router = express.Router();

// Slow down credential stuffing. Counts failures only, so a busy operator
// signing in normally is never locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many failed attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /crm-api/auth/login
 * Returns a JWT the frontend stores and sends as `Authorization: Bearer …`.
 */
router.post("/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    // `password` is select:false on the model, so ask for it explicitly
    const user = await CrmUser.findOne({ email }).select("+password");

    // Same message and roughly the same work either way, so the response
    // cannot be used to discover which emails exist.
    const ok = user && user.active && (await user.verifyPassword(password));
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("❌ CRM login error:", err.message);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

/**
 * GET /crm-api/auth/me — used by the frontend guard to check the stored
 * token is still valid before rendering a page.
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await CrmUser.findById(req.crmUser.sub);
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: "Account is no longer active" });
    }
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not load your account" });
  }
});

/**
 * POST /crm-api/auth/change-password — for the signed-in operator.
 */
router.post("/change-password", authenticate, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ success: false, message: "The new password must be at least 8 characters" });
  }

  try {
    const user = await CrmUser.findById(req.crmUser.sub).select("+password");
    if (!user || !(await user.verifyPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // hashed by the pre-save hook
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("❌ CRM password change error:", err.message);
    res.status(500).json({ success: false, message: "Could not update the password" });
  }
});

module.exports = router;
