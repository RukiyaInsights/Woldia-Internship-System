import { useEffect, useState } from "react";
import {
    MessageSquare,
    Send,
    RefreshCw,
    CheckCheck,
    UserRound,
    Building2,
    BriefcaseBusiness,
    Clock3,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Paperclip,
    Link as LinkIcon,
    FileText,
    Download,
    X,
    ExternalLink,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";

const API_URL = "https://woldia-internship-system.onrender.com";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
];

function SupervisorMessages() {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [internshipId, setInternshipId] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [messageText, setMessageText] = useState("");
    const [sharedLink, setSharedLink] = useState("");
    const [attachment, setAttachment] = useState(null);

    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [sendSuccess, setSendSuccess] = useState("");

    const [downloadingId, setDownloadingId] = useState(null);

    const token = localStorage.getItem("token");

    const getCurrentUserId = () => {
        try {
            if (!token) return null;

            return Number(
                JSON.parse(atob(token.split(".")[1])).id
            );
        } catch {
            return null;
        }
    };

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [messagesResponse, contactsResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/messages`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),

                    fetch(
                        `${API_URL}/api/internships/message-contacts`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                ]);

            const messagesData = await messagesResponse.json();
            const contactsData = await contactsResponse.json();

            if (!messagesResponse.ok) {
                throw new Error(
                    messagesData.message ||
                        "Failed to load messages."
                );
            }

            if (!contactsResponse.ok) {
                throw new Error(
                    contactsData.message ||
                        "Failed to load messaging contacts."
                );
            }

            setMessages(messagesData.messages || []);
            setContacts(contactsData.contacts || []);
        } catch (error) {
            console.error("Load messages error:", error);
            setError(error.message || "Failed to load messages.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token]);

    const handleInternshipChange = (event) => {
        const selectedInternshipId = event.target.value;

        setInternshipId(selectedInternshipId);

        const contact = contacts.find(
            (item) =>
                String(item.internship_id) ===
                selectedInternshipId
        );

        setReceiverId(
            contact ? String(contact.company_user_id) : ""
        );

        setSendError("");
        setSendSuccess("");
    };

    const handleAttachmentChange = (event) => {
        const file = event.target.files?.[0];

        setSendError("");
        setSendSuccess("");

        if (!file) {
            setAttachment(null);
            return;
        }

        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            setAttachment(null);
            event.target.value = "";

            setSendError(
                "Unsupported file type. Choose a PDF, Word, Excel, PowerPoint, TXT, CSV, or image file."
            );

            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setAttachment(null);
            event.target.value = "";

            setSendError("The maximum file size is 10 MB.");

            return;
        }

        setAttachment(file);
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();

        setSendError("");
        setSendSuccess("");

        const trimmedMessage = messageText.trim();
        const trimmedLink = sharedLink.trim();

        if (!internshipId || !receiverId) {
            setSendError(
                "Please select an internship before sending."
            );
            return;
        }

        if (!trimmedMessage && !trimmedLink && !attachment) {
            setSendError(
                "Write a message, attach a file, or share a link."
            );
            return;
        }

        if (trimmedLink) {
            try {
                const parsedLink = new URL(trimmedLink);

                if (
                    parsedLink.protocol !== "https:" &&
                    parsedLink.protocol !== "http:"
                ) {
                    throw new Error();
                }
            } catch {
                setSendError(
                    "Enter a valid web link beginning with http:// or https://."
                );
                return;
            }
        }

        try {
            setSending(true);

            const formData = new FormData();

            formData.append(
                "internship_id",
                String(Number(internshipId))
            );

            formData.append(
                "receiver_id",
                String(Number(receiverId))
            );

            formData.append("message", trimmedMessage);
            formData.append("shared_link", trimmedLink);

            if (attachment) {
                formData.append("attachment", attachment);
            }

            const response = await fetch(
                `${API_URL}/api/messages`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`,
                    },

                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to send message."
                );
            }

            setSendSuccess("Message sent successfully!");

            setMessageText("");
            setSharedLink("");
            setAttachment(null);

            const fileInput =
                document.getElementById(
                    "supervisor-message-attachment"
                );

            if (fileInput) {
                fileInput.value = "";
            }

            await loadData(true);
        } catch (error) {
            console.error("Send message error:", error);

            setSendError(
                error.message || "Failed to send message."
            );
        } finally {
            setSending(false);
        }
    };

    const handleDownloadAttachment = async (message) => {
        try {
            setDownloadingId(message.id);
            setError("");

            const response = await fetch(
                `${API_URL}/api/messages/${message.id}/attachment`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let errorMessage =
                    "Failed to download the attachment.";

                try {
                    const data = await response.json();
                    errorMessage = data.message || errorMessage;
                } catch {
                    // Keep the default download error.
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = objectUrl;
            link.download =
                message.attachment_name || "attachment";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Download attachment error:", error);

            setError(
                error.message || "Failed to download the attachment."
            );
        } finally {
            setDownloadingId(null);
        }
    };

    const handleMarkAsRead = async (messageId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/messages/${messageId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to mark message as read."
                );
            }

            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    Number(message.id) === Number(messageId)
                        ? { ...message, is_read: 1 }
                        : message
                )
            );
        } catch (error) {
            console.error("Mark as read error:", error);
            setError(error.message);
        }
    };

    const currentUserId = getCurrentUserId();

    const unreadCount = messages.filter(
        (message) =>
            !Number(message.is_read) &&
            Number(message.receiver_id) === currentUserId
    ).length;

    const selectedContact = contacts.find(
        (contact) =>
            String(contact.internship_id) ===
            String(internshipId)
    );

    if (loading) {
        return (
            <AppLayout>
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#C5AD8D]" />

                        <p className="text-sm font-medium text-slate-600">
                            Loading messages...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-[#F5F2ED] via-white to-[#EAE4DA] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1F3B] via-[#142E50] to-[#243B53] p-6 text-white shadow-xl sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5AD8D]/20 text-[#E5D3B3] ring-1 ring-[#C5AD8D]/40">
                                    <MessageSquare size={25} />
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Supervisor Communication
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                                    Communicate privately with
                                    companies about students
                                    assigned to you. Share
                                    documents and useful links
                                    securely.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />

                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                            <AlertCircle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">
                                    Something went wrong
                                </p>

                                <p className="mt-1 break-words text-sm">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Dismiss error"
                                className="rounded-lg p-1 hover:bg-red-100"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    )}

                    {/* Overview Cards */}
                    <div className="mb-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Conversations
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {contacts.length}
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C5AD8D]/20 text-[#705A3D]">
                                    <Building2 size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Messages
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {messages.length}
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3B]/10 text-[#0B1F3B]">
                                    <MessageSquare size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Unread
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {unreadCount}
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C5AD8D]/20 text-[#705A3D]">
                                    <Clock3 size={21} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                        {/* Send Message */}
                        <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#C5AD8D]/20 text-[#705A3D]">
                                    <Send size={20} />
                                </div>

                                <h2 className="text-xl font-bold text-slate-900">
                                    Send a Message
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                    Send text, documents, or
                                    links to the company
                                    connected to an assigned
                                    internship.
                                </p>
                            </div>

                            {contacts.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                                    <Building2
                                        size={28}
                                        className="mx-auto mb-3 text-slate-400"
                                    />

                                    <p className="text-sm font-medium text-slate-700">
                                        No company is available
                                        for messaging yet.
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Messaging becomes
                                        available when an
                                        internship is assigned.
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSendMessage}
                                    className="space-y-5"
                                >
                                    {/* Internship */}
                                    <div>
                                        <label
                                            htmlFor="supervisor-message-internship"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Internship
                                        </label>

                                        <div className="relative">
                                            <BriefcaseBusiness
                                                size={17}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                id="supervisor-message-internship"
                                                value={internshipId}
                                                onChange={handleInternshipChange}
                                                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#C5AD8D] focus:ring-4 focus:ring-[#C5AD8D]/20"
                                            >
                                                <option value="">
                                                    Select internship
                                                </option>

                                                {contacts.map((contact) => (
                                                    <option
                                                        key={contact.internship_id}
                                                        value={contact.internship_id}
                                                    >
                                                        {contact.internship_title}{" "}
                                                        — Company:{" "}
                                                        {contact.company_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Selected Company */}
                                    {selectedContact && (
                                        <div className="rounded-2xl border border-[#C5AD8D]/40 bg-[#F5F2ED] p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#705A3D] shadow-sm">
                                                    <Building2 size={18} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-[#705A3D]">
                                                        Sending to
                                                    </p>

                                                    <p className="mt-1 truncate font-semibold text-slate-900">
                                                        {selectedContact.company_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-600">
                                                        {selectedContact.internship_title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label
                                                htmlFor="supervisor-message-text"
                                                className="text-sm font-semibold text-slate-700"
                                            >
                                                Message
                                            </label>

                                            <span className="text-xs text-slate-400">
                                                {messageText.length}/1000
                                            </span>
                                        </div>

                                        <textarea
                                            id="supervisor-message-text"
                                            value={messageText}
                                            onChange={(event) =>
                                                setMessageText(
                                                    event.target.value
                                                )
                                            }
                                            maxLength={1000}
                                            placeholder="Write your message to the company..."
                                            rows={5}
                                            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#C5AD8D] focus:ring-4 focus:ring-[#C5AD8D]/20"
                                        />
                                    </div>

                                    {/* Shared Link */}
                                    <div>
                                        <label
                                            htmlFor="supervisor-shared-link"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Share a Link
                                            <span className="ml-2 font-normal text-slate-400">
                                                (optional)
                                            </span>
                                        </label>

                                        <div className="relative">
                                            <LinkIcon
                                                size={17}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                id="supervisor-shared-link"
                                                type="url"
                                                value={sharedLink}
                                                onChange={(event) =>
                                                    setSharedLink(
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={1000}
                                                placeholder="https://example.com/document"
                                                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#C5AD8D] focus:ring-4 focus:ring-[#C5AD8D]/20"
                                            />
                                        </div>

                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Use a complete HTTP or HTTPS link.
                                        </p>
                                    </div>

                                    {/* Attachment */}
                                    <div>
                                        <label
                                            htmlFor="supervisor-message-attachment"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Attach a File
                                            <span className="ml-2 font-normal text-slate-400">
                                                (optional)
                                            </span>
                                        </label>

                                        <label
                                            htmlFor="supervisor-message-attachment"
                                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#C5AD8D] hover:bg-[#F5F2ED]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#705A3D] shadow-sm">
                                                <Paperclip size={19} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Choose a file
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    PDF, Office documents,
                                                    TXT, CSV, or images.
                                                    Maximum 10 MB.
                                                </p>
                                            </div>
                                        </label>

                                        <input
                                            id="supervisor-message-attachment"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                                            onChange={handleAttachmentChange}
                                            className="sr-only"
                                        />

                                        {attachment && (
                                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                                <FileText
                                                    size={19}
                                                    className="shrink-0 text-emerald-700"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-emerald-800">
                                                        {attachment.name}
                                                    </p>

                                                    <p className="text-xs text-emerald-700">
                                                        {(
                                                            attachment.size /
                                                            (1024 * 1024)
                                                        ).toFixed(2)}{" "}
                                                        MB
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAttachment(null);

                                                        const input =
                                                            document.getElementById(
                                                                "supervisor-message-attachment"
                                                            );

                                                        if (input) {
                                                            input.value = "";
                                                        }
                                                    }}
                                                    aria-label="Remove attachment"
                                                    className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
                                                >
                                                    <X size={17} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Success */}
                                    {sendSuccess && (
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                            <CheckCircle2 size={18} />
                                            {sendSuccess}
                                        </div>
                                    )}

                                    {/* Send Error */}
                                    {sendError && (
                                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            <AlertCircle
                                                size={18}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <span>{sendError}</span>
                                        </div>
                                    )}

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0B1F3B] to-[#142E50] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Send size={17} />

                                        {sending
                                            ? "Sending..."
                                            : "Send Message"}
                                    </button>
                                </form>
                            )}

                            {/* Privacy */}
                            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#F5F2ED] p-4">
                                <ShieldCheck
                                    size={19}
                                    className="mt-0.5 shrink-0 text-[#8B7355]"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Private communication
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Messages and attachments are
                                        restricted to authorized
                                        supervisors and the company
                                        connected to the internship.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Message History */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Message History
                                    </h2>

                                    {messages.length > 0 && (
                                        <span className="rounded-full bg-[#C5AD8D]/25 px-2.5 py-1 text-xs font-bold text-[#705A3D]">
                                            {messages.length}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your private communication with
                                    companies, including shared files
                                    and links.
                                </p>
                            </div>

                            {messages.length === 0 ? (
                                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355] shadow-sm">
                                        <MessageSquare size={26} />
                                    </div>

                                    <h3 className="font-semibold text-slate-800">
                                        No messages yet
                                    </h3>

                                    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                        Your communication with
                                        internship companies will
                                        appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => {
                                        const isReceived =
                                            Number(message.receiver_id) ===
                                            currentUserId;

                                        const isUnread =
                                            isReceived &&
                                            !Number(message.is_read);

                                        return (
                                            <div
                                                key={message.id}
                                                className={`rounded-2xl border p-5 transition ${
                                                    isUnread
                                                        ? "border-[#C5AD8D]/60 bg-[#F5F2ED] shadow-sm"
                                                        : "border-slate-200 bg-slate-50/60"
                                                }`}
                                            >
                                                <div className="flex flex-col gap-4">
                                                    {/* Message Header */}
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                                    isReceived
                                                                        ? "bg-[#C5AD8D]/25 text-[#705A3D]"
                                                                        : "bg-[#0B1F3B]/10 text-[#0B1F3B]"
                                                                }`}
                                                            >
                                                                {isReceived ? (
                                                                    <Building2 size={18} />
                                                                ) : (
                                                                    <UserRound size={18} />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="break-words font-semibold text-slate-900">
                                                                    {message.sender_name}
                                                                </p>

                                                                <p className="mt-0.5 break-words text-xs text-slate-500">
                                                                    To:{" "}
                                                                    {message.receiver_name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <Clock3
                                                                size={14}
                                                                className="shrink-0"
                                                            />

                                                            <span>
                                                                {new Date(
                                                                    message.created_at
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Message Body */}
                                                    {message.message && (
                                                        <div className="rounded-xl bg-white p-4 shadow-sm">
                                                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                                                {message.message}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Attachment */}
                                                    {message.attachment_url && (
                                                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B]/10 text-[#0B1F3B]">
                                                                <FileText size={20} />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="break-words text-sm font-semibold text-slate-800">
                                                                    {message.attachment_name ||
                                                                        "Attached file"}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Shared attachment
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDownloadAttachment(
                                                                        message
                                                                    )
                                                                }
                                                                disabled={
                                                                    downloadingId ===
                                                                    message.id
                                                                }
                                                                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0B1F3B] transition hover:border-[#C5AD8D] hover:bg-[#F5F2ED] disabled:opacity-60"
                                                            >
                                                                <Download size={15} />

                                                                {downloadingId ===
                                                                message.id
                                                                    ? "Downloading..."
                                                                    : "Download"}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Shared Link */}
                                                    {message.shared_link && (
                                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
                                                                <LinkIcon size={17} />
                                                                Shared Link
                                                            </div>

                                                            <a
                                                                href={
                                                                    message.shared_link
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex max-w-full items-center gap-2 break-all text-sm text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                                            >
                                                                <span className="break-all">
                                                                    {message.shared_link}
                                                                </span>

                                                                <ExternalLink
                                                                    size={14}
                                                                    className="shrink-0"
                                                                />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Footer */}
                                                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <BriefcaseBusiness size={14} />

                                                                <span className="font-medium">
                                                                    {message.internship_title}
                                                                </span>
                                                            </div>

                                                            <div className="mt-2 flex items-center gap-2">
                                                                {Number(
                                                                    message.is_read
                                                                ) ? (
                                                                    <>
                                                                        <CheckCheck
                                                                            size={15}
                                                                            className="text-emerald-600"
                                                                        />

                                                                        <span className="text-xs font-semibold text-emerald-600">
                                                                            Read
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="h-2 w-2 rounded-full bg-[#C5AD8D]" />

                                                                        <span className="text-xs font-semibold text-[#8B7355]">
                                                                            {isReceived
                                                                                ? "Unread"
                                                                                : "Sent"}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isUnread && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleMarkAsRead(
                                                                        message.id
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-[#C5AD8D] hover:text-[#705A3D]"
                                                            >
                                                                <CheckCheck size={15} />
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default SupervisorMessages;