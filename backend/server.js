const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");
const messageRoutes = require("./routes/messageRoutes");
const studentSupervisorMessageRoutes = require("./routes/studentSupervisorMessageRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const app = express();
const PORT = 5000;
// Middleware
app.use(cors());
app.use(express.json());
// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/messages", messageRoutes);
app.use(
    "/api/student-supervisor-messages",
    studentSupervisorMessageRoutes
);
// Test backend route
app.get("/", (req, res) => {
    res.json({
        message: "Woldia Internship System Backend is running!"
    });
});
// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");
        res.json({
            message: "Database connected successfully!",
            result: rows[0].result
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Database connection failed."
        });
    }
});
// Protected test route
app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});