# Extracted Components - Isolated Preview System

## Overview

Each extracted component in this directory can run independently on its own development server with isolated dependencies. This prevents conflicts with the main application.

## How It Works

### 1. **Isolated Development Servers**
When you view a component from the Gallery:
- The system automatically starts a dev server on a unique port (starting from 4000)
- Dependencies are installed if needed (using `bun install`)
- The component runs completely isolated from the main app (port 3001)

### 2. **Automatic Port Management**
- Main app: `http://localhost:3001`
- Component previews: `http://localhost:4000`, `4001`, `4002`, etc.
- Each component gets its own port automatically

### 3. **Component Requirements**

For a component to be previewable, it must have:
```
component-name/
├── package.json          # With "dev" script
├── src/
│   └── app/
│       └── extracted/
│           └── page.tsx  # The component entry point
└── ...
```

**Required package.json scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Workflow

### Viewing a Component
1. Navigate to **Gallery** (`/partner/gallery`)
2. Click on any component card
3. System automatically:
   - Checks if dependencies are installed
   - Installs them if missing (`bun install`)
   - Starts dev server on available port
   - Shows loading state while server starts
   - Displays component in iframe once ready

### Component Status
- **Loading**: Preparing preview server
- **Starting**: Installing dependencies and starting dev server
- **Ready**: Component is running and viewable
- **Error**: Failed to start (check console for details)

## API Endpoints

### Start/Stop Preview Servers
```typescript
POST /api/components/preview
{
  "componentId": "component-name",
  "action": "start" | "stop" | "status"
}
```

### List Running Servers
```typescript
GET /api/components/preview
// Returns array of running preview servers
```

## Development

### Adding a New Component
When extracting a new component, ensure:
1. It has a valid `package.json` with dev script
2. It has `src/app/extracted/page.tsx` entry point
3. All dependencies are listed in package.json

### Manual Preview Testing
```bash
cd created-apps/your-component-name
bun install
bun run dev -- --port 4000
# Visit http://localhost:4000/extracted
```

## Benefits

✅ **No Dependency Conflicts**: Each component uses its own dependencies  
✅ **Port Isolation**: Main app never affected by preview servers  
✅ **Independent Development**: Test components without restarting main app  
✅ **Automatic Setup**: Dependencies installed on-demand  
✅ **Multi-Component**: View multiple components simultaneously on different ports  

## Troubleshooting

### Preview Won't Start
- Check component has `package.json`
- Verify `dev` script exists
- Check console logs for detailed errors
- Try manually: `cd component && bun install && bun dev`

### Port Already in Use
- System automatically finds next available port
- Check running servers: `GET /api/components/preview`
- Stop unused servers if needed

### Build Errors in Component
- Check component's dependencies are correct
- Ensure Next.js version compatibility
- Review component's own build output
- Each component is independent - fix in that directory
