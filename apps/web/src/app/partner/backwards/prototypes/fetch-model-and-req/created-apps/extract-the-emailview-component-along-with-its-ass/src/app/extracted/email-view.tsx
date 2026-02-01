// Ported from: source/src/components/EmailView.tsx
"use client";

import { DemoEmail } from './types';
import { ArrowLeft, Reply, Forward, Trash2 } from 'lucide-react';
import { Button } from './ui-components/button';

interface EmailViewProps {
  email: DemoEmail;
  onBack: () => void;
  privacyMode: boolean;
}

export function EmailView({ email, onBack, privacyMode }: EmailViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="flex flex-col h-full"
      role="article"
      aria-label={`Email from ${privacyMode ? 'hidden sender' : email.fromName}: ${email.subject}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2"
          aria-label="Go back to inbox"
        >
          <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
          Back to Inbox
        </Button>

        <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">
              {privacyMode ? '••••••' : email.fromName}
            </p>
            <p className="text-sm text-muted-foreground">
              {privacyMode ? '••••••@••••••' : email.from}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(email.date)}
          </p>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {email.body.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-lg leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-3 flex-wrap">
        <Button className="flex-1 min-w-[120px]" size="lg">
          <Reply className="w-5 h-5 mr-2" aria-hidden="true" />
          Reply
        </Button>
        <Button variant="secondary" className="flex-1 min-w-[120px]" size="lg">
          <Forward className="w-5 h-5 mr-2" aria-hidden="true" />
          Forward
        </Button>
        <Button variant="destructive" size="lg">
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
