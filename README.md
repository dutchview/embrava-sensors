# Embrava Sensors

Next.js application for integrating Embrava DMS desk sensors with FlexWhere. Manages workplaces, handles webhook events from Embrava sensors, and syncs bookings.

## Quick Start with Claude Code

If you have [Claude Code](https://claude.com/claude-code) installed, run the `/dev` skill to set up the entire dev environment in one command:

```
/dev
```

This automatically:
1. Opens ngrok, Docker, and the dev server in separate [cmux](https://github.com/anthropics/claude-code/blob/main/docs/cmux.md) tabs
2. Polls the ngrok API until the tunnel is ready
3. Updates `WEBHOOK_BASE_URL` in `.env` with the new ngrok URL

### Dependencies for `/dev`

- [Claude Code](https://claude.com/claude-code) with cmux support
- [ngrok](https://ngrok.com/) — authenticated and installed
- [Docker](https://www.docker.com/) — for MongoDB via docker-compose
- [Bun](https://bun.sh/) — JS runtime

## Manual Setup

1. **Start MongoDB**
   ```bash
   docker-compose up -d
   ```

2. **Start ngrok tunnel**
   ```bash
   ngrok http 3000
   ```

3. **Set webhook URL in `.env`**
   ```
   WEBHOOK_BASE_URL=https://your-url.ngrok-free.app
   ```

4. **Start the dev server**
   ```bash
   bun run dev
   ```

5. **Add workplaces** — Go to [http://localhost:3000/workplaces](http://localhost:3000/workplaces) and add desk configurations with DeskSignIDs matching your Embrava sensors.
