import { useId, useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { FIELD_LABELS, HOUSEHOLDS, PEOPLE, neighbourhoodPosition, exploredPosition, distribution, groupFor, type Lens, type Neighbourhood, type View } from '@/lib/miniatura/population';

import { Landscape } from './Landscape';

export const COLOURS = ['#d79749', '#347c79', '#b96349', '#7875a0'];
function House({ id, neighbourhood, selected, onSelect, locale }: { id: number; neighbourhood: Neighbourhood; selected: boolean; onSelect?: () => void; locale: 'pt' | 'en' }) {
  const { x, y } = neighbourhoodPosition(id, neighbourhood);
  const urban=neighbourhood==='city',stone=neighbourhood==='hills',coast=neighbourhood==='town';
  const floors=urban?3+id%3:coast?1+id%2:1;
  const height=urban?28+floors*16:coast?29+(id%2)*14:stone?32:24;
  const wall=urban?['#d7dcd5','#d2b88f','#b6c6c5','#d3b2a6'][id%4]:stone?['#a8a89c','#bab5a4','#999e96'][id%3]:coast?['#f9f3dc','#d5e2dd','#ece5c7'][id%3]:'#f5ecd6';
  return <g className={`mini-house ${selected ? 'mini-house-selected' : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `${locale === 'pt' ? 'Entrar no agregado' : 'Enter household'} ${id + 1}` : undefined} aria-pressed={onSelect ? selected : undefined} onClick={onSelect} onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(); } }}>
    <ellipse className="mini-house-target" cx="6" cy="5" rx="40" ry="34" fill="transparent" />
    {selected && <ellipse cx="6" cy="10" rx="39" ry="23" fill="#e7b35c" opacity=".55"/>}
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
    {selected&&<text x="3" y={-height-43} textAnchor="middle" fontSize="12" fill="#244f42" fontFamily="Manrope, system-ui, sans-serif">{locale==='pt'?'Casa':'Home'} {id+1}</text>}
    {coast&&id%3===0&&<path d="M-28 3l30 17 7 -4 -30 -17Z" fill="#5f8ea5"/>}
    {neighbourhood==='village'&&<><path d="M-33 18l26 15" stroke="#9ca674" strokeWidth="7"/><circle cx="-26" cy="11" r="6" fill="#99a77b"/></>}

  </g>;
}
export type Camera = { x: number; y: number; scale: number };
export function Scene({ view, alone, paused, locale, svgRef, neighbourhood = 'town', lens = 'age', selectedHouse = null, selectedPerson = null, selectedGroup = null, onHouseSelect, camera = { x: 0, y: 0, scale: 1 }, onCameraChange }: { view: View; alone: boolean; paused: boolean; locale: 'pt' | 'en'; svgRef?: Ref<SVGSVGElement>; neighbourhood?: Neighbourhood; lens?: Lens; selectedHouse?: number | null; selectedPerson?: number | null; selectedGroup?: number | null; onHouseSelect?: (id: number) => void; camera?: Camera; onCameraChange?: (next: Camera) => void }) {
  const id = useId().replace(/:/g, '');
  const pt = locale === 'pt';
  const localRef = useRef<SVGSVGElement>(null);
  const [compact, setCompact] = useState(false);
  const drag = useRef<{ x: number; y: number; camera: Camera; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setCompact(entries[0].contentRect.width < 500));
    if (localRef.current) observer.observe(localRef.current);
    return () => observer.disconnect();
  }, []);
  const grouped = view !== 'village';
  const count = PEOPLE.filter(p => (!alone || p.size === 1) && (selectedGroup === null || groupFor(p,lens) === selectedGroup) && (selectedHouse === null || p.household === selectedHouse)).length;
  return <svg ref={node => { localRef.current = node; if (typeof svgRef === 'function') svgRef(node); else if (svgRef) svgRef.current = node; }} className="mini-scene" data-paused={paused} data-view={view} data-lens={lens} data-neighbourhood={neighbourhood} data-selected-house={selectedHouse ?? undefined} data-selected-group={selectedGroup ?? undefined} data-compact={compact} viewBox={compact && grouped ? `0 0 400 ${view === 'ages' ? 500 : 745}` : '0 0 1000 600'} role={onHouseSelect ? 'group' : 'img'} onPointerDown={event => { if (!onCameraChange || view !== 'village') return; drag.current = {x:event.clientX,y:event.clientY,camera,moved:false}; }} onPointerMove={event => { if (!drag.current || !onCameraChange || view !== 'village') return; const dx = event.clientX-drag.current.x, dy=event.clientY-drag.current.y; if(Math.abs(dx)+Math.abs(dy)>5){drag.current.moved=true;setDragging(true);event.currentTarget.setPointerCapture(event.pointerId);const ratio=1000/event.currentTarget.getBoundingClientRect().width;onCameraChange({...camera,x:drag.current.camera.x+dx*ratio,y:drag.current.camera.y+dy*ratio});} }} onPointerUp={() => {setDragging(false);setTimeout(()=>{drag.current=null;},0);}} onPointerCancel={() => {drag.current=null;setDragging(false);}} style={{touchAction: camera.scale > 1 ? 'none' : 'pan-y'}} aria-labelledby={`${id}-title ${id}-desc`} xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{pt ? 'Um bairro imaginado em movimento' : 'An imagined neighbourhood in motion'}</title>
    <desc id={`${id}-desc`}>{pt ? `${count} pessoas em destaque. Dados fictícios: 100 pessoas em 30 agregados. O movimento e os edifícios são ilustrativos.` : `${count} highlighted people. Fictional data: 100 people in 30 households. Motion and buildings are illustrative.`}</desc>
    <defs><radialGradient id={`${id}-ground`}><stop stopColor="#e3e9d4" /><stop offset="1" stopColor="#f4f2e9" /></radialGradient><pattern id={`${id}-paving`} width="14" height="8" patternUnits="userSpaceOnUse"><path d="M0 4h14 M7 0v8" stroke="#d5d1be" strokeWidth=".6" /></pattern></defs>
    <rect width="1000" height="800" fill="#f4f2e9" />
    <ellipse cx="505" cy="341" rx="465" ry="235" fill={`url(#${id}-ground)`} />
    <g data-camera="true" className="mini-camera" style={{transform:view==='village'?`translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`:'translate(0, 0) scale(1)',transition:dragging?'none':undefined}}>
    <g className="mini-world" opacity={grouped ? compact ? 0 : .07 : 1}>
      <Landscape kind={neighbourhood}/>
      {[...HOUSEHOLDS].sort((a,b)=>neighbourhoodPosition(a.id,neighbourhood).y-neighbourhoodPosition(b.id,neighbourhood).y).map(h=><House id={h.id} key={h.id} locale={locale} neighbourhood={neighbourhood} selected={selectedHouse===h.id} onSelect={onHouseSelect && view==='village'?()=>{if(!drag.current?.moved)onHouseSelect(h.id);}:undefined}/>)}
    </g>
    {grouped && <g className="mini-group-labels" fill="#2a5045" fontFamily="Manrope, system-ui, sans-serif" textAnchor="middle">
      {(view === 'ages' ? FIELD_LABELS[locale][lens] : ['1','2','3','4','5']).map((label,i)=>{
        const group = PEOPLE.filter(p=>view==='ages'?groupFor(p,lens)===i:p.size===i+1);
        const x = compact ? 100 + (i % 2) * 200 : view==='ages'?90+(i+.5)*(820/distribution(lens).length):142+i*178;
        const row = compact ? Math.floor(i / 2) * 240 : 0;
        return <g key={label}><text x={x} y={compact ? 38 + row : 145} fontSize={view==='ages' ? compact ? 13 : 22 : compact ? 25 : 34} fontFamily="Manrope, system-ui, sans-serif" fontWeight="800">{label}</text><text x={x} y={compact ? 59 + row : 174} fontSize={compact ? 12 : 15}>{view==='ages'?(pt?'pessoas':'people'):(pt?i===0?'pessoa por agregado':'pessoas por agregado':i===0?'person per household':'people per household')}</text><text x={x} y={compact ? 220 + row : 454} fontSize={compact ? 15 : 22}>{group.length} {pt?'pessoas':'people'}</text>{view==='households' && !compact && <text x={x} y="480" fontSize="15">{HOUSEHOLDS.filter(h=>h.people.length===i+1).length} {pt?'agregados':'households'}</text>}</g>;
      })}
    </g>}
    {PEOPLE.map(person=>{
      const pos = exploredPosition(person,view,compact && grouped,neighbourhood,lens);
      const highlighted = (!alone || person.size===1) && (selectedGroup === null || groupFor(person,lens) === selectedGroup) && (selectedHouse === null || person.household === selectedHouse);
      return <g key={person.id} className="mini-person" data-person={person.id} data-x={pos.x} data-y={pos.y} data-highlighted={highlighted} style={{transform:`translate(${pos.x}px, ${pos.y}px)`,opacity:highlighted?1:.12}}>
        <g className={!grouped?'mini-stroll':undefined} style={{'--delay':`${-(person.id%11)}s`,'--drift':`${person.id%2?42:-42}px`,'--pace':`${8+person.id%7}s`} as CSSProperties}>
        {selectedHouse!==null && selectedPerson===person.id && <ellipse cy="-4" rx="8" ry="12" fill="#ecd37e" opacity=".8"/>}
          <ellipse cy="4" rx="4.5" ry="2" fill="#375247" opacity=".2" />
          <path className={!grouped?'mini-legs':undefined} d="M-1 0 l-1 4 M1 0 l1 4" stroke="#354d46" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M-3 -7 Q0 -9 3 -7 L3 0 L-3 0Z" fill={COLOURS[groupFor(person,lens)]} />
          <circle cy="-11" r="3.1" fill={['#c29370','#e0b18c','#a87656'][person.id%3]} />
          <path d="M-3 -12 Q-2 -16 2 -14 L3 -12" fill={person.age>=65?'#d7d4c7':'#665444'} />
        </g>
      </g>;
    })}
    </g>
    <g opacity={compact && grouped ? 0 : 1} fill="#67776a" fontSize="12" fontFamily="Manrope, system-ui, sans-serif"><text x="36" y="565">{pt?'BAIRRO IMAGINADO · SEM LOCALIZAÇÃO REAL':'IMAGINED NEIGHBOURHOOD · NO REAL LOCATION'}</text><text x="965" y="565" textAnchor="end">{count} / 100</text></g>
  </svg>;
}
