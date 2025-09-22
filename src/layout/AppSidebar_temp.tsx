import { useAuth } from "@/context/AuthContex";
import { Role } from "@/context/AuthContext_temp";
import { GridIcon, CalenderIcon, ListIcon, TableIcon, UserCircleIcon, PlugInIcon } from "@/icons";

const marketingNav = [
  { icon: <GridIcon/>, name: "Dashboard", subItems: [{ name: "IPK-Digital", path: "/marketing/dashboard" }] },
  { icon: <CalenderIcon/>, name: "Calendar", path: "/marketing/calendar" },
  { icon: <ListIcon/>, name: "Lead creation", subItems: [{ name: "Create Lead", path: "/marketing/leads_create" }] },
  { icon: <TableIcon/>, name: "Lead generate", subItems: [{ name: "overall-leads", path: "/marketing/overall-leads" }] },
];

const salesNav = [
  { icon: <GridIcon/>, name: "Dashboard", subItems: [{ name: "IPK-Sales", path: "/sales/dashboard" }] },
  { icon: <UserCircleIcon/>, name: "My leads", subItems: [{ name: "latest-leads", path: "/sales/my_leads" }] },
];

function getNav(role?: Role) {
  if (role === "RM") return { main: salesNav, others: [] };
  if (role === "MARKETING") return { main: marketingNav, others: [
    { icon: <PlugInIcon/>, name: "Authentication", subItems: [{ name: "Sign In", path: "/signin" }] },
  ]};
  if (role === "ADMIN") return { main: [...marketingNav, ...salesNav], others: [] };
  return { main: [], others: [] };
}

export default function AppSidebar() {
  const { user } = useAuth();
  const { main: navItems, others: othersItems } = getNav(user?.role);
  // keep your existing rendering function; just feed navItems & othersItems here
}
