import { promises as fs } from "fs";
import path from "path";
/**
 * CodeExtract - Requirements Interview Chat API
 * This route handles the AI-powered interview for scoping extractions
 */

import { devToolsMiddleware } from "@ai-sdk/devtools";
import { streamText, type UIMessage, convertToModelMessages, wrapLanguageModel } from "ai";
import { getDefaultModel } from "@/lib/ai/model";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, analysisContext }: { messages: UIMessage[]; analysisContext?: string } = await req.json();

  // Read system prompt from file
  const promptFilePath = path.join(process.cwd(), "src/app/api/phase3/chat/system_prompt.txt");
  const INTERVIEWER_SYSTEM_PROMPT = await fs.readFile(promptFilePath, "utf-8");

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
