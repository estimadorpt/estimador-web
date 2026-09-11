# Product audit for the 26 September 2026 relaunch

Reviewed 7 September 2026 against main at `d009734`, the local exported pages, selected live browser journeys, and the unpublished economics/population branches. This extends [the launch readiness review](launch-readiness-review-2026-09-07.md). The relaunch scope is **every intended product and page live**, with complete content, correct data framing and working journeys. A page returning HTML is only the first check: its numbers, date, explanation, controls and next step also have to agree.

The findings below describe the baseline before the repair work now taking place. Status must be updated from verification evidence, not from intended edits. Source locations are repository relative so they survive moving this checkout.

## Route inventory and acceptance matrix

Both Portuguese and English counterparts belong in scope for every row. Dynamic routes require all currently published records to resolve, plus preservation of already published links.

| Route template | Baseline | Required finished behavior |
|---|---|---|
| `/economia` | Live nine-tile dashboard; feed vintage 11 June 2026. Stale present-tense claims and untranslated producer notes. | Current feed or clearly dated archived reading; each tile identifies actual/model, reference period, publication date and limitation; stale or missing data cannot look current. |
| `/economia/metodologia` | Missing on main; implemented on two unpublished branches. | Full bilingual explanation linked from the dashboard and general methodology; explanations match deployed model and metric definitions. |
| `/desporto/liga` | Live current-season hub, matchday 5, updated 6 September. | Fresh core and auxiliary data agree; readable mobile table; probabilities, deltas and intervals have clear meanings; every linked team/match/tool works. |
| `/desporto/liga/[team]` | Eighteen current teams generated. Porto live journey shows current statistics and interactive scenarios. | Team-specific decisive matches contain only relevant outcome groups; scenario requirements distinguish illustrative combinations from necessities; selecting and clearing outcomes changes the intended probability. |
| `/desporto/liga/jogo/[slug]` | Built only for remaining current/next fixtures. Ac. Viseu–Vitória live page works but injuries are 10 August and kickoff missing. | Every published match has a durable season/match identity, date and status; completed matches remain reachable; injury snapshot freshness is clear before “no absences” claims. |
| `/desporto/liga/jogadores` | Current route and multiple player measurements exist. | Search/filter/sort usable on mobile/keyboard; modelled skill, observed performance and non-identifiable measurements clearly distinguished; update time and coverage visible. |
| `/desporto/liga/jogador/[slug]` | Forty detail records in `players_detail.json`; model `soccer_factor_model`, ratings source `joint_sot`. | All ranking links resolve; unavailable details are unlinked or explained; per-season changes remain descriptive where uncertainty does not distinguish them; identity survives transfer and season rollover. |
| `/desporto/liga/simulador` | Existing simulator consumes current `ask.json` (matchday 5, 6 September). | Controls, clear/reset, tiny conditional sample cases and loading/error states verified; conditional forecasts are never described as causal effects. |
| `/desporto/liga/jogo-previsoes` | Public game route and health endpoint exist; prior review confirmed 34 matchdays and matchday 6 open. | Signed-out explanation, sign-in, save, edit-before-lock, post-lock refusal, scoring and private-league flows pass in a test environment; no real player records polluted by QA. |
| `/desporto/liga/modelo` | Live scorecard evaluates `joint_sot` but prose says same model as current feed `bivcross`. | Identify evaluated and currently deployed model accurately; every headline derives from matching evidence; evaluation cannot silently substitute for another model. |
| `/desporto/liga/metodologia` | Bilingual methodology exists. | Current model, use of data and operational refresh procedure agree with feed and scorecard; link separate player measurement methods. |
| `/desporto/liga/dados` | File list is generated from disk; versionless season JSON links. | Working links with file type/size, documented fields and clear attribution/source restrictions; machine-readable index; publish time/model identity included; anonymous download works on host. |
| `/desporto/liga/2025-26` | Complete season review with final results, xPts and forecast report card. | Explicit closed-season context, correct historical snapshots, stable link to current season; historical model identity does not imply current-model validation. |
| `/desporto/liga2` | `status=review`, `live=null`, generated 10 August; honestly displays 2025–26 retrospective instead of 2026–27 live table. | Refresh current-season coverage or explicitly retain retrospective purpose; do not call it live. Promotion/playoff rules and reserve-team eligibility correctly represented. |
| `/eleicoes/presidenciais` | Live default second-round view has `-231 days`, English January date and no archival framing. | Closed election archive; correct dates for each round, forecast cutoff visible, no negative/future countdown, translated chart/summary text; saved round links and language switch preserve selected round. |
| `/eleicoes/legislativas` | 2025 forecast archive presented largely as a current forecast; date uses `en-US` even in PT. | Election and forecast date prominent, archive status explicit, no current-election implication; district summaries, seat charts and coalition probabilities remain accurate and accessible. |
| `/eleicoes/mapa` | Working mouse map; no election year/date or accessible district selector in live accessibility tree. | Clearly 2025 forecast archive; keyboard/touch district selection independent of tiny map paths; island/continent selections agree with district table; missing map file yields readable error and other content remains usable. |

