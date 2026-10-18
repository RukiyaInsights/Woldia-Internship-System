import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    MapPin,
    CalendarDays,
    FileText,
    CheckCircle2,
    XCircle,
    Clock3,
    AlertCircle,
    ShieldCheck,
    RefreshCw,
    Users,
    Sparkles,
    X,
    ShieldAlert
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function PendingInternships() {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const [processingId, setProcessingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Controls the custom approval confirmation dialog.
    const [approvalTarget, setApprovalTarget] = useState(null);

    const token = localStorage.getItem("token");

    // Load pending internships.
    const fetchPendingInternships = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                "http://localhost:5000/api/admin/internships/pending",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load pending internships."
                );
            }

            setInternships(data.internships || []);
        } catch (error) {
            console.error(
                "Error loading pending internships:",
                error
            );

            setError(
                error.message ||
                "Unable to load pending internships."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingInternships();
        // Initial load when the authentication token changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Open the custom confirmation dialog.
    const openApprovalConfirmation = (internship) => {
        setError("");
        setSuccessMessage("");
        setApprovalTarget(internship);
    };

    // Approve only after the administrator confirms in the custom dialog.
    const handleApprove = async () => {
        if (!approvalTarget) {
            return;
        }

        const internshipId = approvalTarget.id;

        try {
            setProcessingId(internshipId);
            setError("");
            setSuccessMessage("");

            const response = await fetch(
                `http://localhost:5000/api/admin/internships/${internshipId}/approve`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to approve internship."
                );
            }

            // Close the dialog after successful approval.
            setApprovalTarget(null);

            // Refresh the list without losing the success message.
            await fetchPendingInternships(true);

            setSuccessMessage(
                data.message ||
                "Internship approved successfully."
            );
        } catch (error) {
            console.error(
                "Error approving internship:",
                error
            );

            setError(
                error.message ||
                "Something went wrong while approving the internship."
            );

            setApprovalTarget(null);
        } finally {
            setProcessingId(null);
        }
    };

    // Reject an internship with a required reason.
    const handleReject = async (internshipId) => {
        if (!rejectReason.trim()) {
            setError(
                "Please provide a reason before rejecting the internship."
            );
            return;
        }

        try {
            setProcessingId(internshipId);
            setError("");
            setSuccessMessage("");

            const response = await fetch(
                `http://localhost:5000/api/admin/internships/${internshipId}/reject`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        reason: rejectReason.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to reject internship."
                );
            }

            setRejectingId(null);
            setRejectReason("");

            // Refresh first, then show the success message.
            await fetchPendingInternships(true);

            setSuccessMessage(
                data.message ||
                "Internship rejected successfully."
            );
        } catch (error) {
            console.error(
                "Error rejecting internship:",
                error
            );

            setError(
                error.message ||
                "Something went wrong while rejecting the internship."
            );
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-8">

                {/* Hero */}
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0B1F3B] p-8 text-white shadow-xl md:p-10">

                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B7355]/20 blur-3xl" />

                    <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#C5AD8D]/10 blur-3xl" />

                    <div className="absolute right-20 top-12 h-24 w-24 rounded-full border border-[#C5AD8D]/20" />

                    <div className="relative z-10">

                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#C5AD8D] transition hover:text-white"
                        >
                            <ArrowLeft size={17} />
                            Back to Admin Dashboard
                        </Link>

                        <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                            <div className="flex items-center gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#8B7355] shadow-lg shadow-black/20">
                                    <BriefcaseBusiness size={28} />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C5AD8D]">
                                        Administration
                                    </p>

                                    <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                                        Pending Internships
                                    </h1>
                                </div>

                            </div>

                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                                <Clock3
                                    size={16}
                                    className="text-[#C5AD8D]"
                                />
                                Awaiting Review
                            </div>

                        </div>

                        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                            Review internship opportunities submitted by
                            companies and decide whether they should become
                            available to students.
                        </p>

                    </div>
                </section>

                {/* Summary */}
                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    <div className="rounded-2xl border border-[#D8D0C7] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Pending Reviews
                                </p>

                                <p className="mt-1 text-3xl font-bold text-[#0B1F3B]">
                                    {loading ? "..." : internships.length}
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                                <Clock3
                                    size={24}
                                    className="text-amber-600"
                                />
                            </div>

                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            Internship submissions waiting for approval
                        </p>

                    </div>

                    <div className="rounded-2xl border border-[#D8D0C7] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Administrative Review
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#8B7355]">
                                    University approval required
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F2ED]">
                                <ShieldCheck
                                    size={24}
                                    className="text-[#8B7355]"
                                />
                            </div>

                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                            Approved opportunities can proceed through the
                            internship lifecycle.
                        </p>

                    </div>

                </section>

                {/* Error Message */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                    >

                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Action could not be completed
                            </p>

                            <p className="mt-1 text-sm">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchPendingInternships(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold transition hover:bg-red-200 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing ? "animate-spin" : ""}
                            />
                            Retry
                        </button>

                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
                    >

                        <CheckCircle2
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Success
                            </p>

                            <p className="mt-1 text-sm">
                                {successMessage}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSuccessMessage("")}
                            aria-label="Dismiss success message"
                            className="rounded-lg p-1 transition hover:bg-emerald-100"
                        >
                            <X size={17} />
                        </button>

                    </div>
                )}

                {/* Controls */}
                {!loading && internships.length > 0 && (
                    <div className="flex justify-end">

                        <button
                            type="button"
                            onClick={() => fetchPendingInternships(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#D8D0C7] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3B] shadow-sm transition hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />

                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-2xl border border-[#D8D0C7] bg-white p-12 text-center shadow-sm">

                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D8D0C7] border-t-[#8B7355]" />

                        <p className="mt-4 font-medium text-[#0B1F3B]">
                            Loading pending internships...
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Please wait while we retrieve the submissions.
                        </p>

                    </div>
                )}

                {/* Empty State */}
                {!loading && internships.length === 0 && (
                    <div className="rounded-2xl border border-[#D8D0C7] bg-white p-12 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                            <CheckCircle2
                                size={32}
                                className="text-emerald-600"
                            />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-[#0B1F3B]">
                            No Pending Internships
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            There are currently no internship opportunities
                            waiting for university approval.
                        </p>

                        <Link
                            to="/admin"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#132d52]"
                        >
                            <ArrowLeft size={17} />
                            Return to Dashboard
                        </Link>

                    </div>
                )}

                {/* Internship Cards */}
                {!loading && internships.length > 0 && (
                    <div className="space-y-6">

                        {internships.map((internship) => (
                            <div
                                key={internship.id}
                                className="overflow-hidden rounded-[1.5rem] border border-[#D8D0C7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >

                                {/* Card Header */}
                                <div className="border-b border-[#D8D0C7] bg-[#F8F7F4] p-6 md:p-7">

                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                                        <div className="flex-1">

                                            <div className="flex flex-wrap items-center gap-3">

                                                <h2 className="text-2xl font-bold text-[#0B1F3B]">
                                                    {internship.title}
                                                </h2>

                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                                    <Clock3 size={13} />
                                                    Pending Approval
                                                </span>

                                            </div>

                                            <div className="mt-3 flex items-center gap-2 font-semibold text-[#8B7355]">
                                                <Building2 size={17} />
                                                {internship.company_name}
                                            </div>

                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <FileText size={16} />
                                            Internship #{internship.id}
                                        </div>

                                    </div>

                                </div>

                                {/* Card Body */}
                                <div className="p-6 md:p-7">

                                    {/* Description */}
                                    <div>

                                        <div className="flex items-center gap-2">
                                            <FileText
                                                size={17}
                                                className="text-[#8B7355]"
                                            />

                                            <h3 className="font-semibold text-[#0B1F3B]">
                                                Description
                                            </h3>
                                        </div>

                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                                            {internship.description ||
                                                "No description provided."}
                                        </p>

                                    </div>

                                    {/* Details */}
                                    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                        <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <MapPin size={16} />
                                                <p className="text-xs font-semibold uppercase tracking-wide">
                                                    Location
                                                </p>
                                            </div>

                                            <p className="mt-2 text-sm font-medium text-slate-700">
                                                {internship.location || "Not specified"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Users size={16} />
                                                <p className="text-xs font-semibold uppercase tracking-wide">
                                                    Positions
                                                </p>
                                            </div>

                                            <p className="mt-2 text-sm font-medium text-slate-700">
                                                {internship.positions || "Not specified"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <CalendarDays size={16} />
                                                <p className="text-xs font-semibold uppercase tracking-wide">
                                                    Start Date
                                                </p>
                                            </div>

                                            <p className="mt-2 text-sm font-medium text-slate-700">
                                                {internship.start_date || "Not specified"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <CalendarDays size={16} />
                                                <p className="text-xs font-semibold uppercase tracking-wide">
                                                    End Date
                                                </p>
                                            </div>

                                            <p className="mt-2 text-sm font-medium text-slate-700">
                                                {internship.end_date || "Not specified"}
                                            </p>
                                        </div>

                                    </div>

                                    {/* Requirements */}
                                    <div className="mt-6 rounded-xl border border-[#D8D0C7] bg-white p-5">

                                        <div className="flex items-center gap-2">
                                            <FileText
                                                size={17}
                                                className="text-[#8B7355]"
                                            />

                                            <h3 className="font-semibold text-[#0B1F3B]">
                                                Requirements
                                            </h3>
                                        </div>

                                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                            {internship.requirements ||
                                                "No requirements specified."}
                                        </p>

                                    </div>

                                    {/* Actions */}
                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openApprovalConfirmation(internship)
                                            }
                                            disabled={processingId !== null}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <CheckCircle2 size={18} />
                                            Approve Internship
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRejectingId(internship.id);
                                                setRejectReason("");
                                                setError("");
                                                setSuccessMessage("");
                                            }}
                                            disabled={processingId !== null}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <XCircle size={18} />
                                            Reject Internship
                                        </button>

                                    </div>

                                    {/* Rejection Form */}
                                    {rejectingId === internship.id && (
                                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

                                            <div className="flex items-start gap-3">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                                                    <XCircle
                                                        size={20}
                                                        className="text-red-600"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-bold text-red-900">
                                                        Reject Internship
                                                    </h3>

                                                    <p className="mt-1 text-sm text-red-700">
                                                        Please provide a clear
                                                        reason for the rejection.
                                                    </p>
                                                </div>

                                            </div>

                                            <textarea
                                                value={rejectReason}
                                                onChange={(event) =>
                                                    setRejectReason(event.target.value)
                                                }
                                                placeholder="Explain why this internship cannot be approved..."
                                                rows={4}
                                                disabled={processingId === internship.id}
                                                className="mt-5 w-full resize-none rounded-xl border border-red-200 bg-white p-4 text-sm text-slate-700 outline-none transition focus:border-[#8B7355] focus:ring-2 focus:ring-[#C5AD8D]/30 disabled:opacity-60"
                                            />

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                                                <button
                                                    type="button"
                                                    onClick={() => handleReject(internship.id)}
                                                    disabled={processingId === internship.id}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <XCircle size={17} />

                                                    {processingId === internship.id
                                                        ? "Rejecting..."
                                                        : "Confirm Rejection"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRejectingId(null);
                                                        setRejectReason("");
                                                        setError("");
                                                    }}
                                                    disabled={processingId === internship.id}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D0C7] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F7F4] disabled:opacity-60"
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                        </div>
                                    )}

                                </div>
                            </div>
                        ))}

                    </div>
                )}

                {/* Security Notice */}
                <div className="rounded-[1.5rem] border border-[#D8D0C7] bg-[#F5F2ED] p-6">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B]">
                            <ShieldCheck
                                size={21}
                                className="text-[#C5AD8D]"
                            />
                        </div>

                        <div>
                            <p className="font-semibold text-[#0B1F3B]">
                                Administrative Review
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Internship approval actions are protected by
                                authentication and administrator role
                                authorization on the backend.
                            </p>
                        </div>

                    </div>

                </div>

                {/* Footer Accent */}
                <div className="flex items-center justify-center gap-2 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    <Sparkles size={13} className="text-[#8B7355]" />
                    Woldia University Internship System
                    <Sparkles size={13} className="text-[#8B7355]" />
                </div>

            </div>

            {/* Custom Approval Confirmation Dialog */}
            {approvalTarget && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#071426]/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            processingId === null
                        ) {
                            setApprovalTarget(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="approval-dialog-title"
                        aria-describedby="approval-dialog-description"
                        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#D8D0C7] bg-white shadow-2xl"
                    >
                        {/* Dialog Header */}
                        <div className="relative overflow-hidden bg-[#0B1F3B] px-6 py-7 text-white">

                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#C5AD8D]/10" />

                            <button
                                type="button"
                                onClick={() => setApprovalTarget(null)}
                                disabled={processingId !== null}
                                aria-label="Close confirmation dialog"
                                className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>

                            <div className="relative z-10 flex items-center gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#C5AD8D] text-[#0B1F3B] shadow-lg">
                                    <ShieldCheck size={29} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5AD8D]">
                                        Administrator Action
                                    </p>

                                    <h2
                                        id="approval-dialog-title"
                                        className="mt-1 text-2xl font-bold"
                                    >
                                        Confirm Approval
                                    </h2>
                                </div>

                            </div>

                        </div>

                        {/* Dialog Body */}
                        <div className="p-6">

                            <p
                                id="approval-dialog-description"
                                className="text-sm leading-7 text-slate-600"
                            >
                                Are you sure you want to approve this internship?
                                Please review the opportunity before continuing.
                            </p>

                            <div className="mt-5 rounded-2xl border border-[#D8D0C7] bg-[#F8F7F4] p-4">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8B7355] shadow-sm">
                                        <BriefcaseBusiness size={20} />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <p className="break-words font-bold text-[#0B1F3B]">
                                            {approvalTarget.title}
                                        </p>

                                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                            <Building2
                                                size={15}
                                                className="shrink-0"
                                            />
                                            <span className="break-words">
                                                {approvalTarget.company_name}
                                            </span>
                                        </p>

                                        <p className="mt-2 text-xs font-medium text-slate-400">
                                            Internship #{approvalTarget.id}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">

                                <ShieldAlert
                                    size={19}
                                    className="mt-0.5 shrink-0 text-amber-700"
                                />

                                <p className="text-xs leading-5 text-amber-800">
                                    Approval will submit this decision to the
                                    system. The opportunity may then become
                                    available to students according to your
                                    system's approval workflow.
                                </p>

                            </div>

                            {/* Dialog Actions */}
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() => setApprovalTarget(null)}
                                    disabled={processingId !== null}
                                    className="inline-flex items-center justify-center rounded-xl border border-[#D8D0C7] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F7F4] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={processingId !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingId === approvalTarget.id ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Yes, Approve Internship
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}

export default PendingInternships;