# Population v1.0.0 — feedback for estimador-microsynthesis (2026-10-05)

Found while integrating the doc 206 handoff into the website. None of these blocked
publication; each lists what the website does today and what would let it stop.
Evidence scripts from the integration are summarised inline.

## Contract and bundle

1. **Suppressed cells are recoverable by subtraction.** In 3,298 groups exactly one cell is
   suppressed and the others are published at full precision, so `1 − Σ` gives the hidden
   share exactly (shares in a fully published group sum to 1 ± 1e-16). Largest families:
   household type 1,453, who-lives-alone rows 1,064, education 316. *Web:* never draws a
   remainder or a part-to-whole picture when a response has a suppressed cell. *Fix
   upstream:* complementary suppression, or publish rounded shares. The full bundle is in the
   public package, so the web cannot close this alone.
2. **Absent categories are distinguishable from suppressed ones.** A zero-count category is
   simply missing from `cells` (e.g. `hh_type_top=4` absent in 801 parishes), while 1–9 is
   "Suprimido". *Web:* shows absent as "—" ("sem valor publicado"). Decide whether that
   distinction is intended.
3. **Fallback geographies have `name: null`** (all 11,277). *Web:* joins município names from
   the CAOP 2021 atlas list.
4. **`resolved_tier` is the constant "B" on every fallback.** It reads as a measured grade of
   the município. *Web:* shows "Concelho de X" instead of a tier on fallback cards. Please
   confirm what it means or measure it.
5. **`joint_not_publication_grade` is used for one-way distributions** (age, education…), and
   its gloss says "cruzamento". **`use_municipio_or_wait_for_v1_1`** offers a municipal result
   that v1.0.0 does not ship for the only refused template (who lives alone, tier A only).
   *Web:* rewords both (codes unchanged), see `REASON_COPY` in `src/lib/population/labels.ts`.
6. **`display_value` uses a dot decimal** ("17.2%") while `display.locale` is `pt-PT`. *Web:*
   swaps the decimal mark on the producer's string rather than re-rounding the float.
7. **`age_5y` coordinates are label strings and sort lexicographically**; no EN labels.
   **`hh_type_top = "<NA>"`** (institutional containers, 2,462 responses) has no label.
   *Web:* own label tables (`VALUES`).
8. **Portrait card titles drop their filters** ("Vive sozinho" is people aged 65+ who live
   alone). *Web:* writes each question with its population.
9. **Household size and type count institutional containers** (no `is_institutional`
   filter), and **living alone counts care-home residents as living with others.** *Web:*
   says so under each card. Consider filtering to private households.
10. **Story, scorecard and tabulator are bound to one response** (national age). A national
    or per-district set of the portrait templates would let the site say more without
    recomputing anything.

## Freguesia Misteriosa deck

11. **Similarity is driven by missing data.** `_similarity` treats a missing feature as share
    0 before standardising; B-tier candidates lack the who-lives-alone features, so 99.4% of
    each candidate's five nearest neighbours share its tier. *Web:* does not use the deck's
    similarity or `similar`; feedback is distance and direction only.
12. **No date anchor** for `curation.schedule` day 0. *Web:* epoch = publication date
    (2026-10-05), so day 0 is 150912 as curated.

## Release package

13. **`nuts2` is district-based, not NUTS** (doc 204h): 417 parishes, 10.8% of residents,
    mislabelled. Not in ERRATA.md. *Web:* never uses the column.
14. **Município names** come from CAOP 2024.1 in the package ("Vila da Praia da Vitória",
    two "Calheta"s); the website keeps the CAOP 2021 names that tell them apart.
15. **The model card's relative links point into the private repository.** The public copy
    in github.com/estimadorpt/pt-synthpop rewrites them and fills the publication date
    (2026-10-05); the source copy still says "[publication date pending]".
16. **`CITATION.cff` has no URL, DOI or date.** The public repository carries a completed
    copy; the in-package file is unchanged (it is checksummed). Zenodo's GitHub integration
    can mint a DOI from the v1.0.0 release.
