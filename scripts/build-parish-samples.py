"""Write the "Bate à porta" samples: a few generated households per parish.

The parish page's village (src/components/population/parish/village/) draws
about two dozen houses whose people are real records of the release's
microdata: private households only (is_institutional = 0), drawn at random
with a seed fixed by the release and the parish code, so a rebuild writes the
same bytes. Each parish gets up to three samples of up to 24 households
(disjoint when the parish has 72 or more; a parish with 24 or fewer gets one
sample holding all of them).

It is a toy, not a statistic: the page labels the people as generated and the
sample as a sample, and prints no number computed from it.

    ~/code/estimador-microsynthesis/.venv/bin/python scripts/build-parish-samples.py --assets DIR [--only CODE,CODE] [--verify]

DIR holds the GitHub release's pt-synthpop-v{release}-{persons,households}.parquet
(or set SYNTHPOP_ASSETS). scripts/sync-population.py rewrites the release folder
from scratch, so run this after every population sync (sync-data.sh does when
SYNTHPOP_ASSETS is set).

--verify rebuilds every sample in memory and fails unless it matches the
files on disk byte for byte (determinism), every member belongs to its
household and every household is private.

File (public/data/population/v{release}/sample/<CODE>.json), short keys:

    {"r": "1.0.3", "s": [sample, sample, sample]}
    sample    = [household, ...]
    household = [rooms, person, person, ...]      rooms: n_divisions, 0 unknown
    person    = [sex, age, edu, emp, mar, foreign, sit, occ, work, mode]
                trailing zeros dropped; 0 = not applicable / not given
      sex     1 mulher (M), 2 homem (H)
      edu     education_level_code as an integer (1, 21, 22, 23, 3, 4, 51..55)
      emp     employment_status_code as an integer (11, 12, 21..25)
      mar     marital_status_code (1..4)
      foreign 1 when nationality_group is Foreign
      sit     sitprof_code (1..5)
      occ     occupation_major + 1 (CPP 2010 major group 0..9 -> 1..10)
      work    work_location_type (1..6)
      mode    transport_mode as an integer (1..11), NR -> 12

The codes are decoded, with the release's label maps, by
src/lib/population/sample.ts.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq

RELEASE = '1.0.3'
PER_SAMPLE = 24
SAMPLES = 3
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / f'public/data/population/v{RELEASE}/sample'
PERSON_COLUMNS = [
    'freguesia', 'synthetic_hh_id', 'is_institutional', 'sex', 'age',
    'education_level_code', 'employment_status_code', 'marital_status_code',
    'nationality_group', 'sitprof_code', 'occupation_major', 'work_location_type', 'transport_mode',
]


def seed_for(code: str) -> int:
    digest = hashlib.sha256(f'pt-synthpop-v{RELEASE}:{code}:bate-a-porta'.encode()).digest()
    return int.from_bytes(digest[:8], 'big')


def as_int(value) -> int:
    return 0 if value is None or value == '' else int(value)


def encode_person(row: dict) -> list[int]:
    mode = row['transport_mode']
    person = [
        1 if row['sex'] == 'M' else 2,
        int(row['age']),
        as_int(row['education_level_code']),
        as_int(row['employment_status_code']),
        as_int(row['marital_status_code']),
        1 if row['nationality_group'] == 'Foreign' else 0,
        as_int(row['sitprof_code']),
        0 if row['occupation_major'] is None else int(row['occupation_major']) + 1,
        as_int(row['work_location_type']),
        0 if mode is None else 12 if mode == 'NR' else int(mode),
    ]
    while person and person[-1] == 0:
        person.pop()
    return person


def draw(ids: np.ndarray, code: str) -> list[list[int]]:
    """Up to three samples of household ids, in a seeded order."""
    rng = np.random.default_rng(seed_for(code))
    ids = np.sort(ids)
    n = len(ids)
    if n <= PER_SAMPLE:
        return [rng.permutation(ids).tolist()]
    if n >= PER_SAMPLE * SAMPLES:
        order = rng.permutation(ids)
        return [order[i * PER_SAMPLE:(i + 1) * PER_SAMPLE].tolist() for i in range(SAMPLES)]
    return [rng.choice(ids, PER_SAMPLE, replace=False).tolist() for _ in range(SAMPLES)]


def build(assets: Path, only: set[str] | None):
    households = pq.read_table(
        assets / f'pt-synthpop-v{RELEASE}-households.parquet',
        columns=['freguesia', 'synthetic_hh_id', 'is_institutional', 'hh_size', 'n_divisions'],
    )
    # synthetic_hh_id is unique within a parish, not across the release: a household is (freguesia, id).
    private = households.filter(pc.equal(households['is_institutional'], 0))
    if only:
        private = private.filter(pc.is_in(private['freguesia'], value_set=pa.array(sorted(only))))
    by_parish: dict[str, list[int]] = defaultdict(list)
    info: dict[tuple[str, int], tuple[int, str | None]] = {}
    for code, hh, size, rooms in zip(
        private['freguesia'].to_pylist(), private['synthetic_hh_id'].to_pylist(),
        private['hh_size'].to_pylist(), private['n_divisions'].to_pylist(),
    ):
        if (code, hh) in info:
            sys.exit(f'household {hh} appears twice in {code}')
        by_parish[code].append(hh)
        info[(code, hh)] = (size, rooms)

    samples = {code: draw(np.array(hh_list, dtype=np.int64), code) for code, hh_list in by_parish.items()}
    chosen = {(code, hh) for code, parish in samples.items() for sample in parish for hh in sample}

    persons = pq.read_table(assets / f'pt-synthpop-v{RELEASE}-persons.parquet', columns=PERSON_COLUMNS)
    persons = persons.filter(pc.is_in(persons['synthetic_hh_id'], value_set=pa.array(sorted({hh for _, hh in chosen}), type=pa.int64())))
    members: dict[tuple[str, int], list[dict]] = defaultdict(list)
    for row in persons.to_pylist():
        key = (row['freguesia'], row['synthetic_hh_id'])
        if key in chosen:
            members[key].append(row)

    files: dict[str, bytes] = {}
    for code in sorted(samples):
        out = []
        for sample in samples[code]:
            houses = []
            for hh in sample:
                people = members[(code, hh)]
                size, rooms = info[(code, hh)]
                # Every member belongs to this household, in this parish, outside collective quarters.
                assert len(people) == size, f'{code} household {hh}: {len(people)} members, hh_size {size}'
                assert all(p['freguesia'] == code and p['is_institutional'] == 0 for p in people), f'{code} household {hh}'
                people = sorted(people, key=lambda p: (-p['age'], p['sex']))
                houses.append([as_int(rooms), *[encode_person(p) for p in people]])
            out.append(houses)
        body = json.dumps({'r': RELEASE, 's': out}, separators=(',', ':'), ensure_ascii=False)
        files[code] = body.encode()
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--assets', type=Path, default=Path(os.environ['SYNTHPOP_ASSETS']) if os.environ.get('SYNTHPOP_ASSETS') else None)
    parser.add_argument('--only', default='')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    if args.assets is None:
        parser.error('give --assets DIR (the release parquet files) or set SYNTHPOP_ASSETS')
    only = {c.strip().upper() for c in args.only.split(',') if c.strip()} or None

    files = build(args.assets, only)
    sizes = sorted(len(body) for body in files.values())
    print(f'{len(files)} parishes; bytes min {sizes[0]}, median {sizes[len(sizes) // 2]}, '
          f'p95 {sizes[int(len(sizes) * .95)]}, max {sizes[-1]}, total {sum(sizes) / 1e6:.1f} MB')

    if args.verify:
        bad = [code for code, body in files.items() if not (OUT / f'{code}.json').exists() or (OUT / f'{code}.json').read_bytes() != body]
        if bad:
            sys.exit(f'{len(bad)} sample file(s) differ from a rebuild: {", ".join(bad[:8])}')
        if not only:
            extra = sorted(p.stem for p in OUT.glob('*.json') if p.stem not in files)
            if extra:
                sys.exit(f'sample files with no parish: {", ".join(extra[:8])}')
        print('verified: deterministic, members belong to their household, private households only')
        return

    OUT.mkdir(parents=True, exist_ok=True)
    if not only:
        for stale in OUT.glob('*.json'):
            if stale.stem not in files:
                stale.unlink()
    for code, body in files.items():
        (OUT / f'{code}.json').write_bytes(body)
    print(f'wrote {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
