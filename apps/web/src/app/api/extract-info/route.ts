/**
 * Gemini Extraction API
 * Extracts structured job info from conversation including textual summary
 */

import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

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
Analyze this conversation about extracting a code component from a codebase.

Context about the source codebase:
${analysisContext || "No additional context provided."}

Conversation:
${conversationText}

Extract the following information:
- componentName: The main component being discussed for extraction
- filePath: The file path if mentioned (or best guess based on naming conventions)
- description: A clear, concise description of what this component does
- dependencies: List of packages/libraries this component needs
- keyRequirements: Key features or requirements the user mentioned
- mockStrategy: How to handle external dependencies ("fixture" for mock data, "api" for keep real calls, "none" for no mocking)
- chatSummary: A comprehensive textual summary (2-4 paragraphs) of the entire conversation. Include:
  - What component the user wants to extract
  - What questions were asked and answered
  - Any specific requirements or constraints mentioned
  - Technical details discussed
  - This will be used by the next phase to understand the full context

If information is not clear from the conversation, make reasonable assumptions based on common patterns.
`;

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
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
