"use client";

import { useState } from 'react';
import { EmailView } from './components/EmailView';
import { MOCK_EMAIL_DATA } from './utils';
import { DemoEmail } from './types';

export default function EmailViewDemo() {
  const [selectedEmail, setSelectedEmail] = useState<DemoEmail>(MOCK_EMAIL_DATA[0]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showInbox, setShowInbox] = useState(true);

  const handleSelectEmail = (email: DemoEmail) => {
    setSelectedEmail(email);
    setShowInbox(false);
  };

  const handleBack = () => {
    setShowInbox(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with privacy toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email View Demo</h1>
            <p className="text-muted-foreground mt-1">
              Extracted EmailView component from EchoPilot
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Privacy Mode</span>
          </label>
        </div>

        {/* Main content area */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {showInbox ? (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Inbox</h2>
              <div className="space-y-2">
                {MOCK_EMAIL_DATA.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {privacyMode ? '••••••' : email.fromName}
                          </p>
                          {email.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {privacyMode ? '••••••@••••••' : email.from}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(email.date).toLocaleDateString()}
                      </p>
                    </div>
                    <h3 className="font-medium mb-1">{email.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {email.snippet}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[600px]">
              <EmailView
                email={selectedEmail}
                onBack={handleBack}
                privacyMode={privacyMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
