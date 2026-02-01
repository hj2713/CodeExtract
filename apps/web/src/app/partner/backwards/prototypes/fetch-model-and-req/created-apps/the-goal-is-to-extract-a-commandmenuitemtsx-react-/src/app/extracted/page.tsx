"use client"

import * as React from "react"
import { Command, CommandGroup, CommandInput, CommandList } from "./components/command"
import { CommandMenuItem } from "./components/command-menu-item"
import {
  Home,
  Settings,
  User,
  FileText,
  Folder,
  Mail,
  Bell,
  Calendar,
  Search
} from "lucide-react"

// Mock data for demonstration
const MOCK_COMMANDS = [
  { id: "1", icon: "Home" as const, label: "Go to Home", action: () => console.log("Navigate to home") },
  { id: "2", icon: "Settings" as const, label: "Open Settings", action: () => console.log("Open settings") },
  { id: "3", icon: "User" as const, label: "View Profile", action: () => console.log("View profile") },
  { id: "4", icon: "FileText" as const, label: "New Document", action: () => console.log("Create new document") },
  { id: "5", icon: "Folder" as const, label: "Browse Files", action: () => console.log("Browse files") },
  { id: "6", icon: "Mail" as const, label: "Check Messages", action: () => console.log("Check messages") },
  { id: "7", icon: "Bell" as const, label: "View Notifications", action: () => console.log("View notifications") },
  { id: "8", icon: "Calendar" as const, label: "Open Calendar", action: () => console.log("Open calendar") },
]

export default function CommandMenuItemDemo() {
  const [open, setOpen] = React.useState(true)
  const [selectedCommand, setSelectedCommand] = React.useState<string | null>(null)
  const [lastAction, setLastAction] = React.useState<string>("")

  const handleSelect = (label: string, action: () => void) => {
    setSelectedCommand(label)
    action()
    setLastAction(`Executed: ${label}`)
    // In a real app, you might close the menu here
    // setOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">CommandMenuItem Demo</h1>
          <p className="text-gray-600">
            A reusable command menu item component with keyboard navigation support
          </p>
        </div>

        {/* Status Display */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Selected:</span>{" "}
              <span className="text-blue-600">{selectedCommand || "None"}</span>
            </p>
            <p>
              <span className="font-medium">Last Action:</span>{" "}
              <span className="text-green-600">{lastAction || "None"}</span>
            </p>
          </div>
        </div>

        {/* Command Menu */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <Command className="max-w-2xl mx-auto">
            <CommandInput placeholder="Search commands..." />
            <CommandList className="max-h-96">
              <CommandGroup heading="Available Commands">
                {MOCK_COMMANDS.map((command) => (
                  <CommandMenuItem
                    key={command.id}
                    icon={command.icon}
                    label={command.label}
                    onSelect={() => handleSelect(command.label, command.action)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h2>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Click on any command item to execute it</li>
            <li>• Use ↑/↓ arrow keys to navigate through commands</li>
            <li>• Press Enter to execute the highlighted command</li>
            <li>• Type to search and filter commands</li>
            <li>• Highlighted items show visual feedback</li>
          </ul>
        </div>

        {/* Implementation Details */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Key Features</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>✓ Keyboard navigation with arrow keys</li>
            <li>✓ Visual highlight on focus/selection</li>
            <li>✓ Execute commands with Enter key or click</li>
            <li>✓ Flexible icon and label rendering</li>
            <li>✓ Integration with cmdk command palette</li>
            <li>✓ Accessibility with ARIA attributes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
