"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Hammer,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Cog,
  Send,
  Terminal,
  Smartphone,
  Globe,
  Github,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "forging" | "ready" | "error";
  project_type: "mobile" | "web";
  repo_url: string | null;
  preview_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Log {
  id: string;
  message: string;
  level: "info" | "warn" | "error";
  created_at: string;
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const config = {
    pending: {
      icon: Clock,
      label: "Draft",
      className: "bg-secondary text-muted-foreground",
    },
    forging: {
      icon: Cog,
      label: "Forging...",
      className: "bg-blue-500/20 text-blue-400",
    },
    ready: {
      icon: CheckCircle,
      label: "Ready",
      className: "bg-primary/20 text-primary",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      className: "bg-red-500/20 text-red-400",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium ${className}`}
      data-testid="status-badge"
    >
      <Icon className={`w-4 h-4 ${status === "forging" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [forging, setForging] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [snackUrl, setSnackUrl] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/forge/status?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setLogs(data.logs);
        
        if (data.project?.repo_url && data.project?.project_type === "mobile") {
          const repoName = data.project.repo_url.split("/").pop();
          const owner = data.project.repo_url.split("/").slice(-2, -1)[0];
          setSnackUrl(`https://snack.expo.dev/@${owner}/${repoName}`);
        }
      } else if (res.status === 401) {
        router.push("/signin");
      } else if (res.status === 404) {
        router.push("/dashboard");
      }
    } catch {
      console.error("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/signin");
        return;
      }
      
      setUser(user);
      
      if (projectId) {
        fetchStatus();
      }
    }
    checkAuthAndFetch();
  }, [projectId, fetchStatus, router]);

  useEffect(() => {
    if (project?.status === "forging") {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [project?.status, fetchStatus]);

  async function handleForge() {
    setForging(true);

    try {
      const res = await fetch("/api/forge/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        fetchStatus();
      } else {
        const data = await res.json();
        console.error("Forge error:", data.error);
      }
    } catch {
      console.error("Failed to start forge");
    } finally {
      setForging(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isMobile = project.project_type === "mobile";

  return (
    <main className="min-h-screen gradient-bg flex flex-col">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="link-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMobile ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
                {isMobile ? (
                  <Smartphone className="w-5 h-5 text-blue-400" />
                ) : (
                  <Globe className="w-5 h-5 text-primary" />
                )}
              </div>
              <span className="text-xl font-bold" data-testid="text-project-name">{project.name}</span>
              <StatusBadge status={project.status} />
            </div>
          </div>
          {user && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
        </div>
      </nav>

      <div className="flex-1 flex">
        <div className="w-1/2 border-r border-border/50 p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Project Details</h2>
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium">{isMobile ? "Mobile App (Expo React Native)" : "Web App (Next.js)"}</span>
              </p>
              {project.description && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Description:</span>{" "}
                  <span>{project.description}</span>
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">Created:</span>{" "}
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {project.error_message && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
              <strong>Error:</strong> {project.error_message}
            </div>
          )}

          {(project.status === "pending" || project.status === "error") && (
            <button
              onClick={handleForge}
              disabled={forging}
              className={`w-full py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6 ${
                isMobile ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'
              }`}
              data-testid="button-forge"
            >
              {forging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Forge...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Start Forging
                </>
              )}
            </button>
          )}

          {project.status === "forging" && (
            <div className="mb-6 flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 py-3 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Forging in progress...</span>
            </div>
          )}

          <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Forge Logs</h3>
            </div>
            <div
              className="flex-1 p-4 font-mono text-sm overflow-auto max-h-64"
              data-testid="logs-panel"
            >
              {logs.length === 0 ? (
                <p className="text-muted-foreground">
                  No logs yet. Click &quot;Start Forging&quot; to begin.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`mb-1 ${
                      log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                        ? "text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {project.repo_url && (
            <div className="mt-4 flex gap-2">
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-2 px-4 rounded-lg hover:bg-secondary/80"
                data-testid="link-repo"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              {!isMobile && project.preview_url && (
                <a
                  href={project.preview_url}
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
          {isMobile ? (
            <div className="phone-frame" style={{ width: "320px" }}>
              <div className="phone-screen" style={{ height: "640px" }}>
                {project.status === "ready" && snackUrl ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="bg-white p-4 rounded-xl mb-6">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(snackUrl)}`}
                        alt="Expo Snack QR Code"
                        className="w-48 h-48"
                        data-testid="img-qrcode"
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
                      data-testid="link-snack"
                    >
                      Or open in Expo Snack
                    </a>
                  </div>
                ) : project.status === "forging" ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                    <p className="text-muted-foreground" data-testid="text-building">Building your app...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6">
                      <Smartphone className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Mobile Preview</h3>
                    <p className="text-muted-foreground text-sm" data-testid="text-preview-info">
                      {project.status === "pending"
                        ? "Click 'Start Forging' to build your app"
                        : "Your QR code will appear here. Scan with Expo Go to preview."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl browser-frame">
              <div className="browser-toolbar">
                <div className="browser-dot bg-red-500"></div>
                <div className="browser-dot bg-yellow-500"></div>
                <div className="browser-dot bg-green-500"></div>
                <div className="flex-1 ml-4">
                  <div className="bg-secondary/50 rounded px-3 py-1 text-xs text-muted-foreground" data-testid="text-preview-url">
                    {project.preview_url || "https://your-app.vercel.app"}
                  </div>
                </div>
              </div>
              <div className="aspect-video bg-secondary/20 flex items-center justify-center">
                {project.preview_url ? (
                  <iframe
                    src={project.preview_url}
                    className="w-full h-full border-0"
                    title="App Preview"
                    data-testid="iframe-preview"
                  />
                ) : project.status === "forging" ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground" data-testid="text-building">Building your web app...</p>
                  </div>
                ) : project.status === "ready" ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Build Complete!</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mb-4">
                      Deploy your app to Vercel to get a live preview URL.
                    </p>
                    <a
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Deploy to Vercel
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Web App Preview</h3>
                    <p className="text-muted-foreground text-sm max-w-sm" data-testid="text-preview-info">
                      {project.status === "pending"
                        ? "Click 'Start Forging' to build your app"
                        : "Your live preview will appear here after deployment."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
