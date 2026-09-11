import {memo,type CSSProperties} from 'react';
import type {ParishScene} from '@/lib/atlas/world';
import {sceneryPalette,type ParishScenery} from '@/lib/atlas/scenery';
import {matches,type Cohort} from '@/lib/atlas/population';
import {groupFor,type Lens} from '@/lib/miniatura/population';
import {SceneryBuilding} from './SceneryBuilding';
import {ATLAS_COLOURS} from './AtlasMap';
export const ParishLandscape=memo(function ParishLandscape({scene,profile,selected,selectedHouse,selectedPerson,cohort,lens,onHouse,pt,interactive,detailed}:{scene:ParishScene;profile?:ParishScenery;selected:boolean;selectedHouse:number|null;selectedPerson:number|null;cohort:Cohort;lens:Lens;onHouse:(parish:string,id:number)=>void;pt:boolean;interactive:boolean;detailed:boolean}) {
 const {unit,code}=scene,palette=sceneryPalette(profile);
 return <g data-parish-scene={code}>
 <defs><clipPath id={`ground-${code}`}><path d={scene.path}/></clipPath><pattern id={`fields-${code}`} width={28*unit} height={28*unit} patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><path d={`M0 0V${28*unit}`} stroke={palette.field} strokeWidth={2*unit} opacity=".5"/></pattern></defs>
 <g pointerEvents="none" clipPath={`url(#ground-${code})`}>
 <path d={scene.path} fill={palette.ground}/>
 {profile?.kind==='rural'&&<path d={scene.path} fill={`url(#fields-${code})`}/>}
 {detailed&&scene.greenery.filter(t=>profile?.kind!=='urban'||t.id%2===0).map(tree=><g key={tree.id} transform={`translate(${tree.x} ${tree.y}) scale(${unit})`}>
 {profile?.kind==='urban'&&<ellipse rx="13" ry="8" fill={palette.field} opacity=".75"/>}<ellipse cy="4" rx="7" ry="3" fill="#153b2c" opacity=".3"/><path d="M0 3v-10" stroke="#a2a17a" strokeWidth="2"/><g className="atlas-scene-tree" style={{animationDelay:`${-tree.id%7}s`}}><ellipse cy="-9" rx={profile?.coastal?8:6} ry={profile?.coastal?5:8} fill={palette.tree}/><ellipse cx="-2" cy="-12" rx="4" ry="5" fill={palette.field} opacity=".7"/></g></g>)}
 {scene.homes.slice(1).map((home,i)=>{const previous=scene.homes.slice(0,i+1).sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y))[0];return <path key={home.id} d={profile?.kind==='urban'?`M${previous.x} ${previous.y+12*unit}H${home.x}V${home.y+12*unit}`:`M${previous.x} ${previous.y+12*unit}Q${home.x} ${previous.y+12*unit} ${home.x} ${home.y+12*unit}`} stroke={palette.road} strokeWidth={(profile?.kind==='urban'?7:4)*unit} fill="none" opacity=".65"/>;})}
 </g>
 {scene.homes.map(home=><g key={home.id} data-home={`${code}:${home.id}`} transform={`translate(${home.x} ${home.y}) scale(${unit})`}>
 <g className="atlas-home-building" role={interactive?'button':undefined} tabIndex={interactive?0:-1} pointerEvents={interactive?'auto':'none'} aria-label={`${pt?'Entrar na casa':'Enter home'} ${home.id+1}`} aria-pressed={selected&&selectedHouse===home.id} onClick={()=>onHouse(code,home.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onHouse(code,home.id);}}}>
 <ellipse cy="-25" rx="25" ry="55" fill="transparent"/><ellipse cy="11" rx="20" ry="7" fill="#0c2625" opacity=".4"/>{selected&&selectedHouse===home.id&&<ellipse rx="24" ry="21" fill="#dfbd6744" stroke="#efd084"/>}<SceneryBuilding profile={profile} id={home.id} selected={selected&&selectedHouse===home.id} compact={!detailed}/></g>
 </g>)}
 <g pointerEvents="none">{scene.people.map(person=>{const home=scene.homes.find(h=>h.id===person.household)!;return <g key={person.key} data-person={`${code}:${person.key}`} transform={`translate(${home.x+(-13+person.member*8)*unit} ${home.y+22*unit}) scale(${unit})`} opacity={matches(person,cohort)?1:.12}>{detailed?<g className="atlas-resident-figure" style={{'--walk':`${person.id%2?26:-26}px`,'--duration':`${7+person.id%7}s`,'--delay':`${-person.id%11}s`} as CSSProperties}>{selected&&selectedPerson===person.id&&<ellipse cy="-3" rx="6" ry="11" fill="#ffe49a44" stroke="#ffe49a"/>}<ellipse cy="3" rx="3" ry="1.4" fill="#0d2c24" opacity=".4"/><path d="M-1 0v3M1 0v3" stroke="#d6cfb4" strokeWidth="1" className="atlas-walking-legs"/><path d="M-2 -5h4v6h-4Z" fill={ATLAS_COLOURS[groupFor(person,lens)]}/><circle cy="-7" r="2.1" fill="#dfbc94"/></g>:<circle cy="-4" r="2.5" fill={ATLAS_COLOURS[groupFor(person,lens)]}/>}</g>;})}</g>
 </g>;
});
