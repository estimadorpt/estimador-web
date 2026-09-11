# Tagus physical land data

© OpenStreetMap contributors, licensed under the Open Database License 1.0:
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

Snapshot: 2026-09-10T14:32:38Z. Source: Overpass API, query:

```
[out:json][timeout:40];
way["natural"="coastline"](38.3,-9.7,39.15,-8.6);
out geom;
```

Save the response as `/tmp/atlas-tagus-coast.json`, then run
`scripts/build-tagus-context.py` with Python, Shapely and NumPy installed.
Run `node scripts/build-atlas-scenes.mjs` to rebuild household illustrations.

`tagus-parish-land.json` contains physical land overrides derived by subtracting
OSM water from the existing CAOP administrative polygons. These overrides,
`public/data/population-geography/tagus-context.json`, and affected derived
scene geometry retain the ODbL license. The atlas displays map attribution.
Original administrative boundary files are not modified by this process.
