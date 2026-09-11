# Estimador relaunch — 26 September 2026

Objective: improve the whole site and every product, document the defects and improvements, then repair and verify them. All planned pages remain in scope. The previous review's suggestion of a smaller public launch is superseded by this objective.

## What counts as finished

Every published and planned page has complete Portuguese and English content, accurate product and data status, working direct links, useful navigation, accessible keyboard/mobile interactions, and an appropriate sharing preview. Every numerical claim has traceable data, a date and honest limitations. Interactive tools handle missing data and failed requests without mislabelling results. Mandatory build, type, lint, unit, data and exported-route checks pass. A browser rehearsal covers every route template and main user journey. The final population release passes the producer's publication gates and drives every population surface. Deployment and a live-host rehearsal are still required before the relaunch can be called complete.

No repaired item is considered verified merely because the source was edited. Local verification and live verification are recorded separately. Existing review findings are evidence, not proof of the current status after edits.

## Evidence and working records

- [Initial launch review](launch-readiness-review-2026-09-07.md): fourteen detailed findings, including population contract, disclosure, stale-result, analytics and performance reproductions.
- [Product audit](relaunch-product-audit.md): expanded route-by-route review and election, football and economics defects (being prepared).
- [Navigation repair notes](relaunch-navigation-notes.md) and [editorial repair notes](relaunch-editorial-notes.md): implementation and verification records (being prepared).
- Local review artifacts: `output/playwright/launch-review-2026-09-07/`.
- Working branch: `codex/september-relaunch`. Merged to `main` and deployed on 11 September 2026; see "State on 11 September 2026" at the end of this document. Pre-existing `scripts/update-and-deploy.sh` changes belong to the earlier updater repair and must be preserved.

## Defect and improvement register

| ID | Area | Required repair / improvement | State |
|---|---|---|---|
| WEB-01 | Hosting | Real articles, icons, logos, robots and sitemap must load; unknown URLs must remain 404. Verify Azure behavior separately from local preview. | Repaired locally; **live verification still required** — the fix is a deploy away |
| WEB-02 | Navigation | Click/keyboard dropdowns, Escape, focus, translated controls, named home link and skip link; discover every product and secondary page. | Done (local) |
| WEB-03 | Search/sharing | Canonical and language alternates, per-page image/title/description; complete sitemap and durable links. | Done (local) |
| WEB-04 | Quality checks | Remove duplicate route/config files, repair all source type and lint errors, restore mandatory gates and CI tests. | Done |
| WEB-05 | Maintenance | Patch vulnerable dependencies; use supported build and API runtimes compatible with Azure. | Done except two advisories that only Next 16 closes |
| WEB-06 | Privacy | Constrain final analytics payloads, disable replay/autocapture of population selections, publish accurate website/account privacy explanation. | Done |
| WEB-07 | Homepage | Clear whole-platform purpose, coherent product hierarchy, dated numbers, useful editorial entry points, complete footer. | Done (local) |
| WEB-08 | Accessibility/performance | Verify mobile, zoom, keyboard, chart alternatives, loading/failure states and transfer sizes across all templates. | Open |
| EDIT-01 | Articles | Replace placeholder index, publish four bilingual articles, correct substantive historical/mathematical errors, preserve dates and sources. | Build break fixed; four PT articles publish, two in EN |
| EDIT-02 | About/methodology | Explain every product, distinguish archived forecasts from results and official facts from models, qualify population status. | Done (local) |
| ECON-01 | Freshness | Resolve stalled data publishing; show dated snapshots and correct quarter status even when the static build ages. | In progress; update pipeline unverified |
| ECON-02 | Explanations | Translate producer caveats, remove internal implementation prose, put limitations next to claims. | In progress |
| ECON-03 | Complete product | Recover and verify economics methodology, inflation tracker and seven household/economy stories, including calculator interactions. | In progress |
| ELECT-01 | Archives | Remove negative countdowns and current-election flags; use proper language, dates, poll counts and archive framing. | In progress |
| ELECT-02 | Maps/charts | Repair invalid geography types, undefined error handler, invalid chart options, hidden failures and localisation. | In progress |
| ELECT-03 | Archive durability | Anchor chart history to the dataset date, reduce very large page payloads without changing statistical conclusions, validate both election rounds. | Open |
| BALL-01 | Model provenance | Current forecasts say bivcross but evaluated scorecard says joint_sot; stop claiming they are the same model and supply an appropriate evaluation. | Open |
| BALL-02 | Feed consistency | Audit old injuries/narratives versus current matchday; display age/availability and keep sources consistent. | Open |
| BALL-03 | Whole sports product | Check Liga, Liga2, teams, matches, players, model, methodology, data, season archive, simulator and prediction game, including auth/leaderboard failure states. | Audit in progress |
| BALL-04 | Durable match pages | Keep previously shared match URLs available when upcoming fixtures change. | Open |
| POP-01 | Integration | Recover every planned population surface onto current main without replacing current sports/economics features. | Deferred — see the 8 September sequencing decision |
| POP-02 | Publication contract | Wire all population surfaces to approved producer catalogue, quality decisions and release identity; final release remains externally gated. | Deferred — see the 8 September sequencing decision |
| POP-03 | Suppression | Prevent totals/percentages/CSV/overlapping released queries from disclosing values promised suppressed. Align raw download access policy. | Deferred — see the 8 September sequencing decision |
| POP-04 | Reproducibility | Preserve dimension order, denominator, geography and release in saved URLs; build durable query/portrait pages and previews. | Deferred — see the 8 September sequencing decision |
| POP-05 | Failure handling | Clear stale answers; exact-match fallback, bounded loading, retry/refusal and disabled export when answer unavailable. | Deferred — see the 8 September sequencing decision |
| POP-06 | Claims/methodology | Replace July prototype claims with verified release facts, Censos 2021, single-run limitations, resident/institution scope and qualified privacy language. | Deferred — see the 8 September sequencing decision |
| POP-07 | Research access | Release files, checksums, dictionary, citation, licence, provenance and prior releases available and consistent. | Deferred — see the 8 September sequencing decision |
| POP-08 | Scale/usability | Compact first answer; bounded browser memory and download cost; final national artifacts tested on constrained mobile; human usability rehearsal. | Deferred — see the 8 September sequencing decision |
| LAUNCH-01 | Release rehearsal | Full route census, direct links, language switching, metadata, game/query failures and outgoing analytics checked in preview and deployed host. | Open |

