const pool = require("../config/db");

// Check whether the authenticated user has an allowed role
const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    message: "Authentication required."
                });
            }

            // Get the user's current role from the database
            const [users] = await pool.query(
                "SELECT id, role FROM users WHERE id = ?",
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    message: "User account not found."
                });
            }

            const currentRole = users[0].role;

            // Reject access if the database role is not permitted
            if (!allowedRoles.includes(currentRole)) {
                return res.status(403).json({
                    message: "Access denied. You do not have permission to perform this action."
                });
            }

            // Use the current database role for downstream controllers
            req.user.role = currentRole;

            next();
        } catch (error) {
            console.error("Role authorization error:", error);

            return res.status(500).json({
                message: "Unable to verify user permissions."
            });
        }
    };
};

module.exports = authorizeRoles;