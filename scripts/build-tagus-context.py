"""Build a paired estuary land/water mask from OSM coastline ways (land is on the left).
Input: Overpass JSON ways[natural=coastline] in (38.3,-9.7,39.15,-8.6), out geom.
OSM contributors, ODbL: https://www.openstreetmap.org/copyright
"""
import json,sys,math
from pathlib import Path
from shapely.geometry import LineString,Point,box,mapping,Polygon,MultiPolygon
from shapely.ops import unary_union,polygonize
from shapely.geometry.polygon import orient
from shapely.strtree import STRtree
root=Path(__file__).resolve().parents[1]
data=json.loads(Path(sys.argv[1]).read_text());extent=box(-9.65,38.35,-8.65,39.10)
lines=[LineString([(p['lon'],p['lat']) for p in e['geometry']]) for e in data['elements'] if e['type']=='way' and e.get('geometry')]
clipped=[line.intersection(extent) for line in lines if line.intersects(extent)]
faces=list(polygonize(unary_union([extent.boundary,*clipped])))
tree=STRtree(faces);votes=[[0,0] for _ in faces]
for line in lines:
 coords=list(line.coords)
 for a,b in zip(coords,coords[1:]):
  dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
  if not length:continue
  for side,sign in [(0,1),(1,-1)]:
   point=Point((a[0]+b[0])/2-sign*dy/length*.000002,(a[1]+b[1])/2+sign*dx/length*.000002)
   for index in tree.query(point):
    if faces[index].contains(point):votes[index][side]+=1
assert all(sum(v)>0 for v in votes),votes
land=unary_union([p for p,v in zip(faces,votes) if v[0]>=v[1]])
water=extent.difference(land)
# Known open-water and dry-ground regression locations in the annotated view.
for xy in [(-9.1,38.65),(-9.13,38.66),(-9.15,38.69)]:assert water.contains(Point(xy)),xy
for xy in [(-9.14,38.72),(-9.16,38.68)]:assert land.contains(Point(xy)),xy
def orient_all(g):
 if isinstance(g,Polygon):return orient(g,sign=-1)
 return MultiPolygon([orient(p,sign=-1) for p in g.geoms])
# Simplify land once, then derive its exact complement: no gaps or overlaps.
land=land.simplify(.00004,preserve_topology=True);water=extent.difference(land)
assert land.intersection(water).area<1e-12
result={'source':'© OpenStreetMap contributors','license':'ODbL-1.0','sourceUrl':'https://www.openstreetmap.org/copyright','timestamp':data['osm3s']['timestamp_osm_base'],'extent':mapping(orient(extent,sign=-1)),'land':mapping(orient_all(land)),'water':mapping(orient_all(water))}
out=root/'public/data/population-geography/tagus-context.json';out.write_text(json.dumps(result,separators=(',',':')))
print(len(faces),'faces;',out.stat().st_size,'bytes')
# Bake physical land overrides for illustrated scenes, leaving CAOP admin boundaries intact.
from shapely.geometry import shape
patches={}
for file in (root/'public/data/population-geography/parishes').glob('*.json'):
 for feature in json.loads(file.read_text())['features']:
  g=shape(feature['geometry'])
  if not g.intersects(water) or g.intersection(water).area<.0000001:continue
  dry=g.difference(water)
  if dry.is_empty:continue
  if dry.geom_type=='GeometryCollection':dry=unary_union([p for p in dry.geoms if p.geom_type in ['Polygon','MultiPolygon']])
  patches[feature['properties']['code']]=mapping(orient_all(dry))
path=root/'scripts/data/tagus-parish-land.json';path.parent.mkdir(exist_ok=True);path.write_text(json.dumps(patches,separators=(',',':')))
print('Physical land overrides:',len(patches))
