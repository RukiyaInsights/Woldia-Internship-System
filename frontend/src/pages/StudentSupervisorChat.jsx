import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    MessageSquare,
    Send,
    Paperclip,
    Link2,
    Download,
    RefreshCw,
    ArrowLeft,
    User,
    FileText,
    ShieldCheck,
    AlertCircle,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_BASE_URL = "https://woldia-internship-system.onrender.com/api";

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        ""
    );
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();

    return { message: text || "An unexpected server response occurred." };
}

function StudentSupervisorChat() {
    const user = getUser();
    const role = user?.role;

    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);

    const [message, setMessage] = useState("");
    const [sharedLink, setSharedLink] = useState("");
    const [attachment, setAttachment] = useState(null);

    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = getToken();

    const isStudent = role === "student";
    const isSupervisor = role === "supervisor";
    const validRole = isStudent || isSupervisor;

    const pageTitle = isStudent
    ? "Share Files with Supervisor"
    : "Student File Sharing";
    const loadContacts = useCallback(async () => {
        if (!token || !validRole) {
            setError(
                "Please sign in using your student or supervisor account."
            );
            setLoadingContacts(false);
            return;
        }

        setLoadingContacts(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/student-supervisor-messages/contacts`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load assigned contacts."
                );
            }

            const items = Array.isArray(data) ? data : [];

            setContacts(items);

            setSelectedContact((previous) => {
                if (!items.length) {
                    return null;
                }

                if (previous) {
                    const stillExists = items.find(
                        (item) =>
                            Number(item.contact_user_id) ===
                                Number(previous.contact_user_id) &&
                            Number(item.internship_id) ===
                                Number(previous.internship_id)
                    );

                    if (stillExists) {
                        return stillExists;
                    }
                }

                return items[0];
            });
        } catch (err) {
            console.error("Load chat contacts error:", err);
            setError(err.message || "Unable to load chat contacts.");
        } finally {
            setLoadingContacts(false);
        }
    }, [token, validRole]);

    const loadMessages = useCallback(
        async (showLoading = true) => {
            if (!selectedContact || !token) {
                setMessages([]);
                return;
            }

            if (showLoading) {
                setLoadingMessages(true);
            }

            try {
                const params = new URLSearchParams({
                    contact_id: String(selectedContact.contact_user_id),
                    internship_id: String(selectedContact.internship_id),
                });

                const response = await fetch(
                    `${API_BASE_URL}/student-supervisor-messages?${params}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await readResponse(response);

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load messages."
                    );
                }

                if (Array.isArray(data)) {
                    setMessages(data);
                    setError("");
                } else {
                    throw new Error("The server returned an invalid message list.");
                }
            } catch (err) {
                console.error("Load messages error:", err);
                setError(err.message || "Unable to load messages.");
            } finally {
                if (showLoading) {
                    setLoadingMessages(false);
                }
            }
        },
        [selectedContact, token]
    );

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    useEffect(() => {
        setMessages([]);
        setError("");

        if (!selectedContact) {
            return undefined;
        }

        loadMessages(true);

        // Refresh this conversation to show messages from the other person.
        const interval = window.setInterval(() => {
            loadMessages(false);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [selectedContact, loadMessages]);

    const handleSend = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedContact) {
            setError("Select an assigned contact first.");
            return;
        }

        if (
            !message.trim() &&
            !sharedLink.trim() &&
            !attachment
        ) {
            setError("Write a message about your files, add a link, or attach a document.");
            return;
        }

        if (sharedLink.trim()) {
            try {
                const parsed = new URL(sharedLink.trim());

                if (!["http:", "https:"].includes(parsed.protocol)) {
                    throw new Error("Invalid protocol");
                }
            } catch {
                setError("Enter a valid link starting with https:// or http://.");
                return;
            }
        }

        if (attachment && attachment.size > 10 * 1024 * 1024) {
            setError("The maximum document size is 10 MB.");
            return;
        }

        const formData = new FormData();

        formData.append(
            "internship_id",
            String(selectedContact.internship_id)
        );

        formData.append(
            "receiver_id",
            String(selectedContact.contact_user_id)
        );

        formData.append("message", message.trim());
        formData.append("shared_link", sharedLink.trim());

        if (attachment) {
            formData.append("attachment", attachment);
        }

        setSending(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/student-supervisor-messages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Failed to send message.");
            }

            setMessage("");
            setSharedLink("");
            setAttachment(null);

            const fileInput = document.getElementById(
                "student-supervisor-attachment"
            );

            if (fileInput) {
                fileInput.value = "";
            }

            setSuccess("Message sent successfully.");

            await loadMessages(false);
        } catch (err) {
            console.error("Send message error:", err);
            setError(err.message || "Unable to send your message.");
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async (item) => {
        setError("");
        setDownloading(item.id);

        try {
            const response = await fetch(
                `${API_BASE_URL}/student-supervisor-messages/${item.id}/attachment`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await readResponse(response);

                throw new Error(
                    data.message || "Unable to download the attachment."
                );
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");

            downloadLink.href = objectUrl;
            downloadLink.download =
                item.attachment_name || "shared-document";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(objectUrl);
            }, 1000);
        } catch (err) {
            console.error("Download attachment error:", err);
            setError(err.message || "Unable to download the attachment.");
        } finally {
            setDownloading(null);
        }
    };

    if (!validRole) {
        return (
            <AppLayout>
                <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
                    <AlertCircle className="mb-3 text-red-600" size={30} />

                    <h1 className="text-xl font-bold text-[#0B1F3B]">
                        Access restricted
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        This messaging page is available only to students
                        and supervisors.
                    </p>

                    <Link
                        to="/dashboard"
                        className="mt-5 inline-flex rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-semibold text-white"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="mx-auto max-w-7xl space-y-6 pb-10">
                {/* HEADER */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F3B] via-[#10294B] to-[#1E3A6F] p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#C5AD8D]/15 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Link
                                to={isStudent ? "/student" : "/supervisor"}
                                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                            >
                                <ArrowLeft size={16} />
                                Back to Dashboard
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-[#8B7355] p-3">
                                    <MessageSquare size={25} />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold sm:text-3xl">
                                        {pageTitle}
                                    </h1>

                                    <p className="mt-2 text-sm text-slate-300">
                                        Share messages, documents, and useful links.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                loadContacts();
                                loadMessages(true);
                            }}
                            disabled={loadingContacts || loadingMessages}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loadingContacts || loadingMessages
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {/* STATUS MESSAGES */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                    >
                        {success}
                    </div>
                )}

                {/* CHAT LAYOUT */}
                <section className="grid min-h-[620px] gap-5 lg:grid-cols-3">
                    {/* CONTACT LIST */}
                    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5">
                            <h2 className="font-bold text-[#0B1F3B]">
                                {isStudent
                                    ? "My Supervisors"
                                    : "My Assigned Students"}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Only assigned contacts are shown.
                            </p>
                        </div>

                        <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
                            {loadingContacts ? (
                                <div className="p-6 text-center text-sm text-slate-500">
                                    Loading contacts...
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="rounded-xl bg-[#F8F7F4] p-5 text-center">
                                    <User
                                        size={28}
                                        className="mx-auto text-[#8B7355]"
                                    />

                                    <p className="mt-3 text-sm font-semibold text-[#0B1F3B]">
                                        No assigned contacts
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Your assigned conversation will appear
                                        here once an assignment exists.
                                    </p>
                                </div>
                            ) : (
                                contacts.map((contact, index) => {
                                    const isSelected =
                                        Number(
                                            selectedContact?.contact_user_id
                                        ) ===
                                            Number(contact.contact_user_id) &&
                                        Number(
                                            selectedContact?.internship_id
                                        ) === Number(contact.internship_id);

                                    return (
                                        <button
                                            type="button"
                                            key={`${contact.contact_user_id}-${contact.internship_id}-${index}`}
                                            onClick={() => {
                                                setSelectedContact(contact);
                                                setSuccess("");
                                            }}
                                            className={`w-full rounded-xl border p-4 text-left transition ${
                                                isSelected
                                                    ? "border-[#C5AD8D] bg-[#F5F2ED]"
                                                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                                    <User size={20} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words text-sm font-bold text-[#0B1F3B]">
                                                        {contact.contact_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {contact.internship_name}
                                                    </p>

                                                    <p className="mt-2 text-[11px] text-slate-400">
                                                        Internship #
                                                        {contact.internship_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* CONVERSATION */}
                    <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        {/* CONVERSATION HEADER */}
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-[#F8F7F4] p-4 sm:p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                <MessageSquare size={21} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="break-words font-bold text-[#0B1F3B]">
                                    {selectedContact?.contact_name ||
                                        "Select a contact"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedContact
                                        ? selectedContact.internship_name
                                        : "Choose a contact to begin"}
                                </p>
                            </div>
                        </div>

                        {/* MESSAGE HISTORY */}
                        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4 sm:p-6">
                            {!selectedContact ? (
                                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                                    <MessageSquare
                                        size={40}
                                        className="text-[#C5AD8D]"
                                    />

                                    <p className="mt-4 font-semibold text-[#0B1F3B]">
                                        Your conversation starts here
                                    </p>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Select an assigned contact from the list.
                                    </p>
                                </div>
                            ) : loadingMessages ? (
                                <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
                                    Loading conversation...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                                    <MessageSquare
                                        size={38}
                                        className="text-[#C5AD8D]"
                                    />

                                    <p className="mt-4 font-semibold text-[#0B1F3B]">
                                        No messages yet
                                    </p>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Send a message or share a document to begin.
                                    </p>
                                </div>
                            ) : (
                                messages.map((item) => {
                                    const isMine =
                                        Number(item.sender_id) === Number(user?.id);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex ${
                                                isMine
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >
                                            <div
                                                className={`w-full max-w-[90%] rounded-2xl border p-4 sm:max-w-[80%] ${
                                                    isMine
                                                        ? "border-[#0B1F3B] bg-[#0B1F3B] text-white"
                                                        : "border-slate-200 bg-[#F8F7F4] text-slate-700"
                                                }`}
                                            >
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <span
                                                        className={`text-xs font-bold ${
                                                            isMine
                                                                ? "text-[#C5AD8D]"
                                                                : "text-[#8B7355]"
                                                        }`}
                                                    >
                                                        {isMine
                                                            ? "You"
                                                            : contactName(selectedContact)}
                                                    </span>

                                                    <span
                                                        className={`text-[10px] ${
                                                            isMine
                                                                ? "text-slate-300"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        {item.created_at
                                                            ? new Date(
                                                                  item.created_at
                                                              ).toLocaleString()
                                                            : ""}
                                                    </span>
                                                </div>

                                                {item.message && (
                                                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                                        {item.message}
                                                    </p>
                                                )}

                                                {item.shared_link && (
                                                    <a
                                                        href={item.shared_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`mt-3 flex items-start gap-2 break-all text-sm underline ${
                                                            isMine
                                                                ? "text-[#E8DFD4]"
                                                                : "text-blue-700"
                                                        }`}
                                                    >
                                                        <Link2
                                                            size={16}
                                                            className="mt-0.5 shrink-0"
                                                        />
                                                        {item.shared_link}
                                                    </a>
                                                )}

                                                {item.attachment_name && (
                                                    <div
                                                        className={`mt-3 rounded-xl border p-3 ${
                                                            isMine
                                                                ? "border-white/20 bg-white/10"
                                                                : "border-slate-200 bg-white"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FileText
                                                                size={21}
                                                                className={
                                                                    isMine
                                                                        ? "text-[#C5AD8D]"
                                                                        : "text-[#8B7355]"
                                                                }
                                                            />

                                                            <div className="min-w-0 flex-1">
                                                                <p className="break-all text-xs font-semibold">
                                                                    {item.attachment_name}
                                                                </p>

                                                                <p
                                                                    className={`mt-1 text-[10px] ${
                                                                        isMine
                                                                            ? "text-slate-300"
                                                                            : "text-slate-400"
                                                                    }`}
                                                                >
                                                                    Shared attachment
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDownload(
                                                                        item
                                                                    )
                                                                }
                                                                disabled={
                                                                    downloading ===
                                                                    item.id
                                                                }
                                                                title="Download document"
                                                                className={`rounded-lg p-2 transition ${
                                                                    isMine
                                                                        ? "bg-white/10 hover:bg-white/20"
                                                                        : "bg-[#F5F2ED] hover:bg-[#E8DFD4]"
                                                                } disabled:opacity-50`}
                                                            >
                                                                {downloading ===
                                                                item.id ? (
                                                                    <RefreshCw
                                                                        size={17}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <Download
                                                                        size={17}
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* MESSAGE COMPOSER */}
                        <form
                            onSubmit={handleSend}
                            className="space-y-4 border-t border-slate-100 bg-[#FAF9F7] p-4 sm:p-5"
                        >
                            <textarea
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                rows={3}
                                maxLength={5000}
                                disabled={!selectedContact || sending}
                                placeholder="Write your message..."
                                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8B7355] focus:ring-4 focus:ring-[#C5AD8D]/20 disabled:bg-slate-100"
                            />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                    <Link2
                                        size={18}
                                        className="shrink-0 text-[#8B7355]"
                                    />

                                    <input
                                        type="url"
                                        value={sharedLink}
                                        onChange={(event) =>
                                            setSharedLink(event.target.value)
                                        }
                                        disabled={!selectedContact || sending}
                                        placeholder="https://example.com"
                                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                    />
                                </div>

                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-[#C5AD8D]">
                                    <Paperclip
                                        size={18}
                                        className="shrink-0 text-[#8B7355]"
                                    />

                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                                        {attachment
                                            ? attachment.name
                                            : "Attach a document"}
                                    </span>

                                    <input
                                        id="student-supervisor-attachment"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                                        disabled={!selectedContact || sending}
                                        onChange={(event) =>
                                            setAttachment(
                                                event.target.files?.[0] || null
                                            )
                                        }
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <ShieldCheck
                                        size={16}
                                        className="shrink-0 text-emerald-600"
                                    />

                                    Private conversation · Maximum file size 10 MB
                                </div>

                                <button
                                    type="submit"
                                    disabled={!selectedContact || sending}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#1E3A6F] disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {sending ? (
                                        <RefreshCw
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Send size={17} />
                                    )}

                                    {sending ? "Sending..." : "Send Message"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

function contactName(contact) {
    return contact?.contact_name || "Assigned contact";
}

export default StudentSupervisorChat;