# User-journey reset

This is a product review of the current routes, not evidence from analytics or user research.

## Population: research suitability and demonstration

The research route answers the primary research question honestly: the current fictional atlas cannot support findings about Portugal. Its appropriate task is to establish that limit, then either discuss a future use case or return to the demonstration. Keep both paths visible. Do not assume public exploration is less important; it serves a different question and must remain labelled fictional.

**Rejected assumption:** a synthetic-population interface alone supports policy estimates. No policy or research result is implied without a validated release and a model for the question.

## Economy: explain a headline

The paused homepage link reaches `/economia#compreender`, whose default topic directly answers whether slower inflation means prices are falling. That is a complete explanatory journey using current content, so no new inflation claim or separate dashboard was added. When the feed is live, the homepage continues to lead to the dated reading and its evidence.

**Rejected assumption:** live figures should be added to make the explanation feel current. The paused state remains explicit; the explanation does not need invented or stale numbers.

## Elections: inspect an archived forecast

The archive now presents forecast choice immediately after its context. The reading guide follows the selection task, covering date/round, the difference between vote estimates and winning probability, and cautious interpretation. It continues to state that no official-result comparison or calculated model score is supplied.

**Rejected assumption:** an archive can answer how good the forecast was. That needs verified official outcomes and an evaluation pipeline; navigation and copy cannot supply it.

## Responsive election entry

The support card keeps archive choices intact. On phones it begins with the task heading instead of a decorative scene; from tablet width the scene sits as a compact header companion, leaving the forecast rows and their actions readable.

## Checks requested for the final browser pass

- Homepage: select each election archive from the support card at phone, tablet and narrow desktop widths.
- Economy: open the paused homepage action and confirm it lands on the inflation explanation.
- Archive: confirm a forecast can be selected before scrolling through the interpretation guide.
- Population: confirm both research-suitability and fictional-demo routes remain visible and correctly labelled.

## Verification status

The direct browser retry succeeded on 16 September. The earlier usage rejection did not establish that browser access remained unavailable; root performed the pending verification after Terra reached its agent limit.

Captured and visually inspected Portuguese homepage layouts at 320, 375, 430, 768, 900, 1024, 1100, 1280 and 1500px, plus English phone/tablet/desktop captures. Evidence: `output/playwright/homepage-final/`. Document width matched viewport width at every checked size, and both shared desktop rows have equal bottom edges.

The screenshots exposed problems missed by code checks: an oversized economy image below 1100px, truncated election names, unnecessary phone illustration space, and a club shortcut that bypassed selection. These were corrected and screenshots repeated. Phone artwork now accompanies the heading; tablet artwork is bounded alongside the text. Economy uses a compact header illustration; election names wrap and English labels are translated.

Clicked Arouca and Benfica from the selector to their actual club forecasts, including English Benfica. The phone club shortcut brings its selector beneath the sticky header (measured top 116px). Opened both population destinations and checked their distinct demo/research content; the economy action opened the inflation explanation; the archive offered forecast choice before its guide. Presidential/parliamentary homepage links were followed at phone, tablet and narrow desktop widths.

Validation: typecheck, targeted lint and diff check pass; all 273 tests across 24 files pass. Browser verification covers these entry journeys and responsive homepage states, not every downstream interaction or a real-user usability study. Audience priorities remain hypotheses rather than measured demand.
