/**
 * Type definitions for Command Menu component
 */

/**
 * Base command item structure
 */
export interface CommandItem {
  /** Unique identifier for the command */
  value: string
  /** Display label */
  label: string
  /** Optional icon name from lucide-react */
  icon?: string
  /** Optional keyboard shortcut to display */
  shortcut?: string
  /** Optional callback when item is selected */
  onSelect?: () => void
  /** Whether the item is disabled */
  disabled?: boolean
  /** Additional keywords for search filtering */
  keywords?: string[]
}

/**
 * Command group structure
 */
export interface CommandGroup {
  /** Group heading/title */
  heading: string
  /** Array of command items in this group */
  items: CommandItem[]
}

/**
 * Props for the CommandDialog component
 */
export interface CommandDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title (for accessibility) */
  title?: string
  /** Dialog description (for accessibility) */
  description?: string
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Additional CSS classes */
  className?: string
  /** Child elements */
  children?: React.ReactNode
}

/**
 * Props for CommandInput component
 */
export interface CommandInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Placeholder text */
  placeholder?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
}

/**
 * Props for CommandItem component
 */
export interface CommandItemProps {
  /** Value for the item (used for filtering) */
  value?: string
  /** Callback when item is selected */
  onSelect?: (value: string) => void
  /** Whether the item is disabled */
  disabled?: boolean
  /** Keywords for search filtering */
  keywords?: string[]
  /** Additional CSS classes */
  className?: string
  /** Child elements */
  children?: React.ReactNode
}
