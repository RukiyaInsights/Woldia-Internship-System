import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    GraduationCap,
    ArrowRight,
    ArrowLeft,
    Building2,
    Users,
} from "lucide-react";

import woldiaLogo from "../assets/woldia-university-logo.png";
function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "student",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const dashboardRoutes = {
        student: "/student",
        company: "/company",
        supervisor: "/supervisor",
        admin: "/admin",
    };

    const roleOptions = [
        {
            value: "student",
            label: "Student",
        },
        {
            value: "company",
            label: "Company",
        },
        {
            value: "supervisor",
            label: "Supervisor",
        },
        {
            value: "admin",
            label: "Admin",
        },
    ];

    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value,
        }));

        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        password: formData.password,
                        role: formData.role,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed.");
                return;
            }

            if (
                !data.token ||
                !data.user ||
                data.user.id == null ||
                !data.user.role
            ) {
                setError(
                    "Login failed: invalid authentication response."
                );
                return;
            }

            if (data.user.role !== formData.role) {
                setError(
                    "The selected role does not match your account. Please select the correct role."
                );
                return;
            }

            const dashboardRoute = dashboardRoutes[data.user.role];

            if (!dashboardRoute) {
                setError(
                    "Your account has an invalid role. Please contact the administrator."
                );
                return;
            }

            localStorage.clear();
            sessionStorage.clear();

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            localStorage.setItem("role", data.user.role);

            localStorage.setItem(
                "userName",
                data.user.full_name || "User"
            );

            setMessage("Login successful!");

            navigate(dashboardRoute, {
                replace: true,
            });
        } catch (error) {
            console.error("Login error:", error);

            setError(
                "Unable to connect to the server. Please check that the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F8F7F4] px-4 py-6 sm:px-6 lg:px-8">

            {/* Background decoration */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#0B1F3B]/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#8B7355]/15 blur-3xl" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C5AD8D]/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">

                <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#D8D0C7] bg-white shadow-[0_25px_70px_rgba(11,31,59,0.14)] lg:grid-cols-2">

                    {/* Left information panel */}
                    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#07182E] via-[#0B1F3B] to-[#132E4F] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">

                        <div className="relative z-10">
                            <div className="flex items-center gap-4">

                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5">
                                    <img
                                        src={woldiaLogo}
                                        alt="Woldia University"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#C5AD8D]">
                                        Woldia University
                                    </p>

                                    <p className="mt-1 text-xs text-slate-300">
                                        Internship Management System
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="relative z-10 my-12">

                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#D7CEC4]">
                                <ShieldCheck size={14} />
                                Secure Internship Platform
                            </div>

                            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                Connect.
                                <br />
                                Learn.
                                <br />
                                <span className="text-[#C5AD8D]">
                                    Grow.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                                A secure platform connecting
                                Woldia University students,
                                supervisors, and organizations
                                for meaningful internship experiences.
                            </p>

                            <div className="mt-9 space-y-5">

                                <div className="flex items-center gap-3">
                                    <GraduationCap
                                        size={22}
                                        className="text-[#C5AD8D]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Student Opportunities
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Discover and apply for internships.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Building2
                                        size={22}
                                        className="text-[#C5AD8D]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Organization Connections
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Connect students with opportunities.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Users
                                        size={22}
                                        className="text-[#C5AD8D]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Guided Internship Support
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Supervisors support student progress.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="relative z-10 border-t border-white/10 pt-5">
                            <p className="text-xs text-slate-400">
                                Woldia University
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Internship Management System
                            </p>
                        </div>

                    </div>

                    {/* Login form */}
                    <div className="flex items-center justify-center bg-white p-6 sm:p-10 lg:p-14">

                        <div className="w-full max-w-md">

                            {/* Mobile branding */}
                            <div className="mb-8 text-center lg:hidden">
                                <img
                                    src={woldiaLogo}
                                    alt="Woldia University"
                                    className="mx-auto h-20 w-20 object-contain"
                                />

                                <h1 className="mt-4 text-xl font-bold text-[#0B1F3B]">
                                    Woldia University
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Internship Management System
                                </p>
                            </div>

                            {/* Heading */}
                            <div className="mb-8">

                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C5AD8D]/30 bg-[#C5AD8D]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#6F5A42]">
                                    <ShieldCheck size={14} />
                                    Secure Access
                                </div>

                                <h2 className="text-3xl font-bold text-[#0B1F3B]">
                                    Welcome back
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Sign in to access your internship dashboard.
                                </p>

                            </div>

                            {/* Login form fields */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >

                                {/* Role selector */}
                                <div>
                                    <label
                                        htmlFor="role"
                                        className="mb-2 block text-sm font-semibold text-[#24344D]"
                                    >
                                        Sign in as
                                    </label>

                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3.5 text-sm text-[#24344D] outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                    >
                                        {roleOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Choose the role assigned to your account.
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-[#24344D]"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">

                                        <Mail
                                            size={19}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]"
                                        />

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email address"
                                            required
                                            autoComplete="email"
                                            className="w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                        />

                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold text-[#24344D]"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">

                                        <Lock
                                            size={19}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]"
                                        />

                                        <input
    id="password"
    type={showPassword ? "text" : "password"}
    name="password"
    value={formData.password}
    onChange={handleChange}
    placeholder="Enter your password"
    required
    autoComplete="current-password"
    className="password-input-no-extra-eye w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
/>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-[#0B1F3B]/5 hover:text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#C5AD8D]"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>

                                    </div>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
                                    >
                                        <AlertCircle
                                            size={19}
                                            className="shrink-0"
                                        />

                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Success message */}
                                {message && (
                                    <div
                                        role="status"
                                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
                                    >
                                        <CheckCircle2
                                            size={19}
                                            className="shrink-0"
                                        />

                                        <p>{message}</p>
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#102B50] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#C5AD8D]/40 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <LogIn size={18} />

                                    {loading
                                        ? "Signing in..."
                                        : "Sign in"}

                                    {!loading && (
                                        <ArrowRight
                                            size={17}
                                            className="transition-transform duration-300 group-hover:translate-x-1"
                                        />
                                    )}
                                </button>

                            </form>

                            {/* Security information */}
                            <div className="mt-8 rounded-2xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                <div className="flex items-start gap-3">

                                    <ShieldCheck
                                        size={20}
                                        className="shrink-0 text-[#0B1F3B]"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-[#0B1F3B]">
                                            Protected access
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Your selected role must match
                                            the role assigned to your account.
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Navigation buttons */}
                            <div className="mt-7 flex flex-col gap-3 border-t border-[#E8E1D8] pt-6 sm:flex-row sm:items-center sm:justify-between">

                                {/* Back to Home */}
                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-5 py-3 text-sm font-semibold text-[#0B1F3B] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:bg-white hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#C5AD8D]/20"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B1F3B] text-white transition-colors duration-300 group-hover:bg-[#8B7355]">
                                        <ArrowLeft size={15} />
                                    </span>

                                    Back to Home
                                </button>

                                {/* Create Account */}
                                <button
                                    type="button"
                                    onClick={() => navigate("/register")}
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#102B50] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#0B1F3B]/20"
                                >
                                    Create an Account

                                    <ArrowRight
                                        size={16}
                                        className="transition-transform duration-300 group-hover:translate-x-1"
                                    />
                                </button>

                            </div>

                            {/* Footer */}
                            <div className="mt-7 text-center">
                                <p className="text-xs text-slate-400">
                                    Woldia University Internship Management System
                                </p>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;