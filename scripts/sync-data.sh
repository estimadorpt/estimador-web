#!/bin/bash
# Sync data from sibling model projects into public/data/
# Usage: ./scripts/sync-data.sh [section]
# Examples:
#   ./scripts/sync-data.sh          # sync all
#   ./scripts/sync-data.sh football # sync football only
#   ./scripts/sync-data.sh elections # sync elections only

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/public/data"

SECTION="${1:-all}"

sync_football() {
  local FOOTBALL_SRC="$HOME/code/football/output/2025-26/predictions"
  local FOOTBALL_DEST="$DATA_DIR/football/liga-2025-26"

  if [ ! -d "$FOOTBALL_SRC" ]; then
    echo "Warning: Football source not found at $FOOTBALL_SRC"
    return 1
  fi

  mkdir -p "$FOOTBALL_DEST"
  cp "$FOOTBALL_SRC"/*.json "$FOOTBALL_DEST/"
  echo "Synced football data from $FOOTBALL_SRC"
  echo "  Files: $(ls "$FOOTBALL_DEST" | wc -l | tr -d ' ')"
}

sync_elections() {
  echo "Election data is managed manually in public/data/elections/"
  echo "  Presidential: $(ls "$DATA_DIR/elections/presidential-2026/" 2>/dev/null | wc -l | tr -d ' ') files"
  echo "  Parliamentary: $(ls "$DATA_DIR/elections/parliamentary-2025/" 2>/dev/null | wc -l | tr -d ' ') files"
}

case "$SECTION" in
  football)
    sync_football
    ;;
  elections)
    sync_elections
    ;;
  all)
    sync_football
    sync_elections
    ;;
  *)
    echo "Unknown section: $SECTION"
    echo "Usage: $0 [football|elections|all]"
    exit 1
    ;;
esac

echo "Done."
