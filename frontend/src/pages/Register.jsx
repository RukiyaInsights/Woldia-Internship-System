import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    UserPlus,
    AlertCircle,
    Briefcase,
    ShieldCheck,
    GraduationCap,
    Building2,
    ArrowRight,
    ArrowLeft,
    Home,
} from "lucide-react";

import woldiaLogo from "../assets/woldia-university-logo.png";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "student",
    });

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setError("");
    };

    const handleRoleChange = (role) => {
        setFormData((previousData) => ({
            ...previousData,
            role,
        }));

        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const fullName = formData.full_name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const selectedRole = formData.role;

        if (!fullName || !email || !password) {
            setError("Please complete all required fields.");
            return;
        }

        if (!["student", "company"].includes(selectedRole)) {
            setError("Please select Student or Company.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        email,
                        password,
                        role: selectedRole,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed.");
                return;
            }

            if (!data.user || !data.user.role) {
                setError(
                    "Registration response is incomplete. Please sign in with your new account."
                );
                return;
            }

            const actualRole = String(data.user.role).toLowerCase();

            const dashboardRoutes = {
                student: "/student/profile",
                company: "/company",
            };

            const dashboardRoute = dashboardRoutes[actualRole];

            if (!dashboardRoute) {
                setError(
                    "This account role cannot register through public registration."
                );
                return;
            }

            if (actualRole !== selectedRole) {
                console.error("Registration role mismatch:", {
                    selectedRole,
                    actualRole,
                });

                setError(
                    "The server returned a different account role than the one selected. Please contact the system administrator."
                );
                return;
            }

            if (!data.token) {
                setError(
                    "Your account was created, but automatic login is unavailable. Please sign in."
                );

                navigate("/login", { replace: true });
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("role", actualRole);

            localStorage.setItem(
                "userName",
                data.user.full_name || fullName
            );

            navigate(dashboardRoute, { replace: true });
        } catch (requestError) {
            console.error("Registration error:", requestError);

            setError(
                "Unable to connect to the server. Make sure the backend is running on port 5000."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F2ED]">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

                <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#D8D0C7] bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">

                    {/* Left information panel */}
                    <div className="relative hidden overflow-hidden bg-[#0B1F3B] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">

                        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#1E3A6F] opacity-40 blur-3xl" />

                        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#8B7355] opacity-25 blur-3xl" />

                        <div className="relative z-10 flex items-center gap-4">

                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl">
                                <img
                                    src={woldiaLogo}
                                    alt="Woldia University"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.18em]">
                                    Woldia University
                                </p>

                                <p className="mt-1 text-xs text-[#AEBAC8]">
                                    Internship Supervising System
                                </p>
                            </div>

                        </div>

                        <div className="relative z-10 my-12">

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-[#D5DEE8]">
                                <ShieldCheck className="h-4 w-4 text-[#C5AD8D]" />
                                Secure Registration
                            </div>

                            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
                                Start your
                                <span className="block text-[#C5AD8D]">
                                    internship journey.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-md text-sm leading-7 text-[#B9C5D2]">
                                Create your account and become part of the
                                Woldia University internship ecosystem.
                            </p>

                            <div className="mt-8 space-y-3">

                                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1E3A6F]">
                                        <GraduationCap className="h-5 w-5 text-white" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Students
                                        </p>

                                        <p className="mt-1 text-xs text-[#9EABB9]">
                                            Discover and apply for internship opportunities.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B7355]">
                                        <Building2 className="h-5 w-5 text-white" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Companies
                                        </p>

                                        <p className="mt-1 text-xs text-[#9EABB9]">
                                            Create opportunities and connect with students.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="relative z-10 border-t border-white/10 pt-5">
                            <p className="text-xs font-medium text-[#AEBAC8]">
                                Woldia University
                            </p>

                            <p className="mt-1 text-xs text-[#758394]">
                                Connecting students, organizations, and supervisors.
                            </p>
                        </div>

                    </div>

                    {/* Registration form */}
                    <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">

                        <div className="w-full max-w-md">

                            {/* Mobile branding */}
                            <div className="mb-8 text-center lg:hidden">

                                <Link
                                    to="/"
                                    className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#D8D0C7] bg-white p-1.5 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <img
                                        src={woldiaLogo}
                                        alt="Woldia University"
                                        className="h-full w-full object-contain"
                                    />
                                </Link>

                                <h1 className="mt-4 text-xl font-bold text-[#0B1F3B]">
                                    Woldia University
                                </h1>

                                <p className="mt-1 text-sm text-[#75808C]">
                                    Internship Supervising System
                                </p>

                            </div>

                            {/* Page heading */}
                            <div className="mb-8">

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#0B1F3B]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0B1F3B]">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Create Account
                                </div>

                                <h2 className="text-3xl font-bold tracking-tight text-[#0B1F3B]">
                                    Join the platform
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-[#687482]">
                                    Create your account to begin using the
                                    Woldia University internship system.
                                </p>

                            </div>

                            {/* Registration fields */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >

                                {/* Full name */}
                                <div>
                                    <label
                                        htmlFor="full_name"
                                        className="mb-2 block text-sm font-semibold text-[#27364A]"
                                    >
                                        Full Name
                                    </label>

                                    <div className="relative">

                                        <User className="absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#8A95A2]" />

                                        <input
                                            id="full_name"
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                            required
                                            disabled={loading}
                                            className="w-full rounded-xl border border-[#D8DDE2] bg-[#F8F9FA] py-3.5 pl-11 pr-4 text-sm text-[#17283F] outline-none transition placeholder:text-[#9AA4AE] focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10 disabled:opacity-60"
                                        />

                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-[#27364A]"
                                    >
                                        Email Address
                                    </label>

                                    <div className="relative">

                                        <Mail className="absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#8A95A2]" />

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email address"
                                            autoComplete="email"
                                            required
                                            disabled={loading}
                                            className="w-full rounded-xl border border-[#D8DDE2] bg-[#F8F9FA] py-3.5 pl-11 pr-4 text-sm text-[#17283F] outline-none transition placeholder:text-[#9AA4AE] focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10 disabled:opacity-60"
                                        />

                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold text-[#27364A]"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">

                                        <Lock className="absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-[#8A95A2]" />

                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
                                            required
                                            disabled={loading}
                                            className="w-full rounded-xl border border-[#D8DDE2] bg-[#F8F9FA] py-3.5 pl-11 pr-12 text-sm text-[#17283F] outline-none transition placeholder:text-[#9AA4AE] focus:border-[#8B7355] focus:bg-white focus:ring-4 focus:ring-[#8B7355]/10 disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A95A2] transition hover:bg-[#0B1F3B]/5 hover:text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#C5AD8D]"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-[18px] w-[18px]" />
                                            ) : (
                                                <Eye className="h-[18px] w-[18px]" />
                                            )}
                                        </button>

                                    </div>
                                </div>

                                {/* Account type */}
                                <fieldset>
                                    <legend className="mb-2 block text-sm font-semibold text-[#27364A]">
                                        Account Type
                                    </legend>

                                    <div className="grid grid-cols-2 gap-3">

                                        {/* Student option */}
                                        <button
                                            type="button"
                                            onClick={() => handleRoleChange("student")}
                                            aria-pressed={formData.role === "student"}
                                            disabled={loading}
                                            className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                formData.role === "student"
                                                    ? "border-[#0B1F3B] bg-[#0B1F3B] text-white shadow-lg"
                                                    : "border-[#D8DDE2] bg-[#F8F9FA] text-[#27364A] hover:border-[#8B7355]/50"
                                            }`}
                                        >
                                            <GraduationCap
                                                className={`h-5 w-5 ${
                                                    formData.role === "student"
                                                        ? "text-[#D8C5A8]"
                                                        : "text-[#8B7355]"
                                                }`}
                                            />

                                            <p className="mt-2 text-sm font-bold">
                                                Student
                                            </p>

                                            <p
                                                className={`mt-1 text-xs ${
                                                    formData.role === "student"
                                                        ? "text-[#B9C5D2]"
                                                        : "text-[#7A8490]"
                                                }`}
                                            >
                                                Find internships
                                            </p>
                                        </button>

                                        {/* Company option */}
                                        <button
                                            type="button"
                                            onClick={() => handleRoleChange("company")}
                                            aria-pressed={formData.role === "company"}
                                            disabled={loading}
                                            className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                formData.role === "company"
                                                    ? "border-[#8B7355] bg-[#8B7355] text-white shadow-lg"
                                                    : "border-[#D8DDE2] bg-[#F8F9FA] text-[#27364A] hover:border-[#8B7355]/50"
                                            }`}
                                        >
                                            <Briefcase
                                                className={`h-5 w-5 ${
                                                    formData.role === "company"
                                                        ? "text-white"
                                                        : "text-[#8B7355]"
                                                }`}
                                            />

                                            <p className="mt-2 text-sm font-bold">
                                                Company
                                            </p>

                                            <p
                                                className={`mt-1 text-xs ${
                                                    formData.role === "company"
                                                        ? "text-white/75"
                                                        : "text-[#7A8490]"
                                                }`}
                                            >
                                                Post opportunities
                                            </p>
                                        </button>

                                    </div>
                                </fieldset>

                                {/* Registration information */}
                                <div className="flex items-start gap-3 rounded-xl border border-[#D9D1C7] bg-[#F8F5F0] p-3.5">

                                    <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#8B7355]" />

                                    <p className="text-xs leading-5 text-[#665D53]">
                                        Public registration is available for students
                                        and authorized companies. Supervisor and
                                        administrator accounts are managed by the university.
                                    </p>

                                </div>

                                {/* Error message */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
                                    >
                                        <AlertCircle className="mt-0.5 h-[19px] w-[19px] shrink-0" />

                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Create account button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#132E52] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#C5AD8D]/30 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-[18px] w-[18px]" />

                                            Create Account

                                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>

                            </form>

                            {/* Bottom navigation */}
                            <div className="mt-8 border-t border-[#E7E3DE] pt-6">

                                <p className="text-center text-sm text-[#6D7783]">
                                    Already have an account?{" "}

                                    <Link
                                        to="/login"
                                        className="font-bold text-[#0B1F3B] transition hover:text-[#8B7355]"
                                    >
                                        Sign in
                                    </Link>
                                </p>

                                {/* Return to Home button — Home icon preserved */}
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/")}
                                        className="group flex w-full items-center justify-center gap-3 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-5 py-3.5 text-sm font-semibold text-[#0B1F3B] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:bg-white hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#C5AD8D]/20"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1F3B] text-white transition-colors duration-300 group-hover:bg-[#8B7355]">
                                            <Home className="h-[17px] w-[17px]" />
                                        </span>

                                        <span>Return to Home</span>

                                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                                    </button>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="mt-7 text-center">
                                <p className="text-xs text-[#8A95A2]">
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

export default Register;