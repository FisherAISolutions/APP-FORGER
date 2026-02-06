const GITHUB_API_URL = "https://api.github.com";

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
}

interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
}

interface CommitFile {
  path: string;
  content: string;
}

export class GitHubClient {
  private token: string;
  private owner: string;

  constructor(token: string, owner: string) {
    this.token = token;
    this.owner = owner;
  }

  getOwner(): string {
    return this.owner;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async createRepository(options: CreateRepoOptions): Promise<GitHubRepoResponse> {
    return this.request<GitHubRepoResponse>("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: options.name,
        description: options.description || "",
        private: options.private ?? false,
        auto_init: true,
      }),
    });
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const response = await this.request<{ default_branch: string }>(
      `/repos/${owner}/${repo}`
    );
    return response.default_branch;
  }

  async getLatestCommitSha(
    owner: string,
    repo: string,
    branch: string
  ): Promise<string> {
    const response = await this.request<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`
    );
    return response.object.sha;
  }

  async createBlob(
    owner: string,
    repo: string,
    content: string
  ): Promise<string> {
    const response = await this.request<{ sha: string }>(
      `/repos/${owner}/${repo}/git/blobs`,
      {
        method: "POST",
        body: JSON.stringify({
          content: Buffer.from(content).toString("base64"),
          encoding: "base64",
        }),
      }
    );
    return response.sha;
  }

  async createTree(
    owner: string,
    repo: string,
    baseTreeSha: string,
    files: { path: string; sha: string }[]
  ): Promise<string> {
    const response = await this.request<{ sha: string }>(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: files.map((file) => ({
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: file.sha,
          })),
        }),
      }
    );
    return response.sha;
  }

  async createCommit(
    owner: string,
    repo: string,
    message: string,
    treeSha: string,
    parentSha: string
  ): Promise<string> {
    const response = await this.request<{ sha: string }>(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({
          message,
          tree: treeSha,
          parents: [parentSha],
        }),
      }
    );
    return response.sha;
  }

  async updateRef(
    owner: string,
    repo: string,
    branch: string,
    commitSha: string
  ): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      body: JSON.stringify({
        sha: commitSha,
        force: false,
      }),
    });
  }

  async commitFiles(
    owner: string,
    repo: string,
    files: CommitFile[],
    message: string
  ): Promise<string> {
    const branch = await this.getDefaultBranch(owner, repo);
    const latestCommitSha = await this.getLatestCommitSha(owner, repo, branch);

    const blobs = await Promise.all(
      files.map(async (file) => ({
        path: file.path,
        sha: await this.createBlob(owner, repo, file.content),
      }))
    );

    const treeSha = await this.createTree(owner, repo, latestCommitSha, blobs);
    const commitSha = await this.createCommit(
      owner,
      repo,
      message,
      treeSha,
      latestCommitSha
    );

    await this.updateRef(owner, repo, branch, commitSha);

    return commitSha;
  }

  async getAuthenticatedUser(): Promise<{ login: string }> {
    return this.request<{ login: string }>("/user");
  }
}

export function createGitHubClient(): GitHubClient {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }
  const owner = process.env.GITHUB_OWNER;
  if (!owner) {
    throw new Error("GITHUB_OWNER environment variable is not set");
  }
  return new GitHubClient(token, owner);
}
