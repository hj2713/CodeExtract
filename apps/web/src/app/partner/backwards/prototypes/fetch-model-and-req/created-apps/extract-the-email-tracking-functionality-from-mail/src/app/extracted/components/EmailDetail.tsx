// Ported from: source/packages/dashboard/src/components/EmailDetail.tsx

'use client';

import { useEffect, useState } from 'react';
import { TrackedEmail, TrackingEvent } from '../types';
import { formatDate, formatDistanceToNow } from '../utils';

interface EmailDetailProps {
  email: TrackedEmail;
  onClose: () => void;
}

export default function EmailDetail({ email, onClose }: EmailDetailProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [email.tracking_id]);

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${email.tracking_id}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
    setLoading(false);
  }

  const isOpened = email.first_opened_at !== null;

  return (
    <div className="email-detail-overlay" onClick={onClose}>
      <div className="email-detail-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Message Details</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div className="modal-content">
          {/* Status Banner */}
          <div className={`status-banner ${isOpened ? 'opened' : 'unopened'}`}>
            <span className="status-icon">{isOpened ? '👁️' : '📨'}</span>
            <div className="status-info">
              <span className="status-label">
                {isOpened ? 'Opened' : 'Not Opened Yet'}
              </span>
              {isOpened && (
                <span className="status-detail">
                  {email.open_count} {email.open_count === 1 ? 'time' : 'times'} ·
                  First opened {formatDistanceToNow(new Date(email.first_opened_at!))}
                </span>
              )}
            </div>
          </div>

          {/* Email Info */}
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Tracking ID</span>
              <code className="info-value">{email.tracking_id}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Sent</span>
              <span className="info-value">{formatDate(new Date(email.sent_at))}</span>
            </div>
            {email.recipient_email_hash && (
              <div className="info-row">
                <span className="info-label">Recipient Hash</span>
                <code className="info-value">{email.recipient_email_hash.substring(0, 16)}...</code>
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="timeline-section">
            <h3>Activity Timeline</h3>

            {loading ? (
              <div className="loading-inline">
                <div className="spinner small"></div>
                <span>Loading events...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-timeline">
                <span>📭</span>
                <p>No opens recorded yet</p>
              </div>
            ) : (
              <div className="timeline">
                {events.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="event-type">
                          {event.event_type === 'open' ? '👁️ Opened' : '🔗 Clicked'}
                        </span>
                        <span className="event-time">
                          {formatDistanceToNow(new Date(event.occurred_at))}
                        </span>
                      </div>
                      {event.device_info && (
                        <div className="device-info">
                          <span className="device-badge">
                            {event.device_info.isMobile ? '📱' : '💻'}
                            {event.device_info.browser || 'Unknown'} on {event.device_info.os || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
