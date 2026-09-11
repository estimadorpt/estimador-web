**estimador.pt — website and synthetic population launch review**

Reviewed 7 September 2026. Website: `main` at `d009734`. Unpublished population work: `feature/populacao-launch` at `3fd675d`. Population decisions: the sibling project's `docs/STATE.md`, dated 7 September, and its current public query contract.

**Verdict: the website has a useful editorial foundation, but the population experience is not ready to launch.** There is substantial working population software to recover. The remaining work includes publication safeguards, correct citations, truthful release descriptions, and hosting fixes—not just adding the national dataset.

This was a review, not a release or implementation task. No application source was changed, no branch was merged or pushed, and no population job was interrupted. Existing changes to `scripts/update-and-deploy.sh` and the sibling project's `scripts/quality/quality_pmse.py` were preserved. The population branch was inspected and built in an isolated checkout at `/tmp/estimador-population-review-20260907`.

**Scope and finishing criteria**

The review was considered complete when it had: distinguished the live site from unpublished work; checked the current population release requirements; built and tested both website states; inspected desktop and mobile pages; reproduced consequential failures; and produced an ordered launch checklist with evidence. All of those review criteria were met. The launch checklist below remains work to implement.

| Area | Assessment |
|---|---|
| Visual foundation | Worth retaining: restrained colors, readable numbers, consistent editorial hierarchy |
| Live site reliability | Main pages load, but some public links and assets fail on the actual host |
| Population implementation | Substantial prototype exists on an unmerged branch |
| Publication safeguards | Launch blocker: public rules exist but are not connected to the interactive answers |
| Release messaging | Launch blocker: old method, old measurements, and incomplete release assumptions |
| Discoverability and sharing | Needs repair before publicity brings new visitors |
| National release readiness | Publication remains deferred in the population project's recorded decisions |

**What is already good**

The existing site is recognizable and generally coherent. Its typography, neutral backgrounds, and use of color for meaning suit a research publication. Football is current: the checked feed and visible page were updated on 6 September. The main Portuguese and English pages load; mobile navigation and switching from Portuguese economics to English economics worked. The football service's health endpoint reported configured storage, 34 matchdays, and matchday 6 open.

The unpublished population branch contains a landing page, quality display, methodology, table explorer, household explorer, parish portrait pages, a mystery game, sharing utilities, and tests. The household explorer successfully answered the default example with 523 households in Aguada de Cima and displayed its municipality and district context. The game and portrait pages honestly showed waiting states without national assets. The branch's public-contract parser accepted the population repository's current three-response fixture bundle.

The population project already supplies much of the policy foundation: an approved query catalogue, explicit publication/fallback/refusal decisions, small-cell rules, field provenance, release packaging, and independent verification. The website should consume those decisions consistently.

**Findings, in priority order**

**1. Launch blocker — the population work exists outside the website that is published.**

The live `/pt/populacao/` returns 404. Main has no population routes, data loader, or navigation entry. The missing implementation is on `feature/populacao-launch`, last committed on 9 August. It is 49 main-only commits and six branch-only commits away from main. A merge simulation found nine conflicting files, including dependencies, football, data synchronization, sitemap, and test configuration. The branch also contains unrelated economics changes.

The branch builds, but reports missing 2026–27 football data and renders fallbacks. Deploying it wholesale would discard newer website work and would not constitute a safe population launch.

Action: recover the population components and useful shared fixes onto current main through a deliberate integration change. Preserve today's football, economics, authentication, and tests. Do this while the national population is being completed.

Evidence: [merge assessment](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/merge-assessment.txt), [branch build log](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/branch-build.log), [current sections](/Users/bernardocaldas/code/estimador-web/src/lib/config/sections.ts:15).

**2. Launch blocker — the explorer and household tool bypass the publication contract.**

The branch has a bundle validator and `loadPopulacaoPublicBundle`, but there are no application callers of that loader. The landing page reads a separate scorecard; the table and household explorers read an older manifest and calculate answers directly from population files. They do not consult the approved query catalogue or its query-specific quality decisions. Restricting column names is useful, but it does not establish whether a particular combination is publishable.

This means a valid-looking table can be returned for a question the population producer would refuse. The household tool chooses its own fallback ladder, including district results, instead of consuming a declared resolution. An individual field being available does not validate every relationship between fields.

Action: require the same validated, release-pinned response for every public number. For launch, approved precomputed answers are the smallest dependable approach. Any later browser query engine must produce and validate equivalent responses. A missing or invalid release bundle must prevent release-mode publication, rather than quietly leaving another feed active.

