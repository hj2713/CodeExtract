// Utility functions for the AppearanceSettings component

/**
 * Clamps a number between a minimum and maximum value
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Validates GPU count input
 * @param value - The input value to validate
 * @param min - Minimum allowed GPU count (default: 1)
 * @param max - Maximum allowed GPU count (default: 99)
 * @returns The validated GPU count or null if invalid
 */
export function validateGpuCount(
  value: string | number,
  min = 1,
  max = 99
): number | null {
  const numValue = typeof value === "string" ? parseInt(value, 10) : value

  if (isNaN(numValue)) {
    return null
  }

  if (numValue < min || numValue > max) {
    return null
  }

  return numValue
}

/**
 * Mock fixture data for appearance settings
 * This would typically come from a database or API
 */
export const MOCK_SETTINGS = {
  defaultComputeEnvironment: "kubernetes" as const,
  defaultGpuCount: 8,
  defaultWallpaperTinting: true,
  minGpuCount: 1,
  maxGpuCount: 99,
}
