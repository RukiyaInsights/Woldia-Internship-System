const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==================================================
// VERIFY THAT THE STUDENT AND SUPERVISOR ARE ASSIGNED
// ==================================================
async function verifyAssignment(internshipId, userId, contactId) {
    const [rows] = await pool.query(
        `SELECT sa.id
         FROM supervisor_assignments sa
         JOIN students st ON st.id = sa.student_id
         JOIN supervisors sp ON sp.id = sa.supervisor_id
         WHERE sa.internship_id = ?
           AND (
                (st.user_id = ? AND sp.user_id = ?)
                OR
                (st.user_id = ? AND sp.user_id = ?)
           )
         LIMIT 1`,
        [internshipId, userId, contactId, contactId, userId]
    );

    return rows.length > 0;
}

// ==================================================
// GET ASSIGNED STUDENTS OR SUPERVISORS
// ==================================================
async function getContacts(req, res) {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let contacts;

        if (role === "student") {
            const [rows] = await pool.query(
                `SELECT DISTINCT
                    sa.internship_id,
                    sp.user_id AS contact_user_id,
                    CONCAT('Supervisor #', sp.id) AS contact_name,
                    CONCAT('Internship #', sa.internship_id) AS internship_name
                 FROM supervisor_assignments sa
                 JOIN students st ON st.id = sa.student_id
                 JOIN supervisors sp ON sp.id = sa.supervisor_id
                 WHERE st.user_id = ?
                 ORDER BY sa.internship_id DESC`,
                [userId]
            );

            contacts = rows;
        } else if (role === "supervisor") {
            const [rows] = await pool.query(
                `SELECT DISTINCT
                    sa.internship_id,
                    st.user_id AS contact_user_id,
                    CONCAT('Student ', st.student_id) AS contact_name,
                    CONCAT('Internship #', sa.internship_id) AS internship_name
                 FROM supervisor_assignments sa
                 JOIN supervisors sp ON sp.id = sa.supervisor_id
                 JOIN students st ON st.id = sa.student_id
                 WHERE sp.user_id = ?
                 ORDER BY sa.internship_id DESC`,
                [userId]
            );

            contacts = rows;
        } else {
            return res.status(403).json({
                message: "Only students and supervisors can use this chat."
            });
        }

        res.json(contacts);
    } catch (error) {
        console.error("Get student-supervisor contacts error:", error);

        res.status(500).json({
            message: "Failed to load assigned contacts."
        });
    }
}

// ==================================================
// GET MESSAGES FOR ONE ASSIGNED CONVERSATION
// ==================================================
async function getMessages(req, res) {
    try {
        const userId = req.user.id;
        const contactId = Number(req.query.contact_id);
        const internshipId = Number(req.query.internship_id);

        if (
            !Number.isInteger(contactId) ||
            contactId <= 0 ||
            !Number.isInteger(internshipId) ||
            internshipId <= 0
        ) {
            return res.status(400).json({
                message: "A valid contact and internship are required."
            });
        }

        const allowed = await verifyAssignment(
            internshipId,
            userId,
            contactId
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You are not assigned to this conversation."
            });
        }

        await pool.query(
            `UPDATE student_supervisor_messages
             SET is_read = 1
             WHERE internship_id = ?
               AND sender_id = ?
               AND receiver_id = ?`,
            [internshipId, contactId, userId]
        );

        const [messages] = await pool.query(
            `SELECT
                id,
                internship_id,
                sender_id,
                receiver_id,
                message,
                attachment_name,
                attachment_type,
                shared_link,
                is_read,
                created_at
             FROM student_supervisor_messages
             WHERE internship_id = ?
               AND (
                    (sender_id = ? AND receiver_id = ?)
                    OR
                    (sender_id = ? AND receiver_id = ?)
               )
             ORDER BY created_at ASC, id ASC`,
            [internshipId, userId, contactId, contactId, userId]
        );

        res.json(messages);
    } catch (error) {
        console.error("Get student-supervisor messages error:", error);

        res.status(500).json({
            message: "Failed to load messages."
        });
    }
}

