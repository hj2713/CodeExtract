# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: View the Demo

```bash
# Navigate to your project root
cd your-next-js-project

# Start the development server
npm run dev

# Open your browser to:
# http://localhost:3000/extracted
```

### Step 2: Understand the Structure

The extracted component consists of:

```
src/app/extracted/
├── page.tsx              # Demo page (shows the component in action)
├── components/
│   ├── HeroSection.tsx   # Main component
│   └── HeroSection.css   # Styling
├── types.ts             # TypeScript definitions
└── utils.ts             # Mock data
```

### Step 3: Use It in Your App

```typescript
import { HeroSection } from './components/HeroSection';

// Option 1: Use with mock data (for testing)
import { MOCK_STARTER_PACKS } from './utils';
<HeroSection starterPacks={MOCK_STARTER_PACKS} />

// Option 2: Use with your own data
const myStarterPacks = [
  {
    imageUrl: '/path/to/image.jpg',
    linkUrl: '/link/to/page',
    title: 'My Starter Pack',
    description: 'Description here'
  }
];
<HeroSection starterPacks={myStarterPacks} />
```

## 🎨 Customize the Look

### Change Colors

Edit `components/HeroSection.css`:

```css
/* Line 10: Background gradient */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### Change Title/Description

Edit `components/HeroSection.tsx`:

```tsx
{/* Line 42-46 */}
<h1 className="hero-title">Your Custom Title</h1>
<p className="hero-description">
  Your custom description text.
</p>
```

### Change Navigation Links

Edit `components/HeroSection.tsx`:

```tsx
{/* Line 30-34 */}
<li><a href="/home" className="nav-link">Home</a></li>
<li><a href="/about" className="nav-link">About</a></li>
{/* Add more links as needed */}
```

## 📊 Component Props

The component accepts one prop:

```typescript
interface HeroSectionProps {
  starterPacks: StarterPack[];
}

interface StarterPack {
  imageUrl: string;        // URL to image
  linkUrl: string;         // Where to navigate on click
  title: string;           // Pack title
  description?: string;    // Optional description
}
```

## ✨ Features Included

- ✅ **Responsive grid** - Automatically adjusts to screen size
- ✅ **Hover effects** - Smooth animations on interaction
- ✅ **Error handling** - Fallback images for broken links
- ✅ **Accessibility** - Keyboard navigation, ARIA labels
- ✅ **TypeScript** - Full type safety
- ✅ **Zero dependencies** - Only uses React (already in Next.js)

## 🐛 Troubleshooting

### Images not showing?

Make sure your image URLs are valid and accessible. The component automatically shows a fallback image for broken links.

### Styles not working?

Ensure the CSS file is in the same directory as the component:
```
components/
├── HeroSection.tsx
└── HeroSection.css  ← Must be here
```

### TypeScript errors?

Make sure your data matches the interface:

```typescript
// ✅ Correct
const packs: StarterPack[] = [
  { imageUrl: '...', linkUrl: '...', title: '...' }
];

// ❌ Incorrect - missing required fields
const packs = [
  { imageUrl: '...' }  // Missing linkUrl and title
];
```

## 📖 Full Documentation

For detailed documentation, see [README.md](./README.md)

## 💡 Common Use Cases

### Use Case 1: Static Homepage Hero

```typescript
// Perfect for a landing page
export default function HomePage() {
  return <HeroSection starterPacks={FEATURED_PACKS} />;
}
```

### Use Case 2: Dynamic Content from API

```typescript
// Fetch data from your API
export default async function DynamicPage() {
  const packs = await fetch('/api/starter-packs').then(r => r.json());
  return <HeroSection starterPacks={packs} />;
}
```

### Use Case 3: Filtered/Searched Content

```typescript
// Show filtered results
export default function FilteredPage({ category }: { category: string }) {
  const filtered = ALL_PACKS.filter(p => p.category === category);
  return <HeroSection starterPacks={filtered} />;
}
```

## 🎯 Next Steps

1. **Customize** the colors, title, and description
2. **Replace** mock data with your real data
3. **Deploy** to production
4. **Share** with your team!

---

**Need help?** Check out the [README.md](./README.md) for comprehensive documentation.
