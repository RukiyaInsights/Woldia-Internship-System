const express = require("express");
const pool = require("../config/db");
const {
    createStudentProfile,
    getStudentProfile,
    getAvailableInternships,
    applyForInternship,
    getMyApplications,
    submitProgressReport,
    getMyReports,
    downloadProgressReportAttachment
} = require("../controllers/studentController");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload, storePrivatePdf } = require("../middleware/uploadMiddleware");
const router = express.Router();

// Create student profile
router.post(
    "/profile",
    authenticateToken,
    authorizeRoles("student"),
    createStudentProfile
);

// Get current student's profile
router.get(
    "/profile",
    authenticateToken,
    authorizeRoles("student"),
    getStudentProfile
);
// Get available internships for students
router.get(
    "/internships",
    authenticateToken,
    authorizeRoles("student"),
    getAvailableInternships
);
// Apply for an internship
router.post(
    "/internships/apply",
    authenticateToken,
    authorizeRoles("student"),
    applyForInternship
);
router.get(
    "/applications",
    authenticateToken,
    authorizeRoles("student"),
    getMyApplications
);
router.post(
    "/reports",
    authenticateToken,
    authorizeRoles("student"),
    (req, res, next) => {
        upload.single("attachment")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    message:
                        error.message ||
                        "The report attachment could not be uploaded."
                });
            }

            next();
        });
    },
    submitProgressReport
);
router.get(
    "/reports",
    authenticateToken,
    authorizeRoles("student"),
    getMyReports
);
// Download an attachment belonging to the authenticated student's report.
router.get(
    "/reports/:reportId/attachment/download",
    authenticateToken,
    authorizeRoles("student"),
    downloadProgressReportAttachment
);
// Upload a private student document and save its database record
router.post(
    "/documents/upload",
    authenticateToken,
    authorizeRoles("student"),
    (req, res, next) => {
        upload.single("document")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    message: error.message || "Document upload failed."
                });
            }

            next();
        });
    },
    storePrivatePdf,
    async (req, res, next) => {
        let uploadedFilePath = req.uploadedDocument?.filePath;

        try {
            const pool = require("../config/db");
            const userId = req.user.id;
            const { type, internship_id } = req.body;

            if (!internship_id) {
                return res.status(400).json({
                    message: "Please select an internship before uploading."
                });
            }

            const allowedTypes = [
                "cv",
                "application_letter",
                "certificate",
                "other"
            ];

            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    message: "Please select a valid document category."
                });
            }

            // Find the authenticated student's profile.
            const [students] = await pool.query(
                "SELECT id FROM students WHERE user_id = ?",
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    message: "Student profile not found."
                });
            }

            const studentId = students[0].id;

            // Only allow documents for an internship the student
            // has applied to.
            const [applications] = await pool.query(
                `SELECT id
                 FROM applications
                 WHERE student_id = ?
                 AND internship_id = ?`,
                [studentId, internship_id]
            );

            if (applications.length === 0) {
                return res.status(403).json({
                    message: "You can only upload documents for an internship you have applied to."
                });
            }

            // Save the document record.
            const [result] = await pool.query(
                `INSERT INTO documents
                    (student_id, internship_id, document_name,
                     document_type, file_path)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    studentId,
                    internship_id,
                    req.uploadedDocument.originalName,
                    type,
                    req.uploadedDocument.filename
                ]
            );

            res.status(201).json({
                message: "Document uploaded and saved successfully.",
                document: {
                    id: result.insertId,
                    filename: req.uploadedDocument.filename,
                    originalName: req.uploadedDocument.originalName,
                    mimeType: req.uploadedDocument.mimeType,
                    size: req.uploadedDocument.size,
                    type
                }
            });
        } catch (error) {
            // Remove the physical file if saving its database record fails.
            if (uploadedFilePath) {
                try {
                    await require("fs").promises.unlink(uploadedFilePath);
                } catch (cleanupError) {
                    console.error("Uploaded file cleanup error:", cleanupError);
                }
            }

            next(error);
        }
    }
);
// Get the logged-in student's saved documents
router.get(
    "/documents",
    authenticateToken,
    authorizeRoles("student"),
    async (req, res) => {
        try {
            const userId = req.user.id;

            // Find the logged-in student's profile.
            const [students] = await pool.query(
                "SELECT id FROM students WHERE user_id = ?",
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    message: "Student profile not found."
                });
            }

            const studentId = students[0].id;

            // Retrieve only this student's documents.
            const [documents] = await pool.query(
                `SELECT
                    documents.id,
                    documents.document_name,
                    documents.document_type,
                    documents.file_path,
                    documents.uploaded_at,
                    documents.internship_id,
                    internships.title AS internship_title
                 FROM documents
                 INNER JOIN internships
                    ON documents.internship_id = internships.id
                 WHERE documents.student_id = ?
                 ORDER BY documents.uploaded_at DESC`,
                [studentId]
            );

            res.json({
                message: "Documents retrieved successfully.",
                documents: documents.map((document) => ({
                    id: document.id,
                    name: document.document_name,
                    type: document.document_type,
                    filename: document.file_path,
                    internshipId: document.internship_id,
                    internshipTitle: document.internship_title,
                    uploadedAt: document.uploaded_at
                }))
            });
        } catch (error) {
            console.error("Get student documents error:", error);

            res.status(500).json({
                message: "Unable to retrieve documents."
            });
        }
    }
);
module.exports = router;