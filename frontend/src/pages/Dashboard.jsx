import {
    UserRound,
    Mail,
    ShieldCheck,
    GraduationCap,
    ArrowRight
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <AppLayout>
            <div className="mx-auto max-w-6xl">

                {/* Hero */}
                <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-[#0B1F3B] px-6 py-10 shadow-xl sm:px-8 sm:py-12">

                    <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#8B7355]/20 blur-3xl" />

                    <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#C5AD8D]/10 blur-3xl" />

                    <div className="relative">

                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C5AD8D]">
                            <GraduationCap size={14} />
                            Woldia University
                        </div>

                        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Welcome to the Internship System
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                            Manage your university internship activities,
                            applications, supervision, and communication
                            through one secure platform.
                        </p>

                    </div>

                </section>

                {user ? (
                    <>
                        {/* Welcome Card */}
                        <section className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#D8D0C7] bg-white shadow-sm">

                            <div className="border-b border-[#D8D0C7] bg-[#F8F7F4] p-6 sm:p-8">

                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F3B] text-xl font-bold text-[#C5AD8D] shadow-md">

                                        {user.full_name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}

                                    </div>

                                    <div>

                                        <p className="text-sm font-semibold uppercase tracking-wider text-[#8B7355]">
                                            Your Account
                                        </p>

                                        <h2 className="mt-1 text-2xl font-bold text-[#0B1F3B]">
                                            Welcome, {user.full_name}!
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Your account is securely connected
                                            to the internship system.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* User Information */}
                            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 sm:p-8">

                                <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-5">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8B7355] shadow-sm">
                                            <Mail size={19} />
                                        </div>

                                        <div className="min-w-0">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Email
                                            </p>

                                            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                                                {user.email}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-5">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8B7355] shadow-sm">
                                            <ShieldCheck size={19} />
                                        </div>

                                        <div>

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Account Role
                                            </p>

                                            <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                                                {user.role}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </section>

                        {/* Role Information */}
                        <section className="rounded-[1.5rem] border border-[#D8D0C7] bg-[#F8F7F4] p-6 sm:p-8">

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                        <UserRound size={21} />
                                    </div>

                                    <div>

                                        <h3 className="font-bold text-[#0B1F3B]">
                                            {user.role === "student"
                                                ? "Student Workspace"
                                                : user.role === "company"
                                                ? "Company Workspace"
                                                : user.role === "supervisor"
                                                ? "Supervisor Workspace"
                                                : user.role === "admin"
                                                ? "Administration Workspace"
                                                : "Internship Workspace"}
                                        </h3>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Your available features are
                                            organized according to your
                                            account role.
                                        </p>

                                    </div>

                                </div>

                                <div className="flex items-center gap-2 text-sm font-semibold text-[#8B7355]">
                                    <span>Role: {user.role}</span>
                                    <ArrowRight size={16} />
                                </div>

                            </div>

                        </section>

                    </>
                ) : (

                    /* No User */
                    <section className="overflow-hidden rounded-[1.75rem] border border-[#D8D0C7] bg-white shadow-sm">

                        <div className="p-10 text-center sm:p-16">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                                <UserRound size={30} />
                            </div>

                            <h2 className="mt-5 text-xl font-bold text-[#0B1F3B]">
                                No user is currently logged in
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Please log in to access your internship
                                workspace and account information.
                            </p>

                        </div>

                    </section>

                )}

                {/* Security Footer */}
                <div className="mt-6 flex items-center justify-center gap-2 pb-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    <span className="h-px w-8 bg-[#C5AD8D]" />
                    Secure University Internship Platform
                    <span className="h-px w-8 bg-[#C5AD8D]" />
                </div>

            </div>
        </AppLayout>
    );
}

export default Dashboard;