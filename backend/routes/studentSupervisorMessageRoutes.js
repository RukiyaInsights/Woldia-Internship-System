const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getContacts,
    getMessages,
    sendMessage,
    downloadAttachment
} = require("../controllers/studentSupervisorMessageController");

const router = express.Router();

// Keep these uploads private.
const uploadDirectory = path.join(
    __dirname,
    "..",
    "private_uploads",
    "student_supervisor_messages"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        callback(
            null,
            `${Date.now()}-${require("crypto").randomUUID()}${extension}`
        );
    }
});

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
        fileSize: 10 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.has(extension)) {
            return callback(
                new Error(
                    "Unsupported file type. Upload a document, spreadsheet, presentation, text file, or image."
                )
            );
        }

        callback(null, true);
    }
});

router.use(authenticateToken);
router.use(authorizeRoles("student", "supervisor"));

router.get("/contacts", getContacts);

router.get("/", getMessages);

router.post("/", upload.single("attachment"), sendMessage);

router.get("/:id/attachment", downloadAttachment);

module.exports = router;