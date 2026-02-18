# Implementation Task: LivePreview

We are working on `@apps/web/src/app/final`

Note that many of the components are placeholders that need to be implemented.

You have a **GOLDEN EXAMPLE** of solution code located at:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/live-preview`

**Note**: This folder does not have a dedicated guide file. Study the example code directly and apply the patterns to the /final component.

---

## Your Task

Please update the placeholder component at:
`apps/web/src/app/final/components/pending-apps-page/live-preview.tsx`

Using the example code as reference!

## What to Implement

- Replace placeholder div with actual iframe
- Construct URL from codeExample.port (e.g., http://localhost:{port})
- Maintain responsive width based on screenSize prop
- Add loading state while iframe loads
- Handle app not running state (error message)
- Add appropriate iframe security attributes
