
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
    user?.email &&
      adminEmails.includes(user.email.toLowerCase())
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { data: rooms, error: roomsError } =
    await supabaseAdmin
      .from("rooms")
      .select("id, room_number, is_active")
      .eq("is_active", true)
      .order("room_number");

  if (roomsError) {
    console.error("Room status rooms error:", roomsError);

    return NextResponse.json(
      { error: "Could not load rooms." },
      { status: 500 }
    );
  }

  const { data: requests, error: requestsError } =
    await supabaseAdmin
      .from("guest_requests")
      .select(`
        id,
        room_id,
        category_code,
        title,
        status,
        created_at
      `)
      .in("category_code", [
        "DO_NOT_DISTURB",
        "CLEAN_ROOM",
      ])
      .in("status", ["new", "assigned", "in_progress"]);

  if (requestsError) {
    console.error(
      "Room status requests error:",
      requestsError
    );

    return NextResponse.json(
      { error: "Could not load room requests." },
      { status: 500 }
    );
  }

  const roomStatuses = (rooms ?? []).map((room) => {
    const roomRequests = (requests ?? []).filter(
      (request) => request.room_id === room.id
    );

    const hasDnd = roomRequests.some(
      (request) =>
        request.category_code === "DO_NOT_DISTURB"
    );

    const hasCmr = roomRequests.some(
      (request) =>
        request.category_code === "CLEAN_ROOM"
    );

    return {
      ...room,
      dnd: hasDnd,
      cmr: hasCmr,
      requests: roomRequests,
    };
  });

  return NextResponse.json({
    rooms: roomStatuses,
    totals: {
      rooms: roomStatuses.length,
      dnd: roomStatuses.filter((room) => room.dnd).length,
      cmr: roomStatuses.filter((room) => room.cmr).length,
    },
  });
}
