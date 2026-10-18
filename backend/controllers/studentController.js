const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// Create a student profile only for an authorized student
const createStudentProfile = async (req, res) => {
    let connection;

    try {
        const userId = req.user.id;
        const { student_id, phone } = req.body;

        if (!student_id || typeof student_id !== "string") {
            return res.status(400).json({
                message: "Please provide your authorized student ID."
            });
        }

        const normalizedStudentId = student_id.trim().toUpperCase();

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get the authenticated user's account.
        const [users] = await connection.query(
            `SELECT id, full_name, role
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0 || users[0].role !== "student") {
            await connection.rollback();

            return res.status(403).json({
                message: "Only authenticated student accounts can create student profiles."
            });
        }

        const user = users[0];

        // Find the student ID in the authorization list.
        LockAuthorizedStudent: {
            const [authorizedStudents] = await connection.query(
                `SELECT
                    id,
                    full_name,
                    student_id,
                    department,
                    year_level,
                    claimed_by_user_id
                 FROM authorized_students
                 WHERE student_id = ?
                 FOR UPDATE`,
                [normalizedStudentId]
            );

            if (authorizedStudents.length === 0) {
                await connection.rollback();

                return res.status(403).json({
                    message: "This student ID is not on the authorized student list."
                });
            }

            const authorizedStudent = authorizedStudents[0];

            // The registered account name must match the authorized name.
            const normalizeName = (name) =>
                name.trim().replace(/\s+/g, " ").toLowerCase();

            if (
                normalizeName(user.full_name) !==
                normalizeName(authorizedStudent.full_name)
            ) {
                await connection.rollback();

                return res.status(403).json({
                    message: "Your account name does not match the authorized student record."
                });
            }

            // A student ID can only be claimed by one account.
            if (
                authorizedStudent.claimed_by_user_id !== null &&
                Number(authorizedStudent.claimed_by_user_id) !== Number(userId)
            ) {
                await connection.rollback();

                return res.status(409).json({
                    message: "This student ID has already been claimed by another account."
                });
            }

            // Prevent an account from creating multiple student profiles.
            const [existingProfiles] = await connection.query(
                `SELECT id
                 FROM students
                 WHERE user_id = ?
                 LIMIT 1`,
                [userId]
            );

            if (existingProfiles.length > 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "Your student profile already exists."
                });
            }

            // Prevent reuse of a student ID already assigned to a profile.
            const [existingStudentIds] = await connection.query(
                `SELECT id
                 FROM students
                 WHERE student_id = ?
                 LIMIT 1`,
                [normalizedStudentId]
            );

            if (existingStudentIds.length > 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "This student ID is already assigned to a student profile."
                });
            }

            // Create the profile using the authorized department and year.
            await connection.query(
                `INSERT INTO students
                    (user_id, student_id, department, year_level, phone)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    userId,
                    authorizedStudent.student_id,
                    authorizedStudent.department,
                    authorizedStudent.year_level,
                    phone ? String(phone).trim() : null
                ]
            );

            // Mark this authorized student ID as claimed.
            await connection.query(
                `UPDATE authorized_students
                 SET claimed_by_user_id = ?
                 WHERE id = ?`,
                [userId, authorizedStudent.id]
            );

            await connection.commit();

            return res.status(201).json({
                message: "Authorized student profile created successfully.",
                student: {
                    student_id: authorizedStudent.student_id,
                    full_name: authorizedStudent.full_name,
                    department: authorizedStudent.department,
                    year_level: authorizedStudent.year_level
                }
            });
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Create student profile error:", error);

        return res.status(500).json({
            message: "Unable to create the student profile."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
// Get current student's profile
const getStudentProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [students] = await pool.query(
            `SELECT
                students.id,
                students.student_id,
                students.department,
                students.year_level,
                students.phone,
                users.full_name,
                users.email
             FROM students
             INNER JOIN users
                ON students.user_id = users.id
             WHERE students.user_id = ?`,
            [userId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        res.json({
            message: "Student profile retrieved successfully.",
            student: students[0]
        });

    } catch (error) {
        console.error("Get student profile error:", error);

        res.status(500).json({
            message: "Server error while retrieving student profile."
        });
    }
};


// Get internships available to students
const getAvailableInternships = async (req, res) => {
    try {
        const [internships] = await pool.query(
            `SELECT
                internships.id,
                internships.title,
                internships.description,
                internships.requirements,
                internships.positions,
                internships.location,
                internships.start_date,
                internships.end_date,
                companies.company_name
             FROM internships
             INNER JOIN companies
                ON internships.company_id = companies.id
             WHERE internships.status = 'open'
             AND internships.approval_status = 'approved'
             ORDER BY internships.created_at DESC`
        );

        res.json({
            message: "Available internships retrieved successfully.",
            internships
        });

    } catch (error) {
        console.error("Get available internships error:", error);

        res.status(500).json({
            message: "Server error while retrieving available internships."
        });
    }
};


// Apply for an internship
const applyForInternship = async (req, res) => {
    try {
        const { internship_id } = req.body;

        // The authenticated user's ID comes from the JWT
        const userId = req.user.id;

        // Check internship ID
        if (!internship_id) {
            return res.status(400).json({
                message: "Internship ID is required."
            });
        }

        // Find the student profile belonging to the logged-in user
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

        // Check that the internship exists,
        // is open, and has been approved by the university
        const [internships] = await pool.query(
            `SELECT
                id,
                positions
             FROM internships
             WHERE id = ?
             AND status = 'open'
             AND approval_status = 'approved'`,
            [internship_id]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                message:
                    "Internship not found, is not approved, or is no longer open."
            });
        }

        const internship = internships[0];

        // Check whether the student already applied
        const [existingApplication] = await pool.query(
            `SELECT id
             FROM applications
             WHERE internship_id = ? AND student_id = ?`,
            [internship_id, studentId]
        );

        if (existingApplication.length > 0) {
            return res.status(409).json({
                message: "You have already applied for this internship."
            });
        }

        // Check whether the internship still has available positions
        const [[positionInfo]] = await pool.query(
            `SELECT
                COUNT(
                    CASE
                        WHEN applications.status = 'accepted'
                        THEN applications.id
                    END
                ) AS accepted_count
             FROM internships
             LEFT JOIN applications
                ON internships.id = applications.internship_id
             WHERE internships.id = ?
             GROUP BY internships.id`,
            [internship_id]
        );

        if (
            positionInfo &&
            Number(positionInfo.accepted_count) >=
                Number(internship.positions)
        ) {
            return res.status(400).json({
                message: "This internship has no available positions remaining."
            });
        }

        // Create application
        const [result] = await pool.query(
            `INSERT INTO applications
             (internship_id, student_id, status)
             VALUES (?, ?, 'pending')`,
            [internship_id, studentId]
        );

        res.status(201).json({
            message: "Application submitted successfully.",
            applicationId: result.insertId
        });

    } catch (error) {
        console.error("Apply for internship error:", error);

        res.status(500).json({
            message: "Server error while submitting application."
        });
    }
};


// Get current student's applications
const getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;

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

        const [applications] = await pool.query(
            `SELECT
                applications.id,
                applications.status,
                applications.applied_at,
                internships.id AS internship_id,
                internships.title AS internship_title,
                internships.description,
                internships.location,
                internships.start_date,
                internships.end_date,
                companies.company_name
             FROM applications
             INNER JOIN internships
                ON applications.internship_id = internships.id
             INNER JOIN companies
                ON internships.company_id = companies.id
             WHERE applications.student_id = ?
             ORDER BY applications.applied_at DESC`,
            [studentId]
        );

        res.json({
            message: "Student applications retrieved successfully.",
            applications
        });

    } catch (error) {
        console.error("Get student applications error:", error);

        res.status(500).json({
            message: "Server error while retrieving applications."
        });
    }
};

