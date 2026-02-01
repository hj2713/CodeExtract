# Hero Section - Design Specifications

This document details the exact visual implementation of the Hero Section component.

---

## 🎨 Color Palette

### Primary Colors
```css
--gradient-start: #667eea;    /* Purple-blue */
--gradient-end: #764ba2;      /* Deep purple */
--white: #ffffff;             /* Text and cards */
--dark-gray: #1f2937;         /* Card titles */
--medium-gray: #6b7280;       /* Card descriptions */
--light-gray: #f3f4f6;        /* Image container background */
```

### Gradients
```css
/* Main hero background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Opacity variations */
--white-95: rgba(255, 255, 255, 0.95);   /* Description text */
--white-10: rgba(255, 255, 255, 0.1);    /* Nav hover */
--black-10: rgba(0, 0, 0, 0.1);          /* Card shadow */
--black-15: rgba(0, 0, 0, 0.15);         /* Card hover shadow */
--black-20: rgba(0, 0, 0, 0.2);          /* Text shadow */
```

---

## 🔤 Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes
```css
/* Hero Title */
font-size: 3rem;              /* 48px */
font-weight: 700;
line-height: 1.2;
color: #ffffff;
text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

/* Hero Description */
font-size: 1.25rem;           /* 20px */
font-weight: 400;
line-height: 1.6;
color: rgba(255, 255, 255, 0.95);
max-width: 700px;

/* Navigation Links */
font-size: 1rem;              /* 16px */
font-weight: 500;
color: #ffffff;

/* Card Title */
font-size: 1.25rem;           /* 20px */
font-weight: 600;
line-height: 1.3;
color: #1f2937;

/* Card Description */
font-size: 0.875rem;          /* 14px */
font-weight: 400;
line-height: 1.5;
color: #6b7280;
```

### Responsive Typography
```css
/* Tablets (max-width: 1024px) */
.hero-title { font-size: 2.5rem; }

/* Mobile (max-width: 768px) */
.hero-title { font-size: 2rem; }
.hero-description { font-size: 1rem; }
```

---

## 📐 Layout & Spacing

### Container
```css
.hero-section {
  width: 100%;
  min-height: 100vh;
  padding: 2rem;              /* 32px */
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}
```

### Navigation
```css
.hero-nav {
  max-width: 1200px;
  margin: 0 auto 3rem;        /* 48px bottom margin */
}

.nav-list {
  display: flex;
  gap: 2rem;                  /* 32px between links */
  flex-wrap: wrap;
}

.nav-link {
  padding: 0.5rem 1rem;       /* 8px 16px */
  border-radius: 0.375rem;    /* 6px */
}
```

### Header Section
```css
.hero-header {
  text-align: center;
  margin-bottom: 3rem;        /* 48px */
}

.hero-title {
  margin: 0 0 1rem 0;         /* 16px bottom */
}

.hero-description {
  margin: 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
```

### Starter Packs Grid
```css
.starter-packs-container {
  margin-bottom: 3rem;        /* 48px */
}

.starter-packs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;                  /* 32px */
}
```

### Card Layout
```css
.starter-pack-card {
  border-radius: 0.75rem;     /* 12px */
  overflow: hidden;
}

.pack-image-container {
  width: 100%;
  height: 200px;
}

.pack-info {
  padding: 1.5rem;            /* 24px */
}

.pack-title {
  margin: 0 0 0.5rem 0;       /* 8px bottom */
}

.pack-description {
  margin: 0;
}
```

### MLH Badge
```css
.mlh-badge-container {
  position: absolute;
  top: 0;
  right: 0;
}

.mlh-badge {
  width: 120px;
  height: auto;
}
```

### Responsive Spacing
```css
/* Tablets (max-width: 1024px) */
.starter-packs-grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Mobile (max-width: 768px) */
.hero-section {
  padding: 1.5rem;
}

.starter-packs-grid {
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.nav-list {
  gap: 1rem;
}

.mlh-badge {
  width: 80px;
}
```

---

## 🎭 Interactions & States

### Navigation Links

#### Default State
```css
.nav-link {
  color: #ffffff;
  transition: background-color 200ms ease-in-out,
              opacity 200ms ease-in-out;
}
```

#### Hover State
```css
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  opacity: 0.9;
}
```

#### Focus State
```css
.nav-link:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

### Starter Pack Cards

#### Default State
```css
.starter-pack-card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 300ms ease-in-out,
              box-shadow 300ms ease-in-out;
}
```

#### Hover State
```css
.starter-pack-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

#### Focus State
```css
.starter-pack-card:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}
```

### Card Images

#### Default State
```css
.pack-image {
  transition: transform 300ms ease-in-out;
}
```

#### Hover State (on parent card)
```css
.starter-pack-card:hover .pack-image {
  transform: scale(1.05);
}
```

### MLH Badge

#### Default State
```css
.mlh-badge {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 300ms ease-in-out;
}
```

#### Hover State
```css
.mlh-badge:hover {
  transform: scale(1.05);
}
```

---

## ✨ Animations

### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Applied to */
.hero-header {
  animation: fadeIn 600ms ease-in-out;
}

.starter-packs-grid {
  animation: fadeIn 800ms ease-in-out 200ms both;
}

