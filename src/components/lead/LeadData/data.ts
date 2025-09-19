export type LeadRowSeed = {
  id: string;        // you can ignore this for now; we'll generate fresh codes
  name: string;
  phone: string;
  status: string;
  source: string;
};

export const DUMMY_LEADS: LeadRowSeed[] = [
  { id: "IPK123450", name: "John Doe",        phone: "+1 (555) 010-1234", status: "Active",   source: "Website" },
  { id: "IPK123451", name: "Jane Smith",      phone: "+1 (555) 010-5678", status: "Pending",  source: "Email" },
  { id: "IPK123452", name: "Michael Brown",   phone: "+1 (555) 010-9012", status: "Active",   source: "Referral" },
  { id: "IPK123453", name: "Emily Davis",     phone: "+1 (555) 010-3456", status: "Inactive", source: "Cold Call" },
  { id: "IPK123454", name: "Robert Lee",      phone: "+1 (555) 010-7890", status: "Pending",  source: "Social Media" },
  { id: "IPK123455", name: "Olivia Johnson",  phone: "+1 (555) 010-1122", status: "Active",   source: "Website" },
  { id: "IPK123456", name: "William Clark",   phone: "+1 (555) 010-3344", status: "Inactive", source: "Email" },
  { id: "IPK123457", name: "Sophia Lopez",    phone: "+1 (555) 010-5566", status: "Active",   source: "Referral" },
  { id: "IPK123458", name: "Liam Walker",     phone: "+1 (555) 010-7788", status: "Pending",  source: "Website" },
  { id: "IPK123459", name: "Ava Martinez",    phone: "+1 (555) 010-9900", status: "Active",   source: "Social Media" },
];