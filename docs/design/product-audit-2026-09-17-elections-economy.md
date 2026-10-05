# Product audit: elections and economy — 17 September 2026

## Scope and evidence

This is a diagnosis of the current local product, not a proposal that assumes new results, polling, models or official economic releases exist. I inspected the homepage entrances, archive, presidential first and second round, parliamentary forecast and district map, plus the economy dashboard, stories, explainer and methodology source. Route and component evidence is stated below.

I attempted the requested fresh desktop and phone pass in the isolated `audit-elections-economy` Playwright session. The browser daemon failed before it could open a page: its Unix socket could not bind (`EINVAL` in the macOS temporary directory), including a retry with an alternate temporary directory. Therefore `output/playwright/product-audit-2026-09-17/elections-economy/` has no screenshots and no visual claims in this document. The findings about responsive behaviour and visual density below are source-based, to be checked in a working browser session.

Likely visitor jobs are hypotheses, not analytics findings.

## What the homepage currently promises

| Entrance | Likely visitor/job hypothesis | Current destination and answer | Assessment |
| --- | --- | --- | --- |
| Elections | A voter or journalist asks “what did the forecast say before this vote?”; during a campaign, “what is the current uncertainty?” | The support card identifies the pages as archives and lists the presidential 2026 and parliamentary 2025 routes. Its archive-guide link is secondary. | This is materially better than a generic “elections” entrance: it sends a visitor to a dated object rather than a feature menu. It still makes the visitor choose an election before knowing what each route can answer. A short one-line distinction (presidential winner/runoff versus parliamentary seats/districts) would reduce a wrong-route visit. |
| Economy, paused | A reader arrives from an inflation, wages or GDP headline and asks what the number means. | The homepage asks the concrete inflation question and opens `/economia#compreender`; the paused page puts the explanation before the unavailability reason. | This is the strongest current economy journey. It provides a truthful, shareable answer without pretending the July dashboard is current. It is useful once, but has no dated release-based reason to return while the feed remains paused. |
| Economy, live | A reader asks “what changed in Portugal since the last release, and should I revise my view?” | The live page opens an indicative dashboard summary, disclaimer and ten tiles. Stories, the explainer and methodology follow later. | The page has unusually careful caveats, but it is organized as a dashboard inventory. A visitor must infer which tile answers their question and cannot quickly compare this reading with the prior one. |

## Elections

### Archive and off-season value

`/eleicoes/arquivo` now begins with an explicit choice of the two forecasts and says that it is not an official-results page. Its guide correctly separates forecast date, question type and careful assessment. This makes the archive a sensible orientation point, and avoids a false performance claim.

It does not yet supply the principal off-season reason to return: “How did the prediction perform?” The archive can only tell a reader what was published, not whether the forecast’s intervals covered the verified outcome, what its error was, or whether a probability was well calibrated. That is a substantive data/evaluation gap, not a wording gap. It requires verified official results, a declared forecast cutoff, matched vote denominators and rounds, plus a reproducible evaluation process. One election cannot establish calibration even if the named winner was correct.

The homepage and archive should therefore retain the word **archive** and avoid outcome-like or score-like language until that evidence exists. A share of an archive route currently communicates a frozen forecast; it should not be read as a current forecast or official result.

### Presidential: first round

The first-round route makes its archival status, last update and election round visible. Its local navigation has three useful questions: what the forecast said, where uncertainty was, and data/method. The trajectory is now the clearest election visualization in the product:

* it begins with one selected candidate, while retaining faint mean lines for other leading candidates;
* it exposes a mean, a 50% P25–P75 interval and a 90% P5–P95 interval using those actual quantiles;
* individual polls are dots and the table is dated and latest-first; and
* locale-aware dates and percentages reduce an avoidable reading error for English visitors.

This is a good default because it answers “how has this candidate’s estimated support moved, and how uncertain is it?” rather than asking a reader to disentangle several opaque bands at once. It is also shareable as an archival reading, though it does not currently encode the selected candidate or a specific chart state in the URL. A shared link returns a reader to the page rather than to the specific inspection they meant to discuss.

Remaining first-round risks are limited but important:

1. The table is a useful retrieval alternative, but it is the selected candidate’s estimate series, not a full audit trail of all polls, candidates and source details. Do not describe it as a complete data export.
2. The forecast bars name a “95% credibility interval,” while the trend chart is explicit about 50% and 90% ranges. Their payload contract must be checked and labelled from its documented quantiles before readers can safely compare the two visualizations. This is a data-definition check, not a request to change an interval to fit the label.
3. The focused control is likely workable at phone width because buttons wrap and the SVG switches viewboxes, but this has not been visually verified in this audit session. Long candidate names and the density of five selectable candidates remain a phone test case.

### Presidential: second round

The second-round switch changes the page to winner cards, a valid-votes split, a beeswarm of simulations, scenarios and forecast bars. These pieces can answer “who was more likely to win?” and “how dispersed were simulated outcomes?”

But it omits the most natural evidence chain for a reader who wants to understand a second-round forecast: **the trend over time, the underlying polls, and a date/candidate retrieval table**. The second-round data prop includes `trends`, and `SecondRoundTrendChart` exists, but `SecondRoundView` never renders it. The existing main-page navigation also remains first-round-oriented when the second-round content is active, so anchors such as the uncertainty/evidence path may lead to no corresponding section. This is a structural task failure, not merely a chart styling issue.

A second-round replacement should use the same focused-inspection pattern as the first round: one candidate or pairing by default, actual quantile labels, visible date/cutoff, polls where available, a latest-first table and a clear return to the overall winning-probability summary. It should not revive the older all-candidate/all-band chart simply because a component exists.

### Parliamentary forecast and district map

The parliamentary page has a good archival hero and says explicitly that it is not an election-result page. It begins with headline probability summaries, then offers polling, coalition outcomes, individual-party seats and a district entry point. The probable jobs are “who was most likely to have most seats?”, “could a bloc reach a majority?” and “where was the district contest uncertain?”

The task hierarchy blurs those questions in the polling chart. `PollingChart` plots every party’s mean line over a two-year window, fixes the vertical domain to 0–50%, and uses a hover tooltip for a single point. It deliberately omits uncertainty bands from the plot while the disclosed table includes low/high values. This produces a strong visual impression of precise movement, then places the uncertainty evidence in a separate retrieval mode. It is also hard to follow many parties on a phone, where the end labels are removed and the legend must carry identification. The display needs a question-first choice: one selected party with interval, a small selected comparison, or a clearly separated “all means” overview whose title says exactly what it omits. The same chart must not make a 50% ceiling look like a data limit if a future party estimate exceeds it.

The district map correctly sits under the parliamentary forecast and carries a back link. It is driven by `winning_party` plus per-party predicted vote shares and the sidebar explains colour, interaction and islands. Its apparent job is “which party was forecast to lead in this district?” A colour-by-leading-party map is a weak tool for the much more consequential question “where was the race close?” because it hides the estimated vote-share gap and makes all districts of the same leading colour look equally certain. It also risks being mistaken for official district results unless the archive/status statement is repeated at the map itself, close to the map title and tooltip.

The map should offer a deliberate answer mode: default **forecast leader** for orientation, then **closest forecast vote shares**, with the gap explicitly defined. Mean vote shares can support that descriptive gap; **chance of a different leader** requires appropriate event probabilities or simulation draws and cannot be inferred from those shares alone. It must not claim actual district outcomes without verified official results.

## Economy

### Paused experience

The pause branch is honest: it gives the last reading date, puts `EconomyReading` first, says why current figures are unavailable in a disclosure, and links to methodology. Its three questions—prices, work and activity—make defensible, plain-language distinctions. The URLs preserve a topic query and `#compreender`, so the inflation explanation can be shared directly.

The limitation is product value rather than honesty. The content is generic indicator literacy, mostly independent of a Portuguese release, timestamp or the last dashboard reading. It can help a reader interpret one news headline, but cannot answer “what changed this month?” or establish a repeat cadence. Do not manufacture a current answer from the stale July data. The correct next step is an update pipeline with dated readings and retained vintages.

