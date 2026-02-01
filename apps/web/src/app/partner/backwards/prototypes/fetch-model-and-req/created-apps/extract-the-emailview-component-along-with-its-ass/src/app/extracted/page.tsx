"use client";

import { useState } from "react";
import { EmailView } from "./email-view";
import { MOCK_EMAILS } from "./mock-data";
import { DemoEmail } from "./types";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui-components/button";

export default function EmailViewDemo() {
  const [selectedEmail, setSelectedEmail] = useState<DemoEmail>(MOCK_EMAILS[0]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);

  const handleBack = () => {
    // In this demo, "back" just cycles to the next email
    const nextIndex = (currentEmailIndex + 1) % MOCK_EMAILS.length;
    setCurrentEmailIndex(nextIndex);
    setSelectedEmail(MOCK_EMAILS[nextIndex]);
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Demo Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">EmailView Component Demo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Extracted from EchoPilot - Click "Back to Inbox" to cycle through emails
            </p>
          </div>
          <Button
            variant="outline"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? "Disable privacy mode" : "Enable privacy mode"}
          >
            {privacyMode ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Privacy On
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Privacy Off
              </>
            )}
          </Button>
        </div>
      </header>

      {/* EmailView Component */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-card rounded-xl overflow-hidden h-[calc(100vh-140px)]">
          <EmailView
            email={selectedEmail}
            onBack={handleBack}
            privacyMode={privacyMode}
          />
        </div>
      </main>
    </div>
  );
}
