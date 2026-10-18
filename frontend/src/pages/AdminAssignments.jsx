import { useCallback, useEffect, useState } from "react";
import {
    UserCheck,
    Users,
    Briefcase,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    GraduationCap,
    CalendarDays,
    Sparkles,
    Building2,
    BookOpen
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_URL = "https://woldia-internship-system.onrender.com/api";

function AdminAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [internships, setInternships] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    const [studentId, setStudentId] = useState("");
    const [internshipId, setInternshipId] = useState("");
    const [supervisorId, setSupervisorId] = useState("");

    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("token");

    const requestHeaders = {
        Authorization: `Bearer ${token}`
    };

    const fetchAssignments = useCallback(async () => {
        const response = await fetch(
            `${API_URL}/admin/assignments`,
            {
                headers: requestHeaders
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to retrieve assignments."
            );
        }

        setAssignments(data.assignments || []);
    }, [token]);

    const fetchAssignmentOptions = useCallback(async () => {
        const response = await fetch(
            `${API_URL}/admin/assignment-options`,
            {
                headers: requestHeaders
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load assignment options."
            );
        }

        setStudents(data.students || []);
        setInternships(data.internships || []);
        setSupervisors(data.supervisors || []);
    }, [token]);

    const loadPageData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            await Promise.all([
                fetchAssignments(),
                fetchAssignmentOptions()
            ]);
        } catch (err) {
            setError(err.message || "Unable to load the assignment page.");
        } finally {
            setLoading(false);
        }
    }, [fetchAssignments, fetchAssignmentOptions]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    const handleAssign = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!studentId || !internshipId || !supervisorId) {
            setError(
                "Please select a student, internship, and supervisor."
            );
            return;
        }

        try {
            setAssigning(true);

            const response = await fetch(
                `${API_URL}/admin/assignments`,
                {
                    method: "POST",
                    headers: {
                        ...requestHeaders,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        student_id: Number(studentId),
                        internship_id: Number(internshipId),
                        supervisor_id: Number(supervisorId)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to assign the supervisor."
                );
            }

            setSuccess(
                data.message || "Supervisor assigned successfully."
            );

            setStudentId("");
            setInternshipId("");
            setSupervisorId("");

            await loadPageData();
        } catch (err) {
            setError(
                err.message || "An unexpected error occurred."
            );
        } finally {
            setAssigning(false);
        }
    };

    const selectedStudent = students.find(
        (student) => String(student.id) === studentId
    );

    const selectedInternship = internships.find(
        (internship) => String(internship.id) === internshipId
    );

    const selectedSupervisor = supervisors.find(
        (supervisor) => String(supervisor.id) === supervisorId
    );

    const fieldClass =
        "w-full rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#8B7355] focus:bg-white focus:ring-2 focus:ring-[#C5AD8D]/30 disabled:cursor-not-allowed disabled:opacity-60";

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* HERO */}
                <section className="relative overflow-hidden rounded-[2rem] bg-[#0B1F3B] p-8 text-white shadow-xl md:p-10">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B7355]/20 blur-3xl" />

                    <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#C5AD8D]/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B7355]">
                                    <UserCheck size={22} />
                                </div>

                                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C5AD8D]">
                                    Admin Management
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                Supervisor Assignments
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                                Connect students with university supervisors
                                after their internship applications have
                                been accepted.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadPageData}
                            disabled={loading || assigning}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {/* SUCCESS MESSAGE */}
                {success && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
                    >
                        <CheckCircle2
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <p className="font-semibold">
                                Assignment successful
                            </p>

                            <p className="mt-1 text-sm">{success}</p>
                        </div>
                    </div>
                )}

                {/* ERROR MESSAGE */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                    >
                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <p className="font-semibold">
                                Something needs attention
                            </p>

                            <p className="mt-1 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* ASSIGNMENT FORM */}
                <section className="rounded-[1.5rem] border border-[#D8D0C7] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-7 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                            <UserCheck size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-[#0B1F3B]">
                                Assign a Supervisor
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Select people and internships by name.
                                Database IDs are handled automatically.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-40 items-center justify-center gap-3 text-slate-500">
                            <RefreshCw
                                size={20}
                                className="animate-spin text-[#8B7355]"
                            />
                            Loading students, internships, and supervisors...
                        </div>
                    ) : (
                        <form
                            onSubmit={handleAssign}
                            className="grid gap-6 md:grid-cols-2"
                        >
                            {/* STUDENT */}
                            <div>
                                <label
                                    htmlFor="student"
                                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                                >
                                    <GraduationCap
                                        size={17}
                                        className="text-[#8B7355]"
                                    />
                                    Select Student
                                </label>

                                <select
                                    id="student"
                                    value={studentId}
                                    onChange={(event) =>
                                        setStudentId(event.target.value)
                                    }
                                    className={fieldClass}
                                    required
                                    disabled={students.length === 0}
                                >
                                    <option value="">
                                        Choose a student
                                    </option>

                                    {students.map((student) => (
                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >
                                            {student.full_name} —{" "}
                                            {student.student_id}
                                        </option>
                                    ))}
                                </select>

                                {selectedStudent && (
                                    <div className="mt-3 rounded-xl bg-[#F5F2ED] p-3 text-sm">
                                        <p className="font-semibold text-[#0B1F3B]">
                                            {selectedStudent.full_name}
                                        </p>

                                        <p className="mt-1 text-slate-600">
                                            University ID:{" "}
                                            {selectedStudent.student_id}
                                        </p>

                                        <p className="text-slate-600">
                                            Department:{" "}
                                            {selectedStudent.department}
                                        </p>

                                        <p className="text-slate-600">
                                            Year:{" "}
                                            {selectedStudent.year_level}
                                        </p>
                                    </div>
                                )}

                                {students.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        No student profiles are available.
                                    </p>
                                )}
                            </div>

                            {/* INTERNSHIP */}
                            <div>
                                <label
                                    htmlFor="internship"
                                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                                >
                                    <Briefcase
                                        size={17}
                                        className="text-[#8B7355]"
                                    />
                                    Select Internship
                                </label>

                                <select
                                    id="internship"
                                    value={internshipId}
                                    onChange={(event) =>
                                        setInternshipId(event.target.value)
                                    }
                                    className={fieldClass}
                                    required
                                    disabled={internships.length === 0}
                                >
                                    <option value="">
                                        Choose an internship
                                    </option>

                                    {internships.map((internship) => (
                                        <option
                                            key={internship.id}
                                            value={internship.id}
                                        >
                                            {internship.title} —{" "}
                                            {internship.company_name}
                                        </option>
                                    ))}
                                </select>

                                {selectedInternship && (
                                    <div className="mt-3 rounded-xl bg-[#F5F2ED] p-3 text-sm">
                                        <p className="font-semibold text-[#0B1F3B]">
                                            {selectedInternship.title}
                                        </p>

                                        <p className="mt-1 flex items-center gap-2 text-slate-600">
                                            <Building2 size={15} />
                                            {selectedInternship.company_name}
                                        </p>

                                        <p className="mt-1 text-slate-600">
                                            Status:{" "}
                                            {selectedInternship.status}
                                        </p>

                                        <p className="text-slate-600">
                                            Approval:{" "}
                                            {selectedInternship.approval_status}
                                        </p>
                                    </div>
                                )}

                                {internships.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        No approved, open internships are
                                        available.
                                    </p>
                                )}
                            </div>

                            {/* SUPERVISOR */}
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="supervisor"
                                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                                >
                                    <UserCheck
                                        size={17}
                                        className="text-[#8B7355]"
                                    />
                                    Select Supervisor
                                </label>

                                <select
                                    id="supervisor"
                                    value={supervisorId}
                                    onChange={(event) =>
                                        setSupervisorId(event.target.value)
                                    }
                                    className={fieldClass}
                                    required
                                    disabled={supervisors.length === 0}
                                >
                                    <option value="">
                                        Choose a supervisor
                                    </option>

                                    {supervisors.map((supervisor) => (
                                        <option
                                            key={supervisor.id}
                                            value={supervisor.id}
                                        >
                                            {supervisor.full_name} —{" "}
                                            {supervisor.department}
                                        </option>
                                    ))}
                                </select>

                                {selectedSupervisor && (
                                    <div className="mt-3 rounded-xl bg-[#F5F2ED] p-3 text-sm">
                                        <p className="font-semibold text-[#0B1F3B]">
                                            {selectedSupervisor.full_name}
                                        </p>

                                        <p className="mt-1 text-slate-600">
                                            Department:{" "}
                                            {selectedSupervisor.department}
                                        </p>
                                    </div>
                                )}

                                {supervisors.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        No supervisor profiles are available.
                                    </p>
                                )}
                            </div>

                            {/* SUBMIT */}
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={
                                        assigning ||
                                        loading ||
                                        !students.length ||
                                        !internships.length ||
                                        !supervisors.length
                                    }
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#132d52] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                                >
                                    {assigning ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={17} />
                                            Assign Supervisor
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* ASSIGNMENT RULES */}
                <section className="rounded-[1.5rem] border border-[#D8D0C7] bg-[#F5F2ED] p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B]">
                            <ShieldCheck
                                size={21}
                                className="text-[#C5AD8D]"
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#0B1F3B]">
                                Assignment rules
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Only approved internships can receive
                                assignments. The student must have an
                                accepted application, and the same student
                                cannot receive a second assignment for the
                                same internship. The backend checks these
                                requirements before saving an assignment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CURRENT ASSIGNMENTS */}
                <section className="rounded-[1.5rem] border border-[#D8D0C7] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[#0B1F3B]">
                                Current Assignments
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Review assigned students and their
                                university supervisors.
                            </p>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F5F2ED] px-4 py-2 text-sm font-semibold text-[#8B7355]">
                            <Users size={16} />
                            {assignments.length}{" "}
                            {assignments.length === 1
                                ? "Assignment"
                                : "Assignments"}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-40 items-center justify-center gap-3 text-slate-500">
                            <RefreshCw
                                size={20}
                                className="animate-spin text-[#8B7355]"
                            />
                            Loading assignments...
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#D8D0C7] bg-[#F8F7F4] p-10 text-center">
                            <UserCheck
                                size={36}
                                className="mx-auto text-[#C5AD8D]"
                            />

                            <h3 className="mt-3 font-semibold text-[#0B1F3B]">
                                No supervisor assignments yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Create an assignment using the form above.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {assignments.map((assignment) => (
                                <article
                                    key={assignment.id}
                                    className="rounded-2xl border border-[#D8D0C7] bg-[#F8F7F4] p-5 transition hover:bg-white hover:shadow-md"
                                >
                                    <div className="grid gap-5 lg:grid-cols-3">
                                        {/* STUDENT */}
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3B] text-[#C5AD8D]">
                                                <GraduationCap size={20} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Student
                                                </p>

                                                <p className="mt-1 font-semibold text-[#0B1F3B]">
                                                    {assignment.student_name}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    University ID:{" "}
                                                    {assignment.university_student_id}
                                                </p>
                                            </div>
                                        </div>

                                        {/* INTERNSHIP */}
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B7355] text-white">
                                                <Briefcase size={20} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Internship
                                                </p>

                                                <p className="mt-1 font-semibold text-[#0B1F3B]">
                                                    {assignment.internship_title}
                                                </p>
                                            </div>
                                        </div>

                                        {/* SUPERVISOR */}
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                <UserCheck size={20} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Supervisor
                                                </p>

                                                <p className="mt-1 font-semibold text-[#0B1F3B]">
                                                    {assignment.supervisor_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#D8D0C7] pt-4 text-xs text-slate-500">
                                        <CalendarDays
                                            size={15}
                                            className="text-[#8B7355]"
                                        />

                                        Assigned on{" "}
                                        {assignment.assigned_at
                                            ? new Date(
                                                  assignment.assigned_at
                                              ).toLocaleString()
                                            : "Unknown date"}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-2 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    <Sparkles
                        size={13}
                        className="text-[#8B7355]"
                    />

                    Woldia University Internship System

                    <Sparkles
                        size={13}
                        className="text-[#8B7355]"
                    />
                </div>
            </div>
        </AppLayout>
    );
}

export default AdminAssignments;