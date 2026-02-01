"use client"

import * as React from "react"
import * as LucideIcons from "lucide-react"
import { CommandItem } from "./command"
import { useMutationObserver } from "../hooks/use-mutation-observer"
import { cn } from "../utils"

// Type-safe icon mapping
type LucideIconName = keyof typeof LucideIcons

interface CommandMenuItemProps {
  icon: LucideIconName
  label: string
  onSelect: () => void
  onHighlight?: () => void
  className?: string
  value?: string
  keywords?: string[]
}

/**
 * CommandMenuItem - A selectable item within a command menu
 *
 * This component renders a single command item with:
 * - Icon and label display
 * - Keyboard navigation support (arrow keys + Enter)
 * - Visual feedback on highlight/selection
 * - Command execution on selection
 *
 * @example
 * ```tsx
 * <CommandMenuItem
 *   icon="Home"
 *   label="Go to Home"
 *   onSelect={() => router.push('/home')}
 * />
 * ```
 */
export function CommandMenuItem({
  icon,
  label,
  onSelect,
  onHighlight,
  className,
  value,
  keywords,
  ...props
}: CommandMenuItemProps & Omit<React.ComponentProps<typeof CommandItem>, 'children' | 'onSelect'>) {
  const ref = React.useRef<HTMLDivElement>(null)

  // Get the icon component from lucide-react
  const IconComponent = React.useMemo(() => {
    const Icon = LucideIcons[icon]

    // Validate that the icon exists and is a valid component
    if (!Icon || typeof Icon !== 'function') {
      console.warn(`Invalid icon name: ${icon}. Falling back to X icon.`)
      return LucideIcons.X
    }

    return Icon
  }, [icon])

  // Validate onSelect prop
  React.useEffect(() => {
    if (!onSelect) {
      console.warn('CommandMenuItem: onSelect prop is required but was not provided')
    }
  }, [onSelect])

  // Watch for aria-selected attribute changes to trigger highlight callback
  useMutationObserver(ref, (mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "aria-selected" &&
        ref.current?.getAttribute("aria-selected") === "true"
      ) {
        onHighlight?.()
      }
    })
  })

  return (
    <CommandItem
      ref={ref}
      value={value || label}
      keywords={keywords}
      onSelect={() => {
        if (onSelect) {
          onSelect()
        }
      }}
      className={cn(
        // Highlight styling when selected/focused
        "data-[selected=true]:border-input data-[selected=true]:bg-input/50",
        "h-9 rounded-md border border-transparent !px-3 font-medium",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      <IconComponent className="mr-2 h-4 w-4" />
      {label}
    </CommandItem>
  )
}
