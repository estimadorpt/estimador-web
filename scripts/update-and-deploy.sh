#!/bin/bash
# Automated pipeline: fetch results → re-run model → sync → build → deploy
# Run via cron on matchday weekends:
#   */30 14-23 * * 6,0 ~/code/estimador-web/scripts/update-and-deploy.sh >> /tmp/liga-update.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FOOTBALL_DIR="$HOME/code/football"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Starting update pipeline"

# Step 1: Run model update (fetches results, re-fits if new data)
cd "$FOOTBALL_DIR"
if ! uv run liga-predict --update --scenarios; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') — liga-predict --update failed or no new results"
  exit 0
fi

# Step 2: Sync data to web project
cd "$PROJECT_DIR"
./scripts/sync-data.sh football

# Step 3: Check if data actually changed
if git diff --quiet public/data/football/; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') — No data changes after sync"
  exit 0
fi

# Step 4: Build
echo "$(date '+%Y-%m-%d %H:%M:%S') — Building..."
npm run build

# Step 5: Commit and push
git add public/data/football/
git commit -m "$(cat <<'EOF'
data: update predictions after matchday results
EOF
)"
git push

echo "$(date '+%Y-%m-%d %H:%M:%S') — Deploy triggered (Azure SWA auto-deploys on push)"
