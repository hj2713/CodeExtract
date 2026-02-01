/**
 * Helper functions and fixture data for the Starter Packs section
 */

import { NavLink, StarterPack } from './types';

/**
 * Navigation links for the hackathon website
 */
export const NAVIGATION_LINKS: NavLink[] = [
  { label: 'About', url: '#about' },
  { label: 'Itinerary', url: '#itinerary' },
  { label: 'Starter Packs', url: '#starter-packs' },
  { label: 'FAQ', url: '#faq' },
  { label: 'Sponsors', url: '#sponsors' },
];

/**
 * Mock starter pack data
 * In a real implementation, this would come from a CMS or API
 */
export const STARTER_PACKS: StarterPack[] = [
  {
    id: '1',
    title: 'Web Development',
    imageSrc: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=300&fit=crop',
    link: '#web-dev',
  },
  {
    id: '2',
    title: 'Mobile Apps',
    imageSrc: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
    link: '#mobile',
  },
  {
    id: '3',
    title: 'AI/ML',
    imageSrc: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    link: '#ai-ml',
  },
  {
    id: '4',
    title: 'Blockchain',
    imageSrc: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
    link: '#blockchain',
  },
  {
    id: '5',
    title: 'IoT',
    imageSrc: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=400&h=300&fit=crop',
    link: '#iot',
  },
  {
    id: '6',
    title: 'Game Development',
    imageSrc: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
    link: '#game-dev',
  },
];

/**
 * MLH logo placeholder URL
 */
export const MLH_LOGO_URL = 'https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png';