The complete-data failure state is weaker: it displays only an unavailable sentence. If data loading fails, visitors lose the still-valid explanations and methodology route that the stale-data pause branch preserves. This is a presentation/resilience improvement possible without new data.

### Live dashboard, stories and method

The live payload is dated 3 July 2026 and expects an update on 6 July 2026, so the application correctly selects the pause branch on 17 September. Source inspection remains useful for the next live release.

The live page puts a staleness banner, a narrative summary and an unusually detailed caveat card ahead of ten tiles. Its ordered sequence is health score, pulse, annual outlook, contributions, labour, inflation, recession, growth-at-risk, official quarterly and track record; stories and the explainer come after them. This gives an engaged analyst a lot to inspect, but it is not organized around a visitor’s initial question. The method is reachable from the hero, but its long MDX explanation is not a concise source path from any particular claim or tile.

The detailed caveats are a strength: the payload itself distinguishes an official observation, a presentation composite, an indicative estimate, small samples and pseudo-real-time validation. Their density, however, makes it hard for a reader to identify the answer, the source, the publication date and the limitation in one place. “Dashboard” also gives a false expectation of a live, repeatable instrument when the feed can be paused and some stories have much older dates.

Stories have better question-shaped potential—e.g. wages versus inflation and mortgage payments—and their source declares official data plus explicit arithmetic. They are buried after the dashboard grid. Their per-story as-of dates are an essential integrity feature; the real-wages module, for example, is labelled 2025-09 in the current source while the stories envelope is dated 2026-07-03. That distinction must remain prominent rather than being visually swallowed by the dashboard’s overall date.

## Recommended information architecture and chart matrix

| Route/state | Lead question and one-sentence answer form | First view | Detail/retrieval | What it depends on |
| --- | --- | --- | --- | --- |
| Homepage elections | “Which archived forecast do I need?” | Two explicitly different election choices, each naming the question it covers | Archive guide, then date/round/method | Presentation only |
| Election archive | “What was knowable at that date?” | Choose forecast, then cutoff/date/round | Full forecast, methods; future report-card link only when evidence exists | Presentation only now; evaluation needs official outcomes and pipeline |
| Presidential first/second round | “How did candidate support and uncertainty change before this round?” | Candidate-focused trend with cutoff and latest estimate | Poll dots/sources, latest-first table, win probability and simulations | Existing trend/poll payload if documented; no outcome claim |
| Parliamentary | “Who was likeliest to lead or form a majority, and where was it close?” | Headline probabilities, then selected-party/pair uncertainty view | All-means overview, table, seats/coalition/district paths | Existing simulations/trends; uncertainty needs documented quantiles |
| District map | “Where did the forecast say the contest was close?” | Explicit leader or closeness mode, archive badge beside title | District vote-share table and method | Existing mean shares support descriptive gaps, while event uncertainty requires suitable draws; never official outcomes without verification |
| Economy paused | “What does this release term mean?” | Chosen explainer answer and date of last live reading | Comparison checks, source/method | Existing educational content |
| Economy live | “Did this release change the picture?” | Dated conclusion, what changed, evidence and next release | Underlying tile, source, vintage and prior reading | Reliable feeds, archived vintages, reviewed/fixed narrative rule |
| Economy stories | “How does this official measure affect this question?” | A current, clearly dated story relevant to a headline | Formula, sources and data date | Existing official modules; hide/retire stale modules rather than implying currentness |

## Prioritized findings and measurable acceptance

### P0 — restore a coherent presidential second-round evidence journey

**Why now:** a round switch removes the trend/poll/table path that a user needs to inspect the forecast, while the data prop and older chart component indicate the route was intended to support it.

**Acceptance:** in both Portuguese and English, each round has a visible date/cutoff, an uncertainty explanation tied to actual quantiles, a focused trajectory or an explicit statement that no trend exists, poll evidence where supplied, and a date/candidate table ordered newest first. Every local navigation target exists in the selected round. Test at 390px and desktop with long candidate names and after switching round.

### P0 — do not turn archives or maps into implied results/evaluations

**Why now:** archival routes are the likely off-season entry, and district colour is especially easy to read as an outcome.