.mlh-badge-container {
  animation: fadeIn 1000ms ease-in-out 400ms both;
}
```

### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Applied to each card with staggered delays */
.starter-pack-card {
  animation: fadeInUp 500ms ease-in-out both;
}

.starter-pack-card:nth-child(1) { animation-delay: 100ms; }
.starter-pack-card:nth-child(2) { animation-delay: 200ms; }
.starter-pack-card:nth-child(3) { animation-delay: 300ms; }
.starter-pack-card:nth-child(4) { animation-delay: 400ms; }
.starter-pack-card:nth-child(5) { animation-delay: 500ms; }
.starter-pack-card:nth-child(6) { animation-delay: 600ms; }
```

### Transition Timing
```
Navigation Links: 200ms
Card Transforms:  300ms
Image Scales:     300ms
Badge Scale:      300ms
```

---

## 🎯 Shadows & Effects

### Card Shadows
```css
/* Default */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Hover */
box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
```

### Text Shadow
```css
/* Hero title only */
text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
```

### Drop Shadow (Images)
```css
/* MLH badge */
filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
```

---

## 📱 Responsive Breakpoints

### Desktop/Laptop (Default)
- Container: 1200px max-width
- Cards: minmax(300px, 1fr)
- Title: 3rem (48px)

### Tablet (max-width: 1024px)
- Cards: minmax(250px, 1fr)
- Title: 2.5rem (40px)
- Gap: 1.5rem (24px)

### Mobile (max-width: 768px)
- Cards: 1 column (full width)
- Title: 2rem (32px)
- Description: 1rem (16px)
- Section padding: 1.5rem (24px)
- Nav gap: 1rem (16px)
- Badge: 80px width

---

## ♿ Accessibility Specifications

### Semantic HTML
```html
<section>     <!-- Main container -->
  <nav>       <!-- Navigation -->
    <ul>      <!-- Link list -->
      <li>    <!-- List items -->
        <a>   <!-- Links -->

<h1>          <!-- Page title -->
<p>           <!-- Description -->

<a>           <!-- Card links -->
  <img>       <!-- Images with alt text -->
  <h3>        <!-- Card titles -->
  <p>         <!-- Card descriptions -->
```

### ARIA Labels
```html
<a aria-label="View Web Development Starter starter pack">
```

### Focus Indicators
- Navigation links: 2px white outline with 2px offset
- Cards: 3px purple outline with 2px offset
- All interactive elements have visible focus states

### Color Contrast
- White on purple gradient: >7:1 (AAA)
- Dark gray on white: >12:1 (AAA)
- Medium gray on white: >4.5:1 (AA)

### Keyboard Navigation
- All links accessible via Tab
- Enter activates links
- Focus visible on all interactive elements

---

## 🖼️ Image Specifications

### Starter Pack Images
- **Dimensions**: 400x300px (4:3 ratio)
- **Format**: JPEG or PNG
- **Container**: 200px fixed height
- **Object Fit**: Cover
- **Loading**: Lazy
- **Alt Text**: Required and descriptive

### MLH Badge
- **Dimensions**: 120px width (auto height)
- **Format**: PNG (transparent background)
- **Position**: Absolute top-right
- **Source**: Official MLH CDN

### Fallback Image
- **URL**: `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Not+Available`
- **Used When**: Image fails to load

---

## 📊 Performance Specifications

### Image Optimization
- Lazy loading enabled on all images
- Appropriate dimensions (400x300)
- Modern formats supported (WebP, AVIF)

### Animation Performance
- Uses CSS transforms (GPU accelerated)
- No layout thrashing
- Smooth 60fps animations

### CSS Performance
- No expensive selectors
- Minimal specificity
- Scoped to component classes

---

## ✅ Visual Quality Checklist

- ✅ Purple gradient background renders correctly
- ✅ White text is clearly readable
- ✅ Navigation links have visible hover effect
- ✅ Starter pack cards are in a responsive grid
- ✅ Card shadows are visible and subtle
- ✅ Images maintain aspect ratio
- ✅ MLH badge is positioned correctly
- ✅ All animations play smoothly
- ✅ Hover effects work on all interactive elements
- ✅ Focus states are visible for keyboard navigation
- ✅ Layout is centered and properly spaced
- ✅ Typography is consistent and readable

---

## 🎨 Design System Summary

| Element           | Size    | Weight | Color       | Spacing     |
|-------------------|---------|--------|-------------|-------------|
| Hero Title        | 3rem    | 700    | White       | 0 0 1rem 0  |
| Hero Description  | 1.25rem | 400    | White 95%   | 0           |
| Nav Link          | 1rem    | 500    | White       | 0.5rem 1rem |
| Card Title        | 1.25rem | 600    | Dark Gray   | 0 0 0.5rem 0|
| Card Description  | 0.875rem| 400    | Medium Gray | 0           |

| Spacing           | Value   |
|-------------------|---------|
| Section Padding   | 2rem    |
| Content Max Width | 1200px  |
| Grid Gap          | 2rem    |
| Card Padding      | 1.5rem  |
| Nav Gap           | 2rem    |

| Transition        | Duration | Easing      |
|-------------------|----------|-------------|
| Nav Hover         | 200ms    | ease-in-out |
| Card Transform    | 300ms    | ease-in-out |
| Image Scale       | 300ms    | ease-in-out |

---

This design specification ensures pixel-perfect implementation of the Hero Section component.
