"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hammer, ArrowLeft, Send, Github, Loader2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ForgeLog {
  id: string;
  message: string;
  level: string;
  created_at: string;
}

export default function MobileBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isForging, setIsForging] = useState(false);
  const [logs, setLogs] = useState<ForgeLog[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [snackUrl, setSnackUrl] = useState<string | null>(null);
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
          if (data.project.repo_url) {
            setRepoUrl(data.project.repo_url);
            const repoName = data.project.repo_url.split("/").pop();
            const owner = data.project.repo_url.split("/").slice(-2, -1)[0];
            setSnackUrl(`https://snack.expo.dev/@${owner}/${repoName}`);
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
    setRepoUrl(null);
    setSnackUrl(null);

    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: prompt,
          project_type: "mobile",
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
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold">Mobile Builder</span>
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
              placeholder="My Mobile App"
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary prompt-input"
              data-testid="input-project-name"
            />
          </div>

          <div className="mb-6 flex-1">
            <label className="block text-sm font-medium mb-2">Describe your app in detail</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Build me a fitness tracking app with workout logging, exercise library with animations, progress graphs, personal records, a home screen dashboard, profile settings, and dark/light theme support. Include a beautiful onboarding flow."
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
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="mt-4">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-secondary text-foreground py-2 px-4 rounded-lg hover:bg-secondary/80"
                data-testid="link-github"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          )}
        </div>

        <div className="w-1/2 p-6 flex items-center justify-center">
          <div className="phone-frame" style={{ width: "320px" }}>
            <div className="phone-screen" style={{ height: "640px" }}>
              {snackUrl ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="bg-white p-4 rounded-xl mb-6">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(snackUrl)}`}
                      alt="Expo Snack QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Scan to Preview</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Open Expo Go on your phone and scan this QR code
                  </p>
                  <a
                    href={snackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    Or open in Expo Snack
                  </a>
                </div>
              ) : isForging ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                  <p className="text-muted-foreground">Building your app...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6">
                    <Smartphone className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mobile Preview</h3>
                  <p className="text-muted-foreground text-sm">
                    Your QR code will appear here after forging. Scan with Expo Go to preview.
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
