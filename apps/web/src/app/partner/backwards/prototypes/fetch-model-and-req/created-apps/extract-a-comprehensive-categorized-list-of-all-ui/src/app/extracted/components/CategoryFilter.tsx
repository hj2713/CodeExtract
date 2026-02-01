// Ported from: Tab-style filter pattern

import type { ComponentCategory } from '../data';

interface CategoryFilterProps {
  categories: ComponentCategory[];
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('all')}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            selected === 'all'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }
        `}
      >
        All Components
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
            ${
              selected === category.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }
          `}
        >
          <span>{category.icon}</span>
          <span>{category.title}</span>
          <span
            className={`
              px-1.5 py-0.5 rounded text-xs
              ${
                selected === category.id
                  ? 'bg-white/20'
                  : 'bg-slate-800'
              }
            `}
          >
            {category.components.length}
          </span>
        </button>
      ))}
    </div>
  );
}
