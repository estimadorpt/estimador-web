"""Dissolve existing public CAOP municipality exports into a country camera layer."""
import json
from pathlib import Path
from shapely.geometry import shape,mapping,Polygon,MultiPolygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1]
base=root/'public/data/population-geography'
places=json.loads((root/'src/lib/atlas/places.json').read_text())
names={m['regionId']:m['region'] for m in places['municipalities']}
features=[]
for p in sorted((base/'municipalities').glob('*.json')):
 g=unary_union([shape(f['geometry']) for f in json.loads(p.read_text())['features']]).simplify(.001,preserve_topology=True)
 g=orient(g,sign=-1) if isinstance(g,Polygon) else MultiPolygon([orient(x,sign=-1) for x in g.geoms])
 features.append({'type':'Feature','properties':{'code':p.stem,'name':names[p.stem]},'geometry':mapping(g)})
(base/'country.json').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
