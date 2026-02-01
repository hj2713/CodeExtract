/**
 * Vision Analyzer - Analyzes screenshots/images to extract design specifications
 * Uses Gemini Vision API to understand UI components
 */

import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

// Schema for vision analysis results
const visionAnalysisSchema = z.object({
  componentType: z.string().describe("Type of component (Hero, Card, Button, Navigation, Form, etc.)"),
  description: z.string().describe("2-3 sentence description of what this component does"),
  
  layout: z.object({
    type: z.enum(["flex", "grid", "absolute", "block"]),
    direction: z.string().optional().describe("row, column, etc."),
    justifyContent: z.string().optional(),
    alignItems: z.string().optional(),
    gap: z.string().optional().describe("e.g., '1rem', '16px'"),
  }),
  
  colors: z.object({
    primary: z.string().describe("Primary color in hex"),
    secondary: z.string().optional().describe("Secondary color in hex"),
    background: z.string().describe("Background color or gradient"),
    text: z.string().describe("Main text color"),
    accent: z.string().optional().describe("Accent color for highlights"),
  }),
  
  typography: z.object({
    fontFamily: z.string().describe("e.g., 'Inter', 'system-ui'"),
    heading: z.object({
      size: z.string(),
      weight: z.string(),
      lineHeight: z.string().optional(),
    }).optional(),
    body: z.object({
      size: z.string(),
      weight: z.string(),
      lineHeight: z.string().optional(),
    }).optional(),
  }),
  
  spacing: z.object({
    padding: z.string().optional(),
    margin: z.string().optional(),
    gap: z.string().optional(),
  }),
  
  borders: z.object({
    width: z.string().optional(),
    color: z.string().optional(),
    radius: z.string().optional(),
    style: z.string().optional(),
  }).optional(),
  
  shadows: z.string().optional().describe("CSS box-shadow value"),
  
  interactions: z.array(z.object({
    trigger: z.enum(["hover", "click", "focus"]),
    effect: z.string().describe("Description of the effect"),
    timing: z.string().optional().describe("e.g., '200ms'"),
  })),
  
  animations: z.array(z.object({
    element: z.string(),
    type: z.string().describe("fade, slide, scale, rotate, etc."),
    duration: z.string(),
    timing: z.string().optional(),
  })),
  
  responsive: z.object({
    mobile: z.string().optional().describe("Mobile layout description"),
    tablet: z.string().optional(),
    desktop: z.string().optional(),
  }),
  
  accessibility: z.object({
    ariaLabels: z.array(z.string()).optional(),
    keyboardNav: z.string().optional(),
  }),
  
  assets: z.array(z.object({
    type: z.enum(["icon", "image", "illustration", "logo"]),
    description: z.string(),
    purpose: z.string().optional(),
    fallback: z.string().optional(),
  })),
  
  // Inferred technical specs
  inferredTechStack: z.object({
    framework: z.string().default("react"),
    styling: z.string().describe("tailwind, css-modules, styled-components"),
    dependencies: z.array(z.string()).describe("Suggested npm packages"),
  }),
});

export type VisionAnalysisResult = z.infer<typeof visionAnalysisSchema>;

/**
 * Analyzes an image/screenshot to extract detailed design specifications
 */
