# Estimador: deeper UI/UX diagnosis

14 September 2026 · local implementation at http://127.0.0.1:3044 · assessment, not another redesign

## Verdict

The visual language is now credible enough to stop making illustration the main intervention. The larger weakness is that the site exposes its domains, datasets and models more clearly than it helps people complete a task.

A newcomer can identify the topics. It is harder to answer: What can I actually do here today? Which result matters to my question? What changed after my action? Can I trust, reproduce or share this particular conclusion?

The best next direction is a shared structure of **question → answer → exploration → evidence**, with different emphasis by domain. Do not make every page look the same or add cards around everything.

## Scope and confidence

This is an expert walkthrough and source inspection, not a usability study or a production performance benchmark. Findings use the current local checkout, including the recent visual changes. Earlier desktop/mobile walkthroughs in this same session covered the homepage, economy, league, simulator, election archives and brand guide; this pass additionally inspected the population entrance and profile controls.

Labels below:
- **Observed:** visible in the browser walkthroughs.
- **Source-confirmed:** demonstrated by the current implementation; not necessarily exercised end to end in this pass.
- **Hypothesis:** likely user consequence, requiring user testing.

An earlier browser text-read was temporarily unavailable. A subsequent hands-on browser pass completed the journeys recorded in the follow-up below; that earlier limitation does not apply to those observations. No production analytics, external competitor study, user interviews, comprehensive accessibility audit or measured animation performance are claimed. The real economy feed is paused; its future active-feed experience was inspected in source and through explicitly fictional component examples, not by bypassing the stale-data guard.

## What should be preserved

- The population-first homepage hierarchy is appropriate to the stated ambition. Four equal topic tiles would weaken it.
- Real questions and dated findings are stronger entrances than product descriptions alone.
- Honest demo, archive and pause labels are valuable. Improve their placement; do not remove them to make the site seem more complete.
- Direct labels, readable tables, uncertainty intervals and small club/party identifiers work better than colouring entire numbers or panels.
- Atlas geography and the architectural imagery give the site a recognisable subject. Methodology pages can remain quiet.
- The football baseline marker is useful, but it is only the start of making a scenario understandable.

## Priority findings

### 1. The research promise does not yet have a research journey — P1

**Evidence: observed and source-confirmed.** The homepage says “Uma base para investigar”; the population destination leads with “Encontra o teu lugar” and a geographic demo. The visible atlas describes 1,004 invented people. Its national-release disclosure says that coverage and published release approval are still pending. Homepage “Dados e métodos” opens a disclosure, with a general-methodology link that leads to an election methodology document.

Sources: `src/components/home/PopulationPanel.tsx`, `src/components/atlas/Atlas.tsx:67`, `src/content/methodology/pt.mdx:1`.

**Consequence (hypothesis):** an academic cannot quickly establish whether the product is usable, what it contains or what remains planned. A casual visitor may hear a research promise and then assume the geographic comparisons are empirical despite the disclaimer.

**Change:** keep one population destination, but give it two explicit routes: “Explorar a demonstração” and “Avaliar os dados”. The latter needs a release/status sheet: availability, reference year, variables, geographic coverage, validation, household relationships, limitations, licence and citation. Mark unknown or unreleased items as such. Link to population-specific methods, not an election methods page. Downloads should appear only when an approved dataset exists.

**Acceptance:** a researcher can explain what is available today and locate the relevant documentation without having to enter the animated atlas.

### 2. The scenario interface promises more certainty than its combination method explains — P1

**Evidence: source-confirmed.** `MatchdayPicker.tsx:63` describes an additive approximation: individual conditional probability changes are summed, then each output is clamped to 0–1. The simulator page supplies no adjacent explanation of that combination method. This is not evidence of a correctly conditioned joint simulation of all selected results. Clamping also does not itself enforce probability totals across teams.

**Consequence (hypothesis):** polished results can be interpreted as a fresh, internally coherent simulation of the chosen joint scenario. Better-looking bars risk increasing misplaced confidence.

