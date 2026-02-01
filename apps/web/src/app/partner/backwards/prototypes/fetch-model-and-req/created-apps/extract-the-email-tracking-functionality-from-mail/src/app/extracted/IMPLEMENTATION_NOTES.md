# Implementation Notes

## What was extracted

This extraction focuses on the **core email tracking functionality** from MailSuite:

### ✅ Included
- **Tracking pixel generation** - Creates unique, signed URLs for 1x1 transparent PNGs
- **Open tracking** - Records when messages are opened with device info
- **Analytics dashboard** - Beautiful UI showing open rates, trends, and individual events
- **Mock data storage** - In-memory data that simulates a database
- **API endpoints** - Full REST API for tracking and analytics

### ❌ Excluded (as requested)
- Authentication (Google OAuth, user accounts)
- Subscription tiers (free/pro/team)
- Chrome extension
- Push notifications
- Billing/Stripe integration
- Real-time subscriptions (Supabase Realtime)

## Key differences from source

### Database
- **Source**: Supabase (PostgreSQL) with real-time subscriptions
- **Extracted**: In-memory mock data (`MOCK_TRACKED_EMAILS`, `MOCK_TRACKING_EVENTS`)
- **To upgrade**: Replace mock-data.ts with PostgreSQL, MongoDB, or JSON file storage

### Authentication
- **Source**: Supabase Auth with Google OAuth, user sessions, RLS policies
- **Extracted**: Single mock user, no authentication required
- **To upgrade**: Add NextAuth.js, Clerk, or Supabase Auth

### Backend
- **Source**: Supabase Edge Functions (Deno runtime)
- **Extracted**: Next.js API Routes (Node.js runtime)
- **Advantage**: Easier deployment, no Supabase dependency

### Frontend
- **Source**: Separate Vite + React app with React Router
- **Extracted**: Single Next.js page with tabs
- **Advantage**: Simpler setup, better performance

### Real-time updates
- **Source**: Supabase Realtime automatically pushes updates to dashboard
- **Extracted**: Manual refresh button
- **To upgrade**: Add polling, SSE, or WebSockets

## How to use for social media app

Since you want to use this for tracking message opens in a social media application:

### 1. Integration approach

**Option A: Embedded** (if your social app is also Next.js)
- Copy `src/app/extracted/*` into your app
- Update imports to match your structure
- Replace mock data with your database

**Option B: Separate service** (recommended for decoupling)
- Deploy this as a standalone Next.js app
- Your social app calls the API endpoints
- Tracking happens independently
- Example:
  ```typescript
  // In your social media app
  const { pixelUrl } = await fetch('https://tracking.yourapp.com/api/generate-tracking', {
    method: 'POST',
    body: JSON.stringify({ recipientEmailHash: userId })
  }).then(r => r.json());

  // Embed pixelUrl in your message
  ```

### 2. Adapting for social media messages

Instead of email HTML, embed the pixel in your message viewer:

```tsx
// In your message component
function MessageView({ message }) {
  return (
    <div>
      <p>{message.content}</p>

      {/* Tracking pixel */}
      {message.trackingPixelUrl && (
        <img
          src={message.trackingPixelUrl}
          width="1"
          height="1"
          style={{ display: 'none' }}
          alt=""
        />
      )}
    </div>
  );
}
```

### 3. Database schema

When you move from mock data to a real database, create these tables:

```sql
-- Tracked messages
CREATE TABLE tracked_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  tracking_id VARCHAR(255) UNIQUE NOT NULL,
  recipient_id VARCHAR(255),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_opened_at TIMESTAMP,
  last_opened_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Open events
CREATE TABLE tracking_events (
  id SERIAL PRIMARY KEY,
  tracking_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'open' or 'click'
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  FOREIGN KEY (tracking_id) REFERENCES tracked_messages(tracking_id)
);

-- Indexes for performance
CREATE INDEX idx_tracked_messages_user ON tracked_messages(user_id);
CREATE INDEX idx_tracking_events_tracking_id ON tracking_events(tracking_id);
```

### 4. API usage examples

**Generate tracking pixel before sending message:**
```typescript
const response = await fetch('/api/generate-tracking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmailHash: 'user-123',  // Your user ID
    metadata: {
      conversationId: 'conv-456',
      messageType: 'dm'
    }
  })
});

const { trackingId, pixelUrl } = await response.json();
// Store pixelUrl with your message in your DB
```

**Check if a message was opened:**
```typescript
const response = await fetch(`/api/events/${trackingId}`);
const { events } = await response.json();

if (events.length > 0) {
  console.log('Message was opened!');
  console.log('First open:', events[events.length - 1].occurred_at);
  console.log('Device:', events[events.length - 1].device_info);
}
```

## Performance considerations

### Current limitations (mock data)
- In-memory storage - resets on restart
- No pagination - all data loaded at once
- No caching

### Production recommendations
1. **Database**: Use connection pooling (pgBouncer, MongoDB connection limits)
2. **Caching**: Cache analytics with Redis/Vercel KV (1-5 minute TTL)
3. **CDN**: Serve tracking pixels from CDN (Cloudflare, CloudFront)
4. **Rate limiting**: Prevent abuse with rate limits on pixel endpoint
5. **Deduplication**: Track unique opens using fingerprints (user agent + IP)

## Testing

### Manual testing
1. Start the dev server: `npm run dev`
2. Visit http://localhost:3000/extracted
3. See pre-loaded mock data (7 messages, some opened, some not)
4. Click a message to see open events

### Test pixel tracking
```bash
# Generate new tracking pixel
curl -X POST http://localhost:3000/api/generate-tracking \
  -H "Content-Type: application/json" \
  -d '{"recipientEmailHash": "test-123"}'

# Simulate open (replace tracking ID and signature from above)
curl "http://localhost:3000/api/pixel/TRACKING_ID?sig=SIGNATURE"

# Refresh dashboard to see the new message
```

### Integration testing
Create a test message flow:
1. Generate tracking pixel
2. Store pixel URL with message
3. Render message with pixel
4. Verify open is recorded
5. Check analytics update

## Next steps

1. **Choose a database** - PostgreSQL, MongoDB, or SQLite
2. **Implement persistence** - Replace mock-data.ts with DB queries
3. **Add authentication** (optional) - If you want multi-user support
4. **Deploy** - Vercel, Railway, or your preferred platform
5. **Configure DNS** - Point tracking subdomain to your app
6. **Set environment variables** - TRACKING_SECRET, DATABASE_URL, etc.

## Questions?

Common issues and solutions:

**Q: Can I track link clicks too?**
A: Yes! Add a `/api/click/[trackingId]` endpoint that records clicks and redirects.

**Q: How do I prevent double-counting opens?**
A: Implement deduplication using fingerprints (hash of tracking ID + user agent + IP).

**Q: Can this work without images (e.g., native mobile apps)?**
A: Yes! Call the pixel endpoint directly when message is viewed, ignore the PNG response.

**Q: How do I delete old data?**
A: Add a cleanup job that deletes events older than X days (GDPR compliance).

**Q: Can I self-host?**
A: Absolutely! This is a standard Next.js app - deploy anywhere Node.js runs.
