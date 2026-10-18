import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    UserCheck,
    FileText,
    User,
    MessageSquare,
    PlusCircle,
    ClipboardCheck,
    Bell,
    Menu,
    X,
    LogOut,
    ChevronRight,
    ShieldCheck,
    CheckCheck,
    LoaderCircle,
    AlertCircle,
    RefreshCw,
    GraduationCap,
    Building2
} from "lucide-react";

import woldiaLogo from "../../assets/woldia-university-logo.png";

const API_URL = "http://localhost:5000/api";

/* =========================================================
   ROLE CONFIGURATION
========================================================= */

const roleConfig = {
    student: {
        label: "Student",
        icon: GraduationCap,
        sidebarIconColor: "text-sky-300"
    },

    supervisor: {
        label: "Supervisor",
        icon: ClipboardCheck,
        sidebarIconColor: "text-emerald-300"
    },

    company: {
        label: "Company",
        icon: Building2,
        sidebarIconColor: "text-amber-300"
    },

    admin: {
        label: "Admin",
        icon: ShieldCheck,
        sidebarIconColor: "text-violet-300"
    }
};

/* =========================================================
   NAVIGATION MENU
========================================================= */

const menuItems = {
    student: [
        {
            label: "Dashboard",
            path: "/student",
            icon: LayoutDashboard
        },
        {
            label: "Internships",
            path: "/student/internships",
            icon: Briefcase
        },
        {
            label: "My Applications",
            path: "/student/applications",
            icon: FileText
        },
        {
            label: "My Profile",
            path: "/student/profile",
            icon: User
        }
    ],

    company: [
        {
            label: "Dashboard",
            path: "/company",
            icon: LayoutDashboard
        },
        {
            label: "Applications",
            path: "/company/applications",
            icon: ClipboardCheck
        },
        {
            label: "Create Internship",
            path: "/company/internships/create",
            icon: PlusCircle
        },
        {
            label: "Messages",
            path: "/company/messages",
            icon: MessageSquare
        }
    ],

    supervisor: [
        {
            label: "Dashboard",
            path: "/supervisor",
            icon: LayoutDashboard
        },
        {
            label: "Messages",
            path: "/supervisor/messages",
            icon: MessageSquare
        }
    ],

    admin: [
        {
            label: "Dashboard",
            path: "/admin",
            icon: LayoutDashboard
        },
        {
            label: "Pending Internships",
            path: "/admin/internships/pending",
            icon: ClipboardCheck
        },
        {
            label: "Supervisor Assignments",
            path: "/admin/assignments",
            icon: UserCheck
        }
    ]
};

/* =========================================================
   APP LAYOUT
========================================================= */

