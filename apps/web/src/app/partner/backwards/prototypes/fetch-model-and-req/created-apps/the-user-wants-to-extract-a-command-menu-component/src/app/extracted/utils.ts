import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Ported from: source/apps/v4/lib/utils.ts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mock command data for the command menu
 * In the original implementation, this would come from actual navigation/routing
 */
export const MOCK_COMMANDS = [
  {
    id: "calendar",
    label: "Calendar",
    description: "View and manage your calendar",
    category: "suggestions",
  },
  {
    id: "emoji",
    label: "Search Emoji",
    description: "Find and insert emojis",
    category: "suggestions",
  },
  {
    id: "calculator",
    label: "Calculator",
    description: "Perform quick calculations",
    category: "suggestions",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage your profile settings",
    category: "settings",
    shortcut: "⌘P",
  },
  {
    id: "billing",
    label: "Billing",
    description: "View and manage billing",
    category: "settings",
    shortcut: "⌘B",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configure application settings",
    category: "settings",
    shortcut: "⌘S",
  },
]
