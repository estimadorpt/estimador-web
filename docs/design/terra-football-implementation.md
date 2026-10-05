# Football implementation notes

15 September 2026

The league simulator now starts with a club and objective, then keeps the answer for that club visible while each fixture shows the published home-win, draw and away-win conditional probabilities. It accepts only one selected outcome at a time; this avoids presenting an unsupported combination of independent match effects.

The state in a shared link includes a forecast version, team, objective and one selected outcome. A link from a different forecast version resets the choice and tells the visitor why. Old multi-pick parameters are discarded when the current state is written. Fixture rows now link to their match preview and club names link to their team page. Full league-wide detail is available behind disclosures after the focused answer.

The league and simulator pages own their keyboard skip targets. This work uses the current conditional forecasts only. It does not add scoreline choices, joint multi-match scenarios, or an after-match forecast update.

Verification: `npm test -- --run src/lib/football-exploration.test.ts` passed (6 tests), `npm run typecheck` passed, and `git diff --check` passed for the football files. A local desktop and 390 × 844 mobile check confirmed team/objective switching, all three outcome values, one-choice replacement and clearing, shared-link reload, and fixture/team navigation. The viewport was restored afterwards.
