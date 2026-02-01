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
  Search,
} from "lucide-react"
import { CommandMenu } from "./command-menu"

export default function CommandMenuDemo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="max-w-2xl space-y-4 text-center">
        <h1 className="text-4xl font-bold">Command Menu Example</h1>
        <p className="text-muted-foreground text-lg">
          A powerful command palette interface extracted from shadcn/ui
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <p>
            Press{" "}
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
              <span className="text-xs">⌘</span>K
            </kbd>{" "}
            or{" "}
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
              /
            </kbd>{" "}
            to open the command menu
          </p>
          <p className="text-muted-foreground text-xs">
            Or click the search button below
          </p>
        </div>
      </div>

      <CommandMenu />

      <div className="mt-8 max-w-md space-y-4 rounded-lg border p-6">
        <h2 className="font-semibold">Features:</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>• Keyboard shortcuts (⌘K or /)</li>
          <li>• Arrow key navigation</li>
          <li>• Fuzzy search filtering</li>
          <li>• Grouped commands</li>
          <li>• Visual keyboard shortcuts display</li>
          <li>• Accessible with screen readers</li>
        </ul>
      </div>
    </div>
  )
}
