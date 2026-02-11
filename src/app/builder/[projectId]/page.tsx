"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RefinePanel from "./RefinePanel";
import {
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
    pending: { icon: Clock, label: "Draft", className: "bg-secondary text-muted-foreground" },
    forging: { icon: Cog, label: "Forging...", className: "bg-blue-500/20 text-blue-400" },
    ready: { icon: CheckCircle, label: "Ready", className: "bg-primary/20 text-primary" },
    error: { icon: AlertCircle, label: "Error", className: "bg-red-500/20 text-red-400" },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium ${className}`}>
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
    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
        return;
      }
      setUser(data.user);
      fetchStatus();
    };
    run();
  }, [fetchStatus, router]);

  useEffect(() => {
    if (project?.status === "forging") {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [project?.status, fetchStatus]);

  async function handleForge() {
    setForging(true);
    await fetch("/api/forge/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    setForging(false);
  }

  if (loading || !project) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  const isMobile = project.project_type === "mobile";

  return (
    <main className="min-h-screen gradient-bg flex flex-col">
      <div className="flex-1 flex">
        <div className="w-1/2 border-r border-border/50 p-6 flex flex-col gap-6">

          {/* Project Info */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>

          {/* Forge Logs */}
          <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <Terminal className="w-4 h-4" />
              <h3 className="text-sm font-medium">Forge Logs</h3>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={log.level === "error" ? "text-red-400" : "text-muted-foreground"}>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🔥 Refine Panel — THIS IS THE KEY */}
          <RefinePanel
            projectId={projectId}
            disabled={project.status === "forging"}
          />

        </div>

        {/* RIGHT SIDE PREVIEW (unchanged) */}
        <div className="w-1/2 p-6 flex items-center justify-center">
          {project.preview_url ? (
            <iframe src={project.preview_url} className="w-full h-full rounded-lg" />
          ) : (
            <div className="text-muted-foreground">No preview yet</div>
          )}
        </div>
      </div>
    </main>
  );
}
