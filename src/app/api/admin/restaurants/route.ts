
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required.",
    };
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return {
      authorized: false,
      status: 403,
      error: "Administrator access required.",
    };
  }

  return { authorized: true, status: 200, error: "" };
}

export async function GET() {
  try {
    const access = await checkAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load restaurants:", error);
      return NextResponse.json(
        { error: "Unable to load restaurants." },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurants: data ?? [] });
  } catch (error) {
    console.error("Restaurant GET error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await checkAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";
    const coverImageUrl =
      typeof body.cover_image_url === "string"
        ? body.cover_image_url.trim()
        : "";

    if (!name || name.length > 150) {
      return NextResponse.json(
        { error: "Restaurant name is required and must not exceed 150 characters." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .insert({
        name,
        description: description || null,
        cover_image_url: coverImageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create restaurant:", error);
      return NextResponse.json(
        { error: "Unable to create the restaurant." },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurant: data }, { status: 201 });
  } catch (error) {
    console.error("Restaurant POST error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await checkAdmin();

    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to delete restaurant:", error);
      return NextResponse.json(
        {
          error:
            "Unable to delete the restaurant. It may still have associated menu categories or items.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Restaurant not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restaurant DELETE error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}

