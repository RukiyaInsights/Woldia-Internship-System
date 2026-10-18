const express = require("express");

const {
    getAssignedStudents,
     getAssignedReports,
    submitFeedback

} = require("../controllers/supervisorController");
const {
    downloadProgressReportAttachment
} = require("../controllers/studentController");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Get only the students assigned to the logged-in supervisor
router.get(
    "/students",
    authenticateToken,
    authorizeRoles("supervisor"),
    getAssignedStudents
);
router.get(
    "/reports",
    authenticateToken,
    authorizeRoles("supervisor"),
    getAssignedReports
);
// Download an attachment only if the report belongs to a student
// assigned to the authenticated supervisor.
router.get(
    "/reports/:reportId/attachment/download",
    authenticateToken,
    authorizeRoles("supervisor"),
    downloadProgressReportAttachment
);
router.post(
    "/feedback",
    authenticateToken,
    authorizeRoles("supervisor"),
    submitFeedback
);
module.exports = router;