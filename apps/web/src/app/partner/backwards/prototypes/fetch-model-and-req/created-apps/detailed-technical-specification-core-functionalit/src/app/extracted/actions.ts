/**
 * Server actions for the Hero Section
 * Currently contains placeholder functions for future API integration
 */

'use server';

import { Project } from './types';

/**
 * Fetch projects from an API or database
 * This is a mock implementation that returns static data
 * In production, this would query a real database or external API
 */
export async function fetchProjects(): Promise<Project[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In production, this would be:
  // const response = await fetch('https://api.example.com/projects');
  // return response.json();

  return [
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
    }
  ];
}

/**
 * Add a new project (admin functionality)
 * Mock implementation - would integrate with a CMS or database
 */
export async function addProject(project: Omit<Project, 'id'>): Promise<{ success: boolean; message: string }> {
  // Validate project data
  if (!project.title || !project.description || !project.link) {
    return {
      success: false,
      message: 'Missing required fields'
    };
  }

  // In production, this would insert into a database:
  // await db.insert(projects).values(project);

  return {
    success: true,
    message: 'Project added successfully'
  };
}
