/**
 * Utility functions for FileSystemModal
 */

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Get file extension for syntax highlighting
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "txt";
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Map file extension to language for syntax highlighting
 */
export function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",
    // Web
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    // Data
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    toml: "toml",
    // Config
    md: "markdown",
    mdx: "mdx",
    // Shell
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    // Other
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
  };
  return languageMap[ext] || "plaintext";
}
