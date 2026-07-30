const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const { authenticate } = require("./auth");

router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid user ID format" });
    }

    if (String(req.userId) !== id) {
      return res.status(403).json({ msg: "Unauthorized access" });
    }

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
