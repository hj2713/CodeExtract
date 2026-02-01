/**
 * Helper functions and mock data for the Hero Section
 */

import { Project } from './types';

/**
 * Mock project data for demonstration
 * In a real application, this would be fetched from an API or CMS
 */
export const MOCK_PROJECTS: Project[] = [
  {
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product management, and payment processing.',
    imageUrl: 'https://picsum.photos/seed/project1/400/300',
    link: 'https://github.com/example/ecommerce-platform'
  },
  {
    title: 'Real-Time Chat Application',
    description: 'WebSocket-based chat app built with Next.js and Socket.io. Supports multiple rooms, direct messaging, and file sharing.',
    imageUrl: 'https://picsum.photos/seed/project2/400/300',
    link: 'https://github.com/example/chat-app'
  },
  {
    title: 'Task Management Dashboard',
    description: 'Kanban-style task manager with drag-and-drop functionality. Built with React, TypeScript, and Firebase for real-time updates.',
    imageUrl: 'https://picsum.photos/seed/project3/400/300',
    link: 'https://github.com/example/task-manager'
  },
  {
    title: 'Weather Forecast App',
    description: 'Mobile-responsive weather application using OpenWeather API. Features include location detection, 7-day forecast, and weather alerts.',
    imageUrl: 'https://picsum.photos/seed/project4/400/300',
    link: 'https://github.com/example/weather-app'
  },
  {
    title: 'Portfolio CMS',
    description: 'Headless CMS for portfolio websites. Built with Next.js, Sanity.io, and deployed on Vercel with automatic deployments.',
    imageUrl: 'https://picsum.photos/seed/project5/400/300',
    link: 'https://github.com/example/portfolio-cms'
  }
];

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
