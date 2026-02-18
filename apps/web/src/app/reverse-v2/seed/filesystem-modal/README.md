# FileSystemModal Seed

## Component Location

Working prototype: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/filesystem-modal/`

## Purpose

Display a file tree view for `codeExample.path` in the PendingAppsPage, allowing users to browse and preview file contents before approving/denying a code example.

## Key Files

| File | Purpose |
|------|---------|
| `actions.ts` | Server actions: `fetchDirectoryContents`, `fetchFileContent` |
| `types.ts` | Type definitions: `FileSystemEntry`, result types |
| `util.ts` | Helpers: `formatFileSize`, `getFileExtension`, `getLanguageFromExtension` |
| `filesystem-modal.tsx` | Main component with tree and file viewer |
| `index.ts` | Clean exports |
| `page.tsx` | Demo page for testing |
| `INTEGRATION.md` | Full integration guide |

## Integration Target

`apps/web/src/app/final/components/pending-apps-page/file-system-modal.tsx`

## Data Requirements

- `basePath` (string): The `codeExample.path` from the database

## Key Behaviors

1. **Lazy Loading**: Directories fetched on expand
2. **File Preview**: Click file to view contents
3. **Read-Only**: No editing capability
4. **Security**: Path traversal protection

## Demo URL

`/partner/backwards/prototypes/fetch-model-and-req/created-apps/filesystem-modal`
