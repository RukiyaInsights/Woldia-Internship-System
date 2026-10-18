const express = require("express");

const {
    getPendingInternships,
    getAdminStats,
    approveInternship,
    rejectInternship
} = require("../controllers/adminController");

const {
    assignSupervisor,
    getSupervisorAssignments,
    getAssignmentOptions
} = require("../controllers/assignmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ============================================
// INTERNSHIP APPROVAL
// ============================================

// Get internships waiting for admin approval
router.get(
    "/internships/pending",
    authenticateToken,
    authorizeRoles("admin"),
    getPendingInternships
);

// Get system statistics
router.get(
    "/stats",
    authenticateToken,
    authorizeRoles("admin"),
    getAdminStats
);

// Approve an internship
router.patch(
    "/internships/:id/approve",
    authenticateToken,
    authorizeRoles("admin"),
    approveInternship
);

// Reject an internship
router.patch(
    "/internships/:id/reject",
    authenticateToken,
    authorizeRoles("admin"),
    rejectInternship
);

// ============================================
// SUPERVISOR ASSIGNMENT OPTIONS
// ============================================

// Get students, approved internships, and supervisors
router.get(
    "/assignment-options",
    authenticateToken,
    authorizeRoles("admin"),
    getAssignmentOptions
);

// ============================================
// SUPERVISOR ASSIGNMENTS
// ============================================

// Assign a supervisor to a student/internship
router.post(
    "/assignments",
    authenticateToken,
    authorizeRoles("admin"),
    assignSupervisor
);

// Get all supervisor assignments
router.get(
    "/assignments",
    authenticateToken,
    authorizeRoles("admin"),
    getSupervisorAssignments
);

module.exports = router;