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
  local FOOTBALL_SRC="$HOME/code/estimador-football/output/2025-26/predictions"
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

sync_economics() {
  local ECONOMICS_SRC="$HOME/code/estimador-economics/output"
  local ECONOMICS_DEST="$DATA_DIR/economics"

  if [ ! -d "$ECONOMICS_SRC" ]; then
    echo "Warning: Economics source not found at $ECONOMICS_SRC"
    return 1
  fi

  mkdir -p "$ECONOMICS_DEST"
  # Publish ONLY the production nowcast, renamed to nowcast.json (the file the web
  # app reads). NEVER `cp *.json` here: output/ holds ~190 internal research/eval
  # artifacts (backtest_*, bayesian_dfm_eval_*, statistical_validation_*, ...) that
  # must not be published to the public site.
  if [ -f "$ECONOMICS_SRC/nowcast_latest.json" ]; then
    cp "$ECONOMICS_SRC/nowcast_latest.json" "$ECONOMICS_DEST/nowcast.json"
    echo "Synced economics nowcast -> $ECONOMICS_DEST/nowcast.json"
  else
    echo "No economics nowcast at $ECONOMICS_SRC/nowcast_latest.json (run the daily pipeline first)"
    return 1
  fi
}

case "$SECTION" in
  football)
    sync_football
    ;;
  elections)
    sync_elections
    ;;
  economics)
    sync_economics
    ;;
  all)
    sync_football
    sync_elections
    sync_economics
    ;;
  *)
    echo "Unknown section: $SECTION"
    echo "Usage: $0 [football|elections|economics|all]"
    exit 1
    ;;
esac

echo "Done."
