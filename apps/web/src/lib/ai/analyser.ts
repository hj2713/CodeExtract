import { db, sources, eq } from "@my-better-t-app/db";
import { generateObject, generateText } from "ai";
import { getDefaultModel } from "./model";
import path from "path";
import { z } from "zod";
import { GitHubService } from "../github/service";

// Schema for structured extraction
const analysisSchema = z.object({
  techStack: z.array(z.string()).describe("List of main technologies used (e.g. Next.js, Tailwind, Drizzle)"),
  dependencies: z.array(z.string()).describe("List of key dependencies found in package.json"),
  components: z.array(z.object({
    name: z.string(),
    description: z.string(),
    filePath: z.string(),
  })).describe("List of reusable components found in the codebase"),
});

export async function analyzeSource(
  sourceId: string, 
  targetComponent?: string
): Promise<{ success: boolean; error?: string; componentFound?: boolean }> {
  try {
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, sourceId),
    });

    if (!source) {
      return { success: false, error: "Source not found" };
    }

    if (!source.originUrl) {
        return { success: false, error: "Source has no GitHub URL" };
    }

    // Update status to fetching tree
    await db.update(sources).set({ analysisStatus: "fetching_tree" }).where(eq(sources.id, sourceId));

    // 1. Fetch Repository Structure
    const { owner, repo, branch } = GitHubService.parseUrl(source.originUrl);
    const tree = await GitHubService.getRepoTree(owner, repo, branch);

    // Update status to analyzing scanning
    await db.update(sources).set({ analysisStatus: "analyzing:scanning" }).where(eq(sources.id, sourceId));

    // 2. Filter Files
    const relevant = GitHubService.filterRelevantFiles(tree);

    // 2.5 Quick Save Discovered Components (Progressive UX)
    const discoveredComponents = relevant.components.map(f => ({
      name: path.basename(f.path, path.extname(f.path)),
      description: "Discovered pending analysis...",
      filePath: f.path
    }));

    await db.update(sources).set({ 
      analysisStatus: "analyzing:scanning",
      // @ts-ignore
      components: discoveredComponents
    }).where(eq(sources.id, sourceId));

    // 3. Fetch Content (In-Memory)
    await db.update(sources).set({ analysisStatus: "analyzing:context" }).where(eq(sources.id, sourceId));

    // Fetch package.json
    let packageJsonContent = "{}";
    const packageJsonFile = relevant.configs.find(f => f.path === "package.json");
    if (packageJsonFile) {
      packageJsonContent = await GitHubService.getFileContent(owner, repo, packageJsonFile.path, branch);
    }

    // Fetch README
    let readmeContent = "";
    if (relevant.docs.length > 0) {
      readmeContent = await GitHubService.getFileContent(owner, repo, relevant.docs[0].path, branch);
    }

    // Batch fetch components (limit 10 for context window safety)
    const componentFiles = relevant.components.slice(0, 10);
    const componentContents = await Promise.all(
      componentFiles.map(f => GitHubService.getFileContent(owner, repo, f.path, branch).then(c => `=== ${f.path} ===\n${c}\n`))
    );

    // Build Context
    const context = `
=== Project Structure (Top 500 files) ===
${tree.slice(0, 500).map(f => f.path).join("\n")}

=== package.json ===
${packageJsonContent}

=== README.md ===
${readmeContent.slice(0, 3000)}

=== Key Components (Content Sample) ===
${componentContents.join("\n")}
`;

    // 4. Generate Analysis & Metadata (Parallel for speed)
    await db.update(sources).set({ analysisStatus: "analyzing:report" }).where(eq(sources.id, sourceId));

    // Build dynamic prompts based on whether user specified a target component
    const analysisPrompt = targetComponent 
      ? `Analyze this codebase and specifically search for a component named "${targetComponent}".
      
      Focus on:
      - Finding if "${targetComponent}" exists in the codebase
      - Understanding its purpose and functionality
      - Identifying its location and dependencies
      - Describing how it works
      
      Output a detailed analysis in Markdown format including:
      - Whether "${targetComponent}" was found (YES/NO at the top)
      - Its file location if found
      - Description of what it does
      - Any related components or dependencies
      - Tech stack used
      
      If "${targetComponent}" is NOT found, clearly state this and suggest similar components that exist.
      
      Context:
      ${context}
      `
      : `Analyze this codebase based on its file structure and configuration files.
      
      Output a 'ANALYSIS.md' formatted report including:
      - Project Overview
      - Tech Stack & Key Libraries
      - Architecture & Folder Structure
      - Component Library Overview
      - Key Features
      
      Context:
      ${context}
      `;

    const extractionPrompt = targetComponent
      ? `Extract metadata from this codebase, with SPECIAL FOCUS on finding "${targetComponent}".
      
      PRIMARY GOAL: Determine if "${targetComponent}" exists in this codebase.
      
      If "${targetComponent}" is found:
      - Include it as the FIRST item in the components array
      - Provide detailed description
      - Include exact file path
      
      Also extract:
      - Tech stack
      - Key dependencies  
      - Other related components (limit to 5)
      
      Context:
      ${context}
      `
      : `Extract structured metadata from this codebase context.
      
      Focus heavily on identifying the KEY REUSABLE COMPONENTS.
      Look for files in 'components/', 'ui/', or 'lib/' folders.
      For each component, provide its name, a brief description of what it likely does, and its file path.
      
      Context:
      ${context}
      
      Also extract the tech stack and key dependencies.
      `;

    const [analysisResult, objectResult] = await Promise.all([
      // A. Text Analysis
      generateText({
        model: getDefaultModel(),
        system: "You are a Senior Tech Lead analyzing a codebase. Write a comprehensive Markdown analysis.",
        prompt: analysisPrompt
      }),
      // B. Structure Extraction
       generateObject({
        model: getDefaultModel(),
        schema: analysisSchema,
        prompt: extractionPrompt
      })
    ]);

    const analysisMarkdown = analysisResult.text;
    const structuredData = objectResult.object;

    // Check if target component was found
    let componentFound: boolean | undefined = undefined;
    if (targetComponent) {
      // Check if the component exists in the extracted components
      const found = structuredData.components.some(c => 
        c.name.toLowerCase().includes(targetComponent.toLowerCase()) ||
        c.filePath.toLowerCase().includes(targetComponent.toLowerCase())
      );
      
      // Also check the analysis text for confirmation
      const analysisText = analysisMarkdown.toLowerCase();
      const hasYes = analysisText.includes('yes') || analysisText.includes('found');
      const hasNo = analysisText.includes('not found') || analysisText.includes('does not exist');
      
      componentFound = found || (hasYes && !hasNo);
    }

    // 6. Update Database with Final Results
    await db.update(sources).set({
      analysisStatus: "completed",
      analysisMarkdown: analysisMarkdown, 
      analysisPath: null,
      techStack: structuredData.techStack,
      dependencies: structuredData.dependencies,
      // @ts-ignore - Drizzle JSON types
      components: structuredData.components, // Overwrite discovered list with AI-enriched list
      updatedAt: new Date(),
    }).where(eq(sources.id, sourceId));

    return { 
      success: true, 
      componentFound 
    };


  } catch (error) {
    console.error("Analysis failed:", error);
    await db.update(sources).set({ analysisStatus: "failed" }).where(eq(sources.id, sourceId));
    return { success: false, error: String(error) };
  }
}
