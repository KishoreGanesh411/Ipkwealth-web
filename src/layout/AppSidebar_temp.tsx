import { useAuth } from '@/context/AuthContex';
import type { Role } from '@/context/AuthContex';
import { GridIcon, CalenderIcon, ListIcon, UserCircleIcon, PlugInIcon } from '@/icons';

const marketingNav = [
  { icon: <GridIcon />, name: 'Marketing Overview', path: '/marketing/dashboard' },
  { icon: <CalenderIcon />, name: 'Campaign Calendar', path: '/marketing/calendar' },
  {
    icon: <ListIcon />,
    name: 'Lead Intake',
    subItems: [
      { name: 'Create Lead', path: '/marketing/leads_create' },
      { name: 'Lead Library', path: '/marketing/overall-leads' },
    ],
  },
];

const salesNav = [
  { icon: <GridIcon />, name: 'Sales Dashboard', path: '/sales/dashboard' },
  {
    icon: <UserCircleIcon />,
    name: 'Lead Management',
    subItems: [
      { name: 'Assigned Leads', path: '/sales/assigned' },
      { name: 'Lead Stages', path: '/sales/stages' },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: 'Engagement',
    subItems: [
      { name: 'Events', path: '/sales/events' },
      { name: 'Calls', path: '/sales/call' },
      { name: 'Chat', path: '/sales/chat' },
    ],
  },
];

function getNav(role?: Role | "UNKNOWN") {
  if (role === 'RM') return { main: salesNav, others: [] };
  if (role === 'MARKETING')
    return {
      main: marketingNav,
      others: [
        { icon: <PlugInIcon />, name: 'Authentication', subItems: [{ name: 'Sign In', path: '/signin' }] },
      ],
    };
  if (role === 'ADMIN') return { main: [...marketingNav, ...salesNav], others: [] };
  return { main: [], others: [] };
}

export default function AppSidebar() {
  const { user } = useAuth();
  const { main: navItems, others: othersItems } = getNav(user?.role);
  // keep your existing rendering function; just feed navItems & othersItems here
}
