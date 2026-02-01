import { NextRequest } from "next/server";
import { db, sources, eq } from "@my-better-t-app/db";
import { generateObject, generateText } from "ai";
import { getDefaultModel } from "@/lib/ai/model";
import path from "path";
import { z } from "zod";
import { GitHubService } from "@/lib/github/service";
import { writeFile, mkdir } from "fs/promises";

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
            prompt: `You are a senior software architect and technical documentation expert. Analyze this codebase and create an EXTREMELY DETAILED ANALYSIS.md document.

## CODEBASE CONTEXT
${context}

## YOUR MISSION
Create a comprehensive, production-quality ANALYSIS.md that serves as the complete technical reference for this codebase. This document should enable any developer to:
1. Understand the project's purpose and architecture instantly
2. Navigate the codebase efficiently
3. Contribute code following existing patterns
4. Debug and maintain the system
5. Extract and reuse components elsewhere

## REQUIRED SECTIONS (Include ALL with rich detail)

### 1. 📋 Executive Summary
- Project name and purpose (2-3 sentences)
- Target audience/users
- Key value proposition
- Current status (production/beta/development)
- Complexity rating (Simple/Medium/Complex/Enterprise)

### 2. 🏗️ Architecture Overview
- High-level architecture pattern (Monolith, Microservices, Monorepo, Serverless, etc.)
- System diagram (describe in text/ASCII if possible)
- Data flow explanation
- Key architectural decisions and trade-offs
- Scalability considerations

### 3. 💻 Tech Stack Deep Dive
For EACH technology, include:
- **Name & Version** (from package.json)
- **Purpose** in this project
- **Why it was chosen** (infer from context)
- **Alternatives** that could be used

Categories:
- Core Framework (React, Next.js, Vue, etc.)
- Language (TypeScript version, strictness level)
- Styling (Tailwind, CSS Modules, Styled Components)
- State Management (React Query, Zustand, Redux, Context)
- Database (Postgres, MongoDB, Prisma, Drizzle)
- Authentication (NextAuth, Clerk, Auth0)
- API Layer (REST, GraphQL, tRPC)
- Testing (Jest, Vitest, Playwright, Cypress)
- Build Tools (Turbo, Vite, Webpack)
- Deployment (Vercel, AWS, Docker)

### 4. 📁 Project Structure Analysis
\`\`\`
project-root/
├── src/
│   ├── app/          # [Explain purpose]
│   ├── components/   # [Explain purpose]
│   └── ...
\`\`\`
For each major directory:
- Purpose and responsibility
- Key files within
- Naming conventions used
- Import/export patterns

### 5. 🧩 Component Library Catalog
For EACH component found, document:
\`\`\`typescript
// Component: [Name]
// Path: [file path]
// Type: [UI/Layout/Feature/Utility]
// Purpose: [What it does]
// Props: [Key props if visible]
// Dependencies: [What it imports]
// Used by: [Where it's used]
// Variants: [If any]
\`\`\`

### 6. 🔧 Configuration Files Breakdown
Analyze each config file:
- **package.json**: Scripts, dependencies analysis, version constraints
- **tsconfig.json**: Compiler options, path aliases, strictness
- **next.config.js/ts**: Build optimizations, rewrites, headers
- **tailwind.config**: Theme customizations, plugins
- **ESLint/Prettier**: Code style rules
- **.env requirements**: Environment variables needed

### 7. 🛣️ API Routes & Endpoints
Document each API route:
| Endpoint | Method | Purpose | Auth Required | Request Body | Response |
|----------|--------|---------|---------------|--------------|----------|
| /api/... | POST   | ...     | Yes/No        | {...}        | {...}    |

### 8. 🗄️ Database Schema
If database files found:
- Tables/Collections overview
- Relationships diagram (text-based)
- Key indexes
- Migration strategy

### 9. 🔐 Authentication & Authorization
- Auth provider used
- Protected routes
- Role-based access patterns
- Session management

### 10. 🎨 Design System & Theming
- Color palette (if defined in config)
- Typography scale
- Spacing system
- Dark mode support
- Component design patterns

### 11. ⚡ Performance Optimizations
- Code splitting strategy
- Image optimization
- Caching approach
- Bundle size considerations
- Loading states and suspense boundaries

### 12. 🧪 Testing Strategy
- Test file locations
- Testing frameworks used
- Test coverage expectations
- E2E vs unit test ratio

### 13. 📦 Dependencies Analysis
**Production Dependencies:**
| Package | Version | Purpose | Risk Level |
|---------|---------|---------|------------|
| react   | 18.x    | UI lib  | Low        |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|

### 14. 🚀 Build & Deployment
- Build commands and what they do
- Environment-specific builds
- CI/CD indicators
- Deployment targets

### 15. 🔄 State Management Patterns
- Global state approach
- Server state (React Query, SWR)
- Form state
- URL state

### 16. 🛡️ Error Handling
- Error boundary implementation
- API error handling patterns
- Logging strategy
- User-facing error messages

### 17. 🌐 Internationalization
- i18n setup if present
- Supported locales
- Translation file structure

### 18. ♿ Accessibility Features
- ARIA patterns used
- Keyboard navigation
- Screen reader support
- Color contrast compliance

### 19. 📝 Code Patterns & Conventions
- Naming conventions (files, functions, components)
- Import organization
- Comment style
- TypeScript patterns (interfaces vs types, generics usage)

### 20. 🔮 Recommendations & Improvements
- Technical debt identified
- Missing best practices
- Suggested improvements
- Security considerations

### 21. 🚦 Quick Start Guide
\`\`\`bash
# Installation
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Required environment variables
NEXT_PUBLIC_...=
DATABASE_URL=
\`\`\`

---

## FORMATTING REQUIREMENTS
- Use proper Markdown headers (##, ###, ####)
- Include code blocks with syntax highlighting
- Use tables for structured data
- Use bullet points and numbered lists
- Include emoji for visual scanning
- Make it scannable with clear sections
- Be thorough - a developer should understand EVERYTHING about this codebase from this document alone

Generate the complete ANALYSIS.md now.`,
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

        // Write ANALYSIS.md to disk
        const analysisDir = path.join(process.cwd(), "analysis-output", sourceId);
        const analysisFilePath = path.join(analysisDir, "ANALYSIS.md");
        
        try {
          await mkdir(analysisDir, { recursive: true });
          await writeFile(analysisFilePath, analysisMarkdown, "utf-8");
          send({ type: "info", message: `ANALYSIS.md saved to: ${analysisFilePath}` });
        } catch (writeError) {
          console.error("Failed to write ANALYSIS.md:", writeError);
        }

        await db.update(sources).set({
          analysisStatus: "complete",
          analysisPath: analysisFilePath,
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
