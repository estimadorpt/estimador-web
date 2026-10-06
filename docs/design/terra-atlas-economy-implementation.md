# Atlas and economy journey implementation

15 September 2026

## What changed

- The atlas now begins with a guided question and names the current place and profile scope as a fictional demonstration. The selected question is included in the shared URL alongside place, lens and profile filters, so reloads and copied links reproduce the same journey. Guided questions move keyboard focus to the resulting answer.
- The visual now has a visible table companion: exact fictional-person counts and shares by the current lens, plus a statement of the selected place and filters. Comparison mode includes both fictional examples. It does not rely on colour or animation and says explicitly that it is not a description of the real place.
- Atlas filter copy now says that the controls apply to the fictional example, not people in the real place. An empty result offers one clear reset and returns keyboard focus to the age filter.
- The population data route is linked beside the guided atlas questions and gives the release status, present limits and research requirements without implying a national model or available data release.
- Economy explanations now use a URL topic parameter. Each topic can be opened directly, revisited after reload, and copied with its own share control; the address bar is updated before clipboard fallback. The explanation block is shown both while the dashboard is paused and after live dashboard content; the existing availability guard is unchanged.
- Population data and economy routes now provide the page-owned main landmark and keyboard focus target.

## Checks

- `git diff --check`
- `npm run typecheck`
- `npm run lint` — completed with the repository's existing warnings and no errors.
- Browser verification at `127.0.0.1:3044`:
  - The guided atlas question set `question=older` with the selected filters, focused its result heading, and restored the same question after reload.
  - An empty profile showed the reset action; resetting cleared the filters and focused the age control.
  - The mobile comparison URL displayed both fictional places in the companion table. At a 390px viewport the document was 375px wide with no horizontal overflow; the summary and table fit within it.
  - `/pt/economia/?topic=work#compreender` opened Trabalho after reload. Its share control reported a copied question link. At the same phone viewport, the title and share control stacked with no horizontal overflow.
  - `/pt/metodologia` showed all four domain-method links and the election methods content below them. The skip link focused `main-content` after hydration.

## Deliberate limits

- No population release, real estimates, downloads, licence, citation claim or connection to a national model was added.
- No economic figures, forecasts or changes to the stale-data guard were added.
