const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");

const router = express.Router();

const STATUSES = ["new", "contacted", "converted", "rejected"];

/**
 * GET /crm-api/leads
 * Newest first. Optional ?status=new to filter.
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    res.json(leads);
  } catch (err) {
    console.error("❌ Error loading leads:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /crm-api/leads/summary — counts per status, for the dashboard tile.
 */
router.get("/summary", async (req, res) => {
  try {
    const rows = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const summary = { total: 0, new: 0, contacted: 0, converted: 0, rejected: 0 };
    rows.forEach(r => {
      summary[r._id] = r.count;
      summary.total += r.count;
    });

    res.json(summary);
  } catch (err) {
    console.error("❌ Error building lead summary:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /crm-api/leads/:id — update the status and/or the follow-up notes.
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid lead ID" });
  }

  const update = {};

  if (req.body.status !== undefined) {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: " + STATUSES.join(", ")
      });
    }
    update.status = req.body.status;
  }

  if (req.body.notes !== undefined) {
    update.notes = String(req.body.notes).slice(0, 2000);
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ success: false, message: "Nothing to update" });
  }

  try {
    const lead = await Lead.findByIdAndUpdate(id, update, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.json({ success: true, lead });
  } catch (err) {
    console.error("❌ Error updating lead:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
