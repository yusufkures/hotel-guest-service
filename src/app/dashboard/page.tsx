import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  new: "New", acknowledged: "Acknowledged", assigned: "Assigned",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled", reopened: "Reopened",
};

export default async function DashboardPage() {
  const { data: requests, error } = await supabaseAdmin
    .from("guest_requests")
    .select("id, reference_code, title, category_code, description, status, priority, created_at, rooms(room_number), departments:assigned_department_id(name)")
    .order("created_at", { ascending: false }).limit(100);

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Development only:</strong> This dashboard is not protected by staff login yet. Do not deploy it publicly until authentication and permission checks are implemented.
      </div>
      <header className="my-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold">Guest Requests</h1>
        <p className="mt-2 text-slate-600">Latest requests across all rooms.</p>
      </header>
      {error ? <p className="rounded-xl bg-red-50 p-4 text-red-800">Could not load requests: {error.message}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>{["Reference", "Room", "Request", "Details", "Department", "Status", "Priority", "Created"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(requests ?? []).map((r: any) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">{r.reference_code}</td>
                  <td className="p-3">{r.rooms?.room_number ?? "â€”"}</td>
                  <td className="p-3">{r.title}</td>
                  <td className="max-w-xs p-3">{r.description || "â€”"}</td>
                  <td className="p-3">{r.departments?.name ?? "Unassigned"}</td>
                  <td className="p-3">{statusLabels[r.status] ?? r.status}</td>
                  <td className="p-3">{r.priority}</td>
                  <td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Asia/Tbilisi" })}</td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No requests yet. Submit one from a room QR page to test the workflow.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

