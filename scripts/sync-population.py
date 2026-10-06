#!/usr/bin/env python3
"""Publish the synthetic population release (estimador-microsynthesis) to the website.

    ~/code/estimador-microsynthesis/.venv/bin/python scripts/sync-population.py
    ./scripts/sync-data.sh population          # same, through the sync entry point

The modelling repository hands over a contract-v1 bundle (107 MB, 24,737 approved
query responses), a scorecard, parish portraits, the Freguesia Misteriosa deck and a
release package (doc 206). None of that can ship as it is: Azure Static Web Apps Free
allows 250 MB and 15,000 files. This script:

1. verifies every input against the SHA-256 the handoff pins;
2. validates the bundle against contract v1, recomputing each query_id from its query;
3. writes compact, self-contained files under public/data/population/v<release>/:
   meta.json, places.json, national.json, parish/<code>.json, game/*, q/<x>.json,
   scorecard.json (verbatim), release.json and manifest.json;
4. rebuilds every one of the 24,737 responses from the files it wrote and deep-compares
   it with the bundle, so the site shows the responses as they are (handoff §3):
   nothing is recomputed, rounded or re-decided here.

Output is deterministic: running it twice on the same release changes no file.
It needs pyarrow (the microsynthesis virtualenv has it) for the anchor-point parquet.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

RELEASE = "1.0.3"
PUBLISHED = "2026-10-05"
CONTRACT = "1.0"

# doc 206 §7 (v1.0.3, supersedes v1.0.1 and v1.0.2; full hashes where the handoff
# gives them, prefixes where it abbreviates).
PINNED = {
    "bundle": "3a55f0a06de2ba26e5eaf615504d7afc4b2955846d4d2cd4b77f4b61a4800589",
    "scorecard": "f1c590aed8b47e7aa8cc94c13e5799869c5db0a4eed48b9650dbb93d073fade1",
    "checksums": "c5a009679c9037e48156b3d89d4ffd6a66f1968098ab7792b0159054a195c36e",
    "portrait_index": "556d71e5",
    "mystery_deck": "fc1e7c8a",
    "responses_index": "72460ec7",
    "bindings": "b239c637",
}
MODEL_SHA256 = "062e2ad784886b7287536233f853db151c57615d2b1a952fb2e12368581e76d3"

PARISH_COUNT = 3092
GAME_CHUNK = 32


def game_epoch() -> str:
    """Day 0 of Freguesia misteriosa: POPULATION_GAME_EPOCH in src/lib/config/population.ts.

    The site's launch day, not the release date, so the public's first game is N.º 1.
    Read from the TypeScript config so the two can never disagree (a vitest checks
    game/index.json against the constant too).
    """
    config = (WEB / "src/lib/config/population.ts").read_text(encoding="utf-8")
    match = re.search(r"export const POPULATION_GAME_EPOCH = '(\d{4}-\d{2}-\d{2})';", config)
    if not match:
        raise SystemExit("POPULATION_GAME_EPOCH not found in src/lib/config/population.ts")
    return match.group(1)

WEB = Path(__file__).resolve().parent.parent


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def query_id(query: dict) -> str:
    """The producer's recipe: filters sorted, canonical JSON, sha256, first 20 hex."""
    normal = dict(query)
    normal["filters"] = sorted(
        query["filters"], key=lambda f: (f["field"], f["operator"], tuple(f["values"]))
    )
    return "q1_" + hashlib.sha256(canonical(normal).encode("utf-8")).hexdigest()[:20]


def dump(path: Path, value) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text + "\n", encoding="utf-8")
    return hashlib.sha256((text + "\n").encode("utf-8")).hexdigest()


