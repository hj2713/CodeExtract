// Ported from: source/apps/v4/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Uses clsx to handle conditional classes and twMerge to deduplicate classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mock command items for demonstration
 */
export const MOCK_COMMAND_ITEMS = {
  suggestions: [
    { icon: "Calendar", label: "Calendar", value: "calendar" },
    { icon: "Smile", label: "Search Emoji", value: "search-emoji" },
    { icon: "Calculator", label: "Calculator", value: "calculator" },
  ],
  settings: [
    { icon: "User", label: "Profile", value: "profile", shortcut: "⌘P" },
    { icon: "CreditCard", label: "Billing", value: "billing", shortcut: "⌘B" },
    { icon: "Settings", label: "Settings", value: "settings", shortcut: "⌘S" },
  ],
}
