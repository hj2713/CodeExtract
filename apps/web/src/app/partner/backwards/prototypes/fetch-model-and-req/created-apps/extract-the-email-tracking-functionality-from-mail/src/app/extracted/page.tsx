'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrackedEmail, DailyTrend, AnalyticsData } from './types';
import { formatDistanceToNow, formatDate } from './utils';
import StatsCard from './components/StatsCard';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import './styles.css';

export default function EmailTrackingPage() {
  const [emails, setEmails] = useState<TrackedEmail[]>([]);
  const [stats, setStats] = useState({ tracked: 0, opened: 0, openRate: 0 });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [filter, setFilter] = useState<'all' | 'opened' | 'unopened'>('all');
  const [selectedEmail, setSelectedEmail] = useState<TrackedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch tracked emails
      const emailsRes = await fetch(`/api/emails?filter=${filter}`);
      const emailsData = await emailsRes.json();
      setEmails(emailsData.emails);
      setStats(emailsData.stats);

      // Fetch analytics
      const analyticsRes = await fetch('/api/analytics/summary');
      const analytics = await analyticsRes.json();
      setAnalyticsData(analytics);

      // Fetch trends
      const trendsRes = await fetch('/api/analytics/daily?days=14');
      const trendsData = await trendsRes.json();
      setTrends(trendsData.trends || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFilterChange(newFilter: 'all' | 'opened' | 'unopened') {
    setFilter(newFilter);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Email Tracking Dashboard</h1>
              <p className="subtitle">Monitor message opens and engagement</p>
            </div>
            <div className="header-actions">
              <button onClick={loadData} className="btn-secondary refresh-btn" disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Refresh
              </button>
            </div>
          </header>

          <section className="stats-section">
            <StatsCard
              icon="📧"
              label="Tracked Messages"
              value={stats.tracked}
            />
            <StatsCard
              icon="👁️"
              label="Opened"
              value={stats.opened}
              variant="success"
            />
            <StatsCard
              icon="📊"
              label="Open Rate"
              value={`${stats.openRate}%`}
              variant="info"
            />
          </section>

          <section className="emails-section">
            <div className="section-header">
              <h2>Tracked Messages</h2>
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </button>
                <button
                  className={`filter-tab ${filter === 'opened' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('opened')}
                >
                  Opened
                </button>
                <button
                  className={`filter-tab ${filter === 'unopened' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('unopened')}
                >
                  Unopened
                </button>
              </div>
            </div>

            {emails.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3>No messages yet</h3>
                <p>
                  {filter === 'all'
                    ? 'Start tracking messages to see them here'
                    : filter === 'opened'
                    ? 'No messages have been opened yet'
                    : 'All your tracked messages have been opened!'}
                </p>
              </div>
            ) : (
              <EmailList emails={emails} onSelectEmail={setSelectedEmail} />
            )}
          </section>
        </div>
      ) : (
        <div className="analytics">
          <header className="analytics-header">
            <h1>Analytics</h1>
            <p className="subtitle">Track your message engagement over time</p>
          </header>

          {/* All-time Stats */}
          <section className="stats-section">
            <h2>All Time</h2>
            <div className="stats-grid">
              <StatsCard
                icon="📧"
                label="Total Tracked"
                value={analyticsData?.all_time.tracked || 0}
              />
              <StatsCard
                icon="👁️"
                label="Total Opened"
                value={analyticsData?.all_time.opened || 0}
                variant="success"
              />
              <StatsCard
                icon="📊"
                label="Open Rate"
                value={`${analyticsData?.all_time.openRate || 0}%`}
                variant="info"
              />
              <StatsCard
                icon="⚡"
                label="Total Events"
                value={analyticsData?.all_time.totalEvents || 0}
              />
            </div>
          </section>

          {/* This Week Stats */}
          <section className="stats-section">
            <h2>This Week</h2>
            <div className="stats-grid">
              <StatsCard
                icon="📤"
                label="Sent"
                value={analyticsData?.this_week.tracked || 0}
              />
              <StatsCard
                icon="✅"
                label="Opened"
                value={analyticsData?.this_week.opened || 0}
                variant="success"
              />
              <StatsCard
                icon="📈"
                label="Open Rate"
                value={`${analyticsData?.this_week.openRate || 0}%`}
                variant="info"
              />
            </div>
          </section>

          {/* Daily Trends */}
          <section className="trends-section">
            <h2>Daily Activity (Last 14 Days)</h2>
            <div className="trends-chart">
              {trends.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No data yet. Start tracking messages to see trends.</p>
                </div>
              ) : (
                <div className="bar-chart">
                  {trends.map((day) => (
                    <div key={day.date} className="bar-group">
                      <div className="bars">
                        <div
                          className="bar sent"
                          style={{ height: `${Math.min(day.sent * 10, 100)}%` }}
                          title={`Sent: ${day.sent}`}
                        />
                        <div
                          className="bar opened"
                          style={{ height: `${Math.min(day.opened * 10, 100)}%` }}
                          title={`Opened: ${day.opened}`}
                        />
                      </div>
                      <span className="bar-label">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot sent"></span> Sent</span>
              <span className="legend-item"><span className="legend-dot opened"></span> Opened</span>
            </div>
          </section>
        </div>
      )}

      {selectedEmail && (
        <EmailDetail
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
}
