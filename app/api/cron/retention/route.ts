import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Retention job is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attemptsBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const scansBefore = new Date();
  scansBefore.setUTCMonth(scansBefore.getUTCMonth() - 24);

  const attempts = await supabaseAdmin.from("activation_attempts").delete().lt("attempted_at", attemptsBefore);
  if (attempts.error) return NextResponse.json({ error: "Unable to clean security attempts." }, { status: 500 });
  const scans = await supabaseAdmin.from("scan_events").delete().lt("scanned_at", scansBefore.toISOString());
  if (scans.error) return NextResponse.json({ error: "Unable to clean scan records." }, { status: 500 });

  return NextResponse.json({ ok: true, completedAt: new Date().toISOString() });
}
