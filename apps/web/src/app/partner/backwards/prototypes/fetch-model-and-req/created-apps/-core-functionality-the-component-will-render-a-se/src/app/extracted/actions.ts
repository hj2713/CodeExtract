/**
 * Server actions for the Starter Packs section
 *
 * Note: This example uses static data, so no server actions are needed.
 * In a real implementation, you might have actions like:
 * - fetchStarterPacks() - to fetch packs from a CMS or database
 * - trackCardClick() - to track analytics
 * - getUserPreferences() - to personalize pack recommendations
 */

'use server';

import { StarterPack } from './types';

/**
 * Mock server action - In production, this would fetch from a database or CMS
 */
export async function fetchStarterPacks(): Promise<StarterPack[]> {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // In production, this would be a database query like:
  // const packs = await db.starterPacks.findMany({ where: { active: true } });

  return [
    {
      id: '1',
      title: 'Web Development',
      imageSrc: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=300&fit=crop',
      link: '#web-dev',
    },
    // ... more packs
  ];
}

/**
 * Mock analytics tracking
 */
export async function trackStarterPackClick(packId: string): Promise<void> {
  // In production: await analytics.track('starter_pack_clicked', { packId });
  console.log(`Starter pack clicked: ${packId}`);
}
