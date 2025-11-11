import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS, CREATE_USER, UPDATE_USER, REMOVE_USER } from "@/core/graphql/user/user.gql";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";

type UserRow = {
  id?: string;
  name?: string;
  email?: string;
  role?: "ADMIN" | "RM" | "STAFF" | "MARKETING" | string;
  phone?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  archived?: boolean;
};

const roleOptions = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "MARKETING", label: "MARKETING" },
  { value: "RM", label: "RM" },
  { value: "STAFF", label: "STAFF" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export default function IPKUsers() {
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const { data, loading, error, refetch } = useQuery<{ getUsers: UserRow[] }>(GET_USERS, {
    variables: { withLeads: false },
    fetchPolicy: "cache-and-network",
  });
  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [removeUser] = useMutation(REMOVE_USER);

  const users: UserRow[] = data?.getUsers ?? [];

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyActive && u.status !== "ACTIVE") return false;
      if (!s) return true;
      return (
        (u.name || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.phone || "").toLowerCase().includes(s) ||
        (u.role || "").toLowerCase().includes(s)
      );
    });
  }, [users, search, onlyActive]);

  const [editor, setEditor] = useState<
    | { mode: "create"; user: Partial<UserRow> }
    | { mode: "edit"; user: UserRow }
    | null
  >(null);

  const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <>
      <PageMeta title="IPK Users" description="Manage organization users" />
      <PageBreadcrumb pageTitle="IPK Users" />

      <ComponentCard title="IPK Users" desc="All users with role and status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-white/80 sm:w-72"
              placeholder="Search by name, email, phone, role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setEditor({ mode: "create", user: { status: "ACTIVE", role: "STAFF" } })}>
              New User
            </Button>
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
        </div>

        <div className="relative mt-4 max-w-full overflow-x-auto">
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <div className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:text-white/80">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-white/40" />
                <span className="text-sm">Loading…</span>
              </div>
            </div>
          )}
          <Table className="min-w-[760px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Role</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Phone</TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{u.name}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.email}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.role}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{u.phone ?? "-"}</TableCell>
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
                  <TableCell className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: "edit", user: u })}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDel({ id: u.id ?? "", name: u.name ?? "" })}
                        className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-900/10"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {loading ? "Loading…" : error ? error.message : "No users to show."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Editor modal */}
        {editor && (
          <Modal isOpen={true} onClose={() => (saving ? undefined : setEditor(null))} className="max-w-lg m-4">
            <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editor.mode === "create" ? "Create User" : "Edit User"}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    disabled={saving}
                    value={editor.user.name ?? ""}
                    onChange={(e) => setEditor({ ...editor, user: { ...editor.user, name: e.target.value } })}
                    placeholder="Full name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    disabled={saving}
                    value={editor.user.email ?? ""}
                    onChange={(e) => setEditor({ ...editor, user: { ...(editor.user as any), email: e.target.value } })}
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    disabled={saving}
                    value={editor.user.phone ?? ""}
                    onChange={(e) => setEditor({ ...editor, user: { ...(editor.user as any), phone: e.target.value } })}
                    placeholder="+91…"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    disabled={saving}
                    options={roleOptions}
                    value={(editor.user.role as string) ?? ""}
                    onChange={(v) => setEditor({ ...editor, user: { ...(editor.user as any), role: v as any } })}
                    placeholder="Select Role"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    disabled={saving}
                    options={statusOptions}
                    value={(editor.user.status as string) ?? "ACTIVE"}
                    onChange={(v) => setEditor({ ...editor, user: { ...(editor.user as any), status: v as any } })}
                    placeholder="Select Status"
                  />
                </div>
                {editor.mode === "create" && (
                  <div className="sm:col-span-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      disabled={saving}
                      value={(editor.user as any).password ?? ""}
                    onChange={(e) => setEditor({ ...editor, user: { ...(editor.user as any), password: e.target.value as any } as any })}
                      placeholder="Set starter password"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !saving && setEditor(null)}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editor.user.name || !editor.user.email) {
                      toast.warn("Name and Email are required");
                      return;
                    }
                    setSaving(true);
                    try {
                      if (editor.mode === "create") {
                        const input = {
                          name: editor.user.name ?? "",
                          email: editor.user.email ?? "",
                          role: editor.user.role ?? "STAFF",
                          status: editor.user.status ?? "ACTIVE",
                          phone: editor.user.phone ?? undefined,
                          password: (editor.user as any).password ?? "Welcome@123",
                          archived: false,
                        };
                        const res = await createUser({ variables: { input } });
                        const ok = res.data?.createUser?.success;
                        if (!ok) throw new Error(res.data?.createUser?.message || "Create failed");
                        toast.success("User created");
                      } else {
                        const id = editor.user.id;
                        const input: any = {
                          name: editor.user.name,
                          email: editor.user.email,
                          role: editor.user.role,
                          status: editor.user.status,
                          phone: editor.user.phone,
                        };
                        await updateUser({ variables: { id, input } });
                        toast.success("User updated");
                      }
                      setEditor(null);
                      await refetch();
                    } catch (e: any) {
                      toast.error(e?.message || "Operation failed");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
                  {editor.mode === "create" ? (saving ? "Creating…" : "Create") : (saving ? "Saving…" : "Save")}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete confirm */}
        {confirmDel && (
          <Modal isOpen={true} onClose={() => (removing ? undefined : setConfirmDel(null))} className="max-w-md m-4">
            <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Delete user?</h4>
              <p className="mt-2 text-sm text-gray-700 dark:text-white/80">This action cannot be undone.</p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !removing && setConfirmDel(null)}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/5"
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setRemoving(true);
                    try {
                      await removeUser({ variables: { id: confirmDel.id } });
                      toast.success("User removed");
                      setConfirmDel(null);
                      await refetch();
                    } catch (e: any) {
                      toast.error(e?.message || "Delete failed");
                    } finally {
                      setRemoving(false);
                    }
                  }}
                  disabled={removing}
                  className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {removing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
                  {removing ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </ComponentCard>
    </>
  );
}
