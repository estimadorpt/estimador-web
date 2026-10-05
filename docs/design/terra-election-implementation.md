# Election archive implementation

## What changed

- The presidential trajectory now starts with one selected candidate. It shows that candidate's mean, the published P25–P75 and P5–P95 bands, latest estimate, and matching poll dots. The other leading candidates remain as faint mean lines for context.
- Interval language now reflects the available quantiles: 50% for P25–P75 and 90% for P5–P95. The detailed trajectory table is candidate-specific and begins with the latest date.
- Election dates and percentages follow the selected Portuguese or English locale. Candidate names no longer truncate in the first-round summary, and status labels are translated.
- The presidential and parliamentary archives have compact task navigation, dated archive context, sticky-header-safe anchors, and their own main landmark. The archive and district pages also expose the shared skip-link target.

## Verification

- `npm run typecheck` passed.
- `npm test -- src/lib/election-display.test.ts` passed.
- Browser checks covered Portuguese and English first-round archives, candidate switching, the latest-first table, a 390px trajectory view, and switching to the Portuguese second-round archive. The temporary mobile viewport was reset afterwards.
