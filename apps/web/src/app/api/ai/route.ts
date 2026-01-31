import { devToolsMiddleware } from "@ai-sdk/devtools";
import { openai } from "@ai-sdk/openai";

import {
    convertToModelMessages,
    streamText,
    type UIMessage,
    wrapLanguageModel,
} from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: devToolsMiddleware(),
    });
    const result = streamText({
        model,
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}
