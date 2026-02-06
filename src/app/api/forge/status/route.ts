import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("forge_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { data: logs, error: logsError } = await supabase
      .from("forge_logs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (logsError) {
      console.error("Error fetching logs:", logsError);
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        repo_url: project.repo_url,
        preview_url: project.preview_url,
        error_message: project.error_message,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
      logs: logs || [],
    });
  } catch (error) {
    console.error("Error in GET /api/forge/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
