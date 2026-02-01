
import { Octokit } from "@octokit/rest";

// Optional: Use a personal access token if available, otherwise limited rate
const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubFile {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export class GitHubService {
  /**
   * Parse owner, repo, and branch (optional) from a GitHub URL
   */
  static parseUrl(url: string) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      const owner = parts[0];
      const repo = parts[1];
      // Basic branch detection (heuristic)
      const branch = parts.length > 3 && parts[2] === "tree" ? parts[3] : "main";
      return { owner, repo, branch };
    } catch (e) {
      throw new Error("Invalid GitHub URL");
    }
  }

  /**
   * Fetch entire repo tree structure (recursive)
   * This is ONE API call for up to 100k files
   */
  static async getRepoTree(owner: string, repo: string, branch = "main"): Promise<GitHubFile[]> {
    try {
      // First get the SHA of the branch to be sure (or just use branch name)
      const { data } = await github.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "1",
      });

      return data.tree.map((f: any) => ({
        path: f.path,
        type: f.type,
        sha: f.sha,
        size: f.size,
        url: f.url
      }));
    } catch (error) {
      // Fallback: maybe branch is 'master'?
      if (branch === "main") {
        try {
          return await this.getRepoTree(owner, repo, "master");
        } catch { /* ignore */ }
      }
      console.error("Failed to fetch repo tree:", error);
      throw new Error("Could not fetch repository structure. Is the repo public?");
    }
  }

  /**
   * Fetch file content using jsDelivr CDN (Fast, No Rate Limit)
   * Fallback to GitHub API if CDN fails (e.g. private repo or cache miss)
   */
  static async getFileContent(owner: string, repo: string, path: string, branch = "main"): Promise<string> {
    // 1. Try CDN first (Super fast)
    try {
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
      const res = await fetch(cdnUrl);
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // CDN failed, continue to API
    }

    // 2. Fallback to GitHub API
    try {
      const { data } = await github.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (!Array.isArray(data) && "content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
    } catch (e) {
      console.error(`Failed to fetch content for ${path}:`, e);
    }
    
    return "";
  }

  /**
   * Filter tree for relevant files (in-memory)
   */
  static filterRelevantFiles(files: GitHubFile[]) {
    return {
        // Source code (limit to top 200 to avoid context overflow)
        components: files.filter(f => 
            f.type === "blob" && 
            /\.(tsx|jsx|vue|svelte)$/.test(f.path) &&
            !f.path.includes("node_modules") &&
            !f.path.includes("dist") &&
            !f.path.includes("test")
        ).slice(0, 50), // Only analyze top 50 components for speed/context

        // Configs
        configs: files.filter(f => 
            f.path === "package.json" || 
            f.path === "tsconfig.json" || 
            f.path.includes("tailwind.config")
        ),
        
        // Context
        docs: files.filter(f => f.path.toLowerCase() === "readme.md")
    };
  }
}
