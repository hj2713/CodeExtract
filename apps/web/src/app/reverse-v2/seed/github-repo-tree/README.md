# GithubRepoTree Component

A navigable tree view of GitHub repository contents.

## Source Location

`apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/github-repo-tree/`

## Files

- `types.ts` - Type definitions (RepoContent, GithubMetadata)
- `actions.ts` - Server actions (parseGithubUrl, fetchRepoContents)
- `github-repo-tree.tsx` - Main component
- `page.tsx` - Demo page

## Usage

```tsx
import { GithubRepoTree } from './github-repo-tree';

<GithubRepoTree githubUrl="https://github.com/owner/repo" />
```

## Features

- Path-based navigation (click folders to enter)
- Breadcrumb navigation to go back
- Lazy loading of directory contents
- File size display
- Loading and error states
- Returns null if URL is invalid

## Integration Notes

See Phase 5 documentation in the code example directory.
