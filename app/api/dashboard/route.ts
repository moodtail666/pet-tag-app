import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tagResult, petResult] = await Promise.all([
    supabaseAdmin.from("tags").select("*").eq("owner_user_id", user.id).order("tag_id"),
    supabaseAdmin.from("pets").select("*").eq("owner_user_id", user.id).order("updated_at", { ascending: false })
  ]);

  return NextResponse.json({ tags: tagResult.data || [], pets: petResult.data || [] });
}