## Sequencing decision — 8 September

**The population integration waits for the release.** Findings 1–7 of the launch review are one
project, and three of them (release claims, research access, national-scale performance) cannot be
satisfied by any amount of website work: they need the release that
`estimador-microsynthesis/docs/STATE.md` still has running its gates, with publication deferred to
Bernardo. Rather than land eight routes that render a waiting state and a rework of the explorers
against a fixture bundle, the order is:

1. Deploy the website repairs and verify finding 8 on the real host (`npm run smoke`). The catch-all
   404 rule is fixed in this branch but has never been exercised on Azure.
2. Integrate the population surfaces once the C1u national clears its gates and the publication
   decision is made — bundle-driven and fail-closed, per POP-01…POP-05.

Nothing about the population branch has been merged, cherry-picked or modified. `feature/populacao-launch`
is untouched at `3fd675d`.

## Verification record — 8 September

Recorded from command output and the export on `codex/september-relaunch`, not from intended edits.
Everything below is **local** verification. Nothing has been deployed, so no live-host claim is made.

| Check | Result |
|---|---|
| `npm run build` (production export) | Passes. Was **failing** at the start of this turn: `generateStaticParams` for `/[locale]/artigos/[slug]` threw on two articles whose metadata was still a JavaScript object literal while the loader requires strict JSON |
| Type check (`tsc --noEmit`) | Passes, 0 errors (was 4 parse errors) |
| Lint (`eslint .`) | 0 errors, 80 warnings (was 41 errors / 89 warnings on source, plus 4 067 problems from vendored `public/duckdb`, now excluded) |
| Unit tests | 167 passed across 7 files (was 156 / 5) |
| Type + lint during the production build | Now **mandatory**; `ignoreBuildErrors` and `ignoreDuringBuilds` removed |
| Required-data gate | `npm run validate:data` passes; wired into `npm run check` and CI |
| Exported pages | 194 routes; 186 of 188 localized pages carry canonical, `og:image` and both `hreflang` alternates. The two exceptions are `/404` and the `/` redirect stub, correctly |
| Sitemap | 187 URLs, built from the app directory plus published articles, teams, fixtures and players. Previously a hand-written list missing economics, article detail, team and simulator pages |
| Live host, before the fix | `/logo.svg`, `/logo-light.svg`, `/favicon.svg`, `/favicon-32x32.png`, `/robots.txt`, `/sitemap.xml` and `/pt/artigos/como-ler-sondagens/` all returned 404 on estimador.pt — finding 8 reproduced. Cause: the last route in the deployed `staticwebapp.config.json` is `/*` → 404, which shadows every path not explicitly listed. That catch-all is gone from the config in this branch; confirming it needs a deployment |
| Production dependency audit | 9 → 2. The two left (`next`/`postcss`, `next-mdx-remote`) are only fixed by Next 16, a major upgrade; both are build-time paths over repository-controlled input on a static export |

