const express = require("express");

const {
    createCompanyProfile,
    getCompanyProfile
} = require("../controllers/companyController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create company profile
router.post(
    "/profile",
    authenticateToken,
    authorizeRoles("company"),
    createCompanyProfile
);

// Get current company's profile
router.get(
    "/profile",
    authenticateToken,
    authorizeRoles("company"),
    getCompanyProfile
);

module.exports = router;