Editorial routes (`/`, `/sobre`, `/metodologia`, `/artigos`, `/artigos/[slug]`), shared navigation, hosting and metadata have separate repair owners. Their existing defects remain part of the overall launch review rather than being omitted from relaunch scope.

## Additional confirmed defects, ordered by impact

### P1 — election archive presents expired forecasts as future events

The live Portuguese presidential page's accessibility tree showed **“-231 days”**, **“January 18, 2026”**, a default **second-round** headline, and “based on the latest polls”. `presidenciais/page.tsx:98–100` subtracts the current build date from the first-round date; line 145 renders the raw number plus literal English `days`. The same first-round date appears regardless of selected round. The underlying datasets correctly identify 18 January (first round) and 8 February (second), with forecast updates on 16 January and 6 February. Display should use those recorded dates, not a countdown.

`src/lib/config/elections.ts:12` still marks presidential 2026 active, while `src/lib/config/sections.ts` correctly marks both elections archived. `getNextElection` returns the past presidential election when no next election is configured. This inconsistency is an implementation risk even where current components ignore the context.

Acceptance: in both languages and both round URLs, visitors see the election date, forecast cutoff and archive status; no negative days or claim of current/upcoming election. Do not overwrite original forecasts with actual outcomes. A separate outcome comparison can be added using sourced results.

### P1 — football model validation claims the wrong deployed model

`public/data/football/liga-2026-27/md05.json` says `model: "bivcross"`; `market_scorecard.json` says `model: "joint_sot"`, generated 10 August. `/liga/modelo`'s PT/EN footnote explicitly says the evaluated model is the same one producing current forecasts. That equality is contradicted by the published identifiers. The scorecard's hardcoded 504-game narrative also will not update automatically with a replacement file.

Acceptance: state the evaluated model and dates, derive headline quantities from the scorecard, and either supply current-model validation or clearly distinguish the older benchmark. An inability to distinguish a small difference from zero is not proof of equivalence; the prose should preserve that statistical limitation.

### P1 — published match links disappear as the feed advances

`loadUpcomingFixtures` (`src/lib/utils/football-data-loader.ts:361–440`) reads only current outstanding fixtures plus the next matchday, with a final-matchday fallback. `generateStaticParams` and `loadFixtureBySlug` rely on it. Therefore a match shared today is removed from the next export once it ceases to be upcoming. Slugs also omit season and matchday except duplicate handling, so the same pairing risks changing meaning in later seasons.

Acceptance: store a season-specific match catalogue with frozen forecast provenance and final status; regenerate every published detail route; old share URLs retain their original fixture identity after a matchday and season rollover.

### P1 — auxiliary football feeds are stale relative to current predictions

Main is matchday 5 (6 September), but `injuries.json` is a 10 August snapshot, `narratives.json` is matchday 1, and player detail provenance refers to the earlier `joint_sot` ratings source. The live Ac. Viseu–Vitória page shows “Baixas a 2026-08-10” beside “Sem baixas registadas.” The date is a useful existing safeguard, but the absence claim is easy to read as current team news nearly a month later.

Acceptance: refresh producer exports together, check cross-file season/matchday/model where relevant, and explicitly say “no absences in this dated snapshot” when freshness is unknown. Do not replace missing data with “no injuries”. Unused stale narratives should not be reintroduced without matching the current feed.

### P2 — the Porto page's “decisive matches for Porto” includes Casa Pia's relegation race

The live Porto page contains one Porto title group followed by Casa Pia relegation scenarios for Nacional, Braga, Estrela, Moreirense and Arouca. `[team]/page.tsx:217–220` filters matches by the selected team's title impact, but `DecisiveMatches` subsequently renders both title and relegation perspectives for that subset. This makes the section heading and description inaccurate and buries the chosen team's information.

Acceptance: add an explicit perspective/team filter to the component so the team page shows only the selected team's relevant race. Keep multi-team perspectives on league/match pages where the surrounding explanation supports them. Verify Porto and a relegation candidate.

### P2 — Portuguese election pages retain English interface and numbers

