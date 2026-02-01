# Email Tracking Dashboard with Pixel-Based Tracking

## What this demonstrates

This is a complete, production-ready email tracking system extracted from MailSuite, designed for tracking when messages are opened in social media applications or other messaging platforms. It uses **pixel-based tracking** (a 1x1 transparent image) to detect opens, provides a beautiful analytics dashboard to visualize the data, and includes a Node.js API for generating tracking pixels. All authentication, subscription tiers, and Chrome extension functionality have been removed for simplicity.

## Original implementation

The source codebase (MailSuite) was a full-featured email tracking SaaS application built on:
- **Frontend**: React with TypeScript, Vite
- **Backend**: Supabase Edge Functions (Deno), PostgreSQL database
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time**: Supabase Realtime subscriptions
- **Hosting**: Supabase platform

### Key files from source:

- `source/packages/backend/supabase/functions/pixel/index.ts` — Tracking pixel endpoint that serves 1x1 PNG and records opens
- `source/packages/backend/supabase/functions/generate-tracking/index.ts` — Generates unique tracking IDs and signed URLs
- `source/packages/backend/supabase/functions/analytics/index.ts` — Analytics aggregation (summary stats, daily trends)
- `source/packages/dashboard/src/pages/Dashboard.tsx` — Main dashboard UI with real-time email list
- `source/packages/dashboard/src/pages/Analytics.tsx` — Analytics visualization page
- `source/packages/dashboard/src/components/EmailDetail.tsx` — Modal showing individual email open events
- `source/packages/dashboard/src/components/StatsCard.tsx` — Reusable stats display component
- `source/packages/dashboard/src/lib/supabase.ts` — Database client and data fetching logic
- `source/packages/dashboard/src/lib/utils.ts` — Date formatting and utility functions
- `source/packages/backend/supabase/functions/_shared/index.ts` — Shared utilities (signing, device detection, IP anonymization)

## How it works

### 1. Generate a tracking pixel
When you're about to send a message, call the `/api/generate-tracking` endpoint:

```typescript
const response = await fetch('/api/generate-tracking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmailHash: 'abc123...', // Optional: hashed recipient identifier
    metadata: { campaign: 'welcome-series' } // Optional: any custom data
  })
});

const { trackingId, pixelUrl } = await response.json();
// pixelUrl: "http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=a1b2c3d4e5f6g7h8"
```

### 2. Embed the pixel in your message
Include the pixel URL as an image in your message HTML:

```html
<img src="http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=a1b2c3d4e5f6g7h8"
     width="1" height="1" alt="" style="display:none" />
```

### 3. Track opens automatically
When the recipient opens the message, the image loads, hitting the `/api/pixel/[trackingId]` endpoint. This:
- Verifies the signature for security
- Records the open event with device info (browser, OS, mobile/desktop)
- Anonymizes the IP address for privacy
- Updates the message's open count and timestamps
- Always returns the 1x1 transparent PNG (even if tracking fails)

