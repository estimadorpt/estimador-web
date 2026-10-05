# Estimador: why someone would visit, what they should learn, and why they would return

17 September 2026 · product and usability diagnosis of the local website at `http://127.0.0.1:3044`

Reading guide: [decisions](#1-verdict-and-decisions) · [audiences and reasons to return](#3-who-comes-what-they-want-and-what-would-bring-them-back) · [homepage proposal](#4-homepage-a-useful-front-page-not-a-catalogue) · [football](#5-football-build-around-team-fixture-and-question) · [population](#6-population-make-the-human-scene-explain-the-analysis) · [elections](#7-elections-the-question-changes-with-the-calendar) · [economy](#8-economy-answer-a-question-then-show-the-instrument) · [implementation sequence](#12-implementation-sequence-and-acceptance-criteria) · [user testing](#13-how-to-test-interest-and-usability-honestly).

## 1. Verdict and decisions

**Estimador has several useful products inside it, but too much of the website still asks the visitor to discover the usefulness.** The homepage introduces sections; the deeper pages often introduce models and then display their outputs. The missing layer is a clear, immediate answer to a recognisable question, followed by a purposeful way to investigate it.

Yes: **what the next match means for a chosen club should be visible on the homepage.** A link saying “Ver o que está em jogo” withholds the very information that could make someone interested. Show a compact, dated answer, then use the match page for the explanation and the simulator for further questions. This does not mean putting the entire simulator on the homepage.

The earlier changes improved individual components but did not complete the product redesign. Changing “Experimentar resultados” to a more relevant link did not establish the right default task. Adding a club selector did not make the surrounding card about that club. Aligning cards did not establish a hierarchy of useful answers. These are product problems before they are spacing problems.

My recommendations are:

1. **Make the homepage useful without requiring a click.** Retain population as a strategic lead, as previously requested, but make the football module a working answer about a club. Give economy an actual explanation and elections a clearly dated archival purpose.
2. **Make club and match pages the main football journeys.** Simulation is a follow-up activity. The homepage, league, club, match and simulator must retain the same club, objective, fixture and forecast version where relevant.
3. **Separate the population question from the camera.** Inspecting one household must not silently replace a national cohort with a local cohort. Keep the immersive scene, but give the analysis its own stable context.
4. **Treat research readiness as a product.** Availability, variables, geography, validation, limitations and reproducibility matter more to a researcher than another map animation. A national synthetic release and a policy microsimulation are distinct deliverables.
5. **Give each chart a job.** Reduce redundant summaries, tautological filtered charts and many-line displays. Put comparisons, denominators and uncertainty beside the answer they qualify.
6. **Make current, archived, illustrative and paused states consistent everywhere.** The homepage cannot be honest while About, a match panel or an election header implies a different status.
7. **Earn return visits through new information.** Football updates, research releases, election evaluations and economic readings can create reasons to return. More controls, accounts or illustrations cannot substitute for those events.

These are judgments to test, not measured claims about the audience. There are no audience analytics, interviews or competitor-market findings behind a claim that one use is “most common.” Football has the clearest existing recurring consumer trigger; population research has substantial strategic value. Those are different prioritisation arguments.

## 2. Evidence and limits

The work combines fresh browser inspection, actual interaction, current data checks and source review. No application code was changed for this diagnosis. Nothing was deployed.

The completion criteria were: inspect the main arrival routes; follow representative tasks into deeper pages; check phone, intermediate and desktop layouts; examine the meaning of charts and defaults; distinguish observed failures from hypotheses; specify what belongs on home versus deeper pages; and write an actionable sequence that separates presentation work from missing data or modelling.

### Coverage

| Surface | What was checked |
| --- | --- |
| Homepage | Screenshots at 320, 375, 768, 900, 1280 and 1440 CSS pixels; club selection; next-match destination; ordering and distance to useful content. |
| Football league | Desktop and 375px render; forecast table, title and relegation histories, fixtures, strengths, discovery of deeper routes. |
| Club | Arouca at desktop and phone; displayed objectives, position distribution, history and decisive-match panel. This is a deliberate test beyond the three largest clubs. |
| Match | Porto–Benfica at 375px; all three conditional outcomes, team context, players, absences, other fixtures and dates. |
| Simulator | Homepage arrival; default team; conditional fixture ranking; objective controls and mobile layout. Existing source and earlier journey checks also inform state recommendations. |
| Football supporting pages | Players, prediction game, evaluation and Liga 2 rendered/read on desktop. These received a lighter pass than the main club/match journey. Individual player pages and every club were not exhaustively tested. |
| Population | Desktop and phone atlas; older/alone question; opening its household; URL and answer changes; research page at both sizes. Miniature reviewed through the domain source audit, not a fresh complete interaction pass here. |
| Elections | Presidential second round and first-round switch; phone candidate selection and data-table opening; parliamentary desktop/phone; district selection on phone. |
| Economy | Actual paused page at desktop/phone; explanation and hierarchy. The hidden live dashboard was reviewed in source, not presented as a live browser observation. |
| Supporting site | Articles, About and methodology rendered/read on desktop. |

The phone checks found no document-wide horizontal overflow on the eight primary deep routes measured at 375px. That is a useful basic check, **not evidence that their layouts or charts are good**. Long vertical detours and poorly chosen defaults remain.

This is principally a Portuguese, Chromium-based assessment of the local checkout. It is not a fresh production audit, a full English-language audit, a screen-reader certification, or a cross-browser performance benchmark. Local development overlays are excluded from the visual criticism. Timing in development is not presented as a production speed result.

Supporting source audits: [population](product-audit-2026-09-17-population.md) and [elections/economy](product-audit-2026-09-17-elections-economy.md). Their initial browser sessions failed; the successful root browser pass is recorded here and in the follow-up sections of those files. This synthesis takes precedence where fresh evidence clarifies an earlier inference. Screenshots are in [the audit evidence directory](../../output/playwright/product-audit-2026-09-17/home/).

Selected visual evidence: [desktop home](../../output/playwright/product-audit-2026-09-17/home/home-1440.png), [intermediate-width home](../../output/playwright/product-audit-2026-09-17/home/home-768.png), [Arouca on phone](../../output/playwright/product-audit-2026-09-17/home/mobile-desporto-liga-arouca-.png), [match answer](../../output/playwright/product-audit-2026-09-17/home/mobile-match.png), [population question](../../output/playwright/product-audit-2026-09-17/home/population-question.png), [focused election chart](../../output/playwright/product-audit-2026-09-17/home/mobile-presidential-trend.png).

### Findings that materially change the diagnosis

| ID | Observed evidence | Product implication |
| --- | --- | --- |
| E1 | Select Arouca on home: the adjacent figures remain Sporting 44%, Benfica 30%, Porto 26%. The next-match link opens the simulator with Sporting selected. | Personalisation is currently a promise that the complete card/journey does not keep. |
| E2 | At 375px the homepage club selector begins around y=892; the next-match link around y=1072. On the league page, upcoming fixtures begin around y=3895. | Core recurring questions sit behind introductions, artwork and other analyses. |
| E3 | Arouca opens with title 0%, top-three 0%, relegation 2%. Its later “games with impact” panel highlights Casa Pia's relegation probability for a round-15 fixture. | The team page is populated from available outputs rather than consistently answering for its named team. |
| E4 | Porto–Benfica already shows all three match outcomes and resulting title chances. | A stronger answer format exists in the product and should be promoted/reused, not rebuilt as a new speculative feature. |
| E5 | The simulator says Jornada 7 but includes 13 conditional fixtures from matchdays 2, 6 and 7. The fixture loader's future matchday entries have no kickoff dates. | “Next game” needs an eligibility/freshness rule; a ranked sensitivity list is not a chronological schedule. |
| E6 | Older/alone atlas prompt produces 20 of 1,004 fictional people, then an age table showing 20 people, all 65+. | The chart largely confirms the condition already selected. It does not explain prevalence or a useful difference. |
| E7 | Open that household: the answer changes to 1 of 38 in Aveiro, while the camera enters Aguada de Cima and opens a 69-year-old fictional person. | Camera navigation, example selection and analytical geography are coupled. The original national answer disappears. |
| E8 | In presidential second round, the “Onde havia incerteza” link targets `#trajectory`, which is absent. It exists after switching to first round. | The evidence journey breaks in the default round. The common `#evidence` target does exist; not every anchor is broken. |
| E9 | Parliamentary summary counts 8 AD / 4 PS / 1 CH under likely district winners; map counts 14 / 5 / 1. Source shows the former counts only districts deemed stable. | Different subsets look like conflicting totals because their labels omit the scope. |
| E10 | Match page calls top-three probability “Europa”; calls goal-based SAR “Jogadores decisivos”; injuries are dated 10 August alongside a 13 September forecast. | Familiar labels overstate the meaning/currentness of the underlying information. |
| E11 | Economy is explicitly paused, while About says economy is in continuous publication. Articles is empty locally, and its email invitation exposes only RSS. | Trust and return promises are not consistent across the site. The newsletter observation is local configuration, not a claim about production setup. |

## 3. Who comes, what they want, and what would bring them back

Do not define the audience as “people who like data.” That says little about what they will do. Define the moment that creates a question.

| Visitor and trigger | Question they bring | Useful answer | Home's role | Deeper destination | Plausible return trigger |
| --- | --- | --- | --- | --- | --- |
| Club supporter after results | “Did our outlook improve? Where might we finish?” | Dated current outlook and movement since a named previous forecast. | Selected club summary or a clearly labelled title-race overview. | Club page; historical comparison. | Another completed model update. |
| Supporter before a match | “What do a win, draw or defeat change?” | Current season objective beside the three conditional outcomes. | One fixture and a compact three-outcome answer. | Match analysis; optional simulator for other fixtures. | Upcoming match, then published post-match outlook. |
| Supporter of a mid-table club | “What is a realistic finish? Are we safe?” | Position distribution/range and relevant risk; avoid opening with impossible objectives. | Club-aware summary after selection. | Club page with finish distribution and fixture context. | Material outlook change or a fixture relevant to that objective. |
| Reader following football debate | “Are points reflecting performances? What does the model miss?” | A specific discrepancy with limitations and a route to evidence. | Occasional dated editorial finding, not a permanent extra dashboard. | League comparison, player dimension, evaluation. | New analysis or accumulated evidence. |
| Researcher planning a study | “Can I use this population, and for what?” | Clear availability verdict, variables, units, coverage, validation and access terms. | Direct research entrance with status; never force an atlas tour. | Release/suitability page; eventually dictionary and validation. | Versioned release, field/validation change, reproducible study update. |
| Policy analyst with a concrete rule | “Who meets these criteria? Who would a change reach?” | Reproducible cohort now when data support it; policy effects only with a validated model. | An illustrative use case and explicit readiness. | Cohort workspace; later a narrowly scoped policy tool. | A policy question, updated baseline or model release. |
| Curious visitor, teacher or student | “What does a synthetic population let us see that a total hides?” | One linked household/distribution example they can understand and share. | Concrete invitation with one honest example. | Guided demo, then free exploration. | A new question or lesson; novelty alone is a weak return loop. |
| Voter during a campaign | “Who is likely to lead, reach the runoff or obtain a majority?” | Dated, event-specific probability; uncertainty; what changed. | Seasonal election lead when active. | Relevant election/round/district. | New polls and published forecast updates. |
| Journalist or interested reader after an election | “What did the forecast say, and how did it perform?” | Frozen forecast plus, when available, verified outcome and proper evaluation. | Honest archive or a substantive retrospective finding. | Archive/report card, not an apparently live campaign page. | A new evaluation or methodological lesson. |
| Reader of an economic headline | “Does lower inflation mean lower prices? Are wages keeping up?” | Direct explanation; when available, a dated Portugal-specific comparison. | Short answer now; current reading only when feeds are restored. | Selected economic question, evidence and method. | New official release or a meaningful revision. |
| Sceptical specialist | “Can I reproduce/check this?” | Exact version, scope, provenance, calculations and limitations. | Compact credibility cues, not a methodology wall. | Local evidence panel, downloadable artifact where available, technical method. | New evidence or a reusable release. |

### The prioritisation tradeoff

For near-term recurring consumer usefulness, I would prioritise football's club/match journey. It has familiar subjects, recurring events and usable existing conditional outputs. This does **not** establish that simulation is the main use. Reading a quick answer is the stronger default hypothesis; actively changing assumptions is a deeper behaviour to test.

For longer-term distinctiveness, the population/research product may be more consequential. Its value is linked microdata, suitability for actual studies and reproducibility. A visually rich atlas can introduce that potential, but cannot deliver it alone.

Keeping population as the largest desktop home feature is a strategic editorial choice, not a conclusion from demand evidence. It can coexist with a football answer, provided the population invitation is compact enough that it does not consume the entire phone arrival. During an election campaign, the lead can change because the useful, current question changes. Do not use equal-sized cards to avoid making this decision.

## 4. Homepage: a useful front page, not a catalogue

### What the next-match module should actually contain

Before club selection, show a labelled general outlook or featured fixture. Do not present an unexplained preselected club as the user's preference. After selection, all the module's quantities, labels and links must follow that choice.

An example using the **published 13 September model bundle**, not a newly calculated or real-time forecast:

> **Sporting: o que muda contra o Arouca?**  
> Probabilidade de ser campeão · previsão de 13 de setembro  
> Agora **44,3%** · Se ganhar **46,4%** · Se empatar **35,1%** · Se perder **31,2%**  
> Ver a análise do jogo →

Underlying probabilities are 0.4425, 0.4636, 0.3510 and 0.3119. Relative to baseline, those are +2.11, −9.15 and −13.06 percentage points before rounding. Derive changes from raw values, not rounded text. A compact home presentation could use whole percentages; do not imply that decimals are a guarantee of precision.

For Arouca in the same fixture, its relegation probability is 2.29% before the game; 0.89% if **Arouca wins**, 1.81% if it draws and 2.45% if it loses. The home/away orientation reverses. This is why “Casa / Empate / Fora” is inferior to a chosen-club perspective for this task.

Those figures concern the **end-of-season objective conditional on a match outcome**. They are not the chance of that match outcome, and not a forecast of the post-match rerun including every new input. Say this once in plain language beside the comparison. Do not mix the 83% chance of a Sporting match win with the 46% title chance conditional on that win.

Critical prerequisite: select the correct outstanding fixture from a current, identified bundle. The current conditional file includes 13 matches across several rounds, and the future fixture entries lack kickoff times. Until schedule/currentness is established, label this “cenário publicado” or “próximo jogo incluído nesta previsão,” not “hoje,” “esta noite,” or a manufactured countdown. If there is no supported fixture, show the dated baseline and say so. Do not silently substitute an unrelated rival's match.

### Recommended home composition

| Order/area | What is visible before a click | One principal next step | What stays deeper |
| --- | --- | --- | --- |
| Compact orientation | What Estimador helps with; short question shortcuts if they earn their space. | Go to the relevant answer area. | Full project history and method. |
| Population strategic feature | A concrete human-scale example; demonstration status; separate research availability sentence. Preserve the house, but make its presence explain linked people/households. | Try one guided question; independently, check research suitability. | Filters, full atlas, release metadata, policy prerequisites. |
| Football answer module | Team, dated outlook, relevant objective and supported next-match three-way comparison. | Open that match or that club, preserving context. | Other fixtures, full league, scenario controls and technical evidence. |
| Economy answer | “Não necessariamente: inflação mais baixa significa que os preços sobem mais devagar.” Paused/live state beside it. | Understand the comparison or open a fresh reading when available. | Other indicators, methodology, full dashboard. |
| Elections outside campaigns | Which forecast, round, cutoff and question is archived. One useful distinction: runoff/winner versus seats/majority. | Open the specific archive. | Technical charts; future verified report card. |
| Dated analysis, only when real | One actual finding and why it matters. | Read that analysis. | Article index. Omit an empty teaser. |
| Credibility/footer | Dated models, inspectable evidence, authorship and contact. | Relevant method/source route. | Brand documentation and detailed project pages. |

The football section should not need a stadium panorama, generic invitation, selector, big-three summary and then a link before providing the requested answer. Keep a narrow architectural accent if useful; give the result the space. Likewise, the economy home card should answer its own question in a sentence, rather than merely say “São coisas diferentes” and withhold the explanation.

### Mobile and intermediate widths

At 375px today, the club selector is below the first viewport. At 768–900px, the large population card stacks above the complete football card: the user pays the height of desktop-like presentation without getting two columns. This intermediate range needs its own composition.

For an unpersonalised phone home: compact identity and purpose → short population invitation with research access → visible football answer → supporting economy/election answers. Artwork sits beside or within the invitation, not in a separate tall block before the first task. Let a visitor jump directly to a question, but do not use shortcuts as an excuse for burying the answer.

For a returning visitor who explicitly selected a club, offer a compact “A tua equipa” answer early, with a clear way to change/reset it. A local preference can help without requiring an account. A shared URL should take priority over a stored preference so recipients see the intended scenario. This is a proposed behaviour, not an implemented or validated personalisation system.

Desktop cards need a common grid, but equal bottom edges are not the success criterion. Use unequal editorial weight, align related headings/actions, and allow content to determine height. Do not add empty space merely to make four modules look equivalent.

## 5. Football: build around team, fixture and question

### League page

**Job:** orient me in the current forecast, help me find my club, and show what could change next.

The current page has real substance: dated title chances, predicted finishing table, expected-points comparison, probability histories, fixtures, strengths and evaluation links. The issue is sequence. On the measured phone layout, the table starts around y=838 and upcoming fixtures around y=3895. “Experimentar cenários” is still a main hero action, although reading the outlook is the more plausible first task.

Recommended order:

1. Forecast date/status, a concise factual change, club chooser.
2. Title/permanence overview appropriate to the current season, with a selected club available without hunting through 18 rows.
3. Next relevant fixtures and their stakes, before specialist analyses.
4. Forecast table, clearly separating current position/points from predicted finish/points. Phone users should see a selected row plus useful neighbours, with full table access; don't hide necessary meaning behind club acronyms alone.
5. Selected-team probability history or a small relevant comparison; all teams on request.
6. xPts and team-strength analysis, then methodological evidence and specialist products.

Retain the title-history chart: three clearly identified competitors are a meaningful comparison. Rework the relegation chart: many low-probability lines and clustered end labels obscure the relevant clubs. Default to a chosen club plus a few relevant comparisons; make the complete view optional.

“Sorte ou mérito?” is an engaging question, but points minus xPts is not a clean decomposition into luck and talent. A safer lead is “Quem tem mais pontos do que o xG faria esperar?” Explain the difference and what it cannot establish. Keep interpretive interest without overstating a causal conclusion.

### Club page

**Job:** what is plausible for my team, what changed, and what matters next?

Arouca demonstrates why a single template with three fixed probability cards is insufficient. Two 0% headline metrics waste prime space, while “6th is most likely, at 12%” can overstate a narrow distinction in a broad finish distribution. A 1% relegation threshold in source also turns many clubs into “relegation candidates”; model thresholds are not a complete editorial understanding of what fans care about.

Lead with a club-aware outlook: relevant risks, expected points/range and a readable finish distribution. Say that several positions have similar support when appropriate. Preserve exact distinctions between “no simulated cases” and impossible; don't casually translate a small rounded probability into certainty.

Then show the supported upcoming fixture and **this club's** three conditional outcomes. Follow with change since the preceding forecast and the reasons that are actually evidenced. A factual “fell by X points” can be published from comparable versions; “fell because of this injury/result” needs supporting analysis.

The Arouca page's Casa Pia panel needs either a clearly separate “Efeito deste jogo noutras equipas” label or replacement in the primary position. A visitor should never have to infer whose 67% risk is being displayed. Use the chosen team name in conditional labels and baselines.

For clubs with negligible title and relegation probabilities, baseline finish distributions are already useful. A conditional finish distribution or top-half goal may need additional outputs: do not pretend existing title/relegation conditionals answer those questions. Top-three is available, but is not automatically the same event as European qualification.

### Match page — the best starting point for the recurring product

The Porto–Benfica page is closer to an actual answer product than the generic simulator. It names the fixture, gives match probabilities and shows all three outcomes' season effects without requiring three separate experiments.

Improve it in this order:

1. Fixture identity, verified schedule/status if available, forecast date.
2. Match probabilities with a sentence distinguishing “most likely single outcome” from “more likely than all alternatives combined.” Porto at 42% is a favourite among three outcomes, not more likely to win than not win.
3. “What changes for [chosen club]?” Baseline and win/draw/loss on one common scale; other team as comparison. On a phone, keep a visible baseline rather than asking the reader to remember a number from another page.
4. Evidence that helps explain the matchup; other fixtures and full modelling detail later.

Specific corrections: rename “Europa (top 3)” to the actual top-three event unless qualification rules are separately modelled; do not call a goals-only metric a general list of “decisive players”; treat 10 August absences as a dated snapshot, not current team news alongside September predictions. “Sem baixas registadas” is not proof of a fully available squad. Do not imply that every displayed injury or player measure was used in the forecast unless its input lineage confirms that.

The players page explicitly explains why a single goals metric is not a complete player ranking. The match page must follow that same editorial standard. Otherwise the site's most careful methodological correction disappears in the more widely used consumer surface.

### Simulator

**Job:** ask a specific conditional question that was not already answered by the match page.

Keep one selected match result at a time. The current removal of additive multi-match effects is correct. The initial state should already be useful: baseline and all three outcomes for the chosen fixture, followed by optional selection and comparison. “Sem escolha 44%” and an empty answer chart are weaker than an immediately populated comparison.

Offer two explicitly different paths: **my next fixture** and **other fixtures that affect my objective**. The existing ranking is based on the spread between published outcomes, not date and not a noise-adjusted causal importance score. Label it accordingly. Do not let an old postponed fixture silently become “next.” Show matchday per fixture when several rounds are included.

Replace “Casa/Fora” with team-labelled outcomes where the user is following a team. Keep the baseline/conditional pair visible on mobile, but verify that a sticky control does not cover chart labels or the next action. The unrelated “Quem acaba à frente?” baseline comparison belongs in a separate follow-up area or route: its current disclaimer is valuable, but the better structure reduces the need to warn that half the page ignores the chosen scenario.

Sharing should reproduce the club, objective, fixture, result and version. Reload and browser Back should preserve the question. If a version is unavailable, explain that explicitly rather than silently showing a different current answer. These are acceptance requirements; this pass did not exhaustively test every state combination.

### Supporting football products

**Prediction game:** a plausible optional return loop for engaged followers, not the default football entrance. The inspected page begins with a long scoring explanation and nine fixture choices, with no evaluated history. Offer one understandable first prediction before the technical score explanation. Make saving/submitting and the deadline unmistakable. Current copy mentions local-browser storage and anonymous season classification; clearly distinguish what is stored locally from anything submitted. Do not promise fair competition or durable history without verifying cutoff, storage and scoring behaviour. No predictions were submitted in this audit.

**Players:** good intellectual honesty, poor retrieval hierarchy. A person asking about a player encounters a long account of the old metric's failings before a list. Lead with player/team search or dimension choice, the measurement's plain-language meaning and comparison population. Keep intervals and minutes near the value; put the correction history and fitting diagnostics in an accessible methodological note. Avoid treating an ordered list with overlapping intervals as a certain ranking. Do not combine incompatible dimensions into a new overall score just to simplify the UI.

**Model evaluation:** unusually substantive evidence; preserve it. Lead with a restrained verdict, evaluation period/sample and a simple interpretation before the long narrative. Distinguish not detecting a difference from proving equivalence. The page uses ±1 standard-error bars; label what those are and do not make them look like a conventional 95% interval. Its methodological validity needs a separate evaluation review, not a design conclusion. Link a short version beside consumer probabilities, not only near the bottom of the league page.

**Liga 2:** its honest historical state should remain clear. A completed-season table and retrospective are not a live forecast; label the navigation accordingly until the new season is supported. Generalise the common pattern—current answer, status, evidence—without pretending this lighter model has every Primeira Liga capability.

## 6. Population: make the human scene explain the analysis

### Preserve two distinct entrances

The public/teaching entrance asks “What can linked synthetic people show us?” The research entrance asks “Can this release support my study?” Both matter. Neither should be treated as an optional detour from the other's interface.

The current research page is one of the site's clearest pages: it answers availability directly and distinguishes a demo from validated national data. Keep that. The current map also clearly labels its people as fictional. The remaining problem is that its dominant instruction—find your place—still invites real local interpretation.

A better demonstration lead is a small complete question, not an empty control panel. For example, “Como se relacionam idade e viver sozinho, neste exemplo fictício?” Then show the cohort, a meaningful comparison and one example household. Let the map provide place/scale context within that experience.

### Fix the older/alone path

The tested path selected 20 of 1,004 fictional people. The age chart then displayed 100% aged 65+, which is necessarily true after the age filter. Depending on the intended question, a useful next comparison is:

- among all older people in the fixture, how many live alone versus with others;
- how the selected older/alone cohort differs on an unfiltered available dimension; or
- an explicitly labelled count of matching people and matching households.

There are 212 older people in the unfiltered table. If those are the same release and scope, 20/212 answers “among older people, how many live alone?”; 20/1,004 answers “what share of all people are older and alone?” These are different questions. Validate units and links, then name the denominator. Do not turn either into a Portuguese population statistic.

Opening the selected example currently moves the camera to Aveiro and changes the result to 1/38. Instead, keep a visible national cohort summary and open “one example from these 20 people.” Returning to the distribution should restore that exact answer. Changing analytical scope should be an explicit place/filter action, not a side effect of visiting the person's illustrative home.

### Workspace structure

1. **Question and scope:** fictional/validated status, release, people versus households, geographic analytical unit.
2. **Answer:** count, denominator and one sentence explaining the comparison.
3. **Primary evidence:** selected distribution/comparison; map only when location is the question.
4. **Human example:** household/person drawn from the selected cohort, with an explicit connection back to it.
5. **Refinement:** filters with visible active conditions and clear reset; lens changes kept conceptually separate from population selection.
6. **Reproduction:** shareable state; later aggregate export, cohort definition and release reference when approved.

Maintain the enjoyable zoom and scenery, but let users bypass the animation to reach the same household/table. Movement is useful when it explains scale and continuity. Walking figures must not suggest that daily activity, routes, addresses or routines were actually simulated. Scene style can reflect geographic context without claiming exact household placement.

Filter labels should communicate an outcome: “Pessoas com 65+ anos que vivem sozinhas,” not simply a drawer called profile. A lens changes the displayed characteristic; a filter changes which records are counted. Show these separately. Do not suggest an income, commute or disability analysis unless the released variables and joint distributions support it.

### Research product when a release is ready

A useful research landing page should answer, in order: available version and reference year; permitted use/access; population and household units; supported geographic resolution; variable dictionary and missingness; validation against specified targets, including joint relationships; limitations; download/access mechanism; reproducible example and citation.

Do not promote today's demo field names as a guarantee of the eventual release. Provide a small real study recipe only after those fields and units are approved. A researcher deciding correctly that the dataset is unsuitable is a successful visit.

The first reusable tool after release should be cohort definition plus comparison and reproducible aggregate output. A broad policy simulator is premature. Mechanical eligibility/cost needs actual rule variables and validated rules; behavioural effects need additional models. Spatial service accessibility needs service/network data and defensible location resolution. Those opportunities remain worthwhile and are recorded in the earlier [product direction](product-direction-2026-09-15.md), not silently included in “UI work.”

## 7. Elections: the question changes with the calendar

### Archive/home entrance

Outside an active campaign, the strongest potential question is how the forecast performed. Today the archive can show what was published, but the inspected election journey does not supply a verified evaluation. Keep that distinction. “Arquivo” is a truthful state, not by itself a compelling recurring product.

The archive should identify election, round, forecast cutoff and what can be learned. A future report card needs official results, matched definitions and a fixed pre-election forecast. One correctly predicted winner does not demonstrate probability calibration. Until that work exists, publish an honest worked reading of an archived forecast rather than pretending it is a report card.

### Presidential

Default second round has winner cards, valid-vote split, simulations, scenario cards and another vote forecast. It gives several versions of the endpoint while omitting the trend evidence already available in source. The uncertainty navigation target is missing in this state. The header retains 18 January while the content is second round; this needs a round-specific election date and separate forecast cutoff, not an ambiguous shared date.

Use this order: round/cutoff/status → central answer and winning probability → expected vote share with its denominator/interval → change over time and poll evidence → optional simulation distribution and particular scenarios → method.

The first-round focused candidate chart is a positive model for the rest of the site. I switched candidate and opened its date table on a phone. It gives a readable selected line, interval and other candidates as context. Preserve it, but shorten the repeated technical preamble and make the candidate selection shareable. The URL changed for the round, not for the candidate in the tested interaction.

Clarify numerical scope. Second-round Seguro is shown at 67.5% of valid votes in one area and 64.4% in a later forecast including a separate blank/null category. These need explicit denominator labels at both points. The first-round summary, trajectory and projected election outcome also have different ranges; establish forecast horizon and quantiles before trying to make their labels match. A narrower current-estimate band and wider election forecast may both be legitimate. Visual consistency must not erase that distinction.

Keep scenario cards only when the threshold answers an intelligible question. A comparison with another party's percentage in a different election needs a clear basis; it is not automatically a meaningful headline because the model can count it. Remove expired “new metric” announcements from the primary archival reading flow; preserve relevant change history separately.

### Parliamentary and district routes

Lead with the electoral question: most seats, majority probability, or a district's uncertain seat allocation. These are distinct events. Label coalition membership next to majority figures; “Direita” with AD+IL must not require the reader to scroll to discover which parties were included. A selectable arithmetic grouping is not a prediction that those parties will govern together.

Move the many-party polling overview behind a selected-party or small comparison view with correctly defined uncertainty. Keep an all-means overview for orientation, labelled as such. A seat-distribution chart needs a clearly marked majority threshold and named grouping. An interval plot should say which values are medians/means and what its two bands cover. Teach the interpretation once beside the chart, not through unexplained decorative seats.

District selection on a phone works through a dropdown, a useful alternative to tiny shapes. The selected district's values are visible. However, map colour shows the party with the highest predicted **vote share**, not that party's probability of winning. A 29.6% value for AD in Lisboa must never be called a 29.6% chance of leading. The field name `probs` is not evidence of probability semantics.

For “where was it close?”, existing mean shares can support a plainly labelled gap between the top two estimated shares. They cannot alone supply a chance of a different leader or uncertain seat allocation; those require appropriate simulation outputs. Prefer district seat uncertainty where validated outputs already exist, since that better answers parliamentary consequences than land area coloured by leading party.

Fix the summary/map apparent contradiction: the national page's 8/4/1 totals count only the 13 stable districts; the map's 14/5/1 counts all 20. Label the subset at the first total. “ENSC 3.04” should not be the first explanation of a contested district. Lead with what can change and the named party/seat, then explain the index and its threshold.

Retain house-effect heatmaps for specialists, in a method/evidence section. A logit-scale heatmap is not a useful main-path answer for most voters. Phone readers should never need hover to discover what an important value means.

## 8. Economy: answer a question, then show the instrument

The current paused state is honest and the inflation answer is useful. Its direct answer still begins far down the measured phone page: the question appears around y=667 after header, art, timestamp and status. A direct link to an answer helps, but a normal arrival should also get the answer quickly.

Put the selected question and answer first, with status/date nearby. The shop illustration should be a small companion here, not another section above the content. Keep the three useful question areas—prices, work and activity. Their labels can become question-shaped when space permits. Preserve helpful explainers even if the dashboard data fail entirely; the source's null-data branch currently gives less value than the paused branch.

The live design should be reordered before reactivation. Ten tiles—health score, pulse, annual outlook, contributions, labour, inflation, recession, growth-at-risk, official quarter and track record—are an instrument inventory, not a reader's hierarchy.

A future live page should begin with one dated conclusion, the main evidence for it, change from the last comparable reading, and the next relevant release. Then offer question-led paths: prices, work/income, activity. Each path distinguishes official observation from estimate or composite, and gives source, period, publication date and revision status locally.

For inflation, a price-level index and inflation-rate chart answer different questions. Use a paired illustration only when explaining that difference; don't put two unlabeled lines with different units on one axis. For wages, compare compatible nominal/real series and periods. For GDP, distinguish quarter-on-quarter from year-on-year and an official observation from a forecast. For model ranges, show the actual documented range and validation; do not visually promote a synthetic “health score” above the facts it summarises without a demonstrated interpretive benefit.

Existing economic stories have more concrete entry potential than generic tiles, but dates must remain per-story. A 2025-09 wage series inside a July-2026 envelope is not a July-2026 wage finding. No palette, narrative polish or release-date badge can make old data current.

While paused, the useful product is a small, well-explained set of questions. Once reliable updates and retained vintages exist, “what changed this month?” becomes the repeat product. A personal spending-basket tool is a later opportunity with compatible category data, weights and arithmetic, not an instant personal-welfare simulator.

## 9. Chart and control decisions

| Question | Preferred first visual | What to change/avoid | Evidence requirement |
| --- | --- | --- | --- |
| What does this match change for my club? | Baseline plus win/draw/loss markers or bars on one labelled scale. | Empty pre-selection chart; mixing match-win and title chances; colour as the only identification. | Same model bundle, correct fixture/outcome orientation and objective. |
| Where might my club finish? | Full position distribution with a readable interval/summary. | A single modal rank looking like a confident predicted position; fixed impossible objectives. | Existing finish draws/probabilities and documented summary definitions. |
| How has the outlook changed? | Selected team history with current value and named previous comparison. | Every relegation line by default; inferring causes from a delta. | Comparable dated versions; attribution needs additional analysis. |
| How do these fictional people differ? | Count and comparison of a relevant unfiltered attribute. | Showing 100% of the filter condition as the main discovery. | Explicit unit, denominator, release and scope. |
| How does a household relate to the cohort? | Cohort summary beside a selected example. | Camera visit silently changes population under analysis. | Stable selection and valid person/household links. |
| How uncertain was candidate support? | One candidate's trend, correctly labelled band and polls. | Multiple opaque bands; inaccessible hover; no trend in one round. | Horizon/quantile definitions and dated sources. |
| Could a grouping reach a majority? | Seat distribution and majority threshold. | Unnamed political bloc; expected seats read as probability of government. | Coherent joint simulations and stated grouping. |
| Where was the district contest close? | Ranked district summary + map context. | Calling vote shares winning probabilities; area visually standing in for seats. | Mean-share gaps can be descriptive; event probabilities need draws. |
| Does disinflation mean falling prices? | Short answer; illustrative level/rate comparison if needed. | Gauge or large current-looking number without current data. | Label illustrative numbers; real series need matching periods/units. |
| Is the model useful? | Properly scoped performance comparison, uncertainty and benchmark. | Winning anecdotes, unsupported equivalence claims, decorative accuracy gauges. | Reproducible evaluation with its sample/cutoff/limitations. |

Common rules: start with a descriptive answer title; show date, unit, denominator and scope beside the plot; make the important comparison visible without hover; preserve meaningful category identity; put a readable table one action away; define uncertainty by its actual source; avoid false precision; and share the selected state when discussion depends on it.

Not every chart needs a selector. Add controls only when a different selection answers a plausible follow-up. Filtering should change an answer, comparison or scope; recolouring the same picture is not sufficient product value. Empty and unavailable states should explain what is missing and retain a useful way back.

## 10. Cohesion, navigation and trust

The paper/pine palette and architectural illustrations can support this product. I would not restart the identity. The inconsistency is increasingly about **what components mean and where they appear**.

Use three expression levels: welcoming imagery on home/section introductions; modest contextual fragments on answer pages; restrained data/evidence surfaces for analysis. Repeating a large illustration before every answer taxes the people who already know what they came for. Small architectural fragments are useful as section identity; charts should carry the analytical interest.

Team/party colours should identify a series or accent, not determine all text/background combinations. The Arouca phone hero uses white type on bright yellow and looks conspicuously less readable than the surrounding system. Preserve the club colour in an accent/crest and use a readable neutral surface, or verify an alternative contrast pairing. Do not pastelise meaningful party/team identity merely to make screenshots match.

Create common answer-page conventions: compact status/date, one primary question, useful result, immediate next step, related evidence. Keep primary actions visually distinct from local tabs, filters, disclosure controls and route links. Presenting all of those as similar pills makes their consequences harder to predict.

Navigation should offer domain names for orientation and task labels within a domain. “Liga Portugal → Arouca → Sporting–Arouca → cenário” should feel like increasing detail about the same question. It should not repeatedly reset to a generic page or Sporting default. Page introductions should recognise deep arrivals: identify subject, date and meaning without assuming the user saw home.

About must include population's current role and use the same availability status as product pages. Article navigation should not imply a body of published material that the local route lacks. The local Subscribe component promises email updates while rendering only RSS when its endpoint is missing; change the promise with the capability, or configure the real service when authorised. Do not add a decorative subscription box as a retention strategy.

Dates must distinguish: event date, forecast cutoff, publication/update time, underlying data period and auxiliary-data date. Display the few relevant ones in the right place rather than burying all of them in a methodology page. This is especially important for second-round elections, old injury data and paused economy readings.

Search and sharing are entry experiences too. A match title/preview should state the actual supported objective; a selected scenario link should reproduce the intended answer; a research release should have a stable identity. The current match metadata's “Europe” promise needs the same correction as its visible panel. A shared generic brand image can identify Estimador, but a dated answer summary would better communicate why a recipient should open it. Build that from verified values only.

## 11. What to keep, rework, remove from the main path and defer

| Keep | Rework with existing information | Move out of the primary journey | Needs additional evidence/data/modelling |
| --- | --- | --- | --- |
| Architectural identity; immersive household continuity. | Stable cohort scope, meaningful chart defaults, clear demo example. | Animation as a prerequisite for reaching the answer. | Validated national release and research exports. |
| Dated football probabilities and conditional outputs. | Home/club/match coherence; three-outcome stakes; fixture scope/freshness. | Generic simulator as universal primary CTA; unrelated baseline duel mid-scenario. | Joint multi-match conditioning; conditional finishing objectives not exported today; causal update attribution. |
| First-round focused trend, tables, explicit election archive. | Round-specific dates/navigation, denominators, district subset labels. | Dense all-party uncertainty-free default; house-effect heatmap for general readers. | Official outcome report card; calibration/evaluation pipeline; new district event probabilities where absent. |
| Honest economy pause; clear explanatory questions. | Answer placement, local sources/status, useful failure state. | Ten-tile inventory as the main visitor hierarchy. | Reliable current releases, stored vintages, validated basket scenarios. |
| Honest player dimensions and model evaluation. | Search/task entry, local caveats, sensible metric naming on match pages. | Long correction history before the player's answer; unexplained diagnostics. | Claims of overall player quality or injury-driven probability changes not supported by the model. |

Do not prioritise generic AI chat, more landscapes, more filters, accounts or a general dashboard builder now. They would expand the surface before the main tasks are coherent. A saved cohort or repeated forecast activity may later justify an account; a single shared scenario does not require one.

## 12. Implementation sequence and acceptance criteria

Priority here means consequence for comprehension and task completion, not visual severity. The domain notes use some broader P0 labels; this sequence narrows the immediate blockers.

### First: remove wrong or misleading answers

- **Club continuity:** Arouca selection changes all club-specific home content and opens Arouca's supported fixture/objective. Explicit general title-race content remains labelled general. Test a large club, Arouca and a high-relegation-risk club.
- **Fixture eligibility:** distinguish outstanding rounds; show each round/date when available; unsupported/stale schedule states never claim a verified next kickoff. Verify the raw 13-match scope before changing labels.
- **Population continuity:** opening one matching household leaves the national cohort/denominator intact. Returning restores the same question and filters. An explicit place change may alter scope.
- **Election scope:** every round-specific link has a visible target; round and cutoff are explicit; vote denominators and district subsets are unambiguous.
- **Semantic consistency:** top-three is not called general Europe; goals-only SAR is not general player quality; old absence snapshots are visibly limited; About and product status agree.

### Second: deliver complete core answers

- **Home:** one supported three-outcome match answer, one honest population use case with direct research access, an actual inflation explanation, specific archive routes. No extra generic dashboard module.
- **Club:** relevant finish/risk summary first, then own supported fixture. A reader can identify whose probability every panel reports.
- **Match/simulator:** baseline and three outcomes visible together; deeper controls extend the same question. Match-win and season-objective probabilities are clearly different.
- **Atlas:** selected question opens a non-tautological comparison and a connected example; filter and lens effects are explainable.
- **Election:** restore second-round evidence using documented existing data; focused parliamentary comparison and a plain district consequence before specialist indices.

### Third: make the same tasks work at each size and entry point

Check 320/375/390 phones, 768/900 intermediate widths, and 1280/1440 desktop. Include long Portuguese names, English labels, expanded menus, opened tables, zero results, missing fixtures and unavailable data. Test keyboard use, focus after drawer closure, zoomed text, reduced motion, chart identification without colour and touch access to values. The current audit is not a substitute for those implementation acceptance checks.

At each width, inspect the first viewport and the full task, not just overflow. Someone opening a match should see fixture/context and a useful probability before a large illustration. A returning club reader should not scroll past an atlas tour. A researcher should reach the availability verdict without a map interaction.

### Fourth: add reasons to return, with real prerequisites

- Reliable football update publication and an explicit previous/current comparison.
- A versioned national population release with suitability/validation material.
- Election report cards after verified outcomes and evaluation are ready.
- Dated economic readings after a reliable update/vintage process is restored.
- Actual published analysis, with subscription/RSS promises matching available delivery.

Measure whether these solve a user problem before expanding modelling breadth. The earlier [feature opportunities](product-direction-2026-09-15.md#feature-opportunities-including-new-modelling) remain the longer-term backlog; they are not prerequisites for fixing the current journeys.

## 13. How to test interest and usability honestly

Browser inspection can show a broken journey. It cannot tell us how many people want that journey. Run separate task sessions with football followers beyond the big three, prospective population researchers/policy users, and readers with a concrete election/economy question. Small qualitative rounds are for finding patterns and misunderstandings, not estimating audience percentages.

Use real tasks rather than “explore the website”:

| Task | What success looks like | Misunderstanding to listen for |
| --- | --- | --- |
| “You follow Arouca. What is the outlook, and what changes in the next supported match?” | Finds own club, relevant objective and conditional comparison; states model date. | Reads Sporting's figures as personalised; reverses home/away; thinks 2% means impossible. |
| “Send a friend the Sporting draw scenario.” | Recipient sees same club, result and version, with baseline. | Shares a generic page; confuses title chance with match chance. |
| “What did this week's update change?” | Names comparable previous/current values without inventing causes. | Explains a change from unrelated injury/news content. |
| “Find older people living alone, then inspect one.” | Explains denominator and fictional status; returns to unchanged cohort. | Thinks the example describes their parish; loses national question when zooming. |
| “Could you use this for your study?” | Reaches a justified suitability/access decision, including a clear no when appropriate. | Treats demo variables as a released national dictionary or expects policy effects from microdata alone. |
| “What did the second-round forecast say, and what evidence supported it?” | Identifies round/cutoff, vote denominator, win probability and uncertainty evidence. | Reads 18 January as runoff date; treats vote share as winning probability. |
| “Where were parliamentary seats uncertain?” | Finds a consequential district and can explain the seat event/scope. | Equates coloured land area with seats; calls vote share a win probability. |
| “Inflation fell. Did prices fall?” | Explains level versus rate and knows whether numbers are current. | Repeats a chart label without understanding, or assumes paused data are current. |

Record first meaningful action, time to a correctly understood answer, wrong turns, abandonment reason, explanation in the participant's own words, and whether they would use/share the result for a real purpose. Do not optimise for time spent or number of simulator clicks; both can increase when the site is confusing.

For interest, ask what event would make them return, what they currently use, and which answer they would seek next. Ask researchers about an actual study and required variables, not whether the concept sounds promising. Ask football followers whether the compact answer already satisfies them; success may require fewer simulator visits.

After establishing a baseline and checking privacy rules, use minimal aggregate measurement: entry route, meaningful answer viewed, club-to-match continuity, share/revisit, successful research suitability action, and repeat visit after a new release. Do not send raw cohort filters, free-text research questions or arbitrary URL contents to analytics. No new tracking was added in this pass.

The release gate is comprehension and continuity: no wrong-club answer, no unannounced denominator change, no archived/fictional number understood as current reality, no central answer dependent on hover or an inaccessible control. Then judge retention from actual return opportunities and observed use, not from an attractive first screenshot.

## 14. What this diagnosis deliberately does not claim

It does not establish the largest audience, prove model accuracy, verify all real-world fixtures/results, approve a national data release, validate the economic model, or certify every responsive/accessibility state. It identifies observed task failures and a concrete design direction, supported by current local pages and data.

The opportunity is stronger than another round of card styling: a recognisable Portuguese site where a visitor gets a useful answer quickly, can see what would change it, and can inspect the evidence without losing their question. The existing assets and models provide much of that foundation. The next work should connect them into complete, truthful journeys.
