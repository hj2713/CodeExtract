/**
 * Gemini Extraction API
 * Extracts structured job info from conversation including textual summary
 * 
 * UPDATED: Handles minimal conversations (1-2 messages) by making intelligent
 * assumptions based on codebase analysis and common patterns
 */

import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getDefaultModel } from "@/lib/ai/model";

const extractionSchema = z.object({
  componentName: z.string().describe("Name of the component to extract"),
  filePath: z.string().optional().describe("File path if mentioned"),
  description: z.string().describe("What this component does"),
  dependencies: z.array(z.string()).describe("Required dependencies"),
  keyRequirements: z.array(z.string()).describe("Key requirements mentioned"),
  mockStrategy: z.enum(["fixture", "api", "none"]).describe("How to mock external deps"),
  chatSummary: z.string().describe("A comprehensive textual summary of the entire conversation, capturing all important details discussed about this component extraction"),
});

export async function POST(request: Request) {
  try {
    const { messages, analysisContext } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Build conversation text for analysis
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n\n");

    const prompt = `
You are analyzing a conversation about extracting a code component. The user may have had a very brief conversation (even just 1-2 messages), so you MUST make intelligent assumptions based on the codebase context and common patterns.

===== SOURCE CODEBASE CONTEXT =====
${analysisContext || "No additional context provided."}

===== CONVERSATION =====
${conversationText}

===== YOUR TASK =====
Extract structured information about what needs to be extracted. Since users often create jobs after minimal discussion, you must:

1. **Be Intelligent About Defaults**: If something wasn't discussed, infer it from:
   - The codebase analysis context
   - Common patterns for this type of component
   - What would make sense for a working standalone version

2. **Assume Mocking by Default**: Unless explicitly stated otherwise:
   - Mock all API calls with fixtures/fake data
   - Mock authentication with a fake user context
   - Mock databases with in-memory data
   - This gives users a working demo without external dependencies

3. **Include Implicit Requirements**: Even if not mentioned, include what's obviously needed:
   - If it's a chat component, it needs message state management
   - If it's a form, it needs validation
   - If it uses Tailwind, include the config
   - If it uses Shadcn, include the specific components

4. **chatSummary Must Be Comprehensive**: This is CRITICAL - it will be used by Phase 4 to generate code.
   Include in the summary:
   - What component was requested
   - What was explicitly discussed (even if brief)
   - What should be ASSUMED based on the component type and codebase
   - Technical stack detected (React, Next.js, Zustand, etc.)
   - Mocking strategy (default to mocking everything unless stated)
   - File structure and dependencies needed
   - Any constraints or preferences mentioned
   
   Even if the conversation was just "I want the MessageBubble component", your summary should be 3-4 paragraphs covering:
   - The component request
   - Dependencies detected from codebase analysis
   - Assumed mocking strategy
   - Assumed scope (just the bubble or related components too)
   - Technical implementation approach

===== EXTRACTION GUIDELINES =====

**componentName**: 
- Use the exact name from the conversation
- If unclear, use the closest match from codebase analysis
- Example: "MessageBubble", "ChatWindow", "AuthForm"

**filePath**: 
- If mentioned in conversation, use that
- Otherwise, infer from codebase structure in analysis context
- Common patterns: "src/components/[Name].tsx", "components/[Name].jsx"
- If multiple files, list the main component file

**description**: 
- 1-2 sentences about what this component does
- Be specific: "A chat message bubble component that displays user messages with markdown support and timestamps"
- Not vague: "A component that shows messages"

**dependencies**: 
- List ALL packages needed, extracted from codebase analysis
- Include obvious ones even if not mentioned (react, next, typescript)
- Include styling libs (tailwindcss, shadcn-ui)
- Include utility libs (date-fns, lodash, etc.)
- Include state management (zustand, redux, etc.)
- Format: ["react", "next", "zustand", "tailwindcss", "lucide-react"]

**keyRequirements**: 
- Explicit requirements from conversation
- PLUS inferred requirements based on component type
- Examples for a chat component:
  * "Display messages in chronological order"
  * "Support markdown rendering"
  * "Mock AI responses with streaming simulation"
  * "Include message timestamps"
  * "Support light/dark theme"
- Be specific and actionable

**mockStrategy**: 
- "fixture" = Mock with hardcoded data (DEFAULT for most cases)
- "api" = Keep real API calls (only if user explicitly wants this)
- "none" = No external dependencies to mock

**chatSummary** (MOST IMPORTANT):
Write a detailed 3-4 paragraph summary that Phase 4 can use to generate the full extraction. Include:

Paragraph 1: The Request
- What component the user wants
- From which codebase
- Any specific scope mentioned

Paragraph 2: Technical Stack & Dependencies
- Framework (Next.js 14, React, etc.)
- State management (Zustand, Redux, Context)
- UI libraries (Shadcn, Tailwind)
- Key dependencies
- File structure

Paragraph 3: Mocking & Integration Strategy
- How APIs should be mocked (or not)
- How database should be handled
- How auth should be handled
- Any environment variables needed

Paragraph 4: Scope & Deliverables
- What files will be extracted
- What will be working out of the box
- What users can customize later
- Any known limitations

IMPORTANT: Even if the conversation was brief, make this summary comprehensive by inferring from the codebase analysis.

===== EXAMPLE OUTPUT FOR MINIMAL CONVERSATION =====

If conversation was just:
User: "I want to extract the MessageBubble component"
Assistant: "Got it! I'm analyzing the MessageBubble component..."

Your output should still include:
- componentName: "MessageBubble"
- filePath: "src/components/MessageBubble.tsx" (inferred)
- description: "A chat message bubble component that displays individual messages with markdown support, syntax highlighting, and user avatars"
- dependencies: ["react", "next", "tailwindcss", "react-markdown", "lucide-react"] (from analysis)
- keyRequirements: [
    "Display message content with markdown rendering",
    "Show user avatar and name",
    "Support code syntax highlighting",
    "Include timestamp display",
    "Responsive design with Tailwind"
  ]
- mockStrategy: "fixture"
- chatSummary: "The user wants to extract the MessageBubble component from the mckaywrigley/chatbot-ui repository. This is a React component built with Next.js 14 and TypeScript that displays individual chat messages in a conversation interface.

Based on the codebase analysis, this component uses Tailwind CSS for styling and includes dependencies on react-markdown for rendering message content, lucide-react for icons, and integrates with the app's Zustand store for message state. The component supports both user and AI messages with different styling, includes avatar display, and formats timestamps using date-fns.

For the extraction, all external dependencies will be mocked. The component will use fixture data for sample messages rather than connecting to a real API. No authentication will be required - the component will work standalone with mock user data. The Zustand store slice will be extracted and simplified to only include message-related state.

The extracted version will include the MessageBubble.tsx component file, necessary Tailwind configuration, a simple demo page showing multiple message examples, and a README with setup instructions. Users will be able to run npm install && npm run dev to see a working demo immediately. The extraction will maintain the original styling and theming, and provide clear documentation for customizing or integrating into existing applications."

===== NOW EXTRACT FROM THE ACTUAL CONVERSATION =====
`;

    const result = await generateObject({
      model: getDefaultModel(),
      schema: extractionSchema,
      prompt,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error("Error extracting job info:", error);
    return NextResponse.json(
      { error: "Failed to extract job info" },
      { status: 500 }
    );
  }
}