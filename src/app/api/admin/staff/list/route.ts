
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(
    user?.email && adminEmails.includes(user.email.toLowerCase())
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { data: staff, error } = await supabaseAdmin
    .from("staff_profiles")
    .select(`
      user_id,
      display_name,
      is_active,
      departments:department_id (name, code)
    `)
    .order("display_name");

  if (error) {
    console.error("Load staff error:", error);
    return NextResponse.json(
      { error: "Could not load staff profiles." },
      { status: 500 }
    );
  }

  const { data: assignments, error: roleError } =
    await supabaseAdmin
      .from("user_roles")
      .select("user_id, roles:role_id (name)");

  if (roleError) {
    console.error("Load staff roles error:", roleError);
    return NextResponse.json(
      { error: "Could not load staff roles." },
      { status: 500 }
    );
  }

  const roleMap = new Map<string, string[]>();

  for (const assignment of assignments ?? []) {
    const item = assignment as {
      user_id: string;
      roles: { name: string } | { name: string }[] | null;
    };

    const roleData = Array.isArray(item.roles)
      ? item.roles
      : item.roles
        ? [item.roles]
        : [];

    roleMap.set(item.user_id, [
      ...(roleMap.get(item.user_id) ?? []),
      ...roleData.map((role) => role.name),
    ]);
  }

  return NextResponse.json({
    staff: (staff ?? []).map((member) => ({
      ...member,
      roleNames: roleMap.get(member.user_id) ?? [],
    })),
  });
}
