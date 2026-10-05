# Estimador: product direction and feature decisions

15 September 2026 · based on the local product walkthrough and current data contracts

## Product thesis

Estimador should help someone understand a specific uncertainty about Portugal, explore what changes the answer, and inspect the evidence. Its shared identity is a way of thinking, not four equal dashboards.

There are two important audiences: people following a question in the news or their community, and researchers needing a credible population and modelling substrate. They can share data and visual language without sharing the same default interface.

The priorities below are product judgments, not evidence of market demand. Browser testing establishes whether a journey works; it cannot establish whether people want it. We have not inspected audience analytics or interviewed users in this pass.

## What earns a place today

| Area | Reason to arrive | Useful result | Reason to return | Decision |
| --- | --- | --- | --- | --- |
| Football | A match changed the title race; what does the next one mean for my club? | Dated chance, movement and a conditional outcome | Next match or forecast update | Strongest current recurring consumer use. Build around a club and objective. |
| Population research | Can I use this population for my study? | Suitability, variables, validation, coverage, access and citation | A release, validation improvement or study workflow | Highest strategic importance. Treat research readiness as a product, not documentation afterthought. |
| Population exploration | Help me understand a group or place | A meaningful relationship between people, households and geography | A new question, dataset or shareable finding | Current fictional atlas is a demonstration. More scenery alone will not create enduring utility. |
| Economy | What does this headline mean? | Plain interpretation with dated evidence and limits | A meaningful data release | Generic explanations are helpful but not distinctive enough alone. Build around Portugal-specific readings. |
| Elections | What might happen, or how did the prediction perform? | Forecast during a campaign; audited retrospective afterwards | New polling during campaigns; new analysis afterwards | Seasonal priority. Preserve archives, but a frozen prediction is not a complete off-season product. |

## Changes implemented in this pass

- Homepage entrances now identify an actual question. Population retains the dominant position and has separate demonstration and research routes.
- `/populacao/dados/` answers availability and suitability before an academic has to navigate the atlas. It describes the current fictional release, not an imaginary approved national dataset.
- Atlas question starters precede the workspace. Selecting one brings its result into view. The older/alone journey supplies a count and direct next actions.
- Football starts with a team and title/relegation objective. Three fixtures are prioritised by the spread between that team's published conditional outcomes; the full list is still available. This is sensitivity in the published model, not proof of causal influence or a ranking adjusted for simulation noise.
- A focused football answer stays visible on mobile. One selected match outcome replaces another; the former addition of independent changes is removed. Sharing and reload preserve team, objective and selection for the same forecast version. A different forecast version resets the choices with an explanation.
- The lower football duel is explicitly labelled as the original forecast, independent of the selected match.
- The homepage economic question opens directly at its answer. The paused-feed explanation no longer dominates the page.
- `/eleicoes/arquivo/` provides a short reading guide and direct forecast links. It does not pretend to be an evaluation against official results.

## Feature decisions: keep, change, defer

Keep the household view, geographic context and distribution lenses. They show why linked microdata differ from a table of totals. Do not make clicking a particular building imply a real residential address. Once validated data arrive, the strongest interaction should be selecting a group and understanding its composition, rather than finding decorative houses.

Change the default football experience from an exhaustive fixture picker to a focused question. Do not add scoreline controls unless score-conditioned forecasts exist. Do not reinstate multi-match combinations by summing effects.

Change chart defaults from showing every dimension to answering one question first. Offer detail, tables and exports as the next step. A filter should change a meaningful answer, not just recolour a picture.

Defer a general-purpose policy slider playground. A synthetic population does not itself tell us how a policy changes behaviour. Launch a narrow, validated model with explicit assumptions before presenting it as a policy simulator.

Do not prioritise more landscapes, badges, generic AI chat, accounts, leaderboards or more dashboards ahead of these journeys. Saved work may justify accounts later; the simple consumer scenario already works as a link.

## Feature opportunities, including new modelling

### 1. Population: build a study cohort — first priority after an approved release

**Question:** “Which households contain an older person living alone, and how does this group differ from other households?”

