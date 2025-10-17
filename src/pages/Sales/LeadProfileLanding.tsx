// import { useEffect, useState } from "react";
// import { Navigate } from "react-router-dom";

// // import RecentLeadProfilesPage from "./RecentLeadProfilesPage";
// // import { getRecentLeads } from "@/features/leads/profile/recentLeads";

// /**
//  * Landing route for the Lead Profile section.
//  * If there are recently viewed leads, automatically redirect to the most recent one.
//  * Otherwise, fall back to the recent interactions list so users can pick a lead.
//  */
// export default function LeadProfileLanding() {
//   const [targetId, setTargetId] = useState<string | null>(null);
//   const [checked, setChecked] = useState(false);

//   useEffect(() => {
//     try {
//       const [first] = getRecentLeads();
//       if (first?.id) {
//         setTargetId(String(first.id));
//       }
//     } finally {
//       setChecked(true);
//     }
//   }, []);

//   if (targetId) {
//     return <Navigate to={`/sales/leads/${targetId}`} replace />;
//   }

//   if (!checked) {
//     return null;
//   }

//   return <RecentLeadProfilesPage />;
// }
