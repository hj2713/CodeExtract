'use client';

import { useState, useCallback } from 'react';
import { FileCode, FolderOpen, Check } from 'lucide-react';

export interface ComponentItem {
  name: string;
  description: string;
  filePath: string;
}

interface ComponentCardListProps {
  components: ComponentItem[];
  onSelectionChange?: (selected: ComponentItem[]) => void;
}

/**
 * ComponentCardList - Multi-selectable list of component cards
 *
 * Features:
 * - Vertical scrollable list of component cards
 * - Checkbox + border highlight for selection
 * - Internal state management with callback for selection changes
 * - Hover states for better UX
 */
export function ComponentCardList({
  components,
  onSelectionChange
}: ComponentCardListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((component: ComponentItem) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const id = component.filePath; // Use filePath as unique identifier

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      // Notify parent of selection change
      const selectedComponents = components.filter(c => next.has(c.filePath));
      onSelectionChange?.(selectedComponents);

      return next;
    });
  }, [components, onSelectionChange]);

  const isSelected = (component: ComponentItem) => selectedIds.has(component.filePath);

  if (components.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <FileCode className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">No components available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
      {components.map((component) => {
        const selected = isSelected(component);

        return (
          <button
            key={component.filePath}
            type="button"
            onClick={() => toggleSelection(component)}
            className={`
              w-full text-left p-3 rounded-lg border transition-all duration-150
              ${selected
                ? 'bg-zinc-800 border-emerald-500/50 ring-1 ring-emerald-500/20'
                : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className={`
                w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors
                ${selected
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-zinc-600 bg-zinc-900'
                }
              `}>
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className={`font-medium text-sm truncate ${selected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    {component.name}
                  </span>
                </div>

                {/* File Path */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FolderOpen className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  <span className="text-xs font-mono text-zinc-500 truncate">
                    {component.filePath}
                  </span>
                </div>

                {/* Description */}
                {component.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {component.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
