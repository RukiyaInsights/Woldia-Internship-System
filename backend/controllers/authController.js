const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createNotification } = require("./notificationController");

// ============================================
// REGISTER A NEW USER
// ============================================

const register = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { full_name, email, password, role } = req.body;

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof role !== "string"
        ) {
            return res.status(400).json({
                message: "Please provide your full name, email, password, and role."
            });
        }

        const normalizedName = full_name.trim().replace(/\s+/g, " ");
        const normalizedEmail = email.trim().toLowerCase();

        // Validate full name
        if (
            normalizedName.length < 2 ||
            normalizedName.length > 100 ||
            !/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(normalizedName)
        ) {
            return res.status(400).json({
                message: "Enter a valid full name between 2 and 100 characters."
            });
        }

        // Validate email
        if (
            normalizedEmail.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // Only students and companies can register publicly
        const allowedRoles = ["student", "company"];

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                message: "This role cannot be created through public registration."
            });
        }

        // Validate password length
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: "Password must contain between 8 and 72 characters."
            });
        }

        // Validate password strength
        if (
            !/[a-z]/i.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^a-zA-Z0-9]/.test(password)
        ) {
            return res.status(400).json({
                message: "Password must contain at least one letter, a number, and a special character."
            });
        }

        // Ensure JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from the environment.");

            return res.status(500).json({
                message: "Authentication service is not configured correctly."
            });
        }

        // Check for an existing account
        const [existingUsers] = await pool.query(
            `SELECT id
             FROM users
             WHERE LOWER(TRIM(email)) = ?`,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists. Please log in."
            });
        }

        // Check authorization lists
        const [authorizedStudentsForRole] = await pool.query(
            `SELECT id, full_name, email, claimed_by_user_id
             FROM authorized_students
             WHERE LOWER(TRIM(email)) = ?`,
            [normalizedEmail]
        );

        const [authorizedCompaniesForRole] = await pool.query(
            `SELECT id, company_name, email, claimed_by_user_id
             FROM authorized_companies
             WHERE LOWER(TRIM(email)) = ?`,
            [normalizedEmail]
        );

        // An email must not belong to both roles
        if (
            authorizedStudentsForRole.length > 0 &&
            authorizedCompaniesForRole.length > 0
        ) {
            return res.status(409).json({
                message: "Your registration information requires verification. Please contact the university administrator."
            });
        }

        let authorizedRole = null;

        if (authorizedStudentsForRole.length > 0) {
            authorizedRole = "student";
        } else if (authorizedCompaniesForRole.length > 0) {
            authorizedRole = "company";
        }

        // Check selected role
        if (authorizedRole !== null && role !== authorizedRole) {
            const correctRole =
                authorizedRole === "student" ? "Student" : "Company";

            return res.status(403).json({
                message: `Incorrect role selected. The email address you entered is authorized for a ${correctRole} account. Please select ${correctRole} to continue.`,
                code: "ROLE_MISMATCH",
                correctRole: authorizedRole
            });
        }

        let authorizedCompany = null;
        let authorizedStudent = null;

        // ============================================
        // VALIDATE COMPANY REGISTRATION
        // ============================================

        if (role === "company") {
            const [authorizedCompanies] = await pool.query(
                `SELECT id, company_name, email, claimed_by_user_id
                 FROM authorized_companies
                 WHERE LOWER(TRIM(email)) = ?`,
                [normalizedEmail]
            );

            if (authorizedCompanies.length === 0) {
                return res.status(403).json({
                    message: "This company email is not authorized to register."
                });
            }

            authorizedCompany = authorizedCompanies[0];

            if (authorizedCompany.claimed_by_user_id != null) {
                return res.status(409).json({
                    message: "This authorized company has already been claimed."
                });
            }

            if (
                authorizedCompany.company_name.trim().toLowerCase() !==
                normalizedName.toLowerCase()
            ) {
                return res.status(403).json({
                    message: "The company name does not match the authorized company record."
                });
            }
        }

        // ============================================
        // VALIDATE STUDENT REGISTRATION
        // ============================================

        if (role === "student") {
            const [authorizedStudents] = await pool.query(
                `SELECT id, full_name, email, claimed_by_user_id
                 FROM authorized_students
                 WHERE LOWER(TRIM(email)) = ?`,
                [normalizedEmail]
            );

            if (authorizedStudents.length === 0) {
                return res.status(403).json({
                    message: "This student email is not authorized to register."
                });
            }

            authorizedStudent = authorizedStudents[0];

            if (authorizedStudent.claimed_by_user_id != null) {
                return res.status(409).json({
                    message: "This authorized student already has a claimed account."
                });
            }

            if (
                authorizedStudent.full_name.trim().toLowerCase() !==
                normalizedName.toLowerCase()
            ) {
                return res.status(403).json({
                    message: "Your name does not match the authorized student record."
                });
            }
        }

        // ============================================
        // CREATE ACCOUNT USING A TRANSACTION
        // ============================================

        const hashedPassword = await bcrypt.hash(password, 10);

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock company authorization to prevent duplicate claims
        if (role === "company") {
            const [lockedCompanies] = await connection.query(
                `SELECT id, company_name, claimed_by_user_id
                 FROM authorized_companies
                 WHERE id = ?
                 FOR UPDATE`,
                [authorizedCompany.id]
            );

            if (
                lockedCompanies.length === 0 ||
                lockedCompanies[0].claimed_by_user_id != null
            ) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(409).json({
                    message: "This authorized company has already been claimed or is no longer available."
                });
            }
        }

        // Lock student authorization to prevent duplicate claims
        if (role === "student") {
            const [lockedStudents] = await connection.query(
                `SELECT id, full_name, claimed_by_user_id
                 FROM authorized_students
                 WHERE id = ?
                 FOR UPDATE`,
                [authorizedStudent.id]
            );

            if (
                lockedStudents.length === 0 ||
                lockedStudents[0].claimed_by_user_id != null
            ) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(409).json({
                    message: "This authorized student has already been claimed or is no longer available."
                });
            }
        }

        // Create the user
        const [result] = await connection.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [normalizedName, normalizedEmail, hashedPassword, role]
        );

        const userId = result.insertId;

        // Automatically create the company profile
        if (role === "company") {
            await connection.query(
                `INSERT INTO companies (user_id, company_name)
                 VALUES (?, ?)`,
                [userId, authorizedCompany.company_name]
            );

            // Link the authorized company to its account
            const [claimResult] = await connection.query(
                `UPDATE authorized_companies
                 SET claimed_by_user_id = ?
                 WHERE id = ?
                   AND claimed_by_user_id IS NULL`,
                [userId, authorizedCompany.id]
            );

            if (claimResult.affectedRows !== 1) {
                throw new Error(
                    "Unable to claim the authorized company record."
                );
            }
        }

        // Link the authorized student to its account
        if (role === "student") {
            const [claimResult] = await connection.query(
                `UPDATE authorized_students
                 SET claimed_by_user_id = ?
                 WHERE id = ?
                   AND claimed_by_user_id IS NULL`,
                [userId, authorizedStudent.id]
            );

            if (claimResult.affectedRows !== 1) {
                throw new Error(
                    "Unable to claim the authorized student record."
                );
            }
        }

        await connection.commit();
        transactionStarted = false;

        const user = {
            id: userId,
            full_name: normalizedName,
            email: normalizedEmail,
            role
        };

        // ============================================
        // CREATE ADMIN NOTIFICATIONS
        // ============================================

        try {
            const [admins] = await pool.query(
                `SELECT id
                 FROM users
                 WHERE role = 'admin'`
            );

            const title =
                role === "student"
                    ? "New Student Registration"
                    : "New Company Registration";

            const message =
                role === "student"
                    ? `${normalizedName} has registered as a student.`
                    : `${normalizedName} has registered as a company.`;

            await Promise.all(
                admins.map((admin) =>
                    createNotification(admin.id, title, message)
                )
            );

            console.log(
                `Registration notification processed for ${role}: ${normalizedName}`
            );
        } catch (notificationError) {
            console.error(
                "Registration notification error:",
                notificationError
            );
        }

        // Generate token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(201).json({
            message: "Account created successfully!",
            token,
            user
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Registration rollback error:",
                    rollbackError
                );
            }
        }

        console.error("Registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email or authorization record already exists."
            });
        }

        return res.status(500).json({
            message: "Server error during registration."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ============================================
// LOG IN AN EXISTING USER
// ============================================

const login = async (req, res) => {
    try {
        const { email, password, role: selectedRole } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const allowedRoles = [
            "student",
            "company",
            "supervisor",
            "admin"
        ];

        if (
            typeof selectedRole !== "string" ||
            !allowedRoles.includes(selectedRole)
        ) {
            return res.status(400).json({
                message: "Please select a valid account role."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.query(
            `SELECT id, full_name, email, password, role
             FROM users
             WHERE LOWER(TRIM(email)) = ?`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];
        let passwordMatch;

        try {
            passwordMatch = await bcrypt.compare(
                password,
                user.password
            );
        } catch (passwordError) {
            console.error(
                "Password verification error:",
                passwordError.message
            );

            return res.status(500).json({
                message: "Unable to verify the password. Please contact the administrator."
            });
        }

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (selectedRole !== user.role) {
            return res.status(403).json({
                message: "The selected role does not match your account. Please select the correct role."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from the environment.");

            return res.status(500).json({
                message: "Authentication service is not configured correctly."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error during login."
        });
    }
};

// ============================================
// EXPORT AUTHENTICATION FUNCTIONS
// ============================================

module.exports = {
    register,
    login
};