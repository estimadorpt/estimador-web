'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {Geometry} from 'geojson';
import {interpolateZoom} from 'd3';
import {Minus,Plus,RotateCcw} from 'lucide-react';
import {fitCamera,cameraTransform,flightDuration,householdOverviewOpacity,type CameraView} from '@/lib/atlas/camera';
import {MUNICIPALITIES,municipalityFor} from '@/lib/atlas/geography';
import {worldPath,mainExtent,countryExtent,mapShape,type ParishScene,type PlaceCollection} from '@/lib/atlas/world';
import {sceneryLabel,type SceneryCollection} from '@/lib/atlas/scenery';
import {regionPeople,type Cohort} from '@/lib/atlas/population';
import type {Lens} from '@/lib/miniatura/population';
import {ParishLandscape} from './ParishLandscape';
type PreparedScene=ParishScene&{municipality:string;profile:SceneryCollection['profiles'][string]};
 type DistrictOverview={code:string;municipality:string;homes:ParishScene['homes']}[];
const coastalOpacity=(width:number)=>Math.max(0,Math.min(1,(240-width)/100));
const countryUrl='/data/population-geography/country.json';
export function LocalMap({locale,region,municipality,parish,onRegion,onMunicipality,onParish,onBack,cohort,lens,paused,selectedHouse,selectedPerson,onHouse}:{locale:'pt'|'en';region:string;municipality:string;parish:string;onRegion:(name:string)=>void;onMunicipality:(code:string)=>void;onParish:(code:string)=>void;onBack:()=>void;cohort:Cohort;lens:Lens;paused:boolean;selectedHouse:number|null;selectedPerson:number|null;onHouse:(parish:string,id:number)=>void}) {
 const [compact,setCompact]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:720px)');const update=()=>setCompact(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const pt=locale==='pt',town=municipalityFor(municipality),district=MUNICIPALITIES.find(m=>m.region===region);
 const districtUrl=district?`/data/population-geography/municipalities/${district.regionId}.json`:'';
 const parishUrl=town?`/data/population-geography/parishes/${town.code}.json`:'';
 const [cache,setCache]=useState<Record<string,PlaceCollection>>({});
 const [estuary,setEstuary]=useState<{land:Geometry;water:Geometry;extent:Geometry}|null>(null);
 const estuaryLoaded=useRef(false);
 useEffect(()=>{if(!district||!['11','15','14'].includes(district.regionId)||estuaryLoaded.current)return;let cancelled=false;fetch('/data/population-geography/tagus-context.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(!cancelled){setEstuary(data);estuaryLoaded.current=true;}}).catch(()=>{});return()=>{cancelled=true;};},[district]);
 const estuaryPaths=useMemo(()=>estuary?{land:worldPath(estuary.land)??'',water:worldPath(estuary.water)??'',extent:worldPath(estuary.extent)??''}:null,[estuary]);
 const [prepared,setPrepared]=useState<Record<string,PreparedScene[]>>({});
 const [overview,setOverview]=useState<Record<string,DistrictOverview>>({});
 const preparedRef=useRef(prepared),overviewRef=useRef(overview);preparedRef.current=prepared;overviewRef.current=overview;
 const cameraGroup=useRef<SVGGElement>(null),coastalGroup=useRef<SVGGElement>(null),overviewGroup=useRef<SVGGElement>(null);
 const [scenery,setScenery]=useState<Record<string,SceneryCollection>>({});
 const cacheRef=useRef(cache);cacheRef.current=cache;
 const [error,setError]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(false),[hover,setHover]=useState('');
 const [fullExtent,setFullExtent]=useState(false),[zoom,setZoom]=useState(1),[reset,setReset]=useState(0);
 const [manualView,setManualView]=useState<CameraView|null>(null);const svgRef=useRef<SVGSVGElement>(null);
 const [camera,setCamera]=useState<CameraView|null>(null),[flying,setFlying]=useState(false);
 const cameraRef=useRef<CameraView|null>(null),drag=useRef<{x:number;y:number;camera:CameraView;moved:boolean}|null>(null);
 useEffect(()=>{setManualView(null);setZoom(1);setFullExtent(false);setHover('');},[region,municipality,parish,selectedHouse]);
 useEffect(()=>{
  let cancelled=false;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);setError('');setLoading(true);
  async function load(){
   const read=async(url:string)=>{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error();return response.json();};
   const urls=[countryUrl,districtUrl,parishUrl].filter(url=>url&&!cacheRef.current[url]);
   await Promise.all([
    ...urls.map(async url=>{const data=await read(url);if(data.type!=='FeatureCollection')throw Error();if(!cancelled)setCache(previous=>({...previous,[url]:data}));}),
    ...(district&&!overviewRef.current[district.regionId]?[read(`/data/population-geography/overview/${district.regionId}.json`).then(data=>{if(!cancelled)setOverview(previous=>({...previous,[district.regionId]:data}));})]:[]),
    ...(town&&!preparedRef.current[town.code]?[Promise.all([read(`/data/population-geography/scenery/${town.code}.json`),read(`/data/population-geography/scenes/${town.code}.json`)]).then(([terrain,data])=>{
     if(cancelled)return;const people=regionPeople(town.region);
     setScenery(previous=>({...previous,[town.code]:terrain}));
     setPrepared(previous=>({...previous,[town.code]:data.map((scene:Omit<ParishScene,'people'>)=>({...scene,people,municipality:town.code,profile:terrain.profiles[scene.code]}))}));
    })]:[])
   ]);
  }
  load().catch(()=>{if(!cancelled)setError(pt?'Não foi possível preparar este lugar.':'Could not prepare this place.');}).finally(()=>{clearTimeout(timeout);if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;controller.abort();clearTimeout(timeout);};
 },[districtUrl,parishUrl,municipality,attempt,pt,district,town]);
 // Scene geometry is baked at build time and cached once per municipality.
 const scenes=useMemo(()=>Object.values(prepared).flat(),[prepared]);
 const overviewPaths=useMemo(()=>Object.values(overview).flat().map(scene=>({code:scene.code,d:scene.homes.map(h=>`M${h.x} ${h.y}h.001`).join(''),count:scene.homes.length})),[overview]);
 const selectedScene=scenes.find(s=>s.code===parish);
 const profile=selectedScene?.profile;
 const country=cache[countryUrl],districts=cache[districtUrl],parishes=cache[parishUrl];
 const features=useMemo(()=>parishes?.features??districts?.features??country?.features??[],[parishes,districts,country]);
 // At parish scale use the baked dry-land outline, not administrative water areas.
 const shapes=useMemo(()=>{const landPaths=new Map((prepared[municipality]??[]).map(scene=>[scene.code,scene.path]));return features.map(f=>({...f.properties,...mapShape(f),d:landPaths.get(f.properties.code)??mapShape(f).d}));},[features,prepared,municipality]);
 const backgrounds=useMemo(()=>Object.entries(cache).filter(([url])=>url===countryUrl||url.includes('/municipalities/')).flatMap(([url,c])=>c.features.map(f=>({key:`${url}:${f.properties.code}`,d:mapShape(f).d}))),[cache]);
 const waters=useMemo(()=>Object.entries(scenery).filter(([,data])=>data.water).map(([code,data])=>({code,d:worldPath(data.water!)??''})),[scenery]);
 const level=parish?'parish':municipality?'municipality':region!=='Portugal'?'district':'country';
 const selectedFeature=parishes?.features.find(f=>f.properties.code===parish);
 const geographicView=useMemo(()=>{
  if(region==='Portugal'&&country)return fitCamera(worldPath.bounds(countryExtent(country,fullExtent)));
  if(parish){if(!selectedScene||!selectedFeature)return null;return fullExtent?fitCamera(worldPath.bounds(selectedFeature)):selectedScene.view;}
  if(municipality){const f=districts?.features.find(f=>f.properties.code===municipality);return f?fitCamera(worldPath.bounds(fullExtent?f:mainExtent(f))):null;}
  return districts&&district&&overview[district.regionId]?fitCamera(worldPath.bounds(districts)):null;
 },[region,country,parish,selectedScene,selectedFeature,fullExtent,municipality,districts,district,overview]);
 useEffect(()=>{const svg=svgRef.current;if(!svg)return;const wheel=(event:WheelEvent)=>{if(!event.ctrlKey&&!event.metaKey)return;const current=cameraRef.current;if(!current)return;event.preventDefault();const box=svg.getBoundingClientRect(),pixelScale=Math.min(box.width/1000,box.height/620);const width=Math.max(.5,Math.min(15000,current.width*Math.exp(event.deltaY*.01))),factor=width/current.width;const dx=(event.clientX-box.left-box.width/2)/pixelScale/1000*current.width,dy=(event.clientY-box.top-box.height/2)/pixelScale/1000*current.width;setManualView({x:current.x+dx*(1-factor),y:current.y+dy*(1-factor),width});};svg.addEventListener('wheel',wheel,{passive:false});return()=>svg.removeEventListener('wheel',wheel);},[]);
 const target=useMemo(()=>{
  void reset; // A reset request recentres even when the selected place has not changed.
  if(manualView)return manualView;
  const view=geographicView;if(!view)return null;
  const home=selectedScene?.homes.find(h=>h.id===selectedHouse);
  return {x:home?.x??view.x,y:home?home.y-selectedScene!.unit*18:view.y,width:(home?selectedScene!.unit*1000/(compact?7:2.8):view.width)/zoom};
 },[geographicView,selectedScene,selectedHouse,zoom,manualView,reset,compact]);
 useEffect(()=>{
  if(!target)return;let frame=0;const from=cameraRef.current;
  if(!from||window.matchMedia('(prefers-reduced-motion: reduce)').matches){cameraRef.current=target;setCamera(target);setFlying(false);return;}
  if(Math.hypot(from.x-target.x,from.y-target.y)<.00001&&Math.abs(from.width-target.width)<.00001){setFlying(false);return;}
  const interpolation=interpolateZoom([from.x,from.y,from.width],[target.x,target.y,target.width]);
  const duration=manualView?120:flightDuration(from,target),start=performance.now();let frames=0,maxGap=0,previousFrame=start;setFlying(true);
  const tick=(now:number)=>{if(drag.current?.moved){setFlying(false);return;}const t=Math.min(1,(now-start)/duration),eased=t*t*(3-2*t);const [x,y,width]=interpolation(eased);const next={x,y,width};cameraRef.current=next;const transform=cameraTransform(next);if(cameraGroup.current)cameraGroup.current.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`;coastalGroup.current?.setAttribute('opacity',String(coastalOpacity(width)));overviewGroup.current?.setAttribute('opacity',String(householdOverviewOpacity(width)));frames++;maxGap=Math.max(maxGap,now-previousFrame);previousFrame=now;if(t<1)frame=requestAnimationFrame(tick);else{setCamera(next);setFlying(false);if(cameraGroup.current){cameraGroup.current.dataset.flightFrames=String(frames);cameraGroup.current.dataset.flightMaxGapMs=String(Math.round(maxGap));}}};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[target,manualView]);
 const transform=camera?cameraTransform(camera):null;
 // While a level's shapes are still loading the map shows the coarser ones, so
 // a chosen shape is dispatched by the collection it belongs to, not by the level.
 const choose=(code:string)=>{
  const inCountry=country?.features.find(f=>f.properties.code===code);
  if(inCountry){onRegion(inCountry.properties.name);return;}
  if(districts?.features.some(f=>f.properties.code===code)){onMunicipality(code);return;}
  onParish(code);
 };
 // The next level's shapes (or the parish's scene) must be here before "+" can step into them.
 const ready=level==='country'?!!country:level==='district'?!!districts:level==='municipality'?!!parishes:!!selectedScene;
 const pendingStep=useRef(false);
 const closer=()=>{
  setManualView(null);
  if(selectedHouse!==null){setZoom(z=>Math.min(4,z*1.5));return;}
  if(!ready){pendingStep.current=true;return;} // a press during loading steps as soon as the level arrives
  if(parish&&selectedScene){onHouse(parish,selectedScene.homes[0].id);return;}
  const at=cameraRef.current??camera; // where the camera actually is, even mid-flight
  const central=[...features].sort((a,b)=>{const ac=worldPath.centroid(a),bc=worldPath.centroid(b);return Math.hypot(ac[0]-(at?.x??0),ac[1]-(at?.y??0))-Math.hypot(bc[0]-(at?.x??0),bc[1]-(at?.y??0));})[0];
  if(central)choose(central.properties.code);
 };
 useEffect(()=>{if(pendingStep.current&&ready&&!loading){pendingStep.current=false;closer();}},[ready,loading]); // eslint-disable-line react-hooks/exhaustive-deps
 const title=parish?selectedScene?.name:town?.name??region;
 return <div className="atlas-local-map atlas-living-map atlas-cinematic atlas-continuous-world" data-paused={paused} data-house={selectedHouse!==null} data-flying={flying} data-depth={level} data-scenery={profile?.kind}>
 <div className="atlas-local-caption"><span>{pt?'UM PAÍS. DO TERRITÓRIO À PORTA DE CASA.':'ONE COUNTRY. FROM THE MAP TO THE FRONT DOOR.'}</span><strong>{title}</strong>{profile&&<small className="atlas-scenery-label">{sceneryLabel(profile,pt)}</small>}<p>{pt?(selectedHouse!==null?'A mesma casa. As pessoas que lá vivem.':parish?'Entra numa casa. Conhece quem lá vive.':municipality?'Escolhe uma freguesia para te aproximares.':region==='Portugal'?'Escolhe um distrito ou uma ilha.':'Escolhe um município. Continua a viagem.'):(selectedHouse!==null?'The same home. The people living here.':parish?'Enter a home. Meet the people inside.':municipality?'Choose a parish to move closer.':region==='Portugal'?'Choose a district or an island.':'Choose a municipality. Continue the journey.')}</p>{hover&&!parish&&<small>{hover}</small>}</div>
 {loading&&<span className="atlas-world-loading" role="status">{pt?'A preparar o detalhe…':'Preparing detail…'}</span>}
 {error&&<div className="atlas-world-loading" role="alert">{error} <button onClick={()=>setAttempt(a=>a+1)}>{pt?'Tentar novamente':'Retry'}</button></div>}
 {region==='Portugal'&&country&&<div className="atlas-island-shortcuts"><span>{pt?'EXPLORAR AS ILHAS':'EXPLORE THE ISLANDS'}</span>{country.features.filter(f=>['azores','madeira'].includes(f.properties.code)).map(f=>{const [[x0,y0],[x1,y1]]=worldPath.bounds(f);return <button key={f.properties.code} onClick={()=>onRegion(f.properties.name)}><svg viewBox={`${x0-2} ${y0-2} ${x1-x0+4} ${y1-y0+4}`} aria-hidden="true"><path d={worldPath(f)??''} fill="#9ab29a"/></svg><span>{f.properties.name}</span></button>;})}<button className="atlas-all-territory" onClick={()=>setFullExtent(!fullExtent)}>{fullExtent?(pt?'Focar o continente':'Focus mainland'):(pt?'Ver todo o território':'See all territory')}</button></div>}
 {municipality&&<button className="atlas-extent" onClick={()=>setFullExtent(!fullExtent)}>{fullExtent?(pt?'Aproximar área principal':'Main area'):(pt?'Ver toda a extensão':'Full extent')}</button>}
 <svg ref={svgRef} viewBox="0 0 1000 620" style={{touchAction:zoom>1?'none':'pan-y'}} onPointerDown={event=>{if(event.button===0&&camera)drag.current={x:event.clientX,y:event.clientY,camera,moved:false};}} onPointerMove={event=>{const start=drag.current;if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)<5&&!start.moved)return;start.moved=true;event.currentTarget.setPointerCapture(event.pointerId);const ratio=start.camera.width/event.currentTarget.getBoundingClientRect().width;const next={...start.camera,x:start.camera.x-dx*ratio,y:start.camera.y-dy*ratio};cameraRef.current=next;const transform=cameraTransform(next);if(cameraGroup.current)cameraGroup.current.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`;}} onPointerUp={()=>{if(cameraRef.current)setCamera(cameraRef.current);setTimeout(()=>{drag.current=null;},0);}} onPointerCancel={()=>{drag.current=null;}} onClickCapture={event=>{if(drag.current?.moved){event.preventDefault();event.stopPropagation();}}} aria-label={pt?'Portugal: viagem contínua até às casas':'Portugal: continuous journey into homes'}>
 {transform&&camera&&<g ref={cameraGroup} className="atlas-flight-camera" style={{transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,transformOrigin:'0 0'}}>
 <g pointerEvents="none">{backgrounds.map(f=><path key={f.key} d={f.d} fill="#315746" stroke="#739077" strokeWidth={.45} vectorEffect="non-scaling-stroke"/>)}</g>
 <defs><pattern id="world-water" width="1.4" height=".9" patternUnits="userSpaceOnUse"><path d="M0 .45q.35 -.15 .7 0t.7 0" fill="none" stroke="#96c9c5" strokeWidth=".025" opacity=".25"/></pattern></defs>
 <g ref={coastalGroup} opacity={coastalOpacity(camera.width)}><g pointerEvents="none">{waters.map(({code,d})=><g key={code}><path d={d} fill="#245c68"/><path className="atlas-water-surface" d={d} fill="url(#world-water)"/></g>)}</g>
 {estuaryPaths&&<g pointerEvents="none" className="atlas-estuary-context"><path d={estuaryPaths.extent} fill="#315746"/><path d={estuaryPaths.water} fill="#245c68"/><path className="atlas-water-surface" d={estuaryPaths.water} fill="url(#world-water)"/></g>}
 </g>
 {shapes.map(f=><path key={f.code} d={f.d} className="atlas-region atlas-local-boundary" fill="transparent" stroke="#96af8f" style={{strokeWidth:.6}} role="button" tabIndex={0} aria-pressed={f.code===parish} aria-label={`${pt?'Explorar':'Explore'} ${f.name}`} onClick={()=>choose(f.code)} onMouseEnter={()=>setHover(f.name)} onMouseLeave={()=>setHover('')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(f.code);}}}><title>{f.name}</title></path>)}
 {scenes.filter(scene=>scene.code===parish||[camera,target].some(view=>view&&scene.unit*1000/view.width>.38&&Math.abs(scene.view.x-view.x)<(scene.view.width+view.width)*.8&&Math.abs(scene.view.y-view.y)<(scene.view.width+view.width)*1.2)).map(scene=><ParishLandscape key={scene.code} scene={scene} profile={scene.profile} selected={scene.code===parish} selectedHouse={selectedHouse} selectedPerson={selectedPerson} cohort={cohort} lens={lens} pt={pt} interactive={scene.code===parish} detailed={scene.code===parish&&scene.unit*transform.scale>.38} onHouse={onHouse}/>)}
 <g ref={overviewGroup} opacity={householdOverviewOpacity(camera.width)} pointerEvents="none" className="atlas-household-overview">{overviewPaths.filter(p=>!scenes.some(s=>s.code===p.code&&s.unit*transform.scale>.38)).map(p=><path key={p.code} data-overview-parish={p.code} data-households={p.count} d={p.d} fill="none" stroke="#d9c397" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>)}</g>
 <g pointerEvents="none" className="atlas-local-labels" style={{fontSize:12/transform.scale,strokeWidth:2/transform.scale}}>{!parish&&shapes.map(f=>(f.bounds[1][0]-f.bounds[0][0])*transform.scale>Math.max(35,f.name.length*5)?<text key={f.code} x={f.center[0]} y={f.center[1]} textAnchor="middle">{f.name}</text>:null)}</g>
 </g>}
 </svg>
 {estuaryPaths&&<a className="atlas-map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>}
 {profile&&<details className="atlas-scenery-source"><summary>{pt?'Porque é esta paisagem?':'Why this landscape?'}</summary><p>{pt?'Cenário ilustrativo escolhido pela densidade e pelos tipos de edifícios da freguesia nos Censos 2021. Ruas e vegetação ilustradas; costa e estuários aproximados.':'Illustrative scenery chosen from the parish’s 2021 density and building types. Streets and vegetation are illustrated; coast and estuaries are approximate.'}</p><p><a href="https://mapas.ine.pt/download/index2021.phtml" target="_blank" rel="noreferrer">INE · Censos 2021</a> · <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/" target="_blank" rel="noreferrer">Natural Earth</a></p></details>}
 <div className="atlas-voyage-progress" aria-label={pt?'Escala da viagem':'Journey scale'}>{(pt?['País','Distrito','Município','Freguesia','Casa']:['Country','District','Municipality','Parish','Home']).map((label,i)=><span key={label} data-active={i===(selectedHouse!==null?4:parish?3:municipality?2:region==='Portugal'?0:1)}><i/>{label}</span>)}</div>
 <div className="atlas-living-controls"><span>{pt?'Geografia real · casas e pessoas ilustrativas':'Real geography · illustrative homes and people'}</span><button aria-label={pt?'Repor aproximação':'Reset zoom'} onClick={()=>{setManualView(null);setZoom(1);setReset(n=>n+1);}}><RotateCcw size={15}/></button><button aria-label={pt?'Reduzir':'Zoom out'} disabled={region==='Portugal'&&zoom<=1&&!manualView} onClick={()=>{setManualView(null);if(zoom>1)setZoom(z=>Math.max(1,z/1.5));else onBack();}}><Minus size={16}/></button><span>{pt?'Aproximar':'Explore'}</span><button aria-label={pt?'Ampliar':'Zoom in'} disabled={zoom>=4} onClick={closer}><Plus size={16}/></button></div>
 </div>;
}