function AppLayout({ children }) {
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState("");
    const [bellAnimating, setBellAnimating] = useState(false);

    const previousNotificationIds = useRef(new Set());
    const notificationsInitialized = useRef(false);
    const bellAnimationTimer = useRef(null);
    const notificationRequestInProgress = useRef(false);

    const role = localStorage.getItem("role") || "student";
    const userName = localStorage.getItem("userName") || "User";

    const items = menuItems[role] || [];
    const currentRole = roleConfig[role] || roleConfig.student;
    const RoleIcon = currentRole.icon;

    const unreadCount = notifications.filter(
        (notification) => Number(notification.is_read) === 0
    ).length;

    /* =====================================================
       FETCH NOTIFICATIONS
       Checks for new notifications every 15 seconds.
    ===================================================== */

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setNotifications([]);
            setNotificationsError("Please sign in to view notifications.");

            previousNotificationIds.current = new Set();
            notificationsInitialized.current = false;

            return;
        }

        if (notificationRequestInProgress.current) {
            return;
        }

        notificationRequestInProgress.current = true;
        setNotificationsLoading(true);
        setNotificationsError("");

        try {
            const response = await fetch(`${API_URL}/notifications`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to retrieve notifications."
                );
            }

            const receivedNotifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];

            const currentNotificationIds = new Set(
                receivedNotifications.map((notification) =>
                    String(notification.id)
                )
            );

            const unreadNotifications = receivedNotifications.filter(
                (notification) => Number(notification.is_read) === 0
            );

            const hasNewUnreadNotification = unreadNotifications.some(
                (notification) =>
                    !previousNotificationIds.current.has(
                        String(notification.id)
                    )
            );

            if (!notificationsInitialized.current) {
                notificationsInitialized.current = true;

                // Ring briefly on initial load if unread notifications exist.
                if (unreadNotifications.length > 0) {
                    setBellAnimating(true);
                }
            } else if (hasNewUnreadNotification) {
                // Ring when polling detects a newly received unread notification.
                setBellAnimating(true);
            }

            previousNotificationIds.current = currentNotificationIds;
            setNotifications(receivedNotifications);
        } catch (error) {
            console.error("Fetch notifications error:", error);

            setNotificationsError(
                error.message || "Unable to load notifications."
            );
        } finally {
            notificationRequestInProgress.current = false;
            setNotificationsLoading(false);
        }
    }, []);

    /* =====================================================
       INITIAL FETCH AND AUTOMATIC POLLING
    ===================================================== */

    useEffect(() => {
        fetchNotifications();

        const notificationInterval = setInterval(() => {
            fetchNotifications();
        }, 15000);

        return () => {
            clearInterval(notificationInterval);

            if (bellAnimationTimer.current) {
                clearTimeout(bellAnimationTimer.current);
                bellAnimationTimer.current = null;
            }
        };
    }, [fetchNotifications]);

    /* =====================================================
       BELL ANIMATION DURATION
    ===================================================== */

    useEffect(() => {
        if (!bellAnimating) {
            return;
        }

        if (bellAnimationTimer.current) {
            clearTimeout(bellAnimationTimer.current);
        }

        bellAnimationTimer.current = setTimeout(() => {
            setBellAnimating(false);
            bellAnimationTimer.current = null;
        }, 1100);

        return () => {
            if (bellAnimationTimer.current) {
                clearTimeout(bellAnimationTimer.current);
                bellAnimationTimer.current = null;
            }
        };
    }, [bellAnimating]);

    /* =====================================================
       STOP ANIMATION WHEN ALL NOTIFICATIONS ARE READ
    ===================================================== */

    useEffect(() => {
        if (unreadCount === 0) {
            setBellAnimating(false);

            if (bellAnimationTimer.current) {
                clearTimeout(bellAnimationTimer.current);
                bellAnimationTimer.current = null;
            }
        }
    }, [unreadCount]);

    /* =====================================================
       CLOSE NOTIFICATION DROPDOWN
    ===================================================== */

    useEffect(() => {
        if (!notificationsOpen) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (
                !event.target.closest("[data-notification-container]")
            ) {
                setNotificationsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [notificationsOpen]);

    /* =====================================================
       MARK NOTIFICATION AS READ
    ===================================================== */

    const handleMarkAsRead = async (notificationId) => {
        const token = localStorage.getItem("token");

        if (!token) {
            setNotificationsError("Please sign in again.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/notifications/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to mark notification as read."
                );
            }

            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) =>
                    String(notification.id) === String(notificationId)
                        ? {
                            ...notification,
                            is_read: 1
                        }
                        : notification
                )
            );
        } catch (error) {
            console.error("Mark notification as read error:", error);

            setNotificationsError(
                error.message || "Unable to update notification."
            );
        }
    };

    const handleNotificationClick = async (notification) => {
        if (Number(notification.is_read) === 0) {
            await handleMarkAsRead(notification.id);
        }
    };

    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout = () => {
        if (bellAnimationTimer.current) {
            clearTimeout(bellAnimationTimer.current);
            bellAnimationTimer.current = null;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");
        localStorage.removeItem("user");

        navigate("/login");
    };

    /* =====================================================
       DATE FORMATTING
    ===================================================== */

    const formatNotificationDate = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            {/* NOTIFICATION ANIMATIONS */}

            <style>{`
                @keyframes notificationRing {
                    0%, 100% { transform: rotate(0deg); }
                    10%, 30%, 50%, 70% { transform: rotate(-12deg); }
                    20%, 40%, 60%, 80% { transform: rotate(12deg); }
                    90% { transform: rotate(-6deg); }
                }

                @keyframes notificationPulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.35);
                    }
                    70% {
                        box-shadow: 0 0 0 7px rgba(220, 38, 38, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
                    }
                }

                @keyframes notificationBadge {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.12); }
                }

                .notification-bell-active {
                    transform-origin: top center;
                    animation: notificationRing 0.9s ease-in-out;
                }

                .notification-button-active {
                    animation: notificationPulse 1.8s ease-out infinite;
                }

                .notification-badge-active {
                    animation: notificationBadge 1.5s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .notification-bell-active,
                    .notification-button-active,
                    .notification-badge-active {
                        animation: none !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-[#F5F2ED] text-slate-700">

                {/* MOBILE NAVIGATION BACKDROP */}

                {mobileOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        className="fixed inset-0 z-40 cursor-default bg-[#0B1F3B]/55 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* SIDEBAR */}

                <aside
                    className={
                        "fixed inset-y-0 left-0 z-50 flex h-screen w-[250px] flex-col " +
                        "bg-[#0B1F3B] text-white shadow-xl " +
                        "transition-transform duration-300 ease-in-out lg:translate-x-0 " +
                        (mobileOpen ? "translate-x-0" : "-translate-x-full")
                    }
                >
                    {/* UNIVERSITY BRANDING */}

                    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                                <img
                                    src={woldiaLogo}
                                    alt="Woldia University"
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-[13px] font-bold tracking-wide text-white">
                                    Woldia University
                                </h1>

                                <p className="mt-1 text-[11px] text-[#C5AD8D]">
                                    Internship System
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] lg:hidden"
                            aria-label="Close navigation"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    {/* USER PROFILE */}

                    <div className="shrink-0 border-b border-white/10 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 transition-transform duration-200 hover:scale-105">
                                <RoleIcon
                                    size={23}
                                    strokeWidth={1.8}
                                    className={currentRole.sidebarIconColor}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                    {userName}
                                </p>

                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

                                    <p className="text-[11px] font-medium text-[#C5AD8D]">
                                        {currentRole.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NAVIGATION */}

                    <nav className="flex-1 overflow-y-auto px-3.5 py-5">
                        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#8896A6]">
                            Main Menu
                        </p>

                        <div className="space-y-1.5">
                            {items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 " +
                                            "text-[13px] font-semibold transition-all duration-200 " +
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] " +
                                            (
                                                isActive
                                                    ? "bg-[#8B7355] text-white shadow-md shadow-black/10"
                                                    : "text-[#B8C2CE] hover:bg-white/[0.07] hover:text-white"
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div
                                                    className={
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors " +
                                                        (
                                                            isActive
                                                                ? "bg-white/15"
                                                                : "bg-white/[0.04] group-hover:bg-white/10"
                                                        )
                                                    }
                                                >
                                                    <Icon size={17} />
                                                </div>

                                                <span className="min-w-0 flex-1">
                                                    {item.label}
                                                </span>

                                                <ChevronRight
                                                    size={15}
                                                    className={
                                                        "shrink-0 transition-all duration-200 " +
                                                        (
                                                            isActive
                                                                ? "opacity-80"
                                                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                                                        )
                                                    }
                                                />
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </nav>

                    {/* SECURITY INFORMATION */}

                    <div className="mx-3.5 mb-3 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="flex items-start gap-2.5">
                            <div className="shrink-0 rounded-lg bg-[#8B7355]/20 p-1.5 text-[#C5AD8D]">
                                <ShieldCheck size={15} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-white">
                                    Secure Access
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-[#9EABB9]">
                                    Your account is protected by role-based access.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SIGN OUT */}

                    <div className="shrink-0 border-t border-white/10 p-3.5">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#B8C2CE] transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] transition group-hover:bg-red-500/10">
                                <LogOut size={17} />
                            </div>

                            <span>Sign out</span>
                        </button>
                    </div>
                </aside>

                {/* MAIN AREA */}

                <div className="min-h-screen lg:ml-[250px]">

                    {/* HEADER */}

                    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-[#E3DDD4] bg-[#F8F7F4]/95 px-3.5 shadow-sm backdrop-blur-md sm:px-5 lg:px-7">

                        {/* MOBILE MENU BUTTON */}

                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#0B1F3B] transition hover:bg-[#0B1F3B]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] lg:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu size={21} />
                        </button>

                        {/* WELCOME MESSAGE */}

                        <div className="hidden min-w-0 sm:block">
                            <p className="text-[11px] font-medium text-slate-500">
                                Welcome back,
                            </p>

                            <p className="mt-0.5 max-w-[240px] truncate text-sm font-bold text-[#0B1F3B]">
                                {userName}
                            </p>
                        </div>

                        <div className="ml-auto flex items-center gap-2">

                            {/* NOTIFICATION BELL */}

                            <div
                                className="relative"
                                data-notification-container
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        const opening = !notificationsOpen;

                                        setNotificationsOpen(opening);

                                        if (opening) {
                                            fetchNotifications();
                                        }
                                    }}
                                    className={
                                        "group relative flex h-10 w-10 items-center justify-center rounded-xl border " +
                                        "transition-all duration-200 active:scale-95 " +
                                        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C5AD8D]/30 " +
                                        (
                                            notificationsOpen
                                                ? "border-[#C5AD8D]/70 bg-[#C5AD8D]/15 text-[#0B1F3B] shadow-sm"
                                                : "border-[#E3DDD4] bg-white text-[#0B1F3B] shadow-sm hover:-translate-y-0.5 hover:border-[#C5AD8D] hover:bg-[#FBF8F3] hover:shadow-md"
                                        ) +
                                        (
                                            unreadCount > 0 && !notificationsOpen
                                                ? " notification-button-active"
                                                : ""
                                        )
                                    }
                                    title="Notifications"
                                    aria-label={
                                        unreadCount > 0
                                            ? `Notifications, ${unreadCount} unread`
                                            : "Notifications"
                                    }
                                    aria-expanded={notificationsOpen}
                                >
                                    <Bell
                                        size={19}
                                        strokeWidth={1.9}
                                        className={
                                            "transition-transform duration-200 " +
                                            (
                                                bellAnimating &&
                                                unreadCount > 0 &&
                                                !notificationsOpen
                                                    ? "notification-bell-active"
                                                    : notificationsOpen
                                                        ? "rotate-[-10deg]"
                                                        : "group-hover:rotate-[-10deg]"
                                            )
                                        }
                                    />

                                    {/* UNREAD BADGE */}

                                    {unreadCount > 0 && (
                                        <span
                                            className={
                                                "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#F8F7F4] bg-red-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm " +
                                                (
                                                    !notificationsOpen
                                                        ? "notification-badge-active"
                                                        : ""
                                                )
                                            }
                                        >
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* NOTIFICATION DROPDOWN */}

                                {notificationsOpen && (
                                    <div className="absolute right-0 top-full z-50 mt-2.5 w-[min(340px,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border border-[#E3DDD4] bg-white shadow-xl shadow-[#0B1F3B]/10 sm:w-[350px]">

                                        {/* DROPDOWN HEADER */}

                                        <div className="flex items-center justify-between gap-3 border-b border-[#EDE8E1] bg-[#FAF9F7] px-3.5 py-3 sm:px-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-sm font-bold text-[#0B1F3B]">
                                                        Notifications
                                                    </h2>

                                                    {unreadCount > 0 && (
                                                        <span className="rounded-full bg-[#8B7355]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B7355]">
                                                            {unreadCount} unread
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    Stay updated on your activities.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={fetchNotifications}
                                                disabled={notificationsLoading}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold text-[#0B1F3B] transition hover:bg-[#0B1F3B]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <RefreshCw
                                                    size={13}
                                                    className={
                                                        notificationsLoading
                                                            ? "animate-spin"
                                                            : ""
                                                    }
                                                />

                                                Refresh
                                            </button>
                                        </div>

                                        {/* NOTIFICATION CONTENT */}

                                        <div className="max-h-[min(390px,65vh)] overflow-y-auto">
                                            {notificationsLoading ? (
                                                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                                                    <LoaderCircle
                                                        size={23}
                                                        className="animate-spin text-[#8B7355]"
                                                    />

                                                    <p className="mt-3 text-xs text-slate-500">
                                                        Loading notifications...
                                                    </p>
                                                </div>
                                            ) : notificationsError ? (
                                                <div className="px-4 py-7 text-center">
                                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                                                        <AlertCircle
                                                            size={21}
                                                            className="text-amber-600"
                                                        />
                                                    </div>

                                                    <p className="mt-3 text-xs leading-5 text-slate-600">
                                                        {notificationsError}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={fetchNotifications}
                                                        className="mt-3 rounded-lg bg-[#0B1F3B] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#18365C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5AD8D]"
                                                    >
                                                        Try again
                                                    </button>
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="px-4 py-9 text-center">
                                                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F2ED]">
                                                        <Bell
                                                            size={21}
                                                            className="text-[#8B7355]"
                                                        />
                                                    </div>

                                                    <p className="mt-3 text-sm font-semibold text-[#0B1F3B]">
                                                        No notifications yet
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        New notifications will appear here.
                                                    </p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => {
                                                    const isUnread =
                                                        Number(notification.is_read) === 0;

                                                    return (
                                                        <button
                                                            key={notification.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleNotificationClick(
                                                                    notification
                                                                )
                                                            }
                                                            className={
                                                                "block w-full border-b border-[#F0ECE6] px-3.5 py-3.5 text-left transition-colors duration-150 sm:px-4 " +
                                                                "focus-visible:outline-none focus-visible:bg-[#F5F2ED] " +
                                                                (
                                                                    isUnread
                                                                        ? "bg-[#FAF8F4] hover:bg-[#F5F0E8]"
                                                                        : "bg-white hover:bg-[#FAF9F7]"
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3B]/[0.05] text-[#8B7355]">
                                                                    <Bell size={15} />

                                                                    {isUnread && (
                                                                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#8B7355] ring-2 ring-white" />
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="break-words text-[13px] font-semibold leading-5 text-[#0B1F3B]">
                                                                        {notification.title}
                                                                    </p>

                                                                    <p className="mt-1 whitespace-normal break-words text-xs leading-[1.65] text-slate-600">
                                                                        {notification.message}
                                                                    </p>

                                                                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {formatNotificationDate(
                                                                                notification.created_at
                                                                            )}
                                                                        </span>

                                                                        {isUnread && (
                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8B7355]">
                                                                                <CheckCheck size={12} />
                                                                                Mark read
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* DROPDOWN FOOTER */}

                                        <div className="border-t border-[#EDE8E1] bg-[#FAF9F7] px-4 py-2.5">
                                            <p className="text-center text-[10px] text-slate-400">
                                                Woldia University Internship System
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}

                    <main className="min-h-[calc(100vh-4.25rem)] bg-[#F5F2ED] p-3.5 sm:p-5 lg:p-6 xl:p-7">
                        <div className="mx-auto w-full max-w-[1600px]">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default AppLayout;