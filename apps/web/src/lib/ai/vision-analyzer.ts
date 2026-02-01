/**
 * Vision Analyzer - Analyzes screenshots/images to extract design specifications
 * Uses Gemini Vision API to understand UI components
 */

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
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
  
  const prompt = `Analyze this UI component screenshot and extract detailed design specifications.

You are an expert UI/UX designer and frontend developer. Your job is to extract EVERY detail needed to recreate this component pixel-perfect.

Look for:
1. **Component Type**: What kind of UI component is this? (Hero, Card, Button, Navigation, Form, Modal, etc.)
2. **Layout**: How are elements arranged? (flex, grid, spacing, alignment)
3. **Colors**: Extract EXACT hex values for all colors visible
4. **Typography**: Font family, sizes, weights, line heights
5. **Spacing**: Padding, margins, gaps between elements
6. **Borders & Shadows**: Border radius, colors, box shadows
7. **Interactions**: What hover/click/focus effects might this have?
8. **Animations**: Any visible motion or transitions?
9. **Responsiveness**: How might this adapt to different screen sizes?
10. **Assets**: Icons, images, illustrations - describe them

Be EXTREMELY detailed. This specification will be used to recreate the component from scratch.

For colors, be specific with hex values. For spacing, use rem or px values. For typography, identify the likely font family or suggest alternatives.`;

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
 * Generates a detailed analysis markdown from vision results
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
