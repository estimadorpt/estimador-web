# Live graphic assessment — 11 September 2026

Assessed https://estimador.pt directly, after deployment. Viewed Home, Liga, Economy, Articles and the population atlas at desktop width, plus Home, Liga and the atlas at 390px. This is visual judgement, not an accessibility certification or a full interaction audit. No implementation changed.

## Overall judgement

The identity is coherent and worth keeping. Paper, pine, Manrope and the interval mark are recognisable together. The site feels warm and credible. Its remaining weakness is composition: large decorative introductions, faint supporting information and uneven visual emphasis make it feel less purposeful than the underlying product.

## Keep

- The offset interval logo, including whiskers. The desktop signature looks balanced.
- Paper and cream surfaces, deep green text, restrained pastels.
- Bold, direct headings and large headline probabilities.
- Club colours as small identifying accents rather than whole coloured cards.
- The miniature landscape as the site's most distinctive illustration.

## Priorities

1. **Make the mobile atlas map the main subject.** The overlap fix works, but the first mobile view still devotes substantial height to the toolbar, standalone pause row, breadcrumb and caption before showing a small mainland. The island panel covers part of the map. Collapse the introductory furniture, give mainland Portugal most of the map viewport, and move island shortcuts into a compact dock or disclosure. This is the largest visual weakness in the checked pages.

2. **Use less repeated hero decoration.** Liga, Economy and Articles repeat the same large quarter-circle/block/circle arrangement. This builds consistency but makes different sections look templated. Keep large artwork for the homepage and explainers; make product headers shallower, with a small section-specific motif or a simple colour field. On mobile Liga, the useful probabilities arrive only after a tall introduction and two stacked actions.

3. **Strengthen the second level of information.** Main headings and numbers are strong, but sources, dates, chart intervals, small navigation labels and secondary links are often so pale that they appear inactive. Keep quiet borders; darken supporting text and enlarge important chart labels. Pastel surfaces do not require pastel text. Contrast compliance was not numerically audited here.

4. **Give the homepage a stronger second act.** The illustration creates interest, followed by much quieter rows. The live Economy section is paused and Articles has no published pieces, so the visitor sees limited evidence of an active publication. Lead below the hero with one real, dated football finding and a clear route into it. Present unavailable sections compactly and honestly. Avoid manufacturing activity or presenting old numbers as current.

5. **Bring the illustration closer on phones.** The entire village is reduced to fit, so people and houses become texture. Use a mobile composition with fewer, larger houses and people, or a deliberate close crop. Place the animation control clearly with the scene. Consider retaining a compact wordmark in the mobile header: the isolated interval currently has very little visual presence.

## Suggested next design pass

Keep the identity. Improve scale and emphasis: shallower dashboard headers, clearer secondary type, a mobile-first atlas frame, a deliberate mobile village crop, and one compelling live story below the homepage hero. More ornament or a new logo would not address the main weaknesses observed.

## Follow-up — implemented 11 September 2026

Each priority was addressed in one design pass and verified on a fresh export at 390px and 1440px.

1. **Mobile atlas.** The world (a 1000 × 620 frame) was letterboxed into the portrait viewport, which is why the mainland was small under empty bands. On phones the frame now slices the world (`preserveAspectRatio` "slice"), with every camera measure, the pointer maths and the detail thresholds scaled by what is visible, so mainland Portugal fills the frame. The toolbar is one row (the profile toggle keeps its label for assistive technology only), the breadcrumb is hidden at the top level, the caption is a title and one line, the island shortcuts are a compact dock in the empty top-right corner, and the journey scale has its own ground.

2. **Hero decoration.** `PageHero` gained a `compact` variant: shallower, smaller title, no art. Liga, Economy (including its paused state) and Articles use it with a colour field only (periwinkle, mint, mustard); the mosaic stays on the homepage village and the brand guide. On phones Liga shows one main action and a text action instead of two stacked buttons.

3. **Second level of information.** The faint step of the retuned stone ramp moved from 2.98:1 to 4.6:1 on paper (`--color-stone-400` #607265), with the 500 and 600 steps darkened to keep the order; the hero meta line is 13px in the 600 step. This changes every source line, date, kicker and secondary link at once.

4. **Homepage second act.** Under the village a dated lead now states the latest matchday's finding in one sentence written by a fixed rule over the published numbers (leader and chance, the two followers, the biggest move since the previous matchday) with the route into the title race and the matchday's fixtures. The paused Economy section is a compact line rather than an empty card.

5. **Village on phones.** The illustration is a deliberate close crop (1.75×, centred on the houses, its captions hidden) in a fixed 330px frame, with the animation control on the scene itself; the same control sits on the scene on wide screens. The phone header shows the compact wordmark instead of the bare mark.
