/**
 * Type definitions for Hero Section component
 */

export interface StarterPack {
  imageUrl: string;
  linkUrl: string;
  title: string;
  description?: string;
}

export interface HeroSectionProps {
  starterPacks: StarterPack[];
}

export interface NavigationLink {
  label: string;
  href: string;
}
