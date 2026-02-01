// Ported from: Inspired by shadcn/ui Card component pattern

import type { Component } from '../data';

interface CardProps {
  component: Component;
}

export function Card({ component }: CardProps) {
  return (
    <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
          {component.name}
        </h3>
        {component.tags && component.tags.length > 0 && (
          <div className="flex gap-1">
            {component.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        {component.description}
      </p>

      {/* Path */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <code className="font-mono">{component.path}</code>
      </div>

      {/* Dependencies */}
      {component.dependencies && component.dependencies.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-2">Dependencies:</p>
          <div className="flex flex-wrap gap-1.5">
            {component.dependencies.map((dep) => (
              <span
                key={dep}
                className="px-2 py-0.5 text-xs rounded bg-slate-800/50 text-slate-400 font-mono"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hover indicator */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg" />
    </div>
  );
}
