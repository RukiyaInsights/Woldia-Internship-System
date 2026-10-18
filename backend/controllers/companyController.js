const pool = require("../config/db");



// Create company profile
const createCompanyProfile = async (req, res) => {
    let connection;

    try {
        const { company_name, address, phone, description } = req.body;
        const userId = req.user.id;

        if (!company_name || typeof company_name !== "string") {
            return res.status(400).json({
                message: "Company name is required."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Verify the authenticated user
        const [users] = await connection.query(
            `SELECT id, full_name, email, role
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0 || users[0].role !== "company") {
            await connection.rollback();

            return res.status(403).json({
                message: "A valid company account is required."
            });
        }

        const user = users[0];

        // Find the authorized company using the account email
        const [authorizedCompanies] = await connection.query(
            `SELECT id, company_name, claimed_by_user_id
             FROM authorized_companies
             WHERE email = ?
             FOR UPDATE`,
            [user.email]
        );

        if (authorizedCompanies.length === 0) {
            await connection.rollback();

            return res.status(403).json({
                message: "This account is not authorized to create a company profile."
            });
        }

        const authorizedCompany = authorizedCompanies[0];

        // Ensure the submitted name matches the authorized company
        const normalizeName = (name) =>
            name.trim().replace(/\s+/g, " ").toLowerCase();

        if (
            normalizeName(company_name) !==
            normalizeName(authorizedCompany.company_name)
        ) {
            await connection.rollback();

            return res.status(403).json({
                message: "The company name does not match the authorized company record."
            });
        }

        // Prevent another account from claiming this company
        if (
            authorizedCompany.claimed_by_user_id !== null &&
            Number(authorizedCompany.claimed_by_user_id) !== Number(userId)
        ) {
            await connection.rollback();

            return res.status(409).json({
                message: "This company has already been claimed by another account."
            });
        }

        // Check whether the user already has a company profile
        const [existingProfiles] = await connection.query(
            `SELECT id
             FROM companies
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (existingProfiles.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "Company profile already exists."
            });
        }

        // Create the company profile
        const [result] = await connection.query(
            `INSERT INTO companies
                (user_id, company_name, address, phone, description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                authorizedCompany.company_name,
                address || null,
                phone || null,
                description || null
            ]
        );

        // Mark the authorized company as claimed
        await connection.query(
            `UPDATE authorized_companies
             SET claimed_by_user_id = ?
             WHERE id = ?`,
            [userId, authorizedCompany.id]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Authorized company profile created successfully.",
            companyId: result.insertId
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback error:", rollbackError);
            }
        }

        console.error("Create company profile error:", error);

        return res.status(500).json({
            message: "Server error while creating company profile."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// Get current company's profile
const getCompanyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [companies] = await pool.query(
            `SELECT
                companies.id,
                companies.company_name,
                companies.address,
                companies.phone,
                companies.description,
                users.full_name,
                users.email
             FROM companies
             INNER JOIN users
                ON companies.user_id = users.id
             WHERE companies.user_id = ?`,
            [userId]
        );

        if (companies.length === 0) {
            return res.status(404).json({
                message: "Company profile not found."
            });
        }

        return res.json({
            message: "Company profile retrieved successfully.",
            company: companies[0]
        });

    } catch (error) {
        console.error("Get company profile error:", error);

        return res.status(500).json({
            message: "Server error while retrieving company profile."
        });
    }
};

module.exports = {
    createCompanyProfile,
    getCompanyProfile
};