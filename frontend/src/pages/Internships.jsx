import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Briefcase,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Search,
    ShieldCheck,
    X,
    SlidersHorizontal,
} from "lucide-react";

import AppLayout from "../components/layout/AppLayout";

function Internships() {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [applyingId, setApplyingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("All locations");

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const response = await fetch(
                    "https://woldia-internship-system.onrender.com/api/students/internships",
                    {
                        headers: {
                            Authorization:
                                "Bearer " + localStorage.getItem("token"),
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Unable to load internships.");
                    return;
                }

                setInternships(
                    Array.isArray(data.internships) ? data.internships : []
                );
            } catch (error) {
                console.error("Fetch internships error:", error);
                setError("Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        };

        fetchInternships();
    }, []);

    const handleApply = async (internshipId) => {
        setApplyingId(internshipId);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(
                "https://woldia-internship-system.onrender.com/api/students/internships/apply",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            "Bearer " + localStorage.getItem("token"),
                    },
                    body: JSON.stringify({
                        internship_id: internshipId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Application failed.");
                return;
            }

            setSuccessMessage(
                data.message || "Application submitted successfully."
            );
        } catch (error) {
            console.error("Application error:", error);
            setError("Unable to connect to the server.");
        } finally {
            setApplyingId(null);
        }
    };

    const locations = useMemo(() => {
        const uniqueLocations = internships
            .map((internship) => internship.location?.trim())
            .filter(Boolean);

        return ["All locations", ...new Set(uniqueLocations)];
    }, [internships]);

    const filteredInternships = useMemo(() => {
        const searchText = searchTerm.toLowerCase().trim();

        return internships.filter((internship) => {
            const searchableText = [
                internship.title,
                internship.company_name,
                internship.company,
                internship.location,
                internship.description,
                internship.requirements,
                internship.category,
                internship.department,
            ]
                .filter(Boolean)
                .map((value) => String(value).toLowerCase())
                .join(" ");

            const matchesSearch = searchableText.includes(searchText);

            const matchesLocation =
                selectedLocation === "All locations" ||
                internship.location?.trim() === selectedLocation;

            return matchesSearch && matchesLocation;
        });
    }, [internships, searchTerm, selectedLocation]);

    if (loading) {
        return (
            <AppLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#E4DDD3] border-t-[#8B7355]" />
                        <p className="text-sm text-slate-500">
                            Loading internship opportunities...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#F7F8FA] px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">

                    <section className="relative mb-6 overflow-hidden rounded-2xl bg-[#0B1F3B] px-5 py-6 text-white shadow-lg sm:px-7">
                        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border border-[#C5AD8D]/20" />

                        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <Briefcase
                                        size={19}
                                        className="text-[#D7BC96]"
                                    />
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7BC96]">
                                        Student Portal
                                    </span>
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Internship Opportunities
                                </h1>

                                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                                    Discover placements, explore career
                                    opportunities, and apply for internships
                                    that match your skills.
                                </p>
                            </div>

                            <div className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C5AD8D]/15 text-[#D7BC96]">
                                    <Briefcase size={20} />
                                </div>

                                <div>
                                    <p className="text-xs text-slate-300">
                                        Available opportunities
                                    </p>
                                    <p className="text-xl font-bold">
                                        {internships.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {internships.length > 0 && (
                        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_230px_auto]">
                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) =>
                                            setSearchTerm(event.target.value)
                                        }
                                        placeholder="Search title, company, or skills..."
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#8B7355] focus:bg-white focus:ring-2 focus:ring-[#8B7355]/10"
                                    />

                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm("")}
                                            aria-label="Clear search"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="relative">
                                    <SlidersHorizontal
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <select
                                        value={selectedLocation}
                                        onChange={(event) =>
                                            setSelectedLocation(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#8B7355] focus:ring-2 focus:ring-[#8B7355]/10"
                                    >
                                        {locations.map((location) => (
                                            <option key={location} value={location}>
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-center rounded-lg bg-[#F5F2ED] px-4 py-2.5 text-sm">
                                    <span className="font-bold text-[#0B1F3B]">
                                        {filteredInternships.length}
                                    </span>
                                    <span className="ml-1.5 text-slate-500">
                                        {filteredInternships.length === 1
                                            ? "result"
                                            : "results"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle size={19} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    Something went wrong
                                </p>
                                <p className="mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    Application submitted
                                </p>
                                <p className="mt-1">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {internships.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
                            <Briefcase
                                size={32}
                                className="mx-auto text-[#8B7355]"
                            />
                            <h2 className="mt-4 text-lg font-bold text-[#0B1F3B]">
                                No internships available
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                New internship opportunities will appear here
                                when they become available.
                            </p>
                        </div>
                    ) : filteredInternships.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
                            <Search
                                size={30}
                                className="mx-auto text-[#8B7355]"
                            />
                            <h2 className="mt-3 text-lg font-bold text-[#0B1F3B]">
                                No matching internships
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Try another search term or location.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedLocation("All locations");
                                }}
                                className="mt-4 rounded-lg bg-[#0B1F3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17365E]"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-[#0B1F3B]">
                                    Explore opportunities
                                </h2>
                                <span className="text-xs text-slate-500">
                                    {filteredInternships.length} shown
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {filteredInternships.map((internship) => (
                                    <article
                                        key={internship.id}
                                        className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:shadow-md"
                                    >
                                        <div className="border-b border-slate-100 bg-gradient-to-r from-[#F8F6F2] to-white p-2">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3B] text-[#D7BC96]">
                                                    <Building2 size={16} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-[#8B7355]">
                                                        {internship.company_name ||
                                                            internship.company ||
                                                            "Company"}
                                                    </p>

                                                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-[#0B1F3B]">
                                                        {internship.title ||
                                                            "Internship Opportunity"}
                                                    </h3>
                                                </div>

                                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                                                    Open
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col p-3">
                                            <p className="mb-2 line-clamp-2 min-h-[2rem] text-xs leading-5 text-slate-500">
                                                {internship.description ||
                                                    "Explore this internship opportunity and develop your professional skills."}
                                            </p>

                                            <div className="mb-3 space-y-2 border-t border-slate-100 pt-2.5">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <MapPin
                                                        size={15}
                                                        className="shrink-0 text-[#8B7355]"
                                                    />
                                                    <span className="truncate">
                                                        {internship.location ||
                                                            "Location not specified"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                                    <CalendarDays
                                                        size={15}
                                                        className="shrink-0 text-[#8B7355]"
                                                    />
                                                    <span className="truncate">
                                                        Start:{" "}
                                                        {internship.start_date
                                                            ? new Date(
                                                                  internship.start_date
                                                              ).toLocaleDateString()
                                                            : "To be announced"}
                                                    </span>
                                                </div>

                                                {internship.category && (
                                                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                                        <Briefcase
                                                            size={15}
                                                            className="shrink-0 text-[#8B7355]"
                                                        />
                                                        <span className="truncate">
                                                            {internship.category}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleApply(internship.id)
                                                }
                                                disabled={
                                                    applyingId === internship.id
                                                }
                                                className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3B] px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-[#17365E] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {applyingId === internship.id ? (
                                                    <>
                                                        <Clock3
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                        Applying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Briefcase size={15} />
                                                        Apply for Internship
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    {internships.length > 0 && (
                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                            <ShieldCheck
                                size={20}
                                className="mt-0.5 shrink-0 text-[#8B7355]"
                            />
                            <div>
                                <h3 className="text-sm font-bold text-[#0B1F3B]">
                                    Secure Internship Applications
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Apply through the Woldia University
                                    Internship System and track your application
                                    status from your student dashboard.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

export default Internships;