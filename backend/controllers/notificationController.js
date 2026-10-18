const pool = require("../config/db");

// Get notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await pool.query(
            `SELECT
                id,
                title,
                message,
                is_read,
                created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            message: "Notifications retrieved successfully.",
            notifications
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            message: "Server error while retrieving notifications."
        });
    }
};


// Mark one notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await pool.query(
            `UPDATE notifications
             SET is_read = 1
             WHERE id = ?
             AND user_id = ?`,
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Notification not found."
            });
        }

        res.json({
            message: "Notification marked as read."
        });

    } catch (error) {
        console.error("Mark notification as read error:", error);

        res.status(500).json({
            message: "Server error while updating notification."
        });
    }
};


// Create a notification for a user
const createNotification = async (userId, title, message) => {
    try {
        await pool.query(
            `INSERT INTO notifications
             (user_id, title, message, is_read)
             VALUES (?, ?, ?, 0)`,
            [userId, title, message]
        );

        return true;

    } catch (error) {
        console.error("Create notification error:", error);
        return false;
    }
};


module.exports = {
    getNotifications,
    markNotificationAsRead,
    createNotification
};