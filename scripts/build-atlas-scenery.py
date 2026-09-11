"""Derive illustrative scenery profiles from public census totals and land outlines.
Usage: python scripts/build-atlas-scenery.py BGRI_SECTION_XLSX NATURAL_EARTH_LAND_ZIP
No synthetic or person-level records are read. Thresholds are design rules, not TIPAU.
"""
import json, sys
from pathlib import Path
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, box, mapping, Polygon, MultiPolygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
from pyproj import Geod

root=Path(__file__).resolve().parents[1]
base=root/'public/data/population-geography'
cols=['FREGUESIA','SECCAO','N_INDIVIDUOS','N_EDIFICIOS_CLASSICOS','N_EDIFICIOS_CLASSICOS_3OUMAIS_ALOJ','N_EDIFICIOS_5OU_MAIS_PISOS']
f=pd.read_json(sys.argv[1]) if sys.argv[1].endswith('.json') else pd.read_excel(sys.argv[1],header=1,usecols=cols)
f=f[f.FREGUESIA.notna() & f.SECCAO.isna()].copy()
f['code']=f.FREGUESIA.map(lambda v: str(int(float(v))).zfill(6) if str(v).replace('.','',1).isdigit() else str(v))
assert len(f)==3092 and f.code.nunique()==3092
stats=f.set_index('code').to_dict('index')
collections={p.stem:json.loads(p.read_text()) for p in sorted((base/'parishes').glob('*.json'))}
all_shapes=[shape(f['geometry']) for c in collections.values() for f in c['features']]
portugal=unary_union(all_shapes)
land=gpd.read_file(sys.argv[2],bbox=(-32,29,-5,43)).geometry.union_all()
# CAOP wins wherever the coarser Natural Earth coastline cuts into a parish.
land=unary_union([land,portugal])
geod=Geod(ellps='WGS84')
def clockwise(g):
 if isinstance(g,Polygon):return orient(g,sign=-1)
 if isinstance(g,MultiPolygon):return MultiPolygon([orient(p,sign=-1) for p in g.geoms])
 return g
out=base/'scenery';out.mkdir(exist_ok=True)
counts={};profiles={}
for code,c in collections.items():
 municipal=unary_union([shape(f['geometry']) for f in c['features']])
 x0,y0,x1,y1=municipal.bounds
 viewport=box(x0-.15,y0-.15,x1+.15,y1+.15)
 water=viewport.difference(land).simplify(.0001,preserve_topology=True)
 profiles={}
 for feature in c['features']:
  p=feature['properties']['code'];g=shape(feature['geometry']);s=stats[p]
  area=abs(geod.geometry_area_perimeter(g)[0])/1e6
  density=float(s['N_INDIVIDUOS'])/area
  buildings=float(s['N_EDIFICIOS_CLASSICOS'])
  apartments=float(s['N_EDIFICIOS_CLASSICOS_3OUMAIS_ALOJ'])/max(buildings,1)
  highrise=float(s['N_EDIFICIOS_5OU_MAIS_PISOS'])/max(buildings,1)
  kind='urban' if density>=1500 or apartments>=.55 else 'rural' if density<300 and apartments<.2 else 'town'
  # Approximately 500m at Portuguese latitudes. This is coastal proximity, not beachfront.
  coastal=not water.is_empty and g.distance(water)<.005
  profiles[p]={'kind':kind,'coastal':coastal,'density':round(density),'apartments':round(apartments,3),'highrise':round(highrise,3),'latitude':round(g.representative_point().y,3)}
  counts[kind]=counts.get(kind,0)+1
 data={'vintage':'2021','profiles':profiles,'water':None if water.is_empty else mapping(clockwise(water))}
 (out/f'{code}.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Exported',len(collections),'municipalities:',counts)
for code in ['1106','0808','0204','1001']:
 print(code,json.loads((out/f'{code}.json').read_text())['profiles'])
