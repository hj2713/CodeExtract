/**
 * Server actions and API logic for email tracking
 *
 * In production, these would connect to a real database.
 * This example uses mock data stored in JSON files for simplicity.
 */

'use server';

import { TrackedEmail, TrackingEvent, AnalyticsData, DailyTrend, GenerateTrackingResponse } from './types';
import { generateTrackingId, signTrackingUrl, verifyTrackingSignature, parseDeviceInfo, anonymizeIp } from './utils';
import { MOCK_TRACKED_EMAILS, MOCK_TRACKING_EVENTS, addMockEmail, addMockEvent, updateMockEmail } from './mock-data';

const TRACKING_SECRET = process.env.TRACKING_SECRET || 'demo-secret-change-in-production';

/**
 * Get tracked emails with optional filtering
 */
export async function getTrackedEmails(filter: 'all' | 'opened' | 'unopened' = 'all'): Promise<{
  emails: TrackedEmail[];
  stats: { tracked: number; opened: number; openRate: number };
}> {
  let emails = [...MOCK_TRACKED_EMAILS];

  if (filter === 'opened') {
    emails = emails.filter(e => e.first_opened_at !== null);
  } else if (filter === 'unopened') {
    emails = emails.filter(e => e.first_opened_at === null);
  }

  // Sort by sent_at descending
  emails.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

  // Calculate stats
  const tracked = MOCK_TRACKED_EMAILS.length;
  const opened = MOCK_TRACKED_EMAILS.filter(e => e.first_opened_at !== null).length;
  const openRate = tracked > 0 ? Math.round((opened / tracked) * 100) : 0;

  return {
    emails,
    stats: { tracked, opened, openRate },
  };
}

/**
 * Get tracking events for a specific email
 */
export async function getEmailEvents(trackingId: string): Promise<TrackingEvent[]> {
  const events = MOCK_TRACKING_EVENTS
    .filter(e => e.tracking_id === trackingId)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return events;
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<AnalyticsData> {
  const allEmails = MOCK_TRACKED_EMAILS;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekEmails = allEmails.filter(e => new Date(e.sent_at) >= weekAgo);

  const tracked = allEmails.length;
  const opened = allEmails.filter(e => e.first_opened_at !== null).length;
  const openRate = tracked > 0 ? Math.round((opened / tracked) * 100) : 0;

  const weekTracked = weekEmails.length;
  const weekOpened = weekEmails.filter(e => e.first_opened_at !== null).length;
  const weekOpenRate = weekTracked > 0 ? Math.round((weekOpened / weekTracked) * 100) : 0;

  return {
    all_time: {
      tracked,
      opened,
      openRate,
      totalEvents: MOCK_TRACKING_EVENTS.length,
    },
    this_week: {
      tracked: weekTracked,
      opened: weekOpened,
      openRate: weekOpenRate,
    },
  };
}

/**
 * Get daily trends
 */
export async function getDailyTrends(days: number = 14): Promise<{ trends: DailyTrend[] }> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Create daily buckets
  const dailyData: Record<string, { sent: number; opened: number }> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    dailyData[key] = { sent: 0, opened: 0 };
  }

  // Aggregate emails by day
  for (const email of MOCK_TRACKED_EMAILS) {
    const sentDate = email.sent_at.split('T')[0];
    if (dailyData[sentDate]) {
      dailyData[sentDate].sent++;
      if (email.first_opened_at) {
        dailyData[sentDate].opened++;
      }
    }
  }

  const trends = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      ...data,
      openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { trends };
}

/**
 * Generate a new tracking pixel URL
 */
export async function generateTrackingPixel(
  recipientEmailHash?: string,
  metadata?: Record<string, unknown>
): Promise<GenerateTrackingResponse> {
  const trackingId = generateTrackingId();
  const signature = await signTrackingUrl(trackingId, TRACKING_SECRET);

  // In production, this would be your actual domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pixelUrl = `${baseUrl}/api/pixel/${trackingId}?sig=${signature}`;

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Store the tracked email
  const newEmail: TrackedEmail = {
    id: crypto.randomUUID(),
    user_id: 'demo-user',
    tracking_id: trackingId,
    subject_hash: null,
    recipient_email_hash: recipientEmailHash || null,
    sent_at: new Date().toISOString(),
    first_opened_at: null,
    last_opened_at: null,
    open_count: 0,
    metadata: metadata || {},
  };

  addMockEmail(newEmail);

  return {
    trackingId,
    pixelUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Record an email open event (called by tracking pixel)
 */
export async function recordEmailOpen(
  trackingId: string,
  signature: string,
  userAgent: string | null,
  ipAddress: string | null
): Promise<{ success: boolean }> {
  // Verify signature
  const isValid = await verifyTrackingSignature(trackingId, signature, TRACKING_SECRET);
  if (!isValid) {
    return { success: false };
  }

  const deviceInfo = parseDeviceInfo(userAgent);
  const anonymizedIp = anonymizeIp(ipAddress);

  // Record the event
  const newEvent: TrackingEvent = {
    id: Date.now(), // Simple ID for demo
    tracking_id: trackingId,
    event_type: 'open',
    occurred_at: new Date().toISOString(),
    device_info: deviceInfo,
    ip_address: anonymizedIp,
    user_agent: userAgent,
  };

  addMockEvent(newEvent);

  // Update the tracked email
  const email = MOCK_TRACKED_EMAILS.find(e => e.tracking_id === trackingId);
  if (email) {
    const now = new Date().toISOString();
    updateMockEmail(trackingId, {
      first_opened_at: email.first_opened_at || now,
      last_opened_at: now,
      open_count: email.open_count + 1,
    });
  }

  return { success: true };
}
