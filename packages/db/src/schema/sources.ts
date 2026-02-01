import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Sources table - stores analyzed codebases and visual components
 */
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  
  // Phase 1 & 2: Origin & Storage
  type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull().default("github_repo"),
  originUrl: text("origin_url"), // The GitHub URL
  description: text("description"), // User-provided description of the codebase
  localPath: text("local_path"), // Where it's cloned locally
  
  // NEW: Input type tracking (github, screenshot, live_url)
  inputType: text("input_type", { enum: ["github", "screenshot", "live_url"] }).notNull().default("github"),
  
  // NEW: Visual capture data (for screenshot and live_url sources)
  visualData: text("visual_data", { mode: "json" }).$type<{
    // For screenshots
    screenshotBase64?: string;        // Primary image (first one)
    allScreenshots?: string[];        // All uploaded images (base64 array)
    screenshotUrl?: string;           // Optional URL reference
    
    // For live URLs
    capturedUrl?: string;
    capturedScreenshot?: string;      // Base64 of captured page
    capturedHtml?: string;            // HTML content if scraped
  } | null>(),
  
  // NEW: Vision analysis results (from Gemini/Claude)
  visionAnalysis: text("vision_analysis", { mode: "json" }).$type<{
    componentType: string;
    description: string;
    layout: {
      type: "flex" | "grid" | "absolute" | "block";
      direction?: string;
      alignment?: string;
      gap?: string;
    };
    colors: {
      primary: string;
      secondary?: string;
      background: string;
      text: string;
      accent?: string;
    };
    typography: {
      fontFamily: string;
      heading?: { size: string; weight: string };
      body?: { size: string; weight: string };
    };
    spacing: {
      padding?: string;
      margin?: string;
      gap?: string;
    };
    borders?: {
      width?: string;
      color?: string;
      radius?: string;
    };
    shadows?: string;
    interactions: Array<{
      trigger: "hover" | "click" | "focus";
      effect: string;
      timing?: string;
    }>;
    animations: Array<{
      element: string;
      type: string;
      duration: string;
    }>;
    responsive: {
      mobile?: string;
      tablet?: string;
      desktop?: string;
    };
    accessibility: {
      ariaLabels?: string[];
      keyboardNav?: string;
    };
    assets: Array<{
      type: "icon" | "image" | "illustration" | "logo";
      description: string;
      fallback?: string;
    }>;
  } | null>(),

  // Phase 2: Metadata
  githubMetadata: text("github_metadata", { mode: "json" }).$type<{
    owner: string;
    repo: string;
    defaultBranch: string | null;
    description: string | null;
    stars: number | null;
    forks: number | null;
  } | null>(),

  // Phase 2: Analysis Process
  analysisStatus: text("analysis_status").notNull().default("pending"),
  analysisPath: text("analysis_path"), // Path to the generated ANALYSIS.md file
  analysisMarkdown: text("analysis_markdown"), // Content of ANALYSIS.md
  analysisConfirmed: integer("analysis_confirmed", { mode: "boolean" }).default(false), // Whether user has reviewed and confirmed the analysis

  // Phase 3: Context (Populated by Analysis Agent)
  techStack: text("tech_stack", { mode: "json" }).$type<string[]>(),
  dependencies: text("dependencies", { mode: "json" }).$type<string[]>(),
  components: text("components", { mode: "json" }).$type<{
    name: string;
    description: string;
    filePath: string;
  }[]>(),

  url: text("url"), // Legacy/Optional
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
