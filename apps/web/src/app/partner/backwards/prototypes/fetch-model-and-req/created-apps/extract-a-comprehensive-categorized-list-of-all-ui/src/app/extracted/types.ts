/**
 * Type definitions for the EchoPilot Component Catalog
 *
 * These types define the structure of component metadata
 * used throughout the catalog application.
 */

/**
 * Represents a single component in the catalog
 */
export interface Component {
  /** Display name of the component */
  name: string;

  /** Detailed description of what the component does */
  description: string;

  /** File path in the source repository */
  path: string;

  /** Optional list of npm packages or other components this depends on */
  dependencies?: string[];

  /** Optional list of tags for categorization and search */
  tags?: string[];
}

/**
 * Represents a category of components
 */
export interface ComponentCategory {
  /** Unique identifier for the category */
  id: string;

  /** Display title for the category */
  title: string;

  /** Description of what components in this category are for */
  description: string;

  /** Emoji icon representing the category */
  icon: string;

  /** Array of components in this category */
  components: Component[];
}

/**
 * Filter state for the component catalog
 */
export interface FilterState {
  /** Current search query */
  searchQuery: string;

  /** Currently selected category ID ('all' for no filter) */
  selectedCategory: string;
}

/**
 * Statistics about the component catalog
 */
export interface CatalogStats {
  /** Total number of components across all categories */
  totalComponents: number;

  /** Number of categories */
  categoryCount: number;

  /** Number of components currently visible after filtering */
  visibleComponents: number;
}
