import {geoMercator,geoPath,geoContains,geoArea,geoCentroid,geoDistance} from 'd3';
import type {Feature,Geometry,FeatureCollection} from 'geojson';
import {interiorPoint} from './living-layout';
import {fitCamera} from './camera';
import {regionPeople} from './population';
export type PlaceFeature=Feature<Geometry,{code:string;name:string}>;
export type PlaceCollection=FeatureCollection<Geometry,{code:string;name:string}>;
export const worldProjection=geoMercator().scale(20000).translate([0,0]);
export const worldPath=geoPath(worldProjection);
export function mainExtent(feature:PlaceFeature) {
 const pieces=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates.map(coordinates=>({...feature,geometry:{type:'Polygon' as const,coordinates}})):[feature];
 pieces.sort((a,b)=>geoArea(b)-geoArea(a));const anchor=geoCentroid(pieces[0]);
 const nearby=pieces.filter(p=>geoDistance(geoCentroid(p),anchor)<.02);
 return {type:'FeatureCollection' as const,features:nearby};
}
/** Positions and drawing units depend only on this parish, never on camera or selection. */
export function parishScene(feature:PlaceFeature,region:string) {
 const extent=mainExtent(feature),view=fitCamera(worldPath.bounds(extent)),unit=0.02;
 const people=regionPeople(region),homes:{id:number;x:number;y:number}[]=[];
 for(const id of new Set(people.map(p=>p.household))){
  let best=worldProjection(interiorPoint(feature,id+1))!,score=-Infinity;
  for(let attempt=0;attempt<35;attempt++){
   const point=worldProjection(interiorPoint(feature,id+1+attempt*71))!;
   const distance=homes.length?Math.min(...homes.map(h=>Math.hypot(h.x-point[0],h.y-point[1])))/unit:100;
   const inside=[[-25,-80],[25,-80],[-25,24],[25,24]].every(([dx,dy])=>geoContains(feature,worldProjection.invert!([point[0]+dx*unit,point[1]+dy*unit])));
   const value=distance+(inside?70:0);if(value>score){best=point;score=value;}if(inside&&distance>90)break;
  }
  homes.push({id,x:best[0],y:best[1]});
 }
 const greenery=Array.from({length:85},(_,i)=>{const point=worldProjection(interiorPoint(feature,18000+i))!;return {x:point[0],y:point[1],id:i};}).filter(p=>homes.every(h=>Math.hypot(h.x-p.x,h.y-p.y)>35*unit));
 return {code:feature.properties.code,name:feature.properties.name,region,view,unit,homes,people,greenery,path:worldPath(feature)??''};
}
export type ParishScene=ReturnType<typeof parishScene>;

export function countryExtent(country:PlaceCollection,includeIslands=false):PlaceCollection {
 return includeIslands?country:{...country,features:country.features.filter(f=>!['azores','madeira'].includes(f.properties.code))};
}

const shapeCache=new WeakMap<PlaceFeature,{d:string;center:[number,number];bounds:[[number,number],[number,number]]}>();
/** Preserve prepared paths when another municipality is added to the browser cache. */
export function mapShape(feature:PlaceFeature){
 let prepared=shapeCache.get(feature);
 if(!prepared){prepared={d:worldPath(feature)??'',center:worldPath.centroid(feature),bounds:worldPath.bounds(feature)};shapeCache.set(feature,prepared);}
 return prepared;
}
