/**
 * Mock data for email tracking
 *
 * In production, this would be replaced with a real database (PostgreSQL, MongoDB, etc.)
 * or a simpler JSON file storage solution.
 */

import { TrackedEmail, TrackingEvent } from './types';

// Mock user
export const MOCK_USER = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: 'Demo User',
};

// Mock tracked emails (simulating database records)
export const MOCK_TRACKED_EMAILS: TrackedEmail[] = [
  {
    id: '1',
    user_id: 'demo-user-123',
    tracking_id: 'l9x2k4p-a1b2c3d4e5f6g7h8',
    subject_hash: null,
    recipient_email_hash: 'b2c4e6f8a1d3e5g7h9i1k3m5',
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    first_opened_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    last_opened_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    open_count: 3,
    metadata: { source: 'demo' },
  },
  {
    id: '2',
    user_id: 'demo-user-123',
    tracking_id: 'm8y1j5q-b2c3d4e5f6g7h8i9',
    subject_hash: null,
    recipient_email_hash: 'c3d5f7g9b2e4f6h8i0j2l4n6',
    sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    first_opened_at: null,
    last_opened_at: null,
    open_count: 0,
    metadata: { source: 'demo' },
  },
  {
    id: '3',
    user_id: 'demo-user-123',
    tracking_id: 'n7z0k6r-c3d4e5f6g7h8i9j0',
    subject_hash: null,
    recipient_email_hash: 'd4e6g8h0c3f5g7i9j1k3m5o7',
    sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    first_opened_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    last_opened_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    open_count: 1,
    metadata: { source: 'demo' },
  },
  {
    id: '4',
    user_id: 'demo-user-123',
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    subject_hash: null,
    recipient_email_hash: 'e5f7h9i1d4g6h8j0k2l4n6p8',
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    first_opened_at: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    last_opened_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    open_count: 5,
    metadata: { source: 'demo' },
  },
  {
    id: '5',
    user_id: 'demo-user-123',
    tracking_id: 'p5b8m6t-e5f6g7h8i9j0k1l2',
    subject_hash: null,
    recipient_email_hash: 'f6g8i0j2e5h7i9k1l3m5o7q9',
    sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    first_opened_at: null,
    last_opened_at: null,
    open_count: 0,
    metadata: { source: 'demo' },
  },
  {
    id: '6',
    user_id: 'demo-user-123',
    tracking_id: 'q4c7n5u-f6g7h8i9j0k1l2m3',
    subject_hash: null,
    recipient_email_hash: 'g7h9j1k3f6i8j0l2m4n6p8r0',
    sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    first_opened_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    last_opened_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    open_count: 1,
    metadata: { source: 'demo' },
  },
  {
    id: '7',
    user_id: 'demo-user-123',
    tracking_id: 'r3d6o4v-g7h8i9j0k1l2m3n4',
    subject_hash: null,
    recipient_email_hash: 'h8i0k2l4g7j9k1m3n5o7q9s1',
    sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    first_opened_at: new Date(Date.now() - 6.8 * 24 * 60 * 60 * 1000).toISOString(),
    last_opened_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    open_count: 2,
    metadata: { source: 'demo' },
  },
];

// Mock tracking events
export const MOCK_TRACKING_EVENTS: TrackingEvent[] = [
  {
    id: 1,
    tracking_id: 'l9x2k4p-a1b2c3d4e5f6g7h8',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'macOS', isMobile: false },
  },
  {
    id: 2,
    tracking_id: 'l9x2k4p-a1b2c3d4e5f6g7h8',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'macOS', isMobile: false },
  },
  {
    id: 3,
    tracking_id: 'l9x2k4p-a1b2c3d4e5f6g7h8',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    device_info: { browser: 'Safari', os: 'iOS', isMobile: true },
  },
  {
    id: 4,
    tracking_id: 'n7z0k6r-c3d4e5f6g7h8i9j0',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Firefox', os: 'Windows', isMobile: false },
  },
  {
    id: 5,
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'Android', isMobile: true },
  },
  {
    id: 6,
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'Android', isMobile: true },
  },
  {
    id: 7,
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'Android', isMobile: true },
  },
  {
    id: 8,
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1.1 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'Android', isMobile: true },
  },
  {
    id: 9,
    tracking_id: 'o6a9l7s-d4e5f6g7h8i9j0k1',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Chrome', os: 'Android', isMobile: true },
  },
  {
    id: 10,
    tracking_id: 'q4c7n5u-f6g7h8i9j0k1l2m3',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Safari', os: 'macOS', isMobile: false },
  },
  {
    id: 11,
    tracking_id: 'r3d6o4v-g7h8i9j0k1l2m3n4',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 6.8 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Edge', os: 'Windows', isMobile: false },
  },
  {
    id: 12,
    tracking_id: 'r3d6o4v-g7h8i9j0k1l2m3n4',
    event_type: 'open',
    occurred_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    device_info: { browser: 'Edge', os: 'Windows', isMobile: false },
  },
];

/**
 * Helper functions to manipulate mock data
 * In production, these would be database queries
 */

export function addMockEmail(email: TrackedEmail): void {
  MOCK_TRACKED_EMAILS.unshift(email);
}

export function addMockEvent(event: TrackingEvent): void {
  MOCK_TRACKING_EVENTS.unshift(event);
}

export function updateMockEmail(trackingId: string, updates: Partial<TrackedEmail>): void {
  const index = MOCK_TRACKED_EMAILS.findIndex(e => e.tracking_id === trackingId);
  if (index !== -1) {
    MOCK_TRACKED_EMAILS[index] = {
      ...MOCK_TRACKED_EMAILS[index],
      ...updates,
    };
  }
}
