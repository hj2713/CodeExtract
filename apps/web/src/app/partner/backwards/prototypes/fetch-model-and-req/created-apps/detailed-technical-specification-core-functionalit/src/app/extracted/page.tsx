'use client';

/**
 * Hero Section with Project Cards
 * A responsive showcase for personal projects on a resume website
 */

import { useState } from 'react';
import { Project } from './types';
import { MOCK_PROJECTS } from './utils';

/**
 * Navigation component - Placeholder for future navigation functionality
 */
function Navigation() {
  return (
    <nav className="w-full bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Projects
              </a>
              <a href="#" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </a>
              <a href="#" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Individual Project Card component
 */
interface ProjectCardProps {
  project: Project;
  index: number;
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl shadow-lg overflow-hidden
                 transition-all duration-300 ease-in-out
                 hover:shadow-2xl hover:-translate-y-2 hover:scale-105
                 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
      tabIndex={0}
      aria-label={`View ${project.title} project`}
    >
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="animate-pulse bg-slate-300 w-full h-full"></div>
          </div>
        )}
        <img
          src={imageError ? 'https://picsum.photos/seed/fallback/400/300' : project.imageUrl}
          alt={project.title}
          className={`w-full h-full object-cover transition-transform duration-300
                     group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0
                       group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-white text-sm font-medium">View Project →</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">
          {project.title}
        </h3>
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-0 right-0 w-0 h-0
                       border-t-[60px] border-t-blue-500
                       border-l-[60px] border-l-transparent"></div>
      </div>
    </a>
  );
}

/**
 * Card Stack Container - Main container for project cards
 */
interface CardStackContainerProps {
  projects: Project[];
}

function CardStackContainer({ projects }: CardStackContainerProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Featured Projects
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore my portfolio of web applications, tools, and experiments.
          Each project showcases different skills and technologies.
        </p>
      </div>

      {/* Desktop: Horizontal stacked layout */}
      {/* Mobile: Vertical stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} index={index} />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No projects to display yet.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main Hero Section Component
 */
export default function HeroSection() {
  const [projects] = useState<Project[]>(MOCK_PROJECTS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Navigation />

      <main className="pb-16">
        <CardStackContainer projects={projects} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
