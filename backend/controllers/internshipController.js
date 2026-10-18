const pool = require("../config/db");
const { createNotification } = require("./notificationController");
// Get all open internships
const getOpenInternships = async (req, res) => {
    try {
        const [internships] = await pool.query(
            `SELECT 
                internships.id,
                internships.title,
                internships.description,
                internships.requirements,
                internships.location,
                internships.start_date,
                internships.end_date,
                internships.application_deadline,
                companies.company_name
             FROM internships
             INNER JOIN companies
                ON internships.company_id = companies.id
             WHERE internships.status = 'open'
          AND internships.approval_status = 'approved'
           ORDER BY internships.created_at DESC`
        );

        res.json({
            message: "Open internships retrieved successfully.",
            internships
        });

    } catch (error) {
        console.error("Get internships error:", error);

        res.status(500).json({
            message: "Server error while retrieving internships."
        });
    }
};

// Create a new internship with validated dates
const createInternship = async (req, res) => {
    try {
        const {
            title,
            description,
            requirements,
            positions,
            location,
            start_date,
            end_date,
            application_deadline
        } = req.body;

        // The authenticated company's user ID comes from the JWT
        const userId = req.user.id;

        // Check required fields
        if (
            !title ||
            !title.trim() ||
            !description ||
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Internship title and description are required."
            });
        }

        // Validate positions
        const internshipPositions = Number(positions);

        if (
            positions === undefined ||
            positions === null ||
            positions === "" ||
            !Number.isInteger(internshipPositions) ||
            internshipPositions < 1
        ) {
            return res.status(400).json({
                message: "Positions must be a whole number greater than 0."
            });
        }

        // Validate date format strictly as YYYY-MM-DD
        const isValidDate = (value) => {
            if (
                typeof value !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                return false;
            }

            const [year, month, day] = value.split("-").map(Number);

            const date = new Date(
                Date.UTC(year, month - 1, day)
            );

            return (
                date.getUTCFullYear() === year &&
                date.getUTCMonth() === month - 1 &&
                date.getUTCDate() === day
            );
        };

        // Get today's date using the server's local calendar date
        const now = new Date();

        const today =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, "0")}-` +
            `${String(now.getDate()).padStart(2, "0")}`;

        // Calculate the earliest allowed deadline: today + 14 days
        const earliestDeadlineDate = new Date(
            `${today}T00:00:00Z`
        );

        earliestDeadlineDate.setUTCDate(
            earliestDeadlineDate.getUTCDate() + 14
        );

        const earliestDeadline =
            `${earliestDeadlineDate.getUTCFullYear()}-` +
            `${String(
                earliestDeadlineDate.getUTCMonth() + 1
            ).padStart(2, "0")}-` +
            `${String(
                earliestDeadlineDate.getUTCDate()
            ).padStart(2, "0")}`;

        // All three dates are required
        if (!application_deadline || !start_date || !end_date) {
            return res.status(400).json({
                message:
                    "Application deadline, internship start date, and internship end date are required."
            });
        }

        // Reject malformed or impossible dates
        if (
            !isValidDate(application_deadline) ||
            !isValidDate(start_date) ||
            !isValidDate(end_date)
        ) {
            return res.status(400).json({
                message: "Please provide valid dates."
            });
        }

        // Application deadline must be at least 14 days from creation
        if (application_deadline < earliestDeadline) {
            return res.status(400).json({
                message:
                    `The application deadline must be at least 14 days after today (${earliestDeadline} or later).`
            });
        }

        // Start date must be after the application deadline
        if (start_date <= application_deadline) {
            return res.status(400).json({
                message:
                    "The internship start date must be after the application deadline."
            });
        }

        // End date must be after the start date
        if (end_date <= start_date) {
            return res.status(400).json({
                message:
                    "The internship end date must be after the start date."
            });
        }

        // Find the company belonging to the logged-in user
        const [companies] = await pool.query(
            "SELECT id FROM companies WHERE user_id = ?",
            [userId]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                message: "Company profile not found."
            });
        }

        const companyId = companies[0].id;

        // Save the internship; university approval remains pending
        const [result] = await pool.query(
            `INSERT INTO internships
             (
                company_id,
                title,
                description,
                requirements,
                positions,
                location,
                start_date,
                end_date,
                application_deadline,
                approval_status
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                companyId,
                title.trim(),
                description.trim(),
                requirements || null,
                internshipPositions,
                location || null,
                start_date,
                end_date,
                application_deadline
            ]
        );

        return res.status(201).json({
            message:
                "Internship created successfully and is waiting for university approval.",
            internshipId: result.insertId
        });

    } catch (error) {
        console.error("Create internship error:", error);

        return res.status(500).json({
            message: "Server error while creating internship."
        });
    }
};
const getCompanyApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the company belonging to the logged-in user
        const [companies] = await pool.query(
            "SELECT id FROM companies WHERE user_id = ?",
            [userId]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                message: "Company profile not found."
            });
        }

        const companyId = companies[0].id;

        // Get applications for this company's internships only
        const [applications] = await pool.query(
            `SELECT
                applications.id,
                applications.status,
                applications.applied_at,
                internships.id AS internship_id,
                internships.title AS internship_title,
                users.full_name AS student_name,
                users.email AS student_email,
                students.student_id,
                students.department,
                students.year_level,
                students.phone
             FROM applications
             INNER JOIN internships
                ON applications.internship_id = internships.id
             INNER JOIN students
                ON applications.student_id = students.id
             INNER JOIN users
                ON students.user_id = users.id
             WHERE internships.company_id = ?
             ORDER BY applications.applied_at DESC`,
            [companyId]
        );

        res.json({
            message: "Company applications retrieved successfully.",
            applications
        });

    } catch (error) {
        console.error("Get company applications error:", error);

        res.status(500).json({
            message: "Server error while retrieving applications."
        });
    }
};
const updateApplicationStatus = async (req, res) => {
    try {
        const {
            application_id,
            status,
            decision_reason,
            decision_comment
        } = req.body;

        const userId = req.user.id;

        // Validate required fields
        if (!application_id || !status) {
            return res.status(400).json({
                message: "Application ID and status are required."
            });
        }

        // Only accepted or rejected are allowed
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be either accepted or rejected."
            });
        }

        // A reason is required when rejecting an application
        if (
            status === "rejected" &&
            (!decision_reason || !decision_reason.trim())
        ) {
            return res.status(400).json({
                message: "A rejection reason is required."
            });
        }

        // Find the company belonging to the logged-in user
        const [companies] = await pool.query(
            "SELECT id FROM companies WHERE user_id = ?",
            [userId]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                message: "Company profile not found."
            });
        }

        const companyId = companies[0].id;

        // Get the application and verify that it belongs
        // to this company's internship
        const [applications] = await pool.query(
            `SELECT
                applications.id,
                applications.student_id,
                applications.status,
                internships.id AS internship_id,
                internships.title AS internship_title,
                internships.approval_status
             FROM applications
             INNER JOIN internships
                ON applications.internship_id = internships.id
             WHERE applications.id = ?
             AND internships.company_id = ?`,
            [application_id, companyId]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                message: "Application not found for this company."
            });
        }

        const application = applications[0];

        // Application must still be pending
        if (application.status !== "pending") {
            return res.status(400).json({
                message:
                    `This application has already been ${application.status}.`
            });
        }

        // A company can only make a decision for an approved internship
        if (application.approval_status !== "approved") {
            return res.status(400).json({
                message:
                    "Applications can only be decided for approved internships."
            });
        }

        // If the company is accepting the student,
        // check whether the student already has another accepted internship
        if (status === "accepted") {

            const [existingPlacements] = await pool.query(
                `SELECT
                    applications.id,
                    applications.internship_id,
                    internships.title,
                    companies.company_name
                 FROM applications
                 INNER JOIN internships
                    ON applications.internship_id = internships.id
                 INNER JOIN companies
                    ON internships.company_id = companies.id
                 WHERE applications.student_id = ?
                 AND applications.status = 'accepted'
                 AND applications.id != ?`,
                [application.student_id, application_id]
            );

            if (existingPlacements.length > 0) {
                return res.status(400).json({
                    message:
                        "This student already has an accepted internship and cannot be accepted for another placement."
                });
            }

            // Check whether the internship still has available positions
            const [[positionInfo]] = await pool.query(
                `SELECT
                    internships.positions,
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
                 GROUP BY internships.id, internships.positions`,
                [application.internship_id]
            );

            if (!positionInfo) {
                return res.status(404).json({
                    message: "Internship information not found."
                });
            }

            if (
                Number(positionInfo.accepted_count) >=
                Number(positionInfo.positions)
            ) {
                return res.status(400).json({
                    message:
                        "This internship has no available positions remaining."
                });
            }
        }

        // Save the decision
        await pool.query(
            `UPDATE applications
             SET
                status = ?,
                decision_reason = ?,
                decision_comment = ?,
                decided_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                status,
                decision_reason || null,
                decision_comment || null,
                application_id
            ]
        );
// Notify the student about the application decision
const [studentUsers] = await pool.query(
    `SELECT students.user_id
     FROM students
     INNER JOIN applications
        ON applications.student_id = students.id
     WHERE applications.id = ?`,
    [application_id]
);

if (studentUsers.length > 0) {
    const studentUserId = studentUsers[0].user_id;

    const notificationTitle =
        status === "accepted"
            ? "Internship Application Accepted"
            : "Internship Application Rejected";

    const notificationMessage =
        status === "accepted"
            ? "Your internship application has been accepted."
            : `Your internship application has been rejected. Reason: ${decision_reason}`;

    await createNotification(
        studentUserId,
        notificationTitle,
        notificationMessage
    );
}
        res.json({
            message:
                status === "accepted"
                    ? "Application accepted successfully."
                    : "Application rejected successfully.",
            decision: {
                status,
                reason: decision_reason || null,
                comment: decision_comment || null
            }
        });

    } catch (error) {
        console.error(
            "Update application status error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while updating application status."
        });
    }
};
// Get authorized contacts for private internship messaging
const getMessageContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === "company") {
            const [contacts] = await pool.query(
                `SELECT DISTINCT
                    internships.id AS internship_id,
                    internships.title AS internship_title,
                    supervisors.id AS supervisor_id,
                    supervisors.user_id AS supervisor_user_id,
                    users.full_name AS supervisor_name,
                    users.email AS supervisor_email
                 FROM internships
                 INNER JOIN companies
                    ON internships.company_id = companies.id
                 INNER JOIN supervisor_assignments
                    ON internships.id = supervisor_assignments.internship_id
                 INNER JOIN supervisors
                    ON supervisor_assignments.supervisor_id = supervisors.id
                 INNER JOIN users
                    ON supervisors.user_id = users.id
                 WHERE companies.user_id = ?
                 ORDER BY internships.id DESC`,
                [userId]
            );

            return res.json({
                message: "Message contacts retrieved successfully.",
                contacts
            });
        }

        if (role === "supervisor") {
            const [contacts] = await pool.query(
                `SELECT DISTINCT
                    internships.id AS internship_id,
                    internships.title AS internship_title,
                    companies.id AS company_id,
                    companies.user_id AS company_user_id,
                    companies.company_name,
                    users.full_name AS company_contact_name,
                    users.email AS company_email
                 FROM supervisor_assignments
                 INNER JOIN internships
                    ON supervisor_assignments.internship_id = internships.id
                 INNER JOIN companies
                    ON internships.company_id = companies.id
                 INNER JOIN users
                    ON companies.user_id = users.id
                 INNER JOIN supervisors
                    ON supervisor_assignments.supervisor_id = supervisors.id
                 WHERE supervisors.user_id = ?
                 ORDER BY internships.id DESC`,
                [userId]
            );

            return res.json({
                message: "Message contacts retrieved successfully.",
                contacts
            });
        }

        return res.status(403).json({
            message:
                "Only companies and supervisors can access message contacts."
        });

    } catch (error) {
        console.error(
            "Get message contacts error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while retrieving message contacts."
        });
    }
};
module.exports = {
    getOpenInternships,
    createInternship,
    getCompanyApplications,
    updateApplicationStatus,
     getMessageContacts
};