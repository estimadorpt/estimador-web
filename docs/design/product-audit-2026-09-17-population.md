# Population product audit — 17 September 2026

## Purpose and boundary

This is a product audit of the population journey as it exists in the web
application. It is not a proposal to publish a national synthetic population,
add a model, infer statistics from the demonstration, or change the current
data-release decision.

The reviewed route family is:

| Route | Current role |
| --- | --- |
| `/populacao` | The interactive Human Atlas: fictional people over real administrative geography. |
| `/populacao/miniatura` | A standalone imagined-neighbourhood demonstration. |
| `/populacao/dados` | Research availability, limits, and a contact route. |
| `/` | The population invitation and the two initial population choices. |

The most important source constraint is explicit in
`docs/design/portugal-human-atlas.md`: the 1,004 people are fictional,
region-scoped copies selected without regional census inputs. Boundaries are
real CAOP 2021 geography, but totals and differences are not findings. The
audit treats that constraint as a product property, not just a disclaimer.

## What is actually available today

The atlas is more capable than its generic map entrance suggests. It has:

* three seeded questions: older people living alone; Lisboa versus Bragança;
  and a people/distribution view;
* Territory, People, and Compare views;
* district, municipality and parish navigation, with household inspection at
  the close scale;
* profile filters for age, activity, and living alone; lenses for age,
  education, employment, and transport;
* a no-result reset that returns focus to the age control;
* an accessible table describing the currently selected fixture cohort;
* URL state for place, comparison, view, lens, filters, question, household,
  and selected person; and a copy-link action;
* an independent miniature route; and
* a research page that plainly says an approved national download, licence,
  citation reference, and validated Portuguese research findings do not yet
  exist.

This is a credible exploratory prototype. It is not yet a population data
product, a source of local descriptive statistics, a microsimulation service,
or a data catalogue.

## Likely jobs and where the current journey succeeds or fails

### Curious public, classroom, and journalist

Likely questions are: “What might a synthetic population be?”, “How does a
household view change a national picture?”, “What would I inspect before
believing a local comparison?”, and “Can I show this in a lesson?” The atlas
can support the first two through its guided questions, household transition,
and lenses. It cannot responsibly answer “what is my parish like?” because
the apparent local people and differences are illustrative.

The weak point is orientation. “Portugal inteiro. Encontra o teu lugar.”,
territorial navigation, real boundaries, and an immersive map invite a visitor
to find their real place before the product gives them a useful reason to do
so. The scope notice is present, but its implication is not made into a task:
**choose a scenario to learn how the tool works, rather than look up your
area**.

The miniature is potentially better for a first-time human-scale experience:
its imagined-neighbourhood frame is easier to understand. It is currently a
separate destination, so it competes with the atlas without a visible decision
rule. It should remain as a shareable, self-contained short demonstration,
not become a second atlas with overlapping controls.

### Researcher, policy analyst, or student planning research

Likely questions are: “Is there a release I can use?”, “What geography and
variables exist?”, “Can I cite/download it?”, “Can it support policy
microsimulation?”, and “Who should I contact about a future release?” The
research route answers the availability question unusually well: it says yes
to trying the demonstration and no to Portuguese research findings today, then
lists the missing release metadata. That is good product honesty.

It is deliberately a declaration of availability rather than a research
intake, which is appropriate while no release exists. A possible future
improvement is to make the distinction between a future data-release inquiry
and a model/microsimulation question clearer, and to offer the available
demonstration beside the verdict rather than only at the end. That is a
usability hypothesis to test, not evidence that the present route fails.

### Returning visitor

The strongest return mechanism already exists: a URL can preserve a scenario,
place, filter, selected household, and person. The current product does not
make this benefit visible enough. “Partilhar perspetiva” copies a link, but
there is no named scenario, readable answer title, or small record of what a
recipient will see before they enter a cinematic surface. A saved/share link
should read as a revisitable question, such as “Older people living alone —
fictional national example”, not as a collection of opaque state.

## Critical findings

### P0 — The initial promise makes location look like the product

**Evidence.** The atlas heading asks a visitor to find their place. It then
shows real national, municipal, and parish boundaries, and supports place
drilldown. The implementation itself correctly says the people and homes
follow the zoom and are not local estimates.

**Risk.** A visitor may reasonably infer that the values, dots, household, or
district comparison describe the chosen real place. Repeating “fictitious” in
small copy does not undo a task flow whose main verb is geographic lookup.

**Change.** Make scenario selection the first decision. Offer place navigation
inside a selected scenario as an illustration of scale and boundaries. Rename
place-dependent answer areas to “fictional example in [place]”, repeat that
scope directly beside the first quantity/chart/table, and make the real
geography purpose explicit: navigation and scene context, not a local
population estimate.

**Acceptance criteria.** In a five-second read, a participant can state that
the map uses real boundaries but the people are fictional; and can choose a
non-geographic question without opening controls.

### P0 — The product has tasks, but their answers are too map-led

**Evidence.** The three prompt buttons configure real state and focus an
answer. The selected scenario answer appears inside a large dark exploratory
surface. The comparison visual uses 100 dots and bars; the distribution
surface has a table after the world view.