**Change now:** label combined selections as an approximation at the point of use, explain unselected matches, and separate a single-result conditional view from the multi-result approximation. Ask the model owner to validate the intended interpretation and mathematical constraints. If full joint conditioning is required, implement and validate it before describing it as such. Do not “fix” this by quietly normalising displayed figures.

**Acceptance:** users can distinguish the baseline, a single-condition estimate and a combined approximation. Model-owner validation is required separately from UI acceptance.

### 3. Mobile choices and their consequences are too far apart — P1

**Evidence: observed and source-confirmed.** All simulator match controls precede the impact panel below the desktop breakpoint. The result region follows the complete list. In the narrow-screen walkthrough it required substantial scrolling to reach the baseline legend and bars after making a selection. The component has no live result announcement. Its selections are local component state.

Source: `src/components/charts/football/MatchdayPicker.tsx:48,135,257`.

**Change:** ask for a focal team/objective first, then keep a compact result summary near the choices: baseline, selected scenario and change in percentage points. Offer “Ver todas as equipas” for the full table. A small sticky summary can work on phones if it does not cover controls or keyboard focus. Group fixtures by their actual matchday/date where those fields exist; do not infer grouping from team names. Preserve selections in a versioned URL when sharing is supported.

**Acceptance:** after choosing a result, the user can see the relevant consequence without searching below the entire fixture list. Reset clears both the choices and the summary; keyboard/screen-reader users receive an equivalent update.

### 4. The atlas asks users to learn controls before showing what they can learn — P1

**Evidence: observed and source-confirmed.** The entrance exposes geographic modes and zoom. Lenses and profile filters sit behind “Lugares e perfil”. Strong questions such as “Quem envelhece sozinho?” appear below the large visual. The first observed loading state was mostly an empty dark canvas with a small preparation message; no duration benchmark was taken.

**Change:** put two or three question starters at the entrance, or make one a guided first step. Keep free exploration. After a selection, show a concise, explicitly demo-labelled finding above or alongside the visual. Pair the map with an accessible summary/table. During preparation, retain context and a clear ready/loading state rather than an unexplained empty stage.

**Acceptance:** a first-time visitor can produce and explain one demo comparison without assistance, and states correctly that it is not a real estimate for that place. Before the national release, avoid question copy that invites unsupported real-world conclusions.

### 5. Forecast pages are organised as inventories, rather than answers — P2

**Evidence: observed/source-confirmed.** League sections progress through standings, tools, historical title probabilities, fixtures, relegation, strengths and model information. Legislative pages present polling trends, coalition simulations, individual-party seats, districts and house effects. Many sections have similar visual importance.

**Change:** put a compact dated answer first, then three task-based entry points. For football: “A minha equipa”, “O que mudou”, “Experimentar resultados”. For elections: “O que a previsão dizia”, “Onde havia incerteza”, “Como foi feita”. Give each section a one-sentence takeaway and allow expert detail to expand. Preserve deep links and table access. Do not replace long pages with tabs that hide everything or break browser navigation.

**Acceptance:** visitors can find one relevant result and its evidence without scanning every section. Advanced users can still access the complete information.

### 6. Trust exists, but is scattered — P2

**Evidence: observed/source-confirmed.** The site uses updated dates, archive labels, pause messages, separate methods pages, interval legends and model-evaluation links. Their locations differ. Some intervals are 90%, others are 95%; some views show win probability and vote share near each other.

**Change:** establish a compact “evidence context” pattern: what is measured, unit/denominator, reference date, release or model version when available, uncertainty definition, source and relevant method. Expand the technical detail underneath. Preserve genuinely different interval coverages; never relabel them for visual consistency. State explicitly that chance of winning is not vote share and that percentage-point changes are not relative percentage changes.

**Acceptance:** a reader can identify what a number means and the information date without leaving the view. A share/export carries those same facts.

### 7. The homepage mixes product maturity without helping people choose — P2

**Evidence: observed.** The population lead is a demo, football has dated current forecasts, economy is paused, and elections are archives. Those labels are present, but a visitor has to assemble that picture from individual cards.

