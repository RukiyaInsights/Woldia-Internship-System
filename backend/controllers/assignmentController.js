const pool = require("../config/db");
const { createNotification } = require("./notificationController");
// Assign a supervisor to a student for an internship
const assignSupervisor = async (req, res) => {
    try {
        const {
            student_id,
            internship_id,
            supervisor_id
        } = req.body;

        // Validate required fields
        if (!student_id || !internship_id || !supervisor_id) {
            return res.status(400).json({
                message:
                    "Student ID, internship ID, and supervisor ID are required."
            });
        }

        // Check that the student exists
        const [students] = await pool.query(
            `SELECT
                id,
                student_id,
                user_id
             FROM students
             WHERE id = ?`,
            [student_id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        // Check that the internship exists
        const [internships] = await pool.query(
            `SELECT
                id,
                title,
                company_id,
                approval_status
             FROM internships
             WHERE id = ?`,
            [internship_id]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                message: "Internship not found."
            });
        }

        const internship = internships[0];

        // Only approved internships can receive supervisor assignments
        if (internship.approval_status !== "approved") {
            return res.status(400).json({
                message:
                    "A supervisor can only be assigned to an approved internship."
            });
        }

        // Check that the supervisor exists
        const [supervisors] = await pool.query(
            `SELECT
                id,
                user_id,
                department
             FROM supervisors
             WHERE id = ?`,
            [supervisor_id]
        );

        if (supervisors.length === 0) {
            return res.status(404).json({
                message: "Supervisor not found."
            });
        }

        // Check whether this student already has
        // an assignment for this internship
        const [existingAssignment] = await pool.query(
            `SELECT id
             FROM supervisor_assignments
             WHERE student_id = ?
             AND internship_id = ?`,
            [student_id, internship_id]
        );

        if (existingAssignment.length > 0) {
            return res.status(409).json({
                message:
                    "This student already has a supervisor assigned for this internship."
            });
        }

        // Make sure the student actually has an accepted application
        const [acceptedApplications] = await pool.query(
            `SELECT id
             FROM applications
             WHERE student_id = ?
             AND internship_id = ?
             AND status = 'accepted'`,
            [student_id, internship_id]
        );

        if (acceptedApplications.length === 0) {
            return res.status(400).json({
                message:
                    "A supervisor can only be assigned after the student's application has been accepted."
            });
        }

        // Create the assignment
        const [result] = await pool.query(
            `INSERT INTO supervisor_assignments
             (
                student_id,
                internship_id,
                supervisor_id
             )
             VALUES (?, ?, ?)`,
            [
                student_id,
                internship_id,
                supervisor_id
            ]
        );
// Notify the student
await createNotification(
    students[0].user_id,
    "Supervisor Assigned",
    `A supervisor has been assigned to you for the internship "${internship.title}".`
);

// Notify the supervisor
await createNotification(
    supervisors[0].user_id,
    "New Student Assignment",
    `You have been assigned to supervise a student for the internship "${internship.title}".`
);
        res.status(201).json({
            message: "Supervisor assigned successfully.",
            assignmentId: result.insertId
        });

    } catch (error) {
        console.error(
            "Assign supervisor error:",
            error
        );

        // Handle duplicate assignment caused by
        // the UNIQUE(student_id, internship_id) constraint
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message:
                    "This student already has a supervisor assigned for this internship."
            });
        }

        res.status(500).json({
            message:
                "Server error while assigning supervisor."
        });
    }
};


// Get all supervisor assignments
const getSupervisorAssignments = async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT
                supervisor_assignments.id,

                supervisor_assignments.student_id,
                student_users.full_name AS student_name,
                students.student_id AS university_student_id,

                supervisor_assignments.internship_id,
                internships.title AS internship_title,

                supervisor_assignments.supervisor_id,
                supervisor_users.full_name AS supervisor_name,

                supervisor_assignments.assigned_at

             FROM supervisor_assignments

             INNER JOIN students
                ON supervisor_assignments.student_id = students.id

             INNER JOIN users AS student_users
                ON students.user_id = student_users.id

             INNER JOIN internships
                ON supervisor_assignments.internship_id = internships.id

             INNER JOIN supervisors
                ON supervisor_assignments.supervisor_id = supervisors.id

             INNER JOIN users AS supervisor_users
                ON supervisors.user_id = supervisor_users.id

             ORDER BY supervisor_assignments.assigned_at DESC`
        );

        res.json({
            message:
                "Supervisor assignments retrieved successfully.",
            assignments
        });

    } catch (error) {
        console.error(
            "Get supervisor assignments error:",
            error
        );

        res.status(500).json({
            message:
                "Server error while retrieving supervisor assignments."
        });
    }
};


// ============================================
// GET OPTIONS FOR ADMIN ASSIGNMENT DROPDOWNS
// ============================================

const getAssignmentOptions = async (req, res) => {
    try {
        // Get student profiles and their user information
        const [students] = await pool.query(`
            SELECT
                s.id,
                s.student_id,
                s.department,
                s.year_level,
                u.full_name
            FROM students s
            INNER JOIN users u ON s.user_id = u.id
            WHERE u.role = 'student'
            ORDER BY u.full_name ASC
        `);

        // Get approved internships and their company names.
        // Only open internships are offered for new assignments.
        const [internships] = await pool.query(`
            SELECT
                i.id,
                i.title,
                i.company_id,
                i.status,
                i.approval_status,
                c.company_name
            FROM internships i
            INNER JOIN companies c ON i.company_id = c.id
            WHERE i.approval_status = 'approved'
              AND i.status = 'open'
            ORDER BY i.title ASC
        `);

        // Get supervisor profiles and their user information
        const [supervisors] = await pool.query(`
            SELECT
                s.id,
                s.department,
                s.phone,
                u.full_name
            FROM supervisors s
            INNER JOIN users u ON s.user_id = u.id
            WHERE u.role = 'supervisor'
            ORDER BY u.full_name ASC
        `);

        return res.json({
            students,
            internships,
            supervisors
        });
    } catch (error) {
        console.error("Get assignment options error:", error);

        return res.status(500).json({
            message: "Unable to load assignment options."
        });
    }
};

module.exports = {
    assignSupervisor,
    getSupervisorAssignments,
    getAssignmentOptions
};