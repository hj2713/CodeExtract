/**
 * CodeExtract - Requirements Interview Chat API
 * This route handles the AI-powered interview for scoping extractions
 */

import { devToolsMiddleware } from "@ai-sdk/devtools";
import { streamText, type UIMessage, convertToModelMessages, wrapLanguageModel } from "ai";
import { getDefaultModel } from "@/lib/ai/model";

export const maxDuration = 60;

// System prompt for the Requirements Interviewer Agent
const INTERVIEWER_SYSTEM_PROMPT = `You are a Senior Frontend Architect specializing in code extraction and isolation.

Your role is to help users scope extraction tasks from existing codebases. You need to:

1. **Understand Intent**: Ask what specific functionality they want to extract
2. **Identify Dependencies**: Probe about backend dependencies (databases, auth, APIs) that need mocking
3. **Clarify Scope**: Ensure the extraction is specific and achievable
4. **Suggest Alternatives**: If something is too complex, suggest simpler approaches

## Analysis Context
The following is the analysis of the source codebase:
{{ANALYSIS_CONTEXT}}

## Rules
- Be concise and technical
- Ask one question at a time
- If user mentions a component from the analysis, acknowledge it
- Always suggest what will need to be mocked
- Help them be specific without being pedantic

## Output Format
When the user is ready to finalize, summarize:
1. **Component to Extract**: [name]
2. **What to Mock**: [list of dependencies]
3. **Expected Output**: [what the isolated component will do]
`;

export async function POST(req: Request) {
  const { messages, analysisContext }: { messages: UIMessage[]; analysisContext?: string } = await req.json();

  // Inject analysis context into system prompt
  const systemPrompt = INTERVIEWER_SYSTEM_PROMPT.replace(
    "{{ANALYSIS_CONTEXT}}",
    analysisContext || "No analysis available. Ask the user about the codebase structure."
  );

  const model = wrapLanguageModel({
    model: getDefaultModel(),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
