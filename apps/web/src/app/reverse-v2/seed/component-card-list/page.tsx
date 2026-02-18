'use client';

import { useState } from 'react';
import { ComponentCardList, type ComponentItem } from './component-card-list';

// Mock data matching the source.components schema
const MOCK_COMPONENTS: ComponentItem[] = [
  {
    name: 'Button',
    description: 'Primary button component with multiple variants including primary, secondary, ghost, and destructive styles.',
    filePath: 'src/components/ui/button.tsx'
  },
  {
    name: 'Dialog',
    description: 'Modal dialog component built on Radix UI primitives with customizable header, content, and footer sections.',
    filePath: 'src/components/ui/dialog.tsx'
  },
  {
    name: 'Input',
    description: 'Form input component with support for labels, error states, and various input types.',
    filePath: 'src/components/ui/input.tsx'
  },
  {
    name: 'Card',
    description: 'Container component for grouping related content with optional header and footer.',
    filePath: 'src/components/ui/card.tsx'
  },
  {
    name: 'DataTable',
    description: 'Feature-rich data table with sorting, filtering, pagination, and row selection capabilities.',
    filePath: 'src/components/data-table/data-table.tsx'
  },
  {
    name: 'Sidebar',
    description: 'Navigation sidebar component with collapsible sections and active state highlighting.',
    filePath: 'src/components/layout/sidebar.tsx'
  },
  {
    name: 'Avatar',
    description: 'User avatar component with fallback initials and online status indicator.',
    filePath: 'src/components/ui/avatar.tsx'
  }
];

export default function ComponentCardListDemo() {
  const [selectedComponents, setSelectedComponents] = useState<ComponentItem[]>([]);

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-100 mb-2">
            ComponentCardList Demo
          </h1>
          <p className="text-sm text-zinc-400">
            Select components to add as context for the agent.
          </p>
        </div>

        {/* Modal-like container */}
        <div className="border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">Add Context</h2>
            <span className="text-xs text-zinc-500">
              {selectedComponents.length} selected
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            <ComponentCardList
              components={MOCK_COMPONENTS}
              onSelectionChange={setSelectedComponents}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-700">
            <button
              type="button"
              className="px-3 py-1.5 font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedComponents.length === 0}
              className={`
                px-3 py-1.5 font-mono text-xs border rounded transition-colors
                ${selectedComponents.length > 0
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              Add Selected ({selectedComponents.length})
            </button>
          </div>
        </div>

        {/* Selection Preview */}
        {selectedComponents.length > 0 && (
          <div className="mt-6 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <h3 className="text-xs font-semibold uppercase text-zinc-500 mb-3">
              Selected Components
            </h3>
            <div className="space-y-1">
              {selectedComponents.map((comp) => (
                <div key={comp.filePath} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-300">{comp.name}</span>
                  <span className="text-zinc-600 font-mono text-xs">
                    {comp.filePath}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
