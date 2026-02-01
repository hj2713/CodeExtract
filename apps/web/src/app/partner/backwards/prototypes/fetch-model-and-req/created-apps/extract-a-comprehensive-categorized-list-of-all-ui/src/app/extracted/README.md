# EchoPilot Component Library Catalog

## What this demonstrates

This is a comprehensive, interactive catalog of all UI components, React hooks, and pages used in the EchoPilot voice-controlled email assistant application. It provides a searchable, filterable interface to explore the component architecture, making it easy for developers to understand the available building blocks and choose components for their own projects.

The catalog includes:
- **7 Core UI Components** - Custom components built specifically for EchoPilot's voice interface
- **49 UI Library Components** - shadcn/ui components built with Radix UI primitives and Tailwind CSS
- **5 React Hooks** - Custom hooks for voice interaction, state management, and utilities
- **2 Pages/Routes** - Application page components

## Original implementation

EchoPilot is a voice-controlled email assistant built with React, TypeScript, and Vite. The repository uses:

- **shadcn/ui component system** - A collection of re-usable components built with Radix UI and Tailwind CSS
- **Custom voice interaction components** - Purpose-built components for voice UI patterns
- **Advanced React hooks** - State management for voice recognition, agent responses, and UI state
- **Modular architecture** - Clear separation between core app components, reusable UI library, and business logic

### Key files from source:

**Core Components:**
- `src/components/EmailList.tsx` — Scrollable email inbox with read/unread states and privacy mode
- `src/components/EmailView.tsx` — Full email viewer with HTML rendering
- `src/components/NarrationLog.tsx` — Real-time activity log showing agent actions
- `src/components/VoiceButton.tsx` — Animated microphone button with push-to-talk
- `src/components/TranscriptPanel.tsx` — Live conversation transcript viewer
- `src/components/SettingsDialog.tsx` — Application settings modal
- `src/components/NavLink.tsx` — Navigation link with active states

**UI Library (shadcn/ui):**
- `src/components/ui/` — 49 components including button, dialog, dropdown, form, table, tabs, etc.
  - All built with Radix UI primitives for accessibility
  - Styled with Tailwind CSS
  - Includes advanced components like charts, carousels, command palettes

**React Hooks:**
- `src/hooks/useEchoPilot.ts` — Main app state manager (conversation, emails, navigation, agent responses)
- `src/hooks/useWebSpeechRecognition.ts` — Browser Speech Recognition API wrapper
- `src/hooks/useVoiceRecorder.ts` — MediaRecorder API for audio capture
- `src/hooks/use-mobile.tsx` — Responsive viewport detection
- `src/hooks/use-toast.ts` — Toast notification state management

**Pages:**
- `src/pages/Index.tsx` — Main three-panel layout (voice controls, email view, activity log)
- `src/pages/NotFound.tsx` — 404 error page

## Dependencies

### NPM packages required

**Core:**
- `react` ^18.x — UI framework
- `react-dom` ^18.x — React renderer
- `next` ^14.x — App router framework
- `typescript` ^5.x — Type safety

**Styling:**
- `tailwindcss` ^3.x — Utility-first CSS framework
- `tailwind-merge` — Utility for merging Tailwind classes
- `clsx` — Conditional class name utility

**UI Components (for full shadcn/ui implementation):**
- `@radix-ui/react-accordion` — Accordion primitive
- `@radix-ui/react-alert-dialog` — Alert dialog primitive
- `@radix-ui/react-avatar` — Avatar primitive
- `@radix-ui/react-checkbox` — Checkbox primitive
- `@radix-ui/react-collapsible` — Collapsible primitive
- `@radix-ui/react-context-menu` — Context menu primitive
- `@radix-ui/react-dialog` — Dialog primitive
- `@radix-ui/react-dropdown-menu` — Dropdown menu primitive
- `@radix-ui/react-hover-card` — Hover card primitive
- `@radix-ui/react-label` — Label primitive
- `@radix-ui/react-menubar` — Menubar primitive
- `@radix-ui/react-navigation-menu` — Navigation menu primitive
- `@radix-ui/react-popover` — Popover primitive
- `@radix-ui/react-progress` — Progress primitive
- `@radix-ui/react-radio-group` — Radio group primitive
- `@radix-ui/react-scroll-area` — Scroll area primitive
- `@radix-ui/react-select` — Select primitive
- `@radix-ui/react-separator` — Separator primitive
- `@radix-ui/react-slider` — Slider primitive
- `@radix-ui/react-switch` — Switch primitive
- `@radix-ui/react-tabs` — Tabs primitive
- `@radix-ui/react-toast` — Toast primitive
- `@radix-ui/react-toggle` — Toggle primitive
- `@radix-ui/react-toggle-group` — Toggle group primitive
- `@radix-ui/react-tooltip` — Tooltip primitive
- `cmdk` — Command palette component
- `vaul` — Drawer component
- `sonner` — Toast notifications
- `react-day-picker` — Calendar/date picker
- `react-hook-form` — Form handling
- `recharts` — Charts and data visualization
- `embla-carousel-react` — Carousel component
- `react-resizable-panels` — Resizable panels
- `input-otp` — OTP input component
- `lucide-react` — Icon library

