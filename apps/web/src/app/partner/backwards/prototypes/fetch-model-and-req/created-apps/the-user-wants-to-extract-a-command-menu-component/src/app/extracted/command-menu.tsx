"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Settings,
  Smile,
  User,
} from "lucide-react"
import { Button } from "./components/button"
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
import { MOCK_COMMANDS } from "./utils"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Open with ⌘K or /
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        // Don't trigger if user is typing in an input
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-lg pl-3 text-sm font-normal shadow-none sm:pr-12 md:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search commands...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="bg-muted pointer-events-none absolute top-1.5 right-1.5 hidden h-6 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Calendar"))
              }
            >
              <Calendar />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Search Emoji"))
              }
            >
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Calculator"))
              }
            >
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Profile"))
              }
            >
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Billing"))
              }
            >
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Settings"))
              }
            >
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Pages">
            <CommandItem
              onSelect={() => runCommand(() => console.log("Navigate to Home"))}
            >
              <Home />
              <span>Home</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Navigate to Documents"))
              }
            >
              <FileText />
              <span>Documents</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
