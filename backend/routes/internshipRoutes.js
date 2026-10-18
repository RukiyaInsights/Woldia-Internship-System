const express = require("express");

const {
    getOpenInternships,
    createInternship,
    getCompanyApplications,
    updateApplicationStatus,
    getMessageContacts
} = require("../controllers/internshipController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all open internships
router.get("/open", getOpenInternships);

// Create internship - company only
router.post(
    "/",
    authenticateToken,
    authorizeRoles("company"),
    createInternship
);
// Get applications for the logged-in company
router.get(
    "/company/applications",
    authenticateToken,
    authorizeRoles("company"),
    getCompanyApplications
);
// Accept or reject an application
router.patch(
    "/company/applications/status",
    authenticateToken,
    authorizeRoles("company"),
    updateApplicationStatus
);
// Get authorized company/supervisor messaging contacts
router.get(
    "/message-contacts",
    authenticateToken,
    authorizeRoles("company", "supervisor"),
    getMessageContacts
);
module.exports = router;