'use client';

/**
 * Starter Packs Section - Isolated Example
 *
 * This component demonstrates a hackathon website section displaying
 * starter packs with navigation, cards, and branding.
 */

import React from 'react';
import styled from 'styled-components';
import { NAVIGATION_LINKS, STARTER_PACKS, MLH_LOGO_URL } from './utils';

// Styled Components
const SectionContainer = styled.section`
  background-color: #B2C4F3;
  min-height: 100vh;
  padding: 20px;
  font-family: sans-serif;
  color: #000000;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
`;

const NavLink = styled.a`
  color: #000000;
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #800080;
    color: #FFFFFF;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #800080;
  margin: 0 0 20px 0;
`;

const StarterPacksContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto 40px auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StarterPackCard = styled.a`
  background-color: #FFFFFF;
  border: 1px solid #CCCCCC;
  border-radius: 5px;
  overflow: hidden;
  text-decoration: none;
  color: #000000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #800080;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;

const MLHLogo = styled.img`
  max-width: 150px;
  height: auto;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: #000000;
  font-size: 14px;
`;

const AccentBadge = styled.div`
  display: inline-block;
  background-color: #FFD700;
  color: #000000;
  padding: 5px 15px;
  border-radius: 5px;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 20px;
`;

export default function StarterPacksPage() {
  return (
    <SectionContainer id="starter-packs">
      {/* Navigation */}
      <Navigation>
        {NAVIGATION_LINKS.map((link) => (
          <NavLink key={link.label} href={link.url}>
            {link.label}
          </NavLink>
        ))}
      </Navigation>

      {/* Header */}
      <Header>
        <AccentBadge>MLH Official Season 2024</AccentBadge>
        <Title>Choose Your Starter Pack</Title>
      </Header>

      {/* Starter Pack Cards */}
      <StarterPacksContainer>
        {STARTER_PACKS.map((pack) => (
          <StarterPackCard key={pack.id} href={pack.link}>
            <CardImage
              src={pack.imageSrc}
              alt={pack.title}
              onError={(e) => {
                // Fallback image if load fails
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23800080" width="400" height="300"/%3E%3Ctext fill="%23FFFFFF" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24"%3E' + encodeURIComponent(pack.title) + '%3C/text%3E%3C/svg%3E';
              }}
            />
            <CardContent>
              <CardTitle>{pack.title}</CardTitle>
            </CardContent>
          </StarterPackCard>
        ))}
      </StarterPacksContainer>

      {/* MLH Logo */}
      <LogoContainer>
        <MLHLogo
          src={MLH_LOGO_URL}
          alt="MLH Official Season Logo"
          onError={(e) => {
            // Fallback if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </LogoContainer>

      {/* Footer */}
      <Footer>
        Explore our curated starter packs to kickstart your hackathon project!
      </Footer>
    </SectionContainer>
  );
}
