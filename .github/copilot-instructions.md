# Embrava Sensors Integration

## Architecture Overview

This is a Next.js 16 app that integrates with the **Embrava DMS API** to manage desk sensors and workplace bookings. The integration is **bidirectional**:

1. **Embrava → App (PUSH)**: Embrava sends events via webhooks to `/api/embrava/events` (booking actions, status changes)
2. **Embrava → App (PULL)**: Embrava requests workspace config via webhook to `/api/embrava/workspace`
3. **App → Embrava**: App can send bookings/alerts using `EmbravaClient` in `src/lib/embrava/client.ts`

Data flows: Embrava DMS ↔ Next.js API Routes ↔ MongoDB (workplaces & events collections)

## Critical Setup & Workflows

### Environment Configuration

Required env vars (see `.env_template`):

- `EMBRAVA_ORGANIZATION_ID` & `EMBRAVA_SECRET_KEY` - API credentials
- `WEBHOOK_SECRET` - Validates incoming webhooks (use `uuidgen` to generate)
- `WEBHOOK_BASE_URL` - Public URL for webhook registration (use ngrok for local dev)
- `MONGODB_URI` - MongoDB connection string

### Development Startup

```bash
# 1. Start MongoDB
docker-compose up -d

# 2. Set ngrok URL (required for webhooks)
export WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app

# 3. Start dev server
npm run dev
```

**Key**: App uses Next.js instrumentation (`src/instrumentation.ts`) to auto-connect to MongoDB and register webhooks on startup. Webhook registration auto-cleans old ngrok/localhost webhooks before registering new ones.

## Code Conventions

### Data Models

- **Mongoose models** in `src/lib/db/models/` prevent recompilation: `mongoose.models.Workplace || mongoose.model(...)`
- **Day availability** is a strict tuple: `[enabled: "true"|"false", startTime: "HH:mm:ss", endTime: "HH:mm:ss"]`
- **Timezone defaults** to `Europe/Amsterdam`
- **deskId vs deskSignId**: `deskId` is our internal ID (ObjectId string), `deskSignId` is Embrava's hardware ID

### API Routes Pattern

All Embrava webhook endpoints (`/api/embrava/*`) validate `secret` header:

```typescript
const secret = request.headers.get("secret");
if (secret !== process.env.WEBHOOK_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Return Embrava-specific response format: `{ ID: 0, Message: "success" }` for events endpoint.

### State Management

- Use **SWR** for data fetching (see `src/lib/hooks/use-workplaces.ts`)
- Custom hooks return `{ data, isLoading, isError, error, mutate }`
- Forms use **react-hook-form** with **Zod** validation

### UI Components

- **shadcn/ui** components in `src/components/ui/`
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Import paths use `@/*` alias (configured in `tsconfig.json`)

## Integration Points

### Embrava Client (`src/lib/embrava/client.ts`)

- Singleton instance: `embravaClient`
- Auto-caches auth tokens for 6 hours (with 5min buffer)
- All methods auto-authenticate before API calls
- Main methods: `getWebhooks()`, `createWebhook()`, `deleteWebhook()`, `sendBooking()`, `sendAlert()`

### Webhook Management (`src/lib/embrava/webhooks.ts`)

- `registerWebhooks()`: Cleans old webhooks matching patterns (ngrok, localhost, embrava-sensors, 127.0.0.1), then registers EVENT and WORKSPACE webhooks
- Called automatically in `instrumentation.ts` if `WEBHOOK_BASE_URL` is set

### Database Connection (`src/lib/db/mongodb.ts`)

- Uses global caching to prevent multiple connections in dev (Next.js hot reload)
- Pattern: `global.mongooseCache` stores connection promise
- Always `await connectToDatabase()` in API routes before querying

## Common Tasks

**Add new workplace**: POST `/api/workplaces` with `{ deskSignId, deskName, timezone?, mon?, tue?, ... }`

**Query events**: `Event.find({ deskSignId }).sort({ dateCreated: -1 })` - compound index on `(dateCreated, deskSignId)`

**Modify Embrava types**: Update `src/lib/embrava/types.ts` - types mirror Embrava API docs in `docs/API Reference_Embrava_DMS_v3.1.pdf`

**Debug webhooks**: Check terminal for "Received event from Embrava:" logs in `/api/embrava/events` route
