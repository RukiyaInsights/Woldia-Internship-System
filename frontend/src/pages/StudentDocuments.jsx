import { useEffect, useRef, useState } from "react";
import {
    FileText,
    Upload,
    FolderOpen,
    Download,
    Trash2,
    ExternalLink,
    Link as LinkIcon,
    Plus,
    ShieldCheck,
    FileCheck2,
    AlertCircle,
    ArrowUpRight,
    X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/students";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
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
    ".pptx",
];

const documentTypes = [
    { value: "cv", label: "Curriculum Vitae (CV)" },
    { value: "application_letter", label: "Application Letter" },
    { value: "certificate", label: "Certificate" },
    { value: "other", label: "Other Document" },
];

export default function StudentDocuments() {
    const fileInputRef = useRef(null);

    const [documents, setDocuments] = useState([]);
    const [internships, setInternships] = useState([]);
    const [selectedInternshipId, setSelectedInternshipId] =
        useState("");

    const [selectedType, setSelectedType] = useState("cv");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [portfolioLinks, setPortfolioLinks] = useState([]);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [uploading, setUploading] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [loadingInternships, setLoadingInternships] =
        useState(true);

    const getToken = () =>
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    // Load saved documents and internship applications.
    useEffect(() => {
        const loadPageData = async () => {
            const token = getToken();

            if (!token) {
                setError("Please log in again to access your documents.");
                setLoadingDocuments(false);
                setLoadingInternships(false);
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            // Load saved documents from the backend.
            try {
                const response = await fetch(
                    `${API_URL}/documents`,
                    { headers }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load your documents."
                    );
                }

                const savedDocuments = Array.isArray(data.documents)
                    ? data.documents
                    : [];

                setDocuments(
                    savedDocuments.map((document) => ({
                        id: document.id,
                        name: document.name || "Unnamed document",
                        filename: document.filename,
                        type: document.type || "other",
                        size: document.size ?? null,
                        internshipId: document.internshipId,
                        internshipTitle:
                            document.internshipTitle ||
                            "Internship",
                        addedAt: document.uploadedAt
                            ? new Date(
                                  document.uploadedAt
                              ).toLocaleDateString()
                            : "Date unavailable",
                    }))
                );
            } catch (err) {
                setError(
                    err.message ||
                        "Unable to load your saved documents."
                );
            } finally {
                setLoadingDocuments(false);
            }

            // Load internships the student has applied for.
            try {
                const response = await fetch(
                    `${API_URL}/applications`,
                    { headers }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to load your internship applications."
                    );
                }

                const applicationRows = Array.isArray(data)
                    ? data
                    : Array.isArray(data.applications)
                      ? data.applications
                      : Array.isArray(data.data?.applications)
                        ? data.data.applications
                        : [];

                const normalizedInternships = applicationRows
                    .map((application) => {
                        const internship =
                            application.internship || {};

                        const id =
                            application.internship_id ??
                            application.internshipId ??
                            internship.id;

                        const title =
                            application.internship_title ||
                            application.internshipTitle ||
                            internship.title ||
                            application.title;

                        if (id == null || !title) {
                            return null;
                        }

                        return {
                            id: String(id),
                            title,
                        };
                    })
                    .filter(Boolean);

                // Remove duplicate internship entries.
                const uniqueInternships = [
                    ...new Map(
                        normalizedInternships.map((internship) => [
                            internship.id,
                            internship,
                        ])
                    ).values(),
                ];

                setInternships(uniqueInternships);

                if (uniqueInternships.length === 1) {
                    setSelectedInternshipId(uniqueInternships[0].id);
                }
            } catch (err) {
                setError((previous) =>
                    previous
                        ? `${previous} ${err.message}`
                        : err.message ||
                          "Unable to load internship applications."
                );
            } finally {
                setLoadingInternships(false);
            }
        };

        loadPageData();
    }, []);

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];

        // Allow selecting the same file again later.
        event.target.value = "";

        setMessage("");
        setError("");

        if (!file || uploading) {
            return;
        }

        if (!selectedInternshipId) {
            setError(
                "Please select an internship you have applied for before uploading."
            );
            return;
        }

        const lowerCaseName = file.name.toLowerCase();

        const isAllowedFile = ALLOWED_EXTENSIONS.some((extension) =>
            lowerCaseName.endsWith(extension)
        );

        if (!isAllowedFile) {
            setError(
                "Unsupported file type. Please select a PDF, Word document, image, text file, Excel spreadsheet, or PowerPoint presentation."
            );
            return;
        }

        if (file.size === 0) {
            setError("The selected file is empty.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("The maximum file size is 10 MB.");
            return;
        }

        const token = getToken();

        if (!token) {
            setError("Please log in again to upload documents.");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();

            formData.append("document", file);
            formData.append("type", selectedType);
            formData.append("internship_id", selectedInternshipId);

            const response = await fetch(
                `${API_URL}/documents/upload`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Document upload failed."
                );
            }

            if (!data.document?.id) {
                throw new Error(
                    "The server did not return the saved document record. Please check the backend."
                );
            }

            const selectedInternship = internships.find(
                (internship) =>
                    internship.id === String(selectedInternshipId)
            );

            const uploadedDocument = {
                id: data.document.id,
                name: data.document.originalName || file.name,
                filename: data.document.filename,
                type: data.document.type || selectedType,
                size: data.document.size ?? file.size,
                internshipId: String(selectedInternshipId),
                internshipTitle:
                    selectedInternship?.title || "Internship",
                addedAt: new Date().toLocaleDateString(),
            };

            setDocuments((previous) => [
                uploadedDocument,
                ...previous,
            ]);

            setMessage(`${file.name} uploaded successfully.`);
        } catch (err) {
            setError(
                err.message ||
                    "Upload failed. Please check that your backend is running."
            );
        } finally {
            setUploading(false);
        }
    };

    const openDocument = () => {
        setError(
            "Secure document downloading has not been connected yet. The download route must be implemented on the backend first."
        );
    };

    const removeDocument = () => {
        setError(
            "Secure document deletion has not been connected yet. The backend must verify ownership before deleting a document."
        );
    };

    const addPortfolioLink = (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        let normalizedUrl;

        try {
            normalizedUrl = new URL(portfolioUrl.trim());
        } catch {
            setError("Please enter a valid portfolio URL.");
            return;
        }

        if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
            setError("Portfolio links must use HTTP or HTTPS.");
            return;
        }

        if (
            portfolioLinks.some(
                (link) => link.url === normalizedUrl.href
            )
        ) {
            setError("This portfolio link has already been added.");
            return;
        }

        setPortfolioLinks((previous) => [
            ...previous,
            {
                id: crypto.randomUUID(),
                url: normalizedUrl.href,
            },
        ]);

        setPortfolioUrl("");
        setMessage("Portfolio link added successfully.");
    };

    const removePortfolioLink = (id) => {
        setPortfolioLinks((previous) =>
            previous.filter((link) => link.id !== id)
        );

        setMessage("Portfolio link removed.");
        setError("");
    };

    const formatSize = (bytes) => {
        if (!Number.isFinite(bytes) || bytes < 0) {
            return "Size unavailable";
        }

        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getTypeLabel = (type) =>
        documentTypes.find((item) => item.value === type)?.label ||
        "Other Document";

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
                {/* Page heading */}
                <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                            <ShieldCheck size={15} />
                            Student document center
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            My Documents
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                            Organize your CV, application letters,
                            certificates, and portfolio links in one
                            place before applying for internships.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="rounded-xl bg-teal-50 p-3 text-teal-800">
                            <FolderOpen size={24} />
                        </div>

                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {documents.length + portfolioLinks.length}
                            </p>

                            <p className="text-xs text-slate-500">
                                Documents and links
                            </p>
                        </div>
                    </div>
                </section>

                {/* Success message */}
                {message && (
                    <div
                        role="status"
                        className="mb-5 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"
                    >
                        <FileCheck2
                            className="mt-0.5 shrink-0"
                            size={18}
                        />

                        <p>{message}</p>

                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            className="ml-auto"
                            aria-label="Dismiss message"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                        <AlertCircle
                            className="mt-0.5 shrink-0"
                            size={18}
                        />

                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="ml-auto"
                            aria-label="Dismiss error"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Upload panel */}
                    <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-1">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                                <Upload size={22} />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Add a document
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Supported files up to 10 MB
                                </p>
                            </div>
                        </div>

                        <label
                            htmlFor="internshipSelect"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Related internship
                        </label>

                        <select
                            id="internshipSelect"
                            value={selectedInternshipId}
                            onChange={(event) =>
                                setSelectedInternshipId(event.target.value)
                            }
                            disabled={uploading || loadingInternships}
                            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
                        >
                            <option value="">
                                {loadingInternships
                                    ? "Loading applications..."
                                    : "Select an internship"}
                            </option>

                            {internships.map((internship) => (
                                <option
                                    key={internship.id}
                                    value={internship.id}
                                >
                                    {internship.title}
                                </option>
                            ))}
                        </select>

                        {!loadingInternships &&
                            internships.length === 0 && (
                                <p className="mb-4 text-xs leading-5 text-amber-700">
                                    No internship applications were found.
                                    Apply for an internship first. If you
                                    have already applied, check that the
                                    applications endpoint returns internship
                                    IDs and titles.
                                </p>
                            )}

                        <label
                            htmlFor="documentType"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Document category
                        </label>

                        <select
                            id="documentType"
                            value={selectedType}
                            disabled={uploading}
                            onChange={(event) =>
                                setSelectedType(event.target.value)
                            }
                            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
                        >
                            {documentTypes.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            disabled={
                                uploading ||
                                loadingInternships ||
                                !selectedInternshipId
                            }
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <div className="mb-3 rounded-full bg-white p-4 text-teal-800 shadow-sm">
                                <Upload size={25} />
                            </div>

                            <span className="font-semibold text-slate-800">
                                {uploading
                                    ? "Uploading document..."
                                    : "Choose a file"}
                            </span>

                            <span className="mt-2 text-xs text-slate-500">
                                {uploading
                                    ? "Please wait..."
                                    : "PDF, Word, images, Excel, PowerPoint, or text"}
                            </span>
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ALLOWED_EXTENSIONS.join(",")}
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                            aria-label="Choose a document"
                        />

                        <p className="mt-4 text-xs leading-5 text-slate-500">
                            Files are stored in private backend storage.
                            Saved document records are loaded from the
                            database. Secure downloading and permanent
                            deletion still need backend routes.
                        </p>
                    </section>

                    {/* Document library */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Document library
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your saved documents
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {documents.length} files
                            </span>
                        </div>

                        {loadingDocuments ? (
                            <div className="py-12 text-center text-sm text-slate-500">
                                Loading your saved documents...
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                    <FileText size={26} />
                                </div>

                                <h3 className="font-semibold text-slate-800">
                                    No documents uploaded yet
                                </h3>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    Upload your CV, application letter,
                                    or certificates to prepare for
                                    internship applications.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((document) => (
                                    <div
                                        key={document.id}
                                        className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                                                <FileText size={23} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="break-all font-semibold text-slate-800">
                                                    {document.name}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {getTypeLabel(document.type)}
                                                    {" · "}
                                                    {formatSize(document.size)}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Internship:{" "}
                                                    {document.internshipTitle}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Uploaded {document.addedAt}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={openDocument}
                                                title="Secure downloading is not connected yet"
                                                aria-label={`Download ${document.name}`}
                                                className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100"
                                            >
                                                <Download size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={removeDocument}
                                                title="Secure deletion is not connected yet"
                                                aria-label={`Delete ${document.name}`}
                                                className="rounded-lg border border-red-100 p-2.5 text-red-600 transition hover:bg-red-50"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Portfolio links */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                            <LinkIcon size={22} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-900">
                                Portfolio & professional links
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Share projects or professional work with
                                potential internship providers.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={addPortfolioLink}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="url"
                            value={portfolioUrl}
                            onChange={(event) =>
                                setPortfolioUrl(event.target.value)
                            }
                            placeholder="https://github.com/your-username"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                            aria-label="Portfolio URL"
                            required
                        />

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            <Plus size={18} />
                            Add link
                        </button>
                    </form>

                    {portfolioLinks.length > 0 && (
                        <div className="mt-5 space-y-3">
                            {portfolioLinks.map((link) => (
                                <div
                                    key={link.id}
                                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <LinkIcon
                                            size={18}
                                            className="shrink-0 text-teal-800"
                                        />

                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="break-all text-sm font-medium text-teal-800 hover:underline"
                                        >
                                            {link.url}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Open portfolio link"
                                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100"
                                        >
                                            <ExternalLink size={17} />
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePortfolioLink(link.id)
                                            }
                                            aria-label="Remove portfolio link"
                                            className="rounded-lg border border-red-100 p-2.5 text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="mt-4 text-xs text-slate-500">
                        Portfolio links are currently stored only in this
                        page's session. They are not yet saved permanently.
                    </p>
                </section>

                {/* Security notice */}
                <section className="mt-6 flex items-start gap-4 rounded-2xl border border-teal-100 bg-teal-50 p-5">
                    <ShieldCheck
                        size={24}
                        className="mt-0.5 shrink-0 text-teal-800"
                    />

                    <div>
                        <h3 className="font-bold text-teal-950">
                            Your documents deserve protection
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-teal-900">
                            Uploaded files are stored outside the public
                            frontend directory. The backend checks the
                            logged-in student's identity when retrieving
                            document records. Secure downloading, permanent
                            deletion, and authorized access for supervisors
                            and companies still need to be implemented.
                        </p>
                    </div>

                    <ArrowUpRight
                        size={19}
                        className="ml-auto hidden shrink-0 text-teal-800 sm:block"
                    />
                </section>
            </div>
        </main>
    );
}