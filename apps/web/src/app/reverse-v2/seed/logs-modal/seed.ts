/**
 * Seed file for LogsModal component
 *
 * This provides sample data structures for testing the LogsModal
 * based on the actual job-progress file format from the codebase.
 */

import type {
  JobProgress,
  StepProgress,
  ClaudeLogMessage,
  LogEntry,
} from '@/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/logs-modal/logs-modal';

// Re-export types for convenience
export type { JobProgress, StepProgress, ClaudeLogMessage, LogEntry };

/**
 * Sample completed job progress - successful extraction
 */
export const SEED_COMPLETED_JOB: JobProgress = {
  jobId: 'seed-completed-001',
  name: 'extract-button-component',
  status: 'completed',
  stepProgress: [
    { stepId: 'create-nextjs', status: 'completed' },
    { stepId: 'create-folders', status: 'completed' },
    { stepId: 'clone-repo', status: 'completed' },
    { stepId: 'copy-templates', status: 'completed' },
    { stepId: 'run-claude', status: 'completed' },
  ],
  currentStep: null,
  logs: `Creating Next.js app...
bunx create-next-app@latest extract-button-component --typescript --tailwind --eslint --app --src-dir --use-bun --yes
✓ App created successfully in 12.3s
Creating folders...
mkdir -p src/source src/app/extracted
Created src/source
Created src/app/extracted
Cloning repository...
git clone https://github.com/example/ui-library .
Cloning into '.'...
remote: Enumerating objects: 1543, done.
remote: Counting objects: 100% (1543/1543), done.
remote: Compressing objects: 100% (892/892), done.
Receiving objects: 100% (1543/1543), 2.31 MiB | 4.12 MiB/s, done.
Resolving deltas: 100% (743/743), done.
Copying templates...
cp -rv templates/fullstack/* src/app/extracted/
Copied layout.tsx
Copied page.tsx
Copied README.md
Running Claude extraction...`,
  claudeStatus: 'completed',
  claudeLogs: [
    {
      timestamp: '2024-01-15T10:30:00.000Z',
      type: 'system',
      subtype: 'init',
      cwd: '/path/to/extract-button-component',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'Write', 'Glob', 'Grep', 'Edit', 'Bash'],
    },
    {
      timestamp: '2024-01-15T10:30:02.500Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: "I'll start by exploring the source directory to understand the Button component structure and its dependencies.",
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:03.100Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Glob',
            input: { pattern: '**/button/**/*.{ts,tsx}' },
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:03.250Z',
      type: 'user',
      tool_use_result: {
        filenames: [
          'src/components/ui/button/Button.tsx',
          'src/components/ui/button/Button.types.ts',
          'src/components/ui/button/index.ts',
        ],
        durationMs: 42,
        numFiles: 3,
        truncated: false,
      },
    },
    {
      timestamp: '2024-01-15T10:30:05.800Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Found the Button component files. Let me read the main component to understand its implementation.',
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:06.200Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Read',
            input: { path: 'src/source/src/components/ui/button/Button.tsx' },
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:15.000Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: "I've analyzed the Button component. It uses cva for variant styling and has forwardRef support. Now I'll extract it to the target directory with proper mocking of any external dependencies.",
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:16.500Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Write',
            input: {
              path: 'src/app/extracted/button.tsx',
              content: '/* extracted component */',
            },
          },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:45.000Z',
      type: 'result',
      subtype: 'success',
      is_error: false,
      duration_ms: 45000,
    },
  ],
  startedAt: '2024-01-15T10:29:45.000Z',
  completedAt: '2024-01-15T10:30:45.000Z',
};

/**
 * Sample failed job progress - error during extraction
 */
export const SEED_FAILED_JOB: JobProgress = {
  jobId: 'seed-failed-001',
  name: 'extract-complex-form',
  status: 'failed',
  stepProgress: [
    { stepId: 'create-nextjs', status: 'completed' },
    { stepId: 'create-folders', status: 'completed' },
    { stepId: 'clone-repo', status: 'completed' },
    { stepId: 'copy-templates', status: 'completed' },
    {
      stepId: 'run-claude',
      status: 'error',
      error: 'Maximum turns exceeded without completing extraction',
    },
  ],
  currentStep: 'run-claude',
  logs: `Creating Next.js app...
✓ App created successfully
Creating folders...
Created src/source
Created src/app/extracted
Cloning repository...
Cloning into '.'...
Done.
Copying templates...
Copied layout.tsx
Copied page.tsx
Running Claude extraction...
ERROR: Maximum turns exceeded`,
  claudeStatus: 'failed',
  claudeLogs: [
    {
      timestamp: '2024-01-15T11:00:00.000Z',
      type: 'system',
      subtype: 'init',
      cwd: '/path/to/extract-complex-form',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'Write', 'Glob', 'Grep', 'Edit'],
    },
    {
      timestamp: '2024-01-15T11:00:02.000Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: "I'll explore the form component..." },
        ],
      },
    },
    {
      timestamp: '2024-01-15T11:05:00.000Z',
      type: 'result',
      subtype: 'error',
      is_error: true,
      duration_ms: 300000,
      error: 'Maximum turns exceeded without completing extraction',
    },
  ],
  startedAt: '2024-01-15T11:00:00.000Z',
  completedAt: '2024-01-15T11:05:00.000Z',
};

/**
 * Sample in-progress job - currently running
 */
export const SEED_PROCESSING_JOB: JobProgress = {
  jobId: 'seed-processing-001',
  name: 'extract-data-table',
  status: 'processing',
  stepProgress: [
    { stepId: 'create-nextjs', status: 'completed' },
    { stepId: 'create-folders', status: 'completed' },
    { stepId: 'clone-repo', status: 'completed' },
    { stepId: 'copy-templates', status: 'completed' },
    { stepId: 'run-claude', status: 'running' },
  ],
  currentStep: 'run-claude',
  logs: `Creating Next.js app...
✓ App created successfully
Creating folders...
Created src/source
Created src/app/extracted
Cloning repository...
Done.
Copying templates...
Done.
Running Claude extraction...`,
  claudeStatus: 'running',
  claudeLogs: [
    {
      timestamp: new Date().toISOString(),
      type: 'system',
      subtype: 'init',
      cwd: '/path/to/extract-data-table',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'Write', 'Glob', 'Grep', 'Edit'],
    },
    {
      timestamp: new Date().toISOString(),
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Analyzing the data table component structure...' },
        ],
      },
    },
  ],
  startedAt: new Date(Date.now() - 60000).toISOString(), // Started 1 minute ago
};

/**
 * Get all seed jobs for testing
 */
export function getAllSeedJobs(): JobProgress[] {
  return [SEED_COMPLETED_JOB, SEED_FAILED_JOB, SEED_PROCESSING_JOB];
}

/**
 * Get a seed job by ID
 */
export function getSeedJobById(jobId: string): JobProgress | undefined {
  return getAllSeedJobs().find((job) => job.jobId === jobId);
}
