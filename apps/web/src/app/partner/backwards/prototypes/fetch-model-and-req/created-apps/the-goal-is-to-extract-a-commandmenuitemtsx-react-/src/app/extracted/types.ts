/**
 * Type definitions for CommandMenuItem component
 */

import * as LucideIcons from "lucide-react"

// Extract valid icon names from lucide-react
export type LucideIconName = keyof typeof LucideIcons

// Props for the CommandMenuItem component
export interface CommandMenuItemProps {
  icon: LucideIconName
  label: string
  onSelect: () => void
  onHighlight?: () => void
  className?: string
  value?: string
  keywords?: string[]
}

// Mock command data structure for demo
export interface MockCommand {
  id: string
  icon: LucideIconName
  label: string
  action: () => void
}
