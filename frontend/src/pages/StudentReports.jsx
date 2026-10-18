import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  PlusCircle,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  GraduationCap,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Paperclip,
  ExternalLink,
  Download,
  X,
  Link as LinkIcon,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

const API_BASE = "https://woldia-internship-system.onrender.com/api/students";

const initialForm = {
  internship_id: "",
  week_number: "1",
  title: "",
  content: "",
  shared_link: "",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
  "txt",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
];

function StudentReports() {
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const acceptedApplications = applications.filter(
    (application) =>
      String(application.status || "").toLowerCase() === "accepted"
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [applicationsResponse, reportsResponse] = await Promise.all([
        fetch(`${API_BASE}/applications`, { headers }),
        fetch(`${API_BASE}/reports`, { headers }),
      ]);

      const applicationsData = await applicationsResponse.json();
      const reportsData = await reportsResponse.json();

      if (!applicationsResponse.ok) {
        throw new Error(
          applicationsData.message ||
            "Unable to load your internship applications."
        );
      }

      if (!reportsResponse.ok) {
        throw new Error(
          reportsData.message || "Unable to load your progress reports."
        );
      }

      setApplications(applicationsData.applications || []);
      setReports(reportsData.reports || []);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setAttachment(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      setError(
        "Unsupported file type. Choose a PDF, Word, Excel, PowerPoint, image, or TXT file."
      );
      event.target.value = "";
      setAttachment(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The attachment must not exceed 10 MB.");
      event.target.value = "";
      setAttachment(null);
      return;
    }

    setAttachment(file);
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
      !form.internship_id ||
      !form.week_number ||
      !form.title.trim() ||
      !form.content.trim()
    ) {
      setError("Please complete all required fields before submitting.");
      return;
    }

    const weekNumber = Number(form.week_number);

    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      setError("Please enter a valid week number starting from 1.");
      return;
    }

    if (form.shared_link.trim()) {
      try {
        const parsedUrl = new URL(form.shared_link.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch {
        setError(
          "Enter a valid shared link beginning with http:// or https://."
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const reportData = new FormData();

      reportData.append("internship_id", String(Number(form.internship_id)));
      reportData.append("week_number", String(weekNumber));
      reportData.append("title", form.title.trim());
      reportData.append("content", form.content.trim());

      if (form.shared_link.trim()) {
        reportData.append("shared_link", form.shared_link.trim());
      }

      if (attachment) {
        reportData.append("attachment", attachment);
      }

      const response = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: reportData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit your progress report."
        );
      }

      setSuccess(data.message || "Your progress report was submitted.");

      setForm({
        ...initialForm,
        internship_id: form.internship_id,
      });

      setAttachment(null);

      const fileInput = document.getElementById("attachment");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadData();
    } catch (err) {
      setError(
        err.message || "Something went wrong while submitting your report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (report) => {
    setError("");
    setDownloadingReportId(report.report_id);

    try {
      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/reports/${report.report_id}/attachment/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message = "Unable to download the attachment.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // The server may return a non-JSON error.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = objectUrl;
      downloadLink.download =
        report.attachment_name || "report-attachment";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || "Unable to download the attachment.");
    } finally {
      setDownloadingReportId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#D8D0C7] bg-white px-4 py-3 text-sm text-[#0B1F3B] outline-none transition placeholder:text-[#A49A8F] focus:border-[#8B7355] focus:ring-4 focus:ring-[#8B7355]/10";

  const labelClass = "mb-2 block text-sm font-semibold text-[#26364A]";

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "reviewed" || normalized === "approved") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (normalized === "rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F8F7F4] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4D8C8] bg-[#F5F2ED] px-3 py-1.5 text-xs font-semibold text-[#705A40]">
                <GraduationCap size={15} />
                Student Workspace
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3B] sm:text-3xl">
                Progress Reports
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F756F] sm:text-base">
                Document your internship experience, submit weekly updates,
                attach supporting files or share links, and review supervisor
                feedback.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#D8D0C7] bg-white px-4 py-3 text-sm font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:bg-[#F5F2ED] disabled:opacity-60 sm:self-center"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="leading-6">{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <p className="leading-6">{success}</p>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E8E2DA] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                <FileText size={22} />
              </div>

              <p className="text-sm text-[#82796F]">Reports Submitted</p>

              <p className="mt-1 text-3xl font-bold text-[#0B1F3B]">
                {reports.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2DA] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A6F]">
                <Building2 size={22} />
              </div>

              <p className="text-sm text-[#82796F]">Accepted Internships</p>

              <p className="mt-1 text-3xl font-bold text-[#0B1F3B]">
                {acceptedApplications.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E2DA] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <MessageSquare size={22} />
              </div>

              <p className="text-sm text-[#82796F]">Reports With Feedback</p>

              <p className="mt-1 text-3xl font-bold text-[#0B1F3B]">
                {
                  reports.filter(
                    (report) =>
                      Array.isArray(report.feedback) &&
                      report.feedback.length > 0
                  ).length
                }
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-[#E8E2DA] bg-white p-10 text-center">
              <RefreshCw
                size={26}
                className="mx-auto mb-4 animate-spin text-[#8B7355]"
              />

              <p className="font-semibold text-[#0B1F3B]">
                Loading your progress reports...
              </p>
            </div>
          ) : (
            <>
              <section className="mb-8 overflow-hidden rounded-3xl border border-[#E8E2DA] bg-white shadow-sm">
                <div className="bg-[#0B1F3B] px-5 py-6 sm:px-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                      <PlusCircle size={25} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Submit a Progress Report
                      </h2>

                      <p className="mt-1 text-sm text-blue-100/80">
                        Share your weekly activities, supporting files, or
                        online resources with your supervisor.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-8">
                  {acceptedApplications.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={21}
                          className="mt-0.5 shrink-0 text-amber-700"
                        />

                        <div>
                          <h3 className="font-semibold text-amber-900">
                            No accepted internship found
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            You can submit a progress report after a company
                            accepts your internship application.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="internship_id"
                            className={labelClass}
                          >
                            Accepted Internship
                          </label>

                          <div className="relative">
                            <select
                              id="internship_id"
                              name="internship_id"
                              value={form.internship_id}
                              onChange={handleChange}
                              className={`${inputClass} appearance-none pr-10`}
                              required
                            >
                              <option value="">
                                Select your internship
                              </option>

                              {acceptedApplications.map((application) => (
                                <option
                                  key={application.id}
                                  value={application.internship_id}
                                >
                                  {application.internship_title}
                                  {application.company_name
                                    ? ` — ${application.company_name}`
                                    : ""}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={18}
                              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#82796F]"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="week_number"
                            className={labelClass}
                          >
                            Week Number
                          </label>

                          <div className="relative">
                            <CalendarDays
                              size={18}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                            />

                            <input
                              id="week_number"
                              name="week_number"
                              type="number"
                              min="1"
                              step="1"
                              value={form.week_number}
                              onChange={handleChange}
                              className={`${inputClass} pl-11`}
                              required
                            />
                          </div>

                          <p className="mt-2 text-xs text-[#82796F]">
                            Enter the internship week this report covers.
                          </p>
                        </div>

                        <div>
                          <label htmlFor="title" className={labelClass}>
                            Report Title
                          </label>

                          <input
                            id="title"
                            name="title"
                            type="text"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Week 1 Activities"
                            maxLength={150}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="content" className={labelClass}>
                            Report Details
                          </label>

                          <textarea
                            id="content"
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            placeholder="Describe the tasks you completed, skills you learned, challenges you faced, and your progress..."
                            rows={6}
                            maxLength={10000}
                            className={`${inputClass} resize-y leading-6`}
                            required
                          />

                          <p className="mt-2 text-right text-xs text-[#82796F]">
                            {form.content.length}/10,000 characters
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="attachment"
                            className={labelClass}
                          >
                            Attach a File (Optional)
                          </label>

                          <div className="rounded-2xl border border-dashed border-[#D8D0C7] bg-[#FAF9F7] p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                <Paperclip size={22} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <input
                                  id="attachment"
                                  name="attachment"
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx,.ppt,.pptx"
                                  onChange={handleAttachmentChange}
                                  className="block w-full text-sm text-[#46515D] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0B1F3B] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#16345C]"
                                />

                                <p className="mt-2 text-xs leading-5 text-[#82796F]">
                                  PDF, Word, Excel, PowerPoint, JPG, PNG, or
                                  TXT. Maximum size: 10 MB.
                                </p>
                              </div>
                            </div>

                            {attachment && (
                              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
                                <div className="flex min-w-0 items-center gap-2 text-sm text-green-800">
                                  <FileText size={17} className="shrink-0" />

                                  <span className="break-all">
                                    {attachment.name}
                                  </span>

                                  <span className="shrink-0 text-xs">
                                    (
                                    {(
                                      attachment.size /
                                      1024 /
                                      1024
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttachment(null);

                                    const input =
                                      document.getElementById("attachment");

                                    if (input) input.value = "";
                                  }}
                                  aria-label="Remove attachment"
                                  className="shrink-0 rounded-lg p-1 text-green-800 hover:bg-green-100"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="shared_link"
                            className={labelClass}
                          >
                            Share a Link (Optional)
                          </label>

                          <div className="relative">
                            <LinkIcon
                              size={18}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B8A75]"
                            />

                            <input
                              id="shared_link"
                              name="shared_link"
                              type="url"
                              value={form.shared_link}
                              onChange={handleChange}
                              placeholder="https://drive.google.com/..."
                              maxLength={2048}
                              className={`${inputClass} pl-11`}
                            />
                          </div>

                          <p className="mt-2 text-xs leading-5 text-[#82796F]">
                            Share a Google Drive, OneDrive, or other HTTPS
                            link. Make sure your supervisor has permission to
                            access the shared resource.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-t border-[#E8E2DA] pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-xl text-xs leading-5 text-[#82796F]">
                          You can attach a file, share a link, or do both.
                          Duplicate weekly reports are prevented by the
                          backend.
                        </p>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3B] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16345C] focus:outline-none focus:ring-4 focus:ring-[#0B1F3B]/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send size={17} />
                              Submit Report
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </section>

              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[#0B1F3B] sm:text-2xl">
                    My Submitted Reports
                  </h2>

                  <p className="mt-2 text-sm text-[#82796F]">
                    Review your submitted reports, attachments, shared links,
                    and supervisor feedback.
                  </p>
                </div>

                {reports.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#D8D0C7] bg-white px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F2ED] text-[#8B7355]">
                      <ClipboardList size={30} />
                    </div>

                    <h3 className="text-lg font-bold text-[#0B1F3B]">
                      No reports submitted yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#82796F]">
                      Once you submit your first weekly report, it will appear
                      here with its status and supervisor feedback.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reports.map((report) => (
                      <article
                        key={report.report_id}
                        className="overflow-hidden rounded-2xl border border-[#E8E2DA] bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="p-5 sm:p-7">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F2ED] text-[#8B7355]">
                                <FileText size={23} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7355]">
                                  Week {report.week_number}
                                </p>

                                <h3 className="mt-1 break-words text-lg font-bold text-[#0B1F3B]">
                                  {report.title}
                                </h3>

                                <p className="mt-2 flex items-center gap-2 text-sm text-[#82796F]">
                                  <Building2
                                    size={15}
                                    className="shrink-0"
                                  />

                                  <span className="break-words">
                                    {report.internship_title}
                                    {report.company_name
                                      ? ` · ${report.company_name}`
                                      : ""}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                report.status
                              )}`}
                            >
                              {String(report.status || "").toLowerCase() ===
                              "reviewed" ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Clock size={14} />
                              )}

                              {report.status || "Submitted"}
                            </span>
                          </div>

                          <div className="mt-5 rounded-xl bg-[#F8F7F4] p-4 sm:p-5">
                            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#46515D]">
                              {report.content}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#82796F]">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={14} />
                              Submitted:{" "}
                              {report.submitted_at
                                ? new Date(
                                    report.submitted_at
                                  ).toLocaleDateString()
                                : "Date unavailable"}
                            </span>
                          </div>

                          {(report.has_attachment || report.shared_link) && (
                            <div className="mt-5 rounded-xl border border-[#E8E2DA] bg-white p-4">
                              <h4 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1F3B]">
                                <Paperclip
                                  size={18}
                                  className="text-[#8B7355]"
                                />
                                Supporting Materials
                              </h4>

                              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                {report.has_attachment && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(report)}
                                    disabled={
                                      downloadingReportId === report.report_id
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:bg-[#F5F2ED] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {downloadingReportId ===
                                    report.report_id ? (
                                      <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Download size={16} />
                                    )}

                                    {report.attachment_name ||
                                      "Download Attachment"}
                                  </button>
                                )}

                                {report.shared_link && (
                                  <a
                                    href={report.shared_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D0C7] bg-[#F8F7F4] px-4 py-3 text-sm font-semibold text-[#0B1F3B] transition hover:border-[#8B7355] hover:bg-[#F5F2ED]"
                                  >
                                    <ExternalLink size={16} />
                                    Open Shared Link
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-5 border-t border-[#E8E2DA] pt-5">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1F3B]">
                              <MessageSquare
                                size={18}
                                className="text-[#8B7355]"
                              />
                              Supervisor Feedback
                            </h4>

                            {Array.isArray(report.feedback) &&
                            report.feedback.length > 0 ? (
                              <div className="space-y-3">
                                {report.feedback.map((item, index) => (
                                  <div
                                    key={
                                      item.feedback_id ||
                                      `${report.report_id}-${index}`
                                    }
                                    className="rounded-xl border border-[#E4D8C8] bg-[#F5F2ED]/70 p-4"
                                  >
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#46515D]">
                                      {item.comment}
                                    </p>

                                    {item.created_at && (
                                      <p className="mt-3 text-xs text-[#82796F]">
                                        {new Date(
                                          item.created_at
                                        ).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-xl border border-dashed border-[#D8D0C7] px-4 py-4 text-sm leading-6 text-[#82796F]">
                                Your supervisor has not provided feedback for
                                this report yet.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <p className="mt-8 text-center text-xs text-[#82796F]">
            Woldia University Internship Management System
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default StudentReports;