import type { CSSProperties } from 'react';
import type { Neighbourhood } from '@/lib/miniatura/population';
import { houseShape } from './hit-test';

/**
 * The miniatura's drawing pieces, shared by the explainer's Scene and the parish
 * page's "Bate à porta" village: a house (its walls, windows and roof, which lifts
 * when the house is open) and a person. Neither carries a role or a label: the
 * caller wraps them.
 */

/** One colour per age band (0–17, 18–39, 40–64, 65+), in that order. */
export const COLOURS = ['#d79749', '#347c79', '#b96349', '#7875a0'];
export const SKINS = ['#c29370', '#e0b18c', '#a87656'];

export function ageBand(age: number) {
  return age < 18 ? 0 : age < 40 ? 1 : age < 65 ? 2 : 3;
}

/** A house drawn around its anchor (0, 0); `id` picks its colours and floors. */
export function HouseArt({ id, neighbourhood, selected, glow = '#e7b35c' }: { id: number; neighbourhood: Neighbourhood; selected: boolean; glow?: string | null }) {
  const urban=neighbourhood==='city',stone=neighbourhood==='hills',coast=neighbourhood==='town';
  const { floors, height } = houseShape(id, neighbourhood);
  const wall=urban?['#d7dcd5','#d2b88f','#b6c6c5','#d3b2a6'][id%4]:stone?['#a8a89c','#bab5a4','#999e96'][id%3]:coast?['#f9f3dc','#d5e2dd','#ece5c7'][id%3]:'#f5ecd6';
  return <>
    <ellipse className="mini-house-target" cx="6" cy="5" rx="40" ry="34" fill="transparent" />
    {selected && glow && <ellipse cx="6" cy="10" rx="39" ry="23" fill={glow} opacity=".55"/>}
    <ellipse cx="18" cy="24" rx="36" ry="12" fill="#40564b" opacity=".12" />
    <path d={`M-24 1 L5 17 L5 ${17-height} L-24 ${1-height}Z`} fill={wall} />
    <path d={`M5 17 L31 2 L31 ${2-height} L5 ${17-height}Z`} fill="#d4c8af" />
    {stone&&[0,1,2,3].map(row=><path key={row} d={`M-23 ${-row*8}l27 15M-12 ${-row*8+4}v-7`} fill="none" stroke="#7e847b" strokeWidth=".7"/>)}
    {[...Array(floors)].map((_,floor)=><g key={floor} transform={`translate(0 ${-floor*16})`}>
      <path d="M-18 -3l7 4v-10l-7 -4Z M-5 4l7 4v-10l-7 -4Z M12 9l9 -5v-10l-9 5Z" fill={stone?'#515f58':'#537d79'}/>
      {urban&&<><path d="M-21 0l25 14 5 -3 -25 -14Z" fill="#e5e5d6"/><path d="M-20 -3l25 14v-5l-25 -14Z" fill="none" stroke="#677e77" strokeWidth="1"/></>}
    </g>)}
    {coast&&[0,1,2,3].map(i=><path key={i} d={`M${-23+i*7} 1v${-height}l3 2v${height}Z`} fill={id%2?'#6a9caf':'#c96f57'} opacity=".35"/>)}
    <path d="M12 11l7 -4v-14l-7 4Z" fill="#617866"/>
    <path d="M-23 2l27 15v-4l-27 -15Z" fill={stone?'#7e8375':coast?'#5992a6':urban?'#758f8b':'#487cac'}/>
    <g className="mini-roof" style={{transform:selected?'translateY(-35px)':'translateY(0)',opacity:selected?.25:1}}>
      {urban?<><path d={`M-27 ${1-height}l29 17 32 -17 -30 -17Z`} fill="#c0c5ba"/><path d={`M-27 ${1-height}v-5l29 17 32 -17v5l-32 17Z`} fill="#e6e6d6"/><path d={`M-12 ${-height-2}l11 6 8 -5 -11 -6Z`} fill="#699090"/><path d={`M16 ${-height-7}v-18m-6 6h12`} stroke="#61726e" fill="none" strokeWidth="1.5"/></>:
      <><path d={`M-29 ${2-height}L-3 ${-17-height}L35 ${1-height}L5 ${20-height}Z`} fill={stone?'#66736c':'#b86b51'}/><path d={`M-29 ${2-height}L-3 ${-17-height}L3 ${-5-height}L-23 ${13-height}Z`} fill={stone?'#87918a':'#d88762'}/>{[0,1,2,3].map(i=><path key={i} d={`M${-20+i*8} ${-4-height+i*4}l24 13`} stroke={stone?'#505f58':'#a6533d'} strokeWidth="1.2" opacity=".5"/>)}{!coast&&<path d={`M14 ${-height}v-17l8 4v17Z`} fill={stone?'#b4b5a4':'#f1e7ca'}/>}</>}
    </g>
    {coast&&id%3===0&&<path d="M-28 3l30 17 7 -4 -30 -17Z" fill="#5f8ea5"/>}
    {neighbourhood==='village'&&<><path d="M-33 18l26 15" stroke="#9ca674" strokeWidth="7"/><circle cx="-26" cy="11" r="6" fill="#99a77b"/></>}
  </>;
}

/** A person, standing at (0, 0): shadow, legs, body in `colour`, head and hair. */
export function Figure({ colour, skin, grey, legsClassName, style, className }: { colour: string; skin: string; grey: boolean; legsClassName?: string; style?: CSSProperties; className?: string }) {
  return <g className={className} style={style}>
    <ellipse cy="4" rx="4.5" ry="2" fill="#375247" opacity=".2" />
    <path className={legsClassName} d="M-1 0 l-1 4 M1 0 l1 4" stroke="#354d46" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M-3 -7 Q0 -9 3 -7 L3 0 L-3 0Z" fill={colour} />
    <circle cy="-11" r="3.1" fill={skin} />
    <path d="M-3 -12 Q-2 -16 2 -14 L3 -12" fill={grey ? '#d7d4c7' : '#665444'} />
  </g>;
}
