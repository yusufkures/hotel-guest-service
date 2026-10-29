
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (
      !user.email ||
      !adminEmails.includes(user.email.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Admin permission required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = typeof body.id === "string" ? body.id : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const imageUrl =
      typeof body.image_url === "string" ? body.image_url.trim() : "";
    const displayOrder = Number(body.display_order);
    const isActive = body.is_active;

    if (!id || !title) {
      return NextResponse.json(
        { error: "Service ID and title are required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0 ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid display order or active status." },
        { status: 400 }
      );
    }

    if (imageUrl && (!imageUrl.startsWith("https://") || imageUrl.length > 2048)) {
      return NextResponse.json(
        { error: "Image URL must be a valid HTTPS URL." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("guest_page_services")
      .update({
        title,
        description,
        image_url: imageUrl || null,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
