import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AdminSidebar from "../admin-sidebar";

export const dynamic = "force-dynamic";

export default async function GuestRequestsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl border bg-white p-8">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-2 text-slate-600">
            Your account does not have Admin permission.
          </p>
        </div>
      </main>
    );
  }

  const { data: requests, error } = await supabaseAdmin
    .from("guest_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The Biltmore
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Guest Requests</h1>
            <p className="mt-2 text-slate-600">
              Review guest service requests and their current status.
            </p>
          </header>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {error ? (
              <div className="p-6 text-red-700">
                Could not load guest requests: {error.message}
              </div>
            ) : !requests?.length ? (
              <div className="p-6 text-slate-600">
                No guest requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4 font-medium">Request</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => (
                      <tr
                        key={request.id ?? index}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4">
                          <div className="font-medium">
                            {request.reference_code ??
                              request.referenceCode ??
                              request.id ??
                              "Guest request"}
                          </div>
                          <div className="mt-1 max-w-sm whitespace-pre-wrap text-slate-600">
                            {request.description || "No additional details"}
                          </div>
                        </td>
                        <td className="p-4">
                          {request.category_code ??
                            request.category ??
                            "—"}
                        </td>
                        <td className="p-4">
                          {request.status ?? "New"}
                        </td>
                        <td className="whitespace-nowrap p-4 text-slate-600">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleString("en-GB")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="mt-4 text-xs text-slate-500">
            Showing up to 100 recent requests. This page currently displays
            requests only; status updates are not enabled yet.
          </p>
        </div>
      </main>
    </div>
  );
}
