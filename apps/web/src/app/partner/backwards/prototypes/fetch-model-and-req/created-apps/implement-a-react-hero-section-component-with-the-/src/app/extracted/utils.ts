/**
 * Mock data and utilities for Hero Section
 */

import { StarterPack, NavigationLink } from './types';

// MOCK DATA - Placeholder starter pack images and links
export const MOCK_STARTER_PACKS: StarterPack[] = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    linkUrl: '#web-development',
    title: 'Web Development Starter',
    description: 'HTML, CSS, JavaScript, React'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    linkUrl: '#python-data',
    title: 'Python & Data Science',
    description: 'Python, Pandas, NumPy, Jupyter'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
    linkUrl: '#mobile-dev',
    title: 'Mobile Development',
    description: 'React Native, Flutter, Swift'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
    linkUrl: '#ai-ml',
    title: 'AI & Machine Learning',
    description: 'TensorFlow, PyTorch, Scikit-learn'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop',
    linkUrl: '#backend',
    title: 'Backend Development',
    description: 'Node.js, Express, PostgreSQL'
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    linkUrl: '#devops',
    title: 'DevOps & Cloud',
    description: 'Docker, Kubernetes, AWS'
  }
];

// Navigation links
export const NAVIGATION_LINKS: NavigationLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Starter Packs', href: '#starter-packs' },
  { label: 'Resources', href: '#resources' },
  { label: 'Contact', href: '#contact' }
];

// MLH Badge placeholder
export const MLH_BADGE_URL = 'https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png';
export const MLH_BADGE_ALT = 'MLH Official 2026 Season';

// Fallback image for error cases
export const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/400x300/cccccc/666666?text=Image+Not+Available';

/**
 * Utility to handle image loading errors
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = event.target as HTMLImageElement;
  target.src = FALLBACK_IMAGE_URL;
};