### Code ported from source

This example includes:

**Data structure (`data.ts`):**
- Component metadata schema extracted from analyzing the source repository
- Categorized listing of all 72 components with descriptions, paths, dependencies, and tags
- TypeScript interfaces for type-safe component catalog

**UI Components (`components/`):**
- `Badge.tsx` — Label component for status indicators (ported pattern)
- `Card.tsx` — Component display card (inspired by shadcn Card)
- `SearchBar.tsx` — Search input with clear button
- `CategoryFilter.tsx` — Tab-style category selector

### Mocked in this example

**Component implementations:**
- All 72 component implementations from the source are documented but not included
- The catalog provides metadata (name, description, path, dependencies) instead of actual code
- This allows developers to understand what's available without including the full component library

**API calls and external services:**
- No backend services required
- All data is static and client-side
- Component information is hardcoded in `data.ts`

**Voice features:**
- The original EchoPilot uses Web Speech API and MediaRecorder
- This catalog is documentation-only, no voice features implemented

## How to use

### Running the example

1. Navigate to the extracted directory:
   ```bash
   cd src/app/extracted
   ```

2. The page is accessible at:
   ```
   http://localhost:3000/extracted
   ```
   (Assuming you're running the Next.js 14 app router)

### Features

**Search:**
- Type in the search bar to filter components by name, description, or path
- Real-time filtering as you type
- Clear button to reset search

**Category Filters:**
- Click category buttons to filter by type:
  - Core UI Components (7)
  - UI Library Components (49)
  - React Hooks (5)
  - Pages & Routes (2)
- "All Components" shows everything

**Component Cards:**
- Each card displays:
  - Component name and description
  - File path in the source repository
  - Dependencies (npm packages and other components)
  - Tags for quick identification
- Hover effects for better UX

### Extending this example

**Add more metadata:**
Edit `data.ts` to add additional fields like:
- Usage examples
- Props/API documentation
- Related components
- Complexity ratings

**Link to source code:**
Add GitHub links to each component:
```typescript
{
  name: 'EmailList',
  // ...
  sourceUrl: 'https://github.com/user/repo/blob/main/src/components/EmailList.tsx'
}
```

**Add component previews:**
Import and render actual components with live demos:
```typescript
import { Button } from '@/components/ui/button';
// Show live preview in the card
```

**Export functionality:**
Add buttons to export component lists as JSON, CSV, or markdown

**Categorization:**
Add more granular categories like:
- By complexity (beginner, intermediate, advanced)
- By use case (forms, navigation, feedback, etc.)
- By accessibility features

## Architecture notes

### Why this structure?

1. **Separation of concerns:**
   - `data.ts` contains all component metadata
   - `page.tsx` handles UI logic and filtering
   - `components/` contains reusable UI primitives

2. **Type safety:**
   - TypeScript interfaces ensure data consistency
   - Autocomplete and type checking for all component properties

3. **Scalability:**
   - Easy to add new components to the catalog
   - Search and filter logic works automatically with new data
   - Component metadata can be generated programmatically

4. **Performance:**
   - Client-side filtering is instant
   - No API calls required
   - Minimal bundle size (just metadata, not actual components)

### Design decisions

**Dark theme:**
- Matches EchoPilot's voice interface aesthetic
- Reduces eye strain for developers browsing components
- Gradient accents for visual interest

**Card-based layout:**
- Easy to scan visually
- Groups related information
- Responsive grid adapts to screen size

**Progressive disclosure:**
- Show essential info first (name, description)
- Dependencies and tags as secondary info
- Keeps cards from becoming overwhelming

## Component categories explained

### Core UI Components
Purpose-built components for EchoPilot's voice interface. These demonstrate patterns like:
- Voice interaction UI (animated mic button, status indicators)
- Email management (list/detail views, threading)
- Real-time updates (transcript, activity log)
- Privacy controls (redacted text display)

### UI Library Components
shadcn/ui components following these principles:
- **Accessible by default** - Built on Radix UI primitives with full ARIA support
- **Composable** - Small, focused components that work together
- **Customizable** - Easy to modify with Tailwind CSS
- **Copy-paste friendly** - Own the code, not a dependency

### React Hooks
Custom hooks demonstrating:
- Complex state management (useEchoPilot)
- Web API integration (useWebSpeechRecognition, useVoiceRecorder)
- Responsive utilities (use-mobile)
- UI state patterns (use-toast)

### Pages & Routes
Page-level components showing:
- Layout composition
- Hook integration
- Event handling
- Component orchestration

## Learning resources

To use these components in your own project:

1. **shadcn/ui setup:**
   ```bash
   npx shadcn-ui@latest init
   ```

2. **Add specific components:**
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add dropdown-menu
   ```

3. **Official docs:**
   - [shadcn/ui](https://ui.shadcn.com/)
   - [Radix UI](https://www.radix-ui.com/)
   - [Tailwind CSS](https://tailwindcss.com/)

4. **EchoPilot source:**
   Clone the repository to explore component implementations in detail

---

**Note:** This catalog is for reference and learning. To use these components, you'll need to install the required dependencies and copy the component code from the source repository or use shadcn/ui CLI to add them to your project.
