import { NextRequest } from "next/server";
import { db, sources, eq } from "@my-better-t-app/db";
import { generateObject, generateText } from "ai";
import { getDefaultModel } from "@/lib/ai/model";
import path from "path";
import { z } from "zod";
import { GitHubService } from "@/lib/github/service";

const analysisSchema = z.object({
  techStack: z.array(z.string()).describe("List of main technologies used"),
  dependencies: z.array(z.string()).describe("List of key dependencies"),
  components: z.array(z.object({
    name: z.string(),
    description: z.string(),
    filePath: z.string(),
  })).describe("List of reusable components found"),
});

export async function POST(req: NextRequest) {
  const { sourceId } = await req.json();

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const source = await db.query.sources.findFirst({
          where: eq(sources.id, sourceId),
        });

        if (!source?.originUrl) {
          send({ type: "error", message: "Source not found" });
          controller.close();
          return;
        }

        // Step 1: Parse URL
        send({ type: "step", step: 0, message: "Parsing repository URL..." });
        const { owner, repo, branch } = GitHubService.parseUrl(source.originUrl);
        send({ type: "info", message: `Repository: ${owner}/${repo} (${branch})` });

        // Step 2: Fetch Tree
        send({ type: "step", step: 0, message: "Fetching repository structure..." });
        await db.update(sources).set({ analysisStatus: "fetching_tree" }).where(eq(sources.id, sourceId));
        
        const tree = await GitHubService.getRepoTree(owner, repo, branch);
        send({ type: "tree", totalFiles: tree.length, message: `Found ${tree.length} files in repository` });

        // Step 3: Filter relevant files
        send({ type: "step", step: 1, message: "Filtering relevant files..." });
        await db.update(sources).set({ analysisStatus: "analyzing:scanning" }).where(eq(sources.id, sourceId));
        
        const relevant = GitHubService.filterRelevantFiles(tree);
        
        // Send discovered files for spinning reel
        const allRelevantFiles = [
          ...relevant.configs.map(f => ({ path: f.path, type: "config" })),
          ...relevant.docs.map(f => ({ path: f.path, type: "doc" })),
          ...relevant.components.map(f => ({ path: f.path, type: "component" })),
        ];
        
        send({ 
          type: "files", 
          files: allRelevantFiles,
          stats: {
            configs: relevant.configs.length,
            docs: relevant.docs.length,
            components: relevant.components.length,
          }
        });

        // Save discovered components
        const discoveredComponents = relevant.components.map(f => ({
          name: path.basename(f.path, path.extname(f.path)),
          description: "Discovered, pending analysis...",
          filePath: f.path
        }));

        await db.update(sources).set({ 
          analysisStatus: "analyzing:scanning",
          components: discoveredComponents as any
        }).where(eq(sources.id, sourceId));

        // Step 4: Fetch file contents
        send({ type: "step", step: 1, message: "Fetching file contents..." });
        await db.update(sources).set({ analysisStatus: "analyzing:context" }).where(eq(sources.id, sourceId));

        // Fetch package.json
        send({ type: "analyzing", file: "package.json", index: 0, total: relevant.components.length + 2 });
        let packageJsonContent = "{}";
        const packageJsonFile = relevant.configs.find(f => f.path === "package.json");
        if (packageJsonFile) {
          packageJsonContent = await GitHubService.getFileContent(owner, repo, packageJsonFile.path, branch);
        }

        // Fetch README
        send({ type: "analyzing", file: "README.md", index: 1, total: relevant.components.length + 2 });
        let readmeContent = "";
        if (relevant.docs.length > 0) {
          readmeContent = await GitHubService.getFileContent(owner, repo, relevant.docs[0].path, branch);
        }

        // Fetch components one by one with progress
        const componentFiles = relevant.components.slice(0, 10);
        const componentContents: string[] = [];
        
        for (let i = 0; i < componentFiles.length; i++) {
          const file = componentFiles[i];
          send({ 
            type: "analyzing", 
            file: file.path, 
            index: i + 2, 
            total: componentFiles.length + 2,
            progress: Math.round(((i + 2) / (componentFiles.length + 2)) * 100)
          });
          
          const content = await GitHubService.getFileContent(owner, repo, file.path, branch);
          componentContents.push(`=== ${file.path} ===\n${content}\n`);
        }

        // Build context
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

        // Step 5: AI Analysis
        send({ type: "step", step: 2, message: "AI is analyzing the codebase..." });
        await db.update(sources).set({ analysisStatus: "analyzing:report" }).where(eq(sources.id, sourceId));

        const model = getDefaultModel();

        // Run analysis and extraction in parallel
        send({ type: "ai", phase: "generating", message: "Generating analysis report..." });
        
        const [analysisResult, structuredResult] = await Promise.all([
          generateText({
            model,
            prompt: `Analyze this codebase based on its file structure and configuration files.
            
            Output a 'ANALYSIS.md' formatted report including:
            - Project Overview
            - Tech Stack & Key Libraries
            - Architecture & Folder Structure
            - Component Library Overview
            - Key Features
            
            Context:
            ${context}
            `,
          }),
          generateObject({
            model,
            schema: analysisSchema,
            prompt: `Extract metadata from this codebase:\n${context}`,
          }),
        ]);

        // Step 6: Save results
        send({ type: "step", step: 3, message: "Saving analysis results..." });
        
        const analysisMarkdown = analysisResult.text;
        const metadata = structuredResult.object;

        await db.update(sources).set({
          analysisStatus: "complete",
          analysisMarkdown,
          techStack: metadata.techStack as any,
          dependencies: metadata.dependencies as any,
          components: metadata.components as any,
          updatedAt: new Date(),
        }).where(eq(sources.id, sourceId));

        send({ type: "complete", message: "Analysis complete!" });
        controller.close();

      } catch (error: any) {
        send({ type: "error", message: error.message || "Analysis failed" });
        await db.update(sources).set({ analysisStatus: "error" }).where(eq(sources.id, sourceId));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
