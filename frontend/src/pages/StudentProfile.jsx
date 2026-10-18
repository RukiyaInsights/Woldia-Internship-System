import { useEffect, useState } from "react";
import {
  User,
  Phone,
  GraduationCap,
  Hash,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  UserRound,
  ShieldCheck,
  RefreshCw,
  Mail,
  BookOpen,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_URL = "http://localhost:5000/api/students/profile";

const departments = [
  "Computer Science",
  "Software Engineering",
  "Architecture",
  "Civil Engineering",
  "Electrical Engineering",
];

const initialFormData = {
  student_id: "",
  department: "",
  year_level: "3",
  phone: "",
};

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 404) {
        setStudent(null);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load your student profile."
        );
      }

      setStudent(data.student);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Fetch the profile when the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    if (
      !formData.student_id.trim() ||
      !formData.department ||
      !formData.year_level
    ) {
      setError(
        "Please complete your student ID, department, and year level."
      );
      return;
    }

    const year = Number(formData.year_level);

    if (!Number.isInteger(year) || year < 1 || year > 6) {
      setError("Year level must be between 1 and 6.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: formData.student_id.trim(),
          department: formData.department,
          year_level: year,
          phone: formData.phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create your profile."
        );
      }

      setSuccess("Your student profile was created successfully.");

      await fetchProfile();
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#D8D0C7] bg-white px-4 py-3 text-sm text-[#0B1F3B] outline-none transition placeholder:text-[#A49A8F] focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-[#26364A]";

  const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="rounded-2xl border border-[#E8E2DA] bg-white p-4 transition hover:border-[#C5AD8D] hover:shadow-sm sm:p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
        <Icon size={21} />
      </div>

      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#82796F]">
        {label}
      </p>

      <p className="break-words text-base font-semibold text-[#0B1F3B]">
        {value || "Not provided"}
      </p>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8F7F4] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Page heading */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4D8C8] bg-[#F5F2ED] px-3 py-1.5 text-xs font-semibold text-[#705A40]">
              <ShieldCheck size={15} />
              Student Account
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3B] sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F756F] sm:text-base">
              Manage and review your student information for the Woldia
              University Internship Management System.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">Something needs your attention</p>
                <p className="mt-1 leading-6">{error}</p>
              </div>

              {!student && !loading && (
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-semibold hover:bg-red-100"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">{success}</p>
                <p className="mt-1">
                  Your information is now available in your student profile.
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="rounded-3xl border border-[#E8E2DA] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F2ED]">
                <RefreshCw
                  size={23}
                  className="animate-spin text-[#8B7355]"
                />
              </div>

              <h2 className="font-semibold text-[#0B1F3B]">
                Loading your profile
              </h2>

              <p className="mt-2 text-sm text-[#82796F]">
                Please wait while we retrieve your information.
              </p>
            </div>
          ) : student ? (
            /* Existing profile */
            <div className="overflow-hidden rounded-3xl border border-[#E8E2DA] bg-white shadow-sm">
              <div className="relative overflow-hidden bg-[#0B1F3B] px-6 py-8 sm:px-8 sm:py-10">
                <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[35px] border-white/5" />

                <div className="absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-[#8B7355]/20 blur-2xl" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg">
                    <UserRound size={38} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-semibold text-green-200">
                        <CheckCircle2
                          size={13}
                          className="mr-1 inline"
                        />
                        Profile Created
                      </span>
                    </div>

                    <h2 className="break-words text-2xl font-bold text-white sm:text-3xl">
                      {student.full_name || "Student"}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 break-all text-sm text-blue-100/80">
                      <Mail size={15} className="shrink-0" />
                      {student.email || "No email available"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-blue-100 sm:self-center">
                    <GraduationCap size={18} />
                    Student
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B1F3B]">
                      Academic Information
                    </h3>

                    <p className="mt-1 text-sm text-[#82796F]">
                      Your registered university details.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 self-start rounded-lg bg-[#F5F2ED] px-3 py-2 text-xs font-medium text-[#705A40]">
                    <ShieldCheck size={15} />
                    Registered Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCard
                    icon={Hash}
                    label="Student ID"
                    value={student.student_id}
                  />

                  <InfoCard
                    icon={Building2}
                    label="Department"
                    value={student.department}
                  />

                  <InfoCard
                    icon={GraduationCap}
                    label="Year Level"
                    value={
                      student.year_level
                        ? `Year ${student.year_level}`
                        : ""
                    }
                  />

                  <InfoCard
                    icon={Phone}
                    label="Phone Number"
                    value={student.phone}
                  />
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E8E2DA] bg-[#F8F7F4] p-4">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-[#8B7355]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#0B1F3B]">
                      Your information is protected
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#6F756F]">
                      This page displays the profile associated with your
                      authenticated student account. If your registered
                      information needs to change, contact the appropriate
                      university administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Create a profile */
            <div className="overflow-hidden rounded-3xl border border-[#E8E2DA] bg-white shadow-sm">
              <div className="bg-[#0B1F3B] px-6 py-7 sm:px-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <User size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      Complete Your Profile
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-blue-100/80">
                      Enter your university information to get started.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-8">
                <div className="mb-6">
                  <h3 className="font-bold text-[#0B1F3B]">
                    Student Information
                  </h3>

                  <p className="mt-1 text-sm text-[#82796F]">
                    Fields marked with * are required.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="student_id" className={labelClass}>
                      Student ID <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Hash
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                      />

                      <input
                        id="student_id"
                        name="student_id"
                        type="text"
                        value={formData.student_id}
                        onChange={handleChange}
                        placeholder="Enter your student ID"
                        className={`${inputClass} pl-11`}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className={labelClass}>
                      Department <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Building2
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                      />

                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                        required
                      >
                        <option value="">Select your department</option>

                        {departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#82796F]">
                      Choose the department name that matches your
                      university registration.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="year_level" className={labelClass}>
                      Year Level <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <GraduationCap
                        size={19}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                      />

                      <select
                        id="year_level"
                        name="year_level"
                        value={formData.year_level}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                        required
                      >
                        {[1, 2, 3, 4, 5, 6].map((year) => (
                          <option key={year} value={String(year)}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone Number
                      <span className="ml-2 text-xs font-normal text-[#82796F]">
                        (Optional)
                      </span>
                    </label>

                    <div className="relative">
                      <Phone
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                      />

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className={`${inputClass} pl-11`}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-[#E8E2DA] pt-6">
                  <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#F8F7F4] p-4">
                    <BookOpen
                      size={19}
                      className="mt-0.5 shrink-0 text-[#8B7355]"
                    />

                    <p className="text-sm leading-6 text-[#6F756F]">
                      Please make sure your student ID and academic details
                      are accurate. Your student ID must not already belong
                      to another profile.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16345C] focus:outline-none focus:ring-4 focus:ring-[#0B1F3B]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Create My Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-[#82796F]">
            Woldia University Internship Management System
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default StudentProfile;