Confirmed on the live default presidential view: `Vote share (%)`, `LEADER`, `95% CI`, `MORE FROM ESTIMADOR.PT`, January date, and English `days`. Parliamentary `page.tsx:71` also hardcodes `en-US` formatting. The second-round winner cards use decimal dots in Portuguese, and the valid-vote distribution and all-vote forecast need more explicit denominator labels before a reader sees 67.5% versus 64.3% for the same candidate.

Acceptance: every visible label/date/number is localised; accessible chart labels match display; valid-vote and total-vote quantities carry the denominator at the point of reading.

### P2 — map interactions exclude keyboard-only visitors

The live map is visually functional but its accessibility tree exposes an unnamed image/geo container and no district controls. Instructions offer only hover/click. The page contains no election year, forecast cutoff or archive label. Type checking also identifies an undefined error setter and inaccurate geographic types in map code, making missing-file handling an unverified failure path.

Acceptance: a labelled district selector/list works with keyboard and touch and selects the same result as the map; map paths receive useful names/keyboard behavior where feasible; unavailable geography file gives a localised error with retry; tests cover Azores/Madeira aggregation and unmatched district names.

### P2 — Liga 2 has no current-season coverage and simplifies promotion

The file explicitly declares a retrospective review, with `live: null`; this is truthful but not a live 2026–27 product. Its rules define promotion as top two and disclose that reserve-team slot reallocation is not simulated. The page also infers “decided on goal difference” merely from tied final points (`missedOnGd`), which does not prove the competition's actual tiebreak procedure. A table's displayed goal difference does not establish why a tie was resolved.

Acceptance: remove unsupported tiebreak-causation claims; compare encoded competition rules with the producer's intended competition definition before calling outputs promotion/relegation probabilities; retain clear limitations while implementing the proper rules upstream. Current matches and next update time must be available for a live label.

## Recoverable unpublished economics work

`economia-unpushed-jul3` has exactly two commits not on main: `4f50131` (truthful live economics/staleness/methodology) and `4ed4753` (inflation and data stories). The older `economics-section` branch is already represented in main. The two recoverable commits touch 43 files and should be integrated deliberately into current main, not by switching the deployment branch.

Useful implementation already exists:

- `/economia/metodologia` with PT/EN MDX method content.
- `StalenessBanner`, quarter-position checks and past-date framing for stale narratives.
- Portuguese honesty notes, source/status badges and better labour/track-record explanations.
- Inflation tile and stories about food basket prices, housing, mortgage resets, real wages, savings, public accounts and tourism; release calendar.
- `HomeStoryHeadline`, `economy-time.ts`, typed stories data and loader.

Recovery is not enough for launch: those payloads are also historical, and the branch's client-only stale check initially emits no warning in static HTML. The full experience should communicate its vintage before hydration and recompute when the client clock advances. The branch loader uses a TypeScript assertion without runtime schema validation and silently omits the stories section on failure; add explicit required-data checks if these stories are part of the relaunch promise. Check sources, dates and units in each story rather than treating all seven as independently verified merely because they render.

## Population page inventory to integrate

`feature/populacao-launch` contains `/populacao`, `/populacao/casas`, `/populacao/explorar`, `/populacao/incerteza`, `/populacao/metodologia`, `/populacao/misteriosa`, `/populacao/retrato`, and `/populacao/retrato/[code]`, plus the unpublished economics methodology route. It does **not** contain the producer-contract path `/populacao/v/<release>/q/<query_id>`.

All eight existing population templates plus durable approved-query destinations belong in the launch work. Their acceptance checks are the prior review's publication contract, suppression, fail-closed missing data, pinned release identity, privacy, truthful model/year/universe description and national mobile performance checks. A national dataset is not yet sufficient evidence that the pages meet them. Review/game/portrait waiting states can support development but are not completed “all pages live” deliverables.

## Verification performed and work still required

Reviewed route source and published data for every football/election/economics template; inspected local branch differences without checkout or merge; inspected live presidential archive, Porto team page, Ac. Viseu–Vitória match preview and district map in the browser. The earlier review supplies live economics, football hub, mobile and host tests. The attempted additional command-line HTTP sweep could not resolve DNS inside the restricted environment, so it supplies no HTTP-status evidence; browser inspections did work.

This document does not claim that every dynamic record or authenticated game write was browser-tested, that current football competition rules were independently sourced, or that every unpublished economics story's source was verified. Those are named acceptance tasks before the final all-pages completion audit. No app code was changed while preparing this audit. Election/archive and map repairs are being taken up next as an explicitly assigned implementation task.
