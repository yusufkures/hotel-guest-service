
"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminSidebar from "../admin-sidebar";

type Department = {
  id: string;
  name: string;
  code: string;
};

type Role = {
  id: string;
  name: string;
};

type StaffMember = {
  user_id: string;
  display_name: string;
  is_active: boolean;
  departments:
    | { name: string; code: string }
    | { name: string; code: string }[]
    | null;
  roleNames?: string[];
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [roleName, setRoleName] = useState("");

  async function readResponse(response: Response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned an unexpected response (${response.status}). Check the terminal for errors.`
      );
    }
  }

  async function loadOptions() {
    setLoading(true);
    setError("");

    try {
      const [optionsResponse, staffResponse] = await Promise.all([
        fetch("/api/admin/staff", { cache: "no-store" }),
        fetch("/api/admin/staff/list", { cache: "no-store" }),
      ]);

      const optionsData = await readResponse(optionsResponse);
      const staffData = await readResponse(staffResponse);

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || "Could not load departments and roles.");
      }

      if (!staffResponse.ok) {
        throw new Error(staffData.error || "Could not load staff members.");
      }

      setDepartments(optionsData.departments ?? []);

      const availableRoles: Role[] = (optionsData.roles ?? []).filter(
        (role: Role) => role.name !== "Super Administrator"
      );
      setRoles(availableRoles);

      setDepartmentCode((current) =>
        current || optionsData.departments?.[0]?.code || ""
      );

      const defaultRole =
        availableRoles.find((role) => role.name === "Department Staff") ??
        availableRoles[0];

      setRoleName((current) => current || defaultRole?.name || "");
      setStaff(staffData.staff ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          departmentCode,
          roleName,
        }),
      });

      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error || "Could not create staff account.");

      setMessage("Staff account created successfully.");
      setDisplayName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStaff(member: StaffMember, body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/staff/${encodeURIComponent(member.user_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error || "Could not update staff member.");

      setMessage(result.message || "Staff member updated successfully.");
      setEditing(null);
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;

    if (!window.confirm(`Reset the password for ${resetTarget.display_name}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/staff/${encodeURIComponent(resetTarget.user_id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error || "Could not reset password.");

      setMessage("Password updated successfully.");
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStaff(member: StaffMember) {
    if (
      !window.confirm(
        `Delete ${member.display_name}'s account permanently? This cannot be undone.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/staff/${encodeURIComponent(member.user_id)}`,
        { method: "DELETE" }
      );

      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error || "Could not delete staff account.");

      setMessage("Staff account deleted.");
      await loadOptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <AdminSidebar />

      <main className="min-w-0 flex-1 p-6 sm:p-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                The Biltmore
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Staff &amp; Permissions</h1>
              <p className="mt-2 text-slate-600">
                Manage staff accounts, departments and roles.
              </p>
            </div>

            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
                setResetTarget(null);
                setError("");
                setMessage("");
              }}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              {showForm ? "Cancel" : "+ Add Staff"}
            </button>
          </header>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {message}
            </div>
          )}

          {showForm && (
            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-5 text-xl font-semibold">Add New Staff Member</h2>
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Staff name
                  <input required maxLength={100} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium">
                  Email address
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium">
                  Initial password
                  <input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                  <span className="mt-1 block text-xs font-normal text-slate-500">At least 12 characters.</span>
                </label>
                <label className="text-sm font-medium">
                  Department
                  <select required value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    {departments.map((d) => <option key={d.id} value={d.code}>{d.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Role
                  <select required value={roleName} onChange={(e) => setRoleName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={saving || loading || !departments.length || !roles.length} className="rounded-lg bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
                    {saving ? "Creating account..." : "Create Staff Account"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {editing && (
            <section className="mb-8 rounded-2xl border border-amber-200 bg-white p-6">
              <h2 className="mb-5 text-xl font-semibold">Edit: {editing.display_name}</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void updateStaff(editing, {
                    displayName: editing.display_name,
                    departmentCode:
                      (Array.isArray(editing.departments)
                        ? editing.departments[0]
                        : editing.departments)?.code ?? "",
                    roleName: editing.roleNames?.[0] ?? "",
                  });
                }}
                className="grid gap-5 sm:grid-cols-2"
              >
                <label className="text-sm font-medium">
                  Staff name
                  <input required value={editing.display_name} onChange={(e) => setEditing({ ...editing, display_name: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium">
                  Department
                  <select
                    required
                    value={(Array.isArray(editing.departments) ? editing.departments[0] : editing.departments)?.code ?? ""}
                    onChange={(e) => {
                      const d = departments.find((item) => item.code === e.target.value);
                      if (d) setEditing({ ...editing, departments: { name: d.name, code: d.code } });
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
                  >
                    {departments.map((d) => <option key={d.id} value={d.code}>{d.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Role
                  <select required value={editing.roleNames?.[0] ?? ""} onChange={(e) => setEditing({ ...editing, roleNames: [e.target.value] })} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </label>
                <div className="flex gap-3 sm:col-span-2">
                  <button disabled={saving} type="submit" className="rounded-lg bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                  <button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-5 py-3 text-sm">Cancel</button>
                </div>
              </form>
            </section>
          )}

          {resetTarget && (
            <section className="mb-8 rounded-2xl border border-amber-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">Reset password: {resetTarget.display_name}</h2>
              <form onSubmit={resetPassword} className="flex flex-wrap items-end gap-4">
                <label className="min-w-64 flex-1 text-sm font-medium">
                  New temporary password
                  <input required type="password" minLength={12} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <button disabled={saving} className="rounded-lg bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Reset Password"}</button>
                <button type="button" onClick={() => { setResetTarget(null); setNewPassword(""); }} className="rounded-lg border px-5 py-3 text-sm">Cancel</button>
              </form>
            </section>
          )}

          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold">Staff Members</h2>
              <p className="mt-1 text-sm text-slate-500">{staff.length} staff profile(s)</p>
            </div>

            {loading ? (
              <p className="p-6 text-slate-500">Loading staff...</p>
            ) : staff.length === 0 ? (
              <p className="p-6 text-slate-500">No staff profiles found.</p>
            ) : (
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-4 font-medium">Staff member</th>
                    <th className="p-4 font-medium">Department</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => {
                    const department = Array.isArray(member.departments) ? member.departments[0] : member.departments;
                    return (
                      <tr key={member.user_id} className="border-t border-slate-100">
                        <td className="p-4 font-medium">{member.display_name}</td>
                        <td className="p-4">{department?.name ?? "Not assigned"}</td>
                        <td className="p-4">{member.roleNames?.join(", ") || "No role assigned"}</td>
                        <td className="p-4">
                          <span className={member.is_active ? "rounded-full bg-green-100 px-2 py-1 text-green-800" : "rounded-full bg-slate-100 px-2 py-1 text-slate-600"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => { setEditing({ ...member }); setResetTarget(null); setShowForm(false); setError(""); setMessage(""); }} className="rounded border px-3 py-1.5 hover:bg-slate-50">Edit</button>
                            <button onClick={() => { setResetTarget(member); setEditing(null); setShowForm(false); setNewPassword(""); setError(""); setMessage(""); }} className="rounded border px-3 py-1.5 hover:bg-slate-50">Reset Password</button>
                            <button disabled={saving} onClick={() => void updateStaff(member, { is_active: !member.is_active })} className="rounded border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">
                              {member.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button disabled={saving} onClick={() => void deleteStaff(member)} className="rounded border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