**Change:** make each card name the available activity: explore a demo, test football assumptions, understand an indicator, inspect an archived forecast. Keep the asymmetrical hierarchy. Let the next destination continue the promise of the card. Do not style paused content like a failed product or imply forthcoming capabilities are already available.

**Acceptance:** newcomers can say what each main section offers today. Evaluate this before increasing homepage promotional copy.

### 8. The economy pause notice dominates its still-useful learning experience — P2

**Evidence: observed.** The paused dashboard opens with the illustration/header, then a substantial pause panel, then the useful explanation tabs. The data guard is correct; the hierarchy makes the section feel primarily unavailable.

**Change:** keep the status/date visible in a compact notice, lead with “Compreender os indicadores”, and place detailed feed-state explanation behind a disclosure. If live data resumes, promote the current reading again while keeping explanation nearby. Do not show invented numbers to fill the space.

**Acceptance:** the user recognises that live indicators are unavailable and can still immediately find a worthwhile task.

### 9. Sharing does not consistently preserve the question and state — P2

**Evidence: observed/source-confirmed.** Atlas selection is encoded in its URL and it offers sharing. Football match selections live in `useState`; the simulator component does not persist them in the URL. Returning to or sharing a route therefore does not define a reproducible selected scenario.

**Change:** design a shareable result, not merely a URL button: selected assumptions, data vintage, focal team or location, baseline, outcome and uncertainty. Version the saved state and handle stale fixtures/releases gracefully. Never silently reinterpret an old link against a new dataset.

**Acceptance:** opening a shared view reproduces the intended state or clearly explains why the previous release is unavailable.

### 10. Shared components need behavioural rules as well as style rules — P2

**Evidence: source-confirmed.** Header renders a generic `main-content` target while the homepage also has a `main` with that ID. Atlas also provides its own target. The duplicates make the intended skip-link destination ambiguous. Atlas modes appear as checkbox/toggle controls even though they select one view. These findings need focused assistive-technology verification; they are not a complete accessibility audit.

Sources: `src/components/Header.tsx:127,215`, `src/app/[locale]/page.tsx:96`, atlas browser accessibility tree.

**Change:** one page-owned main landmark and skip target; define tab versus toggle semantics; define focus behaviour after navigation; distinguish disclosures from links even if both share button styling; standardise loading, empty, stale, selected and error states. Add concise result announcements without reading out entire tables.

**Acceptance:** the same keyboard interaction works across comparable controls, and navigation lands at one unambiguous main region.

### 11. The visual family is coherent enough; further sameness would be counterproductive — P3

**Evidence: observed.** Frontal architecture, cream surfaces and pine typography connect the sections. The stadium is more saturated and detailed than the population cutaway. Repeated rounded image frames still make some art feel inserted rather than structurally integrated.

**Change:** if commissioning another art pass, give it a specific brief for detail density, perspective, background treatment and maximum accent strength. Keep section personality. Spend the next implementation effort on findings 1–6, not another palette or logo cycle. Keep technical methodology mostly typographic.

## Proposed page structure

| Surface | First thing it should answer | Primary action | Evidence/detail |
|---|---|---|---|
| Homepage | What can I do here today? | Enter an available task | Product state and date |
| Population | Explore the demo or evaluate research data? | Guided question / release sheet | Coverage, variables, validation, methods |
| League | What matters for my team now? | Choose team / inspect change | Full table, history, model evaluation |
| Simulator | What changes under these assumptions? | Select outcome with nearby feedback | Baseline, approximation disclosure, all teams |
| Economy | What can I understand or measure today? | Explanation topic; live reading when available | Date, availability, definitions, sources |
| Election archive | What was forecast, and when? | Choose election/round/question | Distribution, geography, assumptions |
| Methodology | How was this particular result produced? | Read relevant section | Technical detail, validation, references |

## Implementation order

