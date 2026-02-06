import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runForgeProcess } from "@/lib/forge";

export async function POST(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    if (!githubToken) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN environment variable is not configured." },
        { status: 503 }
      );
    }

    if (!process.env.GITHUB_OWNER) {
      return NextResponse.json(
        { error: "GITHUB_OWNER environment variable is not configured." },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
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

    if (project.status === "forging") {
      return NextResponse.json(
        { error: "Project is already being forged" },
        { status: 409 }
      );
    }

    runForgeProcess(projectId, user.id).catch((err) => {
      console.error("Forge process error:", err);
    });

    return NextResponse.json({
      message: "Forge process started",
      projectId,
    });
  } catch (error) {
    console.error("Error in POST /api/forge/start:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
