"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./components/command"

export default function CommandMenuExample() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Command Menu Component
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A powerful command palette built with Radix UI and cmdk
          </p>
        </div>

        {/* Demo Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-6 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Try it out
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Press{" "}
              <kbd className="px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                <span className="text-sm">⌘</span>J
              </kbd>{" "}
              to open the command menu
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="w-full px-4 py-3 text-left text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
          >
            <span>Search for commands...</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded">
              <span className="text-sm">⌘</span>J
            </kbd>
          </button>

          {/* Features List */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Features:
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Keyboard navigation with arrow keys
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Search filtering
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Grouped commands with separators
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Keyboard shortcuts display
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Accessible with ARIA labels
              </li>
            </ul>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-6 border border-slate-700">
          <pre className="text-xs text-slate-300 overflow-x-auto">
            <code>{`<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>
        <Calendar />
        <span>Calendar</span>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      <CommandItem>
        <User />
        <span>Profile</span>
        <CommandShortcut>⌘P</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>`}</code>
          </pre>
        </div>
      </div>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() => {
                console.log("Calendar selected")
                setOpen(false)
              }}
            >
              <Calendar />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                console.log("Search Emoji selected")
                setOpen(false)
              }}
            >
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                console.log("Calculator selected")
                setOpen(false)
              }}
            >
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => {
                console.log("Profile selected")
                setOpen(false)
              }}
            >
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                console.log("Billing selected")
                setOpen(false)
              }}
            >
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                console.log("Settings selected")
                setOpen(false)
              }}
            >
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