1. **Trust and promise:** disclose combined-scenario approximation; create the population availability/methods route; verify demo claims and archive context. These are dependencies, not decorative changes.
2. **Complete one task without friction:** focal-team simulator with immediate mobile feedback, state persistence, and one visible atlas starter question.
3. **Prioritise evidence:** summaries and task navigation for league/elections; compact paused-economy notice; shared evidence-context component.
4. **Finish interaction foundations:** unique landmarks, consistent keyboard/focus behaviour, announcements and release-aware sharing.
5. **Only then refine art:** commission targeted visual harmonisation if user testing still identifies it as a problem.

## Validation plan — proposed, not performed

Recruit a small mix of non-specialist Portuguese users, football followers and population researchers. Six to eight sessions are useful for discovering problems, not for estimating conversion rates. Ask people to think aloud, then explain the result in their own words.

- New visitor: identify what each section offers now, including unavailable capabilities.
- Researcher: determine whether the population can be used for a study, its coverage and where its methods live.
- Football visitor on phone: choose a relevant match result, find the impact, describe baseline vs scenario, reset, then share/reopen.
- Election visitor: distinguish forecast probability from vote share and from an actual result; locate the forecast date.
- Economy visitor: explain what slower inflation means and whether the displayed section currently contains fresh indicators.
- Keyboard user: skip navigation, use a tab group, switch election rounds and reach a result without losing focus.

Record task completion, wrong interpretations, backtracking, time to the first meaningful result, and places where users seek help. Treat timing as diagnostic rather than a pass/fail target until a baseline exists. Prioritise wrong beliefs over minor visual preferences. In particular, believing fictional geography-based counts are real or believing an approximation is a joint simulation is more serious than taking an extra click.

## Recommendation

Stop treating the next iteration as a site-wide reskin. Build three concrete interaction patterns: a population release/evaluation entry, an immediate scenario result, and an evidence context block. Use those to organise the content already present. The graphics should help users recognise the topic; the interaction should help them finish a question.


## Hands-on browser follow-up — 14 September 2026

This follow-up used the actual local application on port 3044, not the static visual prototypes. I clicked links and controls, inspected screenshots and rendered text, and reloaded a selected scenario. Desktop inspection used the normal browser size (approximately 1265 × 712); mobile used 390 × 844. The viewport override was reset afterwards. These are observations of this checkout, not a claim that the production site has identical behaviour.

### Verified journeys and outcomes

| Journey | Observed outcome | Decision |
| --- | --- | --- |
| Homepage → Dados e métodos → atlas methodological note | Disclosure opens. The atlas link lands at the methodology near the footer, even though the final URL drops the hash. | Initial anchor navigation works; do not report it as broken. |
| Atlas methods → national-release disclosure | Opens correctly and explains pending publication/coverage. | Useful release caveat, but still not a research data sheet. |
| Atlas prompt → Lisboa/Bragança comparison | Comparison updates and URL records both places. The viewport stays near the prompt/footer; most of the new answer is above the visible screen. Scrolling up reveals it. | Bring the resulting heading and comparison into view, respecting reduced motion and keyboard focus. |
| Mobile homepage → Experimentar resultados → Porto–Benfica: Fora | Selection visibly activates. Benfica changes from 30% to 41%, Sporting from 44% to 43%, Porto from 26% to 16%. The selected control's viewport shows more fixtures, without the changed probabilities. | Keep a compact consequence beside or persistently near choices. |
| Selected football scenario → lower comparison | The impact chart says Benfica 41%, but “Quem acaba à frente?” still says Benfica 30% and Sporting 44%. Its text does not clearly separate the original forecast from the selected scenario. | Either connect it to the same scenario or explicitly label and visually separate the baseline-only comparison. |
| Selected football scenario → reload | The selected away-win control resets; title probabilities return to 44%, 30%, 26%. URL contains no scenario. | Persist/version choices before presenting scenarios as shareable or revisitable. |
| Economy → Trabalho → population-active explanation → methodology | Topic, disclosure and destination all work. Explanation appears directly below the tabs. Methodology is genuinely economy-specific. | Preserve this interaction pattern; move useful reading above the oversized pause notice. |
| Presidential archive → 1ª Volta → Ver como tabela | Round changes successfully. Table disclosure opens readable dated rows with bands. | Preserve working round navigation and table alternative; improve chart reading and table retrieval. |
| Shared Metodologia destination | Opens “Metodologia — eleições”, with economy/football links but no population-methodology route in its domain list. | Make the shared entry a domain index or clearly label election-specific links. |

