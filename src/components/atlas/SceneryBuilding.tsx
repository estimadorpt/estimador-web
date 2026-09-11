import type { ParishScenery } from '@/lib/atlas/scenery';
/** Illustrative architecture chosen from the parish's aggregate building profile. */
export function SceneryBuilding({profile,id,selected,compact=false}:{compact?:boolean;profile?:ParishScenery;id:number;selected:boolean}) {
 const urban=profile?.kind==='urban';
 const floors=urban?(profile.highrise>.15?4:3):profile?.kind==='town'?2:1;
 const top=-17-(floors-1)*12;
 const wall=urban?['#e8d9bf','#d8dfcf','#d5c3a3'][id%3]:profile?.coastal?'#f9edce':'#f2e6c4';
 if(compact)return <>
  <path d={`M-16 -3L1 6V${top}L-16 ${top-9}Z`} fill={wall}/>
  <path d={`M1 6L18 -3V${top-9}L1 ${top}Z`} fill={urban?'#a9b3a7':'#bfbea3'}/>
  <path d={Array.from({length:floors},(_,i)=>`M-12 ${-13-i*12}l5 3v-7l-5 -3Z M5 ${-8-i*12}l6 -3v-7l-6 3Z`).join(' ')} fill="#f4c970"/>
  <path d={urban?`M-18 ${top-12}L0 ${top-21} 21 ${top-11} 1 ${top}Z`:`M-20 ${top-7}L-2 ${top-22} 22 ${top-8} 1 ${top+4}Z`} fill={urban?'#bbc3ac':'#bd714e'}/>
 </>;
 return <>
  <path d={`M-16 -3L1 6V${top}L-16 ${top-9}Z`} fill={wall}/><path d={`M1 6L18 -3V${top-9}L1 ${top}Z`} fill={urban?'#a9b3a7':'#bfbea3'}/>
  {Array.from({length:floors},(_,i)=><g key={i} transform={`translate(0 ${-i*12})`}><path d="M-12 -13l5 3v-7l-5 -3Z M5 -8l6 -3v-7l-6 3Z" fill="#f4c970" className="atlas-window" style={{animationDelay:`${-(id+i)%6}s`}}/>{urban&&<path d="M-14 -11l9 5M4 -5l10 -5" stroke="#627b73" strokeWidth="1.5"/>}</g>)}
  <path d="M-3 3v-10l-5 -3v10Z" fill={profile?.coastal?'#397994':'#4c7064'}/>
  <g className="atlas-house-roof" style={{transform:`translateY(${-(floors-1)*12-(selected?16:0)}px)`,opacity:selected?.45:1}}>
   {urban?<><path d="M-18 -27L0 -36 21 -26 1 -15Z" fill="#bbc3ac"/><path d="M-18 -27V-31L1 -19 21 -30V-26L1 -15Z" fill="#e5d9bd"/><path d="M-10 -28l9 -4 8 4 -9 5Z" fill="#658791"/></>:<><path d="M-20 -24L-2 -39 22 -25 1 -13Z" fill="#bd714e"/><path d="M-20 -24L-2 -39 2 -28 -15 -16Z" fill="#e4a479"/><path d="M7 -32v-10l4 -2v11Z" fill="#eee4ca"/></>}
  </g>
 </>;
}
