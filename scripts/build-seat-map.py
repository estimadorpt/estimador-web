#!/usr/bin/env python3
"""
Writes `src/lib/simulator/seat-map-layout.json`, the drawing behind the simulator's seat map
(`SeatMap.tsx`): mainland Portugal's 18 districts from the site's own TopoJSON, grown towards
their seats by a partial cartogram so that Lisboa's 48 seats and Porto's 40 have room while
the country keeps its shape, one dot per seat spread evenly inside each district, the labels,
and the islands and the emigration circles in a column on the left.

    python3 scripts/build-seat-map.py [--preview out.png]

Needs numpy and Pillow. Deterministic: the same inputs give the same file. Rerun it when the
seat map changes (the number of seats per circle, `simulator.json`) and commit the JSON.

How:
1. The district outlines are projected (longitude times cos 39.6°, latitude).
2. A diffusion cartogram (Gastner and Newman, 2004) moves every vertex until each district's
   area is proportional to its seats; the drawing goes `ALPHA` of the way, so the shape stays
   Portugal's and the dense districts gain room.
3. The shared borders are simplified once (Douglas–Peucker), so neighbours never part.
4. A crowded coastal district has its label in the sea beside its coast (Faro's under the
   Algarve); every other district has it near its middle, over a paper halo where it crosses a
   border, in a hole that every district's seats keep clear of.
5. Each district's seats are spread by Lloyd's algorithm over its raster (farthest-point
   start, fixed seed), then sorted from west to east, which is the order the parliament's
   lists fill them in (left to right), so each list's seats sit together.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
TOPO = ROOT / 'public/data/elections/parliamentary-2025/Portugal-Distritos-Ilhas_TopoJSON.json'
SIM = ROOT / 'public/data/elections/parliamentary-2025/simulator.json'
OUT = ROOT / 'src/lib/simulator/seat-map-layout.json'
FONT_BOLD = ROOT / 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff'

# The drawing, in its own units (the SVG's viewBox). Labels are LABEL_SIZE units, so the map
# prints them at 11px from WIDTH pixels wide.
WIDTH = 312
LABEL_SIZE = 11
DOT_R = 3.1
# The mainland's box.
MAIN_X1 = 309          # right edge
MAIN_W = 214           # width
MAIN_Y0 = 6            # top
ALPHA = 0.6            # how far towards the full cartogram (at 1, area is proportional to seats)
SIMPLIFY = 0.45        # Douglas–Peucker tolerance, drawing units
SPECK = 30             # mainland pieces and holes smaller than this (square units) are not drawn
RASTER = 4             # raster cells per unit for the dot placement
SEED = 7
LLOYD_ITERATIONS = 80
# A label's box around its baseline: from cap height to descender.
LABEL_ASCENT = 9
LABEL_DESCENT = 3
# Clearance between a label and the nearest seat's centre (a seat's radius and a gap).
LABEL_CLEAR = DOT_R + 1.5
# How far a district's seats keep off its neighbours.
BORDER_MARGIN = 1.2

# The labels (the longer of the two languages', as `circleLabel` writes them).
LABELS = {
    'Viana do Castelo': ['Viana'],
    'Castelo Branco': ['C. Branco'],
    'Açores': ['Açores', 'Azores'],
    'Europa': ['Europa', 'Europe'],
    'Fora da Europa': ['Fora da Europa', 'Outside Europe'],
}
# Districts whose label goes in the sea beside their coast (their seats fill them).
COAST_LABEL = {'Viana do Castelo', 'Braga', 'Porto', 'Aveiro', 'Lisboa', 'Setúbal', 'Leiria', 'Coimbra'}
# The tops of the island insets in the left column (Açores level with Aveiro, Madeira below Lisboa).
INSETS = {'Açores': 112, 'Madeira': 318}
# Hand nudges to a coast label's baseline, in units (positive: down).
COAST_NUDGE = {'Braga': 2, 'Viana do Castelo': -2}


def label_width(font: ImageFont.FreeTypeFont, name: str) -> float:
    texts = LABELS.get(name, [name])
    return max(font.getlength(t) for t in texts) / 10 + 2


# --- geometry ---------------------------------------------------------------------------

def decode_arcs(topo: dict) -> list[np.ndarray]:
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    k = math.cos(math.radians(39.6))
    out = []
    for arc in topo['arcs']:
        a = np.cumsum(np.array(arc, float), axis=0)
        lon = a[:, 0] * sx + tx
        lat = a[:, 1] * sy + ty
        out.append(np.stack([lon * k, -lat], 1))
    return out


def ring_arcs(idx: list[int], arcs: list[np.ndarray]) -> np.ndarray:
    pts: list[np.ndarray] = []
    for i in idx:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.append(a if not pts else a[1:])
    return np.concatenate(pts)


def geometries(topo: dict) -> dict[str, list[list[list[int]]]]:
    """Name -> polygons -> rings -> signed arc indices."""
    out: dict[str, list] = {}
    for g in topo['objects']['ilhasGeo2']['geometries']:
        polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
        out[g['properties']['NAME_1']] = polys
    return out


def douglas_peucker(p: np.ndarray, tol: float) -> np.ndarray:
    if len(p) <= 2:
        return p
    keep = np.zeros(len(p), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(p) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        a, b = p[i], p[j]
        seg = b - a
        n = np.hypot(*seg)
        q = p[i + 1:j]
        if n == 0:
            d = np.hypot(*(q - a).T)
        else:
            d = np.abs(seg[0] * (q[:, 1] - a[1]) - seg[1] * (q[:, 0] - a[0])) / n
        k = int(np.argmax(d))
        if d[k] > tol:
            m = i + 1 + k
            keep[m] = True
            stack += [(i, m), (m, j)]
    return p[keep]


def simplify_closed(p: np.ndarray, tol: float) -> np.ndarray:
    """A closed arc (an island) keeps its farthest vertex from the start, so it stays a shape."""
    if np.allclose(p[0], p[-1]) and len(p) > 4:
        far = int(np.argmax(np.hypot(*(p - p[0]).T)))
        return np.concatenate([douglas_peucker(p[:far + 1], tol), douglas_peucker(p[far:], tol)[1:]])
    return douglas_peucker(p, tol)


def area(r: np.ndarray) -> float:
    x, y = r[:, 0], r[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def num(v: float) -> str:
    t = f'{v:.1f}'.rstrip('0').rstrip('.')
    t = t.replace('0.', '.', 1) if t.startswith('0.') else t.replace('-0.', '-.', 1)
    return '0' if t in ('', '-0', '-') else t


def path_of(polys: list[list[np.ndarray]]) -> str:
    """Closed SVG paths with relative steps, one decimal: "M12.3 4.5l1.2-.4…Z"."""
    parts = []
    for poly in polys:
        for r in poly:
            r = r[:-1] if np.allclose(r[0], r[-1]) else r
            q = np.round(r, 1)
            steps = np.diff(q, axis=0)
            out = [f'M{num(q[0, 0])} {num(q[0, 1])}l']
            for dx, dy in steps:
                if abs(dx) < 0.05 and abs(dy) < 0.05:
                    continue
                b = num(dy)
                out.append(f'{num(dx)}{b if b.startswith("-") else " " + b} ')
            parts.append(''.join(out).rstrip() + 'Z')
    # "1.2 -3" needs no space before a minus; a number after a number does.
    return ''.join(parts).replace(' -', '-').replace('l ', 'l')


# --- cartogram --------------------------------------------------------------------------

def cartogram(polys: dict[str, list[list[np.ndarray]]], seats: dict[str, int], pts: np.ndarray) -> np.ndarray:
    """Moves `pts` by a diffusion cartogram that gives each district an area proportional to its seats."""
    allp = np.concatenate([r for ps in polys.values() for p in ps for r in p])
    x0, y0 = allp.min(0)
    x1, y1 = allp.max(0)
    L = 512
    span = max(x1 - x0, y1 - y0) * 1.9
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

    def to_grid(p):
        return np.stack([((p[:, 0] - cx) / span + 0.5) * L, ((p[:, 1] - cy) / span + 0.5) * L], 1)

    img = Image.new('I', (L, L), 0)
    dr = ImageDraw.Draw(img)
    names = list(polys)
    for k, n in enumerate(names, 1):
        for poly in polys[n]:
            dr.polygon([tuple(v) for v in to_grid(poly[0])], fill=k)
            for h in poly[1:]:
                dr.polygon([tuple(v) for v in to_grid(h)], fill=0)
    ids = np.array(img)
    cells = np.array([(ids == k).sum() for k in range(len(names) + 1)], float)
    s = np.array([0] + [seats[n] for n in names], float)
    rho = np.full((L, L), s.sum() / cells[1:].sum())
    for k in range(1, len(names) + 1):
        rho[ids == k] = s[k] / cells[k]
    F = np.fft.fft2(rho)
    k = 2 * np.pi * np.fft.fftfreq(L)
    KX, KY = np.meshgrid(k, k)
    K2 = KX ** 2 + KY ** 2

    def field(t):
        e = F * np.exp(-K2 * t)
        r = np.real(np.fft.ifft2(e))
        return -np.real(np.fft.ifft2(1j * KX * e)) / r, -np.real(np.fft.ifft2(1j * KY * e)) / r

    def interp(f, P):
        x = np.clip(P[:, 0] - 0.5, 0, L - 1.001)
        y = np.clip(P[:, 1] - 0.5, 0, L - 1.001)
        i = np.floor(x).astype(int)
        j = np.floor(y).astype(int)
        fx, fy = x - i, y - j
        return f[j, i] * (1 - fx) * (1 - fy) + f[j, i + 1] * fx * (1 - fy) + f[j + 1, i] * (1 - fx) * fy + f[j + 1, i + 1] * fx * fy

    P = to_grid(pts)
    P0 = P.copy()
    t, dt = 0.0, 0.01
    for _ in range(3000):
        vx, vy = field(t)
        v1 = np.stack([interp(vx, P), interp(vy, P)], 1)
        vmax = np.abs(v1).max()
        if vmax < 1e-3:
            break
        dt = min(max(dt * 1.2, 1e-3), 0.3 / vmax)
        Pm = P + 0.5 * dt * v1
        vx, vy = field(t + 0.5 * dt)
        P = P + dt * np.stack([interp(vx, Pm), interp(vy, Pm)], 1)
        t += dt
    # Back to the projection's units.
    moved = P0 + ALPHA * (P - P0)
    return np.stack([(moved[:, 0] / L - 0.5) * span + cx, (moved[:, 1] / L - 0.5) * span + cy], 1)


# --- placement --------------------------------------------------------------------------

def raster(polys: list[np.ndarray] | list[list[np.ndarray]], w: int, h: int) -> np.ndarray:
    im = Image.new('L', (w * RASTER, h * RASTER), 0)
    d = ImageDraw.Draw(im)
    for poly in polys:
        d.polygon([tuple(v * RASTER) for v in poly[0]], fill=1)
        for hole in poly[1:]:
            d.polygon([tuple(v * RASTER) for v in hole], fill=0)
    return np.array(im, bool)


def lloyd(px: np.ndarray, k: int, rng: np.random.Generator) -> np.ndarray:
    c = [px[rng.integers(len(px))]]
    d2 = ((px - c[0]) ** 2).sum(1)
    for _ in range(k - 1):
        j = int(np.argmax(d2))
        c.append(px[j])
        d2 = np.minimum(d2, ((px - px[j]) ** 2).sum(1))
    c = np.array(c, float)
    for _ in range(LLOYD_ITERATIONS):
        lab = np.argmin(((px[:, None, :] - c[None, :, :]) ** 2).sum(2), 1)
        c = np.array([px[lab == q].mean(0) for q in range(k)])
        # A cell that wraps round a label's hole has its centre in the hole: take the cell's
        # nearest point to it instead, so a seat never sits on a label.
        for q in range(k):
            own = px[lab == q]
            d = ((own - c[q]) ** 2).sum(1)
            if d.min() > (1 / RASTER) ** 2:
                c[q] = own[int(np.argmin(d))]
    return c


def fill_order(c: np.ndarray) -> np.ndarray:
    """West to east (top to bottom where they tie), the order the lists fill a district's seats in."""
    return c[np.lexsort((c[:, 1], np.round(c[:, 0], 1)))]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', type=Path)
    args = ap.parse_args()

    topo = json.loads(TOPO.read_text())
    sim = json.loads(SIM.read_text())
    seats = {c['name']: c['seats'] for c in sim['circles']}
    font = ImageFont.truetype(str(FONT_BOLD), LABEL_SIZE * 10)
    arcs = decode_arcs(topo)
    geo = geometries(topo)
    mainland = sorted(n for n in geo if not n.startswith('Ilha'))
    assert set(mainland) <= set(seats), set(mainland) - set(seats)

    # 1-2. Every vertex of the mainland's arcs through the cartogram, then into the drawing.
    used = sorted({i if i >= 0 else ~i for n in mainland for poly in geo[n] for r in poly for i in r})
    sizes = [len(arcs[i]) for i in used]
    pts = np.concatenate([arcs[i] for i in used])
    raw = {n: [[ring_arcs(r, arcs) for r in poly] for poly in geo[n]] for n in mainland}
    moved = cartogram(raw, seats, pts)
    lo, hi = moved.min(0), moved.max(0)
    scale = MAIN_W / (hi[0] - lo[0])
    moved = (moved - lo) * scale + [MAIN_X1 - MAIN_W, MAIN_Y0]
    # 3. Simplified once per arc, so shared borders stay shared.
    new_arcs: dict[int, np.ndarray] = {}
    o = 0
    for i, s in zip(used, sizes):
        new_arcs[i] = simplify_closed(moved[o:o + s], SIMPLIFY)
        o += s

    def ring(idx):
        out = []
        for i in idx:
            a = new_arcs[i] if i >= 0 else new_arcs[~i][::-1]
            out.append(a if not out else a[1:])
        return np.concatenate(out)

    polys = {n: [[ring(r) for r in poly] for poly in geo[n]] for n in mainland}
    # Drop specks (river islands in the Tejo, the Ria Formosa's barrier islands) and holes the
    # size of a seat or two: at this scale they draw as knots on the border.
    polys = {n: [[p[0], *[h for h in p[1:] if abs(area(h)) > SPECK]] for p in ps if abs(area(p[0])) > SPECK] for n, ps in polys.items()}
    main_bottom = max(float(np.concatenate([p[0] for p in ps]).max(0)[1]) for ps in polys.values())

    HEIGHT = int(math.ceil(main_bottom + 22))
    land = raster([p for ps in polys.values() for p in ps], WIDTH, HEIGHT)
    rng = np.random.default_rng(SEED)
    layout: dict[str, dict] = {}
    labels: list[tuple[str, tuple[float, float, float, float]]] = []
    asc, desc = LABEL_ASCENT, LABEL_DESCENT

    # 4. Labels. A crowded coastal district has its label in the sea beside its coast; every
    # other district has it near its middle, in a hole every district's seats keep clear of.
    # An inside label may cross a border (the map draws it over a paper halo), never a seat.
    inside_holes: dict[str, tuple[float, float, float, float]] = {}
    masks = {n: raster(polys[n], WIDTH, HEIGHT) for n in mainland}

    def overlaps(box, margin=2.0):
        return any(not (box[2] + margin <= b[0] or b[2] + margin <= box[0] or box[3] + margin <= b[1] or b[3] + margin <= box[1]) for _, b in labels)

    for n in sorted(COAST_LABEL | {'Faro'}):
        m = masks[n]
        w = label_width(font, n)
        if n == 'Faro':
            # The Algarve's coast faces south: the label goes under it.
            xs = np.nonzero(m.any(0))[0]
            cx = (xs.min() + xs.max()) / 2 / RASTER
            base = np.nonzero(m.any(1))[0].max() / RASTER + 3 + asc
            layout[n] = {'label': {'x': round(cx, 1), 'y': round(base, 1), 'anchor': 'middle', 'w': round(w, 1)}}
            labels.append((n, (cx - w / 2, base - asc, cx + w / 2, base + desc)))
            continue
        # The district's west coast: its leftmost cell on each row with only sea to its west.
        coast = [r for r in np.nonzero(m.any(1))[0] if not land[r, :np.nonzero(m[r])[0].min()].any()]
        mid = float(np.median(coast)) / RASTER + COAST_NUDGE.get(n, 0)
        base = mid + (asc - desc) / 2
        rows = np.arange(HEIGHT * RASTER) / RASTER
        band = (rows >= base - asc - 1) & (rows <= base + desc + 1)
        x1 = np.nonzero(land[band].any(0))[0].min() / RASTER - 3
        layout[n] = {'label': {'x': round(x1, 1), 'y': round(base, 1), 'anchor': 'end', 'w': round(w, 1)}}
        labels.append((n, (x1 - w, base - asc, x1, base + desc)))

    # The others, largest first, each as near its middle as the labels already placed allow.
    rest = sorted((n for n in mainland if n not in COAST_LABEL and n != 'Faro'), key=lambda n: -masks[n].sum())
    for n in rest:
        m = masks[n]
        w = label_width(font, n)
        cy, cx = np.argwhere(m).mean(0) / RASTER
        best, best_score = None, math.inf
        for dy in np.arange(-24, 24.1, 1.0):
            for dx in np.arange(-24, 24.1, 1.0):
                x0, base = cx + dx - w / 2, cy + dy + (asc - desc) / 2
                box = (x0, base - asc, x0 + w, base + desc)
                if box[0] < 0 or box[2] > WIDTH or box[1] < 0 or box[3] > HEIGHT or overlaps(box, 3):
                    continue
                cells = (slice(int(box[1] * RASTER), int(box[3] * RASTER)), slice(int(box[0] * RASTER), int(box[2] * RASTER)))
                own = m[cells].mean()
                on_land = land[cells].mean()
                score = math.hypot(dx, dy) + 60 * (1 - own) + 400 * (1 - on_land)
                if score < best_score:
                    best, best_score = box, score
        assert best is not None, n
        x0, y0, x1, y1 = best
        layout[n] = {'label': {'x': round((x0 + x1) / 2, 1), 'y': round(y0 + asc, 1), 'anchor': 'middle', 'w': round(w, 1)}}
        labels.append((n, best))
        inside_holes[n] = (x0 - LABEL_CLEAR, y0 - LABEL_CLEAR, x1 + LABEL_CLEAR, y1 + LABEL_CLEAR)

    # 5. Seats, kept BORDER_MARGIN units off their neighbours (not off the sea), so two
    # districts' seats never crowd each other across a border.
    k = int(round(BORDER_MARGIN * RASTER))
    for n in mainland:
        others = land & ~masks[n]
        S = np.pad(others.astype(np.int32), ((k + 1, k), (k + 1, k))).cumsum(0).cumsum(1)
        near_other = (S[2 * k + 1:, 2 * k + 1:] - S[:-2 * k - 1, 2 * k + 1:] - S[2 * k + 1:, :-2 * k - 1] + S[:-2 * k - 1, :-2 * k - 1]) > 0
        m = masks[n] & ~near_other
        # Every label's hole is kept clear of every district's seats, not only its own.
        for hole in inside_holes.values():
            x0, y0, x1, y1 = (v * RASTER for v in hole)
            m[int(y0):int(math.ceil(y1)), int(x0):int(math.ceil(x1))] = False
        px = np.argwhere(m)[:, ::-1].astype(float) / RASTER + 0.5 / RASTER
        layout[n]['dots'] = [[round(x, 1), round(y, 1)] for x, y in fill_order(lloyd(px, seats[n], rng))]
        layout[n]['path'] = path_of(polys[n])

    # The column on the left: the emigration circles at the top, the islands below.
    pitch = 2 * DOT_R + 2.2
    islands = {
        'Açores': [n for n in geo if n.startswith('Ilha') and n not in ('Ilha da Madeira', 'Ilha de Porto Santo')],
        'Madeira': ['Ilha da Madeira', 'Ilha de Porto Santo'],
    }
    column = {
        'Europa': (8, 22),
        'Fora da Europa': (8, 58),
    }
    for n, (x, base) in column.items():
        w = label_width(font, n)
        layout[n] = {'label': {'x': x, 'y': base, 'anchor': 'start', 'w': round(w, 1)}}
        labels.append((n, (x, base - asc, x + w, base + desc)))
        dots = np.array([[x + DOT_R + i * pitch, base + desc + 2 + DOT_R] for i in range(seats[n])])
        layout[n]['dots'] = [[round(a, 1), round(b, 1)] for a, b in dots]
    # The islands: their outlines at one scale for both archipelagos, the seats under the label.
    inset = {'Açores': (8, INSETS['Açores'], 76), 'Madeira': (8, INSETS['Madeira'], 34)}
    for n, (x, top, span) in inset.items():
        rings = [ring_arcs(r, arcs) for g in islands[n] for poly in geo[g] for r in poly[:1]]
        allr = np.concatenate(rings)
        lo, hi = allr.min(0), allr.max(0)
        s = span / (hi[0] - lo[0])
        shapes = [[douglas_peucker((r - lo) * s + [x, top], 0.25)] for r in rings]
        h = (hi[1] - lo[1]) * s
        w = label_width(font, n)
        base = top + h + 3 + asc
        layout[n] = {
            'label': {'x': x, 'y': round(base, 1), 'anchor': 'start', 'w': round(w, 1)},
            'path': path_of(shapes),
        }
        labels.append((n, (x, base - asc, x + w, base + desc)))
        dots = np.array([[x + DOT_R + i * pitch, base + desc + 2 + DOT_R] for i in range(seats[n])])
        layout[n]['dots'] = [[round(a, 1), round(b, 1)] for a, b in dots]

    # Checks: every seat drawn, inside the frame, apart from the others and from every label.
    allp = np.array([d for v in layout.values() for d in v['dots']])
    dd = np.hypot(*(allp[:, None] - allp[None]).transpose(2, 0, 1))
    np.fill_diagonal(dd, np.inf)
    for n in seats:
        assert len(layout[n]['dots']) == seats[n], n
    for n, (x0, y0, x1, y1) in labels:
        assert 0 <= x0 and x1 <= WIDTH and 0 <= y0 and y1 <= HEIGHT, (n, x0, y0, x1, y1)
        near = (allp[:, 0] > x0 - DOT_R) & (allp[:, 0] < x1 + DOT_R) & (allp[:, 1] > y0 - DOT_R) & (allp[:, 1] < y1 + DOT_R)
        assert not near.any(), (n, allp[near])
    for i, (a, ba) in enumerate(labels):
        for b, bb in labels[i + 1:]:
            apart = ba[2] + 2 <= bb[0] or bb[2] + 2 <= ba[0] or ba[3] + 1 <= bb[1] or bb[3] + 1 <= ba[1]
            assert apart, (a, b)
    print(f'frame {WIDTH}x{HEIGHT}, closest seats {dd.min():.2f} apart (5th percentile {np.percentile(dd.min(1), 5):.2f})')
    print('labels inside:', sorted(inside_holes))

    out = {
        'width': WIDTH,
        'height': HEIGHT,
        'dotR': DOT_R,
        'labelSize': LABEL_SIZE,
        'circles': {n: layout[n] for n in sorted(layout)},
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)')

    if args.preview:
        preview(out, sim, args.preview)


