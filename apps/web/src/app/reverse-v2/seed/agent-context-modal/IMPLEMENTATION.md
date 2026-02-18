# AgentContextModal Implementation Guide

## Overview

The AgentContextModal allows users to select components from the current source and add them as context to their chat conversation. This helps the AI understand which parts of the codebase the user wants to discuss.

## Current `/final` Structure

The modal is triggered from `ChatInput` via the plus (+) button:

```
WorkingQueuePage (index.tsx)
├── state: selectedSource, agentContextModalOpen
├── Header
│   └── GithubSwitcher → setSelectedSource
├── ChatWindow
│   ├── MessagesArea (receives selectedSource)
│   └── ChatInput
│       └── + button → setAgentContextModalOpen(true)
├── QueueScreen
├── CreateSourceModal
└── AgentContextModal ← HERE
```

**Key Files**:
- `apps/web/src/app/final/components/working-queue-page/index.tsx` - Parent state owner
- `apps/web/src/app/final/components/working-queue-page/chat-window.tsx` - Contains ChatInput
- `apps/web/src/app/final/components/working-queue-page/chat-input.tsx` - Has + button (currently placeholder)
- `apps/web/src/app/final/components/working-queue-page/agent-context-modal.tsx` - Modal (placeholder)
- `apps/web/src/app/final/components/working-queue-page/component-card-list.tsx` - List (placeholder)

## Data Source

Components come from `source.components`, a JSON field in the sources table:

```typescript
// packages/db/src/schema/index.ts:110-114
components: text("components", { mode: "json" }).$type<{
  name: string;
  description: string;
  filePath: string;
}[]>()
```

## Integration Steps

### Step 1: Add Source Data to WorkingQueuePage

Currently `WorkingQueuePage` only has `selectedSource` as a string ID. You need to fetch actual source data:

```tsx
// index.tsx
import { useQuery } from '@tanstack/react-query'; // or your data fetching approach

export function WorkingQueuePage() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [createSourceModalOpen, setCreateSourceModalOpen] = useState(false);
  const [agentContextModalOpen, setAgentContextModalOpen] = useState(false);
  const [pendingContext, setPendingContext] = useState<string>(''); // NEW

  // Fetch source data when selectedSourceId changes
  const { data: sourceData } = useQuery({
    queryKey: ['source', selectedSourceId],
    queryFn: () => fetchSource(selectedSourceId),
    enabled: !!selectedSourceId
  });

  const sourceComponents = sourceData?.components || [];

  // Handler for AgentContextModal
  const handleAddContext = (components: Component[]) => {
    if (components.length === 0) return;

    if (components.length === 1) {
      const c = components[0];
      setPendingContext(`I want to discuss the ${c.name} component (${c.filePath}). `);
    } else {
      const names = components.map(c => c.name).join(', ');
      setPendingContext(`I want to discuss these components: ${names}. `);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ... Header ... */}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[30%] border-r border-zinc-700">
          <ChatWindow
            selectedSource={selectedSourceId}
            onPlusClick={() => setAgentContextModalOpen(true)}
            pendingContext={pendingContext}                    // NEW
            onContextConsumed={() => setPendingContext('')}    // NEW
          />
        </div>
        {/* ... QueueScreen ... */}
      </div>

      {/* Modals */}
      <CreateSourceModal ... />
      <AgentContextModal
        open={agentContextModalOpen}
        onOpenChange={setAgentContextModalOpen}
        components={sourceComponents}           // NEW
        onAddContext={handleAddContext}         // NEW
      />
    </div>
  );
}
```

### Step 2: Update ChatWindow Props

