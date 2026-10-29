
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

  const [
    { data: staff, error: staffError },
    { data: assignments, error: roleError },
    { data: departments, error: departmentError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("staff_profiles")
      .select(`
        user_id,
        display_name,
        is_active,
        departments:department_id (name, code)
      `)
      .order("display_name"),

    supabaseAdmin
      .from("user_roles")
      .select("user_id, roles:role_id (name)"),

    supabaseAdmin
      .from("departments")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name"),

    supabaseAdmin
      .from("roles")
      .select("id, name")
      .order("name"),
  ]);

  if (staffError || roleError || departmentError || rolesError) {
    console.error("Load staff admin data error:", {
      staffError,
      roleError,
      departmentError,
      rolesError,
    });

    return NextResponse.json(
      { error: "Could not load staff, departments, or roles." },
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
    departments: departments ?? [],
    roles: roles ?? [],
  });
}
