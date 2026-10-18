import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Internships from "./pages/Internships";
import MyApplications from "./pages/MyApplications";
import CompanyApplications from "./pages/CompanyApplications";
import CreateInternship from "./pages/CreateInternship";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyMessages from "./pages/CompanyMessages";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentDocuments from "./pages/StudentDocuments";
import StudentReports from "./pages/StudentReports";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAssignments from "./pages/AdminAssignments";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorMessages from "./pages/SupervisorMessages";
import StudentSupervisorChat from "./pages/StudentSupervisorChat";
import PendingInternships from "./pages/PendingInternships";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public Home Page */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Public Authentication Pages */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* General Protected Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Student Routes */}
                <Route
                    path="/student"
                    element={
                        <RoleRoute allowedRoles={["student"]}>
                            <StudentDashboard />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/student/internships"
                    element={
                        <RoleRoute allowedRoles={["student"]}>
                            <Internships />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/student/applications"
                    element={
                        <RoleRoute allowedRoles={["student"]}>
                            <MyApplications />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/student/profile"
                    element={
                        <RoleRoute allowedRoles={["student"]}>
                            <StudentProfile />
                        </RoleRoute>
                    }
                />
                {/* Student Document Management */}
<Route
    path="/student/documents"
    element={
        <RoleRoute allowedRoles={["student"]}>
            <StudentDocuments />
        </RoleRoute>
    }
/>
{/* Student Progress Reports */}
<Route
    path="/student/reports"
    element={
        <RoleRoute allowedRoles={["student"]}>
            <StudentReports />
        </RoleRoute>
    }
/>
<Route
    path="/student/supervisor-chat"
    element={
        <RoleRoute allowedRoles={["student"]}>
            <StudentSupervisorChat />
        </RoleRoute>
    }
/>
                {/* Company Routes */}
                <Route
                    path="/company"
                    element={
                        <RoleRoute allowedRoles={["company"]}>
                            <CompanyDashboard />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/company/messages"
                    element={
                        <RoleRoute allowedRoles={["company"]}>
                            <CompanyMessages />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/company/applications"
                    element={
                        <RoleRoute allowedRoles={["company"]}>
                            <CompanyApplications />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/company/internships/create"
                    element={
                        <RoleRoute allowedRoles={["company"]}>
                            <CreateInternship />
                        </RoleRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <RoleRoute allowedRoles={["admin"]}>
                            <AdminDashboard />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/admin/assignments"
                    element={
                        <RoleRoute allowedRoles={["admin"]}>
                            <AdminAssignments />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/admin/internships/pending"
                    element={
                        <RoleRoute allowedRoles={["admin"]}>
                            <PendingInternships />
                        </RoleRoute>
                    }
                />

                {/* Supervisor Routes */}
                <Route
                    path="/supervisor"
                    element={
                        <RoleRoute allowedRoles={["supervisor"]}>
                            <SupervisorDashboard />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/supervisor/messages"
                    element={
                        <RoleRoute allowedRoles={["supervisor"]}>
                            <SupervisorMessages />
                        </RoleRoute>
                    }
                />
<Route
    path="/supervisor/student-chat"
    element={
        <RoleRoute allowedRoles={["supervisor"]}>
            <StudentSupervisorChat />
        </RoleRoute>
    }
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;