**Risk.** The scene is visually dominant while the conclusion is subordinate.
The reader must infer what to look at, why it matters, and what it cannot
mean. This rewards wandering more than learning.

**Change.** Each seeded question should open an answer-first composition:

1. question and scope statement;
2. a concise answer sentence using only fixture language;
3. one visual that explains the answer;
4. an optional “inspect the people/household” step; and
5. adjustment controls.

The map becomes a contextual view, not the answer container. Preserve the
current interactions behind an “Explore the example” disclosure/drawer.

**Acceptance criteria.** A person who chooses a prompt can identify the
current scope, one pattern in the fixture, and the next useful action without
opening the profile drawer.

### P1 — Charts have a useful teaching role, but not a truth-claim role

**Evidence.** Comparison renders normalized 100-dot proportions and bars.
The accessible table reports counts and percentages. Lenses cover age,
education, activity, and transport.

**Risk.** Numerically precise percentages from a geographically named fixture
can be overread as local evidence. A table is accessible, but it mirrors the
same unsupported local comparison rather than answering a user question.

**Keep.** The table, because it is the most inspectable and assistive-technology
friendly representation of current state. Keep the 100-dot view as a concrete
way to explain proportions.

**Change.** Give every chart one explicit job:

| Chart or representation | Job now | Required label |
| --- | --- | --- |
| 100 dots | Explain a proportion and the effect of a filter | “100 normalized dots from this fictional example” |
| Bars/table | Let a visitor inspect category composition | “Fixture counts, not estimates for [place]” |
| Household view | Show the relationship between people and a household | “Illustrative household; not a real address or local case” |
| Geographic scene | Explain drilldown and scale | “Real boundary, fictional residents” |

Do not add choropleths, local ranking, time trends, uncertainty bands, or
downloadable tabulations until a release makes them defensible. Those need
approved data/model decisions, not a UI enhancement.

### P1 — Profile filters describe a cohort but lack a question grammar

**Evidence.** Age, activity, and living-alone controls work; the result card
reports n / total; no results can be reset. Lens is separate from cohort.

**Risk.** Controls read as a dashboard filter stack. The visitor has to
understand which controls change the people, which only change the grouping,
and why a cohort is meaningful.

**Change.** Present a visible sentence builder: “Show [people aged…] who
[activity] and [live alone]”, with “Group them by [lens]”. Maintain all
current filters and URL semantics. Put the current scope, matching count, and
clear action together immediately below it. The answer should name the cohort
in ordinary language and explain when it is empty.

**Acceptance criteria.** A participant can predict whether changing lens will
change the matched cohort or only the grouping; a zero result has an obvious
one-action recovery.

### P1 — Household navigation is valuable but arrives as an easter egg

**Evidence.** `Conhece um agregado` can choose an illustrative household,
enter local navigation, and retain household/person state in the URL. Parish
homes open an inline inspector.

**Risk.** Visitors who start with a distribution never discover the human
interpretation step. Visitors who click a map building may assume an address
claim.

**Change.** In every answer, use a direct “See one illustrative household”
second step with a sentence explaining it is selected from the fixture. In the
map, label a clicked home as an illustrative scene home before opening its
members. Link back to the originating question.

### P2 — The research page is honest but is a declaration rather than a service

**Evidence.** It names what is and is not available and lists the release
information a researcher should look for. It offers “Discuss a use case” and
“Explore the demonstration”.

**Possible change now, without new model/data.** Use a two-path opening:

* **Use the demonstration** — what it can teach: interaction, question design,
  and how a cohort/household view works; link to a relevant seeded scenario.
* **Assess a future release** — a short checklist for geography, variables,
  reference period, required validation, and intended use. The current simple
  contact route may remain appropriate until there is a defined intake process.

Include a compact, versioned “not available” block at the top: national
release, licence, citation, and validated local/research inference. Do not
imply a delivery date or access path.

### P2 — Share and return need an answer identity

**Evidence.** URL state persistence is technically strong and the copy-link
action reports success. A recipient receives no short explanatory preview
inside the product.

**Change.** Persist a human-readable scenario identifier alongside existing
state; show it in the page title/answer heading and in a “shared view” strip.
If an older URL has state but no scenario, infer none: present it as “Custom
fictional example”, not a fabricated question. Keep a restore notice when the
release ID differs.

## Recommended page architecture

### Homepage population entry

The homepage needs one sentence that makes the two jobs explicit:

* **Explore a fictional population** — leads to three short scenarios;
* **Check whether it is usable for research** — leads to the availability page.

The house illustration is a subject cue, not evidence and not the interface
preview. It should not be used to imply that a future microsimulation exists
now. The research action should not be automatically stronger merely because
it sounds more serious: selection should follow the visitor’s job.

### `/populacao`: scenario landing and answer workspace

1. **Orientation band:** “Fictional people; real geography; interface preview.”
   State what a visitor can do today in two clauses.
