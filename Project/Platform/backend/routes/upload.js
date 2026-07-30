const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('./auth');

// ✅ Secure Base64 document upload
router.post('/document/base64/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, contentType, base64Data } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Only allow access to own uploads
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check for required fields
    if (!name || !contentType || !base64Data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate base64 format and extract payload
    const matches = base64Data.match(/^data:([\w/+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 format' });
    }

    const mimeType = matches[1];
    const base64Payload = matches[2];

    // Optional: enforce whitelist of accepted content types
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    // Check file size (max: 5MB)
    const buffer = Buffer.from(base64Payload, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large' });
    }

    // Find user and save document metadata
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.documents.push({
      filename: name,
      contentType,
      base64: base64Payload,
      uploadedAt: new Date()
    });

    await user.save();
    res.json({ msg: '✅ Document uploaded successfully' });
  } catch (err) {
    console.error('❌ Base64 upload error:', err);
    res.status(500).json({ error: 'Server error during base64 upload' });
  }
});

// ✅ Secure document viewer
router.get('/view/:userId/:docIndex', authenticate, async (req, res) => {
  try {
    const { userId, docIndex } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = parseInt(docIndex, 10);
    if (isNaN(index) || index < 0 || index >= user.documents.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = user.documents[index];
    const buffer = Buffer.from(doc.base64, 'base64');

    res.set('Content-Type', doc.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${doc.filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('❌ View document error:', err);
    res.status(500).json({ error: 'Server error retrieving document' });
  }
});

module.exports = router;
