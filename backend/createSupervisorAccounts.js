const pool = require("./config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const supervisorsToCreate = [
    {
        full_name: "Dawit Mengistu",
        email: "dawit.mengistu@wldu.edu.et",
        department: "Computer Science",
    },
    {
        full_name: "Hirut Alemayehu",
        email: "hirut.alemayehu@wldu.edu.et",
        department: "Software Engineering",
    },
    {
        full_name: "Kebede Workneh",
        email: "kebede.workneh@wldu.edu.et",
        department: "Information Technology",
    },
];

async function createSupervisorAccounts() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const createdAccounts = [];

        for (const supervisor of supervisorsToCreate) {
            const email = supervisor.email.toLowerCase();

            const [authorizationRows] = await connection.execute(
                `SELECT id, full_name, email, department, claimed_by_user_id
                 FROM authorized_supervisors
                 WHERE LOWER(email) = ?
                 FOR UPDATE`,
                [email]
            );

            if (authorizationRows.length !== 1) {
                throw new Error(
                    `Expected exactly one authorization record for ${email}. Found: ${authorizationRows.length}`
                );
            }

            const authorization = authorizationRows[0];

            if (
                authorization.claimed_by_user_id !== null &&
                authorization.claimed_by_user_id !== undefined
            ) {
                throw new Error(
                    `${email} is already linked to user ID ${authorization.claimed_by_user_id}.`
                );
            }

            const [existingUsers] = await connection.execute(
                `SELECT id, role
                 FROM users
                 WHERE LOWER(email) = ?
                 FOR UPDATE`,
                [email]
            );

            if (existingUsers.length > 0) {
                throw new Error(
                    `A login account already exists for ${email}. Check that account before continuing.`
                );
            }

            const temporaryPassword = crypto
                .randomBytes(12)
                .toString("base64url");

            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                12
            );

            const [userResult] = await connection.execute(
                `INSERT INTO users (full_name, email, password, role)
                 VALUES (?, ?, ?, 'supervisor')`,
                [
                    supervisor.full_name,
                    email,
                    passwordHash,
                ]
            );

            const userId = userResult.insertId;

            await connection.execute(
                `INSERT INTO supervisors (user_id, department, phone)
                 VALUES (?, ?, NULL)`,
                [
                    userId,
                    supervisor.department,
                ]
            );

            const [updateResult] = await connection.execute(
                `UPDATE authorized_supervisors
                 SET claimed_by_user_id = ?
                 WHERE id = ?
                   AND claimed_by_user_id IS NULL`,
                [
                    userId,
                    authorization.id,
                ]
            );

            if (updateResult.affectedRows !== 1) {
                throw new Error(
                    `Could not link the authorization record for ${email}.`
                );
            }

            createdAccounts.push({
                full_name: supervisor.full_name,
                email,
                temporaryPassword,
            });
        }

        await connection.commit();

        console.log(
            "\nSUPERVISOR ACCOUNTS CREATED SUCCESSFULLY\n"
        );

        console.log(
            "Save these temporary credentials securely:\n"
        );

        for (const account of createdAccounts) {
            console.log(`Name: ${account.full_name}`);
            console.log(`Email: ${account.email}`);
            console.log(
                `Temporary password: ${account.temporaryPassword}`
            );
            console.log("----------------------------------------");
        }

        console.log(
            "\nSave the passwords now. Only their bcrypt hashes are stored in the database."
        );

        console.log(
            "Give each supervisor their own credentials through a secure channel."
        );

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(
            "\nSUPERVISOR ACCOUNT CREATION FAILED:"
        );

        console.error(error.message);

        console.error(
            "\nThe database transaction was rolled back."
        );

    } finally {
        if (connection) {
            connection.release();
        }

        await pool.end();
    }
}

createSupervisorAccounts();