2. **Three scenario cards:** existing older/cohort, compare, and people/household
   prompts. Each has one question, a one-line expected learning outcome, and a
   clear fictional-scope label.
3. **Answer workspace:** opening a card creates the answer-first composition
   described above. Custom exploration remains an equal fourth route.
4. **Explore controls:** place, lens, cohort, map/people/compare view, and
   household. The UI should say whether a control changes the example, its
   grouping, or only the scene.
5. **Evidence surface:** table first-class and toggleable; visual beside it;
   scope placed next to both.
6. **Share/return strip:** readable scenario name, scope, copied-link feedback,
   and a link to data availability.
7. **Method footer:** short scope note; expandable technical geography/scenery
   detail; no release promise.

### `/populacao/miniatura`

Make it the short, self-contained “meet one imagined neighbourhood” route.
It should link into the atlas only when a visitor wants wider geographic scale
or comparison. It should not duplicate research eligibility or pretend its 100
people are a smaller Portugal sample.

### `/populacao/dados`

Open with the availability verdict, then offer the two paths above. Keep the
current table of scope and absence; it is the right evidence format for a
researcher. Add a link to a concrete atlas scenario next to the demonstration
path, not only at the end of the page.

## Questions the product should be able to support now

These are interface-learning questions, each clearly labelled as fictional:

1. How does a filter change the group I am looking at?
2. What is gained by moving from a population grouping to a household view?
3. How can the same fictional cohort be grouped by age, education, activity,
   or transport?
4. How do normalized proportions help compare two examples without treating
   raw counts as evidence?
5. What does geographic drilldown show about scale and boundary navigation,
   and what does it explicitly not show about a real parish?
6. What information would I need before I could use a national synthetic
   population in research?

## Questions that need a new approved release or model

Do not advertise these as current outcomes:

* What is the demographic composition of my municipality or parish?
* Which district has more people with a characteristic?
* What policy would change outcomes for Portuguese households?
* Can I download, cite, or reuse a Portuguese national population now?
* Are synthetic households located in real dwellings or representative of a
  selected boundary?

Their future support requires release metadata, coverage, validation,
suppression/fallback rules, licensing, citation, and an approved
microsimulation model appropriate to the question.

## Prioritized delivery plan

### First: make current value legible (no new data/model)

* scenario-first atlas landing and answer-first workspace;
* scope label beside every quantity/chart/table and household action;
* cohort sentence builder and clear distinction between filter and lens;
* named share state and a recipient-facing shared-view strip;
* research-page two-path opening and scenario deep links;
* miniature/atlas decision rule.

### Second: validate usability before adding surfaces

Recruit public/teaching and research participants separately. Ask them to
choose an entry task, tell what the result means, share it, recover from an
empty cohort, find a household, and decide whether the data can support a
Portuguese research claim. Record comprehension and decision confidence, not
only completion time.

### Third: release-gated data product work

Only after approval: data catalogue, version page, dictionary, source and
validation evidence, licensed download/citation, supported geography/filter
matrix, and any national or local tables/charts. Microsimulation needs a
separate question/model contract and should not be inferred from atlas UI.

## Audit evidence and limitations

Reviewed source includes `Atlas.tsx`, `atlas.css`, the population route,
miniature route, research availability route, homepage panel, and
`docs/design/portugal-human-atlas.md`. The audit identifies concrete current
behaviour from the implementation and documents product risks as inferences.

A Playwright audit session was started for desktop/phone visual evidence but
did not return before the command timeout in this run. No claim in this audit
depends on a completed screenshot review. When browser access is available,
capture desktop and 375px screens for: default atlas; each seeded question;
profile drawer; no-result reset; municipality/parish/household; compare;
shared URL reload; miniature; and research route.


## Fresh browser follow-up — 17 September 2026

The root audit subsequently inspected the atlas and research page on desktop and phone, and exercised the older/alone question and its household action. The [combined diagnosis](product-usability-diagnosis-2026-09-17.md) contains the final product priorities.

The question produced **20 of 1,004 fictional people**, with age 65+ and living-alone conditions. The resulting age table showed 20 people at 65+ and zero elsewhere: a correct but largely tautological distribution after that filter. The unfiltered table had 212 older people, so a question about living alone among older people needs that explicitly defined denominator rather than silently treating all 1,004 as the reference. Counts remain demonstration properties, not Portuguese findings.

Clicking “Conhecer um agregado” opened household 19, person #061, age 69, in the illustrated Aguada de Cima scene. It preserved age/alone conditions but changed the analytical region to Aveiro and the answer to **1 of 38**. This confirms a substantive continuity problem: visiting one example changes the original national question. Preserve cohort context independently from the camera and example location, with an explicit action to change analytical geography.

The research availability verdict rendered clearly at both widths. It is a strong existing pattern: the visitor can determine that the demonstration is available but a national release approved for research is not offered on this page. Do not add a data-download promise to resolve that limitation cosmetically.

Evidence: [selected question](../../output/playwright/product-audit-2026-09-17/home/population-question.png), [research page](../../output/playwright/product-audit-2026-09-17/home/populacao-dados-.png).
