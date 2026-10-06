"""Dissolve the public CAOP municipality exports into the country camera layer.

The country file is drawn behind every level of the population map and is
never seen closer than a region's framing, so it is simplified harder than the
municipality and parish files (about 400 m), its coordinates are quantised to
four decimals (about 10 m) and rings under about 0.05 km² (rocks, slivers) are
dropped. That takes it from ~680 KB to well under 100 KB, which every region
page and the hub fetch first.

    ~/code/estimador-microsynthesis/.venv/bin/python scripts/build-atlas-country.py
"""
import json
from pathlib import Path

from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

TOLERANCE = 0.004  # degrees, ~400 m
DIGITS = 4  # ~10 m
MIN_RING_AREA = 0.000005  # square degrees, ~0.05 km²

root = Path(__file__).resolve().parents[1]
base = root / 'public/data/population-geography'
places = json.loads((root / 'scripts/data/caop-2021-places.json').read_text())
names = {m['regionId']: m['region'] for m in places['municipalities']}


def rounded(value):
    if isinstance(value, float):
        return round(value, DIGITS)
    if isinstance(value, (list, tuple)):
        return [rounded(item) for item in value]
    return value


def clean(polygon: Polygon) -> Polygon | None:
    if polygon.area < MIN_RING_AREA:
        return None
    holes = [hole for hole in polygon.interiors if Polygon(hole).area >= MIN_RING_AREA]
    return orient(Polygon(polygon.exterior, holes), sign=-1)


features = []
for path in sorted((base / 'municipalities').glob('*.json')):
    merged = unary_union([shape(f['geometry']) for f in json.loads(path.read_text())['features']])
    simple = merged.simplify(TOLERANCE, preserve_topology=True)
    parts = [simple] if isinstance(simple, Polygon) else list(simple.geoms)
    kept = [p for p in (clean(part) for part in parts) if p is not None]
    if not kept:  # never drop a whole region: keep its largest part
        kept = [orient(max(parts, key=lambda p: p.area), sign=-1)]
    geometry = kept[0] if len(kept) == 1 else MultiPolygon(kept)
    data = mapping(geometry)
    features.append({
        'type': 'Feature',
        'properties': {'code': path.stem, 'name': names[path.stem]},
        'geometry': {'type': data['type'], 'coordinates': rounded(data['coordinates'])},
    })

out = base / 'country.json'
out.write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False, separators=(',', ':')))
print(f'wrote {out.relative_to(root)}: {len(features)} regions, {out.stat().st_size / 1000:.0f} KB')
