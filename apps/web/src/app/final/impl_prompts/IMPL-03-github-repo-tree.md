# Implementation Task: GithubRepoTree

We are working on `@apps/web/src/app/final`

Note that many of the components are placeholders that need to be implemented.

You have a **GOLDEN EXAMPLE** of solution code located at:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/github-repo-tree`

Pay **SPECIAL ATTENTION** to the integration guide:
`@apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/github-repo-tree/INTEGRATION.md`

This guide defines exactly how to build this feature.

---

## Your Task

Please update the placeholder component at:
`apps/web/src/app/final/components/working-queue-page/github-repo-tree.tsx`

Using the example code and following the integration guide!

## What to Implement

- Accept githubUrl prop from CreateSourceModal
- Fetch repository tree from GitHub API (debounced)
- Display expandable tree view of files/folders
- Show loading/error/empty states
- Limit initial display with "and X more" indicator
