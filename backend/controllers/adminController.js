const pool = require("../config/db");

// Get internships waiting for admin approval
const getPendingInternships = async (req, res) => {
    try {
        const [internships] = await pool.query(`
            SELECT
                internships.id,
                internships.title,
                internships.description,
                internships.requirements,
                internships.location,
                internships.start_date,
                internships.end_date,
                internships.status,
                internships.approval_status,
                internships.approval_reason,
                internships.approval_decided_at,
                internships.created_at,
                companies.company_name
            FROM internships
            JOIN companies
                ON internships.company_id = companies.id
            WHERE internships.approval_status = 'pending'
            ORDER BY internships.created_at DESC
        `);

        res.json({
            message: "Pending internships retrieved successfully.",
            internships
        });

    } catch (error) {
        console.error("Get pending internships error:", error);

        res.status(500).json({
            message: "Failed to retrieve pending internships."
        });
    }
};


// Get system statistics
const getAdminStats = async (req, res) => {
    try {
        const [[students]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM students
        `);

        const [[companies]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM companies
        `);

        const [[supervisors]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM supervisors
        `);

        const [[internships]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM internships
        `);

        const [[pendingInternships]] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM internships
            WHERE approval_status = 'pending'
        `);

        res.json({
            message: "Admin statistics retrieved successfully.",
            stats: {
                students: students.total,
                companies: companies.total,
                supervisors: supervisors.total,
                internships: internships.total,
                pendingInternships: pendingInternships.total
            }
        });

    } catch (error) {
        console.error("Get admin statistics error:", error);

        res.status(500).json({
            message: "Failed to retrieve admin statistics."
        });
    }
};


// Approve an internship
const approveInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;

        const [internships] = await pool.query(
            `
            SELECT id, title, approval_status
            FROM internships
            WHERE id = ?
            `,
            [internshipId]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                message: "Internship not found."
            });
        }

        const internship = internships[0];

        if (internship.approval_status !== "pending") {
            return res.status(400).json({
                message: `This internship has already been ${internship.approval_status}.`
            });
        }

        await pool.query(
            `
            UPDATE internships
            SET
                approval_status = 'approved',
                approval_reason = 'Approved by university administration.',
                approval_decided_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [internshipId]
        );

        res.json({
            message: "Internship approved successfully."
        });

    } catch (error) {
        console.error("Approve internship error:", error);

        res.status(500).json({
            message: "Failed to approve internship."
        });
    }
};


// Reject an internship
const rejectInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;
        const { reason } = req.body;

        if (!reason || reason.trim() === "") {
            return res.status(400).json({
                message: "A rejection reason is required."
            });
        }

        const [internships] = await pool.query(
            `
            SELECT id, title, approval_status
            FROM internships
            WHERE id = ?
            `,
            [internshipId]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                message: "Internship not found."
            });
        }

        const internship = internships[0];

        if (internship.approval_status !== "pending") {
            return res.status(400).json({
                message: `This internship has already been ${internship.approval_status}.`
            });
        }

        await pool.query(
            `
            UPDATE internships
            SET
                approval_status = 'rejected',
                approval_reason = ?,
                approval_decided_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [reason.trim(), internshipId]
        );

        res.json({
            message: "Internship rejected successfully."
        });

    } catch (error) {
        console.error("Reject internship error:", error);

        res.status(500).json({
            message: "Failed to reject internship."
        });
    }
};


module.exports = {
    getPendingInternships,
    getAdminStats,
    approveInternship,
    rejectInternship
};