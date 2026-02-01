/**
 * TypeScript type definitions for the Hero Section with Project Cards
 */

export interface Project {
  title: string;
  description: string;
  imageUrl: string; // From picsum.photos
  link: string;
}

export interface HeroSectionProps {
  projects: Project[];
}
