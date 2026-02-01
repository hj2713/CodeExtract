import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Ported from: source/apps/v4/lib/utils.ts

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
