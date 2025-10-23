import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "RM" | "STAFF" | "MARKETING" | "ANALYST" | string;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE";
};

const MOCK_USERS: UserRow[] = [
  { id: "u1", name: "Mahesh Kumar", email: "mahesh@ipkwealth.com", role: "ADMIN", phone: "+91 98765 12345", status: "ACTIVE" },
  { id: "u2", name: "Haripriya", email: "haripriya@ipkwealth.com", role: "RM", phone: "+91 98765 11111", status: "ACTIVE" },
  { id: "u3", name: "Bharath", email: "bharath@ipkwealth.com", role: "RM", phone: "+91 98765 22222", status: "ACTIVE" },
  { id: "u4", name: "Marketing Bot", email: "marketing@ipkwealth.com", role: "MARKETING", phone: "+91 98765 33333", status: "INACTIVE" },
];

export default function IPKUsers() {
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return MOCK_USERS.filter((u) => {
      if (onlyActive && u.status !== "ACTIVE") return false;
      if (!s) return true;
      return (
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.phone || "").toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s)
      );
    });
  }, [search, onlyActive]);

  return (
    <>
      <PageMeta title="IPK Users" description="Manage organization users" />
      <PageBreadcrumb pageTitle="IPK Users" />

      <ComponentCard title="Active Users" desc="Overview of users with role and status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-white/80 sm:w-72"
              placeholder="Search by name, email, phone, role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded-sm border-gray-300 accent-blue-600 focus:ring-0 outline-none dark:border-white/20"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            Show active only
          </label>
        </div>

        <div className="mt-4 max-w-full overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Role</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Phone</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{u.name}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.email}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.role}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.phone ?? "—"}</TableCell>
                  <TableCell className="px-5 py-4">
                    {u.status === "ACTIVE" ? (
                      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-900/40 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users to show.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </>
  );
}