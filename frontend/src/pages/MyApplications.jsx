import { useEffect, useState } from "react";
import {
    FileText,
    Building2,
    MapPin,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock3,
    AlertCircle,
    Briefcase,
    ShieldCheck,
    ArrowRight,
    RefreshCw,
    GraduationCap,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchApplications = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Your session has expired. Please log in again.");
                return;
            }

            const response = await fetch(
                "https://woldia-internship-system.onrender.com/api/students/applications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Unable to load your applications."
                );
                return;
            }

            setApplications(
                Array.isArray(data.applications)
                    ? data.applications
                    : []
            );
        } catch (err) {
            console.error("Fetch applications error:", err);
            setError(
                "Unable to connect to the server. Please check that the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const getStatusInfo = (status) => {
        const normalizedStatus = String(status || "pending").toLowerCase();

        if (normalizedStatus === "accepted") {
            return {
                label: "Accepted",
                className:
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
                icon: CheckCircle2,
                message:
                    "Congratulations! Your application has been accepted.",
            };
        }

        if (normalizedStatus === "rejected") {
            return {
                label: "Rejected",
                className: "border-red-200 bg-red-50 text-red-700",
                icon: XCircle,
                message:
                    "This application was not accepted. You can continue exploring other opportunities.",
            };
        }

        return {
            label: "Pending",
            className: "border-amber-200 bg-amber-50 text-amber-700",
            icon: Clock3,
            message:
                "Your application is awaiting a decision from the company.",
        };
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(date);
        }

        return parsedDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const acceptedCount = applications.filter(
        (application) =>
            String(application.status || "").toLowerCase() === "accepted"
    ).length;

    const pendingCount = applications.filter((application) => {
        const status = String(application.status || "pending").toLowerCase();

        return status !== "accepted" && status !== "rejected";
    }).length;

    const rejectedCount = applications.filter(
        (application) =>
            String(application.status || "").toLowerCase() === "rejected"
    ).length;

    if (loading) {
        return (
            <AppLayout>
                <div className="flex min-h-[60vh] items-center justify-center px-4">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#C5AD8D]/30 border-t-[#8B7355]" />

                        <h2 className="font-semibold text-[#0B1F3B]">
                            Loading your applications
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Please wait while we retrieve your records.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
                    <div className="w-full rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <AlertCircle size={24} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-[#0B1F3B]">
                                    Unable to load applications
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={fetchApplications}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F3B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E3A6F] focus:outline-none focus:ring-2 focus:ring-[#C5AD8D] focus:ring-offset-2"
                                >
                                    <RefreshCw size={16} />
                                    Try again
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
            <div className="mx-auto max-w-7xl">
                {/* Hero section */}
                <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B1F3B] via-[#132D50] to-[#1E3A6F] px-6 py-8 shadow-xl sm:px-8 sm:py-10">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#8B7355]/25 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#C5AD8D]/15 blur-3xl" />

                    <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#E0CCAD]">
                                <GraduationCap size={15} />
                                Student Portal
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                My Applications
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                                Keep track of your internship applications,
                                monitor company decisions, and follow your
                                progress toward your professional goals.
                            </p>
                        </div>

                        <div className="relative shrink-0 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B7355] text-white shadow-lg">
                                    <FileText size={23} />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-300">
                                        Total Applications
                                    </p>

                                    <p className="mt-1 text-3xl font-bold text-white">
                                        {applications.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Application statistics */}
                <section
                    aria-label="Application statistics"
                    className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <StatCard
                        label="Pending"
                        count={pendingCount}
                        icon={Clock3}
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <StatCard
                        label="Accepted"
                        count={acceptedCount}
                        icon={CheckCircle2}
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <StatCard
                        label="Rejected"
                        count={rejectedCount}
                        icon={XCircle}
                        iconClass="bg-red-50 text-red-600"
                    />
                </section>

                {/* Applications heading */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#0B1F3B] sm:text-2xl">
                            Your Internship Records
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Review the details and current status of each
                            application.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchApplications}
                        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#D8D0C7] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:bg-[#F8F7F4] focus:outline-none focus:ring-2 focus:ring-[#C5AD8D]"
                    >
                        <RefreshCw size={15} />
                        Refresh applications
                    </button>
                </div>

                {/* Empty state */}
                {applications.length === 0 ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-[#D8D0C7] bg-white shadow-sm">
                        <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                                <Briefcase size={30} />
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-[#0B1F3B]">
                                No applications yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                You have not applied for any internships yet.
                                Explore available opportunities and submit an
                                application when you find a suitable placement.
                            </p>

                            <a
                                href="/student/internships"
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#1E3A6F] focus:outline-none focus:ring-2 focus:ring-[#C5AD8D] focus:ring-offset-2"
                            >
                                Browse internships
                                <ArrowRight size={17} />
                            </a>
                        </div>

                        <div className="border-t border-[#D8D0C7] bg-[#F8F7F4] px-6 py-4 text-center text-xs font-medium text-slate-500">
                            Woldia University Internship Management System
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {applications.map((application) => {
                            const status = getStatusInfo(application.status);
                            const StatusIcon = status.icon;

                            return (
                                <article
                                    key={application.id}
                                    className="overflow-hidden rounded-[1.5rem] border border-[#D8D0C7] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    {/* Application header */}
                                    <div className="border-b border-[#D8D0C7] bg-[#F8F7F4] p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-white shadow-md">
                                                    <Building2 size={21} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="break-words text-sm font-semibold text-[#8B7355]">
                                                        {application.company_name ||
                                                            application.company ||
                                                            "Company not specified"}
                                                    </p>

                                                    <h3 className="mt-1 break-words text-lg font-bold text-[#0B1F3B]">
                                                        {application.internship_title ||
                                                            application.title ||
                                                            "Internship opportunity"}
                                                    </h3>
                                                </div>
                                            </div>

                                            <span
                                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${status.className}`}
                                            >
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Application details */}
                                    <div className="p-5 sm:p-6">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <DetailItem
                                                icon={MapPin}
                                                label="Location"
                                                value={
                                                    application.location ||
                                                    "Not specified"
                                                }
                                            />

                                            <DetailItem
                                                icon={CalendarDays}
                                                label="Applied On"
                                                value={formatDate(
                                                    application.applied_at
                                                )}
                                            />
                                        </div>

                                        {/* Internship period */}
                                        <div className="mt-5 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                Internship Period
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
                                                <CalendarDays
                                                    size={16}
                                                    className="text-[#8B7355]"
                                                />

                                                <span>
                                                    {formatDate(
                                                        application.start_date
                                                    )}
                                                </span>

                                                <ArrowRight
                                                    size={15}
                                                    className="text-slate-400"
                                                />

                                                <span>
                                                    {formatDate(
                                                        application.end_date
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status information */}
                                        <div className="mt-5 flex items-start gap-3 border-t border-[#D8D0C7] pt-5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                                <StatusIcon size={18} />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-[#0B1F3B]">
                                                    Application Status
                                                </p>

                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {status.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Information card */}
                <div className="mt-8 rounded-[1.5rem] border border-[#D8D0C7] bg-[#F8F7F4] p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                            <ShieldCheck size={21} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#0B1F3B]">
                                Application Tracking
                            </h3>

                            <p className="mt-1 text-sm leading-7 text-slate-500">
                                Your application information is retrieved
                                through the internship management system.
                                Refresh this page to check for updated
                                decisions from companies.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer accent */}
                <div className="mt-6 flex items-center justify-center gap-3 pb-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">
                    <span className="h-px w-6 bg-[#C5AD8D] sm:w-8" />
                    Woldia University Internship System
                    <span className="h-px w-6 bg-[#C5AD8D] sm:w-8" />
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, count, icon: Icon, iconClass }) {
    return (
        <div className="rounded-2xl border border-[#D8D0C7] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#0B1F3B]">
                        {count}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                <Icon size={17} />
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </p>

                <p className="break-words text-sm font-medium text-slate-700">
                    {value}
                </p>
            </div>
        </div>
    );
}

export default MyApplications;