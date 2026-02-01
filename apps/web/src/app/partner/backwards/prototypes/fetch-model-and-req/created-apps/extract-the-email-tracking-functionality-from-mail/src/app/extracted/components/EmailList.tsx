// Ported from: source/packages/dashboard/src/components/EmailList.tsx

import { TrackedEmail } from '../types';
import { formatDistanceToNow } from '../utils';

interface EmailListProps {
  emails: TrackedEmail[];
  onSelectEmail: (email: TrackedEmail) => void;
}

export default function EmailList({ emails, onSelectEmail }: EmailListProps) {
  return (
    <div className="email-list">
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          onClick={() => onSelectEmail(email)}
        />
      ))}
    </div>
  );
}

function EmailRow({ email, onClick }: { email: TrackedEmail; onClick: () => void }) {
  const isOpened = email.first_opened_at !== null;

  return (
    <div
      className={`email-row ${isOpened ? 'opened' : 'unopened'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="email-status">
        <span className={`status-dot ${isOpened ? 'opened' : 'unopened'}`} />
      </div>

      <div className="email-content">
        <div className="email-info">
          <span className="email-recipient">
            {email.recipient_email_hash
              ? `To: ${email.recipient_email_hash.substring(0, 8)}...`
              : 'Unknown recipient'}
          </span>
          <span className="email-time">
            Sent {formatDistanceToNow(new Date(email.sent_at))}
          </span>
        </div>

        {isOpened && (
          <div className="email-opens">
            <span className="open-count">
              {email.open_count} {email.open_count === 1 ? 'open' : 'opens'}
            </span>
            <span className="open-time">
              Last opened {formatDistanceToNow(new Date(email.last_opened_at!))}
            </span>
          </div>
        )}
      </div>

      <div className="email-actions">
        <span className={`status-badge ${isOpened ? 'opened' : 'unopened'}`}>
          {isOpened ? 'Opened' : 'Not opened'}
        </span>
        <svg
          className="chevron-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  );
}
