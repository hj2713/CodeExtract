"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Home,
  Settings,
  Users,
  Database,
  Workflow,
} from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./components/command"

/**
 * Advanced Command Menu Example
 *
 * This demonstrates how to integrate the command menu with Next.js routing
 * and more complex command structures.
 */

interface Page {
  id: string
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string[]
  shortcut?: string
}

const pages: Page[] = [
  {
    id: "home",
    title: "Home",
    url: "/",
    icon: Home,
    keywords: ["dashboard", "overview"],
    shortcut: "⌘H",
  },
  {
    id: "documents",
    title: "Documents",
    url: "/documents",
    icon: FileText,
    keywords: ["files", "docs"],
    shortcut: "⌘D",
  },
  {
    id: "users",
    title: "Users",
    url: "/users",
    icon: Users,
    keywords: ["team", "people"],
  },
  {
    id: "database",
    title: "Database",
    url: "/database",
    icon: Database,
    keywords: ["data", "tables"],
  },
  {
    id: "workflows",
    title: "Workflows",
    url: "/workflows",
    icon: Workflow,
    keywords: ["automation", "processes"],
  },
  {
    id: "settings",
    title: "Settings",
    url: "/settings",
    icon: Settings,
    keywords: ["config", "preferences"],
    shortcut: "⌘,",
  },
]

export function AdvancedCommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback(
    (callback: () => void) => {
      setOpen(false)
      setSearch("")
      callback()
    },
    []
  )

  // Filter pages based on search
  const filteredPages = React.useMemo(() => {
    if (!search) return pages

    const searchLower = search.toLowerCase()
    return pages.filter((page) => {
      const matchTitle = page.title.toLowerCase().includes(searchLower)
      const matchKeywords = page.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchLower)
      )
      return matchTitle || matchKeywords
    })
  }, [search])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {filteredPages.map((page) => {
            const Icon = page.icon
            return (
              <CommandItem
                key={page.id}
                value={page.title}
                keywords={page.keywords}
                onSelect={() => {
                  runCommand(() => {
                    router.push(page.url)
                  })
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.title}</span>
                {page.shortcut && (
                  <CommandShortcut>{page.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              runCommand(() => {
                console.log("Creating new document...")
                // In a real app, this might open a modal or navigate to a new page
              })
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>New Document</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              runCommand(() => {
                console.log("Opening search...")
              })
            }}
          >
            <span>Search Documents</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => {
              runCommand(() => {
                document.documentElement.classList.add("dark")
              })
            }}
          >
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              runCommand(() => {
                document.documentElement.classList.remove("dark")
              })
            }}
          >
            <span>Light Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
