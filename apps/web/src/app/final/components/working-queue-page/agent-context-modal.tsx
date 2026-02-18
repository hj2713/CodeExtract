'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, FileCode, X, Check } from 'lucide-react';
import { ComponentCardList } from './component-card-list';
import { getSourceComponents, type SourceComponent } from './actions';

interface AgentContextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string | null;
  onAddContext: (selectedComponents: SourceComponent[]) => void;
}

/**
 * AgentContextModal - Modal for selecting components to add as chat context
 *
 * Features:
 * - Fetches components from selected source
 * - Multi-select with checkboxes
 * - Search/filter components
 * - Shows name + description for each component
 * - "Add Selected" passes selected components to parent
 * - Clears selection state on modal close
 */
export function AgentContextModal({
  open,
  onOpenChange,
  sourceId,
  onAddContext
}: AgentContextModalProps) {
  const [components, setComponents] = useState<SourceComponent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch components when source changes or modal opens
  useEffect(() => {
    if (open && sourceId) {
      setLoading(true);
      getSourceComponents(sourceId)
        .then(setComponents)
        .finally(() => setLoading(false));
    }
  }, [open, sourceId]);

  // Filter components based on search
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components;
    const query = searchQuery.toLowerCase();
    return components.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.filePath.toLowerCase().includes(query)
    );
  }, [components, searchQuery]);

  const toggleSelection = (componentName: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(componentName)) {
        next.delete(componentName);
      } else {
        next.add(componentName);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredComponents.map(c => c.name)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleAddSelected = () => {
    const selectedComponents = components.filter(c => selectedIds.has(c.name));
    onAddContext(selectedComponents);
    // Reset state
    setSelectedIds(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md border border-zinc-700 bg-zinc-900 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">Add Context</h2>
            <button
              onClick={handleClose}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            {/* Selection helpers */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-zinc-500">
                {selectedIds.size} of {components.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Select all
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  onClick={clearSelection}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Loading components...</p>
              </div>
            ) : !sourceId ? (
              <div className="text-center py-8">
                <FileCode className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Select a source first</p>
              </div>
            ) : (
              <ComponentCardList
                components={filteredComponents}
                selectedIds={selectedIds}
                onToggle={toggleSelection}
                searchQuery={searchQuery}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700">
            <span className="text-xs text-zinc-500">
              {selectedIds.size > 0
                ? `${selectedIds.size} component${selectedIds.size > 1 ? 's' : ''} will be added`
                : 'Select components to add context'
              }
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedIds.size === 0}
                className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                  selectedIds.size === 0
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'border-zinc-500 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
