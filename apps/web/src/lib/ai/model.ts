/**
 * AI Model Abstraction Layer
 * Supports Gemini (default) and Claude providers
 * Easily extendable for future model additions
 */

import { google } from "@ai-sdk/google";
// import { anthropic } from "@ai-sdk/anthropic"; // Uncomment when Claude is needed

export type ModelProvider = "gemini" | "claude";

export interface ModelConfig {
  provider: ModelProvider;
  model?: string;
}

const DEFAULT_MODELS = {
  gemini: "gemini-2.0-flash",
  claude: "claude-sonnet-4-20250514",
} as const;

/**
 * Get the AI model instance based on the provider
 * @param config - Model configuration with provider and optional model override
 * @returns The configured model instance
 */
export function getModel(config: ModelConfig = { provider: "gemini" }) {
  const { provider, model } = config;

  switch (provider) {
    case "gemini":
      return google(model || DEFAULT_MODELS.gemini);
    case "claude":
      // Uncomment when @ai-sdk/anthropic is installed
      // return anthropic(model || DEFAULT_MODELS.claude);
      throw new Error("Claude provider not yet configured. Install @ai-sdk/anthropic first.");
    default:
      throw new Error(`Unknown model provider: ${provider}`);
  }
}

/**
 * Get the default model (Gemini 2.5 Pro)
 */
export function getDefaultModel() {
  return getModel({ provider: "gemini" });
}
