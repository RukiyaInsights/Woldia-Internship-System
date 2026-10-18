const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIRECTORY = path.resolve(
    __dirname,
    "../private_uploads/company_supervisor_messages"
);

// Check whether the logged-in user is authorized to access
// this internship's company-supervisor conversation.
const checkInternshipAccess = async (internshipId, userId) => {
    const [internships] = await pool.query(
        `SELECT
            internships.id,
            companies.user_id AS company_user_id
         FROM internships
         INNER JOIN companies
            ON internships.company_id = companies.id
         WHERE internships.id = ?`,
        [internshipId]
    );

    if (internships.length === 0) {
        return null;
    }

    const [assignments] = await pool.query(
        `SELECT supervisors.user_id AS supervisor_user_id
         FROM supervisor_assignments
         INNER JOIN supervisors
            ON supervisor_assignments.supervisor_id = supervisors.id
         WHERE supervisor_assignments.internship_id = ?`,
        [internshipId]
    );

    if (assignments.length === 0) {
        return null;
    }

    const companyUserId = Number(internships[0].company_user_id);
    const supervisorUserId = Number(assignments[0].supervisor_user_id);
    const currentUserId = Number(userId);

    if (
        currentUserId !== companyUserId &&
        currentUserId !== supervisorUserId
    ) {
        return null;
    }

    return {
        companyUserId,
        supervisorUserId,
        currentUserId
    };
};


// Delete an uploaded file if a request fails after upload.
const removeUploadedFile = (file) => {
    if (file && file.path) {
        fs.promises.unlink(file.path).catch(() => {});
    }
};