export async function analyzeImage(imageBase64: string): Promise<VisionAnalysisResult> {
  const model = google("gemini-2.0-flash");
  
  const prompt = `You are a world-class UI/UX designer and senior frontend engineer with 15+ years of experience. Analyze this UI component screenshot with EXTREME precision to extract every design specification needed for pixel-perfect recreation.

## YOUR MISSION
Extract EVERY visual detail as if you're reverse-engineering a production component. The output will be used by developers to recreate this EXACT component from scratch without seeing the original.

## DETAILED ANALYSIS REQUIREMENTS

### 1. COMPONENT IDENTIFICATION
- **Primary Type**: Hero, Card, Button, Navigation, Form, Modal, Sidebar, Table, List, Carousel, Accordion, Tabs, Toast, Tooltip, Dropdown, Avatar, Badge, Breadcrumb, Pagination, Progress, Skeleton, etc.
- **Variant**: Primary/Secondary/Tertiary, Filled/Outlined/Ghost, Size variants
- **State Visible**: Default, Hover, Active, Disabled, Loading, Error, Success
- **Composition**: Is this a single component or composed of multiple sub-components?

### 2. LAYOUT ARCHITECTURE
- **Container Model**: Flexbox or CSS Grid? Identify the exact structure
- **Flex Properties**: direction (row/column/row-reverse/column-reverse), wrap behavior, justify-content (start/center/end/space-between/space-around/space-evenly), align-items, align-content
- **Grid Properties**: columns/rows count, template areas, auto-fit/auto-fill, minmax values
- **Positioning**: relative/absolute/fixed/sticky elements, z-index layering
- **Dimensions**: width (fixed/percentage/auto/min-max), height, aspect-ratio
- **Overflow**: visible/hidden/scroll/auto, text-overflow behavior

### 3. COLOR EXTRACTION (Be EXACT with hex values)
- **Background**: Solid color (#RRGGBB), gradient (direction, color stops with percentages), or image overlay
- **Text Colors**: Primary text, secondary/muted text, links, headings vs body
- **Border Colors**: All border colors visible
- **Shadow Colors**: Box-shadow and drop-shadow colors (include alpha values like rgba)
- **State Colors**: Hover states, focus rings, active states, disabled states
- **Accent/Brand Colors**: CTAs, highlights, decorative elements
- **Semantic Colors**: Success (#22C55E), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6) if present

### 4. TYPOGRAPHY (Be specific)
- **Font Family**: Identify the typeface (Inter, SF Pro, Roboto, Open Sans, Poppins, etc.) or suggest closest match
- **Font Stack**: Include fallbacks (e.g., "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
- **Headings**: For each heading level - size (px/rem), weight (100-900), line-height, letter-spacing, text-transform
- **Body Text**: Size, weight, line-height, paragraph spacing
- **Labels/Captions**: Smaller text specifications
- **Special Text**: Code blocks (monospace), quotes, emphasized text
- **Text Effects**: text-shadow, gradients on text, truncation with ellipsis

### 5. SPACING SYSTEM (Use rem, reference 1rem = 16px)
- **Padding**: Top, Right, Bottom, Left (or shorthand) for each container
- **Margin**: External spacing between elements
- **Gap**: Flexbox/Grid gap between children
- **Section Spacing**: Vertical rhythm between content blocks
- **Infer the scale**: Is it using 4px/8px system? Tailwind's spacing scale? Custom?

### 6. BORDERS & OUTLINES
- **Border Width**: 1px, 2px, etc. for each side
- **Border Style**: solid, dashed, dotted, double
- **Border Color**: Exact hex values
- **Border Radius**: Each corner (top-left, top-right, bottom-right, bottom-left), or shorthand
- **Common Values**: sm (0.125rem), md (0.375rem), lg (0.5rem), xl (0.75rem), 2xl (1rem), full (9999px)
- **Focus Outlines**: Ring width, color, offset

### 7. SHADOWS & EFFECTS
- **Box Shadow**: Full CSS value (offset-x offset-y blur spread color), multiple shadows if layered
- **Drop Shadow**: For non-rectangular elements
- **Elevation Levels**: xs, sm, md, lg, xl, 2xl - describe the shadow intensity
- **Backdrop Effects**: blur, brightness, saturation (backdrop-filter)
- **Opacity/Transparency**: Any semi-transparent layers

### 8. INTERACTIONS (Infer from visual cues)
- **Hover Effects**: Color changes, scale transforms, shadow elevation, underlines
- **Click/Active**: Pressed state appearance, scale down, color darken
- **Focus**: Focus ring styling, outline offset
- **Transitions**: Which properties animate? Duration (150ms, 200ms, 300ms), easing function (ease, ease-in-out, cubic-bezier)
- **Cursor**: pointer, default, not-allowed, grab, etc.

### 9. ANIMATIONS (If visible or inferable)
- **Entry Animations**: fade-in, slide-up, scale, bounce
- **Micro-interactions**: Button press, toggle switch, checkbox tick
- **Loading States**: Skeleton pulse, spinner rotation, shimmer effect
- **Scroll Animations**: Parallax, reveal on scroll
- **Duration & Timing**: Specify milliseconds and easing curves

### 10. RESPONSIVE DESIGN (Infer adaptations)
- **Breakpoints**: How would this change at mobile (<640px), tablet (640-1024px), desktop (>1024px)?
- **Layout Shifts**: Stack on mobile, side-by-side on desktop?
- **Typography Scaling**: Smaller headings on mobile?
- **Visibility Changes**: Elements hidden/shown at breakpoints?
- **Touch Targets**: Minimum 44x44px on mobile?

### 11. ACCESSIBILITY CONSIDERATIONS
- **Color Contrast**: Does text meet WCAG AA (4.5:1) or AAA (7:1)?
- **Focus Indicators**: Visible keyboard focus states
- **ARIA Requirements**: Labels, roles, states needed
- **Semantic HTML**: Appropriate element choices (button vs div, nav, article, etc.)
- **Screen Reader Text**: Any visually hidden but announced text needed?

### 12. ASSETS & MEDIA
- **Icons**: Style (outline/solid/duotone), size, library suggestion (Lucide, Heroicons, Phosphor, Feather)
- **Images**: Dimensions, aspect ratio, object-fit, placeholder/fallback strategy
- **Illustrations**: Style description, purpose, SVG vs raster
- **Logos**: Placement, sizing, spacing requirements
- **Decorative Elements**: Shapes, patterns, gradients, blurs

### 13. TECHNICAL IMPLEMENTATION
- **Framework**: React/Next.js/Vue/Svelte patterns
- **Styling Approach**: Tailwind CSS classes, CSS Modules, Styled Components, or vanilla CSS
- **Component Structure**: Props interface, variants, compound components
- **Dependencies**: Suggest specific npm packages (e.g., @radix-ui/react-dialog, framer-motion, lucide-react)
- **Design System Compatibility**: shadcn/ui, Chakra, MUI equivalents if applicable

## OUTPUT QUALITY REQUIREMENTS
- Be PRECISE with values - no approximations like "about 16px", give exact values
- Use standard CSS units consistently (rem for spacing, px for borders/shadows)
- For colors, ALWAYS provide hex codes, never color names
- Consider dark mode implications if the design suggests it
- Think about edge cases: long text, missing images, empty states
- Prioritize maintainability and scalability in your recommendations

Analyze the image NOW with this level of detail.`;

  const result = await generateObject({
    model,
    schema: visionAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageBase64,
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  return result.object;
}

/**
 * Generates a comprehensive, detailed analysis markdown from vision results using LLM
 * This creates a rich, human-readable document that captures every nuance
 */
export async function generateVisualAnalysisMarkdownLLM(
  analysis: VisionAnalysisResult,
  imageBase64?: string
): Promise<string> {
  const model = google("gemini-2.0-flash");
  
  const structuredData = JSON.stringify(analysis, null, 2);
  
  const prompt = `You are a senior technical writer and UI/UX expert. Create an EXTREMELY DETAILED ANALYSIS.md document that will serve as the complete blueprint for recreating this UI component.

## STRUCTURED ANALYSIS DATA (from vision analysis)
\`\`\`json
${structuredData}
\`\`\`

## YOUR TASK
Transform this structured data into a comprehensive, beautifully formatted Markdown document that:

1. **Expands on every detail** - Don't just list values, explain their significance and how they work together
2. **Provides implementation guidance** - Include actual code snippets, CSS values, and Tailwind classes
3. **Captures the design philosophy** - Explain WHY certain design choices were made
4. **Includes edge cases** - What happens with long text, missing data, error states?
5. **Is production-ready** - A developer should be able to recreate this component from this document alone

## REQUIRED SECTIONS (Include ALL of these with rich detail)

### 1. Executive Summary
- Component name and purpose
- Key value proposition
- Target use cases
- Complexity rating (Simple/Medium/Complex)

### 2. Visual Design Breakdown
- Detailed description of what the user sees
- Visual hierarchy explanation
- Focal points and user attention flow
- Whitespace and breathing room analysis

### 3. Layout Architecture
- Container strategy (Flexbox/Grid analysis)
- Exact CSS properties with values
- Tailwind CSS equivalent classes
- Responsive layout transformations
- Code example:
\`\`\`css
/* Example CSS */
.container {
  display: flex;
  /* ... */
}
\`\`\`

### 4. Color System
- Complete color palette with hex codes
- Color relationships (primary, secondary, accent)
- Semantic color usage (success, error, warning, info)
- Dark mode considerations
- WCAG contrast compliance notes
- CSS custom properties format:
\`\`\`css
:root {
  --color-primary: #...;
}
\`\`\`

### 5. Typography Scale
- Font family with complete fallback stack
- Type scale (h1 through body/caption)
- Line heights and letter spacing
- Font weights used
- Text styling (transforms, decorations)
- Tailwind typography classes

### 6. Spacing & Dimensions
- Padding values (all sides)
- Margin values
- Gap values for flex/grid
- Width/height constraints (min, max, fixed)
- Spacing scale system (4px, 8px, 12px, 16px, etc.)

### 7. Borders & Corners
- Border widths per side
- Border colors
- Border styles
- Border radius values
- When borders appear (states, variants)

### 8. Shadows & Depth
- Box shadow CSS values
- Shadow layering technique
- Elevation levels
- Backdrop effects (blur, filters)

### 9. Interactive States
- Default state styling
- Hover state changes (with transitions)
- Active/pressed state
- Focus state (accessibility)
- Disabled state
- Loading state
- Include CSS for each:
\`\`\`css
.button:hover {
  /* transition details */
}
\`\`\`

### 10. Animations & Micro-interactions
- Entry/exit animations
- State transition animations
- Loading animations
- Timing functions and durations
- Keyframe definitions if needed

### 11. Responsive Behavior
- Mobile layout (< 640px)
- Tablet layout (640px - 1024px)
- Desktop layout (> 1024px)
- What changes at each breakpoint
- Media query examples

### 12. Accessibility Checklist
- [ ] Color contrast ratios (AA/AAA)
- [ ] Focus indicators
- [ ] ARIA labels needed
- [ ] Keyboard navigation
- [ ] Screen reader considerations
- [ ] Reduced motion preferences

### 13. Assets & Dependencies
- Icons required (with library suggestions)
- Images (dimensions, aspect ratios, fallbacks)
- External fonts to load
- NPM packages recommended

### 14. Implementation Blueprint

#### Props Interface (TypeScript)
\`\`\`typescript
interface ComponentProps {
  // Define all props
}
\`\`\`

#### Component Structure (JSX outline)
\`\`\`tsx
// Pseudo-code structure
<Container>
  <Header />
  <Content />
  <Footer />
</Container>
\`\`\`

#### Tailwind Classes Reference
\`\`\`
container: "flex flex-col gap-4 p-6 bg-white rounded-xl shadow-lg"
heading: "text-2xl font-bold text-gray-900"
// etc.
\`\`\`

### 15. Variants & Customization
- Size variants (sm, md, lg)
- Color variants (primary, secondary, ghost)
- State variants
- Custom theming points

### 16. Common Pitfalls & Tips
- Edge cases to handle
- Performance considerations
- Browser compatibility notes
- Testing recommendations

### 17. Related Patterns
- Similar components to reference
- Design system placement
- Composition with other components

---

## FORMATTING REQUIREMENTS
- Use proper Markdown headers (##, ###, ####)
- Include code blocks with syntax highlighting
- Use tables for comparisons
- Use bullet points and numbered lists
- Include emoji for visual scanning (📐 📏 🎨 ✨ 🔧)
- Make it scannable with clear sections
- Be thorough - err on the side of MORE detail, not less

Generate the complete ANALYSIS.md document now. Make it comprehensive enough that a developer could recreate this component pixel-perfectly without ever seeing the original image.`;

  const result = await generateText({
    model,
    messages: [
      ...(imageBase64 ? [{
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            image: imageBase64,
          },
          {
            type: "text" as const,
            text: prompt,
          },
        ],
      }] : [{
        role: "user" as const,
        content: prompt,
      }]),
    ],
  });

  return result.text;
}

