# Implementation Guide: CreateSourceModal

This guide documents how the CreateSourceModal was integrated into `/final`.

---

## Files Structure

```
final/components/working-queue-page/
├── actions.ts              # Server actions: createSource, fetchRepoTree, getSources, etc.
├── utils.ts                # Client utilities: parseGithubUrl
├── types.ts                # TypeScript interfaces
├── create-source-modal.tsx # The modal component
├── github-repo-tree.tsx    # Repo preview component
└── index.tsx               # WorkingQueuePage (updated to wire onSourceCreated)
```

---

## Integration Details

### 1. Server Actions (`actions.ts`)

Contains async server actions:
- `getSources(type?)` - Fetch all sources, optionally filtered by type
- `getGithubSources()` - Convenience wrapper for GitHub repos
- `getSourceById(id)` - Fetch single source
- `createSource(input)` - Create new source with validation
- `fetchRepoTree(owner, repo)` - Fetch repo tree from GitHub API

### 2. Client Utilities (`utils.ts`)

Contains non-async utilities (separated per Next.js server actions requirements):
- `parseGithubUrl(url)` - Parse GitHub URL to extract owner/repo

### 3. Type Definitions (`types.ts`)

```ts
interface GithubMetadata { owner, repo, defaultBranch, description, stars, forks, fetchedAt }
interface CreateSourceInput { type: "github_repo", originUrl, description? }
interface CreateSourceResult { success, source?, error? }
interface ParsedGithubUrl { owner, repo }
interface RepoTreeNode { name, path, type, children? }
```

### 4. CreateSourceModal Component

Props:
- `open: boolean` - Controls visibility
- `onOpenChange: (open: boolean) => void` - Called when modal should close
- `onSourceCreated?: (sourceId: string) => void` - Called after successful creation

Features:
- GitHub URL input with validation
- Live repo tree preview via GithubRepoTree
- Loading and error states
- Form resets on close

### 5. GithubRepoTree Component

Props:
- `githubUrl: string` - GitHub URL to preview

Features:
- Debounced fetch (500ms)
- Shows loading/error/empty states
- Displays first 20 items with overflow indicator

### 6. WorkingQueuePage Integration

```tsx
<CreateSourceModal
  open={createSourceModalOpen}
  onOpenChange={setCreateSourceModalOpen}
  onSourceCreated={(sourceId) => {
    setSelectedSource(sourceId);  // Auto-select new source
  }}
/>
```

---

## Data Flow

```
1. User clicks "Add Source" button in Header
2. WorkingQueuePage opens CreateSourceModal
3. User enters GitHub URL
4. GithubRepoTree fetches and displays repo preview (debounced)
5. User clicks "Add Source" submit button
6. createSource server action:
   - Parses URL to extract owner/repo
   - Validates URL format
   - Checks for duplicates in database
   - Creates source record with basic metadata
   - Returns source ID
7. Modal closes, calls onSourceCreated(sourceId)
8. WorkingQueuePage sets selectedSource to new ID
9. GithubSwitcher shows new source as selected
```

---

## Validation

### Client-side
- HTML5 `type="url"` on input
- Submit button disabled when URL is empty or submitting

### Server-side (in createSource)
- URL is required
- URL must be valid GitHub format (github.com host, owner/repo path)
- Duplicate check (case-insensitive owner/repo match)

### Error messages
- "GitHub URL is required"
- "Invalid GitHub URL. Please use format: https://github.com/owner/repo"
- "Repository owner/repo already exists"

---

## Testing Checklist

1. **Basic creation flow**
   - Enter valid GitHub URL
   - See repo tree preview load
   - Click Add Source
   - Modal closes
   - New source appears in GithubSwitcher (selected)

2. **Validation**
   - Submit empty URL → shows error
   - Submit invalid URL (not github.com) → shows error
   - Submit duplicate URL → shows error

3. **Loading states**
   - "Adding..." shown during submission
   - "Loading repository..." shown during tree fetch

4. **Error recovery**
   - After error, can edit URL and retry
   - Error clears when URL changes

5. **Cancel flow**
   - Click X or backdrop → modal closes
   - Form state cleared
   - No source created
