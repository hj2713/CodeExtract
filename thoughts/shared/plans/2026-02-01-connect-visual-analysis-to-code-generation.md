# Plan: Connect Visual Analysis to Code Generation

**Date**: 2026-02-01
**Status**: Pending implementation

## Problem

When a requirement comes from a visual source (screenshot/live_url), the rich `visionAnalysis` data (colors, typography, layout, spacing, borders, etc.) is NOT passed to Claude during code extraction. Claude only receives the requirement text and context, missing critical design specifications.

### Current Flow
1. Screenshot → Gemini Vision → `visionAnalysis` stored in `sources` table
2. Requirement created with `sourceId` reference
3. `queueExtractionJob()` reads requirement + context
4. Prompt template only has `{{VARIABLE_REQUIREMENT}}` and `{{VARIABLE_CONTEXT}}`
5. Claude generates code **without** knowing the extracted colors, typography, layout specs

### The Gap
The `visionAnalysis` field contains rich structured data that is completely ignored during code generation.

---

## Solution Overview

Modify `queueExtractionJob()` to detect visual sources, fetch the `visionAnalysis` data, and inject it into the prompt via a new template variable `{{VARIABLE_VISUAL_SPECS}}`.

---

## Implementation Steps

### Step 1: Extend Job Payload Type

**File**: `apps/web/src/app/partner/backwards/prototypes/jobs-queue/queue/types.ts`

Add optional visual fields to `ClaudeExtractionPayload`:

```typescript
export type ClaudeExtractionPayload = {
  type: "claude_extraction";
  name: string;
  prompt: string;
  targetPath: string | null;
  originUrl: string | null;
  requirementId: string;
  promptHash: string;
  // NEW: Visual context for screenshot/live_url sources
  visionAnalysis?: {
    componentType: string;
    description: string;
    layout: { type: string; direction?: string; alignment?: string; gap?: string };
    colors: { primary: string; secondary?: string; background: string; text: string; accent?: string };
    typography: { fontFamily: string; heading?: { size: string; weight: string }; body?: { size: string; weight: string } };
    spacing: { padding?: string; margin?: string; gap?: string };
    borders?: { width?: string; color?: string; radius?: string };
    shadows?: string;
    interactions: Array<{ trigger: string; effect: string; timing?: string }>;
    animations: Array<{ element: string; type: string; duration: string }>;
    responsive: { mobile?: string; tablet?: string; desktop?: string };
    accessibility: { ariaLabels?: string[]; keyboardNav?: string };
    assets: Array<{ type: string; description: string; fallback?: string }>;
  } | null;
  analysisMarkdown?: string | null;
  inputType?: "github" | "screenshot" | "live_url";
};
```

### Step 2: Create Visual Specs Formatter

**File**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/actions.ts`

Add helper function:

```typescript
function formatVisualSpecs(analysis: NonNullable<Source['visionAnalysis']>): string {
  return `
## Visual Design Specifications

**Component Type:** ${analysis.componentType}
**Description:** ${analysis.description}

### Layout
- Type: ${analysis.layout.type}
- Direction: ${analysis.layout.direction || 'N/A'}
- Alignment: ${analysis.layout.alignment || 'N/A'}
- Gap: ${analysis.layout.gap || 'N/A'}

### Color Palette
- Primary: ${analysis.colors.primary}
- Secondary: ${analysis.colors.secondary || 'N/A'}
- Background: ${analysis.colors.background}
- Text: ${analysis.colors.text}
- Accent: ${analysis.colors.accent || 'N/A'}

### Typography
- Font Family: ${analysis.typography.fontFamily}
${analysis.typography.heading ? `- Heading: ${analysis.typography.heading.size} / ${analysis.typography.heading.weight}` : ''}
${analysis.typography.body ? `- Body: ${analysis.typography.body.size} / ${analysis.typography.body.weight}` : ''}

### Spacing
- Padding: ${analysis.spacing.padding || 'N/A'}
- Margin: ${analysis.spacing.margin || 'N/A'}
- Gap: ${analysis.spacing.gap || 'N/A'}

${analysis.borders ? `### Borders
- Radius: ${analysis.borders.radius || 'N/A'}
- Color: ${analysis.borders.color || 'N/A'}
- Width: ${analysis.borders.width || 'N/A'}` : ''}

${analysis.shadows ? `### Shadows
\`${analysis.shadows}\`` : ''}

### Assets
${analysis.assets.length > 0 ? analysis.assets.map(a => `- ${a.type}: ${a.description}`).join('\n') : 'None'}

### Interactions
${analysis.interactions.length > 0 ? analysis.interactions.map(i => `- ${i.trigger}: ${i.effect}`).join('\n') : 'None'}

