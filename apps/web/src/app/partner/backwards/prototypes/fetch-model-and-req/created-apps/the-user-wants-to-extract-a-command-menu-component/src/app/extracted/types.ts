/**
 * Type definitions for the Command Menu component
 */

export interface CommandItem {
  id: string
  label: string
  description?: string
  category: string
  shortcut?: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect?: () => void
}

export interface CommandGroup {
  heading: string
  items: CommandItem[]
}

export interface CommandMenuProps {
  /**
   * Controls the open state of the command menu
   */
  open?: boolean
  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Command groups to display
   */
  groups?: CommandGroup[]
  /**
   * Placeholder text for the search input
   */
  placeholder?: string
  /**
   * Text to show when no results are found
   */
  emptyText?: string
}
