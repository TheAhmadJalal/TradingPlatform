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
const clientRoutes = require("./routes/clients");
const transactionRoutes = require("./routes/transactions");
const tradesRoutes = require('./routes/trades');
app.use("/api/clients", clientRoutes);
app.use("/api/transactions", require("./routes/transactions"));
app.use('/api/trades', tradesRoutes);


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