Evidence: [unconnected loader](/tmp/estimador-population-review-20260907/src/lib/utils/data-loader.ts:134), [table execution](/tmp/estimador-population-review-20260907/src/components/demographics/tabulator/TabulatorExplorer.tsx:72), [household execution](/tmp/estimador-population-review-20260907/src/components/demographics/casas/CasasExplorer.tsx:142), [public contract](/Users/bernardocaldas/code/estimador-microsynthesis/docs/public/public_query_contract.md).

**3. Launch blocker — small-cell suppression is defeated by totals.**

Reproduced in the branch's working household-size table. The “5 ou mais” row displays 49, 2,517, 1,510, and a hidden cell, with a total of 4,079. Subtraction recovers the hidden value: **4,079 − 49 − 2,517 − 1,510 = 3**. The column total also displays 3 directly. The precomputed featured file contains other recoverable suppressed values and exposes some zero cells that the browser suppresses.

The browser blanks individual cells after calculating totals; the table and CSV keep those totals. This is a demonstrated failure of the promised publication rule, not evidence that anyone has identified a real person.

Action: apply suppression to the entire released table, totals, percentages, downloadable files, and overlapping queries. Add a regression case for this exact subtraction. If downloadable synthetic microdata intentionally permits arbitrary small-cell reconstruction, describe that separate access policy honestly; browser masking cannot make already-downloaded records inaccessible.

Evidence: [total calculation](/tmp/estimador-population-review-20260907/src/lib/populacao/tabulate-engine.ts:396), [rendered totals](/tmp/estimador-population-review-20260907/src/components/demographics/tabulator/ResultTable.tsx:117), [CSV totals](/tmp/estimador-population-review-20260907/src/components/demographics/tabulator/TabulatorExplorer.tsx:234).

**4. Launch blocker — saved table links do not preserve the answer.**

The old link format contains the interface schema version but no data-release version. It sorts the requested dimensions. A share table with sex in the rows and education in the columns reloads with education in the rows and sex in the columns. Because percentages are calculated within rows, this changes the question being answered. A standalone reproduction confirmed both the swapped order and identical links for these two different share queries.

The new population contract explicitly preserves dimension order and pins the data release in the query identity. It defines `/populacao/v/<release>/q/<id>`; those routes do not exist in the branch. Portrait links also point to an unversioned location, and their social image remains a generic site image.

Action: use the producer's canonical query identity and implement durable release-specific destinations. Keep old release answers available. Test that a shared link still returns the same geography, denominator, numbers, and provenance after a newer release is installed.

Evidence: [old link encoding](/tmp/estimador-population-review-20260907/src/lib/populacao/permalink.ts:17), [reproduction](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/permalink-reproduction.json), [portrait metadata](/tmp/estimador-population-review-20260907/src/app/[locale]/populacao/retrato/[code]/page.tsx:44).

**5. Launch blocker — failed queries can show the previous geography's answer.**

With population-file requests deliberately returning 503 in the local browser, I selected Albergaria-a-Velha. The selected municipality and share URL changed, but the table retained the district's 168,412-person total. The page described it as a precomputed fallback even though no matching saved answer existed. Downloading can then label the old result with the new query's geography.

The cause is specific: when the new query fails and its saved answer is missing, the previous result is never cleared. Blocking the query engine itself also left a loading state without a useful resolution.

Action: couple each displayed result to its completed query identity. Clear results and disable sharing/export when no matching answer exists. Provide bounded loading, retry, and explicit unavailable/refusal states.

Evidence: [failure handling](/tmp/estimador-population-review-20260907/src/components/demographics/tabulator/TabulatorExplorer.tsx:85), [CSV labelling](/tmp/estimador-population-review-20260907/src/components/demographics/tabulator/TabulatorExplorer.tsx:204). Browser evidence is saved with the review artifacts.

**6. Launch blocker — analytics contradict the population privacy promise.**

The custom population event helper removes household answers and geography codes from its own argument. The global analytics client subsequently enriches events with the current URL, including the reversible query in `?q=`. I verified that a constructed population event includes that full query URL. Runtime settings also showed automatic interaction capture enabled, history-based page views, persistent storage, no outgoing-event filter, and session recording not disabled. The local browser made session-recording requests before I blocked further analytics for the remaining checks.

The population usability document explicitly forbids query URLs and selected geography from analytics. Sanitizing only the custom argument does not satisfy that promise. This review does not claim that a particular household field was present in a recorded session; the URL inclusion and enabled collection paths were directly verified.

Action: remove query strings and sensitive path components at the final outgoing-event boundary; disable automatic capture and recording on population experiences unless their collection is specifically reviewed and constrained. Verify the actual outgoing payload, including automatic properties. Add a clear public privacy explanation and distinguish website analytics from the privacy properties of the dataset.

