# Quick Start Guide

Get the email tracking dashboard running in 3 minutes!

## ⚡ Fastest start

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start the development server
npm run dev

# 3. Open the dashboard
open http://localhost:3000/extracted
```

That's it! You'll see a pre-populated dashboard with 7 tracked messages and their open events.

## 🎯 Test the tracking flow

### Step 1: Generate a tracking pixel

```bash
curl -X POST http://localhost:3000/api/generate-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmailHash": "my-test-message",
    "metadata": { "test": true }
  }'
```

You'll get a response like:
```json
{
  "trackingId": "l9x2k4p-a1b2c3d4e5f6g7h8",
  "pixelUrl": "http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=abc123",
  "expiresAt": "2027-02-01T12:00:00.000Z"
}
```

### Step 2: Simulate opening the message

Visit the pixel URL (or use curl):

```bash
curl "http://localhost:3000/api/pixel/l9x2k4p-a1b2c3d4e5f6g7h8?sig=abc123"
```

You'll get back a 1x1 transparent PNG, and the open will be recorded!

### Step 3: View the results

1. Go back to http://localhost:3000/extracted
2. Click the **Refresh** button
3. You should see your new message at the top
4. Click on it to see the open event details

## 📊 What you can do

### Dashboard Tab
- View all tracked messages
- Filter by: All / Opened / Unopened
- See open counts and timestamps
- Click any message to see detailed events

### Analytics Tab
- All-time stats (total tracked, opened, open rate)
- This week's stats
- 14-day activity chart showing sent vs opened

### Email Detail Modal
- Individual open events with timestamps
- Device information (browser, OS, mobile/desktop)
- Activity timeline

## 🔧 For your social media app

### Embedding in messages

When rendering a message, add the tracking pixel:

```tsx
function Message({ content, trackingPixelUrl }) {
  return (
    <div className="message">
      <p>{content}</p>

      {/* Hidden tracking pixel */}
      {trackingPixelUrl && (
        <img
          src={trackingPixelUrl}
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

### Workflow

1. **Before sending a message:**
   ```typescript
   const { pixelUrl } = await generateTrackingPixel(recipientId);
   // Save pixelUrl with your message in your database
   ```

2. **When recipient views the message:**
   - The pixel automatically loads
   - Open is recorded with device info
   - No additional code needed!

3. **Check if opened:**
   ```typescript
   const { events } = await fetch(`/api/events/${trackingId}`).then(r => r.json());
   const wasOpened = events.length > 0;
   ```

## 🚀 Next steps

1. **Read the full README** → `README.md` for complete documentation
2. **Check implementation notes** → `IMPLEMENTATION_NOTES.md` for integration details
3. **Replace mock data** → Connect to your real database
4. **Deploy** → Vercel, Railway, or your preferred platform

## 💡 Pro tips

- **Privacy**: IP addresses are automatically anonymized
- **Security**: All pixel URLs include HMAC signatures to prevent tampering
- **Performance**: The pixel endpoint always returns instantly (tracking happens async)
- **Reliability**: Even if tracking fails, the pixel is still served (doesn't break messages)

## 🐛 Troubleshooting

**Nothing showing up?**
- Make sure you're on http://localhost:3000/extracted (note the `/extracted` path)
- Check that the dev server is running (`npm run dev`)

**Tracking not working?**
- Verify the signature in the pixel URL matches (use the exact URL from generate-tracking)
- Check the browser console for errors
- Try opening the pixel URL directly to see if it returns an image

**Styles broken?**
- Clear Next.js cache: `rm -rf .next && npm run dev`
- Make sure `styles.css` is being imported in `page.tsx`

## 📚 Files overview

```
src/app/extracted/
├── page.tsx              → Main UI (dashboard + analytics tabs)
├── actions.ts            → Business logic and data fetching
├── types.ts              → TypeScript types
├── utils.ts              → Helper functions
├── mock-data.ts          → In-memory database (replace in production)
├── styles.css            → All styles
└── components/
    ├── StatsCard.tsx     → Metric cards
    ├── EmailList.tsx     → Message list
    └── EmailDetail.tsx   → Detail modal

src/app/api/
├── emails/route.ts               → GET list of messages
├── events/[trackingId]/route.ts  → GET open events
├── analytics/
│   ├── summary/route.ts          → GET overall stats
│   └── daily/route.ts            → GET daily trends
├── pixel/[trackingId]/route.ts   → GET tracking pixel (records open)
└── generate-tracking/route.ts    → POST create tracking pixel
```

---

**Ready to track some messages? Start with the test commands above!** 🎉
