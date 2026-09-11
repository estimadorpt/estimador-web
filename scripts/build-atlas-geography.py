"""Build browser geography from the local public CAOP 2021 shapefiles (no population data)."""
import json, sys
from pathlib import Path
import geopandas as gpd
import pandas as pd
from shapely.geometry.polygon import orient
from shapely.geometry import Polygon, MultiPolygon

source=Path(sys.argv[1]); root=Path(__file__).resolve().parents[1]
frames=[]
for path in sorted(source.glob('*.shp')):
    frame=gpd.read_file(path).to_crs(4326)
    print(path.name, len(frame), list(frame.columns))
    frame=frame.rename(columns={'Dicofre':'code','DICOFRE':'code','Freguesia':'name','FREGUESIA':'name','Concelho':'municipality','CONCELHO':'municipality','Distrito':'region','DISTRITO':'region','Ilha':'island','ILHA':'island'})
    if 'region' not in frame: frame['region']='Madeira' if 'Madeira' in path.name else 'Açores'
    if 'Madeira' in path.name: frame['region']='Madeira'
    if 'Acores' in path.name: frame['region']='Açores'
    frames.append(frame[['code','name','municipality','region','geometry']])
df=gpd.GeoDataFrame(pd.concat(frames,ignore_index=True),crs=4326)
df['code']=df.code.astype(str).str.zfill(6)
df=df.dissolve(by='code',as_index=False)
assert len(df)==3092,len(df)
df['municipalityCode']=df.code.str[:4]
# D3 uses clockwise exterior rings for small spherical polygons.
def clockwise(geom):
    if isinstance(geom,Polygon):return orient(geom,sign=-1)
    if isinstance(geom,MultiPolygon):return MultiPolygon([orient(p,sign=-1) for p in geom.geoms])
    raise ValueError(geom.geom_type)
def write_geo(frame,path):
    frame=frame.copy();frame.geometry=frame.geometry.simplify(.0004,preserve_topology=True).map(clockwise)
    obj=json.loads(frame.to_json(drop_id=True))
    def rounded(v):
        if isinstance(v,float):return round(v,5)
        if isinstance(v,list):return [rounded(x) for x in v]
        if isinstance(v,dict):return {k:rounded(x) for k,x in v.items()}
        return v
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(rounded(obj),ensure_ascii=False,separators=(',',':')))
mun=df.dissolve(by='municipalityCode',as_index=False)
index={'vintage':'CAOP 2021','source':'Direção-Geral do Território — CAOP 2021','municipalities':[]}
out=root/'public/data/population-geography'
for region,group in mun.groupby('region'):
    regionid='azores' if region=='Açores' else 'madeira' if region=='Madeira' else group.iloc[0].municipalityCode[:2]
    shapes=group[['municipalityCode','municipality','geometry']].rename(columns={'municipalityCode':'code','municipality':'name'})
    write_geo(shapes,out/'municipalities'/f'{regionid}.json')
    for _,row in group.iterrows():
        children=df[df.municipalityCode==row.municipalityCode]
        index['municipalities'].append({'code':row.municipalityCode,'name':row.municipality,'region':region,'regionId':regionid,'parishes':[{'code':r.code,'name':r['name']} for _,r in children.iterrows()]})
        write_geo(children[['code','name','geometry']],out/'parishes'/f'{row.municipalityCode}.json')
assert len(index['municipalities'])==308
(root/'src/lib/atlas/places.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
print('Exported',len(mun),'municipalities,',len(df),'parishes')
