"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hammer,
  Plus,
  Loader2,
  LogOut,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Cog,
  Smartphone,
  Globe,
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
      label: "Forging",
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProjects();
      } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        if (!session) {
          router.push("/signin");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else if (res.status === 401) {
        router.push("/signin");
      }
    } catch {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen gradient-bg">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">AppForger</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-muted-foreground">{user.email}</span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-signout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your AppForger Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and build your applications
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/builder/mobile"
            className="bg-card border border-border rounded-xl p-6 card-hover group"
            data-testid="link-new-mobile"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">New Mobile App</h3>
                <p className="text-sm text-muted-foreground">Expo React Native</p>
              </div>
              <Plus className="w-6 h-6 text-muted-foreground ml-auto" />
            </div>
          </Link>

          <Link
            href="/builder/web"
            className="bg-card border border-border rounded-xl p-6 card-hover group"
            data-testid="link-new-web"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold group-hover:text-green-400 transition-colors">New Web App</h3>
                <p className="text-sm text-muted-foreground">Next.js + Vercel</p>
              </div>
              <Plus className="w-6 h-6 text-muted-foreground ml-auto" />
            </div>
          </Link>
        </div>

        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>

        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Hammer className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-4">
              Choose an app type above to start forging
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/builder/${project.id}`}
                className="bg-card border border-border rounded-xl overflow-hidden card-hover"
                data-testid={`project-card-${project.id}`}
              >
                <div className="aspect-video bg-secondary/30 flex items-center justify-center">
                  {project.preview_url ? (
                    <span className="text-muted-foreground text-sm">Preview available</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Preview coming soon</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {project.project_type === "web" ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Smartphone className="w-3 h-3" />
                    )}
                    <span>{project.project_type === "web" ? "Web app" : "Mobile app"}</span>
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
