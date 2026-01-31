# CRUD Prompt + GitHub Prototype

A prototype for managing code sources (GitHub repos) with prompt storage. Designed for easy migration to a real database.

## Data Model

### Source

Represents a codebase that can be extracted from.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (UUID) |
| `type` | `enum` | `"github_repo"` \| `"local_directory"` \| `"ai_prototype"` |
| `path` | `string \| null` | Local filesystem path after cloning |
| `originUrl` | `string \| null` | GitHub URL if applicable |
| `description` | `string` | User-provided description of the codebase |
| `analysisPath` | `string \| null` | Path to ANALYSIS.md if analysis completed |
| `analysisConfirmed` | `boolean` | Whether user has reviewed and confirmed the analysis |
| `createdAt` | `string` | ISO timestamp when the source was added |
| `updatedAt` | `string` | ISO timestamp when the source was last modified |
| `github` | `GithubMetadata \| null` | Cached GitHub API data (denormalized) |

### GithubMetadata

Cached metadata from GitHub API. Could be a separate table in DB.

| Field | Type | Description |
|-------|------|-------------|
| `owner` | `string` | GitHub username or org |
| `repo` | `string` | Repository name |
| `defaultBranch` | `string \| null` | Default branch (e.g., "main") |
| `description` | `string \| null` | Repo description from GitHub |
| `stars` | `number \| null` | Stargazers count |
| `forks` | `number \| null` | Forks count |
| `fetchedAt` | `string \| null` | When metadata was last fetched |

## CRUD Operations

### Server Actions

```typescript
// Create
createSource(input: CreateSourceInput): Promise<{ success, source?, error? }>

// Read
getSources(): Promise<Source[]>
getSourceById(id: string): Promise<Source | null>

// Update
updateSource(input: UpdateSourceInput): Promise<{ success, source?, error? }>

// Delete
deleteSource(id: string): Promise<{ success, error? }>

// GitHub enrichment
enrichGithubMetadata(sourceId: string): Promise<{ success, source?, error? }>
```

### Input Types

```typescript
interface CreateSourceInput {
  type: SourceType;
  originUrl?: string;
  description: string;
}

interface UpdateSourceInput {
  id: string;
  path?: string | null;
  description?: string;
  analysisPath?: string | null;
  analysisConfirmed?: boolean;
}
```

## File Structure

```
crud-prompt-github/
├── README.md           # This file
├── types.ts            # Type definitions
├── actions.ts          # Server actions (CRUD + GitHub API)
├── page.tsx            # Main page component
├── github-repo-viewer.tsx  # Extracted GitHub component
├── sources.json        # JSON "database" for sources
└── prompt.md           # Stored prompt text
```

## DB Migration Path

The prototype is structured for easy migration to Drizzle/SQLite:

1. **Isolated storage layer**: `readSources()` / `writeSources()` functions
2. **Clean interfaces**: `CreateSourceInput`, `UpdateSourceInput` map directly to DB operations
3. **Timestamps as ISO strings**: Easy conversion to `Date` columns
4. **Denormalized GitHub data**: Can stay embedded (JSONB) or split to separate table

### Example Drizzle Schema

```typescript
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull(),
  path: text("path"),
  originUrl: text("origin_url"),
  description: text("description").notNull(),
  analysisPath: text("analysis_path"),
  analysisConfirmed: integer("analysis_confirmed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  // Option A: Store github metadata as JSON
  githubMetadata: text("github_metadata", { mode: "json" }),
  // Option B: Separate table with foreign key
});

export const githubMetadata = sqliteTable("github_metadata", {
  sourceId: text("source_id").primaryKey().references(() => sources.id),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  defaultBranch: text("default_branch"),
  description: text("description"),
  stars: integer("stars"),
  forks: integer("forks"),
  fetchedAt: text("fetched_at"),
});
```

## Features

- **Form**: Add GitHub repos with description
- **Prompt storage**: Editable prompt.md with save/discard
- **Repo viewer**: Interactive file tree browser
- **Metadata enrichment**: Fetch stars/forks/branch from GitHub API
- **Delete**: Remove sources with confirmation
- **Duplicate prevention**: Won't add same repo twice
