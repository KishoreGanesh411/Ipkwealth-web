import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContex";

import { ME } from "@/core/graphql/user/user.gql"; // expects { me { id email role status } }

import SignIn from "@/pages/AuthPages/SignIn";
import AppLayout from "@/layout/AppLayout";
import Unauthorized from "@/pages/OtherPage/Unauthorized";

// Marketing pages
import DigitalHome from "@/pages/Dashboard/DigitalHome";
import MarketingEvent from "@/pages/Calendar";
import LeadEntry from "@/pages/Forms/LeadEntry";
import LeadTable from "@/pages/Tables/BasicTables";

// Sales pages
import SalesRMDashboard from "@/pages/Dashboard/salesHome";
import MyLeadsPage from "@/pages/Sales/Mylead/MyLeadsPage";

// Misc
import NotFound from "@/pages/OtherPage/NotFound";
import UserProfiles from "@/pages/UserProfiles";
import Blank from "@/pages/Blank";
import ViewLead from "./components/sales/viewlwads/ViewLead";
import SalesEvent from "./pages/Sales/Event_sales/Event_Rm";

/** Decides the landing route based on backend role */
function RoleLanding() {
  const { data, loading, error } = useQuery(ME, { fetchPolicy: "cache-first" });

  if (loading) return <div className="p-6 text-center">Loading…</div>;

  // If token invalid or user not found in DB → go signin
  if (error || !data?.me) return <Navigate to="/signin" replace />;

  const role = data.me.role as "ADMIN" | "RM" | "STAFF" | "MARKETING" | "ANALYST";

  if (role === "RM") return <Navigate to="/sales/dashboard" replace />;
  if (role === "MARKETING") return <Navigate to="/marketing/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/marketing/dashboard" replace />; // adjust ADMIN home if needed

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
              <Route path="sales/my_leads" element={<MyLeadsPage />} />
              <Route path="sales/events" element={<SalesEvent />} />
              <Route path="sales/view_lead/:id" element={<ViewLead />} />
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
