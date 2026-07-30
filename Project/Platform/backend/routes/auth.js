const { body, validationResult } = require("express-validator");
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const ResetToken = require("../models/ResetToken");
const sendResetEmail = require("../utils/mailer");

const router = express.Router();

// ================= JWT SECRET CHECK ==================
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment");
}

// ================= RATE LIMITING =====================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ================= AUTH MIDDLEWARE =================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(403).json({ msg: "Invalid or expired token" });
  }
};

// ================= HELPER: Generate Account Number =================
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    accountNumber = `ACC-${randomNum}`;
    exists = await User.findOne({ accountNumber });
  }

  return accountNumber;
};

// ================= REGISTER =================
router.post(
  "/register",
  authLimiter,
  [
    body("username").notEmpty().trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("phone").notEmpty().trim().escape(),
    body("firstName").optional().trim().escape(),
    body("lastName").optional().trim().escape(),
    body("country").optional().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, phone, firstName = "", lastName = "", country = "" } = req.body;

    try {
      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ msg: "Email already in use" });

      const hash = await bcrypt.hash(password, 10);
      const startingBalance = 0;

      const determineAccountType = (balance) => {
        if (balance >= 100000) return "VIP";
        if (balance >= 50000) return "Gold";
        if (balance >= 25000) return "Silver";
        if (balance >= 10000) return "Bronze";
        if (balance >= 5000) return "Standard";
        return "Student Account";
      };

      const user = new User({
        firstName,
        lastName,
        username,
        email,
        password: hash,
        phone,
        country,
        accountNumber: await generateAccountNumber(),
        balance: startingBalance,
        credit: 0,
        bonus: 0,
        equity: 0,
        usedMargin: 0,
        freeMargin: 0,
        pnlTotal: 0,
        accountType: determineAccountType(startingBalance),
        role: "user",
      });

      await user.save();

      const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);


      res.status(201).json({
        msg: "User registered successfully",
        token,
        user: {
          id: user._id,
          firstName,
          lastName,
          username,
          email,
          phone,
          country,
          accountNumber: user.accountNumber,
          balance: user.balance,
          credit: user.credit,
          bonus: user.bonus,
          equity: user.equity,
          usedMargin: user.usedMargin,
          freeMargin: user.freeMargin,
          pnlTotal: user.pnlTotal,
          accountType: user.accountType,
          role: user.role,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================= LOGIN =================
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(400).json({ msg: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);

      res.json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          country: user.country,
          accountNumber: user.accountNumber,
          balance: user.balance,
          credit: user.credit,
          bonus: user.bonus,
          equity: user.equity,
          usedMargin: user.usedMargin,
          freeMargin: user.freeMargin,
          pnlTotal: user.pnlTotal,
          accountType: user.accountType,
          role: user.role,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================= REQUEST RESET LINK =================
router.post(
  "/request-password-reset",
  authLimiter,
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Always return same message to prevent user enumeration
        return res.status(200).json({ message: "If your email exists, a reset link has been sent." });
      }

      // Clean up any existing tokens
      await ResetToken.deleteMany({ userId: user._id });

      // Generate secure token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Store hashed token with expiry
      const resetToken = new ResetToken({
        userId: user._id,
        token: hashedToken,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        used: false,
      });

      await resetToken.save();

      // Prepare secure reset link
      const resetLink = `${process.env.RESET_LINK_BASE}?token=${rawToken}`;

      // Send the reset link via email
      await sendResetEmail(email, resetLink);

      res.status(200).json({ message: "If your email exists, a reset link has been sent." });
    } catch (err) {
      console.error("Password reset request error:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);


// ================= RESET PASSWORD =================
router.post(
  "/reset-password",
  [
    body("token").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    try {
      const resetRecord = await ResetToken.findOne({ token: hashedToken });

      if (!resetRecord || resetRecord.expires < Date.now() || resetRecord.used) {
        return res.status(400).json({ message: "This token is invalid, expired, or used." });
      }

      const user = await User.findById(resetRecord.userId);
      if (!user) return res.status(400).json({ message: "User not found." });

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await ResetToken.deleteMany({ userId: user._id }); // cleanup

      res.json({ message: "Password has been reset successfully." });
    } catch (err) {
      console.error("Reset error:", err);
      res.status(500).json({ message: "Reset failed." });
    }
  }
);

// ================= UPDATE PROFILE =================
router.put(
  "/update",
  authenticate,
  [
    body("email").optional().isEmail().normalizeEmail(),
    body("firstName").optional().trim().escape(),
    body("lastName").optional().trim().escape(),
    body("username").optional().trim().escape(),
    body("phone").optional().trim().escape(),
    body("country").optional().trim().escape(),
    body("oldPassword").optional().isString(),
    body("newPassword").optional().isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const {
        email,
        firstName,
        lastName,
        username,
        phone,
        country,
        oldPassword,
        newPassword,
      } = req.body;

      if (oldPassword && newPassword) {
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });
        user.password = await bcrypt.hash(newPassword, 10);
      }

      if (email) user.email = email;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (username) user.username = username;
      if (phone) user.phone = phone;
      if (country) user.country = country;

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          country: user.country,
          accountNumber: user.accountNumber,
          balance: user.balance,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ error: "Server error." });
    }
  }
);

// ================= EXPORT =================
module.exports = { router, authenticate };

