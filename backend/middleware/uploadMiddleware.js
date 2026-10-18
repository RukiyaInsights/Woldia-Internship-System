const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
    __dirname,
    "..",
    "private_uploads"
);

// Keep uploaded files outside the public frontend.
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.memoryStorage();

const allowedExtensions = new Set([
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".txt",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx"
]);

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
        return cb(
            new Error(
                "Unsupported file type. Upload PDF, Word, image, text, Excel, or PowerPoint files."
            )
        );
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    }
});

const storePrivatePdf = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file to upload."
            });
        }

        const extension = path.extname(
            req.file.originalname
        ).toLowerCase();

        // Check the PDF signature for PDF files.
        if (extension === ".pdf") {
            const signature = req.file.buffer
                .subarray(0, 5)
                .toString("ascii");

            if (signature !== "%PDF-") {
                return res.status(400).json({
                    message: "The uploaded PDF file is invalid."
                });
            }
        }

        const filename = `${crypto.randomUUID()}${extension}`;

        const filePath = path.join(
            uploadDirectory,
            filename
        );

        await fs.promises.writeFile(
            filePath,
            req.file.buffer,
            {
                flag: "wx",
                mode: 0o600
            }
        );

        req.uploadedDocument = {
            filename,
            filePath,
            originalName: path.basename(
                req.file.originalname
            ),
            mimeType: req.file.mimetype,
            size: req.file.size
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload,
    storePrivatePdf
};