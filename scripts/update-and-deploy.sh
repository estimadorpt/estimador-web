#!/bin/bash
# RETIRED 2026-08-28. Do not schedule this, and do not resurrect it as-is.
#
# This ran from a crontab entry (*/30 14-23 * * 6,0) and published exactly
# nothing in the time it was scheduled. Two independent faults, both silent:
#
#   1. cron never fired it. The entry's `>> /tmp/liga-update.log` redirect
#      creates that file on the first run, before this script executes. The
#      file had never existed, on a machine whose /tmp still held files from
#      five weeks earlier.
#   2. Firing would not have helped. cron hands a job
#      PATH=/usr/bin:/bin:/usr/sbin:/sbin. `uv` lives in ~/.local/bin, `npm`
#      and `node` in /opt/homebrew/bin — none are on that path. Step 1 was
#      `if ! uv run liga-predict ...; then echo "failed or no new results";
#      exit 0; fi`, so "command not found" exited 0 every 30 minutes.
#
# The tell was in git: this repo carries no commit with the message this
# script would have written, ever. Every data commit here was made by hand.
#
# It was also a lossy duplicate of `liga-predict --update --scenarios --sync`,
# which already syncs, commits and pushes — and does it better: it refuses to
# commit off main, and it stages with `git add` + `git diff --cached` rather
# than this script's `git diff --quiet`, which cannot see new files and so
# would have skipped any weekend that produced only a new md##.json.
#
# The schedule now lives in estimador-football/docs/com.estimador.publish.plist
# (launchd, the mechanism that demonstrably works on this Mac). See
# estimador-football/docs/COLLECTORS.md.
#
# Two steps here are not in the launchd job, because neither ever ran and
# neither is needed to deploy: `generate-social-content.py` (needs Azure
# OpenAI; liga-predict writes social.json itself) and `npm run build` (Azure
# SWA builds on push). Run them by hand if you want them.

echo "update-and-deploy.sh is retired — it never worked. See the comments above." >&2
echo "Use: cd ~/code/estimador-football && uv run liga-predict --update --scenarios --sync" >&2
exit 1