**Experience:** choose a population unit (people or households), define a cohort, see its size and coverage, then compare age, household composition and other available variables with a clearly named reference group. Allow moving between a distribution and a synthetic household example without losing the cohort. Export the aggregate table and a reproducible definition with release and source information.

**Needs:** a versioned national release, correct household-person links, variable dictionary, any applicable weights, geographic coverage and validation. Report the synthetic dataset's properties distinctly from validation against observed statistics. Define minimum supported geography and unavailable combinations. Do not present ordinary sampling confidence intervals as a catch-all measure of synthesis error.

**Why it matters:** this is the bridge from a beautiful map to an academic tool and a public explainer. Counts alone are not the main differentiation; linked characteristics are.

### 2. Population: who would a proposed rule reach? — first narrow microsimulation

**Question:** “If eligibility used these age and household criteria, how many households would qualify, and where?”

**Experience:** a small rule builder, before/after eligible cohorts, annual cost under an explicit benefit amount, and a breakdown of which households are included or excluded. Show a synthetic example at the boundary of the rule.

**Needs:** the actual eligibility variables, treatment of missing values, household definitions, population scaling, a deterministic rule engine, test cases and an approved baseline. Income-tested benefits require credible income variables and their joint distributions; do not substitute invented incomes. Initially model mechanical eligibility and cost, with no implied take-up or behaviour change.

**Priority:** high if a concrete policy partner or research question supplies a defensible use case. Prefer one validated rule over twenty decorative sliders.

### 3. Population: accessibility and service demand — partnership project

**Question:** “How many older residents are likely to be far from primary care?” or “Where might school-age demand exceed capacity?”

**Experience:** catchment map, affected cohort, travel-time thresholds and comparison of alternative service locations. A rural/urban difference becomes analytical, not scenery.

**Needs:** service locations and capacity, transport network/travel-time data, appropriate spatial allocation, demographic validation and uncertainty propagation. Parish-level totals do not justify household-level location precision. Distinguish potential need from actual service use; healthcare utilisation and school enrolment require additional models.

**Priority:** promising distinctive Portuguese public-interest use, but geographically and methodologically demanding. Prototype one municipality with a domain partner.

### 4. Population: baseline versus policy distribution — longer-term core

**Question:** “Who gains, who loses, and by how much under this tax or benefit change?”

**Experience:** distribution of changes, household examples, totals and editable assumptions. Readers can inspect both an average and its unequal effects.

**Needs:** income and fiscal variables, validated tax-benefit rules for a specified year, correct benefit units, uprating and take-up assumptions. Static first-round effects must be separated from labour-supply, prices and other behavioural responses. Those require independent behavioural estimation and validation.

**Priority:** strategically strong; not launchable merely because a national synthetic population exists.

### 5. Football: match stakes before kickoff — near-term improvement

**Question:** “What is at stake for my club tonight?”

**Experience:** directly compare home win, draw and away win for a chosen objective, with the current forecast alongside all three. Follow a link from a match or club page already focused on that team. After the match, show the new forecast separately from the earlier conditional estimate.

**Needs:** mostly current conditional outputs; consistent match identifiers, dates, freshness and clear baseline alignment. Describe ranges as model sensitivity; investigate whether small differences are simulation noise before highlighting them as important.

**Priority:** high. More understandable and shareable than making visitors discover the relevant outcome by repeatedly pressing buttons.

### 6. Football: a coherent run-in simulator — modelling required

**Question:** “If we win these two matches and our rival draws, what changes?”

**Experience:** a short saved sequence, affected objectives, and the assumptions held for unselected matches. Keep the number of choices constrained to what can be evaluated responsibly.

**Needs:** joint conditioning on match outcomes via an adequate sample of complete seasons or new conditional simulation. Rare conditions may leave too few simulated seasons: show effective support and decline unsupported estimates or rerun. Independently verify probability totals, mutually exclusive events and consistency of every downstream panel.

**Priority:** medium after the single-match journey proves useful. Do not revive the previous additive approximation as a shortcut.

### 7. Football: what changed, and why? — analytical work required

**Question:** “Why did our chance drop even though we won?”

