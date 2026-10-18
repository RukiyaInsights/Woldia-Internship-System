const pool = require("../config/db");

// Get students assigned to the logged-in supervisor
const getAssignedStudents = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the supervisor record belonging to the logged-in user
        const [supervisors] = await pool.query(
            `SELECT id
             FROM supervisors
             WHERE user_id = ?`,
            [userId]
        );

        if (supervisors.length === 0) {
            return res.status(404).json({
                message: "Supervisor profile not found."
            });
        }

        const supervisorId = supervisors[0].id;

        // Get ONLY students assigned to this supervisor
        const [students] = await pool.query(
            `SELECT
                supervisor_assignments.id AS assignment_id,
                students.id AS student_id,
                students.student_id,
                users.full_name,
                users.email,
                students.department,
                students.year_level,
                students.phone,
                internships.id AS internship_id,
                internships.title AS internship_title,
                companies.company_name,
                supervisor_assignments.assigned_at
             FROM supervisor_assignments

             INNER JOIN students
                ON supervisor_assignments.student_id = students.id

             INNER JOIN users
                ON students.user_id = users.id

             INNER JOIN internships
                ON supervisor_assignments.internship_id = internships.id

             INNER JOIN companies
                ON internships.company_id = companies.id

             WHERE supervisor_assignments.supervisor_id = ?

             ORDER BY supervisor_assignments.assigned_at DESC`,
            [supervisorId]
        );

        res.json({
            message: "Assigned students retrieved successfully.",
            students
        });

    } catch (error) {
        console.error("Get assigned students error:", error);

        res.status(500).json({
            message: "Server error while retrieving assigned students."
        });
    }
};


// Get progress reports ONLY from students assigned to the logged-in supervisor
const getAssignedReports = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the supervisor record belonging to the logged-in user.
        const [supervisors] = await pool.query(
            `SELECT id
             FROM supervisors
             WHERE user_id = ?`,
            [userId]
        );

        if (supervisors.length === 0) {
            return res.status(404).json({
                message: "Supervisor profile not found."
            });
        }

        const supervisorId = supervisors[0].id;

        // Retrieve reports only from students assigned to this supervisor.
        const [reports] = await pool.query(
            `SELECT
                progress_reports.id AS report_id,
                progress_reports.week_number,
                progress_reports.title,
                progress_reports.content,
                progress_reports.status,
                progress_reports.submitted_at,

                students.id AS student_id,
                students.student_id,
                users.full_name AS student_name,

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

             INNER JOIN supervisor_assignments
                ON progress_reports.student_id =
                   supervisor_assignments.student_id
                AND progress_reports.internship_id =
                    supervisor_assignments.internship_id

             INNER JOIN students
                ON progress_reports.student_id = students.id

             INNER JOIN users
                ON students.user_id = users.id

             INNER JOIN internships
                ON progress_reports.internship_id = internships.id

             INNER JOIN companies
                ON internships.company_id = companies.id

             LEFT JOIN feedback
                ON progress_reports.id = feedback.report_id

             LEFT JOIN progress_report_attachments AS attachments
                ON progress_reports.id = attachments.report_id

             WHERE supervisor_assignments.supervisor_id = ?

             ORDER BY progress_reports.submitted_at DESC`,
            [supervisorId]
        );

        // Remove private storage filenames before sending data to the frontend.
        const safeReports = reports.map((report) => {
            const {
                attachment_stored_filename,
                ...safeReport
            } = report;

            return {
                ...safeReport,
                has_attachment: Boolean(attachment_stored_filename)
            };
        });

        return res.json({
            message: "Assigned student reports retrieved successfully.",
            reports: safeReports
        });

    } catch (error) {
        console.error(
            "Get assigned reports error:",
            error
        );

        return res.status(500).json({
            message: "Server error while retrieving reports."
        });
    }
};


// Submit feedback for an assigned student's report
const submitFeedback = async (req, res) => {
    try {
        const { report_id, comment } = req.body;
        const userId = req.user.id;

        if (!report_id || !comment) {
            return res.status(400).json({
                message: "Report ID and feedback comment are required."
            });
        }

        // Find the supervisor belonging to the logged-in user
        const [supervisors] = await pool.query(
            `SELECT id
             FROM supervisors
             WHERE user_id = ?`,
            [userId]
        );

        if (supervisors.length === 0) {
            return res.status(404).json({
                message: "Supervisor profile not found."
            });
        }

        const supervisorId = supervisors[0].id;

        // Make sure the report belongs to a student
        // assigned to this supervisor
        const [reports] = await pool.query(
            `SELECT
                progress_reports.id,
                progress_reports.status
             FROM progress_reports

             INNER JOIN supervisor_assignments
                ON progress_reports.student_id =
                   supervisor_assignments.student_id
                AND progress_reports.internship_id =
                    supervisor_assignments.internship_id

             WHERE progress_reports.id = ?
             AND supervisor_assignments.supervisor_id = ?`,
            [report_id, supervisorId]
        );

        if (reports.length === 0) {
            return res.status(403).json({
                message:
                    "You do not have permission to give feedback on this report."
            });
        }

        // Save the feedback
// Check whether this supervisor has already submitted
// feedback for this report
const [existingFeedback] = await pool.query(
    `SELECT id
     FROM feedback
     WHERE report_id = ?
     AND supervisor_id = ?`,
    [
        report_id,
        supervisorId
    ]
);

if (existingFeedback.length > 0) {
    return res.status(409).json({
        message:
            "You have already submitted feedback for this report."
    });
}

// Save the feedback
const [result] = await pool.query(
    `INSERT INTO feedback
     (report_id, supervisor_id, comment)
     VALUES (?, ?, ?)`,
    [
        report_id,
        supervisorId,
        comment.trim()
    ]
);

        // Mark the report as reviewed
        await pool.query(
            `UPDATE progress_reports
             SET status = 'reviewed'
             WHERE id = ?`,
            [report_id]
        );

        res.status(201).json({
            message: "Feedback submitted successfully.",
            feedbackId: result.insertId
        });

    } catch (error) {
        console.error(
            "Submit feedback error:",
            error
        );

        res.status(500).json({
            message: "Server error while submitting feedback."
        });
    }
};


module.exports = {
    getAssignedStudents,
    getAssignedReports,
    submitFeedback
};