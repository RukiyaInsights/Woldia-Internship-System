import { Link } from "react-router-dom";
import {
    ArrowRight,
    Building2,
    GraduationCap,
    ShieldCheck,
    Users,
    ChevronRight,
} from "lucide-react";
import woldiaLogo from "../assets/woldia-university-logo.png";

function Home() {
    return (
        <div className="min-h-screen bg-[#F5F2ED] text-[#0B1F3B]">
            {/* =========================
                HERO SECTION
            ========================== */}
            <section
    className="relative flex min-h-screen flex-col overflow-hidden"
    style={{ backgroundColor: "#0B1F3B" }}
>
                {/* Subtle decorative elements */}
                <div className="pointer-events-none absolute left-10 top-28 h-32 w-32 rounded-full border border-white/5" />

                <div className="pointer-events-none absolute bottom-24 right-10 h-44 w-44 rounded-full border border-[#C5AD8D]/10" />

                {/* Top navigation */}
                <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-end px-5 py-5 sm:px-8 lg:px-10">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/login"
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition duration-300 hover:bg-white/10"
                        >
                            Sign In
                        </Link>

                        <Link
                            to="/register"
                            className="rounded-xl border border-[#C5AD8D]/30 bg-[#8B7355] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#A38B6D]"
                        >
                            Register
                        </Link>
                    </div>
                </nav>

                {/* Main hero content */}
                <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-28 pt-4 sm:px-8 sm:pt-0">
                    <div className="mx-auto w-full max-w-3xl text-center">

                        {/* University Branding */}
                        <div className="flex flex-col items-center">

                            {/* University Logo */}
                            <div className="flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48">
                                <img
                                    src={woldiaLogo}
                                    alt="Woldia University"
                                    className="h-full w-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.35)]"
                                />
                            </div>

                            {/* University Name and Project Title */}
                            <div className="mt-5">
                                <h1 className="animate-project-title text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Woldia University
                                </h1>

                                <p className="animate-project-title mt-2 text-base font-normal tracking-wide text-[#C5AD8D] sm:text-lg">
                                    Internship Management System
                                </p>
                            </div>
                        </div>

                        {/* Animated Description */}
                        <p className="animate-home-description mx-auto mt-5 max-w-xl text-sm leading-7 text-[#B9C5D2] sm:text-base">
                            A secure university platform connecting students,
                            internship organizations, supervisors, and
                            administrators throughout the internship journey.
                        </p>

                        {/* Animated Main Buttons */}
                        <div className="animate-home-buttons mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                to="/login"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#0B1F3B] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
                            >
                                Sign In
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>

                            <Link
                                to="/register"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
                            >
                                Create an Account
                                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Animated Trust Indicators */}
                        <div className="animate-home-features mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#9EABB9]">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#C5AD8D]" />
                                Secure Access
                            </div>

                            <div className="hidden h-3 w-px bg-white/10 sm:block" />

                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#C5AD8D]" />
                                Role-Based Access
                            </div>

                            <div className="hidden h-3 w-px bg-white/10 sm:block" />

                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-[#C5AD8D]" />
                                Internship Coordination
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom indicator */}
            </section>

            {/* =========================
                FEATURES SECTION
            ========================== */}
            <section className="bg-[#F5F2ED] px-5 py-20 sm:px-8 lg:px-10">
                <div className="mx-auto max-w-6xl">

                    {/* Section heading */}
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B7355]">
                            One Connected Platform
                        </p>

                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B1F3B] sm:text-4xl">
                            Supporting the complete internship journey
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[#66717F] sm:text-base">
                            From finding an opportunity to supervision and
                            progress monitoring, the platform brings the major
                            internship activities together in one place.
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                        <FeatureCard
                            icon={<GraduationCap className="h-6 w-6" />}
                            title="For Students"
                            text="Manage your profile, explore internships, apply for opportunities, and submit progress reports."
                        />

                        <FeatureCard
                            icon={<Building2 className="h-6 w-6" />}
                            title="For Companies"
                            text="Create internship opportunities, review applications, and communicate with assigned supervisors."
                        />

                        <FeatureCard
                            icon={<Users className="h-6 w-6" />}
                            title="For Supervisors"
                            text="Monitor assigned students, review reports, and provide meaningful feedback."
                        />

                        <FeatureCard
                            icon={<ShieldCheck className="h-6 w-6" />}
                            title="For Administration"
                            text="Approve internships, assign supervisors, and coordinate the university internship process."
                        />
                    </div>
                </div>
            </section>

            {/* =========================
                FOOTER
            ========================== */}
            <footer className="border-t border-[#D8D0C7] bg-[#0B1F3B] px-5 py-8 sm:px-8 lg:px-10">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

                    <div>
                        <p className="text-sm font-medium text-white">
                            Woldia University
                        </p>

                        <p className="mt-1 text-xs text-[#9EABB9]">
                            Internship Management System
                        </p>
                    </div>

                    <p className="text-xs text-[#9EABB9]">
                        Connecting students, organizations, and supervisors.
                    </p>
                </div>
            </footer>
        </div>
    );
}

/* =========================
   FEATURE CARD
========================= */
function FeatureCard({ icon, title, text }) {
    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DDD2] bg-white p-6 shadow-[0_4px_20px_rgba(11,31,59,0.04)] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#C5AD8D] hover:shadow-[0_18px_40px_rgba(11,31,59,0.12)]">

            {/* Decorative top accent */}
            <div className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-[#C5AD8D] transition-transform duration-300 group-hover:scale-x-100" />

            {/* Icon */}
            <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1F3B] text-[#D8C5A8] shadow-md shadow-[#0B1F3B]/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#8B7355] group-hover:text-white">
                    {icon}
                </div>

                <ChevronRight className="h-5 w-5 text-[#C5AD8D] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>

            {/* Title */}
            <h3 className="mt-6 text-lg font-bold tracking-tight text-[#0B1F3B] transition-colors duration-300 group-hover:text-[#8B7355]">
                {title}
            </h3>

            {/* Decorative divider */}
            <div className="mt-3 h-0.5 w-9 rounded-full bg-[#C5AD8D] transition-all duration-300 group-hover:w-16" />

            {/* Description */}
            <p className="mt-4 flex-1 text-sm leading-7 text-[#697482]">
                {text}
            </p>
        </div>
    );
}

export default Home;