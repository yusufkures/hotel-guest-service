import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// SECURITY TODO: require staff session + requests.update permission before enabling this route.
const allowed = new Set(["new", "acknowledged", "assigned", "in_progress", "completed", "cancelled", "reopened"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // This endpoint is intentionally disabled until authentication/authorization is implemented.
  return NextResponse.json({ error: "Staff authentication and permission checks must be implemented before status updates are enabled." }, { status: 501 });
}