```tsx
// chat-window.tsx
interface ChatWindowProps {
  selectedSource: string | null;
  onPlusClick: () => void;
  pendingContext?: string;           // NEW
  onContextConsumed?: () => void;    // NEW
}

export function ChatWindow({
  selectedSource,
  onPlusClick,
  pendingContext,
  onContextConsumed
}: ChatWindowProps) {
  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      <div className="flex-1 overflow-hidden">
        <MessagesArea selectedSource={selectedSource} />
      </div>
      <ChatInput
        onPlusClick={onPlusClick}
        initialValue={pendingContext}            // NEW
        onValueConsumed={onContextConsumed}      // NEW
      />
    </div>
  );
}
```

### Step 3: Update ChatInput to Handle Initial Value

The current `ChatInput` is a placeholder. Replace with:

```tsx
// chat-input.tsx
import { useState, useEffect, useRef } from 'react';

interface ChatInputProps {
  onPlusClick: () => void;
  initialValue?: string;
  onValueConsumed?: () => void;
  onSend?: (message: string) => void;
}

export function ChatInput({
  onPlusClick,
  initialValue,
  onValueConsumed,
  onSend
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle initial value (from AgentContextModal)
  useEffect(() => {
    if (initialValue) {
      setValue(prev => initialValue + prev);
      onValueConsumed?.();
      // Focus textarea after prepending
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [initialValue, onValueConsumed]);

  const handleSend = () => {
    if (!value.trim()) return;
    onSend?.(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-zinc-700 bg-zinc-900">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full min-h-[80px] border border-zinc-700 bg-zinc-800 p-2 pl-10 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={onPlusClick}
            className="absolute bottom-2 left-2 w-6 h-6 border border-zinc-600 bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            +
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="px-3 py-2 border border-zinc-700 bg-zinc-800 font-mono text-xs text-zinc-500 hover:text-zinc-100 hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Replace AgentContextModal

Replace the placeholder in `agent-context-modal.tsx` with the full implementation from `created-apps/agent-context-modal/agent-context-modal.tsx`.

**Updated Props**:
```tsx
interface AgentContextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: Component[];                              // NEW
  onAddContext: (selectedComponents: Component[]) => void;  // NEW
}
```

### Step 5: Replace ComponentCardList (Optional)

If you want to keep the list as a separate component, replace `component-card-list.tsx` with the version from `created-apps/agent-context-modal/component-card-list.tsx`.

## Data Flow Summary

```
User clicks + button in ChatInput
  → WorkingQueuePage sets agentContextModalOpen = true
  → AgentContextModal opens with components from sourceData

User selects components and clicks "Add Selected"
  → handleAddContext formats components as text
  → setPendingContext("I want to discuss...")
  → AgentContextModal closes

ChatInput receives pendingContext via props
  → useEffect prepends to textarea value
  → onContextConsumed clears parent state
  → User can edit/send the message
```

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Multi-select | Checkboxes in ComponentCardList |
| Search/filter | Input filters by name, description, filePath |
| Select all / Clear | Helper buttons in modal |
| State clears on close | Reset in handleClose callback |
| Context format | "I want to discuss the X component" or "...these components: X, Y" |

## File References

**Prototype patterns** (himanshu):
- `apps/web/src/app/himanshu/_components/interview-chat.tsx:56-66` - initialInput handling
- `apps/web/src/app/himanshu/_components/requirements-sidebar.tsx:144-151` - Component click → modal
- `apps/web/src/app/himanshu/_components/component-detail-modal.tsx` - Single component detail

**Schema**:
- `packages/db/src/schema/index.ts:110-114` - Component type definition

**Created implementation**:
- `created-apps/agent-context-modal/agent-context-modal.tsx` - Full modal
- `created-apps/agent-context-modal/component-card-list.tsx` - Card list
- `created-apps/agent-context-modal/use-agent-context.ts` - Optional hook

## API Design Notes

The modal does NOT directly call any API. It simply:
1. Receives `components` as props (from parent's source data)
2. Tracks local selection state
3. Returns selected components via `onAddContext` callback

The parent component is responsible for:
- Fetching/providing component data
- Handling the context addition (prepending to chat input)
- Managing the modal open/close state