/**
 * Generates a basic analysis markdown from vision results (fallback/quick version)
 */
export function generateVisualAnalysisMarkdown(analysis: VisionAnalysisResult): string {
  return `# Visual Component Analysis

## Component Overview
**Type:** ${analysis.componentType}
**Description:** ${analysis.description}

## Design Specifications

### Layout
- **Type:** ${analysis.layout.type}
- **Direction:** ${analysis.layout.direction || 'N/A'}
- **Justify:** ${analysis.layout.justifyContent || 'N/A'}
- **Align:** ${analysis.layout.alignItems || 'N/A'}
- **Gap:** ${analysis.layout.gap || 'N/A'}

### Color Palette
- **Primary:** ${analysis.colors.primary}
- **Secondary:** ${analysis.colors.secondary || 'N/A'}
- **Background:** ${analysis.colors.background}
- **Text:** ${analysis.colors.text}
- **Accent:** ${analysis.colors.accent || 'N/A'}

### Typography
- **Font Family:** ${analysis.typography.fontFamily}
${analysis.typography.heading ? `- **Heading:** ${analysis.typography.heading.size} / ${analysis.typography.heading.weight}` : ''}
${analysis.typography.body ? `- **Body:** ${analysis.typography.body.size} / ${analysis.typography.body.weight}` : ''}

### Spacing
- **Padding:** ${analysis.spacing.padding || 'N/A'}
- **Margin:** ${analysis.spacing.margin || 'N/A'}
- **Gap:** ${analysis.spacing.gap || 'N/A'}

${analysis.borders ? `### Borders
- **Radius:** ${analysis.borders.radius || 'N/A'}
- **Color:** ${analysis.borders.color || 'N/A'}
- **Width:** ${analysis.borders.width || 'N/A'}
` : ''}

${analysis.shadows ? `### Shadows
\`${analysis.shadows}\`
` : ''}

## Interactions
${analysis.interactions.length > 0 ? analysis.interactions.map(i => 
  `- **${i.trigger}:** ${i.effect}${i.timing ? ` (${i.timing})` : ''}`
).join('\n') : 'No interactions detected'}

## Animations
${analysis.animations.length > 0 ? analysis.animations.map(a => 
  `- **${a.element}:** ${a.type} - ${a.duration}`
).join('\n') : 'No animations detected'}

## Responsive Behavior
- **Mobile:** ${analysis.responsive.mobile || 'Not specified'}
- **Tablet:** ${analysis.responsive.tablet || 'Not specified'}
- **Desktop:** ${analysis.responsive.desktop || 'Not specified'}

## Assets Required
${analysis.assets.length > 0 ? analysis.assets.map(a => 
  `- **${a.type}:** ${a.description}${a.fallback ? ` (fallback: ${a.fallback})` : ''}`
).join('\n') : 'No assets required'}

## Suggested Implementation
- **Framework:** ${analysis.inferredTechStack.framework}
- **Styling:** ${analysis.inferredTechStack.styling}
- **Dependencies:** ${analysis.inferredTechStack.dependencies.join(', ')}
`;
}
