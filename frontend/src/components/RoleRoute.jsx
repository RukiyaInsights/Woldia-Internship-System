import { Navigate } from "react-router-dom";

function RoleRoute({ allowedRoles, children }) {
    const token = localStorage.getItem("token");

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        user = null;
    }

    if (!token || !user || !user.id || !user.role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        const dashboardRoutes = {
            student: "/student",
            company: "/company",
            supervisor: "/supervisor",
            admin: "/admin"
        };

        return (
            <Navigate
                to={dashboardRoutes[user.role] || "/login"}
                replace
            />
        );
    }

    return children;
}

export default RoleRoute;