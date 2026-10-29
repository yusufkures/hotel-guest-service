import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashQrToken } from "@/lib/qr-token";

const categoryMap: Record<
  string,
  { kind: "housekeeping" | "maintenance" | "general"; title: string }
> = {
  CLEAN_ROOM: { kind: "housekeeping", title: "Clean My Room" },
  DO_NOT_DISTURB: { kind: "housekeeping", title: "Do Not Disturb" },
  TV_ISSUE: { kind: "maintenance", title: "TV not working" },
  WIFI_ISSUE: { kind: "maintenance", title: "Wi-Fi / Internet issue" },
  AC_ISSUE: { kind: "maintenance", title: "Air conditioning issue" },
  ELECTRICAL_ISSUE: {
    kind: "maintenance",
    title: "Lighting / electrical issue",
  },
  PLUMBING_ISSUE: {
    kind: "maintenance",
    title: "Bathroom / plumbing issue",
  },
  OTHER_MAINTENANCE: {
    kind: "maintenance",
    title: "Other maintenance issue",
  },
  GENERAL_REQUEST: { kind: "general", title: "General request" },
  COMPLAINT: { kind: "general", title: "Complaint" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const categoryCode =
      typeof body.categoryCode === "string" ? body.categoryCode : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 1500)
        : "";

    if (token.length < 20 || token.length > 200) {
      return NextResponse.json(
        { error: "Invalid room QR code." },
        { status: 400 }
      );
    }

    const category = categoryMap[categoryCode];

    if (!category) {
      return NextResponse.json(
        { error: "Please select a valid service." },
        { status: 400 }
      );
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .eq("qr_token_hash", hashQrToken(token))
      .eq("is_active", true)
      .maybeSingle();

    if (roomError || !room) {
      return NextResponse.json(
        {
          error:
            "This room QR code is invalid or inactive. Please contact the Front Office.",
        },
        { status: 404 }
      );
    }

    const { data: operator, error: operatorError } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("code", "OP")
      .eq("is_active", true)
      .maybeSingle();

    if (operatorError || !operator) {
      console.error("Operator department not found", operatorError?.message);
      return NextResponse.json(
        {
          error:
            "The request service is temporarily unavailable. Please contact the Front Office.",
        },
        { status: 500 }
      );
    }

    const { data: row, error } = await supabaseAdmin
      .from("guest_requests")
      .insert({
        room_id: room.id,
        kind: category.kind,
        category_code: categoryCode,
        title: category.title,
        description: description || null,
        assigned_department_id: operator.id,
      })
      .select("reference_code")
      .single();

    if (error || !row) {
      console.error("Guest request insert failed", error?.message);
      return NextResponse.json(
        {
          error:
            "We could not submit your request. Please try again or contact the Front Office.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, referenceCode: row.reference_code },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}