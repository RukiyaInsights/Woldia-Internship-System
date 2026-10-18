import { useEffect, useState } from "react";
import {
    Users,
    UserRound,
    Mail,
    GraduationCap,
    CalendarDays,
    BriefcaseBusiness,
    CheckCircle2,
    XCircle,
    Clock3,
    AlertCircle,
    Search,
    ShieldCheck,
    Sparkles,
    ArrowRight,
    Filter,
    RefreshCw,
    X,
    ShieldAlert
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function CompanyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const [rejectingApplication, setRejectingApplication] = useState(null);
    const [acceptingApplication, setAcceptingApplication] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    const fetchApplications = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/internships/company/applications",
                {
                    headers: {
                        Authorization:
                            "Bearer " + localStorage.getItem("token")
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Unable to load applications."
                );
                return;
            }

            setApplications(data.applications || []);
        } catch (error) {
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const updateStatus = async (
        applicationId,
        status,
        decisionReason = ""
    ) => {
        setUpdatingId(applicationId);
        setActionError("");
        setActionSuccess("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/internships/company/applications/status",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        application_id: applicationId,
                        status: status,
                        decision_reason: decisionReason
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setActionError(
                    data.message || "Unable to update application."
                );
                return;
            }

            setRejectingApplication(null);
            setAcceptingApplication(null);
            setRejectionReason("");
            setActionError("");

            await fetchApplications();

            setActionSuccess(
                status === "accepted"
                    ? "The student has been accepted successfully."
                    : "The application has been rejected successfully."
            );
        } catch (error) {
            setActionError("Unable to connect to the server.");
        } finally {
            setUpdatingId(null);
        }
    };

    // Open our custom acceptance confirmation dialog.
    const handleAccept = (application) => {
        setActionError("");
        setActionSuccess("");
        setAcceptingApplication(application);
    };

    // Confirm acceptance from the custom dialog.
    const handleAcceptConfirm = () => {
        if (!acceptingApplication) return;

        updateStatus(
            acceptingApplication.id,
            "accepted"
        );
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();

        if (!rejectionReason.trim()) {
            setActionError(
                "Please provide a clear reason for rejecting this application."
            );
            return;
        }

        updateStatus(
            rejectingApplication.id,
            "rejected",
            rejectionReason.trim()
        );
    };

    const filteredApplications = applications.filter((application) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            application.student_name
                ?.toLowerCase()
                .includes(search) ||
            application.student_email
                ?.toLowerCase()
                .includes(search) ||
            application.internship_title
                ?.toLowerCase()
                .includes(search) ||
            application.department
                ?.toLowerCase()
                .includes(search);

        const matchesStatus =
            statusFilter === "all" ||
            application.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const pendingCount = applications.filter(
        (application) => application.status === "pending"
    ).length;

    const acceptedCount = applications.filter(
        (application) => application.status === "accepted"
    ).length;

    const rejectedCount = applications.filter(
        (application) => application.status === "rejected"
    ).length;

    const getStatusStyle = (status) => {
        if (status === "accepted") {
            return {
                wrapper:
                    "bg-emerald-50 border-emerald-200 text-emerald-700",
                icon: <CheckCircle2 size={15} />,
                label: "Accepted"
            };
        }

        if (status === "rejected") {
            return {
                wrapper:
                    "bg-red-50 border-red-200 text-red-700",
                icon: <XCircle size={15} />,
                label: "Rejected"
            };
        }

        return {
            wrapper:
                "bg-amber-50 border-amber-200 text-amber-700",
            icon: <Clock3 size={15} />,
            label: "Pending"
        };
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-11 w-11 rounded-full border-4 border-[#D8D0C7] border-t-[#8B7355] animate-spin" />

                        <p className="mt-4 font-medium text-[#0B1F3B]">
                            Loading applications...
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Preparing your application workspace
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="mx-auto max-w-3xl">
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                        <AlertCircle
                            size={22}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <h2 className="font-semibold">
                                Unable to load applications
                            </h2>

                            <p className="mt-1 text-sm">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={fetchApplications}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B1F3B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1E3A6F]"
                            >
                                <RefreshCw size={15} />
                                Try Again
                            </button>
                        </div>
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
                    <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-white/10" />
                    <div className="absolute right-20 top-20 h-16 w-16 rounded-full border border-[#C5AD8D]/20" />

                    <div className="relative z-10 p-7 sm:p-9 lg:p-11">
                        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7CEC4] backdrop-blur-sm">
                                    <Sparkles
                                        size={15}
                                        className="text-[#C5AD8D]"
                                    />
                                    Company Portal
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.7rem]">
                                    Internship Applications
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D7CEC4] sm:text-base">
                                    Review student applications, evaluate
                                    candidates, and manage internship
                                    placement decisions from one secure
                                    workspace.
                                </p>
                            </div>

                            <div className="hidden lg:flex lg:pr-6">
                                <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
                                    <div className="absolute inset-3 rounded-[1.5rem] border border-[#C5AD8D]/20" />

                                    <Users
                                        size={52}
                                        strokeWidth={1.4}
                                        className="relative text-[#C5AD8D]"
                                    />

                                    <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B7355] text-white shadow-lg">
                                        <ShieldCheck size={19} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STATISTICS */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: "Total Applications",
                            count: applications.length,
                            description: "View all applications",
                            filter: "all",
                            icon: <Users size={21} />,
                            color: "text-[#8B7355]",
                            iconBg: "bg-[#F5F2ED]",
                            active: "border-[#8B7355] ring-4 ring-[#8B7355]/10"
                        },
                        {
                            label: "Pending Review",
                            count: pendingCount,
                            description: "Awaiting decision",
                            filter: "pending",
                            icon: <Clock3 size={21} />,
                            color: "text-amber-600",
                            iconBg: "bg-amber-50",
                            active: "border-amber-400 ring-4 ring-amber-100"
                        },
                        {
                            label: "Accepted",
                            count: acceptedCount,
                            description: "Accepted students",
                            filter: "accepted",
                            icon: <CheckCircle2 size={21} />,
                            color: "text-emerald-600",
                            iconBg: "bg-emerald-50",
                            active: "border-emerald-400 ring-4 ring-emerald-100"
                        },
                        {
                            label: "Rejected",
                            count: rejectedCount,
                            description: "Closed applications",
                            filter: "rejected",
                            icon: <XCircle size={21} />,
                            color: "text-red-600",
                            iconBg: "bg-red-50",
                            active: "border-red-400 ring-4 ring-red-100"
                        }
                    ].map((stat) => (
                        <button
                            key={stat.filter}
                            type="button"
                            onClick={() => setStatusFilter(stat.filter)}
                            className={`group w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                                statusFilter === stat.filter
                                    ? stat.active
                                    : "border-[#D8D0C7]"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {stat.label}
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-[#0B1F3B]">
                                        {stat.count}
                                    </p>

                                    <p className={`mt-2 text-xs font-semibold ${stat.color}`}>
                                        {stat.description}
                                    </p>
                                </div>

                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.color} transition group-hover:bg-[#0B1F3B] group-hover:text-[#C5AD8D]`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </button>
                    ))}
                </section>

                {/* SEARCH AND FILTER */}
                <section className="rounded-2xl border border-[#D8D0C7] bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search
                                size={19}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by student, email, department, or internship..."
                                className="w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] py-3 pl-11 pr-4 text-sm text-[#0B1F3B] outline-none transition placeholder:text-slate-400 focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10"
                            />
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-xl bg-[#F5F2ED] px-4 py-3 text-sm font-medium text-[#8B7355]">
                            <Filter size={17} />
                            {filteredApplications.length} shown
                        </div>
                    </div>
                </section>

                {/* ACTIVE FILTER */}
                {statusFilter !== "all" && (
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#C5AD8D]/40 bg-[#F5F2ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#8B7355]">
                                <Filter size={17} />
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[#8B7355]">
                                    Active filter
                                </p>

                                <p className="text-base font-bold capitalize text-[#0B1F3B]">
                                    {statusFilter} applications
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D0C7] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:text-[#8B7355]"
                        >
                            Show All
                            <ArrowRight size={15} />
                        </button>
                    </div>
                )}

                {/* SUCCESS MESSAGE */}
                {actionSuccess && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <CheckCircle2
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <p className="flex-1 text-sm font-medium">
                            {actionSuccess}
                        </p>

                        <button
                            type="button"
                            onClick={() => setActionSuccess("")}
                            className="text-emerald-700 hover:text-emerald-900"
                            aria-label="Dismiss success message"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* ACTION ERROR */}
                {actionError && !rejectingApplication && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {actionError}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActionError("")}
                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* APPLICATIONS */}
                {filteredApplications.length === 0 ? (
                    <div className="rounded-2xl border border-[#D8D0C7] bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                            <Users size={26} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-[#0B1F3B]">
                            {applications.length === 0
                                ? "No applications yet"
                                : statusFilter !== "all"
                                    ? `No ${statusFilter} applications`
                                    : "No matching applications"}
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {applications.length === 0
                                ? "Students who apply for your internships will appear here."
                                : statusFilter !== "all"
                                    ? `There are currently no ${statusFilter} applications matching your search.`
                                    : "Try changing your search term to find another application."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {filteredApplications.map((application) => {
                            const status = getStatusStyle(application.status);

                            return (
                                <article
                                    key={application.id}
                                    className="group overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:shadow-[0_18px_40px_rgba(11,31,59,0.09)]"
                                >
                                    {/* CARD HEADER */}
                                    <div className="border-b border-[#E7E2DC] bg-[#F8F7F4] p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D] shadow-sm">
                                                    <UserRound size={23} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h2 className="truncate text-lg font-bold text-[#0B1F3B] sm:text-xl">
                                                        {application.student_name}
                                                    </h2>

                                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#8B7355]">
                                                        <BriefcaseBusiness size={14} />
                                                        {application.internship_title}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.wrapper}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* STUDENT INFORMATION */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <Mail size={16} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Email
                                                    </p>

                                                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                                                        {application.student_email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <GraduationCap size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Department
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        {application.department || "Not provided"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <ShieldCheck size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Student ID
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        {application.student_id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <GraduationCap size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Year Level
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        Year {application.year_level}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <CalendarDays size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Applied On
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        {new Date(application.applied_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                                    <BriefcaseBusiness size={17} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Internship
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        {application.internship_title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* APPLICATION ACTIONS */}
                                        {application.status === "pending" && (
                                            <div className="mt-7 flex flex-col gap-3 border-t border-[#E7E2DC] pt-6 sm:flex-row">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAccept(application)}
                                                    disabled={updatingId === application.id}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#1E3A6F] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Accept
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRejectingApplication(application);
                                                        setRejectionReason("");
                                                        setActionError("");
                                                        setActionSuccess("");
                                                    }}
                                                    disabled={updatingId === application.id}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition-all duration-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-3 pb-2 text-xs text-slate-400">
                    <div className="h-px w-12 bg-[#D8D0C7]" />
                    <span>Woldia University Internship System</span>
                    <div className="h-px w-12 bg-[#D8D0C7]" />
                </div>
            </div>

            {/* CUSTOM ACCEPTANCE CONFIRMATION MODAL */}
            {acceptingApplication && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1F3B]/70 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget &&
                            updatingId === null
                        ) {
                            setAcceptingApplication(null);
                            setActionError("");
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="accept-modal-title"
                        className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#D8D0C7] bg-white shadow-2xl"
                    >
                        <div className="border-b border-[#E7E2DC] bg-[#F8F7F4] p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <ShieldCheck size={25} />
                                    </div>

                                    <div>
                                        <h2
                                            id="accept-modal-title"
                                            className="text-xl font-bold text-[#0B1F3B]"
                                        >
                                            Confirm Acceptance
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Review your decision before continuing.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (updatingId === null) {
                                            setAcceptingApplication(null);
                                            setActionError("");
                                        }
                                    }}
                                    disabled={updatingId !== null}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-[#0B1F3B] disabled:opacity-40"
                                    aria-label="Close confirmation"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355]">
                                    Student
                                </p>

                                <p className="mt-1 text-lg font-bold text-[#0B1F3B]">
                                    {acceptingApplication.student_name}
                                </p>

                                <p className="mt-2 text-sm text-slate-600">
                                    {acceptingApplication.internship_title}
                                </p>
                            </div>

                            <p className="mt-5 text-sm leading-6 text-slate-600">
                                Are you sure you want to accept this
                                student's application? Confirming will update
                                the application status.
                            </p>

                            {actionError && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                    <AlertCircle
                                        size={18}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <p className="text-sm">
                                        {actionError}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAcceptingApplication(null);
                                        setActionError("");
                                    }}
                                    disabled={updatingId !== null}
                                    className="flex-1 rounded-xl border border-[#D8D0C7] bg-white py-3 text-sm font-semibold text-[#0B1F3B] transition hover:bg-[#F8F7F4] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAcceptConfirm}
                                    disabled={updatingId !== null}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] py-3 text-sm font-semibold text-white transition hover:bg-[#1E3A6F] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {updatingId === acceptingApplication.id ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Accepting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Confirm Acceptance
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION MODAL */}
            {rejectingApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3B]/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-[#D8D0C7] bg-white shadow-2xl">
                        <div className="border-b border-[#E7E2DC] bg-[#F8F7F4] p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <XCircle size={22} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#0B1F3B]">
                                        Reject Application
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        You are rejecting{" "}
                                        <span className="font-semibold text-[#0B1F3B]">
                                            {rejectingApplication.student_name}
                                        </span>
                                        's application.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleRejectSubmit}
                            className="p-6"
                        >
                            <label className="mb-2 block text-sm font-semibold text-[#0B1F3B]">
                                Reason for rejection
                            </label>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Example: The applicant does not currently meet the required JavaScript skills for this internship."
                                rows="5"
                                required
                                autoFocus
                                className="w-full resize-y rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm text-[#0B1F3B] outline-none transition placeholder:text-slate-400 focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10"
                            />

                            <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-400">
                                <ShieldCheck
                                    size={14}
                                    className="mt-0.5 shrink-0 text-[#8B7355]"
                                />

                                <p>
                                    Provide a clear and professional reason
                                    so the student understands the decision.
                                </p>
                            </div>

                            {actionError && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                    <AlertCircle
                                        size={18}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <p className="text-sm">
                                        {actionError}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectingApplication(null);
                                        setRejectionReason("");
                                        setActionError("");
                                    }}
                                    disabled={updatingId !== null}
                                    className="flex-1 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] py-3 text-sm font-semibold text-[#0B1F3B] transition hover:bg-[#F0ECE6] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={updatingId === rejectingApplication.id}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {updatingId === rejectingApplication.id ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Rejecting...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={18} />
                                            Confirm Rejection
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default CompanyApplications;