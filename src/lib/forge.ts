import { createAdminClient } from "./supabase/admin";
import { createGitHubClient } from "./github";
import { generateMobileScaffold } from "./scaffolds/mobile";
import { generateWebScaffold } from "./scaffolds/web";
import { createVercelClient } from "./vercel";
import { generateApp, isOpenAIConfigured } from "./openai";

interface ForgeProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: "mobile" | "web";
  status: string;
  repo_url: string | null;
  preview_url: string | null;
  error_message: string | null;
}

async function addLog(
  projectId: string,
  message: string,
  level: "info" | "warn" | "error" = "info"
) {
  const supabase = createAdminClient();
  await supabase.from("forge_logs").insert({
    project_id: projectId,
    message,
    level,
  });
}

async function updateProjectStatus(
  projectId: string,
  status: string,
  updates: Partial<ForgeProject> = {}
) {
  const supabase = createAdminClient();
  await supabase
    .from("forge_projects")
    .update({ status, ...updates })
    .eq("id", projectId);
}

export async function runForgeProcess(projectId: string, userId: string) {
  const supabase = createAdminClient();

  try {
    await addLog(projectId, "Starting forge process...");
    const { data: project, error: projectError } = await supabase
      .from("forge_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found or access denied");
    }

    await updateProjectStatus(projectId, "forging");
    await addLog(projectId, "Project ownership verified");

    const projectType = project.project_type || "mobile";
    let allFiles: Record<string, string> = {};
    let generatedFeatures: string[] = [];

    const hasDescription = project.description && project.description.trim().length > 10;
    const useAI = isOpenAIConfigured() && hasDescription;

    if (useAI) {
      await addLog(projectId, "Using AI to generate professional app based on your description...");
      await addLog(projectId, `App type: ${projectType === "mobile" ? "Expo React Native" : "Next.js"}`);
      
      try {
        const aiResult = await generateApp({
          projectName: project.name,
          description: project.description!,
          appType: projectType,
        });
        
        allFiles = aiResult.files;
        generatedFeatures = aiResult.features;
        
        await addLog(projectId, `AI generated ${Object.keys(allFiles).length} files`);
        
        if (generatedFeatures.length > 0) {
          await addLog(projectId, `Features included: ${generatedFeatures.join(", ")}`);
        }
      } catch (aiError) {
        const errorMsg = aiError instanceof Error ? aiError.message : "Unknown AI error";
        await addLog(projectId, `AI generation failed: ${errorMsg}`, "warn");
        await addLog(projectId, "Falling back to template scaffold...", "info");
        
        if (projectType === "mobile") {
          allFiles = generateMobileScaffold({
            projectId,
            projectName: project.name,
          });
        } else {
          allFiles = generateWebScaffold({
            projectId,
            projectName: project.name,
          });
        }
      }
    } else {
      if (!hasDescription) {
        await addLog(projectId, "No detailed description provided - using template scaffold", "info");
      } else if (!isOpenAIConfigured()) {
        await addLog(projectId, "OpenAI not configured - using template scaffold", "info");
      }
      
      if (projectType === "mobile") {
        await addLog(projectId, "Generating mobile scaffold (Expo React Native)...");
        allFiles = generateMobileScaffold({
          projectId,
          projectName: project.name,
        });
      } else {
        await addLog(projectId, "Generating web scaffold (Next.js)...");
        allFiles = generateWebScaffold({
          projectId,
          projectName: project.name,
        });
      }
    }

    await addLog(projectId, "Saving generated files to database...");
    const fileInserts = Object.entries(allFiles).map(([path, content]) => ({
      project_id: projectId,
      file_path: path,
      content,
    }));

    const { error: filesError } = await supabase
      .from("generated_files")
      .insert(fileInserts);

    if (filesError) {
      throw new Error(`Failed to save generated files: ${filesError.message}`);
    }

    await addLog(
      projectId,
      `Saved ${Object.keys(allFiles).length} files to database`
    );

    await addLog(projectId, "Creating GitHub repository...");
    const github = createGitHubClient();
    const owner = github.getOwner();
    const repoName = `appforger-${projectId.slice(0, 8)}`;

    const repo = await github.createRepository({
      name: repoName,
      description: `AppForger generated app: ${project.name}`,
      private: false,
    });

    await addLog(projectId, `GitHub repository created: ${repo.html_url}`);

    await addLog(projectId, "Committing files to repository...");
    
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const commitFiles = Object.entries(allFiles).map(([path, content]) => ({
      path,
      content,
    }));

    const commitMessage = projectType === "mobile" 
      ? "Initial commit: AppForger generated Expo React Native app"
      : "Initial commit: AppForger generated Next.js web app";

    await github.commitFiles(
      owner,
      repoName,
      commitFiles,
      commitMessage
    );

    await addLog(projectId, "All files committed to GitHub");

    let previewUrl: string | null = null;

    if (projectType === "web") {
      const vercel = createVercelClient();

      if (vercel.isConfigured()) {
        await addLog(projectId, "Triggering Vercel deployment for web app...");
        
        try {
          const deployment = await vercel.deploy({
            repoUrl: repo.html_url,
            projectName: `${project.name}-web`,
            framework: "nextjs",
          });

          if (deployment) {
            previewUrl = deployment.previewUrl;
            await addLog(projectId, `Vercel deployment started: ${previewUrl}`);
            await addLog(projectId, `Deployment status: ${deployment.status}`);
          } else {
            await addLog(projectId, "Vercel deployment initiated - preview URL will be available soon", "info");
          }
        } catch (vercelError) {
          const errorMsg = vercelError instanceof Error ? vercelError.message : "Unknown error";
          await addLog(projectId, `Vercel deployment warning: ${errorMsg}`, "warn");
          await addLog(projectId, "You can manually connect your repo to Vercel at https://vercel.com/new", "info");
        }
      } else {
        await addLog(projectId, "Vercel not configured - skipping auto-deploy", "info");
        await addLog(projectId, "To enable auto-deploy: Set VERCEL_TOKEN in your environment", "info");
      }
    }

    await updateProjectStatus(projectId, "ready", {
      repo_url: repo.html_url,
      preview_url: previewUrl,
    });

    await addLog(projectId, "Forge complete! Repository is ready.");
    
    if (projectType === "web" && !previewUrl) {
      await addLog(
        projectId,
        "To deploy: Connect your repo to Vercel at https://vercel.com/new",
        "info"
      );
    }

    if (projectType === "mobile") {
      await addLog(projectId, "Mobile preview: Scan QR code to open in Expo Snack", "info");
    }

    return { success: true, repoUrl: repo.html_url, previewUrl };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    await addLog(projectId, `Forge failed: ${errorMessage}`, "error");
    await updateProjectStatus(projectId, "error", {
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}
