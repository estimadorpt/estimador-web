# Population v1.0.0 — feedback for estimador-microsynthesis (2026-10-05)

Found while integrating the doc 206 handoff into the website. None of these blocked
publication; each lists what the website does today and what would let it stop.
Evidence scripts from the integration are summarised inline.

## Status at v1.0.3 (2026-10-05, handoff doc 206 §5–§7)

The site serves v1.0.3, which supersedes v1.0.1 and v1.0.2 (v1.0.2 was never served).

- **Moot since v1.0.1** (every parish answers with its own numbers, 0 suppressed, zeros
  shown): 1 (nothing suppressed), 2 (every category present, 0 where empty), 3–5 (no
  fallbacks or refusals remain).
- **Resolved in v1.0.2, carried into v1.0.3:** 6 (pt-PT decimals; `formatDisplay` now sets
  the mark per locale in both directions), 7 (numeric `age_5y` order; `<NA>` gone; the
  producer still ships no EN labels, so `VALUES` stays), 8 (titles name their
  population), 9 (household size, type, who lives alone and elders alone on private
  households; the card copy says so), 11 (deck reads a missing feature as the average),
  14 (package município names from INE 2021; the site keeps CAOP 2021), 16 (in-package
  `CITATION.cff` has url, repository and date; DOI still waits for Zenodo).
- **Resolved in v1.0.3:** 13 (`nuts2` is NUTS-2013, in ERRATA as resolved; the site
  still does not use the column).
- **Settled:** 12 (v1.0.3's deck carries v1.0.1's calendar day for day, so day 0 is
  030857, not the 150912 of item 12; since round 3 day 0 is not the publication date but
  the site's launch day, `POPULATION_GAME_EPOCH` = 2026-10-06 in
  `src/lib/config/population.ts`, which the sync writes into `game/index.json`) and 15
  (public repository copy).
- **Open:** 10 (more national and district templates, v1.1 public layer), and 17–33 below.

## Asks after round 3 (2026-10-06)

Found while fixing the trust pages (`/populacao/qualidade`, `/dados`, `/metodologia`)
against the v1.0.3 package. Each says what the site does meanwhile.

17. **Re-baseline the strata bands on the in-sample ruler, or drop them from
    `scorecard.json`.** The pre-registered ranges (`band_reading`, `band_position`, the
    strata notes, `in_band`, `coverage_in_band`) were set for an out-of-fit check with the
    earlier engine; the errors the scorecard now reports are in-sample, so a band verdict
    would compare two different rulers. *Web:* renders no band verdict at all (MR2-02) and
    keeps `scorecard.json` verbatim.
18. **Errata for three `metadata.json` descriptions.** `industry_section` and
    `occupation_major` say "per-parish INE target", but the model card says both are
    generated and only compared with INE's tables when scoring, not fitted; `freguesia`
    says "6-digit", but eight Barcelos codes contain letters (0302FA to 0302FH);
    `municipio_name` says "CAOP lookup", but the names are INE 2021's (CAOP 2024.1 where INE
    has none). *Web:* rewords the four columns on `/dados` (`DESCRIPTION_OVERRIDES` in
    `src/components/population/data/dictionary.ts`); the downloaded file keeps the text.
19. **`label_maps` for `activity_sector_code`, `education_level_coarse5` and `nuts2`**, and
    reconcile doc 08, which gives sector 3 as CAE O–Q, with the data, where 3 is O–U without
    division 95 (95 is in 4, by a crosstab of `industry_section` in the v1.0.3 microdata).
    *Web:* supplies the three maps itself (`SITE_LABEL_MAPS`, same file) and says so.
20. **Explain the INE-zero-cell mechanism.** About 22,000 people sit in a combination INE
    publishes as zero for their parish (model card, "Rare combinations"); the card's causal
    clause ("so the model has no cell for them") does not say how a person ends up there.
    *Web:* reports the counts and attributes the clause to the model card without restating
    it (`LIMITATIONS` in `src/components/population/quality/copy.ts`).
21. **Say what the integer allocation is exact to, and why 762 parishes differ from
    `census_population`** (the generated total runs from 119 people fewer to 30 more).
    *Web:* quotes the two release columns and the gap (`GENERATED_VS_INE`, same file),
    never a reason.
22. **Re-date v1.0.3, or note the upload in the release text.** GitHub's `published_at` is
    2026-10-06T00:01Z, while `CITATION.cff` and `release.json` say 2026-10-05. *Web:* keeps
    the release's own date and adds GitHub's beside it in the version history on `/dados`
    (`GITHUB_PUBLISHED`).
23. **Reword the positioning sentence** the site quotes verbatim (`HONESTY.positioning`):
    "todas as freguesias de Portugal" should read "as 3 092 freguesias dos Censos 2021
    (CAOP 2021)": the 2025 split gave Portugal more parishes than that (FRESH-11). *Web:*
    keeps the quotation unchanged and words its own coverage lines that way.
24. **Confirm whether `sex_age_single_interior` entered the v10 tilt.** The package calls
    it a tilt-only key, which reads either way: fitted a little, or not at all. *Web:* says
    single-year age is "not one of the 12 fitted person tables / 21 coverage tables", never
    "unfitted" (decision 3 below).

## Asks after round 4 (2026-10-06)

From the round 3 audit of the v1.0.3 site against the v1.0.3 package (the audit's own
reproductions, quoted here for the producer; the site prints none of these counts).

