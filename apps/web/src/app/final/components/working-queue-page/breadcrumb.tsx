'use client';

import { GithubSwitcher } from './github-switcher';

interface BreadcrumbProps {
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
}

/**
 * Breadcrumb - Navigation with GithubSwitcher as last item
 */
export function Breadcrumb({ selectedSource, onSourceChange }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-zinc-500">home</span>
      <span className="text-zinc-700">/</span>
      <span className="text-zinc-500">sources</span>
      <span className="text-zinc-700">/</span>
      <GithubSwitcher
        selectedSource={selectedSource}
        onSourceChange={onSourceChange}
      />
    </div>
  );
}
