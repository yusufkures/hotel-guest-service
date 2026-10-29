
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AdminSidebar from "./admin-sidebar";
import ServiceEditor from "./service-editor";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (
    !user.email ||
    !adminEmails.includes(user.email.toLowerCase())
  ) {
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

  const { data: services, error } = await supabaseAdmin
    .from("guest_page_services")
    .select("id, title, description, image_url, display_order, is_active")
    .order("display_order", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <AdminSidebar />

      <main className="min-w-0 flex-1 p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The Biltmore
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Manage your hotel's guest services.
            </p>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="mb-5 text-xl font-semibold">Guest Homepage Services</h2>

            {error ? (
              <p className="rounded-xl bg-red-50 p-4 text-red-800">
                Could not load services: {error.message}
              </p>
            ) : (
              <ServiceEditor services={services ?? []} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

