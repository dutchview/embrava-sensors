#!/bin/bash
# dev-setup.sh — starts the full dev environment
#
# Layout:
#   Left pane  → Claude Code (untouched)
#   Right pane → [bun dev] [ngrok] [docker]  (bun dev is focused)

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
NGROK_PORT=3000
NGROK_API="http://localhost:4040/api/tunnels"

echo "Starting dev environment for embrava-sensors..."

# ── 0. Name the workspace ─────────────────────────────────────────────────────
cmux rename-workspace "Embrava Sensors" 2>/dev/null || true

# ── 1. Identify current surface/pane/workspace (Claude lives here) ────────────
IDENTITY=$(cmux identify --json 2>/dev/null)
CURRENT_SURFACE=$(echo "$IDENTITY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('caller',{}).get('surface_ref','surface:2'))" 2>/dev/null)
CURRENT_PANE=$(echo "$IDENTITY"    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('caller',{}).get('pane_ref','pane:2'))" 2>/dev/null)
CURRENT_WS=$(echo "$IDENTITY"      | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('caller',{}).get('workspace_ref','workspace:2'))" 2>/dev/null)

# ── 2. Find an existing right pane in the CURRENT workspace only ──────────────
EXISTING_RIGHT_PANE=$(cmux tree 2>&1 | python3 -c "
import sys, re
lines = sys.stdin.read().splitlines()
current_ws = '$CURRENT_WS'
current_pane = '$CURRENT_PANE'
in_ws = False
for line in lines:
    if re.search(r'workspace ' + re.escape(current_ws) + r'\b', line):
        in_ws = True
        continue
    if in_ws and re.search(r'workspace workspace:\d+', line):
        break
    if in_ws:
        m = re.search(r'pane (pane:\d+)', line)
        if m and m.group(1) != current_pane:
            print(m.group(1))
            break
" 2>/dev/null)

# ── 3. Create right pane if needed, or reuse existing ────────────────────────
if [ -n "$EXISTING_RIGHT_PANE" ]; then
  RIGHT_PANE="$EXISTING_RIGHT_PANE"
  echo "Reusing existing right pane: $RIGHT_PANE"
else
  NEW_SPLIT_OUT=$(cmux new-split right --surface "$CURRENT_SURFACE" 2>&1)
  SPLIT_SURFACE=$(echo "$NEW_SPLIT_OUT" | awk '{print $2}')
  sleep 0.5
  RIGHT_PANE=$(cmux tree 2>&1 | python3 -c "
import sys, re
lines = sys.stdin.read().splitlines()
current_ws = '$CURRENT_WS'
current_pane = '$CURRENT_PANE'
in_ws = False
for line in lines:
    if re.search(r'workspace ' + re.escape(current_ws) + r'\b', line):
        in_ws = True
        continue
    if in_ws and re.search(r'workspace workspace:\d+', line):
        break
    if in_ws:
        m = re.search(r'pane (pane:\d+)', line)
        if m and m.group(1) != current_pane:
            print(m.group(1))
            break
" 2>/dev/null)
fi

if [ -z "$RIGHT_PANE" ]; then
  echo "ERROR: Could not find or create right pane"
  exit 1
fi

# ── 4. Get surfaces already in the right pane ─────────────────────────────────
EXISTING_SURFACES=$(cmux tree 2>&1 | python3 -c "
import sys, re
lines = sys.stdin.read().splitlines()
right_pane = '$RIGHT_PANE'
in_pane = False
surfaces = []
for line in lines:
    if re.search(r'pane ' + re.escape(right_pane) + r'\b', line):
        in_pane = True
        continue
    if in_pane and re.search(r'pane pane:\d+', line):
        break
    if in_pane:
        m = re.search(r'surface (surface:\d+)', line)
        if m:
            surfaces.append(m.group(1))
print(' '.join(surfaces))
" 2>/dev/null)

BUN_SURFACE=$(echo "$EXISTING_SURFACES" | awk '{print $1}')
NGROK_SURFACE=$(echo "$EXISTING_SURFACES" | awk '{print $2}')
DOCKER_SURFACE=$(echo "$EXISTING_SURFACES" | awk '{print $3}')

# ── 5. bun dev ────────────────────────────────────────────────────────────────
if [ -z "$BUN_SURFACE" ]; then
  BUN_SURFACE=$(cmux new-surface --type terminal --pane "$RIGHT_PANE" 2>&1 | awk '{print $2}')
fi
cmux rename-tab --surface "$BUN_SURFACE" "bun dev" 2>/dev/null || true
cmux send --surface "$BUN_SURFACE" "cd '$PROJECT_DIR' && bun run dev"$'\n'
sleep 0.3

# ── 6. ngrok ──────────────────────────────────────────────────────────────────
if [ -z "$NGROK_SURFACE" ]; then
  NGROK_SURFACE=$(cmux new-surface --type terminal --pane "$RIGHT_PANE" 2>&1 | awk '{print $2}')
fi
cmux rename-tab --surface "$NGROK_SURFACE" "ngrok" 2>/dev/null || true
cmux send --surface "$NGROK_SURFACE" "ngrok http $NGROK_PORT"$'\n'
sleep 0.3

# ── 7. docker ─────────────────────────────────────────────────────────────────
if [ -z "$DOCKER_SURFACE" ]; then
  DOCKER_SURFACE=$(cmux new-surface --type terminal --pane "$RIGHT_PANE" 2>&1 | awk '{print $2}')
fi
cmux rename-tab --surface "$DOCKER_SURFACE" "docker" 2>/dev/null || true
cmux send --surface "$DOCKER_SURFACE" "cd '$PROJECT_DIR' && docker-compose up"$'\n'

# ── 8. Focus bun dev tab ──────────────────────────────────────────────────────
cmux move-surface --surface "$BUN_SURFACE" --index 0 2>/dev/null || true

# ── 9. Poll ngrok API and update .env ────────────────────────────────────────
echo "Waiting for ngrok tunnel..."
for i in $(seq 1 30); do
  NGROK_URL=$(curl -s "$NGROK_API" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for t in data.get('tunnels', []):
        url = t.get('public_url', '')
        if url.startswith('https'):
            print(url)
            break
except: pass
" 2>/dev/null)
  [ -n "$NGROK_URL" ] && break
  sleep 1
done

if [ -z "$NGROK_URL" ]; then
  echo "ERROR: Could not get ngrok URL after 30s. Is ngrok installed and authenticated?"
  exit 1
fi

if grep -q "^WEBHOOK_BASE_URL=" "$ENV_FILE"; then
  sed -i '' "s|^WEBHOOK_BASE_URL=.*|WEBHOOK_BASE_URL=$NGROK_URL|" "$ENV_FILE"
else
  echo "WEBHOOK_BASE_URL=$NGROK_URL" >> "$ENV_FILE"
fi

echo ""
echo "Dev environment ready!"
echo "  ngrok:  $NGROK_URL"
echo "  Right pane tabs: [bun dev*] [ngrok] [docker]"
