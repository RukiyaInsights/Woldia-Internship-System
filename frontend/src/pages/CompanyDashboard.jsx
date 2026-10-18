import { useNavigate } from "react-router-dom";
import {
    BriefcaseBusiness,
    Users,
    MessageSquare,
    Plus,
    ArrowRight,
    Building2,
    Sparkles,
    ShieldCheck,
    ChevronRight
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function CompanyDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const actions = [
        {
            title: "Create Internship",
            description:
                "Publish a new internship opportunity and attract qualified Woldia University students.",
            icon: Plus,
            path: "/company/internships/create",
            label: "Create opportunity",
        },
        {
            title: "Student Applications",
            description:
                "Review applications, examine student information, and make application decisions.",
            icon: Users,
            path: "/company/applications",
            label: "Review applications",
        },
        {
            title: "Messages",
            description:
                "Communicate privately with assigned supervisors about student situations.",
            icon: MessageSquare,
            path: "/company/messages",
            label: "Open messages",
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* =====================================================
                    HERO
                ====================================================== */}
                <section className="relative overflow-hidden rounded-2xl bg-[#0B1F3B] shadow-lg">

                    {/* Soft decorative glow */}
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B7355]/20 blur-3xl" />
                    <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#1E3A6F]/40 blur-3xl" />

                    {/* Decorative circles */}
                    <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-white/10" />
                    <div className="absolute right-20 top-20 h-16 w-16 rounded-full border border-[#C5AD8D]/20" />

                    <div className="relative z-10 p-5 sm:p-6 lg:p-7">

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="max-w-3xl">

                                {/* Portal label */}
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7CEC4] backdrop-blur-sm">
                                    <Sparkles size={15} className="text-[#C5AD8D]" />
                                    Company Portal
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                    Welcome,{" "}
                                    <span className="text-[#C5AD8D]">
                                        {user?.full_name || "Company"}
                                    </span>
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D7CEC4]">
                                    Manage internship opportunities, review
                                    student applications, and connect with
                                    qualified Woldia University students
                                    through one secure platform.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">

                                    <button
                                        onClick={() =>
                                            navigate("/company/internships/create")
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#8B7355] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#A38B6D] hover:shadow-xl"
                                    >
                                        <Plus size={18} />
                                        Create Internship
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigate("/company/applications")
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                                    >
                                        <Users size={18} />
                                        View Applications
                                    </button>

                                </div>

                            </div>

                            {/* Hero visual */}
                            <div className="hidden lg:flex lg:pr-6">
                                <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">

                                    <div className="absolute inset-3 rounded-[1.5rem] border border-[#C5AD8D]/20" />

                                    <Building2
                                        size={55}
                                        strokeWidth={1.4}
                                        className="relative text-[#C5AD8D]"
                                    />

                                    <div className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#8B7355] text-white shadow-lg">
                                        <ShieldCheck size={21} />
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </section>


                {/* =====================================================
                    QUICK ACTIONS
                ====================================================== */}
                <section>

                    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7355]">
                                Workspace
                            </p>

                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B1F3B]">
                                Quick Actions
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage your company's internship activities.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
                            <BriefcaseBusiness size={15} />
                            Company management
                        </div>
                    </div>


                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                        {actions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.title}
                                    onClick={() => navigate(action.path)}
                                    className="group relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-white p-4text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A38B6D]/50 hover:shadow-md"
                                >

                                    {/* Top subtle shine */}
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C5AD8D]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    <div className="flex items-start justify-between">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2ED] text-[#8B7355] transition-all duration-300 group-hover:bg-[#0B1F3B] group-hover:text-[#C5AD8D] group-hover:shadow-lg">
                                            <Icon size={20} strokeWidth={1.9} />
                                        </div>

                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-all duration-300 group-hover:bg-[#F5F2ED] group-hover:text-[#8B7355]">
                                            <ArrowRight
                                                size={19}
                                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                                            />
                                        </div>

                                    </div>


                                    <div className="mt-4">

                                        <h3 className="text-base font-bold text-[#0B1F3B]">
                                            {action.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {action.description}
                                        </p>

                                    </div>


                                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#8B7355]">
                                        {action.label}
                                        <ChevronRight
                                            size={14}
                                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                                        />
                                    </div>

                                </button>
                            );
                        })}

                    </div>

                </section>


                {/* =====================================================
                    INFORMATION / TRUST CARD
                ====================================================== */}
                <section className="relative overflow-hidden rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4 shadow-sm sm:p-5">

                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#C5AD8D]/10 blur-2xl" />

                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D] shadow-md">
                            <Building2 size={22} strokeWidth={1.8} />
                        </div>

                        <div className="flex-1">

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                                <h3 className="font-bold text-[#0B1F3B]">
                                    Company Internship Management
                                </h3>

                                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8B7355]">
                                    <ShieldCheck size={13} />
                                    Secure workspace
                                </div>

                            </div>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                Create opportunities, review applications,
                                make informed decisions, and communicate with
                                university supervisors through one secure
                                platform.
                            </p>

                        </div>

                    </div>

                </section>


                {/* Bottom accent */}
                <div className="flex items-center justify-center gap-3 pb-2 text-xs text-slate-400">
                    <div className="h-px w-12 bg-[#D8D0C7]" />
                    <span>Woldia University Internship System</span>
                    <div className="h-px w-12 bg-[#D8D0C7]" />
                </div>

            </div>
        </AppLayout>
    );
}

export default CompanyDashboard;