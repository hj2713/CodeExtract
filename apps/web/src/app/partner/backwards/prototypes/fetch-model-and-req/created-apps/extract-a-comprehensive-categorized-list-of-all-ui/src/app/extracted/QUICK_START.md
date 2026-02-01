# Quick Start Guide

## 🚀 What You Have

A comprehensive, searchable catalog of all 72 components from the EchoPilot voice assistant application.

## 📁 File Structure

```
src/app/extracted/
├── page.tsx                    # Main catalog page (Next.js 14)
├── data.ts                     # All 72 components with metadata
├── types.ts                    # TypeScript interfaces
├── utils.ts                    # Helper functions
├── actions.ts                  # Server actions (placeholder)
├── components/
│   ├── Badge.tsx              # Status label component
│   ├── Card.tsx               # Component display card
│   ├── CategoryFilter.tsx     # Category selector
│   └── SearchBar.tsx          # Search input
├── README.md                   # Full documentation
├── COMPONENT_SUMMARY.md        # Component breakdown
└── QUICK_START.md             # This file
```

## 🎯 How to Use This Catalog

### 1. View the Catalog
Navigate to: `http://localhost:3000/extracted` (or wherever your Next.js app runs)

### 2. Search for Components
- Type in the search bar to filter by name, description, or path
- Example searches:
  - "button" → finds Button, VoiceButton, Toggle
  - "form" → finds Form, Input, Label, Checkbox, etc.
  - "voice" → finds VoiceButton, useVoiceRecorder, etc.

### 3. Filter by Category
Click category buttons:
- **All Components** (72)
- **Core UI Components** (7) - EchoPilot custom components
- **UI Library Components** (49) - shadcn/ui components
- **React Hooks** (5) - Custom hooks
- **Pages & Routes** (2) - App pages

### 4. Explore Component Details
Each card shows:
- **Name** - Component identifier
- **Description** - What it does
- **Path** - Where it lives in source
- **Dependencies** - What it needs
- **Tags** - Quick categories

## 📊 Component Categories

### 🎯 Core UI (7 components)
**When to use:** Building voice interfaces, email clients, activity logs

| Component | Purpose |
|-----------|---------|
| EmailList | Display inbox with emails |
| EmailView | Show full email content |
| NarrationLog | Display agent activity |
| VoiceButton | Microphone button for voice input |
| TranscriptPanel | Show conversation transcript |
| SettingsDialog | App settings modal |
| NavLink | Navigation links |

### 🎨 UI Library (49 components)
**When to use:** Need accessible, styled components for common UI patterns

**Highlights:**
- 13 Form components (Input, Select, Checkbox, etc.)
- 7 Navigation components (Dropdown, Menu, Tabs, etc.)
- 7 Overlays (Dialog, Drawer, Popover, etc.)
- 6 Feedback components (Toast, Alert, Progress, etc.)
- 16+ Layout & utility components

### 🪝 React Hooks (5 hooks)
**When to use:** Need reusable logic for voice, state, or UI utilities

| Hook | Purpose |
|------|---------|
| useEchoPilot | Main app state manager |
| useWebSpeechRecognition | Voice-to-text |
| useVoiceRecorder | Audio recording |
| use-mobile | Detect mobile viewport |
| use-toast | Manage toast notifications |

### 📄 Pages (2 pages)
**When to use:** Reference for page-level composition

- Index - Main app layout
- NotFound - 404 page

## 💡 Common Questions

### Q: Can I copy these components to my project?
**A:** This catalog shows what exists. To use components:
1. For shadcn/ui components: Use `npx shadcn-ui@latest add [component]`
2. For custom components: Clone EchoPilot repo and copy component files
3. Install required dependencies from the component's dependency list

### Q: Which components should I start with?
**A:** Start simple:
1. **Button** - Most fundamental component
2. **Card** - Layout container
3. **Dialog** - Modal interactions
4. **Form + Input** - User input
5. **Toast** - Notifications

### Q: How do I know what dependencies a component needs?
**A:** Each component card lists dependencies. Example:
- **Dialog** → `@radix-ui/react-dialog`
- **Form** → `react-hook-form`, `@radix-ui/react-label`
- **Chart** → `recharts`

### Q: What's the difference between Core and UI Library components?
**A:**
- **Core** = Custom-built for EchoPilot (voice interface specific)
- **UI Library** = shadcn/ui components (general-purpose, reusable)

### Q: Can I use these without EchoPilot?
**A:** Yes! The UI Library components are general-purpose. Core components may need adaptation.

## 🔧 Installation Guide

### Install shadcn/ui (for UI Library components)
```bash
# Initialize shadcn/ui in your project
npx shadcn-ui@latest init

# Add specific components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
```

### Install Voice/Audio Dependencies (for Core components)
```bash
# No npm packages needed - uses Web APIs:
# - Web Speech API (browser built-in)
# - MediaRecorder API (browser built-in)
# - Speech Synthesis API (browser built-in)
```

### Install Icons
```bash
npm install lucide-react
```

## 🎨 Customization

### Modify Component Appearance
All components use Tailwind CSS. To customize:

1. **Colors** - Edit `tailwind.config.ts`
2. **Spacing** - Use Tailwind spacing classes
3. **Typography** - Configure in Tailwind config
4. **Dark Mode** - Built-in with `dark:` classes

### Add Your Own Components
Edit `src/app/extracted/data.ts`:

```typescript
{
  id: 'custom',
  title: 'My Custom Components',
  description: 'Components I built',
  icon: '✨',
  components: [
    {
      name: 'MyComponent',
      description: 'Does something cool',
      path: 'src/components/MyComponent.tsx',
      dependencies: ['react'],
      tags: ['custom']
    }
  ]
}
```

## 📚 Next Steps

1. **Browse the catalog** - Explore all 72 components
2. **Read README.md** - Detailed documentation
3. **Check COMPONENT_SUMMARY.md** - Component breakdown
4. **Install what you need** - Use shadcn/ui CLI
5. **Build something!** - Start with simple components

## 🔗 Resources

- **EchoPilot Repo**: Clone for full source code
- **shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/

---

**Ready to explore?** Open the catalog at `/extracted` and start searching!