Evidence: [global provider](/Users/bernardocaldas/code/estimador-web/src/app/providers.tsx:9), [custom helper](/tmp/estimador-population-review-20260907/src/lib/populacao/analytics.ts:74), [measurement promises](/Users/bernardocaldas/code/estimador-microsynthesis/docs/launch_readiness_20260714/38_launch_measurement_and_usability.md). PostHog documents these independent controls in its [configuration reference](https://posthog.com/docs/libraries/js/config).

**7. Launch blocker — the launch copy describes an obsolete population.**

The draft methodology describes a VAE and July reference measurements. The landing scorecard displays a 50-parish error of 0.086 and a 0.10 threshold; methodology copy gives other historical reference values. Those are not current national quality claims. The sibling project's current state names the A′/v10 release track and explicitly retires earlier measurements as a basis for today's claims.

The current launch is planned around Censos 2021, the resident population, partial institutional records, and **one model run**. It therefore supplies no measured run-to-run range and permits no directional/ranking claims. Publication remains deferred pending final gates, privacy work, packaging, verification, and Bernardo's decision. I did not independently inspect or change the remote synthesis process.

The old copy also makes an overly absolute “not copies of any respondent” promise. Synthetic generation does not guarantee that no coarse attribute combination matches source data; the current model card explains this more carefully. The launch query manifest in the population repo still names `v7-composition+P1+G1+age-coherence` and `vae_decode`, despite remaining correctly marked draft.

Action: write a single approved release fact sheet and derive all headline, method, quality, source, licence, and download descriptions from it. Replace historical reference numbers with final release measurements only after approval. State “Censos 2021” beside the first substantive number, distinguish publication date from data year, and explain institutional-record limitations at the relevant questions. Use the current model card's qualified positioning; do not promise a publication date based on a synthesis ETA.

Evidence: [current state](/Users/bernardocaldas/code/estimador-microsynthesis/docs/STATE.md), [current model card](/Users/bernardocaldas/code/estimador-microsynthesis/docs/public/model_card.md), [stale website methodology](/tmp/estimador-population-review-20260907/src/content/populacao-methodology/pt.mdx:25), [draft query metadata](/Users/bernardocaldas/code/estimador-microsynthesis/config/public/launch_queries.json:7).

**8. Fix before publicity — the live host blocks valid content and assets.**

Direct requests returned 404 for `/logo.svg`, `/logo-light.svg`, `/favicon.svg`, `/favicon-32x32.png`, `/robots.txt`, `/sitemap.xml`, and a generated Portuguese article at `/pt/artigos/como-ler-sondagens/`. These files/pages exist in the local export. The versioned social image was reachable. Main's hosting configuration ends with a catch-all 404 after listing selected routes, without allowing these paths.

The population branch adds rules for only some population pages. It lacks the household, game, portrait, and query-version destinations and the browser database asset path. A plain local static server does not reproduce those host restrictions; a successful local preview is insufficient.

Action: repair the host routing and check real deployed URLs for every page, article, logo, icon, search file, database worker, and database binary. Add an automated deployed-site smoke check. Keep genuinely unknown URLs returning 404.

Evidence: [HTTP results](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/live-http.json), [catch-all rule](/Users/bernardocaldas/code/estimador-web/staticwebapp.config.json:260).

**9. Fix before publicity — old economics numbers are presented as current.**

The live economics page says “where the economy is now” but was updated on **11 June, 88 days before this review**. It discusses a mid-quarter estimate for Q2. The homepage prominently repeats its health score, activity, and recession numbers without a date. The date on the detailed page helps, but it does not resolve the contradictory claim of currentness.

Action: restore and verify the update process, or label the section as an archived reading and remove undated “now” claims. Add an explicit expired-data state on the homepage and detailed page. The population launch needs a different treatment: a newly published 2021 reconstruction should be labelled by both release date and census vintage, not passed off as a current population estimate.

Evidence: [economics page](/Users/bernardocaldas/code/estimador-web/src/app/[locale]/economia/page.tsx:71), [homepage figures](/Users/bernardocaldas/code/estimador-web/src/app/[locale]/page.tsx:142), live mobile screenshot.

**10. Fix before publicity — the homepage does not communicate the broader project.**

The first screen repeats the brand name and mentions football and elections. Its bottom description still says the site's mission is electoral forecasts. About omits economics and population; the general methodology page is electoral. The population draft opens with a novelty claim and five equally weighted links, followed by specialist quality scores. That explains the project to an insider before showing a useful answer to a new visitor.

Action: keep the visual identity and change the editorial hierarchy. Lead the launch with “Explore Portugal's households and communities through a synthetic reconstruction of Censos 2021,” a short generated-not-real explanation, and one clear action to explore a place. Offer the game as a second entry. Put methodology and quality next to the answers, with detail available progressively. Add an obvious route for researchers to the release files, dictionary, citation, licence, and limitations. Update the shared footer, About, and methodology index to reflect all active domains.

This is a product recommendation, not a measured conversion claim. The five-session usability protocol already written in the population project is a suitable way to validate it after updating its one-run assumptions.

**11. Fix before publicity — search metadata and shared previews are incomplete.**

A scan of 180 localized exported pages found **110 without an Open Graph image and all 180 without language-alternate links**. The shared layout defines them, but page-specific metadata replaces the relevant blocks. The live homepage, economics, football, and articles pages lack Open Graph images; Twitter metadata on the checked section pages still describes the generic site. The sitemap omits economics, article detail pages, team pages, and the simulator. All four Portuguese article pages link their language switcher to nonexistent English articles.

Action: generate metadata from a shared helper that preserves images and produces the correct language counterparts for the same page. Build the sitemap from the actual published routes. Do not offer an English article destination until it exists; present a clear Portuguese fallback instead. Generate population social cards at build time from approved facts so social crawlers can fetch them without running the interactive application.

Evidence: [export audit](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/static-audit.json), [shared metadata](/Users/bernardocaldas/code/estimador-web/src/app/[locale]/layout.tsx:70), [sitemap](/Users/bernardocaldas/code/estimador-web/src/app/sitemap.ts:17).

**12. Fix before publicity — desktop dropdown navigation does not work from the keyboard.**

On the live English economics page, focusing “Sports” and pressing Enter opened no dropdown. Hovering immediately opened it. The source relies on mouse enter/leave without click or keyboard activation. The desktop navigation also lacks expanded-state information; the mobile menu's English accessible label appears on Portuguese pages.

Action: make dropdowns work with click, Enter, Space, and Escape, expose their state to assistive technology, and verify visible focus. Add a skip-to-content link, meaningful home-link labels, and translated control labels. On mobile, the checked economics, football, and household pages fitted a 390px viewport without page-level horizontal overflow; this was a manual check, not a comprehensive accessibility certification.

Evidence: [navigation handlers](/Users/bernardocaldas/code/estimador-web/src/components/Header.tsx:105).

**13. Fix before launch integration — successful builds currently bypass broken checks.**

Main builds 188 static pages and passes 156 unit tests. The API also compiles. However, standalone TypeScript checking stops at four parsing errors because `src/i18n/routing.ts` contains JSX alongside a duplicated `.tsx` file. Focused source lint reports 41 errors and 89 warnings. The unrestricted lint command reports much more noise because generated output is included. Both type validation and lint are explicitly skipped by the production build, and the deployment workflow does not run tests.

The isolated population branch passes its 68 tests, standalone TypeScript, and source lint with zero errors and 54 warnings. Those results are useful, but they neither cover the demonstrated publication failures nor include today's broader test suite.

Action: retain both suites, fix the duplicate routing file, exclude generated output, and make meaningful checks mandatory before deployment. Add tests for publication refusal, suppressed-total reconstruction, query identity, stale-result clearing, analytics payloads, and actual host routes. Consolidate the duplicate Next configuration files. Validate required launch data before a build can succeed as a public release.

Evidence: [main tests](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/tests.log), [type errors](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/types.log), [source lint](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/source-lint.json), [skipped checks](/Users/bernardocaldas/code/estimador-web/next.config.js:29), [deployment workflow](/Users/bernardocaldas/code/estimador-web/.github/workflows/azure-static-web-apps.yml:25).

**14. Maintenance priority — patch dependencies and prove national-scale browser performance.**

The production-dependency audit reports nine affected packages: one critical, four high, and four moderate. Next.js is pinned to 15.5.0; the audit offered a newer patch in the same release line. This is not proof of a remotely exploitable live site: the deployed website is a static export, which changes the relevance of server-side advisories, and the MDX is repository-controlled. The build workflow selects Node 18 and the API configuration selects Node 20; both are now outside normal support according to the [Node release schedule](https://nodejs.org/en/about/previous-releases). Upgrade within the hosting platform's supported runtime choices and recheck the affected paths. The [Next.js advisory](https://nextjs.org/blog/CVE-2025-66478) explains the server-side issue.

The browser query engine loads a roughly 35MB binary, an additional remote Parquet extension, and complete requested population-file buffers. It creates cached database instances for different district combinations without a disposal policy. This works for the 1.2MB Aveiro sample, but national mobile memory, download size, cold-start time, and repeated geography changes have not been demonstrated. The code's “no CDN/offline” comment is too strong: the browser actually requested `extensions.duckdb.org`.

Separately, current election HTML is unusually large: approximately 3.35MB for the presidential page and 4.93MB for the parliamentary page before transfer compression. These are payload sizes, not measured field-performance scores.

Action: make the first population experience work from compact approved summaries. Load optional heavy exploration only on request, with a download estimate, bounded caching, and a working fallback. Test on an ordinary mobile device and a constrained connection using the final release partitions; measure before choosing a browser-only national query promise.

Evidence: [dependency audit](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07/audit.json), [browser file loading](/tmp/estimador-population-review-20260907/src/lib/populacao/tabulate-engine.ts:129).

**Recommended launch sequence**

1. **Recover and stabilize the website now.** Integrate the population work into current main; repair hosting, stale economics presentation, navigation, search metadata, and required checks. Preserve existing active products.
2. **Build one trustworthy answer path.** Use the approved response bundle for a place search and parish portrait, including municipality fallback, refusal, source year, and clear limitations. Repair suppression, durable links, error handling, and analytics before adding more query freedom.
3. **Align every claim with the final release.** Update the method and release manifest; validate the completed resident population, national quality and privacy evidence, place names, schemas, checksums, provenance, and independent release verification. Bernardo's publication decision follows those checks.
4. **Rehearse the actual launch.** Use an Azure preview with the final artifacts. Open deep links directly, reload and switch languages, share and download, test a small parish and a refused question, simulate missing files, and inspect every outgoing analytics field. Run the five human usability sessions and fix misunderstandings.
5. **Publish the smallest complete public experience.** Landing page, place portraits, quality/methodology, and a reproducible research download should form a coherent release. Include the mystery game when its approved clue deck is verified. Include Casas and free-form tabulation only once they obey the same publication decisions. If those need longer, state the narrower scope explicitly and align the bundle's surface bindings accordingly.

**Release acceptance checklist**

- [ ] Every visible population statistic comes from the approved release and has a known data year, universe, geography, and source classification.
- [ ] One-run releases show no fabricated spread or directional/ranking claim.
- [ ] Direct publication, municipality fallback, refusal, and suppressed results agree with the producer in Portuguese and English.
- [ ] Suppressed values cannot be recovered from exposed totals, proportions, exports, or overlapping approved answers.
- [ ] A saved query preserves row meaning, denominator, and release after refresh, language change, and a subsequent release.
- [ ] Missing data clears the old answer and disables its download/share controls.
- [ ] Actual outgoing analytics contain no encoded household query or selected-place identifier and no unreviewed recording.
- [ ] All production routes and required assets return the right status and content type; unknown pages remain 404.
- [ ] Social previews, icons, sitemap, article links, and language alternates work on the real host.
- [ ] Keyboard navigation and the key mobile journeys pass; national-scale performance has been measured.
- [ ] Required automated checks pass on the integrated website; both current-site and population regressions are covered.
- [ ] The final package passes independent release verification and Bernardo approves publication.

**Verification record and limits**

| Check | Result |
|---|---|
| Current website production build | Passed; 188 generated pages; type/lint validation skipped by existing configuration |
| Current website tests | 156 passed across five files |
| Current API build | Passed |
| Current standalone type check | Failed with four parsing errors |
| Current scoped source lint | 41 errors, 89 warnings |
| Population branch production build | Passed; 96 generated pages; missing-football-data warnings |
| Population branch tests | 68 passed across 12 files |
| Population branch standalone type check | Passed |
| Population branch source lint | Zero errors, 54 warnings |
| Producer fixture accepted by website validator | Passed; all three responses accepted |
| Main export link/metadata scan | 180 localized pages inspected |
| Live HTTP checks | Main sections and game health passed; specified assets, search files, and article failed |
| Browser journeys | Desktop/mobile home, economics, football; PT→EN navigation; keyboard dropdown failure; local map; population table and Casas; game/portrait waiting states |
| Adverse cases | Reproduced recoverable suppression, changed link semantics, stale answers after failed data requests, and analytics URL enrichment |

Evidence logs and screenshots are under [the review artifact directory](/Users/bernardocaldas/code/estimador-web/output/playwright/launch-review-2026-09-07). No claims are made about final national quality, final download size, production analytics history, complete accessibility compliance, or every one of the 180 pages' interactive controls. The full national model was not rerun or independently audited, and authenticated prediction-game writes were not exercised.
