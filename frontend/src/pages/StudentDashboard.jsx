import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    User,
    Mail,
    GraduationCap,
    Phone,
    Briefcase,
    FileText,
    CheckCircle2,
    Clock3,
    XCircle,
    Send,
    MessageSquare,
    CalendarDays,
    Award,
    ArrowUpRight,
    Building2,
    BookOpen,
    ShieldCheck,
    Sparkles,
    FolderOpen,
    Upload,
    ChevronRight,
    RefreshCw,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_BASE_URL = "http://localhost:5000/api";

function getStoredUser() {
    try {
        const value = localStorage.getItem("user");
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function getStoredToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        ""
    );
}

async function apiRequest(path, token, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get("content-type") || "";

    let data = {};

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();

        if (text) {
            data = { message: text };
        }
    }

    if (response.status === 401 || response.status === 403) {
        const error = new Error(
            data.message ||
                "Your session is invalid or expired. Please sign in again."
        );

        error.status = response.status;
        throw error;
    }

    if (!response.ok) {
        const error = new Error(
            data.message || `Request failed with status ${response.status}.`
        );

        error.status = response.status;
        throw error;
    }

    return data;
}

function StudentDashboard() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [partialError, setPartialError] = useState("");

    const [reportForm, setReportForm] = useState({
        internship_id: "",
        week_number: "",
        title: "",
        content: "",
    });

    const [reportMessage, setReportMessage] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);

    const token = getStoredToken();
    const storedUser = getStoredUser();

    const loadDashboard = useCallback(
        async (isRefresh = false) => {
            if (!token) {
                setError("Your session is missing. Please sign in again.");
                setLoading(false);
                return;
            }

            if (storedUser?.role && storedUser.role !== "student") {
                setError(
                    "Your saved account is not a student account. Please sign in with your student account."
                );
                setLoading(false);
                return;
            }

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setPartialError("");

            try {
                // Load the authenticated student's profile first.
                // If this fails, do not show potentially unrelated data.
                const profileData = await apiRequest(
                    "/students/profile",
                    token
                );

                const student = profileData.student;

                if (!student) {
                    throw new Error(
                        "Your student profile was not returned by the server."
                    );
                }

                // Prevent showing a profile whose account does not match
                // the account saved in this browser.
                if (
                    storedUser?.id != null &&
                    student.user_id != null &&
                    String(storedUser.id) !== String(student.user_id)
                ) {
                    throw new Error(
                        "The profile returned by the server does not match your signed-in account. Please sign out and sign in again. If the problem continues, the backend authentication needs to be checked."
                    );
                }

                if (
                    storedUser?.email &&
                    student.email &&
                    storedUser.email.toLowerCase() !==
                        student.email.toLowerCase()
                ) {
                    throw new Error(
                        "The server returned a profile belonging to a different email address. Your information has not been displayed. Please sign out and sign in again."
                    );
                }

                setProfile(student);

                // Load applications and reports independently.
                // One failed request will not erase the other successful data.
                const results = await Promise.allSettled([
                    apiRequest("/students/applications", token),
                    apiRequest("/students/reports", token),
                ]);

                const messages = [];

                if (results[0].status === "fulfilled") {
                    setApplications(
                        Array.isArray(results[0].value.applications)
                            ? results[0].value.applications
                            : []
                    );
                } else {
                    setApplications([]);
                    messages.push(
                        `Applications: ${results[0].reason?.message || "Unable to load applications."}`
                    );
                }

                if (results[1].status === "fulfilled") {
                    setReports(
                        Array.isArray(results[1].value.reports)
                            ? results[1].value.reports
                            : []
                    );
                } else {
                    setReports([]);
                    messages.push(
                        `Progress reports: ${results[1].reason?.message || "Unable to load reports."}`
                    );
                }

                if (messages.length > 0) {
                    setPartialError(messages.join(" "));
                }
            } catch (err) {
                console.error("Student dashboard loading error:", err);

                setError(
                    err.message ||
                        "Unable to load your dashboard. Please try again."
                );

                if (err.status === 401 || err.status === 403) {
                    // Remove invalid authentication data only.
                    // Do not remove any database records.
                    localStorage.removeItem("token");
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [token, storedUser?.id, storedUser?.role, storedUser?.email]
    );

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handleReportChange = (event) => {
        const { name, value } = event.target;

        setReportForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmitReport = async (event) => {
        event.preventDefault();
        setReportMessage("");

        if (!token) {
            setReportMessage("Please sign in again before submitting a report.");
            return;
        }

        const internshipId = Number(reportForm.internship_id);
        const weekNumber = Number(reportForm.week_number);

        if (!Number.isInteger(internshipId) || internshipId <= 0) {
            setReportMessage("Please select a valid accepted internship.");
            return;
        }

        if (!Number.isInteger(weekNumber) || weekNumber < 1) {
            setReportMessage("Week number must be at least 1.");
            return;
        }

        if (
            !reportForm.title.trim() ||
            !reportForm.content.trim()
        ) {
            setReportMessage("Please complete the report title and content.");
            return;
        }

        setSubmittingReport(true);

        try {
            await apiRequest("/students/reports", token, {
                method: "POST",
                body: JSON.stringify({
                    internship_id: internshipId,
                    week_number: weekNumber,
                    title: reportForm.title.trim(),
                    content: reportForm.content.trim(),
                }),
            });

            setReportMessage("Progress report submitted successfully.");

            setReportForm({
                internship_id: "",
                week_number: "",
                title: "",
                content: "",
            });

            await loadDashboard(true);
        } catch (err) {
            console.error("Progress report submission error:", err);
            setReportMessage(
                err.message || "Failed to submit progress report."
            );
        } finally {
            setSubmittingReport(false);
        }
    };

    const acceptedApplications = applications.filter(
        (application) =>
            String(application.status || "").toLowerCase() === "accepted"
    );

    const pendingApplications = applications.filter(
        (application) =>
            String(application.status || "").toLowerCase() === "pending"
    );

    const rejectedApplications = applications.filter(
        (application) =>
            String(application.status || "").toLowerCase() === "rejected"
    );

    const getStatusStyle = (status) => {
        const normalized = String(status || "").toLowerCase();

        if (normalized === "accepted") {
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        }

        if (normalized === "rejected") {
            return "border-red-200 bg-red-50 text-red-700";
        }

        return "border-amber-200 bg-amber-50 text-amber-700";
    };

    const getStatusIcon = (status) => {
        const normalized = String(status || "").toLowerCase();

        if (normalized === "accepted") {
            return <CheckCircle2 size={15} />;
        }

        if (normalized === "rejected") {
            return <XCircle size={15} />;
        }

        return <Clock3 size={15} />;
    };

    const getReportStatusStyle = (status) => {
        if (String(status || "").toLowerCase() === "reviewed") {
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        }

        return "border-amber-200 bg-amber-50 text-amber-700";
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex min-h-[65vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1F3B] shadow-lg shadow-[#0B1F3B]/20">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-[#C5AD8D]" />
                        </div>

                        <p className="text-sm font-semibold text-[#0B1F3B]">
                            Loading your dashboard...
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Preparing your internship information
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="flex min-h-[65vh] items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 shadow-xl shadow-red-900/5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                                <XCircle size={24} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-[#0B1F3B]">
                                    Unable to load dashboard
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {error}
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => loadDashboard()}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E3A6F]"
                                    >
                                        <RefreshCw size={16} />
                                        Try Again
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/login")}
                                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Sign In Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-7 pb-10">
                {partialError && (
                    <div
                        role="alert"
                        className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p>{partialError}</p>

                        <button
                            type="button"
                            onClick={() => loadDashboard(true)}
                            disabled={refreshing}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-amber-800 shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Retry loading
                        </button>
                    </div>
                )}

                {/* Hero Header */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F3B] via-[#10294B] to-[#1E3A6F] p-7 text-white shadow-xl shadow-[#0B1F3B]/15 sm:p-9">
                    <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#8B7355]/20 blur-3xl" />
                    <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/5 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#E8DFD4] backdrop-blur-sm">
                                <Sparkles size={14} />
                                Student Portal
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Welcome back
                                {profile?.full_name
                                    ? `, ${profile.full_name.split(" ")[0]}`
                                    : ""}
                                .
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
                                Track your internship applications, submit
                                weekly progress, manage your documents, and
                                stay connected with your supervisor.
                            </p>
                        </div>

                        <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:block">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#8B7355] p-3 text-white shadow-lg">
                                    <CalendarDays size={22} />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-300">
                                        Academic Internship
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        Student Workspace
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics */}
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: "Applications",
                            value: applications.length,
                            description: "Total submitted",
                            icon: Briefcase,
                            iconClass:
                                "bg-[#0B1F3B]/10 text-[#0B1F3B] group-hover:bg-[#0B1F3B] group-hover:text-white",
                            borderClass: "hover:border-[#C5AD8D]",
                        },
                        {
                            label: "Accepted",
                            value: acceptedApplications.length,
                            description: "Internship placements",
                            icon: CheckCircle2,
                            iconClass:
                                "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                            borderClass: "hover:border-emerald-200",
                        },
                        {
                            label: "Pending",
                            value: pendingApplications.length,
                            description: "Awaiting decision",
                            icon: Clock3,
                            iconClass:
                                "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
                            borderClass: "hover:border-amber-200",
                        },
                        {
                            label: "Reports",
                            value: reports.length,
                            description: "Progress submitted",
                            icon: FileText,
                            iconClass:
                                "bg-[#8B7355]/10 text-[#8B7355] group-hover:bg-[#8B7355] group-hover:text-white",
                            borderClass: "hover:border-[#C5AD8D]",
                        },
                    ].map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.label}
                                className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${stat.borderClass}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            {stat.label}
                                        </p>

                                        <p className="mt-1.5 text-2xl font-bold text-[#0B1F3B]">
                                            {stat.value}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {stat.description}
                                        </p>
                                    </div>

                                    <div
                                        className={`rounded-xl p-3 transition ${stat.iconClass}`}
                                    >
                                        <Icon size={20} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
{/* Student-Supervisor Chat Shortcut */}
<section>
    <button
        type="button"
        onClick={() => navigate("/student/supervisor-chat")}
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#C5AD8D]/40 bg-white p-5 text-left shadow-sm transition hover:border-[#8B7355] hover:shadow-lg"
    >
        <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[#0B1F3B] p-3 text-[#C5AD8D]">
                <MessageSquare size={24} />
            </div>

            <div>
                <h2 className="font-bold text-[#0B1F3B]">
                    Share Files with Supervisor
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Send messages, share documents, and exchange useful links.
                </p>
            </div>
        </div>

        <ChevronRight
            size={22}
            className="shrink-0 text-[#8B7355] transition group-hover:translate-x-1"
        />
    </button>
</section>
                {/* My Documents shortcut */}
                <section>
                    <button
                        type="button"
                        onClick={() => navigate("/student/documents")}
                        className="group w-full overflow-hidden rounded-3xl border border-[#C5AD8D]/40 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#8B7355] hover:shadow-xl"
                    >
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex items-start gap-5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1F3B] to-[#1E3A6F] text-white shadow-md transition duration-300 group-hover:scale-105">
                                    <FolderOpen size={23} />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-bold text-[#0B1F3B]">
                                            My Documents
                                        </h2>

                                        <span className="rounded-full bg-[#F5F2ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B7355]">
                                            Student Resources
                                        </span>
                                    </div>

                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                        Upload and manage your CV, application
                                        letters, certificates, and other
                                        internship documents.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Upload
                                                size={15}
                                                className="text-[#8B7355]"
                                            />
                                            PDF document uploads
                                        </span>

                                        <span className="inline-flex items-center gap-1.5">
                                            <ShieldCheck
                                                size={15}
                                                className="text-emerald-600"
                                            />
                                            Private upload area
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-bold text-white transition group-hover:bg-[#1E3A6F]">
                                Open Documents
                                <ChevronRight
                                    size={18}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </div>
                        </div>
                    </button>
                </section>

                {/* Profile and Applications */}
                <section className="grid gap-6 xl:grid-cols-3">
                    {/* Profile */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-1">
                        <div className="bg-gradient-to-br from-[#0B1F3B] to-[#1E3A6F] px-4 py-4 text-white">
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                                    <User size={23} />
                                </div>

                                <div>
                                    <h2 className="font-bold">My Profile</h2>
                                    <p className="mt-1 text-xs text-slate-300">
                                        Student information
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-4">
                            {profile ? (
                                <>
                                    <div className="rounded-2xl bg-[#F5F2ED] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355]">
                                            Full Name
                                        </p>

                                        <p className="mt-1.5 font-bold text-[#0B1F3B]">
                                            {profile.full_name}
                                        </p>
                                    </div>

                                    {[
                                        {
                                            label: "Student ID",
                                            value: profile.student_id,
                                            icon: GraduationCap,
                                        },
                                        {
                                            label: "Email",
                                            value: profile.email,
                                            icon: Mail,
                                        },
                                        {
                                            label: "Department",
                                            value: profile.department,
                                            icon: BookOpen,
                                        },
                                        {
                                            label: "Year Level",
                                            value: profile.year_level
                                                ? `Year ${profile.year_level}`
                                                : "Not provided",
                                            icon: GraduationCap,
                                        },
                                        {
                                            label: "Phone",
                                            value:
                                                profile.phone || "Not provided",
                                            icon: Phone,
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.label}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="rounded-xl bg-[#0B1F3B]/10 p-2 text-[#0B1F3B]">
                                                    <Icon size={17} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-xs text-slate-400">
                                                        {item.label}
                                                    </p>

                                                    <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                                                        {item.value || "Not provided"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                                    Student profile not found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Applications */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#8B7355]/10 p-3 text-[#8B7355]">
                                    <Briefcase size={20} />
                                </div>

                                <div>
                                    <h2 className="font-bold text-[#0B1F3B]">
                                        My Applications
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Track your internship applications
                                    </p>
                                </div>
                            </div>

                            <span className="w-fit rounded-full border border-[#C5AD8D]/40 bg-[#F5F2ED] px-3 py-1.5 text-xs font-bold text-[#8B7355]">
                                {applications.length} total
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {applications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                                        <Briefcase size={26} />
                                    </div>

                                    <p className="mt-4 text-sm font-bold text-[#0B1F3B]">
                                        No applications found
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Browse available internships to get
                                        started.
                                    </p>
                                </div>
                            ) : (
                                applications.map((application) => (
                                    <div
                                        key={application.id}
                                        className="group p-4 transition hover:bg-[#F8F7F4]"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="mt-0.5 rounded-xl bg-[#0B1F3B]/10 p-2 text-[#0B1F3B]">
                                                    <Building2 size={16} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-[#0B1F3B]">
                                                        {application.internship_title}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {application.company_name}
                                                    </p>

                                                    {application.approval_reason && (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Decision note:{" "}
                                                            {application.approval_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyle(
                                                    application.status
                                                )}`}
                                            >
                                                {getStatusIcon(application.status)}
                                                {application.status || "pending"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Weekly Progress Report */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-[#F8F7F4] to-white px-6 py-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-[#0B1F3B] p-3 text-white shadow-lg shadow-[#0B1F3B]/15">
                                <FileText size={21} />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#0B1F3B]">
                                    Weekly Progress Report
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Submit your internship progress directly
                                    to your supervisor.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmitReport}
                        className="p-6 sm:p-7"
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Internship
                                </label>

                                <select
                                    name="internship_id"
                                    value={reportForm.internship_id}
                                    onChange={handleReportChange}
                                    required
                                    disabled={acceptedApplications.length === 0}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10 disabled:bg-slate-50"
                                >
                                    <option value="">
                                        Select an accepted internship
                                    </option>

                                    {acceptedApplications.map((application) => (
                                        <option
                                            key={application.id}
                                            value={application.internship_id}
                                        >
                                            {application.internship_title}
                                        </option>
                                    ))}
                                </select>

                                {acceptedApplications.length === 0 && (
                                    <p className="mt-2 text-xs text-slate-400">
                                        You need an accepted internship before
                                        submitting a report.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Week Number
                                </label>

                                <input
                                    type="number"
                                    name="week_number"
                                    min="1"
                                    value={reportForm.week_number}
                                    onChange={handleReportChange}
                                    required
                                    placeholder="Example: 1"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Report Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={reportForm.title}
                                    onChange={handleReportChange}
                                    maxLength={200}
                                    required
                                    placeholder="Example: Week 1 Internship Progress"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Report Content
                                </label>

                                <textarea
                                    name="content"
                                    value={reportForm.content}
                                    onChange={handleReportChange}
                                    rows="6"
                                    maxLength={10000}
                                    required
                                    placeholder="Describe the work you completed, what you learned, challenges you faced, and your plans for the next week..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            {reportMessage ? (
                                <div
                                    role="status"
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                        reportMessage.includes("successfully")
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-red-200 bg-red-50 text-red-700"
                                    }`}
                                >
                                    {reportMessage}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <ShieldCheck size={15} />
                                    Only accepted internships can receive
                                    progress reports.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    acceptedApplications.length === 0 ||
                                    submittingReport
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0B1F3B]/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#1E3A6F] hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                            >
                                {submittingReport ? (
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Send size={17} />
                                )}

                                {submittingReport
                                    ? "Submitting..."
                                    : "Submit Report"}

                                {!submittingReport && (
                                    <ArrowUpRight size={16} />
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Submitted Reports */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-[#8B7355]/10 p-3 text-[#8B7355]">
                                <Award size={21} />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#0B1F3B]">
                                    My Progress Reports
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Review your reports and supervisor feedback.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-7">
                        {reports.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8F7F4] p-10 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                                    <FileText size={27} />
                                </div>

                                <p className="mt-4 text-sm font-bold text-[#0B1F3B]">
                                    No progress reports yet
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Your submitted weekly reports will appear
                                    here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {reports.map((report, index) => {
                                    const feedbackItems = Array.isArray(
                                        report.feedback
                                    )
                                        ? report.feedback
                                        : [];

                                    return (
                                        <div
                                            key={
                                                report.report_id ??
                                                report.id ??
                                                index
                                            }
                                            className="rounded-xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-[#C5AD8D] hover:shadow-md sm:p-5"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-[#0B1F3B] px-3 py-1 text-xs font-bold text-white">
                                                            Week {report.week_number}
                                                        </span>

                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getReportStatusStyle(
                                                                report.status
                                                            )}`}
                                                        >
                                                            {report.status || "pending"}
                                                        </span>
                                                    </div>

                                                    <h3 className="mt-3 font-bold text-[#0B1F3B]">
                                                        {report.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 rounded-xl bg-[#F8F7F4] p-3 sm:grid-cols-2">
                                                <div>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Internship
                                                    </span>

                                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                                        {report.internship_title || "Not provided"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Company
                                                    </span>

                                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                                        {report.company_name || "Not provided"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-slate-100 bg-white p-4">
                                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8B7355]">
                                                    Report
                                                </p>

                                                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                                    {report.content}
                                                </p>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-[#C5AD8D]/30 bg-[#F5F2ED]/70 p-4">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <div className="rounded-lg bg-[#8B7355] p-1.5 text-white">
                                                        <MessageSquare size={15} />
                                                    </div>

                                                    <p className="text-sm font-bold text-[#0B1F3B]">
                                                        Supervisor Feedback
                                                    </p>
                                                </div>

                                                {feedbackItems.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {feedbackItems.map(
                                                            (feedback, feedbackIndex) => (
                                                                <div
                                                                    key={
                                                                        feedback.feedback_id ??
                                                                        feedback.id ??
                                                                        feedbackIndex
                                                                    }
                                                                    className="rounded-xl border border-white bg-white p-4 shadow-sm"
                                                                >
                                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                                        {feedback.comment}
                                                                    </p>

                                                                    {feedback.created_at && (
                                                                        <p className="mt-3 text-xs text-slate-400">
                                                                            {new Date(
                                                                                feedback.created_at
                                                                            ).toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : report.feedback_comment ? (
                                                    <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                                                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                            {report.feedback_comment}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-[#C5AD8D]/40 bg-white/60 p-4">
                                                        <p className="text-sm text-slate-500">
                                                            No feedback has been
                                                            given yet.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Bottom Reminder */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#C5AD8D]/30 bg-[#F5F2ED] p-5">
                    <div className="rounded-xl bg-[#0B1F3B] p-2 text-white">
                        <ShieldCheck size={18} />
                    </div>

                    <div>
                        <p className="text-sm font-bold text-[#0B1F3B]">
                            Keep your internship progress up to date
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Submit your weekly reports regularly so your
                            supervisor can review your progress and provide
                            feedback.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default StudentDashboard;