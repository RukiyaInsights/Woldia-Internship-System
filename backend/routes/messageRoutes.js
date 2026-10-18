const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    sendMessage,
    getMyMessages,
    markMessageAsRead,
    downloadAttachment
} = require("../controllers/messageController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Store company-supervisor attachments in their own folder.
// This keeps them separate from student-supervisor files.
const uploadDirectory = path.join(
    __dirname,
    "../private_uploads/company_supervisor_messages"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

// Configure file uploads.
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `${Date.now()}-${require("crypto").randomUUID()}${extension}`;

        callback(null, uniqueName);
    }
});

// Only allow common document and image formats.
const allowedExtensions = new Set([
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg"
]);

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.has(extension)) {
            return callback(
                new Error(
                    "Unsupported file type. Upload PDF, Word, Excel, PowerPoint, TXT, CSV, or image files."
                )
            );
        }

        callback(null, true);
    }
});

// Send a message, optionally including an attachment or link.
router.post(
    "/",
    authenticateToken,
    authorizeRoles("company", "supervisor"),
    upload.single("attachment"),
    sendMessage
);

// Retrieve messages for the logged-in user.
router.get(
    "/",
    authenticateToken,
    authorizeRoles("company", "supervisor"),
    getMyMessages
);

// Mark a received message as read.
router.patch(
    "/:id/read",
    authenticateToken,
    authorizeRoles("company", "supervisor"),
    markMessageAsRead
);

// Download an attachment after the controller checks authorization.
router.get(
    "/:id/attachment",
    authenticateToken,
    authorizeRoles("company", "supervisor"),
    downloadAttachment
);

// Return a readable upload error instead of crashing the server.
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "The maximum file size is 10 MB."
            });
        }

        return res.status(400).json({
            message: error.message
        });
    }

    if (error) {
        return res.status(400).json({
            message: error.message || "File upload failed."
        });
    }

    next();
});

module.exports = router;