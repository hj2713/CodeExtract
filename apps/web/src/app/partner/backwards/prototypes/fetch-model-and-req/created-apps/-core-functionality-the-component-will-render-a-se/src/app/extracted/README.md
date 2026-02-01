# Hackathon Starter Packs Section

## What this demonstrates

This example demonstrates a responsive, interactive section for a hackathon landing page that displays starter pack options. It showcases how to build a styled-components based React component with navigation, interactive cards with hover effects, and responsive design that adapts from mobile to desktop layouts. The component uses static data but is structured to easily integrate with a CMS or API in the future.

## Original implementation

Based on the requirements for a hackathon landing page, this section implements:
- A navigation bar with links to different sections of the hackathon website
- A grid of starter pack cards that users can browse and select
- Hover effects for visual feedback
- Full responsive design from mobile to desktop
- MLH (Major League Hacking) branding integration

Key implementation approach:
- **Component structure**: Single page component with styled-components for all styling
- **Data architecture**: Separated data (utils.ts) from types (types.ts) for maintainability
- **Responsive design**: CSS Grid with media queries for mobile-first responsive behavior
- **User interaction**: Hover states on navigation and cards for clear interactivity

## Dependencies

### NPM packages required

- `styled-components` — Used for component-level CSS-in-JS styling with support for theming, pseudo-selectors, and media queries
- `react` — Core framework (included with Next.js)
- `next` — Next.js 14 App Router framework

To install styled-components:
```bash
npm install styled-components
npm install --save-dev @types/styled-components
```

Add to `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
}

module.exports = nextConfig
```

### Code ported from source

All code is created fresh based on requirements. No direct code ported from source repo.

### Mocked in this example

- **Starter pack data**: Hardcoded array of starter packs with Unsplash placeholder images
  - `STARTER_PACKS` in utils.ts contains 6 example packs (Web Dev, Mobile, AI/ML, Blockchain, IoT, Game Dev)

- **Navigation links**: Static array of internal anchor links
  - `NAVIGATION_LINKS` in utils.ts contains section navigation

- **Server actions**: Mock implementations in actions.ts
  - `fetchStarterPacks()` — Would fetch from database/CMS
  - `trackStarterPackClick()` — Would send analytics events

- **MLH Logo**: Uses official MLH CDN URL with fallback handling

## How to use

1. **Installation**:
   ```bash
   npm install styled-components
   npm install --save-dev @types/styled-components
   ```

2. **Configuration**: Update `next.config.js` to enable styled-components compiler (see above)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **View the page**: Navigate to `/extracted` in your browser

## Customization

### Adding new starter packs
Edit `utils.ts` and add new entries to the `STARTER_PACKS` array:

```typescript
{
  id: '7',
  title: 'Your Pack Name',
  imageSrc: 'https://your-image-url.com/image.jpg',
  link: '#your-pack',
}
```

### Changing the color scheme
The design uses the following color palette defined in the styled components:
- Primary: #FFFFFF (White)
- Secondary: #800080 (Purple)
- Background: #B2C4F3 (Light Blue)
- Text: #000000 (Black)
- Accent: #FFD700 (Gold)

Update these values in the styled components to match your brand.

### Making it dynamic
To connect to a real data source:

1. Replace the hardcoded `STARTER_PACKS` import with a call to `fetchStarterPacks()`
2. Make the page component async and await the data
3. Implement the actual database/CMS query in `actions.ts`

Example:
```typescript
export default async function StarterPacksPage() {
  const packs = await fetchStarterPacks();
  // ... rest of component
}
```

## Design Specifications

- **Typography**: Sans-serif font family
  - Headings: 32px / 700 weight
  - Body: 16px / 400 weight

- **Spacing**:
  - Padding: 20px
  - Gap: 10px-20px

- **Borders**:
  - Radius: 5px
  - Width: 1px
  - Color: #CCCCCC

- **Shadows**: `0 2px 4px rgba(0, 0, 0, 0.1)` for cards

## Responsive Breakpoints

- **Mobile**: < 768px — Stacked vertical layout
- **Tablet/Desktop**: ≥ 768px — Grid layout with auto-fit columns
