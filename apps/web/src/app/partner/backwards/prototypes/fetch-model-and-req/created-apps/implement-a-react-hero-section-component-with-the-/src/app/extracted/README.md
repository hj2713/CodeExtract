# React Hero Section Component

## What This Demonstrates

This example showcases a production-ready Hero Section component built with React and plain CSS. The component features a modern gradient background, navigation menu with hover effects, a grid of clickable starter pack cards with smooth animations, and an MLH official badge. It demonstrates best practices for component structure, accessibility, error handling, and responsive design while maintaining simplicity by avoiding CSS frameworks.

## Original Source

**Repository:** Custom implementation based on specifications
**Original location:** Built from scratch following the provided requirements

Key implementation details:
- Uses React functional components with hooks
- Implements plain CSS for all styling (no Tailwind, CSS Modules, or styled-components)
- Static content with configurable props for flexibility
- Comprehensive error handling for image loading failures
- Smooth animations and transitions for enhanced UX

## Live Preview

To see this in action:
```bash
npm run dev
# Navigate to /extracted
```

## Dependencies Required

### NPM Packages

This component uses only React (already included in Next.js). No additional dependencies are required.

**Why:**
- Pure React implementation with no external UI libraries
- Plain CSS for styling (no CSS-in-JS libraries needed)
- Uses native browser APIs for all functionality

## Code Organization

```
src/app/extracted/
├── page.tsx                      # Main demo page
├── components/
│   ├── HeroSection.tsx          # The Hero Section component
│   └── HeroSection.css          # Component styles (plain CSS)
├── types.ts                     # TypeScript type definitions
├── utils.ts                     # Mock data and utility functions
└── README.md                    # This file
```

## What's Mocked

### Starter Pack Data
The component uses mock starter pack data with Unsplash placeholder images:
```typescript
// In utils.ts
export const MOCK_STARTER_PACKS: StarterPack[] = [
  {
    imageUrl: 'https://images.unsplash.com/...',
    linkUrl: '#web-development',
    title: 'Web Development Starter',
    description: 'HTML, CSS, JavaScript, React'
  },
  // ... more starter packs
]
```

### Navigation Links
Static navigation links are provided for demonstration:
```typescript
export const NAVIGATION_LINKS: NavigationLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  // ... more links
]
```

### MLH Badge
Uses the official MLH logo from their CDN:
```typescript
export const MLH_BADGE_URL = 'https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png';
```

## How to Integrate Into Your App

1. **Copy the component files** to your project:
   - Copy `components/HeroSection.tsx`
   - Copy `components/HeroSection.css`
   - Copy `types.ts`

2. **Replace mock data with real data:**

```typescript
// Before (mocked)
import { MOCK_STARTER_PACKS } from './utils';
<HeroSection starterPacks={MOCK_STARTER_PACKS} />

// After (real data from your API/database)
const starterPacks = await fetch('/api/starter-packs').then(r => r.json());
<HeroSection starterPacks={starterPacks} />
```

3. **Customize the navigation links:**

```typescript
// Edit the links directly in HeroSection.tsx
<nav className="hero-nav">
  <ul className="nav-list">
    <li><a href="/home" className="nav-link">Home</a></li>
    <li><a href="/about" className="nav-link">About</a></li>
    {/* Add your custom links */}
  </ul>
</nav>
```

4. **Update the title and description:**

```typescript
// Edit the content in HeroSection.tsx
<h1 className="hero-title">Your Custom Title</h1>
<p className="hero-description">
  Your custom description text here.
</p>
```

## Key Features

- ✅ **Navigation with hover effects** - Links darken on hover with 200ms transition
- ✅ **Responsive grid layout** - Starter packs displayed in a flexible grid
- ✅ **Smooth animations** - Fade-in effects for content, staggered card animations
- ✅ **Interactive cards** - Hover effects with scale and shadow transitions
- ✅ **MLH badge integration** - Official 2026 season badge displayed
- ✅ **Error handling** - Fallback images for broken links
- ✅ **Accessible** - Keyboard navigation, ARIA labels, semantic HTML
- ✅ **Loading states** - Lazy loading for images
- ✅ **TypeScript** - Full type safety with comprehensive interfaces
- ✅ **Self-contained** - No external dependencies beyond React

## Customization

