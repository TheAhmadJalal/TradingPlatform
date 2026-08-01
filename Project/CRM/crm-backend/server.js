const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Health check
app.get("/", (req, res) => {
  res.send("✅ API(CRM) is up!");
});
const clientRoutes = require("./routes/clients");
const transactionRoutes = require("./routes/transactions");
const tradesRoutes = require('./routes/trades');
const leadRoutes = require('./routes/leads');

// The CRM frontend calls /crm-api/* because nginx reserves /api/ for the
// platform backend on :5000. Mounting both prefixes means nginx can simply
// forward /crm-api/ through untouched (no path rewriting), and the API is
// still reachable at /api/* when hitting :5001 directly in local dev.
["/crm-api", "/api"].forEach(prefix => {
  app.use(`${prefix}/clients`, clientRoutes);
  app.use(`${prefix}/transactions`, transactionRoutes);
  app.use(`${prefix}/trades`, tradesRoutes);
  app.use(`${prefix}/leads`, leadRoutes);
});


// MongoDB Connection
// mongoose.connect("mongodb://127.0.0.1:27017/PLATFORM")
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB error:", err));

// // Start Server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

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
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
})();