def preview(out: dict, sim: dict, path: Path) -> None:
    col = {'AD': '#FF8C00', 'PS': '#E57373', 'CH': '#377EB8', 'IL': '#A6CEE3', 'L': '#90EE90', 'CDU': '#E41A1C',
           'BE': '#000000', 'PAN': '#4CAF50', 'JPP': '#8a8a8a'}
    order = ['CDU', 'BE', 'L', 'PS', 'PAN', 'JPP', 'AD', 'IL', 'CH']
    S = 4
    im = Image.new('RGB', (out['width'] * S, out['height'] * S), 'white')
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(str(FONT_BOLD).replace('700', '400'), out['labelSize'] * S)
    import re
    for n, c in out['circles'].items():
        if 'path' in c:
            for sub in re.findall(r'M([^Z]*)Z', c['path']):
                v = [float(t) for t in re.findall(r'-?\d+\.?\d*', sub)]
                pts = [(v[i] * S, v[i + 1] * S) for i in range(0, len(v), 2)]
                d.line(pts + pts[:1], fill='#c8c8c8', width=3)
    won = {c['name']: c['seats2025'] for c in sim['circles']}
    r = out['dotR']
    for n, c in out['circles'].items():
        fills = [col[p] for p in order for _ in range(won[n].get(p, 0))]
        for (x, y), f in zip(c['dots'], fills):
            d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=f)
        lab = c['label']
        text = LABELS.get(n, [n])[0]
        anchor = {'start': 'ls', 'middle': 'ms', 'end': 'rs'}[lab['anchor']]
        d.text((lab['x'] * S, lab['y'] * S), text, fill='#5e5e5e', font=font, anchor=anchor)
    im.save(path)


if __name__ == '__main__':
    main()
