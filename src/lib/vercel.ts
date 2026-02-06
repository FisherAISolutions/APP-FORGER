const VERCEL_API_URL = "https://api.vercel.com";

export interface VercelDeploymentOptions {
  repoUrl: string;
  projectName: string;
  framework?: "nextjs" | "expo";
}

export interface VercelDeploymentResult {
  deploymentId: string;
  previewUrl: string;
  productionUrl?: string;
  status: "pending" | "building" | "ready" | "error";
}

export interface VercelProject {
  id: string;
  name: string;
  link?: {
    deployHooks?: Array<{
      id: string;
      name: string;
      url: string;
    }>;
  };
}

export class VercelClient {
  private token: string | undefined;
  private teamId: string | undefined;

  constructor() {
    this.token = process.env.VERCEL_TOKEN;
    this.teamId = process.env.VERCEL_TEAM_ID;
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const url = new URL(`${VERCEL_API_URL}${endpoint}`);
    if (this.teamId) {
      url.searchParams.set("teamId", this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} - ${error}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async createProject(
    name: string,
    gitRepository: { type: "github"; repo: string }
  ): Promise<VercelProject> {
    return this.request<VercelProject>("/v10/projects", {
      method: "POST",
      body: JSON.stringify({
        name,
        gitRepository,
        framework: "nextjs",
        rootDirectory: "web",
        buildCommand: "npm run build",
        installCommand: "npm install",
        outputDirectory: ".next",
      }),
    });
  }

  async createDeployment(
    name: string,
    gitSource: { type: "github"; repo: string; ref: string }
  ): Promise<{ id: string; url: string; readyState: string }> {
    return this.request("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name,
        gitSource: {
          type: gitSource.type,
          repo: gitSource.repo,
          ref: gitSource.ref,
        },
        target: "production",
      }),
    });
  }

  async getProject(projectId: string): Promise<VercelProject | null> {
    try {
      return await this.request<VercelProject>(`/v9/projects/${projectId}`);
    } catch {
      return null;
    }
  }

  async listDeployments(
    projectId: string
  ): Promise<Array<{ uid: string; url: string; state: string; createdAt: number }>> {
    const response = await this.request<{
      deployments: Array<{ uid: string; url: string; state: string; createdAt: number }>;
    }>(`/v6/deployments?projectId=${projectId}&limit=5`);
    return response.deployments;
  }

  async getDeployment(deploymentId: string): Promise<{
    id: string;
    url: string;
    readyState: string;
    state: string;
  } | null> {
    try {
      return await this.request(`/v13/deployments/${deploymentId}`);
    } catch {
      return null;
    }
  }

  async deploy(
    options: VercelDeploymentOptions
  ): Promise<VercelDeploymentResult | null> {
    if (!this.isConfigured()) {
      console.log("Vercel not configured - skipping deployment");
      return null;
    }

    try {
      const repoMatch = options.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        throw new Error("Invalid GitHub repository URL");
      }

      const [, owner, repo] = repoMatch;
      const repoPath = `${owner}/${repo.replace(".git", "")}`;

      const projectName = options.projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);

      let project: VercelProject;
      try {
        project = await this.createProject(projectName, {
          type: "github",
          repo: repoPath,
        });
      } catch (createError) {
        const existingProject = await this.getProject(projectName);
        if (existingProject) {
          project = existingProject;
        } else {
          throw createError;
        }
      }

      const deployment = await this.createDeployment(projectName, {
        type: "github",
        repo: repoPath,
        ref: "main",
      });

      return {
        deploymentId: deployment.id,
        previewUrl: `https://${deployment.url}`,
        status: this.mapDeploymentState(deployment.readyState),
      };
    } catch (error) {
      console.error("Vercel deployment error:", error);
      return null;
    }
  }

  async getDeploymentStatus(
    deploymentId: string
  ): Promise<VercelDeploymentResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const deployment = await this.getDeployment(deploymentId);
      if (!deployment) {
        return null;
      }

      return {
        deploymentId: deployment.id,
        previewUrl: `https://${deployment.url}`,
        status: this.mapDeploymentState(deployment.readyState || deployment.state),
      };
    } catch {
      return null;
    }
  }

  private mapDeploymentState(
    state: string
  ): "pending" | "building" | "ready" | "error" {
    switch (state.toUpperCase()) {
      case "READY":
        return "ready";
      case "BUILDING":
      case "INITIALIZING":
      case "QUEUED":
        return "building";
      case "ERROR":
      case "CANCELED":
        return "error";
      default:
        return "pending";
    }
  }
}

export function createVercelClient(): VercelClient {
  return new VercelClient();
}