## Integration notes — 7 September

The audit work before this goal turn made progress: it produced reproducible evidence and a launch review. This turn creates the repair branch and begins implementation. The objective remains active.

Economics work from the two unpublished commits on `economia-unpushed-jul3` has been recovered selectively (economics components, routes, content, feed and translations). It has not yet passed integration review or browser checks. This is not proof the data are current. Other branch changes and current football/game work are preserved.

Removing `src/i18n/routing.ts` exposed previously skipped errors throughout the site. These are being repaired rather than hidden by the production build. The unused `ChartEmbed` component had no callers and attempted to load nonexistent default exports without data; it was removed rather than leave a broken public abstraction available for future use.


## State on 11 September 2026 — after the merge to main

**Deployed.** `codex/september-relaunch` was merged into `main` through [PR #26](https://github.com/estimadorpt/estimador-web/pull/26) at 20:01 UTC (three area commits: design language, visualisation system, relaunch readiness). The first deploy failed at `npm ci` (a lock file written by npm 11, read by Node 22's npm 10) and the second at the test step (the empty `src/content/articles/pt` directory was not in the checkout). Both are fixed on `main`; the third run built, deployed and only failed its post-deploy smoke check on two host behaviours (`/` is a 301 to `/pt/` on Azure; `/404.html` is the not-found override, not a public URL). The smoke script now follows one redirect and skips the override page.

**Verified live** (11 September, 20:15 UTC): `/pt/`, `/en/`, `/pt/marca/`, `/pt/populacao/`, `/pt/economia/`, `/pt/economia/metodologia/`, `/pt/artigos/`, `/pt/privacidade/`, `/pt/feed.xml`, `/pt/desporto/liga/`, a match page and `/api/health` all answer 200 with the new title "estimador.pt — Dados para compreender Portugal".

**Hidden as stale.** The economy dashboard's last run is from 3 July 2026 (`as_of`; the producer expected the next on 6 July). A new rule in `src/lib/utils/economy-time.ts` pauses the dashboard after 20 business days without a run: `/economia` keeps its hero and shows a "paused" card with the last date and the methodology link instead of the tiles; the home card shows "Em pausa desde …" instead of numbers. The staleness banner still covers the days before that. Nothing has to be flipped back: the next `./scripts/sync-data.sh economics` with a fresh `as_of` lifts the pause at the next build.

**Labelled, not hidden.** `/populacao` is a preview on a fictional population and says so in its kicker; the real population waits for the microsynthesis release. `/eleicoes/presidenciais` and `/eleicoes/legislativas` are archives and carry the archive label. `/artigos` starts empty; the feeds and the subscribe card work.

**Fresh.** Liga Portugal 2026-27 predictions run to matchday 5 (6 September); the match pages, simulator, players and team pages are current.

**Open follow-ups.**
- Producer side: bilingual `framing_i18n`, `first_release_note_i18n`, `anchor_claim_i18n`, `tilt_claim_i18n`, `consensus.note_i18n` and era `label_i18n` in the economy feed; Portuguese display names for model variables (`top_drivers[].variable`, `official_quarterly.model`, `nowcast_seed.source`).
- Repository: `public/duckdb/` (75 MB) is ignored and unreferenced by the app; the local smoke sample lists it, production never had it. Older PRs #25 (populacao launch surfaces) and #23 (Playwright e2e) are still open and will conflict with `main`.
- Hosting: `/api/health` answers only on Azure, so any static preview logs a 404 for the season game's probe (it stays in local mode by design).
- Design: the review document `design/brand-implementation-audit-2026-09-11.md` records what was fixed after the external review.

**How to re-verify.** `npm run check`, `npm run build`, `node scripts/smoke-check.mjs --base https://estimador.pt --sample 10`; the full-route crawl and the 390px browser pass live in the session scratchpad and are described in the review document.

**Post-launch fix, atlas journey control.** The "+" control steps one level per press (country → district → municipality → parish → home, then magnification to 4×), choosing the place nearest the current view centre. Three defects fixed on 11 September: on wide screens the profile drawer covered the controls once a home opened, so the last steps were unreachable; a press while a level's shapes were still loading was dropped (it now queues and fires when the level arrives), and a map click in that window could dispatch to the wrong level (shapes are now dispatched by the collection they belong to); the "nearest place" is now measured from where the camera actually is, even mid-flight. On phones the drawer stops above the controls.

**Post-launch fix, atlas prompt.** "Quem envelhece sozinho?" set a cohort but kept the territory view, where no people are drawn at country level, so nothing visibly happened. It now opens the people view grouped by age with only the over-65s living alone lit, and on wide screens opens the drawer with the count and the "meet a household" step.
