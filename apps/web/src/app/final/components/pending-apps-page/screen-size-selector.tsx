'use client';

interface ScreenSizeSelectorProps {
  screenSize: 'desktop' | 'tablet' | 'mobile';
  onScreenSizeChange: (size: 'desktop' | 'tablet' | 'mobile') => void;
}

/**
 * ScreenSizeSelector - 3 tabs for desktop/tablet/mobile
 * Functional: changes the LivePreview width
 */
export function ScreenSizeSelector({ screenSize, onScreenSizeChange }: ScreenSizeSelectorProps) {
  return (
    <div className="flex items-center gap-1 border border-zinc-700 bg-zinc-900">
      <button
        onClick={() => onScreenSizeChange('desktop')}
        className={`px-3 py-1.5 font-mono text-xs transition-colors ${
          screenSize === 'desktop'
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Desktop
      </button>
      <button
        onClick={() => onScreenSizeChange('tablet')}
        className={`px-3 py-1.5 font-mono text-xs transition-colors ${
          screenSize === 'tablet'
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Tablet
      </button>
      <button
        onClick={() => onScreenSizeChange('mobile')}
        className={`px-3 py-1.5 font-mono text-xs transition-colors ${
          screenSize === 'mobile'
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Mobile
      </button>
    </div>
  );
}
