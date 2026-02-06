"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hammer, ArrowLeft, Send, ExternalLink, Github, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ForgeLog {
  id: string;
  message: string;
  level: string;
  created_at: string;
}

export default function WebBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isForging, setIsForging] = useState(false);
  const [logs, setLogs] = useState<ForgeLog[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (!currentProjectId) return;

    const pollStatus = setInterval(async () => {
      try {
        const res = await fetch(`/api/forge/status?projectId=${currentProjectId}`);
        const data = await res.json();
        
        if (data.logs) {
          setLogs(data.logs);
        }
        
        if (data.project?.status === "ready") {
          setIsForging(false);
          if (data.project.preview_url) {
            setPreviewUrl(data.project.preview_url);
          }
          if (data.project.repo_url) {
            setRepoUrl(data.project.repo_url);
          }
          clearInterval(pollStatus);
        } else if (data.project?.status === "error") {
          setIsForging(false);
          clearInterval(pollStatus);
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 1000);

    return () => clearInterval(pollStatus);
  }, [currentProjectId]);

  async function handleStartForge() {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (!user) {
      router.push("/signin");
      return;
    }

    setIsForging(true);
    setLogs([]);
    setPreviewUrl(null);
    setRepoUrl(null);

    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: prompt,
          project_type: "web",
        }),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.error || "Failed to create project");
      }

      const { project } = await createRes.json();
      setCurrentProjectId(project.id);

      const forgeRes = await fetch("/api/forge/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!forgeRes.ok) {
        const error = await forgeRes.json();
        throw new Error(error.error || "Failed to start forge");
      }
    } catch (error) {
      console.error("Forge error:", error);
      setIsForging(false);
      alert(error instanceof Error ? error.message : "Failed to start forge");
    }
  }

  return (
    <main className="min-h-screen gradient-bg flex flex-col">
      <nav className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold">Web Builder</span>
            </div>
          </div>
          {user ? (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          ) : (
            <Link href="/signin" className="text-primary hover:underline" data-testid="link-signin">
              Sign in to build
            </Link>
          )}
        </div>
      </nav>

      <div className="flex-1 flex">
        <div className="w-1/2 border-r border-border/50 p-6 flex flex-col">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary prompt-input"
              data-testid="input-project-name"
            />
          </div>

          <div className="mb-6 flex-1">
            <label className="block text-sm font-medium mb-2">Describe your app in detail</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Build me a habit tracking app with daily goals, streak counters, progress charts, a beautiful dark theme, categories for different habit types (health, productivity, learning), reminders, and a settings page. Include onboarding for new users."
              className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary prompt-input resize-none"
              data-testid="input-prompt"
            />
            <p className="text-xs text-muted-foreground mt-2">
              The more detail you provide, the better. Describe screens, features, colors, and functionality you want.
            </p>
          </div>

          <button
            onClick={handleStartForge}
            disabled={isForging || !projectName.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="button-forge"
          >
            {isForging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Forging...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Start Forging
              </>
            )}
          </button>

          {logs.length > 0 && (
            <div className="mt-6 bg-card border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Forge Logs</h3>
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`${
                      log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                        ? "text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {repoUrl && (
            <div className="mt-4 flex gap-2">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-2 px-4 rounded-lg hover:bg-secondary/80"
                data-testid="link-github"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90"
                  data-testid="link-preview"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Preview
                </a>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2 p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl browser-frame">
            <div className="browser-toolbar">
              <div className="browser-dot bg-red-500"></div>
              <div className="browser-dot bg-yellow-500"></div>
              <div className="browser-dot bg-green-500"></div>
              <div className="flex-1 ml-4">
                <div className="bg-secondary/50 rounded px-3 py-1 text-xs text-muted-foreground">
                  {previewUrl || "https://your-app.vercel.app"}
                </div>
              </div>
            </div>
            <div className="aspect-video bg-secondary/20 flex items-center justify-center">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="App Preview"
                />
              ) : isForging ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Building your web app...</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Hammer className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Web App Preview</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Your live preview will appear here after forging. The app auto-deploys to Vercel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