const submitProgressReport = async (req, res) => {
    let connection;
    let uploadedFilePath = null;
    let transactionStarted = false;

    try {
        const {
            internship_id,
            week_number,
            title,
            content,
            shared_link
        } = req.body;

        const userId = req.user.id;

        // Validate required report fields.
        if (
            !internship_id ||
            !week_number ||
            !title ||
            !content
        ) {
            return res.status(400).json({
                message:
                    "Internship ID, week number, title, and content are required."
            });
        }

        const internshipId = Number(internship_id);
        const week = Number(week_number);
        const reportTitle = String(title).trim();
        const reportContent = String(content).trim();

        if (
            !Number.isInteger(internshipId) ||
            internshipId < 1
        ) {
            return res.status(400).json({
                message: "Please select a valid internship."
            });
        }

        if (!Number.isInteger(week) || week < 1) {
            return res.status(400).json({
                message: "Week number must be a positive integer."
            });
        }

        if (!reportTitle || reportTitle.length > 150) {
            return res.status(400).json({
                message:
                    "The report title is required and must not exceed 150 characters."
            });
        }

        if (!reportContent) {
            return res.status(400).json({
                message: "Please enter your weekly report."
            });
        }

        // Validate the optional link.
        let validatedLink = null;

        if (
            shared_link !== undefined &&
            shared_link !== null &&
            String(shared_link).trim() !== ""
        ) {
            const link = String(shared_link).trim();

            if (link.length > 2048) {
                return res.status(400).json({
                    message: "The shared link is too long."
                });
            }

            try {
                const parsedUrl = new URL(link);

                if (
                    parsedUrl.protocol !== "https:" &&
                    parsedUrl.protocol !== "http:"
                ) {
                    return res.status(400).json({
                        message:
                            "The shared link must use HTTP or HTTPS."
                    });
                }

                validatedLink = parsedUrl.href;
            } catch {
                return res.status(400).json({
                    message:
                        "Please enter a valid web link, including https:// or http://."
                });
            }
        }

        // A file can be submitted with a link or without one.
        const file = req.file || null;

        // Keep uploaded files private.
        const uploadDirectory = path.join(
            __dirname,
            "..",
            "private_uploads"
        );

        // Validate the PDF signature before storing a PDF.
        if (file) {
            const extension = path.extname(
                file.originalname
            ).toLowerCase();

            if (extension === ".pdf") {
                const signature = file.buffer
                    .subarray(0, 5)
                    .toString("ascii");

                if (signature !== "%PDF-") {
                    return res.status(400).json({
                        message:
                            "The uploaded PDF file is invalid."
                    });
                }
            }
        }

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Find the authenticated student's profile.
        const [students] = await connection.query(
            `SELECT id
             FROM students
             WHERE user_id = ?`,
            [userId]
        );

        if (students.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        const studentId = students[0].id;

        // Confirm that the student has been accepted.
        const [applications] = await connection.query(
            `SELECT id
             FROM applications
             WHERE student_id = ?
               AND internship_id = ?
               AND status = 'accepted'`,
            [studentId, internshipId]
        );

        if (applications.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(403).json({
                message:
                    "You can only submit reports for an internship you have been accepted into."
            });
        }

        // Prevent duplicate reports for the same week.
        const [existingReports] = await connection.query(
            `SELECT id
             FROM progress_reports
             WHERE student_id = ?
               AND internship_id = ?
               AND week_number = ?`,
            [studentId, internshipId, week]
        );

        if (existingReports.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                message:
                    "You have already submitted a report for this week."
            });
        }

        // Create the report.
        const [reportResult] = await connection.query(
            `INSERT INTO progress_reports
                (
                    student_id,
                    internship_id,
                    week_number,
                    title,
                    content,
                    status
                )
             VALUES (?, ?, ?, ?, ?, 'submitted')`,
            [
                studentId,
                internshipId,
                week,
                reportTitle,
                reportContent
            ]
        );

        const reportId = reportResult.insertId;

        // Store the attachment and link, if provided.
        if (file || validatedLink) {
            let storedFilename = null;
            let originalName = null;
            let mimeType = null;
            let fileSize = null;

            if (file) {
                const extension = path.extname(
                    file.originalname
                ).toLowerCase();

                storedFilename =
                    `${crypto.randomUUID()}${extension}`;

                originalName = path.basename(
                    file.originalname
                ).slice(0, 255);

                mimeType = file.mimetype;
                fileSize = file.size;

                await fs.promises.mkdir(
                    uploadDirectory,
                    { recursive: true }
                );

                uploadedFilePath = path.join(
                    uploadDirectory,
                    storedFilename
                );

                await fs.promises.writeFile(
                    uploadedFilePath,
                    file.buffer,
                    {
                        flag: "wx",
                        mode: 0o600
                    }
                );
            }

            await connection.query(
                `INSERT INTO progress_report_attachments
                    (
                        report_id,
                        original_name,
                        stored_filename,
                        mime_type,
                        file_size,
                        shared_link
                    )
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    reportId,
                    originalName,
                    storedFilename,
                    mimeType,
                    fileSize,
                    validatedLink
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message:
                "Progress report submitted successfully.",
            reportId
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Report transaction rollback error:",
                    rollbackError
                );
            }
        }

        // Remove the newly uploaded file if submission fails.
        if (uploadedFilePath) {
            try {
                await fs.promises.unlink(uploadedFilePath);
            } catch (fileError) {
                if (fileError.code !== "ENOENT") {
                    console.error(
                        "Uploaded file cleanup error:",
                        fileError
                    );
                }
            }
        }

        console.error(
            "Submit progress report error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while submitting the progress report."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
const getMyReports = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the authenticated student's profile.
        const [students] = await pool.query(
            `SELECT id
             FROM students
             WHERE user_id = ?`,
            [userId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        const studentId = students[0].id;

        // Retrieve the student's reports, feedback, and attachment details.
        const [reports] = await pool.query(
            `SELECT
                progress_reports.id AS report_id,
                progress_reports.week_number,
                progress_reports.title,
                progress_reports.content,
                progress_reports.status,
                progress_reports.submitted_at,

                internships.id AS internship_id,
                internships.title AS internship_title,
                companies.company_name,

                feedback.id AS feedback_id,
                feedback.comment AS feedback_comment,
                feedback.created_at AS feedback_created_at,

                attachments.original_name AS attachment_name,
                attachments.stored_filename AS attachment_stored_filename,
                attachments.shared_link AS shared_link

             FROM progress_reports

             INNER JOIN internships
                ON progress_reports.internship_id = internships.id

             INNER JOIN companies
                ON internships.company_id = companies.id

             LEFT JOIN feedback
                ON progress_reports.id = feedback.report_id

             LEFT JOIN progress_report_attachments AS attachments
                ON progress_reports.id = attachments.report_id

             WHERE progress_reports.student_id = ?

             ORDER BY
                progress_reports.week_number ASC,
                progress_reports.submitted_at ASC,
                feedback.created_at ASC`,
            [studentId]
        );

        // Group feedback under its report so existing functionality is preserved.
        const groupedReports = [];

        reports.forEach((report) => {
            let existingReport = groupedReports.find(
                (item) => item.report_id === report.report_id
            );

            if (!existingReport) {
                existingReport = {
                    report_id: report.report_id,
                    week_number: report.week_number,
                    title: report.title,
                    content: report.content,
                    status: report.status,
                    submitted_at: report.submitted_at,
                    internship_id: report.internship_id,
                    internship_title: report.internship_title,
                    company_name: report.company_name,

                    // Attachment information visible to the report owner.
                    attachment_name: report.attachment_name,
                    has_attachment: Boolean(
                        report.attachment_stored_filename
                    ),
                    shared_link: report.shared_link,

                    // Never expose the private stored filename.
                    feedback: []
                };

                groupedReports.push(existingReport);
            }

            if (report.feedback_id) {
                existingReport.feedback.push({
                    feedback_id: report.feedback_id,
                    comment: report.feedback_comment,
                    created_at: report.feedback_created_at
                });
            }
        });

        return res.json({
            message: "Student reports retrieved successfully.",
            reports: groupedReports
        });

    } catch (error) {
        console.error(
            "Get student reports error:",
            error
        );

        return res.status(500).json({
            message: "Server error while retrieving student reports."
        });
    }
};
// ============================================
// SECURE PROGRESS REPORT ATTACHMENT DOWNLOAD
// ============================================

const downloadProgressReportAttachment = async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!Number.isInteger(reportId) || reportId < 1) {
            return res.status(400).json({
                message: "Invalid progress report ID."
            });
        }

        // Only students and supervisors may download report attachments.
        if (userRole !== "student" && userRole !== "supervisor") {
            return res.status(403).json({
                message: "You are not authorized to download this attachment."
            });
        }

        let attachmentRows;

        if (userRole === "student") {
            // Students may download attachments belonging to their own reports.
            [attachmentRows] = await pool.query(
                `SELECT
                    attachments.stored_filename,
                    attachments.original_name
                 FROM progress_report_attachments AS attachments
                 INNER JOIN progress_reports AS reports
                    ON reports.id = attachments.report_id
                 INNER JOIN students
                    ON students.id = reports.student_id
                 WHERE reports.id = ?
                   AND students.user_id = ?
                 LIMIT 1`,
                [reportId, userId]
            );
        } else {
            // Supervisors may download attachments only for assigned students
            // and the corresponding internship.
            [attachmentRows] = await pool.query(
                `SELECT
                    attachments.stored_filename,
                    attachments.original_name
                 FROM progress_report_attachments AS attachments
                 INNER JOIN progress_reports AS reports
                    ON reports.id = attachments.report_id
                 INNER JOIN supervisor_assignments AS assignments
                    ON assignments.student_id = reports.student_id
                   AND assignments.internship_id = reports.internship_id
                 INNER JOIN supervisors
                    ON supervisors.id = assignments.supervisor_id
                 WHERE reports.id = ?
                   AND supervisors.user_id = ?
                 LIMIT 1`,
                [reportId, userId]
            );
        }

        if (attachmentRows.length === 0) {
            // Do not disclose whether another user's report or attachment exists.
            return res.status(404).json({
                message: "Attachment not found or you do not have permission to access it."
            });
        }

        const attachment = attachmentRows[0];

        if (!attachment.stored_filename) {
            return res.status(404).json({
                message: "No downloadable file is attached to this report."
            });
        }

        // Prevent directory traversal and access outside private_uploads.
        const storedFilename = attachment.stored_filename;

        if (
            path.basename(storedFilename) !== storedFilename ||
            storedFilename.includes("/") ||
            storedFilename.includes("\\")
        ) {
            console.error("Invalid stored attachment filename.");

            return res.status(500).json({
                message: "The attachment could not be accessed."
            });
        }

        const uploadDirectory = path.join(
            __dirname,
            "..",
            "private_uploads"
        );

        const filePath = path.join(
            uploadDirectory,
            storedFilename
        );

        // Force a download instead of displaying the uploaded file inline.
        return res.download(
            filePath,
            path.basename(attachment.original_name || "report-attachment"),
            (error) => {
                if (error) {
                    if (res.headersSent) {
                        console.error("Attachment download error:", error);
                        return;
                    }

                    if (error.code === "ENOENT") {
                        return res.status(404).json({
                            message: "The attachment file could not be found on the server."
                        });
                    }

                    console.error("Attachment download error:", error);

                    return res.status(500).json({
                        message: "The attachment could not be downloaded."
                    });
                }
            }
        );

    } catch (error) {
        console.error(
            "Download progress report attachment error:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                message: "Server error while downloading the attachment."
            });
        }
    }
};
module.exports = {
    createStudentProfile,
    getStudentProfile,
    getAvailableInternships,
    applyForInternship,
    getMyApplications,
    submitProgressReport,
    getMyReports,
    downloadProgressReportAttachment
};