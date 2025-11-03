import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContex";

import { ME } from "@/core/graphql/user/user.gql"; // expects { me { id email role status } }

// Auth
import SignIn from "@/pages/AuthPages/SignIn";
import ResetPassword from "@/pages/AuthPages/ResetPassword";

// Layout
import AppLayout from "@/layout/AppLayout";

// Marketing
import DigitalHome from "@/pages/Dashboard/DigitalHome";
import MarketingEvent from "@/pages/Calendar";
import LeadEntry from "@/pages/Forms/LeadEntry";
import LeadTable from "@/pages/Tables/BasicTables";

// Sales (RM)
import SalesRMDashboard from "@/pages/Dashboard/salesHome";
import SalesEvent from "@/pages/Sales/Event_sales/Event_Rm";
import CallConnectPage from "@/pages/Sales/Call/CallConnectPage";
import LeadStagesPage from "@/pages/Sales/LeadStagesPage";
import ViewLeadPage from "@/pages/Sales/ViewLeadPage";
import LeadProfileLanding from "@/pages/Sales/LeadProfileLanding";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import IPKUsers from "@/pages/Admin/IPKUsers";

// Common/Misc
import Unauthorized from "@/pages/OtherPage/Unauthorized";
import NotFound from "@/pages/OtherPage/NotFound";
import UserProfiles from "@/pages/UserProfiles";
import Blank from "@/pages/Blank";
import ChatPage from "@/pages/Sales/Support/ChatPage";

type Role = "ADMIN" | "RM" | "STAFF" | "MARKETING" | "ANALYST";

/** Decides the landing route based on backend role */
function RoleLanding() {
  const { data, loading, error } = useQuery(ME, { fetchPolicy: "cache-first" });

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-gray-600">
        Loading...
      </div>
    );
  if (error || !data?.me) return <Navigate to="/signin" replace />;

  const role = data.me.role as Role;
  if (role === "RM") return <Navigate to="/sales/dashboard" replace />;
  if (role === "MARKETING") return <Navigate to="/marketing/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />; // adjust if you want a true Admin home

  return <Navigate to="/unauthorized" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Private area with shared App layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* role-based landing */}
            <Route index element={<RoleLanding />} />

            {/* Admin-only */}
            <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<IPKUsers />} />
            </Route>

            {/* Marketing-only */}
            <Route element={<ProtectedRoute allow={["MARKETING", "ADMIN"]} />}>
              <Route path="marketing/dashboard" element={<DigitalHome />} />
              <Route path="marketing/calendar" element={<MarketingEvent />} />
              <Route path="marketing/leads_create" element={<LeadEntry />} />
              <Route path="marketing/overall-leads" element={<LeadTable />} />
            </Route>

            {/* Sales (RM)-only */}
            <Route element={<ProtectedRoute allow={["RM", "ADMIN"]} />}>
              <Route path="sales/dashboard" element={<SalesRMDashboard />} />
              <Route path="sales/assigned" element={<Navigate to="/sales/stages" replace />} />
              <Route path="sales/stages" element={<LeadStagesPage />} />
              <Route path="sales/leads" element={<LeadProfileLanding />} />
              <Route path="sales/leads/:id" element={<ViewLeadPage />} />
              <Route path="sales/events" element={<SalesEvent />} />
              <Route path="sales/call" element={<CallConnectPage />} />
              <Route path="sales/chat" element={<ChatPage />} />
            </Route>

            {/* Common */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="blank" element={<Blank />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
