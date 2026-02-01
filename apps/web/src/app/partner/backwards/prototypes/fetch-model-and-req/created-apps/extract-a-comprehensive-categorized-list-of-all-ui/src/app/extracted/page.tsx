'use client';

import { useState } from 'react';
import {
  componentsData,
  type ComponentCategory,
  type Component
} from './data';
import { Badge } from './components/Badge';
import { Card } from './components/Card';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';

export default function ComponentsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter components based on search and category
  const filteredData = componentsData.map(category => ({
    ...category,
    components: category.components.filter(component => {
      const matchesSearch =
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.path.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || category.id === selectedCategory;

      return matchesSearch && matchesCategory;
    })
  })).filter(category => category.components.length > 0);

  const totalComponents = componentsData.reduce(
    (acc, cat) => acc + cat.components.length,
    0
  );

  const filteredCount = filteredData.reduce(
    (acc, cat) => acc + cat.components.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                EchoPilot Component Library
              </h1>
              <p className="text-slate-400 mt-1">
                Comprehensive catalog of all UI components, hooks, and pages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Badge variant="blue">
              {totalComponents} Total Components
            </Badge>
            <Badge variant="purple">
              {componentsData.length} Categories
            </Badge>
            <Badge variant="green">
              Built with Radix UI & Tailwind
            </Badge>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search components, hooks, or descriptions..."
          />

          <CategoryFilter
            categories={componentsData}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="mb-6 text-slate-400">
            Showing {filteredCount} of {totalComponents} components
          </div>
        )}

        {/* Component Categories */}
        <div className="space-y-12">
          {filteredData.map((category) => (
            <section key={category.id} id={category.id}>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-white">
                    {category.title}
                  </h2>
                  <Badge variant="gray">
                    {category.components.length}
                  </Badge>
                </div>
                <p className="text-slate-400 ml-12">
                  {category.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-12">
                {category.components.map((component) => (
                  <Card key={component.name} component={component} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No components found
            </h3>
            <p className="text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-slate-500">
          <p>
            Extracted from EchoPilot repository • Built with Next.js 14 & Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
