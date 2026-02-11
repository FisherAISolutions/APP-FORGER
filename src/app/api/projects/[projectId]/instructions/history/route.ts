import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_instructions")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ instructions: data });
}
