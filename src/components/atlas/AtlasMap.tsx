'use client';
import { useEffect, useMemo, useState } from 'react';
import { geoBounds, geoCentroid, geoContains, geoMercator, geoPath } from 'd3';
import { feature } from 'topojson-client';
import { useTopoJsonData } from '@/hooks/useTopoJsonData';
import { getRegionForIsland } from '@/lib/geography/regionMapping';
import { ATLAS_PEOPLE, matches, distributionPositions, type Cohort } from '@/lib/atlas/population';
import { FIELD_LABELS, groupFor, type Lens } from '@/lib/miniatura/population';
import { MarkLoading } from '@/components/brand/MarkLoading';
export const ATLAS_COLOURS = ['#e5b958','#72c8b4','#a9b9ed','#e29a83'];
export function AtlasMap({ locale, region, cohort, lens, distribution, paused, onRegion }: { locale:'pt'|'en'; region:string; cohort:Cohort; lens:Lens; distribution:boolean; paused:boolean; onRegion:(region:string)=>void }) {
  const [compact,setCompact]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(max-width:720px)');const update=()=>setCompact(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  const { portugalTopoJson, isLoading, error, retry }=useTopoJsonData();
  const geometry=useMemo(()=>{
    if(!portugalTopoJson)return null;
    const collection=feature(portugalTopoJson,portugalTopoJson.objects.ilhasGeo2);
    const projection=geoMercator().fitExtent([[65,35],[675,550]],collection), path=geoPath(projection);
    const regions=collection.features.map(f=>({name:getRegionForIsland(f.properties.NAME_1),path:path(f)??'',centroid:path.centroid(f),bounds:path.bounds(f)}));
    const dots=ATLAS_PEOPLE.map((person,i)=>{
      const shapes=collection.features.filter(f=>getRegionForIsland(f.properties.NAME_1)===person.region);
      const shape=shapes[i%shapes.length];const [[x0,y0],[x1,y1]]=geoBounds(shape);
      let coordinate=geoCentroid(shape);
      for(let k=0;k<240;k++){
        const seed=i*241+k*17+1;
        // Use deterministic rejection sampling inside the real boundary.
        const fraction=(n:number)=>{const v=Math.sin(n)*43758.5453;return v-Math.floor(v);};
        const candidate:[number,number]=[x0+(x1-x0)*fraction(seed*12.9898),y0+(y1-y0)*fraction(seed*7.233)];
        if(geoContains(shape,candidate)){coordinate=candidate;break;}
      }
      const point=projection(coordinate)??[0,0];return {person,x:point[0],y:point[1]};
    });
    return {regions,dots};
  },[portugalTopoJson]);
  const positions=useMemo(()=>distributionPositions(lens,compact),[lens,compact]);
  const pt=locale==='pt';
  if(isLoading)return <div className="atlas-loading" role="status"><MarkLoading height={28} color="#eeeadd" ground="#122f2c"/>{pt?'A desenhar Portugal…':'Drawing Portugal…'}</div>;
  if(error||!geometry)return <div className="atlas-loading" role="alert"><p>{pt?'O mapa não carregou. Podes explorar os lugares através da lista.':'The map did not load. You can explore places using the selector.'}</p><button onClick={retry}>{pt?'Tentar novamente':'Try again'}</button></div>;
  const chosen=geometry.regions.filter(r=>r.name===region);
  let scale=1,tx=0,ty=0;
  if(chosen.length&&!distribution){const x0=Math.min(...chosen.map(r=>r.bounds[0][0])),y0=Math.min(...chosen.map(r=>r.bounds[0][1])),x1=Math.max(...chosen.map(r=>r.bounds[1][0])),y1=Math.max(...chosen.map(r=>r.bounds[1][1]));scale=Math.min(4,480/Math.max(x1-x0,y1-y0));tx=370-(x0+x1)/2*scale;ty=315-(y0+y1)/2*scale;}
  return <svg className="atlas-map" viewBox="0 0 740 600" aria-label={pt?'Portugal: distritos e regiões autónomas, com pessoas fictícias':'Portugal: districts and autonomous regions, with fictional people'} data-paused={paused}>
    <defs><radialGradient id="atlas-sea"><stop stopColor="#244e49"/><stop offset="1" stopColor="#112e2d"/></radialGradient></defs>
    <rect width="740" height="600" fill="url(#atlas-sea)"/>
    <g className="atlas-camera" style={{transform:`translate(${tx}px,${ty}px) scale(${scale})`}}>
    <g className="atlas-geography" aria-hidden={distribution} style={{opacity:distribution?0:1,pointerEvents:distribution?'none':'auto'}}>
      {geometry.regions.map((r,i)=><path key={i} d={r.path} className="atlas-region" fill={region===r.name?'#496652':'#23483f'} stroke={region===r.name?'#efd69b':'#638375'} strokeWidth={region===r.name?2:0.7} role="button" tabIndex={distribution?-1:0} aria-label={`${pt?'Explorar':'Explore'} ${r.name}`} aria-pressed={region===r.name} onClick={()=>onRegion(r.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRegion(r.name);}}}><title>{r.name}</title></path>)}
      {region==='Portugal'&&<text x="64" y="565" className="atlas-map-note">{pt?'Açores e Madeira em posições aproximadas no enquadramento':'Azores and Madeira repositioned within the frame'}</text>}
    </g>
    <g pointerEvents="none">{geometry.dots.map(({person,x,y},i)=>{
      const visible=(region==='Portugal'||region===person.region)&&matches(person,cohort), target=distribution?positions[i]:{x,y};
      return <g key={person.key} className="atlas-particle" style={{transform:`translate(${target.x}px,${target.y}px)`,opacity:visible?1:.07}}><circle r={distribution?3:2.35/Math.sqrt(scale)} fill={ATLAS_COLOURS[groupFor(person,lens)]}/>{visible&&!distribution&&i%11===0&&<circle className="atlas-ripple" r="3" fill="none" stroke={ATLAS_COLOURS[groupFor(person,lens)]} style={{animationDelay:`${-i%7}s`}}/>}</g>;
    })}</g>
    {distribution&&<g className="atlas-group-labels">{FIELD_LABELS[locale][lens].map((label,i)=><text key={label} x={compact?65+(i%2)*350:55+i*171} y={compact?110+Math.floor(i/2)*250:103} fill={ATLAS_COLOURS[i]}>{label}</text>)}</g>}
    {!distribution&&region==='Portugal'&&<g pointerEvents="none" className="atlas-map-labels">{['Porto','Lisboa','Faro','Bragança'].map(name=>{const r=geometry.regions.find(r=>r.name===name);return r?<text key={name} x={r.centroid[0]+9} y={r.centroid[1]-12}>{name}</text>:null;})}<text x="99" y="272">AÇORES</text><text x="168" y="450">MADEIRA</text></g>}
    </g>
  </svg>;
}