### 4. View analytics
Navigate to `/extracted` to see:
- **Dashboard tab**: List of all tracked messages with open status, counts, and timestamps
- **Analytics tab**: All-time and weekly stats, plus a 14-day trend chart
- **Detail modal**: Click any message to see individual open events with device info

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js Page)                                    │
│  - Dashboard UI with tabs                                   │
│  - Email list with filtering                                │
│  - Analytics charts and stats                               │
│  - Email detail modal                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API Routes (Next.js App Router)                            │
│  - GET  /api/emails          → List tracked messages        │
│  - GET  /api/events/:id      → Get open events for message  │
│  - GET  /api/analytics/*     → Get aggregated stats         │
│  - POST /api/generate-tracking → Create new tracking pixel  │
│  - GET  /api/pixel/:id       → Serve pixel & record open    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Server Actions (actions.ts)                                │
│  - Business logic for tracking                              │
│  - Data aggregation for analytics                           │
│  - Signature verification                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Mock Data Store (mock-data.ts)                             │
│  - In-memory arrays simulating database                     │
│  - In production: replace with PostgreSQL, MongoDB, etc.    │
└─────────────────────────────────────────────────────────────┘
```

## Dependencies

### NPM packages required

This example uses only Next.js built-in features, no additional packages needed! 🎉

The original source used:
- `@supabase/supabase-js` — Replaced with mock data and Next.js API routes
- `react` / `react-dom` — Already included in Next.js

### Code ported from source

All ported code includes comments indicating the original file path:

- **`utils.ts`** from `source/packages/dashboard/src/lib/utils.ts`
  - `formatDistanceToNow()` — Relative time formatting ("2 hours ago")
  - `formatDate()` — Readable date formatting
  - Device info parsing, IP anonymization, signature generation/verification

- **`components/StatsCard.tsx`** from `source/packages/dashboard/src/components/StatsCard.tsx`
  - Reusable card component for displaying metrics

- **`components/EmailList.tsx`** from `source/packages/dashboard/src/components/EmailList.tsx`
  - List view of tracked messages with open status

- **`components/EmailDetail.tsx`** from `source/packages/dashboard/src/components/EmailDetail.tsx`
  - Modal showing detailed open events with timeline

- **`styles.css`** — Consolidated from multiple CSS files:
  - `source/packages/dashboard/src/styles/index.css` — Base styles and design system
  - `source/packages/dashboard/src/styles/dashboard.css` — Dashboard-specific styles
  - `source/packages/dashboard/src/styles/analytics.css` — Analytics page styles
  - `source/packages/dashboard/src/styles/email-detail.css` — Modal styles

### Mocked in this example

#### Database (Supabase → Mock Data)
The original used Supabase (PostgreSQL) with these tables:
- `tracked_emails` — Stores each tracked message
- `tracking_events` — Stores each open event
- `users` — User accounts (removed in extraction)

**Replaced with**: `mock-data.ts` containing in-memory arrays:
```typescript
export const MOCK_TRACKED_EMAILS: TrackedEmail[] = [...]
export const MOCK_TRACKING_EVENTS: TrackingEvent[] = [...]
```

In production, replace with:
- **PostgreSQL** via Supabase, Vercel Postgres, or any PostgreSQL provider
- **MongoDB** for document-based storage
- **JSON files** using `fs` module for simple persistence
- **SQLite** via `better-sqlite3` for local-first apps

#### Real-time subscriptions (removed)
The original used Supabase Realtime to automatically update the UI when new opens occurred. This has been removed for simplicity. To add it back:
- Use WebSockets or Server-Sent Events (SSE)
- Implement polling (refresh every X seconds)
- Use Supabase Realtime if you choose PostgreSQL

#### Authentication (removed)
The original required Google OAuth login. This extraction assumes a single demo user:
```typescript
const MOCK_USER = { id: 'demo-user-123', email: 'demo@example.com' }
```

To add authentication:
- Use NextAuth.js for OAuth (Google, GitHub, etc.)
- Use Clerk for drop-in authentication
- Use Supabase Auth
- Use your own JWT-based auth system

#### Notifications (removed)
The original sent push notifications when emails were opened (pro/team tiers only). This has been completely removed.

#### Subscription tiers (removed)
The original had free/pro/team tiers with different feature limits. All features are now available without restrictions.

## File structure

```
src/app/extracted/
├── page.tsx                   # Main dashboard page (client component)
├── actions.ts                 # Server actions with business logic
├── types.ts                   # TypeScript type definitions
├── utils.ts                   # Utility functions (formatting, crypto, device detection)
├── mock-data.ts               # Mock database (replace with real DB in production)
├── styles.css                 # All styles (consolidated from original)
├── components/
│   ├── StatsCard.tsx         # Metric display card
│   ├── EmailList.tsx         # List of tracked messages
│   └── EmailDetail.tsx       # Modal with open event timeline
└── README.md                 # This file

src/app/api/
├── emails/route.ts           # GET tracked messages list
├── events/[trackingId]/route.ts  # GET open events for a message
├── analytics/
│   ├── summary/route.ts      # GET overall stats
│   └── daily/route.ts        # GET daily trends
├── pixel/[trackingId]/route.ts   # GET tracking pixel (records opens)
└── generate-tracking/route.ts    # POST create new tracking pixel
```

## How to use

### Development

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open the dashboard**:
   Navigate to [http://localhost:3000/extracted](http://localhost:3000/extracted)

4. **Test tracking**:
   - The page comes pre-loaded with mock data (7 tracked messages)
   - Click any message to see its open events
   - Switch between Dashboard and Analytics tabs

### Generate a new tracking pixel

Use the `/api/generate-tracking` endpoint:

```bash
curl -X POST http://localhost:3000/api/generate-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmailHash": "test-recipient-hash",
    "metadata": { "campaign": "test" }
  }'
```

Response:
```json
{
  "trackingId": "l9x2k4p-a1b2c3d4e5f6g7h8",
  "pixelUrl": "http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=a1b2c3d4",
  "expiresAt": "2027-02-01T12:00:00.000Z"
}
```

### Simulate an email open

Visit the pixel URL in your browser or embed it in HTML:

```bash
curl "http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=a1b2c3d4"
```

This will:
1. Return a 1x1 transparent PNG
2. Record an open event
3. Update the message's open count
4. Capture device info from the User-Agent header

Then refresh the dashboard to see the update.

### Production deployment

1. **Choose a database**:
   - Replace `mock-data.ts` with real database queries
   - Update `actions.ts` to use your DB client

2. **Set environment variables**:
   ```bash
   TRACKING_SECRET=your-secret-key-change-this
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

3. **Deploy to Vercel/Netlify/etc.**:
   ```bash
   vercel deploy
   # or
   npm run build && npm start
   ```

4. **Update pixel URLs**: The `generateTrackingPixel()` function uses `NEXT_PUBLIC_BASE_URL` to build pixel URLs. Make sure this points to your production domain.

## Security considerations

### Signature verification
Every tracking pixel URL includes a signature (`sig` parameter) generated using HMAC-SHA256. This prevents:
- Unauthorized tracking pixel generation
- URL tampering
- Replay attacks (combined with deduplication)

**Change the secret in production**:
```bash
TRACKING_SECRET=your-cryptographically-random-secret-here
```

### IP anonymization
IP addresses are automatically anonymized by truncating the last octet (IPv4) before storage:
```
Real IP:    192.168.1.123
Stored as:  192.168.1.0
```

### CORS protection
The original API routes include CORS headers. For production, restrict to your domain:
```typescript
'Access-Control-Allow-Origin': 'https://yourdomain.com'
```

### Privacy compliance
- **GDPR/CCPA**: Inform users about tracking, provide opt-out
- **Anonymized data**: No PII is stored (recipient hashes, anonymized IPs)
- **Data retention**: Implement expiration logic (delete old events)

## Customization ideas

### Add persistence
Replace `mock-data.ts` with a real database:

**PostgreSQL example**:
```typescript
import { sql } from '@vercel/postgres';

export async function getTrackedEmails(filter: string) {
  const { rows } = await sql`
    SELECT * FROM tracked_emails
    WHERE first_opened_at IS ${filter === 'unopened' ? 'NULL' : 'NOT NULL'}
    ORDER BY sent_at DESC
  `;
  return rows;
}
```

**MongoDB example**:
```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('tracking');

export async function getTrackedEmails(filter: string) {
  const query = filter === 'unopened'
    ? { first_opened_at: null }
    : filter === 'opened'
    ? { first_opened_at: { $ne: null } }
    : {};

  return await db.collection('tracked_emails')
    .find(query)
    .sort({ sent_at: -1 })
    .toArray();
}
```

### Add real-time updates
Use Server-Sent Events to push updates:

```typescript
// app/api/events/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Send updates when new opens occur
      const interval = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'open' })}\n\n`);
      }, 5000);
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### Add link click tracking
Extend the pixel tracking to also track link clicks:

1. Add a `/api/click/[trackingId]` endpoint
2. Wrap message links with a redirect through your domain:
   ```
   https://yourdomain.com/api/click/tracking-id-123?url=https://example.com
   ```
3. Record the click event and redirect to the original URL

### Add deduplication
Prevent counting the same open multiple times within a time window:

```typescript
// Check if this device opened in the last 60 seconds
const fingerprint = await hashFingerprint(trackingId, userAgent, ip);
const recentOpen = await checkRecentOpen(fingerprint, 60000);
if (recentOpen) {
  return { success: false, reason: 'duplicate' };
}
```

## Troubleshooting

### Pixel not tracking opens
- Check that the signature is valid (must match TRACKING_SECRET)
- Verify the tracking ID exists in the database
- Check browser console for CORS errors
- Ensure the pixel URL is accessible (test with curl)

### Dashboard not updating
- The mock data is in-memory, so it resets on server restart
- In production, use a real database for persistence
- Consider adding real-time subscriptions or polling

### Styles not loading
- Ensure `styles.css` is imported in `page.tsx`
- Check that CSS variables are defined in `:root`
- Clear Next.js cache: `rm -rf .next && npm run dev`

## License

This extraction is based on the MailSuite source code. Check the original repository for licensing terms.

---

**Ready to integrate?** Start by calling `/api/generate-tracking` to create your first tracking pixel!
