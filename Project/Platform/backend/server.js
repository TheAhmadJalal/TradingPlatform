require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { router: authRoutes }     = require("./routes/auth");
const tradingRoutes              = require("./routes/trading");
const userRoutes                 = require("./routes/user");
const uploadRoutes               = require("./routes/upload");
const transactionRoutes          = require("./routes/transactions");
const adminRoutes                = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy ONLY if explicitly enabled
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Middleware: Security
app.use(helmet());
app.use(helmet.hidePoweredBy());

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

//  Body parser
app.use(express.json({ limit: "1mb" }));

//  Logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//  CORS (more forgiving in dev)
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// Health check
app.get("/", (req, res) => {
  res.send("✅ API is up!");
});

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use("/api/auth",         authLimiter, authRoutes);
app.use("/api/trading",      tradingRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/upload",       uploadRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin",        adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error handler caught:", err.stack || err.message);
  res.status(500).json({ msg: "Internal server error" });
});

// Connect to MongoDB
(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
})();
