import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    GraduationCap,
    Building2,
    UserRoundCheck,
    BriefcaseBusiness,
    Clock3,
    ArrowRight,
    ShieldCheck,
    Users,
    ClipboardCheck,
    RefreshCw,
    AlertCircle,
    Sparkles,
    ChevronRight
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function AdminDashboard() {
    const [stats, setStats] = useState({
        students: 0,
        companies: 0,
        supervisors: 0,
        internships: 0,
        pendingInternships: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/admin/stats",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load statistics."
                );
            }

            setStats(data.stats);
        } catch (error) {
            console.error(
                "Error loading admin statistics:",
                error
            );

            setError(
                error.message ||
                    "Unable to load admin statistics."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [token]);

    const statCards = [
        {
            title: "Total Students",
            value: stats.students,
            icon: GraduationCap,
            description: "Registered students"
        },
        {
            title: "Total Companies",
            value: stats.companies,
            icon: Building2,
            description: "Registered companies"
        },
        {
            title: "Supervisors",
            value: stats.supervisors,
            icon: UserRoundCheck,
            description: "University supervisors"
        },
        {
            title: "Internships",
            value: stats.internships,
            icon: BriefcaseBusiness,
            description: "Internship opportunities"
        }
    ];

    return (
        <AppLayout>
            <div className="mx-auto max-w-7xl space-y-6 pb-6">

                {/* HERO */}
                <section className="relative overflow-hidden rounded-2xl  bg-[#0B1F3B] shadow-lg">

                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B7355]/20 blur-3xl" />

                    <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#1E3A6F]/40 blur-3xl" />

                    <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-white/10" />

                    <div className="absolute right-20 top-20 h-16 w-16 rounded-full border border-[#C5AD8D]/20" />

                    <div className="relative z-10 p-5 sm:p-6 lg:p-7">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="max-w-3xl">

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7CEC4] backdrop-blur-sm">
                                    <Sparkles
                                        size={15}
                                        className="text-[#C5AD8D]"
                                    />

                                    Administration Portal
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                    Welcome,{" "}
                                    <span className="text-[#C5AD8D]">
                                        {user?.full_name ||
                                            "Administrator"}
                                    </span>
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D7CEC4]">
                                    Manage students, companies,
                                    supervisors, internships, and the
                                    university internship lifecycle from
                                    one centralized platform.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">

                                    <Link
                                        to="/admin/internships/pending"
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#8B7355] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#A38B6D] hover:shadow-xl"
                                    >
                                        <ClipboardCheck size={18} />
                                        Review Internships
                                        <ChevronRight size={15} />
                                    </Link>

                                    <Link
                                        to="/admin/assignments"
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                                    >
                                        <UserRoundCheck size={18} />
                                        Supervisor Assignments
                                    </Link>

                                </div>

                            </div>

                            <div className="hidden lg:flex lg:pr-6">

                                <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">

                                    <div className="absolute inset-3 rounded-[1.5rem] border border-[#C5AD8D]/20" />

                                    <ShieldCheck
                                        size={56}
                                        strokeWidth={1.4}
                                        className="relative text-[#C5AD8D]"
                                    />

                                    <div className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#8B7355] text-white shadow-lg">
                                        <ClipboardCheck size={21} />
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>
                </section>

                {/* ERROR */}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                            <div className="flex items-start gap-3">

                                <AlertCircle
                                    size={21}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="font-semibold">
                                        Unable to load dashboard statistics
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {error}
                                    </p>
                                </div>

                            </div>

                            <button
                                onClick={fetchStats}
                                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
                            >
                                <RefreshCw size={15} />
                                Retry
                            </button>

                        </div>

                    </div>
                )}

                {/* STATISTICS */}
                <section>

                    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7355]">
                                Overview
                            </p>

                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B1F3B]">
                                System Statistics
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                A current overview of the university
                                internship platform.
                            </p>

                        </div>

                        <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
                            <ShieldCheck size={15} />
                            Administration management
                        </div>

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                        {statCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.title}
                                    className="group relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                >

                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C5AD8D]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-sm font-medium text-slate-500">
                                                {card.title}
                                            </p>

                                            <p className="mt-1.5 text-2xl font-bold text-[#0B1F3B]">
                                                {loading
                                                    ? "..."
                                                    : card.value}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {card.description}
                                            </p>

                                        </div>

                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355] transition-all duration-300 group-hover:bg-[#0B1F3B] group-hover:text-[#C5AD8D]">
                                            <Icon size={20} />
                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                </section>

                {/* INTERNSHIP APPROVAL */}
                <Link
                    to="/admin/internships/pending"
                    className="group block overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,31,59,0.10)]"
                >

                    <div className="h-1 bg-gradient-to-r from-[#0B1F3B] via-[#8B7355] to-[#C5AD8D]" />

                    <div className="p-4 md:p-5">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-start gap-4">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                    <ClipboardCheck size={21} />
                                </div>

                                <div>

                                    <div className="flex flex-wrap items-center gap-3">

                                        <h2 className="text-lg font-bold text-[#0B1F3B]">
                                            Internship Approval
                                        </h2>

                                        <span className="rounded-full bg-[#F5F2ED] px-3 py-1 text-xs font-semibold text-[#8B7355]">
                                            Requires Review
                                        </span>

                                    </div>

                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                        Review internship opportunities
                                        submitted by companies before they
                                        become available to students.
                                    </p>

                                </div>

                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                                <div className="min-w-[110px] rounded-lg border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-2.5 text-center">

                                    <div className="flex items-center justify-center gap-2 text-[#8B7355]">

                                        <Clock3 size={16} />

                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Pending
                                        </span>

                                    </div>

                                    <p className="mt-1 text-2xl font-bold text-[#0B1F3B]">
                                        {loading
                                            ? "..."
                                            : stats.pendingInternships}
                                    </p>

                                </div>

                                <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B7355] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#A38B6D] group-hover:shadow-xl">
                                    Review Internships
                                    <ArrowRight size={17} />
                                </div>

                            </div>

                        </div>

                    </div>
                </Link>

                {/* ADMINISTRATION OVERVIEW */}
                <section>

                    <div className="mb-5">

                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7355]">
                            Management
                        </p>

                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B1F3B]">
                            Administration Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Core responsibilities available through the
                            administration portal.
                        </p>

                    </div>

                    <div className="grid gap-3 md:grid-cols-3">

                        {/* INTERNSHIP APPROVAL */}
                        <Link
                            to="/admin/internships/pending"
                            className="group relative overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,31,59,0.08)]"
                        >

                            <div className="absolute inset-x-0 top-0 h-1 bg-[#8B7355] opacity-0 transition group-hover:opacity-100" />

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                <ClipboardCheck size={22} />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">

                                <h3 className="font-bold text-[#0B1F3B]">
                                    Internship Approval
                                </h3>

                                <ArrowRight
                                    size={18}
                                    className="text-[#8B7355] transition group-hover:translate-x-1"
                                />

                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Review and approve internship opportunities
                                submitted by companies.
                            </p>

                        </Link>

                        {/* USER MANAGEMENT */}
                        <div className="relative overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white p-4 shadow-sm">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                <Users size={22} />
                            </div>

                            <h3 className="mt-4 font-bold text-[#0B1F3B]">
                                User Management
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Manage students, companies, and university
                                supervisors participating in the system.
                            </p>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F8F7F4] px-3 py-1.5 text-xs font-medium text-slate-400">
                                <Clock3 size={13} />
                                Management tools coming soon
                            </div>

                        </div>

                        {/* SUPERVISOR ASSIGNMENT */}
                        <Link
                            to="/admin/assignments"
                            className="group relative overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,31,59,0.08)]"
                        >

                            <div className="absolute inset-x-0 top-0 h-1 bg-[#8B7355] opacity-0 transition group-hover:opacity-100" />

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355]">
                                <UserRoundCheck size={22} />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">

                                <h3 className="font-bold text-[#0B1F3B]">
                                    Supervisor Assignment
                                </h3>

                                <ArrowRight
                                    size={18}
                                    className="text-[#8B7355] transition group-hover:translate-x-1"
                                />

                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Assign university supervisors to students
                                with active internship placements.
                            </p>

                        </Link>

                    </div>

                </section>

                {/* ADMIN NOTICE */}
                <section className="relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4 shadow-sm sm:p-5">

                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#C5AD8D]/10 blur-2xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D] shadow-md">
                            <ShieldCheck
                                size={22}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div className="flex-1">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                <h3 className="font-bold text-[#0B1F3B]">
                                    Administrator Access
                                </h3>

                                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8B7355]">
                                    <ShieldCheck size={13} />
                                    Secure workspace
                                </div>

                            </div>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                This dashboard is protected by authentication
                                and administrator role authorization.
                                Administrative actions should only be performed
                                by authorized university personnel.
                            </p>

                        </div>

                    </div>

                </section>

                {/* BOTTOM ACCENT */}
                <div className="flex items-center justify-center gap-3 pb-2 text-xs text-slate-400">

                    <div className="h-px w-12 bg-[#D8D0C7]" />

                    <span>
                        Woldia University Internship System
                    </span>

                    <div className="h-px w-12 bg-[#D8D0C7]" />

                </div>

            </div>
        </AppLayout>
    );
}

export default AdminDashboard;