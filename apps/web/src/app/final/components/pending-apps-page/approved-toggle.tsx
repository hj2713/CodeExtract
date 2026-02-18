'use client';

interface ApprovedToggleProps {
  isApproved: boolean;
  onApprovedChange: (approved: boolean) => void;
}

/**
 * ApprovedToggle - Toggle switch for approved/pending view
 */
export function ApprovedToggle({ isApproved, onApprovedChange }: ApprovedToggleProps) {
  return (
    <button
      onClick={() => onApprovedChange(!isApproved)}
      className="flex items-center gap-2 px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:border-zinc-500 transition-colors"
    >
      <span className="font-mono text-xs text-zinc-400">Approved</span>
      <div
        className={`w-8 h-4 border border-zinc-700 relative transition-colors ${
          isApproved ? 'bg-green-500/20' : 'bg-zinc-800'
        }`}
      >
        <div
          className={`absolute top-0 w-4 h-4 border border-zinc-700 bg-zinc-600 transition-transform ${
            isApproved ? 'translate-x-4 bg-green-500' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}
