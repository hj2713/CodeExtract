import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

interface Message {
  role: string;
  content: string;
}

// POST /api/extract-requirement - Extract structured requirement from conversation
export async function POST(request: NextRequest) {
  try {
    const { messages, analysisContext } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert software architect specializing in extracting DETAILED technical specifications from conversations. Your output will be used by another AI to REBUILD the entire component from scratch.

CRITICAL: You must extract MAXIMUM DETAIL. The next phase will use ONLY your output to recreate the component - if you miss details, they will be lost forever.

Given a conversation about extracting code from a repository, extract a COMPREHENSIVE technical specification:

## Output Format (JSON only, no markdown):

{
  "title": "Short name (3-7 words)",
  
  "requirement": "DETAILED TECHNICAL SPECIFICATION - Include ALL of the following:
    
    ## Core Functionality
    - Exact features/capabilities to implement
    - User interactions and behaviors
    - Data flow (input → processing → output)
    
    ## Technical Implementation Details
    - Architecture pattern to use (MVC, hooks-based, etc.)
    - State management approach
    - Key algorithms or logic flows (be specific!)
    - API endpoints needed (method, path, request/response format)
    - Data models/schemas (field names, types, relationships)
    
    ## UI/UX Specifications
    - Component hierarchy
    - Styling approach (Tailwind, CSS modules, etc.)
    - Responsive behavior
    - Animations/transitions
    - User feedback (loading, errors, success states)
    
    ## Integration Points
    - How it connects to other parts of the app
    - Events emitted/listened to
    - Props interface (TypeScript types)
    
    ## Edge Cases & Error Handling
    - What happens when things fail
    - Validation requirements
    - Fallback behaviors
    
    ## What to EXCLUDE
    - Features explicitly not needed
    - Simplifications requested
    
    Be EXHAUSTIVE - write 500+ words if needed. Include code patterns, type definitions, API schemas.",
    
  "context": "Business context explaining WHY the user needs this, their use case, and how it fits into their project",
  
  "relevantFiles": ["array", "of", "source", "file", "paths", "to", "extract", "from"],
  
  "dependencies": ["npm", "packages", "needed"],
  
  "technicalSpecs": {
    "componentType": "react-component|api-endpoint|full-stack|utility|hook|service",
    "dataModels": [
      {
        "name": "ModelName",
        "fields": [{"name": "fieldName", "type": "string", "description": "purpose"}],
        "relationships": "description of relations"
      }
    ],
    "apiEndpoints": [
      {
        "method": "GET|POST|PUT|DELETE",
        "path": "/api/path",
        "requestBody": "schema description or null",
        "responseBody": "schema description",
        "purpose": "what it does"
      }
    ],
    "stateManagement": {
      "approach": "useState|useReducer|zustand|context|etc",
      "stateShape": "description of state structure",
      "keyActions": ["action1", "action2"]
    },
    "uiComponents": [
      {
        "name": "ComponentName",
        "purpose": "what it renders",
        "props": "key props it accepts",
        "children": ["nested", "components"]
      }
    ],
    "styling": {
      "framework": "tailwind|css-modules|styled-components|etc",
      "keyStyles": "description of visual design"
    },
    "eventFlow": "description of how events/data flow through the system"
  },
  
  "implementationNotes": "Additional notes, gotchas, patterns to follow, or specific implementation hints discussed in the conversation",
  
  "chatSummary": "2-3 sentence summary of what was discussed and agreed upon"
}

Repository Analysis Context:
${analysisContext || "No analysis context provided"}

REMEMBER: The extraction phase ONLY has access to your output. Include EVERY technical detail discussed. When in doubt, include more detail, not less.`;

    const conversationText = messages
      .map((m: Message) => `${m.role}: ${m.content}`)
      .join("\n\n");

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      prompt: `Extract the requirement from this conversation:\n\n${conversationText}`,
    });

    // Collect the full response
    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    // Parse JSON response
    try {
      // Clean up potential markdown formatting
      let jsonText = fullText.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const extracted = JSON.parse(jsonText);
      return NextResponse.json(extracted);
    } catch (parseError) {
      console.error("Failed to parse extracted requirement:", parseError);
      // Return a basic extraction
      return NextResponse.json({
        title: "Extracted Requirement",
        requirement: fullText,
        context: null,
        relevantFiles: [],
        dependencies: [],
        chatSummary: "Requirement extracted from conversation",
      });
    }
  } catch (error) {
    console.error("Error extracting requirement:", error);
    return NextResponse.json(
      { error: "Failed to extract requirement" },
      { status: 500 }
    );
  }
}