// ==================================================
// SEND TEXT, LINK, OR DOCUMENT
// ==================================================
async function sendMessage(req, res) {
    try {
        const userId = req.user.id;

        const contactId = Number(req.body.receiver_id);
        const internshipId = Number(req.body.internship_id);

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const sharedLink =
            typeof req.body.shared_link === "string"
                ? req.body.shared_link.trim()
                : "";

        const attachment = req.file || null;

        if (
            !Number.isInteger(contactId) ||
            contactId <= 0 ||
            !Number.isInteger(internshipId) ||
            internshipId <= 0
        ) {
            if (attachment) {
                fs.unlink(attachment.path, () => {});
            }

            return res.status(400).json({
                message: "A valid contact and internship are required."
            });
        }

        if (!message && !sharedLink && !attachment) {
            return res.status(400).json({
                message: "Write a message, share a link, or attach a document."
            });
        }

        if (sharedLink) {
            try {
                const parsedLink = new URL(sharedLink);

                if (!["http:", "https:"].includes(parsedLink.protocol)) {
                    throw new Error("Invalid link protocol");
                }
            } catch {
                if (attachment) {
                    fs.unlink(attachment.path, () => {});
                }

                return res.status(400).json({
                    message: "Please enter a valid HTTP or HTTPS link."
                });
            }
        }

        const allowed = await verifyAssignment(
            internshipId,
            userId,
            contactId
        );

        if (!allowed) {
            if (attachment) {
                fs.unlink(attachment.path, () => {});
            }

            return res.status(403).json({
                message: "You cannot message this person for this internship."
            });
        }

        const attachmentPath = attachment
            ? path.relative(
                  path.join(__dirname, ".."),
                  attachment.path
              ).replace(/\\/g, "/")
            : null;

        const [result] = await pool.query(
            `INSERT INTO student_supervisor_messages
                (
                    internship_id,
                    sender_id,
                    receiver_id,
                    message,
                    attachment_path,
                    attachment_name,
                    attachment_type,
                    shared_link
                )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                internshipId,
                userId,
                contactId,
                message || null,
                attachmentPath,
                attachment ? attachment.originalname : null,
                attachment ? attachment.mimetype : null,
                sharedLink || null
            ]
        );

        const [savedMessages] = await pool.query(
            `SELECT
                id,
                internship_id,
                sender_id,
                receiver_id,
                message,
                attachment_name,
                attachment_type,
                shared_link,
                is_read,
                created_at
             FROM student_supervisor_messages
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Message sent successfully.",
            data: savedMessages[0]
        });
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }

        console.error("Send student-supervisor message error:", error);

        res.status(500).json({
            message: "Failed to send the message."
        });
    }
}

// ==================================================
// SECURELY DOWNLOAD A DOCUMENT
// ==================================================
async function downloadAttachment(req, res) {
    try {
        const userId = req.user.id;
        const messageId = Number(req.params.id);

        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.status(400).json({
                message: "Invalid attachment ID."
            });
        }

        const [rows] = await pool.query(
            `SELECT
                id,
                internship_id,
                sender_id,
                receiver_id,
                attachment_path,
                attachment_name
             FROM student_supervisor_messages
             WHERE id = ?
               AND (sender_id = ? OR receiver_id = ?)
             LIMIT 1`,
            [messageId, userId, userId]
        );

        if (rows.length === 0 || !rows[0].attachment_path) {
            return res.status(404).json({
                message: "Attachment not found."
            });
        }

        const item = rows[0];

        const allowed = await verifyAssignment(
            item.internship_id,
            userId,
            userId === item.sender_id
                ? item.receiver_id
                : item.sender_id
        );

        if (!allowed) {
            return res.status(403).json({
                message: "You cannot access this attachment."
            });
        }

        const backendDirectory = path.resolve(__dirname, "..");
        const filePath = path.resolve(
            backendDirectory,
            item.attachment_path
        );

        const privateDirectory = path.resolve(
            backendDirectory,
            "private_uploads",
            "student_supervisor_messages"
        );

        if (!filePath.startsWith(privateDirectory + path.sep)) {
            return res.status(403).json({
                message: "Invalid attachment location."
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "The stored document could not be found."
            });
        }

        res.download(
            filePath,
            path.basename(item.attachment_name),
            (error) => {
                if (error && !res.headersSent) {
                    console.error("Attachment download error:", error);

                    res.status(500).json({
                        message: "Failed to download the document."
                    });
                }
            }
        );
    } catch (error) {
        console.error("Download student-supervisor attachment error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                message: "Failed to download the document."
            });
        }
    }
}

module.exports = {
    getContacts,
    getMessages,
    sendMessage,
    downloadAttachment
};