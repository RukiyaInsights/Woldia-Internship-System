import { useState } from "react";
import {
    BriefcaseBusiness,
    FileText,
    ClipboardList,
    Users,
    MapPin,
    CalendarDays,
    Send,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

// Get today's date in local YYYY-MM-DD format.
// This avoids timezone problems caused by toISOString().
const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Add a specified number of calendar days to a YYYY-MM-DD date.
const addDays = (dateString, numberOfDays) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    date.setUTCDate(date.getUTCDate() + numberOfDays);

    const resultYear = date.getUTCFullYear();
    const resultMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
    const resultDay = String(date.getUTCDate()).padStart(2, "0");

    return `${resultYear}-${resultMonth}-${resultDay}`;
};

function CreateInternship() {
    const [creationDate] = useState(getToday());

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        requirements: "",
        positions: "1",
        location: "",
        application_deadline: "",
        start_date: "",
        end_date: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Earliest application deadline: 14 days after creation.
    const minimumDeadline = addDays(creationDate, 14);

    // Start date must be at least one day after the deadline.
    const minimumStartDate = formData.application_deadline
        ? addDays(formData.application_deadline, 1)
        : addDays(minimumDeadline, 1);

    // End date must be at least one day after the start date.
    const minimumEndDate = formData.start_date
        ? addDays(formData.start_date, 1)
        : minimumStartDate;

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previousData) => {
            const updatedData = {
                ...previousData,
                [name]: value
            };

            // If the deadline changes, clear dates that are no longer valid.
            if (name === "application_deadline") {
                if (
                    updatedData.start_date &&
                    updatedData.start_date <= value
                ) {
                    updatedData.start_date = "";
                    updatedData.end_date = "";
                } else if (
                    updatedData.start_date &&
                    updatedData.end_date &&
                    updatedData.end_date <= updatedData.start_date
                ) {
                    updatedData.end_date = "";
                }
            }

            // If the start date changes, clear an invalid end date.
            if (name === "start_date") {
                if (
                    updatedData.end_date &&
                    updatedData.end_date <= value
                ) {
                    updatedData.end_date = "";
                }
            }

            return updatedData;
        });

        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        // Validate positions.
        const positions = Number(formData.positions);

        if (
            !Number.isInteger(positions) ||
            positions < 1
        ) {
            setError("Number of positions must be a whole number greater than 0.");
            return;
        }

        // Validate required dates.
        if (!formData.application_deadline) {
            setError("Please select an application deadline.");
            return;
        }

        if (!formData.start_date) {
            setError("Please select an internship start date.");
            return;
        }

        if (!formData.end_date) {
            setError("Please select an internship end date.");
            return;
        }

        // Ensure the application deadline is at least 14 days after creation.
        if (formData.application_deadline < minimumDeadline) {
            setError(
                `The application deadline must be at least 14 days after creation. Select ${minimumDeadline} or a later date.`
            );
            return;
        }

        // The internship must start after applications close.
        if (formData.start_date <= formData.application_deadline) {
            setError(
                "The internship start date must be after the application deadline."
            );
            return;
        }

        // The internship must end after it starts.
        if (formData.end_date <= formData.start_date) {
            setError(
                "The internship end date must be after the start date."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/internships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        ...formData,
                        positions,
                        created_date: creationDate
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Unable to create internship."
                );
                return;
            }

            setMessage(
                data.message ||
                "Internship created successfully and is waiting for university approval."
            );

            // Reset all form fields after successful submission.
            setFormData({
                title: "",
                description: "",
                requirements: "",
                positions: "1",
                location: "",
                application_deadline: "",
                start_date: "",
                end_date: ""
            });

        } catch (error) {
            console.error("Create internship error:", error);

            setError(
                "Unable to connect to the server. Please check that the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0B1F3B] p-8 md:p-10 text-white shadow-xl">
                    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#8B7355]/20" />
                    <div className="absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-[#C5AD8D]/10" />
                    <div className="absolute -left-16 bottom-[-70px] h-40 w-40 rounded-full border border-[#C5AD8D]/10" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#C5AD8D] mb-5">
                            <Sparkles size={18} />
                            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                                Company Portal
                            </span>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex h-14 w-14 shrink-0 rounded-2xl bg-[#8B7355]/20 border border-[#C5AD8D]/20 items-center justify-center text-[#C5AD8D]">
                                <BriefcaseBusiness size={28} />
                            </div>

                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                    Create Internship
                                </h1>

                                <p className="mt-3 max-w-2xl text-slate-300 text-sm md:text-base leading-7">
                                    Create an internship opportunity for Woldia
                                    University students. Your internship will be
                                    submitted for university approval before it
                                    becomes available to students.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Form */}
                <section className="bg-white border border-[#D8D0C7] rounded-[2rem] shadow-sm overflow-hidden">

                    <div className="border-b border-[#D8D0C7] px-6 md:px-8 py-6 bg-[#F8F7F4]">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#0B1F3B] text-white flex items-center justify-center">
                                <BriefcaseBusiness size={19} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-[#0B1F3B]">
                                    Internship Information
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Provide clear information so students can
                                    understand the opportunity.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="p-6 md:p-8 space-y-7"
                    >

                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <BriefcaseBusiness size={17} className="text-[#8B7355]" />
                                Internship Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Software Development Intern"
                                maxLength={150}
                                required
                                className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <FileText size={17} className="text-[#8B7355]" />
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the internship, responsibilities, and what the student will work on..."
                                rows="6"
                                required
                                className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition resize-y focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                            />
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <ClipboardList size={17} className="text-[#8B7355]" />
                                Requirements
                            </label>

                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                placeholder="e.g. HTML, CSS, JavaScript, React, communication skills..."
                                rows="5"
                                className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition resize-y focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                            />

                            <p className="text-xs text-slate-400 mt-2">
                                List the technical skills, knowledge, or other
                                qualifications students should have.
                            </p>
                        </div>

                        {/* Positions + Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Users size={17} className="text-[#8B7355]" />
                                    Number of Positions
                                </label>

                                <input
                                    type="number"
                                    name="positions"
                                    value={formData.positions}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    required
                                    className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                />

                                <p className="text-xs text-slate-400 mt-2">
                                    Maximum number of students you can accept.
                                </p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <MapPin size={17} className="text-[#8B7355]" />
                                    Location
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Addis Ababa, Ethiopia"
                                    maxLength={150}
                                    className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                />
                            </div>

                        </div>

                        {/* Application Deadline */}
                        <div className="rounded-2xl border border-[#D8D0C7] bg-[#F8F7F4] p-5 md:p-6">

                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0B1F3B] mb-2">
                                <CalendarDays size={18} className="text-[#8B7355]" />
                                Application Deadline
                            </label>

                            <p className="text-sm text-slate-500 mb-4">
                                Students must have sufficient time to apply.
                                The deadline must be at least 14 days after
                                the internship is created.
                            </p>

                            <input
                                type="date"
                                name="application_deadline"
                                value={formData.application_deadline}
                                min={minimumDeadline}
                                onChange={handleChange}
                                required
                                className="w-full md:max-w-md border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                            />

                            <p className="mt-3 text-xs text-slate-500">
                                Earliest permitted deadline: {minimumDeadline}
                            </p>

                        </div>

                        {/* Internship Period */}
                        <div>

                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <CalendarDays size={17} className="text-[#8B7355]" />
                                Internship Period
                            </label>

                            <p className="text-sm text-slate-500 mb-4">
                                The internship must start after applications
                                close and end after it starts.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        min={minimumStartDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        {formData.application_deadline
                                            ? `Choose ${minimumStartDate} or later.`
                                            : "Select the application deadline first."}
                                    </p>
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">
                                        End Date
                                    </label>

                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        min={minimumEndDate}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.start_date}
                                        className="w-full border border-[#D8D0C7] rounded-xl px-4 py-3 text-slate-900 outline-none transition focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        {formData.start_date
                                            ? `Choose ${minimumEndDate} or later.`
                                            : "Select the internship start date first."}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Messages */}
                        {message && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

                                <div>
                                    <p className="font-semibold">
                                        Internship submitted
                                    </p>

                                    <p className="text-sm mt-1">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                                <AlertCircle size={20} className="mt-0.5 shrink-0" />

                                <div>
                                    <p className="font-semibold">
                                        Unable to create internship
                                    </p>

                                    <p className="text-sm mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-2">

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto md:min-w-56 inline-flex items-center justify-center gap-2 bg-[#0B1F3B] hover:bg-[#142D50] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold px-7 py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Create Internship
                                    </>
                                )}
                            </button>

                        </div>

                    </form>
                </section>

                {/* Approval Notice */}
                <section className="flex items-start gap-4 bg-[#F8F7F4] border border-[#D8D0C7] rounded-2xl p-5">

                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0B1F3B] text-[#C5AD8D] flex items-center justify-center">
                        <ClipboardList size={20} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-[#0B1F3B]">
                            University approval
                        </h3>

                        <p className="text-sm text-slate-600 mt-1 leading-6">
                            New internship opportunities are reviewed by the
                            university before students can see and apply for them.
                        </p>
                    </div>

                </section>

                {/* Footer Accent */}
                <div className="flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    <Sparkles size={14} className="text-[#8B7355]" />

                    <span>Woldia University Internship System</span>

                    <Sparkles size={14} className="text-[#8B7355]" />
                </div>

            </div>
        </AppLayout>
    );
}

export default CreateInternship;