**Acceptance:** archive status appears in the election route and map context; share metadata says forecast/archive rather than result; no accuracy score, official outcome or calibration statement appears without documented verified sources and calculations. A future report card lists its forecast cutoff, outcome source/date, denominator and evaluation method.

### P1 — give parliamentary uncertainty an intelligible default

**Why now:** the many-line mean chart makes precision visually salient and hides intervals in a table.

**Acceptance:** a first-time user can identify which party/pair is selected, the estimate date, the central estimate and stated interval coverage without hovering. The all-party overview identifies itself as means-only if retained. Axis limits derive from the data plus a legible buffer. The data table states whether it is a full plotted-data view or a summary.

### P1 — reorganize future live economy readings around change, not tiles

**Why now:** a data-rich, carefully caveated dashboard does not answer the highest-value repeat question quickly.

**Acceptance:** the first screen says what changed since the last dated reading, supporting source/date, whether it is official/estimate/presentation composite, and what will update next. A reader can open the earlier retained reading and distinguish revision from new observation. Each prominent tile has a short, nearby method/source route. This needs live data and archival-vintage work; it cannot be fulfilled by copy alone.

### P1 — preserve usefulness when the dashboard fails or is paused

**Why now:** the paused branch works; the null-data branch discards it.

**Acceptance:** an unavailable dashboard still offers the three explainers, methodology and the date/status of the latest known reading when safely available. It never shows stale figures as current.

### P2 — promote only current, question-shaped economy stories

**Why now:** official-data stories are likely more useful entry answers than an abstract health score, but their dates vary and they appear after the entire tile inventory.

**Acceptance:** each promoted story displays its own as-of date, badge and source link at the point of its claim; an older story is visibly archival or not promoted as a current answer. A direct URL can point to the question and retain its context.

## Presentation work versus prerequisites

Presentation can repair round-specific navigation, chart selection/defaults, labels, table scope, map uncertainty views, local archive status, failure-state routing, source placement and the ordering of existing economy stories. It cannot establish whether an archived forecast was accurate, produce official results, make a stale economy reading current, validate a forecast, create data vintages, or explain causal change between releases.

The correct product sequence is therefore: make existing archived evidence easier to inspect; build an outcome/evaluation pipeline for election retrospectives; restore a reliable economic release and vintage process; then lead those pages with genuinely dated changes. Avoid filling those gaps with generic explanation, more charts or confidence language that exceeds the payload’s documented meaning.


## Fresh browser follow-up — 17 September 2026

The root audit subsequently opened the local pages in a working Playwright session. The earlier socket failure was confined to this agent's initial session; it is not an unresolved website/browser availability finding. See the [combined product diagnosis](product-usability-diagnosis-2026-09-17.md) for priorities, task architecture and coverage.

- Presidential first and second rounds were inspected at phone width; the candidate selector and first-round date table worked. In the second round, `#trajectory` is absent while `#evidence` exists. Only the former broken target is directly confirmed; do not say that every local evidence anchor fails.
- Second-round content retains the 18 January shared header date. It also shows 67.5% of valid votes for Seguro and 64.4% in a later forecast with a blank/null category. Round-specific dates and denominator labels need to accompany these different quantities.
- The parliamentary page's 8 AD / 4 PS / 1 CH district totals count stable districts only; the map's 14 / 5 / 1 totals count all 20. The source distinction is real but not expressed in the first heading. This is a subset-label problem, not evidence that one calculation is necessarily wrong.
- The map's district selector worked on a phone, and the selected Lisboa panel displayed predicted vote shares. **Those shares are not probabilities of leading.** References above have been corrected accordingly. A future uncertainty mode must use the right data.
- The actual economy page is paused and provides the inflation explanation. On the measured 375px page the question began around y=667, after header, illustration and status. About nevertheless described economy as continuously published.

Evidence: [presidential phone chart](../../output/playwright/product-audit-2026-09-17/home/mobile-presidential-trend.png), [selected district](../../output/playwright/product-audit-2026-09-17/home/mobile-district.png), [paused economy](../../output/playwright/product-audit-2026-09-17/home/mobile-economia-.png).
