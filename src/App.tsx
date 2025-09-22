import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { AuthProvider, useAuth } from "@/context/AuthContex";

import SignIn from "@/pages/AuthPages/SignIn";
import AppLayout from "@/layout/AppLayout";
import Unauthorized from "@/pages/OtherPage/Unauthorized";

// Marketing pages
import DigitalHome from "@/pages/Dashboard/DigitalHome";
import Calendar from "@/pages/Calendar";
import LeadEntry from "@/pages/Forms/LeadEntry";
import LeadTable from "@/pages/Tables/BasicTables";

// Sales pages
import SalesRMDashboard from "@/pages/Dashboard/salesHome";
import MyLeadsPage from "@/pages/Mylead/MyLeadsPage";

// Misc
import NotFound from "@/pages/OtherPage/NotFound";
import UserProfiles from "@/pages/UserProfiles";
import Blank from "@/pages/Blank";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role === "RM") return <Navigate to="/sales/dashboard" replace />;
  if (user.role === "MARKETING") return <Navigate to="/marketing/dashboard" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />; // future
  return <Navigate to="/unauthorized" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Shared App layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* role-based landing */}
            <Route index element={<RootRedirect />} />

            {/* Marketing-only */}
            <Route
              path="marketing"
              element={<ProtectedRoute allow={["MARKETING", "ADMIN"]}><div /></ProtectedRoute>}
            >
              <Route path="marketing/dashboard" element={<DigitalHome />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="leads_create" element={<LeadEntry />} />
              <Route path="overall-leads" element={<LeadTable />} />
            </Route>

            {/* Sales (RM)-only */}
            <Route
              path="sales"
              element={<ProtectedRoute allow={["RM", "ADMIN"]}><div /></ProtectedRoute>}
            >
              <Route path="dashboard" element={<SalesRMDashboard />} />
              <Route path="my_leads" element={<MyLeadsPage />} />
            </Route>

            {/* Common pages if you need them for both roles */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="blank" element={<Blank />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
