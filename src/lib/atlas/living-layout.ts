import { geoArea,geoBounds,geoCentroid,geoContains } from 'd3';
import type { Feature,Geometry } from 'geojson';
/** Deterministic illustrative positions; never real home coordinates. */
export function interiorPoint(feature:Feature<Geometry>,seed:number):[number,number]{
 const pieces=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates.map(coordinates=>({type:'Polygon' as const,coordinates})):[feature.geometry];
 const polygon=pieces.sort((a,b)=>geoArea(b)-geoArea(a))[0];
 const [[x0,y0],[x1,y1]]=geoBounds(polygon);
 const fraction=(n:number)=>{const v=Math.sin(n)*43758.5453;return v-Math.floor(v);};
 for(let i=0;i<3000;i++){const n=seed*3109+i*17+1;const point:[number,number]=[x0+(x1-x0)*fraction(n*12.9898),y0+(y1-y0)*fraction(n*7.233)];if(geoContains(polygon,point))return point;}
 return geoCentroid(polygon);
}