25. **`household_type` responses do not match the packaged microdata.** Rebuilt from the
    SHA256SUMS-verified v1.0.3 parquet, seven recipes reproduce to 1e-9; `household_type`
    differs from the private-household `hh_type_top` in 844 parishes, and the displayed value
    in 729 (1,332 cells, up to 2.22 pp; e.g. 040219 «Sem núcleo» 34,2% in the bundle against
    33,3% in the parquet). Inside the parquet `hh_type_top` equals `n_nuclei` and the count of
    distinct non-'0' `nucleus_id`, so the column is right and the bundle answer was built from
    a pre-packaging nucleus count. ERRATA.md says nothing. **Ask:** an ERRATA entry, then
    rebuild the `household_type` responses from the packaged `hh_type_top` in a v1.0.4 that
    keeps the deck calendar (or document which count the bundle used). *Web:* does not
    recompute the card and prints no count of its own; it says, on the #familias card (a
    caveat note), in the game clue's source line, in the methodology's `hh_type_top` row and
    in the `/dados` dictionary row: «Esta resposta foi calculada antes do empacotamento final
    dos microdados e pode diferir ligeiramente do que se obtém deles; o produtor vai
    corrigi-la.» (`RECIPE_CAVEAT` in `src/lib/population/labels.ts`, `SITE_NOTES` in
    `src/components/population/data/dictionary.ts`). Remove both when v1.0.4 ships.
26. **Define "structural violations" in the model card.** The gate is listed ("structural
    violations 0") but never defined, and it sits beside ~22,000 people in INE-zero cells.
    *Web:* glosses it on `/populacao/qualidade#glossario` from `release_gates.py`
    (`GATED_STRUCTURAL_CHECKS` + `GATED_RELATIONAL_CHECKS`: impossible records such as an
    employed child under 15, a degree before 18, an age below 0 or above 115, a person
    without a household, a household-size mismatch), and says the INE-zero cells are not
    counted. Confirm or correct that reading; and explain how a masked cell still ends up
    filled (ask 20), which methodology step 2 now admits ("a máscara restringe os candidatos,
    mas o resultado pode ainda deixar algumas pessoas nessas combinações").
27. **`metadata.json` `hh_tenure_code`: "0.16% of private households" is 0.18% in the
    microdata** (7,287 null among 4,149,096 private households). *Web:* the revised dictionary
    row drops the figure ("a small share of private households").
28. **State how collective-quarters residents are filled.** The persons parquet has, for all
    146,008 `is_institutional = 1` rows: education, employment status, nationality, union and
    (with the usual age rules) marital status, religion and income source filled; `nucleus_id`
    and the seven work columns (`sitprof_code`, `activity_sector_code`, `occupation_major`,
    `occupation_code`, `industry_section`, `work_location_type`, `transport_mode`) null.
    `metadata.json` says only "education hot-decked". **Ask:** say in the model card how each
    filled attribute is assigned (employment included), and that `nucleus_id` is null for
    them. *Web:* says one thing everywhere (`INSTITUTIONAL_RECORDS` in
    `src/components/population/quality/copy.ts`, the `is_institutional` and `nucleus_id`
    dictionary rows, methodology step 4), and the education and employment cards' source line
    says these residents carry values assigned after the fit.
29. **Should the tiers leave out single-year age?** 726 of the 728 tier C parishes of 500+
    residents are C because their worst table passes 0.26, and in 705 of them that table is
    single-year age, which no answer uses and which is not one of the 12 fitted person tables
    (see ask 24). *Web:* keeps the tiers as published and says the tier C caution applies
    mostly to anyone using single-year age from the microdata.
30. **Confirm the wording for the integer allocation under 500 people.** The site said
    "uma seleção exata"; 28 parishes under 500 still miss INE's total, and the model card says
    the exact selection "stopped at its guard" in 050225. *Web:* now says "resolvida até ao
    ótimo (uma seleção exata, sem aproximação), o que ainda assim não garante o total do INE"
    (ties into ask 21).
31. **Keep permalinks across releases.** `query_id` hashes the query including
    `release_version`, so every release changes every id and every 1.0.0 or 1.0.1
    `canonical_path` stops resolving on a site that serves 1.0.3. Either keep the id stable
    when a response's query is unchanged, or ship an id map (old id → new id) with each
    release. *Web:* see the round 4 report for PRO3-07.
32. **The model card's non-use "claims based on fields marked unvalidated"** matches no
    published column (the unvalidated class is withheld). *Web:* rewords the bullet to the
    columns that are not fitted per parish (industry, occupation, place of work, means of
    transport, tenure, rooms), which the dictionary marks.
33. **`code_commit` (4bf0819) points at a private repository.** *Web:* labels it as the
    packaging code's commit and says the repository is not public yet. Make it public, or
    name the repository, when that changes.

## Site decisions taken without the producer (round 3 owner calls)

Where the audit left an owner call, the site took the conservative option. Each can be
undone once the producer answers.

1. **PRO2-04:** `/dados` does not show the producer's original column descriptions behind
   a disclosure: they would re-expose the internal references (doc numbers, script paths,
   rulings) that X-02 removed. The downloaded `metadata.json` keeps them (ask 18).
2. **MR2-04:** the quality chart's statistic is named "all-cell" ("todas as células das 12
   tabelas de pessoas") from the model card's own wording, without the producer confirming
   it.
3. **Single-year age** is described as "not one of the 12 fitted person tables / 21
   coverage tables", not "unfitted", because the `sex_age_single_interior` tilt-only key is
   ambiguous (ask 24).
4. **H1:** the band box on `/populacao/qualidade` was removed outright rather than
   reworded (ask 17).

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
