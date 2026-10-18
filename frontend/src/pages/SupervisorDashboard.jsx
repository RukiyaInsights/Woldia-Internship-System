import { useEffect, useState } from "react";
import {
    Users,
    FileText,
    Clock3,
    CheckCircle2,
    User,
    Mail,
    GraduationCap,
    Phone,
    Briefcase,
    Building2,
    MessageSquare,
    Send,
    CalendarDays,
    ClipboardCheck,
    AlertCircle,
    Sparkles,
    ShieldCheck,
    ChevronRight,
    Paperclip,
    ExternalLink,
    Download,
    RefreshCw,
    X
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_BASE = "http://localhost:5000/api/supervisor";

function SupervisorDashboard() {
    const [students, setStudents] = useState([]);
    const [reports, setReports] = useState([]);
    const [feedbackText, setFeedbackText] = useState({});
    const [feedbackMessage, setFeedbackMessage] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingReport, setDownloadingReport] = useState(null);

    // In-app attachment download notifications
    const [downloadMessage, setDownloadMessage] = useState("");
    const [downloadMessageType, setDownloadMessageType] = useState("error");

    const getToken = () => localStorage.getItem("token");

    const fetchDashboardData = async () => {
        try {
            const token = getToken();

            if (!token) {
                setError("You are not logged in.");
                setLoading(false);
                return;
            }

            const [studentsResponse, reportsResponse] = await Promise.all([
                fetch(`${API_BASE}/students`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                fetch(`${API_BASE}/reports`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const studentsData = await studentsResponse.json();
            const reportsData = await reportsResponse.json();

            if (!studentsResponse.ok) {
                throw new Error(
                    studentsData.message ||
                        "Failed to load assigned students."
                );
            }

            if (!reportsResponse.ok) {
                throw new Error(
                    reportsData.message ||
                        "Failed to load progress reports."
                );
            }

            setStudents(studentsData.students || []);
            setReports(reportsData.reports || []);
            setError("");
        } catch (error) {
            console.error("Fetch supervisor dashboard error:", error);

            setError(
                error.message || "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const submitFeedback = async (reportId) => {
        const comment = feedbackText[reportId];

        if (!comment || !comment.trim()) {
            setFeedbackMessage((previous) => ({
                ...previous,
                [reportId]: "Please enter feedback before submitting."
            }));
            return;
        }

        try {
            const token = getToken();

            if (!token) {
                setFeedbackMessage((previous) => ({
                    ...previous,
                    [reportId]:
                        "Your session has expired. Please log in again."
                }));
                return;
            }

            const response = await fetch(`${API_BASE}/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    report_id: reportId,
                    comment: comment.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setFeedbackMessage((previous) => ({
                    ...previous,
                    [reportId]:
                        data.message || "Failed to submit feedback."
                }));
                return;
            }

            setFeedbackMessage((previous) => ({
                ...previous,
                [reportId]:
                    data.message || "Feedback submitted successfully."
            }));

            setFeedbackText((previous) => ({
                ...previous,
                [reportId]: ""
            }));

            await fetchDashboardData();
        } catch (error) {
            console.error("Submit feedback error:", error);

            setFeedbackMessage((previous) => ({
                ...previous,
                [reportId]: "Unable to connect to the server."
            }));
        }
    };

    // Download attachment without browser alert popups
    const downloadAttachment = async (report) => {
        setDownloadMessage("");

        try {
            const token = getToken();

            if (!token) {
                setDownloadMessageType("error");
                setDownloadMessage(
                    "Your session has expired. Please log in again."
                );
                return;
            }

            setDownloadingReport(report.report_id);

            const response = await fetch(
                `${API_BASE}/reports/${report.report_id}/attachment/download`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                let message = "Unable to download the attachment.";

                try {
                    const data = await response.json();
                    message = data.message || message;
                } catch {
                    // Use the default error message if the response is not JSON.
                }

                throw new Error(message);
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = objectUrl;
            link.download =
                report.attachment_name ||
                `progress-report-${report.report_id}`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(objectUrl);
            }, 1000);

            setDownloadMessageType("success");
            setDownloadMessage("Attachment downloaded successfully.");
        } catch (error) {
            console.error("Download attachment error:", error);

            setDownloadMessageType("error");
            setDownloadMessage(
                error.message || "Unable to download the attachment."
            );
        } finally {
            setDownloadingReport(null);
        }
    };

    const reportsAwaitingFeedback = reports.filter(
        (report) => !report.feedback_comment
    ).length;

    const reviewedReports = reports.filter(
        (report) => report.feedback_comment
    ).length;

    const statistics = [
        {
            title: "Assigned Students",
            value: students.length,
            icon: Users,
            description: "Students under your supervision"
        },
        {
            title: "Progress Reports",
            value: reports.length,
            icon: FileText,
            description: "Reports submitted by students"
        },
        {
            title: "Awaiting Feedback",
            value: reportsAwaitingFeedback,
            icon: Clock3,
            description: "Reports needing your review"
        },
        {
            title: "Reviewed Reports",
            value: reviewedReports,
            icon: CheckCircle2,
            description: "Reports with submitted feedback"
        }
    ];

    if (loading) {
        return (
            <AppLayout>
                <div className="flex min-h-[55vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-[#D8D0C7] border-t-[#8B7355]" />

                        <p className="text-sm font-medium text-slate-500">
                            Loading Supervisor Dashboard...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <AlertCircle size={21} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-bold text-[#0B1F3B]">
                                    Something went wrong
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoading(true);
                                        setError("");
                                        fetchDashboardData();
                                    }}
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18365C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] focus-visible:ring-offset-2"
                                >
                                    <RefreshCw size={15} />
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="mx-auto max-w-[1350px] space-y-5 sm:space-y-6">

                {/* ATTACHMENT DOWNLOAD MESSAGE */}
                {downloadMessage && (
                    <div
                        role={downloadMessageType === "error" ? "alert" : "status"}
                        aria-live="polite"
                        className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-sm sm:p-4 ${
                            downloadMessageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        {downloadMessageType === "success" ? (
                            <CheckCircle2
                                size={20}
                                className="mt-0.5 shrink-0"
                            />
                        ) : (
                            <AlertCircle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />
                        )}

                        <p className="flex-1 text-sm leading-6">
                            {downloadMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() => setDownloadMessage("")}
                            aria-label="Dismiss notification"
                            className="rounded-md p-1 transition hover:bg-black/5"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* HERO */}
                <section className="relative overflow-hidden rounded-2xl bg-[#0B1F3B] shadow-md">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#8B7355]/20 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#1E3A6F]/40 blur-3xl" />

                    <div className="pointer-events-none absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 md:block" />

                    <div className="relative z-10 p-5 sm:p-6 lg:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D7CEC4] sm:text-[11px]">
                                    <Sparkles
                                        size={14}
                                        className="text-[#C5AD8D]"
                                    />
                                    Supervisor Portal
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    Supervision{" "}
                                    <span className="text-[#C5AD8D]">
                                        Dashboard
                                    </span>
                                </h1>

                                <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[#D7CEC4]">
                                    Monitor assigned students, review their
                                    internship progress, and provide
                                    professional feedback in one secure
                                    platform.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 rounded-lg bg-[#8B7355] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm sm:text-sm">
                                        <ClipboardCheck size={16} />
                                        Active Supervision
                                    </div>

                                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs font-semibold text-white sm:text-sm">
                                        <Users size={16} />

                                        {students.length}{" "}
                                        {students.length === 1
                                            ? "Assigned Student"
                                            : "Assigned Students"}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden shrink-0 lg:flex lg:pr-5">
                                <div className="relative flex h-28 w-28 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.05] shadow-lg">
                                    <div className="absolute inset-2.5 rounded-[1.1rem] border border-[#C5AD8D]/20" />

                                    <ClipboardCheck
                                        size={43}
                                        strokeWidth={1.5}
                                        className="relative text-[#C5AD8D]"
                                    />

                                    <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#8B7355] text-white shadow-md">
                                        <ShieldCheck size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SHARED STUDENT FILES */}
                <section>
                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/supervisor/student-chat";
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border border-[#D8D0C7] bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:border-[#C5AD8D] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] focus-visible:ring-offset-2 sm:gap-4 sm:p-4"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D] transition-colors group-hover:bg-[#18365C] sm:h-11 sm:w-11">
                            <Paperclip size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-bold text-[#0B1F3B] sm:text-base">
                                Shared Student Files
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                Access files shared by your assigned students.
                            </p>
                        </div>

                        <ChevronRight
                            size={19}
                            className="shrink-0 text-[#8B7355] transition-transform duration-200 group-hover:translate-x-1"
                        />
                    </button>
                </section>

                {/* STATISTICS */}
                <section>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B7355]">
                                Overview
                            </p>

                            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0B1F3B] sm:text-2xl">
                                Supervision Summary
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                A summary of your current supervision activities.
                            </p>
                        </div>

                        <div className="mt-2 hidden items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:flex">
                            <ClipboardCheck size={14} />
                            Supervisor management
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
                        {statistics.map((statistic) => {
                            const Icon = statistic.icon;

                            return (
                                <div
                                    key={statistic.title}
                                    className="group relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:shadow-md sm:p-4"
                                >
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#0B1F3B] via-[#8B7355] to-[#C5AD8D] opacity-0 transition-opacity group-hover:opacity-100" />

                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
                                                {statistic.title}
                                            </p>

                                            <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#0B1F3B] sm:text-3xl">
                                                {statistic.value}
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-[11px]">
                                                {statistic.description}
                                            </p>
                                        </div>

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355] transition-colors duration-200 group-hover:bg-[#0B1F3B] group-hover:text-[#C5AD8D] sm:h-11 sm:w-11">
                                            <Icon size={19} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ASSIGNED STUDENTS */}
                <section>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B7355]">
                                Students
                            </p>

                            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0B1F3B] sm:text-2xl">
                                My Assigned Students
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                Students currently assigned to your supervision.
                            </p>
                        </div>

                        <div className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#8B7355] shadow-sm ring-1 ring-[#D8D0C7]">
                            <Users size={14} />

                            {students.length}{" "}
                            {students.length === 1 ? "Student" : "Students"}
                        </div>
                    </div>

                    {students.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#D8D0C7] bg-white p-8 text-center sm:p-10">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                <Users size={24} />
                            </div>

                            <h3 className="mt-3 text-sm font-bold text-[#0B1F3B]">
                                No students assigned
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                No students have been assigned to you yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {students.map((student) => (
                                <article
                                    key={student.assignment_id}
                                    className="group relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:shadow-md"
                                >
                                    <div className="h-1 bg-gradient-to-r from-[#0B1F3B] via-[#8B7355] to-[#C5AD8D]" />

                                    <div className="flex items-center gap-3 border-b border-[#E8E3DC] bg-[#F8F7F4] p-3.5 sm:p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-base font-bold text-[#C5AD8D]">
                                            {student.full_name
                                                ?.charAt(0)
                                                .toUpperCase() || "S"}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="break-words text-sm font-bold text-[#0B1F3B] sm:text-base">
                                                {student.full_name || "Student"}
                                            </h3>

                                            <p className="mt-1 break-words text-xs text-slate-500">
                                                Student ID: {student.student_id || "Not provided"}
                                            </p>
                                        </div>

                                        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#8B7355] sm:flex">
                                            <GraduationCap size={17} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 p-3.5 min-[420px]:grid-cols-2 sm:p-4">
                                        <div className="flex min-w-0 gap-2.5">
                                            <User size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Department
                                                </p>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.department || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 gap-2.5">
                                            <GraduationCap size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Year
                                                </p>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.year_level || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 gap-2.5">
                                            <Mail size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Email
                                                </p>

                                                <p className="mt-1 break-all text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.email || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 gap-2.5">
                                            <Phone size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Phone
                                                </p>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.phone || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 gap-2.5 min-[420px]:col-span-2">
                                            <Briefcase size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Internship
                                                </p>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.internship_title || "Not provided"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex min-w-0 gap-2.5 min-[420px]:col-span-2">
                                            <Building2 size={16} className="mt-0.5 shrink-0 text-[#8B7355]" />

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Company
                                                </p>

                                                <p className="mt-1 break-words text-xs font-semibold text-slate-700 sm:text-sm">
                                                    {student.company_name || "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* PROGRESS REPORTS */}
                <section>
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B7355]">
                            Student Progress
                        </p>

                        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0B1F3B] sm:text-2xl">
                            Student Progress Reports
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                            Review submitted reports, download attachments, and provide feedback.
                        </p>
                    </div>

                    {reports.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#D8D0C7] bg-white p-8 text-center sm:p-10">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                <FileText size={24} />
                            </div>

                            <h3 className="mt-3 text-sm font-bold text-[#0B1F3B]">
                                No progress reports yet
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                Students have not submitted any progress reports yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <article
                                    key={report.report_id}
                                    className="overflow-hidden rounded-xl border border-[#D8D0C7] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
                                >
                                    {/* Report header */}
                                    <div className="border-b border-[#E8E3DC] bg-[#F8F7F4] p-3.5 sm:p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-md bg-[#0B1F3B] px-2.5 py-1 text-[10px] font-bold text-[#C5AD8D] sm:text-xs">
                                                        Week {report.week_number}
                                                    </span>

                                                    <span
                                                        className={
                                                            "rounded-md px-2.5 py-1 text-[10px] font-semibold sm:text-xs " +
                                                            (report.feedback_comment
                                                                ? "bg-[#E8F1EC] text-[#35624A]"
                                                                : "bg-[#F5EDE1] text-[#80613A]")
                                                        }
                                                    >
                                                        {report.feedback_comment
                                                            ? "Reviewed"
                                                            : "Awaiting Feedback"}
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 break-words text-sm font-bold text-[#0B1F3B] sm:text-base">
                                                    {report.title || "Progress Report"}
                                                </h3>

                                                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <User size={14} className="shrink-0" />
                                                        <span className="break-words">
                                                            {report.student_name || "Student"}
                                                        </span>
                                                    </span>

                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <Briefcase size={14} className="shrink-0" />
                                                        <span className="break-words">
                                                            {report.internship_title || "Internship"}
                                                        </span>
                                                    </span>

                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <Building2 size={14} className="shrink-0" />
                                                        <span className="break-words">
                                                            {report.company_name || "Company"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 sm:shrink-0 sm:text-xs">
                                                <CalendarDays size={14} />
                                                Report #{report.report_id}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-3.5 sm:p-4">
                                        {/* Report content */}
                                        <div>
                                            <p className="mb-2 text-xs font-bold text-[#0B1F3B] sm:text-sm">
                                                Student Report
                                            </p>

                                            <div className="rounded-lg border border-[#E1DDD6] bg-[#FAF9F7] p-3.5 sm:p-4">
                                                <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 sm:text-sm">
                                                    {report.content}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Attachments and shared links */}
                                        {(report.has_attachment || report.shared_link) && (
                                            <div className="rounded-lg border border-[#D8D0C7] bg-[#F8F7F4] p-3.5 sm:p-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <Paperclip
                                                        size={16}
                                                        className="text-[#8B7355]"
                                                    />

                                                    <h4 className="text-xs font-bold text-[#0B1F3B] sm:text-sm">
                                                        Supporting Materials
                                                    </h4>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                    {report.has_attachment && (
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadAttachment(report)}
                                                            disabled={
                                                                downloadingReport === report.report_id
                                                            }
                                                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0B1F3B] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#18365C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                                                        >
                                                            {downloadingReport === report.report_id ? (
                                                                <RefreshCw size={15} className="animate-spin" />
                                                            ) : (
                                                                <Download size={15} />
                                                            )}

                                                            {downloadingReport === report.report_id
                                                                ? "Downloading..."
                                                                : `Download ${report.attachment_name || "Attachment"}`}
                                                        </button>
                                                    )}

                                                    {report.shared_link && (
                                                        <a
                                                            href={report.shared_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0C7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:bg-[#F5F2ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] focus-visible:ring-offset-2 sm:text-sm"
                                                        >
                                                            <ExternalLink size={15} />
                                                            Open Shared Link
                                                        </a>
                                                    )}
                                                </div>

                                                {report.attachment_name && (
                                                    <p className="mt-3 break-all text-[11px] text-slate-500">
                                                        Attached file: {report.attachment_name}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Existing feedback */}
                                        {report.feedback_comment ? (
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <CheckCircle2
                                                        size={17}
                                                        className="text-[#4F765E]"
                                                    />

                                                    <p className="text-xs font-bold text-[#0B1F3B] sm:text-sm">
                                                        Supervisor Feedback
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-[#D5E4DA] bg-[#F0F6F2] p-3.5 sm:p-4">
                                                    <p className="whitespace-pre-wrap break-words text-xs leading-6 text-[#355744] sm:text-sm">
                                                        {report.feedback_comment}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-[#D8D0C7] bg-[#F8F7F4] p-3.5 sm:p-4">
                                                <div className="mb-3 flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3B] text-[#C5AD8D]">
                                                        <MessageSquare size={17} />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-[#0B1F3B] sm:text-sm">
                                                            Provide Feedback
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:text-xs">
                                                            Give the student useful feedback about this report.
                                                        </p>
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={
                                                        feedbackText[report.report_id] || ""
                                                    }
                                                    onChange={(event) => {
                                                        setFeedbackText((previous) => ({
                                                            ...previous,
                                                            [report.report_id]: event.target.value
                                                        }));

                                                        setFeedbackMessage((previous) => ({
                                                            ...previous,
                                                            [report.report_id]: ""
                                                        }));
                                                    }}
                                                    placeholder="Write your feedback for this student..."
                                                    rows={3}
                                                    className="w-full resize-y rounded-lg border border-[#D8D0C7] bg-white px-3.5 py-3 text-xs leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8B7355] focus:ring-2 focus:ring-[#C5AD8D]/25 sm:text-sm"
                                                />

                                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div
                                                        aria-live="polite"
                                                        className="min-w-0 text-xs"
                                                    >
                                                        {feedbackMessage[report.report_id] && (
                                                            <span
                                                                className={
                                                                    feedbackMessage[report.report_id]
                                                                        .toLowerCase()
                                                                        .includes("success")
                                                                        ? "font-medium text-[#4F765E]"
                                                                        : "font-medium text-red-600"
                                                                }
                                                            >
                                                                {feedbackMessage[report.report_id]}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => submitFeedback(report.report_id)}
                                                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#8B7355] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#756044] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] focus-visible:ring-offset-2 active:translate-y-0 sm:w-auto sm:text-sm"
                                                    >
                                                        <Send size={15} />
                                                        Submit Feedback
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* TRUST / INFORMATION CARD */}
                <section className="relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-white p-4 shadow-sm sm:p-5">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#C5AD8D]/10 blur-2xl" />

                    <div className="relative flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                            <ShieldCheck size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-sm font-bold text-[#0B1F3B]">
                                    Supervisor Internship Management
                                </h3>

                                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F5F2ED] px-2.5 py-1.5 text-[10px] font-semibold text-[#8B7355]">
                                    <ShieldCheck size={12} />
                                    Secure workspace
                                </div>
                            </div>

                            <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                                Monitor assigned students, review internship
                                progress, provide meaningful feedback, and
                                support communication between students,
                                supervisors, and companies.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-3 pb-1 pt-1 text-[10px] text-slate-400 sm:text-xs">
                    <div className="h-px w-8 bg-[#D8D0C7] sm:w-12" />

                    <span>Woldia University Internship System</span>

                    <div className="h-px w-8 bg-[#D8D0C7] sm:w-12" />
                </div>
            </div>
        </AppLayout>
    );
}

export default SupervisorDashboard;