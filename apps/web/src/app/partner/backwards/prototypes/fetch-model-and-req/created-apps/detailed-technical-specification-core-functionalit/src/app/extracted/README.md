# Hero Section with Project Cards

## What this demonstrates

This example demonstrates a responsive hero section component designed for a personal resume website. It showcases a grid of project cards with hover effects, keyboard navigation, and accessibility features. Each card displays project information with a placeholder image and links to the project's repository or live demo. The component is built with Next.js 14 (App Router), TypeScript, and Tailwind CSS, emphasizing responsive design and user experience.

## Original implementation

Since the source repository was empty (a landing page cloned from GitHub that wasn't provided), this implementation is built from scratch based on the detailed technical specification. The design follows common patterns found in modern portfolio and landing pages, featuring:

- A navigation bar at the top (placeholder)
- A hero section with a title and description
- A responsive grid of project cards
- Hover effects and smooth transitions
- Accessibility-first approach with keyboard navigation and ARIA attributes

Key architectural decisions made:
- **Component Structure**: Separated into `Navigation`, `ProjectCard`, and `CardStackContainer` for modularity
- **Styling**: Tailwind CSS with custom hover effects and gradients
- **Responsive Design**: Mobile-first approach with grid layout that adapts from 1 column (mobile) to 3 columns (desktop)
- **Image Handling**: Uses picsum.photos with error handling and loading states
- **State Management**: Simple React useState for managing project data

## Dependencies

### NPM packages required

This example uses only Next.js built-in dependencies:
- **Next.js 14+** — App Router framework
- **React 18+** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility-first CSS framework (should already be configured in your Next.js project)

No additional npm packages are required. All functionality is implemented using native browser APIs and React hooks.

### Code ported from source

Since the source repository was empty, all code was created from scratch based on the specification:
- `types.ts` — TypeScript interfaces for Project and component props
- `utils.ts` — Mock data and helper functions (truncateText utility)
- `page.tsx` — Main component implementation with Navigation, ProjectCard, and CardStackContainer
- `actions.ts` — Server action placeholders for future API integration

### Mocked in this example

All data and external services are mocked:
- **Project Data** — Static array of 5 mock projects in `utils.ts` (`MOCK_PROJECTS`)
- **Images** — Using picsum.photos for placeholder images with consistent seeds
- **API Calls** — Server actions in `actions.ts` are placeholder functions that return mock data
- **Navigation Links** — Placeholder `#` links in the navigation bar
- **External Services** — No database, CMS, or authentication required

## How to use

### Running the example

1. Ensure you're in a Next.js 14+ project with App Router and Tailwind CSS configured
2. Navigate to `http://localhost:3000/extracted` (or your configured path)
3. The component will display 5 mock projects in a responsive grid

### Customizing projects

Edit `src/app/extracted/utils.ts` and modify the `MOCK_PROJECTS` array:

```typescript
export const MOCK_PROJECTS: Project[] = [
  {
    title: 'Your Project Name',
    description: 'Your project description...',
    imageUrl: 'https://picsum.photos/seed/yourproject/400/300',
    link: 'https://github.com/yourusername/yourproject'
  },
  // Add more projects...
];
```

### Making it dynamic

To fetch projects from an API or CMS:

1. Convert the component to async or use `useEffect`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { fetchProjects } from './actions';

export default function HeroSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  // ... rest of component
}
```

2. Update `actions.ts` to fetch from your actual API:
```typescript
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch('https://your-api.com/projects');
  return response.json();
}
```

### Accessibility features

- **Keyboard Navigation**: All cards are focusable with `tabIndex={0}`
- **Focus Indicators**: Blue ring appears on keyboard focus
- **ARIA Labels**: Descriptive labels for screen readers
- **Color Contrast**: Text meets WCAG AA standards
- **Semantic HTML**: Proper use of nav, main, footer, and heading hierarchy

### Responsive breakpoints

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): Two column grid
- **Desktop** (> 1024px): Three column grid

### Browser support

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## File structure

```
src/app/extracted/
├── page.tsx       # Main component with Navigation, ProjectCard, CardStackContainer
├── types.ts       # TypeScript interfaces (Project, HeroSectionProps)
├── utils.ts       # Mock data and helper functions
├── actions.ts     # Server actions (currently mocked)
└── README.md      # This file
```