### New or strengthened findings

**P1 — Population claims conflict across the same journey.** The homepage disclosure says fictitious households are “coerentes com os Censos 2021”. The atlas says its 1,004 people were invented to test the experience and that differences between places do not represent Portugal. A reader should not need to reconcile those claims. Make the homepage describe the actual demonstration, and reserve validated Census-coherence claims for a named, assessed release. This audit does not establish whether any underlying future population meets that standard.

**P1 — The football page mixes scenario and baseline results without a clear boundary.** This is now observed, not merely inferred from component structure. The team-comparison area is on the same simulator page, below the scenario charts and table. Consistent styling makes the numbers look like one answer even when they belong to different states. A small general disclaimer would not adequately explain a 41%/30% discrepancy for the same team; the scope belongs in each relevant heading or result summary.

**P2 — Uncertainty wording is inconsistent.** In the first-round presidential trajectory, the paragraph says 50% and 95% bands; the legend says 50% and 90%, with P5–P95. The expanded table also uses P5–P95. Resolve against the actual intended quantiles, then make the paragraph, chart, table and methods agree. Do not change a number just for visual consistency.

**P2 — Chart language and number formatting still break the Portuguese experience.** The trajectory visibly uses “Estimated Support”, “Date” and “Last poll”; other election components show “Leader” and “95% CI”. Election values use decimal points while the table formats Portuguese decimal commas. Simulator changes are headed as percentage-point variations but displayed as “+11%” and “-10%”. Use Portuguese labels and “pp” for changes in probability. Separately rounded values can also make a displayed change look inconsistent; define one understandable rounding convention.

**P2 — The chart's default detail exceeds what its layout can explain.** The desktop trajectory overlays multiple coloured uncertainty bands, mean lines and polling dots, while right-side labels truncate even at desktop width. This is visible evidence of the integration problem, not an argument for removing uncertainty. Default to legible, fully named mean lines; let a chosen candidate reveal bands and poll detail. Keep a clear visible control for all candidates. The table is a valuable alternative, but opens at the oldest observations in a long scrolling list: provide a date/candidate filter or latest-first entry for someone checking today's endpoint.

### Critical design conclusion

The illustrations and restrained hero sections now provide a coherent entrance. Cohesion breaks when that entrance turns into an older analytical component with different language, density, colours and interaction rules. Replacing the illustrations again would leave the strongest verified failures untouched.

Define the shared chart/component rules through a complete task: a visible question, a direct answer, controls near their consequence, an explicit baseline/scenario or archive/demo status, and a local path to evidence. Party and club colours should remain identifiers; they should not require every confidence band and every result to compete equally for attention. The economy topic switch already demonstrates a useful small-scale version of this pattern.

### Recommended implementation order and finishing checks

1. Reconcile population promises and label the simulator's baseline-only comparison. Check every number a selected scenario displays for scope consistency.
2. Keep mobile simulator feedback visible; preserve/reset scenarios reliably. Repeat the away-win and reload journey.
3. Make atlas prompts reveal their answers. Repeat the comparison from the footer at desktop and mobile sizes.
4. Rework one presidential trajectory completely: Portuguese labels, correct intervals, untruncated names, candidate focus, and useful table retrieval. Then apply its rules to other charts.
5. Reduce the economy pause notice and create the population research sheet and shared methods index.

No new application changes were made in this diagnostic pass. No animation timing, screen-reader session, complete keyboard audit, live economic data view, or production benchmark was performed. Those remain separate checks; successful round switching and table disclosure should not be mistaken for comprehensive accessibility verification.
