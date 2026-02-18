# Implementation Task: Header Worker Count

We are working on `@apps/web/src/app/final`

Note that many of the components are placeholders that need to be implemented.

**Note**: There is no dedicated golden example for this feature. The worker count is currently hardcoded to "1" in the header.

You may reference the queue-component example for patterns on fetching job/worker data:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/queue-component`

---

## Your Task

Please update the component at:
`apps/web/src/app/final/components/working-queue-page/header.tsx`

## What to Implement

- Replace hardcoded "1" with actual worker count
- Fetch worker status (derived from active jobs or worker registration)
- Add StatusDot for worker health indication
- Consider real-time updates for worker status

## Implementation Notes

This may be a simpler feature. Consider:
- Deriving worker count from jobs with status "claimed" and unique lockedBy
- Or implementing a simple heartbeat system
- Or keeping it simple with a configurable constant for MVP
