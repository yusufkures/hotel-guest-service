
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(user.email.toLowerCase()) ? user : null;
}

async function getTargetUser(context: RouteContext) {
  const { userId } = await context.params;

  if (
    !userId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    )
  ) {
    return null;
  }

  return userId;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = await getTargetUser(context);

    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot change your own account through this screen." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.displayName !== undefined) {
      const displayName = String(body.displayName).trim();

      if (!displayName || displayName.length > 100) {
        return NextResponse.json(
          { error: "Name must be between 1 and 100 characters." },
          { status: 400 }
        );
      }

      updates.display_name = displayName;
    }

    if (body.departmentCode !== undefined) {
      const departmentCode = String(body.departmentCode).trim();

      const { data: department, error } = await supabaseAdmin
        .from("departments")
        .select("id")
        .eq("code", departmentCode)
        .eq("is_active", true)
        .single();

      if (error || !department) {
        return NextResponse.json(
          { error: "Selected department was not found or is inactive." },
          { status: 400 }
        );
      }

      updates.department_id = department.id;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "Invalid account status." },
          { status: 400 }
        );
      }

      updates.is_active = body.is_active;
    }

    if (body.roleName !== undefined) {
      const roleName = String(body.roleName).trim();

      if (roleName === "Super Administrator") {
        return NextResponse.json(
          { error: "Assigning Super Administrator through this screen is not allowed." },
          { status: 403 }
        );
      }

      const { data: role, error: roleError } = await supabaseAdmin
        .from("roles")
        .select("id, name")
        .eq("name", roleName)
        .single();

      if (roleError || !role) {
        return NextResponse.json(
          { error: "Selected role was not found." },
          { status: 400 }
        );
      }

      const { error: deleteRoleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteRoleError) {
        console.error("Remove old role error:", deleteRoleError);
        return NextResponse.json(
          { error: "Could not update staff role." },
          { status: 500 }
        );
      }

      const { error: insertRoleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role_id: role.id });

      if (insertRoleError) {
        console.error("Assign new role error:", insertRoleError);
        return NextResponse.json(
          { error: "Could not assign the new role." },
          { status: 500 }
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("staff_profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Update staff profile error:", error);
        return NextResponse.json(
          { error: "Could not update staff profile." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: "Staff member updated successfully." });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Could not update staff member." },
      { status: 400 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = await getTargetUser(context);

    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot reset your own password through this screen." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const password = String(body.password ?? "");

    if (password.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error("Reset staff password error:", error);
      return NextResponse.json(
        { error: "Could not reset the password." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Could not reset password." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = await getTargetUser(context);

    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Find staff profile error:", profileError);
      return NextResponse.json(
        { error: "Could not verify staff profile." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Staff profile not found." },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Delete staff account error:", error);
      return NextResponse.json(
        { error: "Could not delete staff account." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Staff account deleted successfully." });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Could not delete staff account." },
      { status: 400 }
    );
  }
}
