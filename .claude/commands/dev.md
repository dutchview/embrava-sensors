Run the dev environment setup script using the Bash tool:

```
bash /Users/mauricejumelet/projects/flexwhere/embrava-sensors/scripts/dev-setup.sh
```

This will:
1. Open a new cmux terminal and start `ngrok http 3000`
2. Poll the ngrok API until the tunnel URL is available
3. Update `WEBHOOK_BASE_URL` in `.env` with the new ngrok URL
4. Open a new cmux terminal and run `docker-compose up`
5. Open a new cmux terminal and run `bun run dev`

After running, report the ngrok URL and confirm all three services are starting.
