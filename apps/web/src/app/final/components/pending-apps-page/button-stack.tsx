'use client';

interface ButtonStackProps {
  onModalOpen: (modal: 'logs' | 'readme' | 'filesystem' | 'deny') => void;
}

/**
 * ButtonStack - Vertical stack of buttons (Logs, Readme, FileSystem)
 */
export function ButtonStack({ onModalOpen }: ButtonStackProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onModalOpen('logs')}
        className="w-full px-3 py-2 font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
      >
        Logs
      </button>
      <button
        onClick={() => onModalOpen('readme')}
        className="w-full px-3 py-2 font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
      >
        Readme
      </button>
      <button
        onClick={() => onModalOpen('filesystem')}
        className="w-full px-3 py-2 font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
      >
        FileSystem
      </button>
    </div>
  );
}