### Responsive Behavior
- Mobile: ${analysis.responsive.mobile || 'N/A'}
- Tablet: ${analysis.responsive.tablet || 'N/A'}
- Desktop: ${analysis.responsive.desktop || 'N/A'}
`;
}
```

### Step 3: Modify queueExtractionJob()

**File**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/actions.ts`

Update the function (around lines 139-208):

```typescript
export async function queueExtractionJob(requirementId: string): Promise<{
  success: boolean;
  job?: Job;
  error?: string;
}> {
  try {
    // Get the requirement
    const [requirement] = await db
      .select()
      .from(requirements)
      .where(eq(requirements.id, requirementId));

    if (!requirement) {
      return { success: false, error: "Requirement not found" };
    }

    // Check if requirement already has a job
    if (requirement.jobId) {
      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, requirement.jobId));
      if (existingJob) {
        return { success: true, job: existingJob };
      }
    }

    // Get the source - NOW including visual fields
    const [source] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, requirement.sourceId));

    const originUrl = source?.originUrl ?? null;
    const isVisualSource = source?.inputType === "screenshot" || source?.inputType === "live_url";

    // Read the prompt template and replace placeholders
    const templatePath = getPromptTemplatePath();
    const template = await fs.readFile(templatePath, "utf-8");

    // Build visual specs section (only for visual sources)
    let visualSpecsSection = "";
    if (isVisualSource && source?.visionAnalysis) {
      visualSpecsSection = formatVisualSpecs(source.visionAnalysis);
    }

    const promptHash = hashString(prompt);
    const name = slugify(requirement.requirement);

    const prompt = template
      .replace("{{VARIABLE_REQUIREMENT}}", requirement.requirement)
      .replace("{{VARIABLE_CONTEXT}}", requirement.context ?? "")
      .replace("{{VARIABLE_VISUAL_SPECS}}", visualSpecsSection);

    const payload: ClaudeExtractionPayload = {
      type: "claude_extraction",
      name,
      prompt,
      targetPath: null,
      originUrl,
      requirementId: requirement.id,
      promptHash,
      // Visual context (null for GitHub sources)
      visionAnalysis: isVisualSource ? source.visionAnalysis : null,
      analysisMarkdown: isVisualSource ? source.analysisMarkdown : null,
      inputType: source?.inputType ?? "github",
    };

    // Enqueue the job with idempotency key based on requirement ID
    const job = await enqueue(payload, {
      idempotencyKey: `extraction-${requirement.id}`,
    });

    // Link the job to the requirement
    await db
      .update(requirements)
      .set({ jobId: job.id })
      .where(eq(requirements.id, requirementId));

    return { success: true, job };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### Step 4: Update Prompt Template

**File**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/prompt-template.md`

Add the placeholder after source info:

```markdown
## Source

**Path:** src/source
**Analysis:**
this was cloned from github. this is a landing page

{{VARIABLE_VISUAL_SPECS}}

## Target Directory
...
```

### Step 5: Update Worker (Optional Enhancement)

**File**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/worker-main.ts`

Before running Claude, write `VISUAL_ANALYSIS.md` to the extracted folder:

```typescript
// Before Claude runs (around line 280)
if (payload.inputType !== "github" && payload.analysisMarkdown) {
  const analysisPath = path.join(extractedDir, "VISUAL_ANALYSIS.md");
  await fs.writeFile(analysisPath, payload.analysisMarkdown, "utf-8");
  progress.logs += `Wrote VISUAL_ANALYSIS.md\n`;
  await updateJobProgress(progress);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/app/partner/backwards/prototypes/jobs-queue/queue/types.ts` | Add visual fields to payload type |
| `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/actions.ts` | Add `formatVisualSpecs()`, modify `queueExtractionJob()` |
| `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/prompt-template.md` | Add `{{VARIABLE_VISUAL_SPECS}}` placeholder |
| `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/worker-main.ts` | (Optional) Write VISUAL_ANALYSIS.md |

---

## Backwards Compatibility

- **GitHub sources**: `visionAnalysis` will be `null`, `{{VARIABLE_VISUAL_SPECS}}` will be empty string
- **Existing jobs**: Won't have new fields, worker handles `undefined` gracefully
- **No database migration needed**

---

## Verification

1. **Test visual source flow**:
   - Go to `/himanshu`, upload a screenshot
   - Complete interview, save requirement
   - Navigate to `/partner/backwards/prototypes/fetch-model-and-req`
   - Queue the extraction job
   - Verify job payload contains `visionAnalysis` data
   - Verify prompt includes visual specs section

2. **Test GitHub source flow** (regression):
   - Analyze a GitHub repo
   - Save requirement, queue extraction
   - Verify job still works (visual fields null/empty)

3. **Verify generated code**:
   - Check that Claude-generated components use the correct colors, typography, and layout from the visual specs
