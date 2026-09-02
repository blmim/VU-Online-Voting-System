const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getNotificationsForUser } = require('../services/notificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user);
    res.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

module.exports = router;
