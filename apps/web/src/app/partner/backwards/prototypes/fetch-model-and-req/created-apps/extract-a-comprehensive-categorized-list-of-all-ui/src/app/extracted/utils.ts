/**
 * Utility functions for the EchoPilot Component Catalog
 */

import type { Component, ComponentCategory } from './types';

/**
 * Filters components based on search query
 * Searches across name, description, and path
 */
export function filterComponentsBySearch(
  components: Component[],
  query: string
): Component[] {
  if (!query.trim()) {
    return components;
  }

  const lowercaseQuery = query.toLowerCase();

  return components.filter(
    (component) =>
      component.name.toLowerCase().includes(lowercaseQuery) ||
      component.description.toLowerCase().includes(lowercaseQuery) ||
      component.path.toLowerCase().includes(lowercaseQuery) ||
      component.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Filters categories based on selected category ID
 */
export function filterCategoriesBySelection(
  categories: ComponentCategory[],
  selectedCategoryId: string
): ComponentCategory[] {
  if (selectedCategoryId === 'all') {
    return categories;
  }

  return categories.filter((category) => category.id === selectedCategoryId);
}

/**
 * Counts total components across all categories
 */
export function countTotalComponents(
  categories: ComponentCategory[]
): number {
  return categories.reduce((acc, cat) => acc + cat.components.length, 0);
}

/**
 * Gets unique tags from all components
 * Useful for generating a tag cloud or filter
 */
export function getAllTags(categories: ComponentCategory[]): string[] {
  const tagSet = new Set<string>();

  categories.forEach((category) => {
    category.components.forEach((component) => {
      component.tags?.forEach((tag) => tagSet.add(tag));
    });
  });

  return Array.from(tagSet).sort();
}

/**
 * Gets unique dependencies from all components
 */
export function getAllDependencies(
  categories: ComponentCategory[]
): string[] {
  const depSet = new Set<string>();

  categories.forEach((category) => {
    category.components.forEach((component) => {
      component.dependencies?.forEach((dep) => depSet.add(dep));
    });
  });

  return Array.from(depSet).sort();
}

/**
 * Finds a component by name across all categories
 */
export function findComponentByName(
  categories: ComponentCategory[],
  name: string
): Component | null {
  for (const category of categories) {
    const component = category.components.find((c) => c.name === name);
    if (component) {
      return component;
    }
  }
  return null;
}

/**
 * Groups components by a specific tag
 */
export function groupComponentsByTag(
  categories: ComponentCategory[]
): Record<string, Component[]> {
  const grouped: Record<string, Component[]> = {};

  categories.forEach((category) => {
    category.components.forEach((component) => {
      component.tags?.forEach((tag) => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(component);
      });
    });
  });

  return grouped;
}

/**
 * Calculates statistics about the catalog
 */
export function calculateStats(
  categories: ComponentCategory[],
  visibleCategories: ComponentCategory[]
) {
  return {
    totalComponents: countTotalComponents(categories),
    categoryCount: categories.length,
    visibleComponents: countTotalComponents(visibleCategories)
  };
}

/**
 * Sorts components by name alphabetically
 */
export function sortComponentsByName(components: Component[]): Component[] {
  return [...components].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Formats a file path for display
 * Removes common prefixes to make paths more readable
 */
export function formatPath(path: string): string {
  return path.replace(/^src\//, '');
}
