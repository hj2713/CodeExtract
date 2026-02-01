/**
 * Type definitions for email tracking functionality
 */

export interface TrackedEmail {
  id: string;
  user_id: string;
  tracking_id: string;
  subject_hash: string | null;
  recipient_email_hash: string | null;
  sent_at: string;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  metadata: Record<string, unknown>;
}

export interface TrackingEvent {
  id: number;
  tracking_id: string;
  event_type: 'open' | 'click';
  occurred_at: string;
  device_info: {
    browser?: string;
    os?: string;
    isMobile?: boolean;
  } | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AnalyticsData {
  all_time: {
    tracked: number;
    opened: number;
    openRate: number;
    totalEvents: number;
  };
  this_week: {
    tracked: number;
    opened: number;
    openRate: number;
  };
}

export interface DailyTrend {
  date: string;
  sent: number;
  opened: number;
  openRate: number;
}

export interface GenerateTrackingRequest {
  subjectHash?: string;
  recipientEmailHash?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateTrackingResponse {
  trackingId: string;
  pixelUrl: string;
  expiresAt: string;
}