### Colors

Edit the CSS variables in `HeroSection.css`:

```css
/* Current gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your brand colors */
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
```

### Typography

Modify font sizes and weights in `HeroSection.css`:

```css
.hero-title {
  font-size: 3rem;        /* Adjust size */
  font-weight: 700;       /* Adjust weight */
}
```

### Layout

Adjust grid columns in `HeroSection.css`:

```css
.starter-packs-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  /* Change minmax value to adjust card width */
}
```

### Animations

Control animation timing in `HeroSection.css`:

```css
.nav-link {
  transition: background-color 200ms ease-in-out;
  /* Adjust duration: 100ms, 300ms, etc. */
}

.starter-pack-card {
  transition: transform 300ms ease-in-out;
  /* Adjust for faster/slower hover effects */
}
```

### Starter Pack Count

Simply pass different data to the component:

```typescript
// Show 3 packs
<HeroSection starterPacks={starterPacks.slice(0, 3)} />

// Show all packs
<HeroSection starterPacks={allStarterPacks} />

// Dynamic based on user preference
<HeroSection starterPacks={userSelectedPacks} />
```

## Component Props

### HeroSectionProps

```typescript
interface HeroSectionProps {
  starterPacks: StarterPack[];  // Array of starter pack objects
}
```

### StarterPack

```typescript
interface StarterPack {
  imageUrl: string;        // URL to the pack image
  linkUrl: string;         // URL to navigate on click
  title: string;           // Pack title (displayed below image)
  description?: string;    // Optional description
}
```

## Styling Architecture

The component uses **plain CSS** with the following approach:

- **No preprocessors** - Pure CSS for maximum compatibility
- **No CSS-in-JS** - Separate CSS file for clarity
- **BEM-inspired naming** - Clear, descriptive class names
- **No global styles** - All styles scoped to component classes
- **Responsive** - Works on desktop/laptop screens (as per requirements)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Modern browsers with CSS Grid support

## Accessibility Features

- **Semantic HTML** - Proper use of `<nav>`, `<section>`, `<a>` tags
- **ARIA labels** - Descriptive labels for screen readers
- **Keyboard navigation** - All interactive elements accessible via keyboard
- **Focus indicators** - Clear focus outlines for keyboard users
- **Alt text** - All images have descriptive alt attributes
- **Color contrast** - Sufficient contrast for text readability

## Troubleshooting

### Issue: Images not loading

**Solution:** Check that image URLs are valid and accessible:
```typescript
// The component handles errors automatically with fallback images
// But you can customize the fallback in utils.ts
export const FALLBACK_IMAGE_URL = 'your-custom-fallback-image.png';
```

### Issue: Animations not playing

**Solution:** Ensure the CSS file is properly imported:
```typescript
import './components/HeroSection.css';
```

### Issue: Grid layout not responsive

**Solution:** Check that the viewport meta tag is in your HTML:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Issue: TypeScript errors

**Solution:** Ensure all props match the interface:
```typescript
// Correct
<HeroSection starterPacks={validArray} />

// Incorrect - missing required properties
<HeroSection starterPacks={[{ imageUrl: 'test.jpg' }]} />
```

## Performance Considerations

- **Lazy loading** - Images use `loading="lazy"` attribute
- **Optimized animations** - Uses CSS transforms for better performance
- **Minimal rerenders** - Component only rerenders when props change
- **No layout shifts** - Fixed image container heights prevent CLS

## Future Enhancements

Consider adding these features:

1. **Search/Filter** - Allow users to search/filter starter packs
2. **Categories** - Group packs by technology/difficulty
3. **Favorites** - Let users bookmark their favorite packs
4. **Modal view** - Show detailed information in a modal
5. **Dark mode** - Toggle between light/dark themes
6. **Animations** - More sophisticated entrance animations
7. **Pagination** - Handle large numbers of starter packs

## Additional Resources

- [React Documentation](https://react.dev/) - Official React docs
- [MDN CSS Grid Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) - Learn about CSS Grid
- [Web Accessibility](https://www.w3.org/WAI/) - Accessibility guidelines
- [Unsplash](https://unsplash.com/) - Source for placeholder images

## License

MIT License - Feel free to use this in your projects.

---

**Built with ❤️ for Hackatbrown 2026**
