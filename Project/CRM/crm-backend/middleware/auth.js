const jwt = require("jsonwebtoken");

/**
 * CRM authentication middleware.
 *
 * Every CRM route sits behind `authenticate`. Until this existed the whole
 * CRM API was open to the internet: anyone who knew the URL could read
 * client records and KYC documents, change balances and approve withdrawals.
 */

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  // Refuse to boot rather than silently accept unsigned/forgeable tokens.
  console.error(
    "❌ JWT_SECRET is not set in crm-backend/.env — the CRM cannot start without it."
  );
  process.exit(1);
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.crmUser = payload;
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      message: expired ? "Session expired, please sign in again" : "Invalid session",
      expired
    });
  }
}

/** For destructive or privileged operations. */
function requireAdmin(req, res, next) {
  if (!req.crmUser || req.crmUser.role !== "admin") {
    return res.status(403).json({ success: false, message: "Administrator access required" });
  }
  next();
}

module.exports = { authenticate, requireAdmin, signToken };
