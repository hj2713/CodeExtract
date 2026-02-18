'use client';

interface CreateSourceButtonProps {
  onClick: () => void;
}

/**
 * CreateSourceButton - Opens CreateSourceModal
 */
export function CreateSourceButton({ onClick }: CreateSourceButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 font-mono text-sm border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
    >
      + Create Source
    </button>
  );
}
