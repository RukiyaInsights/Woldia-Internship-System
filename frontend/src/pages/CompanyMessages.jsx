import { useEffect, useState } from "react";
import {
    MessageSquare,
    Send,
    UserRound,
    BriefcaseBusiness,
    CheckCheck,
    AlertCircle,
    RefreshCw,
    ShieldCheck,
    Mail,
    MessageCircle,
    Sparkles,
    LockKeyhole,
    Paperclip,
    Link as LinkIcon,
    Download,
    ExternalLink,
    X,
    FileText
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_URL = "http://localhost:5000";

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
    ".jpeg"
];

function CompanyMessages() {
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

    const token = localStorage.getItem("token");

    const getCurrentUserId = () => {
        try {
            if (!token) return null;

            const payload = JSON.parse(
                atob(token.split(".")[1])
            );

            return Number(payload.id);
        } catch {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    const loadData = async (showRefresh = false) => {
        try {
            if (showRefresh) {
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
                    messagesData.message || "Failed to load messages."
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
            console.error(error);

            setError(
                error.message || "Unable to load messages."
            );
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
        setSendError("");
        setSendSuccess("");

        const contact = contacts.find(
            (item) =>
                String(item.internship_id) === selectedInternshipId
        );

        setReceiverId(
            contact ? String(contact.supervisor_user_id) : ""
        );
    };

    const handleAttachmentChange = (event) => {
        const file = event.target.files?.[0];

        setSendError("");
        setSendSuccess("");

        if (!file) {
            setAttachment(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setAttachment(null);
            event.target.value = "";

            setSendError("The maximum file size is 10 MB.");
            return;
        }

        const lastDot = file.name.lastIndexOf(".");
        const extension =
            lastDot >= 0
                ? file.name.substring(lastDot).toLowerCase()
                : "";

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            setAttachment(null);
            event.target.value = "";

            setSendError(
                "Unsupported file type. Choose PDF, Word, Excel, PowerPoint, TXT, CSV, PNG, JPG, or JPEG."
            );
            return;
        }

        setAttachment(file);
    };

    const clearAttachment = () => {
        setAttachment(null);

        const input = document.getElementById(
            "company-message-attachment"
        );

        if (input) {
            input.value = "";
        }
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();

        setSendError("");
        setSendSuccess("");

        if (!internshipId || !receiverId) {
            setSendError("Please select an internship.");
            return;
        }

        if (
            !messageText.trim() &&
            !sharedLink.trim() &&
            !attachment
        ) {
            setSendError(
                "Write a message, attach a file, or share a link."
            );
            return;
        }

        if (sharedLink.trim()) {
            try {
                const parsedLink = new URL(sharedLink.trim());

                if (
                    parsedLink.protocol !== "http:" &&
                    parsedLink.protocol !== "https:"
                ) {
                    throw new Error();
                }
            } catch {
                setSendError(
                    "Enter a valid web link starting with https:// or http://."
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

            formData.append("message", messageText.trim());
            formData.append("shared_link", sharedLink.trim());

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

            setSendSuccess("Message sent successfully.");

            setMessageText("");
            setSharedLink("");
            clearAttachment();

            await loadData();
        } catch (error) {
            console.error(error);

            setSendError(
                error.message || "Unable to send message."
            );
        } finally {
            setSending(false);
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
                    data.message || "Failed to mark message as read."
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
            console.error(error);

            setError(
                error.message || "Unable to update message."
            );
        }
    };

    const handleDownload = async (message) => {
        try {
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
                let errorMessage = "Unable to download attachment.";

                try {
                    const data = await response.json();
                    errorMessage = data.message || errorMessage;
                } catch {
                    // Keep the default error message.
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
            console.error(error);

            setError(
                error.message || "Unable to download attachment."
            );
        }
    };

    const unreadCount = messages.filter(
        (message) =>
            !message.is_read &&
            Number(message.receiver_id) === currentUserId
    ).length;

    const selectedContact = contacts.find(
        (contact) =>
            String(contact.internship_id) === String(internshipId)
    );

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-11 w-11 rounded-full border-4 border-[#D8D0C7] border-t-[#8B7355] animate-spin" />

                        <p className="mt-4 font-semibold text-[#0B1F3B]">
                            Loading messages...
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Preparing your private communication workspace
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-8">

                {/* HERO */}
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0B1F3B] shadow-[0_20px_55px_rgba(11,31,59,0.16)]">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B7355]/20 blur-3xl" />
                    <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#1E3A6F]/40 blur-3xl" />

                    <div className="relative z-10 p-7 sm:p-9 lg:p-11">
                        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7CEC4]">
                                    <Sparkles
                                        size={15}
                                        className="text-[#C5AD8D]"
                                    />
                                    Company Communication
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.7rem]">
                                    Private Messages
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D7CEC4] sm:text-base">
                                    Communicate privately with the university
                                    supervisor assigned to your internship.
                                    Send messages, share files, and exchange
                                    useful links in one workspace.
                                </p>
                            </div>

                            <div className="relative flex h-28 w-28 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5">
                                <div className="absolute inset-3 rounded-[1.4rem] border border-[#C5AD8D]/20" />
                                <MessageSquare
                                    size={46}
                                    strokeWidth={1.4}
                                    className="relative text-[#C5AD8D]"
                                />
                                <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B7355] text-white shadow-lg">
                                    <ShieldCheck size={19} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#D7CEC4]">
                                <LockKeyhole
                                    size={15}
                                    className="text-[#C5AD8D]"
                                />
                                Authorized communication only
                            </div>

                            <button
                                type="button"
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B7355] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#765F46] disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                Refresh
                            </button>
                        </div>
                    </div>
                </section>

                {/* STATISTICS */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Conversations",
                            value: contacts.length,
                            description: "Assigned supervisors",
                            icon: BriefcaseBusiness,
                        },
                        {
                            label: "Total Messages",
                            value: messages.length,
                            description: "Internship communication",
                            icon: MessageCircle,
                        },
                        {
                            label: "Unread",
                            value: unreadCount,
                            description: "Messages awaiting review",
                            icon: Mail,
                        },
                    ].map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-[#D8D0C7] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {stat.label}
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-[#0B1F3B]">
                                            {stat.value}
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-[#8B7355]">
                                            {stat.description}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                        <Icon size={21} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* ERROR */}
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle size={20} className="mt-0.5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Something went wrong
                            </p>

                            <p className="mt-1 text-sm">{error}</p>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                className="mt-2 text-xs font-semibold underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* MAIN MESSAGING AREA */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">

                    {/* COMPOSE MESSAGE */}
                    <div className="overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white shadow-sm xl:col-span-2">
                        <div className="border-b border-[#E7E2DC] bg-[#F8F7F4] p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                    <Send size={21} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#0B1F3B]">
                                        New Message
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Send a message, file, or link
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {contacts.length === 0 ? (
                                <div className="py-10 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                                        <ShieldCheck size={27} />
                                    </div>

                                    <h3 className="mt-4 font-bold text-[#0B1F3B]">
                                        No Supervisor Assigned
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Messaging becomes available after
                                        a university supervisor is assigned
                                        to your internship.
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSendMessage}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0B1F3B]">
                                            Internship
                                        </label>

                                        <select
                                            value={internshipId}
                                            onChange={handleInternshipChange}
                                            required
                                            className="w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm text-[#0B1F3B] outline-none focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10"
                                        >
                                            <option value="">
                                                Select internship
                                            </option>

                                            {contacts.map((contact) => (
                                                <option
                                                    key={contact.internship_id}
                                                    value={contact.internship_id}
                                                >
                                                    {contact.internship_title}
                                                    {" — Supervisor: "}
                                                    {contact.supervisor_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedContact && (
                                        <div className="flex items-center gap-3 rounded-xl border border-[#C5AD8D]/40 bg-[#F5F2ED] p-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B1F3B] text-[#C5AD8D]">
                                                <UserRound size={19} />
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
                                                    Sending to
                                                </p>

                                                <p className="mt-0.5 text-sm font-bold text-[#0B1F3B]">
                                                    {selectedContact.supervisor_name}
                                                </p>
                                            </div>

                                            <ShieldCheck
                                                size={17}
                                                className="ml-auto text-[#8B7355]"
                                            />
                                        </div>
                                    )}

                                    {/* MESSAGE */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0B1F3B]">
                                            Message
                                        </label>

                                        <textarea
                                            value={messageText}
                                            onChange={(event) =>
                                                setMessageText(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Write a message about the internship..."
                                            rows={5}
                                            className="w-full resize-y rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm text-[#0B1F3B] outline-none placeholder:text-slate-400 focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10"
                                        />
                                    </div>

                                    {/* FILE ATTACHMENT */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0B1F3B]">
                                            Attach a File
                                        </label>

                                        <label
                                            htmlFor="company-message-attachment"
                                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#C5AD8D] bg-[#F8F7F4] p-4 transition hover:bg-[#F5F2ED]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8B7355]">
                                                <Paperclip size={20} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#0B1F3B]">
                                                    Choose a file
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    PDF, Office documents,
                                                    TXT, CSV, or images · Max 10 MB
                                                </p>
                                            </div>
                                        </label>

                                        <input
                                            id="company-message-attachment"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                                            onChange={handleAttachmentChange}
                                            className="sr-only"
                                        />

                                        {attachment && (
                                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#D8D0C7] p-3">
                                                <FileText
                                                    size={20}
                                                    className="shrink-0 text-[#8B7355]"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-[#0B1F3B]">
                                                        {attachment.name}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {(
                                                            attachment.size /
                                                            1024 /
                                                            1024
                                                        ).toFixed(2)}{" "}
                                                        MB
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={clearAttachment}
                                                    aria-label="Remove attachment"
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* SHARE LINK */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0B1F3B]">
                                            Share a Link
                                        </label>

                                        <div className="flex items-center gap-2 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-3 focus-within:border-[#8B7355] focus-within:ring-4 focus-within:ring-[#8B7355]/10">
                                            <LinkIcon
                                                size={18}
                                                className="shrink-0 text-[#8B7355]"
                                            />

                                            <input
                                                type="url"
                                                value={sharedLink}
                                                onChange={(event) =>
                                                    setSharedLink(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="https://example.com/document"
                                                className="w-full bg-transparent py-3 text-sm text-[#0B1F3B] outline-none placeholder:text-slate-400"
                                            />
                                        </div>

                                        <p className="mt-2 text-xs text-slate-400">
                                            Use a complete HTTP or HTTPS link.
                                            Make sure the recipient has permission
                                            to access it.
                                        </p>
                                    </div>

                                    {sendError && (
                                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                            <AlertCircle
                                                size={18}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <p className="text-sm">
                                                {sendError}
                                            </p>
                                        </div>
                                    )}

                                    {sendSuccess && (
                                        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                                            <CheckCheck
                                                size={18}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <p className="text-sm font-medium">
                                                {sendSuccess}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            sending ||
                                            !internshipId ||
                                            !receiverId ||
                                            (
                                                !messageText.trim() &&
                                                !sharedLink.trim() &&
                                                !attachment
                                            )
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E3A6F] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* MESSAGE HISTORY */}
                    <div className="overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white shadow-sm xl:col-span-3">
                        <div className="border-b border-[#E7E2DC] bg-[#F8F7F4] p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                        <MessageSquare size={21} />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-[#0B1F3B]">
                                            Message History
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Messages, files, and shared links
                                        </p>
                                    </div>
                                </div>

                                {messages.length > 0 && (
                                    <span className="hidden items-center rounded-full bg-[#F5F2ED] px-3 py-1.5 text-xs font-semibold text-[#8B7355] sm:inline-flex">
                                        {messages.length} messages
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {messages.length === 0 ? (
                                <div className="py-14 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                                        <MessageSquare size={30} />
                                    </div>

                                    <h3 className="mt-5 text-lg font-bold text-[#0B1F3B]">
                                        No messages yet
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                        Your private conversation with the
                                        university supervisor will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-[800px] space-y-5 overflow-y-auto pr-1">
                                    {messages.map((message) => {
                                        const isMine =
                                            Number(message.sender_id) ===
                                            currentUserId;

                                        const isUnread =
                                            !message.is_read &&
                                            Number(message.receiver_id) ===
                                            currentUserId;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`rounded-2xl border p-5 transition ${
                                                    isUnread
                                                        ? "border-[#C5AD8D] bg-[#F5F2ED]"
                                                        : "border-[#D8D0C7] bg-white"
                                                }`}
                                            >
                                                {/* MESSAGE HEADER */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                                isMine
                                                                    ? "bg-[#0B1F3B] text-[#C5AD8D]"
                                                                    : "bg-[#F5F2ED] text-[#8B7355]"
                                                            }`}
                                                        >
                                                            <UserRound size={18} />
                                                        </div>

                                                        <div>
                                                            <p className="font-bold text-[#0B1F3B]">
                                                                {isMine
                                                                    ? "You"
                                                                    : message.sender_name}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {new Date(
                                                                    message.created_at
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {isUnread ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                            Unread
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F2ED] px-2.5 py-1 text-xs font-medium text-slate-500">
                                                            <CheckCheck size={13} />
                                                            {isMine ? "Sent" : "Read"}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* INTERNSHIP */}
                                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                                                    <BriefcaseBusiness
                                                        size={14}
                                                        className="text-[#8B7355]"
                                                    />

                                                    <span>
                                                        {message.internship_title}
                                                    </span>
                                                </div>

                                                {/* MESSAGE TEXT */}
                                                {message.message && (
                                                    <div className="mt-4 rounded-xl border border-[#E7E2DC] bg-[#F8F7F4] p-4">
                                                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                                            {message.message}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* ATTACHMENT */}
                                                {message.attachment_url && (
                                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#D8D0C7] bg-white p-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                                            <FileText size={20} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="break-words text-sm font-semibold text-[#0B1F3B]">
                                                                {message.attachment_name ||
                                                                    "Shared attachment"}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {message.attachment_type ||
                                                                    "File attachment"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDownload(message)
                                                            }
                                                            title="Download attachment"
                                                            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0B1F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1E3A6F]"
                                                        >
                                                            <Download size={15} />
                                                            <span className="hidden sm:inline">
                                                                Download
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}

                                                {/* SHARED LINK */}
                                                {message.shared_link && (
                                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#C5AD8D]/50 bg-[#F5F2ED] p-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8B7355]">
                                                            <LinkIcon size={20} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
                                                                Shared Link
                                                            </p>

                                                            <a
                                                                href={message.shared_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-1 block break-all text-sm font-medium text-blue-700 underline hover:text-blue-900"
                                                            >
                                                                {message.shared_link}
                                                            </a>
                                                        </div>

                                                        <ExternalLink
                                                            size={17}
                                                            className="shrink-0 text-[#8B7355]"
                                                        />
                                                    </div>
                                                )}

                                                {/* FOOTER */}
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                    <p className="text-xs text-slate-400">
                                                        To:{" "}
                                                        <span className="font-medium text-slate-600">
                                                            {isMine
                                                                ? message.receiver_name
                                                                : "You"}
                                                        </span>
                                                    </p>

                                                    {isUnread && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleMarkAsRead(
                                                                    message.id
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C5AD8D] bg-white px-3 py-2 text-xs font-semibold text-[#0B1F3B] transition hover:bg-[#F5F2ED]"
                                                        >
                                                            <CheckCheck size={14} />
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* PRIVACY NOTICE */}
                <section className="flex items-start gap-4 rounded-2xl border border-[#D8D0C7] bg-[#F5F2ED] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                        <ShieldCheck size={20} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-[#0B1F3B]">
                            Private Communication
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Messages and attachments are restricted to
                            authorized company and university supervisor
                            participants connected to the internship.
                            Shared links may have their own access
                            permissions, depending on the external service.
                        </p>
                    </div>
                </section>

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-3 pb-2 text-xs text-slate-400">
                    <div className="h-px w-12 bg-[#D8D0C7]" />

                    <span>Woldia University Internship System</span>

                    <div className="h-px w-12 bg-[#D8D0C7]" />
                </div>
            </div>
        </AppLayout>
    );
}

export default CompanyMessages;