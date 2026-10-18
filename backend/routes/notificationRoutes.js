const express = require("express");

const {
    getNotifications,
    markNotificationAsRead
} = require("../controllers/notificationController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get notifications for the logged-in user
router.get(
    "/",
    authenticateToken,
    getNotifications
);

// Mark a notification as read
router.patch(
    "/:id/read",
    authenticateToken,
    markNotificationAsRead
);

module.exports = router;