class Problems(list):
    def check(self, condition: bool, message: str) -> None:
        if not condition:
            self.append(message)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--source",
        default=os.environ.get("MICROSYNTHESIS_DIR", str(Path.home() / "code/estimador-microsynthesis")),
        help="estimador-microsynthesis checkout",
    )
    parser.add_argument("--dest", default=str(WEB / "public/data/population" / f"v{RELEASE}"))
    parser.add_argument(
        "--game-epoch",
        default=None,
        help="day 0 of Freguesia misteriosa (YYYY-MM-DD); default POPULATION_GAME_EPOCH from src/lib/config/population.ts",
    )
    args = parser.parse_args()
    args.game_epoch = args.game_epoch or game_epoch()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.game_epoch):
        print(f"--game-epoch must be YYYY-MM-DD, not {args.game_epoch}", file=sys.stderr)
        return 1

    src = Path(args.source)
    public = src / "data/products/public"
    package = src / "data/products/release" / f"pt-synthpop-v{RELEASE}"
    paths = {
        "bundle": public / f"public_bundle_v{RELEASE}.json",
        "scorecard": public / f"scorecard_v{RELEASE}.json",
        "checksums": package / "checksums.sha256",
        "portrait_index": public / f"experiences_v{RELEASE}/portrait_index.json",
        "mystery_deck": public / f"experiences_v{RELEASE}/mystery_deck.json",
        "responses_index": public / f"responses_v{RELEASE}/index.json",
        "bindings": public / f"responses_v{RELEASE}/bindings.json",
    }
    problems = Problems()

    # ---- 1. the handoff hashes --------------------------------------------------
    source_hashes = {}
    for name, path in paths.items():
        if not path.exists():
            print(f"missing input: {path}", file=sys.stderr)
            return 1
        digest = sha256(path)
        source_hashes[name] = digest
        problems.check(digest.startswith(PINNED[name]), f"{name}: sha256 {digest} does not match the handoff ({PINNED[name]})")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    print("inputs match the handoff hashes")

    bundle = json.loads(paths["bundle"].read_text(encoding="utf-8"))
    index = json.loads(paths["responses_index"].read_text(encoding="utf-8"))
    bindings = json.loads(paths["bindings"].read_text(encoding="utf-8"))
    manifest_q = json.loads((src / "config/public/launch_queries.json").read_text(encoding="utf-8"))
    scorecard_text = paths["scorecard"].read_text(encoding="utf-8")
    scorecard = json.loads(scorecard_text)
    portrait_index = json.loads(paths["portrait_index"].read_text(encoding="utf-8"))
    deck = json.loads(paths["mystery_deck"].read_text(encoding="utf-8"))
    metadata = json.loads((package / "metadata.json").read_text(encoding="utf-8"))
    glossary = json.loads((package / "public/reason_glossary.json").read_text(encoding="utf-8"))

    # ---- 2. contract validation ---------------------------------------------------
    problems.check(bundle["contract_version"] == CONTRACT, "bundle contract_version is not 1.0")
    problems.check(bundle["release_version"] == RELEASE, "bundle release_version mismatch")
    problems.check(bundle["data_status"] == "release", "bundle is not release data")
    problems.check(scorecard.get("status") == "ok", "scorecard status is not ok")
    problems.check(metadata.get("release_ready") is True, "metadata.release_ready is not true")
    vintage = bundle["data_vintage"]

    responses = bundle["responses"]
    by_id = {r["query_id"]: r for r in responses}
    problems.check(len(by_id) == len(responses), "duplicate query ids in the bundle")
    key_of = {row["query_id"]: row["key"] for row in index["responses"]}
    problems.check(set(key_of) == set(by_id), "responses/index.json and the bundle disagree on query ids")
    surfaces = {s["surface"]: s["query_ids"] for s in bundle["surfaces"]}
    problems.check(set(surfaces) == {"story", "scorecard", "portrait", "game", "tabulator"}, "bundle surfaces are not the five contract surfaces")
    for surface, ids in surfaces.items():
        problems.check(sorted(ids) == sorted(bindings[surface]), f"bindings.json and the bundle disagree on surface {surface}")
        problems.check(all(i in by_id for i in ids), f"surface {surface} binds an unknown query id")

    templates = {q["key"]: q for q in manifest_q["queries"]}
    portrait_keys = [q["key"] for q in manifest_q["queries"] if q.get("geography_scope") == "all_freguesias"]

    provenance = responses[0]["provenance"]
    display = responses[0]["display"]
    constant_links = {k: v for k, v in responses[0]["links"].items() if k != "canonical_path"}
    minimum_cell = responses[0]["quality"]["minimum_cell"]
    problems.check(provenance["model_sha256"] == MODEL_SHA256, "provenance model_sha256 differs from the handoff")

    coordinates_seen: dict[str, set] = defaultdict(set)
    decisions = Counter()
    for r in responses:
        qid = r["query_id"]
        problems.check(query_id(r["query"]) == qid, f"{qid}: query_id does not hash from its query")
        problems.check(r["contract_version"] == CONTRACT and r["data_status"] == "release", f"{qid}: contract/status")
        problems.check(r["provenance"] == provenance, f"{qid}: provenance differs from the release provenance")
        problems.check(r["display"] == display, f"{qid}: display block differs")
        problems.check({k: v for k, v in r["links"].items() if k != "canonical_path"} == constant_links, f"{qid}: links differ")
        problems.check(r["links"]["canonical_path"] == f"/populacao/v/{RELEASE}/q/{qid}", f"{qid}: canonical_path")
        q = r["quality"]
        decisions[q["decision"]] += 1
        problems.check(q["minimum_cell"] == minimum_cell, f"{qid}: minimum_cell differs")
        if q["decision"] == "refuse":
            problems.check(r["cells"] == [], f"{qid}: refused response carries cells")
        if q["decision"] == "fallback":
            problems.check(r["resolved_geography"] == q["fallback_geography"], f"{qid}: fallback geography mismatch")
        if q["decision"] == "publish":
            problems.check(r["resolved_geography"] == r["query"]["geography"], f"{qid}: published geography mismatch")
        for cell in r["cells"]:
            problems.check(cell["count"] is None and cell["variation"] is None, f"{qid}: unexpected count/variation (R=1, shares only)")
            if cell["suppressed"]:
                problems.check(cell["share"] is None and cell["display_value"] == display["suppressed_label"]
                               and cell["suppression_reason"], f"{qid}: suppressed cell invariant")
            else:
                problems.check(isinstance(cell["share"], (int, float)) and cell["suppression_reason"] is None, f"{qid}: published cell invariant")
            for dim, value in cell["coordinates"].items():
                coordinates_seen[dim].add(value)
    if problems:
        print("\n".join(problems[:40]), file=sys.stderr)
        print(f"{len(problems)} contract problem(s)", file=sys.stderr)
        return 1
    print(f"contract v1 valid: {len(responses)} responses, decisions {dict(decisions)}")

    # ---- geography: names, municípios, anchor points -----------------------------
    atlas = json.loads((WEB / "scripts/data/caop-2021-places.json").read_text(encoding="utf-8"))
    quality_rows = {}
    with (package / "quality/quality.csv").open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            quality_rows[row["freguesia"]] = row

    import pyarrow.parquet as pq  # noqa: E402  (only needed here)

    anchors = {
        row["freguesia"]: row
        for row in pq.read_table(src / "data/interim/geo/freguesia_anchor_points_2021.parquet").to_pylist()
    }
    anchor_source = next(iter(anchors.values()))

    regions, municipalities, parish_meta = [], [], {}
    seen_regions = {}
    for m in atlas["municipalities"]:
        if m["regionId"] not in seen_regions:
            seen_regions[m["regionId"]] = m["region"]
            regions.append([m["regionId"], m["region"]])
        municipalities.append([m["code"], m["name"], m["regionId"]])
        for p in m["parishes"]:
            parish_meta[p["code"]] = {"name": p["name"], "municipality": m["code"], "region": m["regionId"]}
    muni_name = {code: name for code, name, _ in municipalities}

    problems.check(len(parish_meta) == PARISH_COUNT, f"atlas places has {len(parish_meta)} parishes")
    problems.check(set(parish_meta) == set(quality_rows), "atlas places and quality.csv disagree on parish codes")
    problems.check(set(parish_meta) == set(anchors), "atlas places and anchor points disagree on parish codes")
    # The release names municípios from INE's 2021 geography (CAOP 2024.1 before v1.0.2);
    # the site keeps the CAOP 2021 atlas names, which also tell the two Calhetas and the
    # two Lagoas apart. Codes must agree.
    name_notes = set()
    for code, row in quality_rows.items():
        problems.check(row["municipio"] == parish_meta[code]["municipality"] + "00", f"{code}: município code differs from the atlas")
        atlas_name = muni_name[parish_meta[code]["municipality"]]
        if row["municipio_name"] != atlas_name:
            name_notes.add(f"{row['municipio']}: release '{row['municipio_name']}', site '{atlas_name}'")
    renamed = sum(1 for c in parish_meta if anchors[c]["name"] != parish_meta[c]["name"])
    if problems:
        print("\n".join(problems[:40]), file=sys.stderr)
        return 1
    print(f"geography joined: {len(regions)} regions, {len(municipalities)} municípios, {len(parish_meta)} parishes "
          f"({renamed} parish names differ from the anchor file; the atlas names are used)")
    for note in sorted(name_notes):
        print(f"  município name kept from the atlas — {note}")

    # ---- 3. compact records ---------------------------------------------------------
    recipe_of = {}
    for qid, key in key_of.items():
        template = key.split("__")[0]
        recipe_of[qid] = template.removeprefix("portrait_")

    def compact(r: dict) -> dict:
        q = r["quality"]
        dims = r["query"]["dimensions"]
        cells = []
        for cell in r["cells"]:
            row = [[cell["coordinates"][d] for d in dims], cell["share"], cell["display_value"]]
            if cell["suppressed"]:
                row.append(cell["suppression_reason"])
            cells.append(row)
        record = {
            "id": r["query_id"],
            "decision": q["decision"],
            "requested_tier": q["requested_tier"],
            "resolved_tier": q["resolved_tier"],
            "reasons": q["reasons"],
            "cells": cells,
        }
        if q["decision"] == "fallback":
            record["resolved"] = r["resolved_geography"]["code"]
        return record

    def rebuild(record: dict, recipe: dict, geography: dict) -> dict:
        """Inverse of compact(): the exact contract-v1 response."""
        query = {
            "contract_version": CONTRACT,
            "release_version": RELEASE,
            "geography": geography,
            "unit": recipe["unit"],
            "dimensions": recipe["dimensions"],
            "filters": recipe["filters"],
            "measure": recipe["measure"],
            "normalization": recipe["normalization"],
        }
        fallback = None
        resolved = geography
        if record["decision"] == "fallback":
            fallback = {"level": "municipio", "code": record["resolved"], "name": None}
            resolved = fallback
        cells = []
        for row in record["cells"]:
            suppressed = len(row) > 3
            cells.append({
                "coordinates": dict(zip(recipe["dimensions"], row[0])),
                "count": None,
                "share": row[1],
                "display_value": row[2],
                "suppressed": suppressed,
                "suppression_reason": row[3] if suppressed else None,
                "variation": None,
            })
        return {
            "contract_version": CONTRACT,
            "data_status": "release",
            "query": query,
            "query_id": record["id"],
            "resolved_geography": resolved,
            "quality": {
                "decision": record["decision"],
                "requested_tier": record["requested_tier"],
                "resolved_tier": record["resolved_tier"],
                "reasons": record["reasons"],
                "fallback_geography": fallback,
                "minimum_cell": minimum_cell,
            },
            "display": display,
            "cells": cells,
            "provenance": provenance,
            "links": {"canonical_path": f"/populacao/v/{RELEASE}/q/{record['id']}", **constant_links},
        }

    # Each template's query comes from the pinned bundle itself, never from the
    # manifest in the producer's working tree (which may already describe the
    # next release). The manifest only supplies the order and the minimum tier.
    queries_of: dict[str, list] = defaultdict(list)
    for r in responses:
        queries_of[recipe_of[r["query_id"]]].append(r["query"])
    surfaces_of = defaultdict(set)
    for surface, ids in surfaces.items():
        for qid in ids:
            surfaces_of[recipe_of[qid]].add(surface)
    recipes = {}
    for name, queries in sorted(queries_of.items()):
        shape = {k: queries[0][k] for k in ("unit", "dimensions", "filters", "measure", "normalization")}
        if any({k: q[k] for k in shape} != shape for q in queries):
            print(f"template {name}: responses disagree on the query shape", file=sys.stderr)
            return 1
        template = templates.get(name if name == "national_age" else f"portrait_{name}", {})
        if template and template["query"]["filters"] != shape["filters"]:
            print(f"  note: the producer's working-tree manifest has changed template {name} since this release; the bundle is used")
        recipes[name] = {**shape, "minimum_tier": template.get("minimum_tier"), "surfaces": sorted(surfaces_of[name])}
    recipe_order = [k.removeprefix("portrait_") for k in portrait_keys]
    if sorted(recipe_order) != sorted(n for n in recipes if n != "national_age"):
        print("the manifest's portrait templates differ from the bundle's", file=sys.stderr)
        return 1

    per_parish: dict[str, dict] = defaultdict(dict)
    caop_name = {}
    national = None
    for r in responses:
        recipe = recipe_of[r["query_id"]]
        geo = r["query"]["geography"]
        if geo["level"] == "national":
            national = {"code": "PT", "name": geo["name"], "recipe": recipe, "response": compact(r)}
            continue
        caop_name[geo["code"]] = geo["name"]
        per_parish[geo["code"]][recipe] = compact(r)

    problems.check(national is not None, "no national response")
    problems.check(set(per_parish) == set(parish_meta), "bundle parishes differ from the atlas parishes")
    problems.check(all(len(v) == len(recipe_order) for v in per_parish.values()), "a parish lacks one of the portrait recipes")

    status_of = {p["freguesia"]: p["status"] for p in portrait_index["portraits"]}
    tier_counts = Counter()
    for code, recs in per_parish.items():
        row = quality_rows[code]
        tier_counts[row["quality_tier"]] += 1
        derived = "publish" if any(r["decision"] == "publish" for r in recs.values()) else "fallback"
        problems.check(status_of.get(code) == derived, f"{code}: portrait index status differs from the responses")
        for rec in recs.values():
            if rec["decision"] == "fallback":
                problems.check(rec["resolved"] == row["fallback_geography"], f"{code}: fallback município differs from quality.csv")
    if problems:
        print("\n".join(problems[:40]), file=sys.stderr)
        return 1

    dest = Path(args.dest)
    if dest.exists():
        shutil.rmtree(dest)
    files: dict[str, str] = {}

    def write(rel: str, value) -> None:
        files[rel] = dump(dest / rel, value)

    region_name = {region_id: name for region_id, name in regions}
    for code in sorted(per_parish):
        row = quality_rows[code]
        meta_p = parish_meta[code]
        # The município whose figures the portrait shows: only when a response
        # actually fell back (v1.0.0). From v1.0.1 every parish answers itself.
        fallback_code = next((r["resolved"] for r in per_parish[code].values() if r["decision"] == "fallback"), None)
        write(f"parish/{code}.json", {
            "code": code,
            "caop_name": caop_name[code],
            "tier": row["quality_tier"],
            "status": status_of[code],
            "fallback": None if not fallback_code else {"code": fallback_code, "name": muni_name[fallback_code[:4]]},
            # Enough to draw the parish page's hero from this one file, before
            # places.json (every parish) arrives. Names are the atlas's (CAOP
            # 2021). census_population is INE's resident count;
            # generated_households is the GENERATED population's household
            # count (each collective living quarter counts as one), never INE's;
            # publication_population is the count the quality tier was decided
            # on (quality.csv: the smaller of the generated and INE counts).
            "place": {
                "name": meta_p["name"],
                "municipality": meta_p["municipality"],
                "municipality_name": muni_name[meta_p["municipality"]],
                "region": meta_p["region"],
                "region_name": region_name[meta_p["region"]],
                "level": "p" if status_of[code] == "publish" else "f",
                "census_population": int(row["census_population"]),
                "generated_households": int(row["n_households"]),
                "publication_population": int(row["publication_population"]),
                # quality.csv's one worst table and its SRMSE (release columns, verbatim),
                # so a tier C page can say which table set the tier (MR2-03). A code
                # (e.g. srmse_p_age_single), labelled by the site, never shown raw.
                "worst_constraint": row["worst_constraint"],
                "worst_constraint_srmse": float(row["worst_constraint_srmse"]),
                # The typical error (median of the 12 fitted person tables' SRMSE),
                # the tiers' first criterion: a tier C page whose worst table is
                # single-year age only says the answers may be close to INE's tables
                # when this one is within tier B's limit too (P202).
                "person_srmse_median": float(row["person_srmse_median"]),
            },
            "responses": {name: per_parish[code][name] for name in recipe_order},
        })

    write("national.json", national)

    # Round trip: every response rebuilt from what was just written equals the bundle.
    mismatches = 0
    for code in per_parish:
        record = json.loads((dest / f"parish/{code}.json").read_text(encoding="utf-8"))
        geography = {"level": "freguesia", "code": code, "name": record["caop_name"]}
        for name, rec in record["responses"].items():
            rebuilt = rebuild(rec, recipes[name], geography)
            if rebuilt != by_id[rec["id"]]:
                if mismatches < 3:
                    original = by_id[rec["id"]]
                    for key in original:
                        if rebuilt.get(key) != original[key]:
                            print(f"  round trip differs: {code} {name} .{key}: {json.dumps(rebuilt.get(key), ensure_ascii=False)[:300]} != {json.dumps(original[key], ensure_ascii=False)[:300]}", file=sys.stderr)
                mismatches += 1
    nat = json.loads((dest / "national.json").read_text(encoding="utf-8"))
    if rebuild(nat["response"], recipes[nat["recipe"]], {"level": "national", "code": "PT", "name": nat["name"]}) != by_id[nat["response"]["id"]]:
        mismatches += 1
    if mismatches:
        print(f"round trip failed for {mismatches} response(s)", file=sys.stderr)
        return 1
    print(f"round trip exact: {len(responses)} responses rebuilt from the written files")

    # ---- places: search, navigation, game guesses --------------------------------------
    parishes = []
    for code in sorted(parish_meta):
        meta_p, row, anchor = parish_meta[code], quality_rows[code], anchors[code]
        parishes.append([
            code,
            meta_p["name"],
            meta_p["municipality"],
            row["quality_tier"],
            "p" if status_of[code] == "publish" else "f",
            int(row["census_population"]),
            int(row["n_households"]),
            round(anchor["latitude"], 4),
            round(anchor["longitude"], 4),
            int(row["publication_population"]),
        ])
    write("places.json", {
        "release_version": RELEASE,
        "geography": {
            "vintage": anchor_source["source_vintage"],
            "source": anchor_source["source_name"],
            "source_url": anchor_source["source_url"],
            "license": anchor_source["source_license"],
            "license_url": anchor_source["source_license_url"],
            "points": "interior representative point (WGS84)",
        },
        "population_source": "INE, Censos 2021 (residentes)",
        # Not INE's: the generated population's households, each collective
        # living quarter counted as one (quality.csv n_households).
        "households_source": "generated (synthetic population; each collective living quarter counts as one household)",
        "columns": ["code", "name", "municipality", "tier", "level", "census_population", "generated_households", "lat", "lon", "publication_population"],
        "regions": regions,
        "municipalities": municipalities,
        "parishes": parishes,
    })

    # ---- Freguesia Misteriosa ------------------------------------------------------------
    candidates = sorted(deck["candidates"], key=lambda c: c["daily_order"])
    problems.check([c["daily_order"] for c in candidates] == list(range(len(candidates))), "deck daily_order is not 0..n-1")
    problems.check([s["freguesia"] for s in deck["curation"]["schedule"]] == [c["freguesia"] for c in candidates[: len(deck["curation"]["schedule"])]],
                   "deck schedule is not the head of daily_order")
    for c in candidates:
        problems.check(status_of.get(c["freguesia"]) == "publish", f"deck candidate {c['freguesia']} is not a published parish")
        bound = set(surfaces["game"])
        problems.check(all(clue["query_id"] in bound for clue in c["clues"]), f"deck candidate {c['freguesia']} uses an unbound clue")
    if problems:
        print("\n".join(problems[:40]), file=sys.stderr)
        return 1
    chunks = (len(candidates) + GAME_CHUNK - 1) // GAME_CHUNK
    for n in range(chunks):
        entries = []
        for c in candidates[n * GAME_CHUNK:(n + 1) * GAME_CHUNK]:
            code = c["freguesia"]
            entries.append({
                "order": c["daily_order"],
                "code": code,
                "tier": c["quality_tier"],
                "responses": {name: per_parish[code][name] for name in recipe_order},
            })
        write(f"game/chunk-{n:03d}.json", entries)
    write("game/index.json", {
        "schema": deck["schema"],
        "release_version": RELEASE,
        "epoch": args.game_epoch,
        "candidates": len(candidates),
        "chunk_size": GAME_CHUNK,
        "chunks": chunks,
        "eligible_tiers": deck["selection"]["eligible_quality_tiers"],
        "curation_rule": deck["curation"]["rule"],
        "honesty": deck["honesty"],
        "geography": deck["geography_schema"],
    })

    # ---- permalink lookup: /populacao/v/<release>/q/<id> ------------------------------
    buckets: dict[str, dict] = defaultdict(dict)
    for qid, r in by_id.items():
        geo = r["query"]["geography"]
        buckets[qid[3]][qid] = [geo["code"], recipe_of[qid]]
    for bucket in sorted(buckets):
        write(f"q/{bucket}.json", dict(sorted(buckets[bucket].items())))

    # ---- scorecard verbatim, release package facts ------------------------------------
    (dest / "scorecard.json").write_text(scorecard_text, encoding="utf-8")
    files["scorecard.json"] = sha256(dest / "scorecard.json")

    package_files = []
    for line in paths["checksums"].read_text(encoding="utf-8").splitlines():
        digest, rel = line.split(None, 1)
        package_files.append({"path": rel, "bytes": (package / rel).stat().st_size, "sha256": digest})
    write("release.json", {
        "name": metadata["release_name"],
        "version": RELEASE,
        "published": PUBLISHED,
        "license": metadata["license"],
        "census_vintage": metadata["census_vintage"],
        "geography_vintage": metadata["geography_vintage"],
        "run_started": metadata["generated_at"],
        "engine": metadata["engine"],
        "model_version": metadata["model_version"],
        "model_sha256": metadata["model_sha256"],
        "code_commit": metadata["code_commit"],
        "counts": metadata["counts"],
        "quality_summary": metadata["quality_summary"],
        "quality_tier_policy": metadata["quality_tier_policy"],
        "attribution": metadata["ine_attribution"],
        "column_dictionary": metadata["column_dictionary"],
        "label_maps": metadata["label_maps"],
        "checksums_sha256": source_hashes["checksums"],
        "package_bytes": sum(f["bytes"] for f in package_files) + paths["checksums"].stat().st_size,
        "files": package_files,
    })

    write("meta.json", {
        "schema": "estimador-population-web/v1",
        "release_version": RELEASE,
        "contract_version": CONTRACT,
        "data_status": "release",
        "data_vintage": vintage,
        "published": PUBLISHED,
        "provenance": provenance,
        "display": display,
        "links": constant_links,
        "minimum_cell": minimum_cell,
        "recipes": recipes,
        "recipe_order": recipe_order,
        "reasons": glossary,
        "honesty": {
            "portrait": portrait_index_honesty(src, recipe_order),
            "game": deck["honesty"],
        },
        "coordinates": {dim: sorted(values) for dim, values in sorted(coordinates_seen.items())},
        "counts": {
            "persons": scorecard["provenance"]["n_persons"],
            "households": scorecard["provenance"]["n_households"],
            "parishes": PARISH_COUNT,
            "municipalities": len(municipalities),
            "tiers": dict(sorted(tier_counts.items())),
            "decisions": dict(sorted(decisions.items())),
            "responses": len(responses),
            "suppressed_cells": sum(1 for r in responses for c in r["cells"] if c["suppressed"]),
        },
    })

    write("manifest.json", {
        "schema": "estimador-population-web-manifest/v1",
        "release_version": RELEASE,
        "contract_version": CONTRACT,
        "data_status": "release",
        "source": {name: digest for name, digest in sorted(source_hashes.items())},
        "files": dict(sorted(files.items())),
    })

    total = sum((dest / rel).stat().st_size for rel in files) + (dest / "manifest.json").stat().st_size
    print(f"wrote {len(files) + 1} files, {total / 1e6:.1f} MB, to {dest.relative_to(WEB)}")
    return 0


def portrait_index_honesty(src: Path, recipe_order: list[str]) -> dict:
    """The portrait honesty line, read from one portrait file (constant across all 3,092)."""
    first = next((src / f"data/products/public/experiences_v{RELEASE}/portraits").glob("*.json"))
    honesty = json.loads(first.read_text(encoding="utf-8"))["honesty"]
    return {"pt": honesty["message_pt"], "en": honesty["message_en"]}


if __name__ == "__main__":
    sys.exit(main())
