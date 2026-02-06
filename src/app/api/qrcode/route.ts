import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeDataURL, generateSnackUrl, generateExpoDevUrl } from "@/lib/qrcode";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId parameter" },
      { status: 400 }
    );
  }

  const { data: project, error } = await supabase
    .from("forge_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.repo_url) {
    return NextResponse.json(
      { error: "Project has no repository yet" },
      { status: 400 }
    );
  }

  try {
    const snackUrl = generateSnackUrl(project.repo_url, project.name);
    const mobileRepoUrl = generateExpoDevUrl(project.repo_url);
    
    const qrCodeDataUrl = await generateQRCodeDataURL(snackUrl, {
      width: 256,
      margin: 2,
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      snackUrl,
      mobileRepoUrl,
    });
  } catch (err) {
    console.error("QR code generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
