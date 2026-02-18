# Implementation Task: ActionButtons

We are working on `@apps/web/src/app/final`

Note that many of the components are placeholders that need to be implemented.

You have a **GOLDEN EXAMPLE** of solution code located at:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/action-buttons`

Pay **SPECIAL ATTENTION** to the integration guide:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/action-buttons/INTEGRATION.md`

This guide defines exactly how to build this feature.

---

## Your Task

Please update the placeholder component at:
`apps/web/src/app/final/components/pending-apps-page/action-buttons.tsx`

Using the example code and following the integration guide!

## What to Implement

- Wire up Approve button to update codeExample.reviewStatus to "approved"
- Keep Deny button opening DenyModal
- Add loading/disabled states while processing
- Add success/error feedback (toast)
- Navigate to next pending app after approval
- Handle edge case: last pending app