// Send a text message, file attachment, shared link, or combination.
const sendMessage = async (req, res) => {
    try {
        const { internship_id, receiver_id, message, shared_link } = req.body;
        const senderId = Number(req.user.id);
        const internshipId = Number(internship_id);
        const receiverId = Number(receiver_id);

        const messageText =
            typeof message === "string" ? message.trim() : "";

        const sharedLink =
            typeof shared_link === "string" ? shared_link.trim() : "";

        // Require a valid internship and receiver.
        if (
            !Number.isInteger(internshipId) ||
            internshipId <= 0 ||
            !Number.isInteger(receiverId) ||
            receiverId <= 0
        ) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                message: "A valid internship and receiver are required."
            });
        }

        // At least one of these must be provided.
        if (!messageText && !sharedLink && !req.file) {
            return res.status(400).json({
                message: "Write a message, attach a file, or share a link."
            });
        }

        // Accept only ordinary HTTP and HTTPS links.
        if (sharedLink) {
            try {
                const parsedLink = new URL(sharedLink);

                if (
                    parsedLink.protocol !== "http:" &&
                    parsedLink.protocol !== "https:"
                ) {
                    removeUploadedFile(req.file);

                    return res.status(400).json({
                        message: "Only HTTP and HTTPS links are allowed."
                    });
                }
            } catch (error) {
                removeUploadedFile(req.file);

                return res.status(400).json({
                    message: "Please enter a valid web link."
                });
            }
        }

        if (senderId === receiverId) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                message: "You cannot send a message to yourself."
            });
        }

        // Verify the sender belongs to this internship.
        const access = await checkInternshipAccess(
            internshipId,
            senderId
        );

        if (!access) {
            removeUploadedFile(req.file);

            return res.status(403).json({
                message:
                    "You are not authorized to message about this internship."
            });
        }

        // Only the other authorized participant can receive the message.
        const validReceiver =
            (
                senderId === access.companyUserId &&
                receiverId === access.supervisorUserId
            ) ||
            (
                senderId === access.supervisorUserId &&
                receiverId === access.companyUserId
            );

        if (!validReceiver) {
            removeUploadedFile(req.file);

            return res.status(403).json({
                message:
                    "The selected receiver is not authorized for this internship."
            });
        }

        // Keep attachments inside the private upload directory.
        const attachmentPath = req.file
            ? path.basename(req.file.filename)
            : null;

        const attachmentName = req.file
            ? path.basename(req.file.originalname)
            : null;

        const attachmentType = req.file
            ? req.file.mimetype
            : null;

        try {
            const [result] = await pool.query(
                `INSERT INTO messages (
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
                    senderId,
                    receiverId,
                    messageText,
                    attachmentPath,
                    attachmentName,
                    attachmentType,
                    sharedLink || null
                ]
            );

            return res.status(201).json({
                message: "Message sent successfully.",
                messageId: result.insertId
            });
        } catch (databaseError) {
            // Do not leave an unreferenced file if saving fails.
            removeUploadedFile(req.file);
            throw databaseError;
        }
    } catch (error) {
        console.error("Send message error:", error);

        return res.status(500).json({
            message: "Server error while sending the message."
        });
    }
};


// Retrieve messages exchanged by the logged-in user.
const getMyMessages = async (req, res) => {
    try {
        const userId = Number(req.user.id);

        const [messages] = await pool.query(
            `SELECT
                messages.id,
                messages.internship_id,
                messages.sender_id,
                sender.full_name AS sender_name,
                messages.receiver_id,
                receiver.full_name AS receiver_name,
                messages.message,
                messages.attachment_path,
                messages.attachment_name,
                messages.attachment_type,
                messages.shared_link,
                messages.is_read,
                messages.created_at,
                internships.title AS internship_title
             FROM messages
             INNER JOIN users AS sender
                ON messages.sender_id = sender.id
             INNER JOIN users AS receiver
                ON messages.receiver_id = receiver.id
             INNER JOIN internships
                ON messages.internship_id = internships.id
             WHERE
                messages.sender_id = ?
                OR messages.receiver_id = ?
             ORDER BY messages.created_at ASC`,
            [userId, userId]
        );

        // Only include messages belonging to internships for which
        // the user is currently the company or assigned supervisor.
        const authorizedMessages = [];

        for (const item of messages) {
            const access = await checkInternshipAccess(
                item.internship_id,
                userId
            );

            if (access) {
                // Return a download endpoint, not the private disk path.
                item.attachment_url = item.attachment_path
                    ? `/api/messages/${item.id}/attachment`
                    : null;

                delete item.attachment_path;

                authorizedMessages.push(item);
            }
        }

        return res.json({
            message: "Messages retrieved successfully.",
            messages: authorizedMessages
        });
    } catch (error) {
        console.error("Get messages error:", error);

        return res.status(500).json({
            message: "Server error while retrieving messages."
        });
    }
};


// Download an attachment only when the user is an authorized participant.
const downloadAttachment = async (req, res) => {
    try {
        const messageId = Number(req.params.id);
        const userId = Number(req.user.id);

        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.status(400).json({
                message: "Invalid message ID."
            });
        }

        const [messages] = await pool.query(
            `SELECT
                id,
                internship_id,
                sender_id,
                receiver_id,
                attachment_path,
                attachment_name
             FROM messages
             WHERE id = ?`,
            [messageId]
        );

        if (messages.length === 0 || !messages[0].attachment_path) {
            return res.status(404).json({
                message: "Attachment not found."
            });
        }

        const item = messages[0];

        // The user must be a participant in this specific conversation.
        if (
            Number(item.sender_id) !== userId &&
            Number(item.receiver_id) !== userId
        ) {
            return res.status(403).json({
                message: "You are not allowed to download this attachment."
            });
        }

        const access = await checkInternshipAccess(
            item.internship_id,
            userId
        );

        if (!access) {
            return res.status(403).json({
                message: "You are not authorized to access this internship."
            });
        }

        // Never trust a file path supplied by the client or database.
        const safeFilename = path.basename(item.attachment_path);
        const filePath = path.resolve(UPLOAD_DIRECTORY, safeFilename);

        if (!filePath.startsWith(UPLOAD_DIRECTORY + path.sep)) {
            return res.status(400).json({
                message: "Invalid attachment path."
            });
        }

        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            return res.status(404).json({
                message: "The attachment file could not be found."
            });
        }

        const downloadName =
            path.basename(item.attachment_name || safeFilename);

        return res.download(filePath, downloadName);
    } catch (error) {
        console.error("Download attachment error:", error);

        return res.status(500).json({
            message: "Server error while downloading the attachment."
        });
    }
};


// Mark a received message as read.
const markMessageAsRead = async (req, res) => {
    try {
        const messageId = Number(req.params.id);
        const userId = Number(req.user.id);

        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.status(400).json({
                message: "A valid message ID is required."
            });
        }

        const [messages] = await pool.query(
            `SELECT id, internship_id, receiver_id, is_read
             FROM messages
             WHERE id = ?`,
            [messageId]
        );

        if (messages.length === 0) {
            return res.status(404).json({
                message: "Message not found."
            });
        }

        const item = messages[0];

        if (Number(item.receiver_id) !== userId) {
            return res.status(403).json({
                message: "You can only mark messages sent to you as read."
            });
        }

        const access = await checkInternshipAccess(
            item.internship_id,
            userId
        );

        if (!access) {
            return res.status(403).json({
                message: "You are not authorized to access this conversation."
            });
        }

        if (item.is_read) {
            return res.json({
                message: "Message is already marked as read."
            });
        }

        await pool.query(
            `UPDATE messages
             SET is_read = TRUE
             WHERE id = ?`,
            [messageId]
        );

        return res.json({
            message: "Message marked as read successfully."
        });
    } catch (error) {
        console.error("Mark message as read error:", error);

        return res.status(500).json({
            message: "Server error while marking the message as read."
        });
    }
};


module.exports = {
    sendMessage,
    getMyMessages,
    markMessageAsRead,
    downloadAttachment
};