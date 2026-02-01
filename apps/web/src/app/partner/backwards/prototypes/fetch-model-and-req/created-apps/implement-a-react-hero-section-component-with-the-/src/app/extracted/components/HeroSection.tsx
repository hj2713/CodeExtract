"use client";

import React, { useState } from 'react';
import { HeroSectionProps } from '../types';
import { handleImageError } from '../utils';
import './HeroSection.css';

/**
 * Hero Section Component
 *
 * A React component that displays a hero section with:
 * - Navigation links with hover effects
 * - Title and description
 * - Starter pack images in a grid
 * - MLH Official 2026 Season badge
 */
export function HeroSection({ starterPacks }: HeroSectionProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, imageUrl: string) => {
    setImageErrors(prev => new Set(prev).add(imageUrl));
    handleImageError(event);
  };

  return (
    <section className="hero-section">
      {/* Navigation */}
      <nav className="hero-nav">
        <ul className="nav-list">
          <li><a href="#home" className="nav-link">Home</a></li>
          <li><a href="#about" className="nav-link">About</a></li>
          <li><a href="#starter-packs" className="nav-link">Starter Packs</a></li>
          <li><a href="#resources" className="nav-link">Resources</a></li>
          <li><a href="#contact" className="nav-link">Contact</a></li>
        </ul>
      </nav>

      {/* Main Content Container */}
      <div className="hero-content">
        {/* Title and Description */}
        <div className="hero-header">
          <h1 className="hero-title">Hackatbrown starter packs</h1>
          <p className="hero-description">
            Get started with our curated collection of development starter packs.
            Each pack includes essential tools, libraries, and resources to jumpstart your project.
          </p>
        </div>

        {/* Starter Packs Grid */}
        <div className="starter-packs-container">
          {starterPacks.length === 0 ? (
            <div className="no-packs-message">
              <p>No starter packs available at the moment.</p>
            </div>
          ) : (
            <div className="starter-packs-grid">
              {starterPacks.map((pack, index) => (
                <a
                  key={`${pack.linkUrl}-${index}`}
                  href={pack.linkUrl}
                  className="starter-pack-card"
                  aria-label={`View ${pack.title} starter pack`}
                >
                  <div className="pack-image-container">
                    <img
                      src={pack.imageUrl}
                      alt={pack.title}
                      className="pack-image"
                      onError={(e) => onImageError(e, pack.imageUrl)}
                      loading="lazy"
                    />
                  </div>
                  <div className="pack-info">
                    <h3 className="pack-title">{pack.title}</h3>
                    {pack.description && (
                      <p className="pack-description">{pack.description}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* MLH Badge */}
        <div className="mlh-badge-container">
          <img
            src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png"
            alt="MLH Official 2026 Season"
            className="mlh-badge"
            onError={handleImageError}
          />
        </div>
      </div>
    </section>
  );
}