**Experience:** explain the update through own result, rivals, remaining fixtures and any changed strength estimates, with a link to inspect each contribution.

**Needs:** archived model versions and controlled reruns/counterfactual decomposition. Several factors interact, so contributions are not automatically unique. Choose and disclose a decomposition method. A forecast-to-forecast delta is not sufficient evidence for a causal explanation.

**Priority:** high-value return trigger; publish factual movement now and add attribution only when supported.

### 8. Elections: the forecast report card — highest off-season priority

**Question:** “How good was the model, including where it was wrong?”

**Experience:** for a frozen pre-election forecast, show official outcome, error, interval coverage and a simple benchmark. Let visitors inspect candidates/parties and districts. Explain one consequential miss with the information available at the time.

**Needs:** verified official results, archived forecast cutoffs, consistent vote denominators, seats/round definitions and an evaluation pipeline. Calibration needs many forecast events; do not infer it from one correct winner. Probability evaluation needs proper scoring rules and clearly defined outcomes.

**Priority:** high. The new archive guide is navigation support; this report card would provide the substantive reason to visit after an election.

### 9. Elections: how votes become seats — useful but label assumptions

**Question:** “Could similar national vote shares produce different parliamentary majorities?”

**Experience:** a few constrained scenarios showing district allocation, seat thresholds and how uncertainty changes coalition arithmetic. Keep normative coalition preferences out of the model.

**Needs:** tested allocation rules, district magnitudes, vote geography and coherent joint draws. National uniform swing is an assumption, not a discovered local forecast. Tactical voting and coalition behaviour need separate models.

**Priority:** campaign-dependent; useful civic explanation even without a prediction if explicitly presented as an arithmetic demonstration.

### 10. Economy: what changed since the last reading? — next core feature

**Question:** “Does this month's release change the picture for Portugal?”

**Experience:** one dated conclusion, what strengthened/weakened it, the most relevant evidence and what to watch next. Preserve previous readings so the site can explain revisions rather than erase them.

**Needs:** reliable update pipeline, archived data vintages, fixed narrative rules or reviewed analysis, and a clear distinction between official data, synthesis and forecasts. Distinguish revisions from newly observed change.

**Priority:** high once freshness is reliable. This is more distinctive than another standalone chart of GDP.

### 11. Economy: why your inflation feels different — conditional opportunity

**Question:** “How does a different spending mix change the inflation measure?”

**Experience:** change a small number of spending weights; see which categories contribute and compare with the published basket. Frame it as a basket scenario, not a personal cost-of-living diagnosis.

**Needs:** compatible official category price indices and weights, reference periods, a transparent aggregation rule and validation against the official basket. Real household welfare also depends on income, substitution, housing and other factors this exercise would not capture.

**Priority:** medium; relevant entry from news, but only worth building if category coverage and maintenance are reliable.

## How to decide whether these features are wanted

First test complete tasks with prospective users. Ask football followers to find what a forthcoming match means for their club; ask researchers to establish whether a release fits an actual study; ask non-specialists to explain a dated finding back in their own words. Watch where they stop and what they would actually share or use outside the website.

Success is not the number of filters opened or seconds spent animating the map. Look for an answer understood, a scenario revisited, a cohort definition reused, or a researcher reaching a clear suitability decision. A correct “not suitable for my study” is also a successful research journey.

After publication, measure entry pages, completed meaningful actions and return visits using the site's existing privacy rules. Do not capture free-text research questions, personal profiles or arbitrary URL parameters. No new analytics transmission was added in this pass. Set quantitative targets after establishing a baseline rather than inventing conversion promises.

## Delivery and limits

The implemented journeys are a concrete improvement, not proof of product-market fit. Population remains fictional, economic live readings remain paused, and election retrospectives still lack a calculated report card. Those limitations require data/model work; copy and illustrations cannot finish them.

Verification: TypeScript checks passed; 268 tests across 22 files passed, including four new checks of conditional selection and match ranking. Browser work exercised the homepage research route, guided atlas answer, mobile football team/objective selection, single-choice replacement, clearing and reload preservation, the economic answer anchor, the archive-to-forecast link and the English research page. Local only; not deployed.
