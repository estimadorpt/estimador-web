import { useId, useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { FIELD_LABELS, HOUSEHOLDS, PEOPLE, neighbourhoodPosition, exploredPosition, distribution, groupFor, type Lens, type Neighbourhood, type View } from '@/lib/miniatura/population';

import { Landscape } from './Landscape';
import { houseShape, nearestHouse } from './hit-test';
import { COLOURS, Figure, HouseArt, SKINS } from './parts';

/** How far from a house a finger may land and still choose it, in CSS pixels. */
const TAP_RADIUS_PX = 44;

export { COLOURS };
function House({ id, neighbourhood, selected, onSelect, locale }: { id: number; neighbourhood: Neighbourhood; selected: boolean; onSelect?: () => void; locale: 'pt' | 'en' }) {
  const { x, y } = neighbourhoodPosition(id, neighbourhood);
  const { height } = houseShape(id, neighbourhood);
  return <g className={`mini-house ${selected ? 'mini-house-selected' : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `${locale === 'pt' ? 'Entrar no agregado' : 'Enter household'} ${id + 1}` : undefined} aria-pressed={onSelect ? selected : undefined} onClick={onSelect} onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(); } }}>
    <HouseArt id={id} neighbourhood={neighbourhood} selected={selected} />
    {selected&&<text x="3" y={-height-43} textAnchor="middle" fontSize="12" fill="#244f42" fontFamily="Manrope, system-ui, sans-serif">{locale==='pt'?'Casa':'Home'} {id+1}</text>}
  </g>;
}
export type Camera = { x: number; y: number; scale: number };
export function Scene({ view, alone, paused, locale, svgRef, neighbourhood = 'town', lens = 'age', selectedHouse = null, selectedPerson = null, selectedGroup = null, onHouseSelect, camera = { x: 0, y: 0, scale: 1 }, onCameraChange }: { view: View; alone: boolean; paused: boolean; locale: 'pt' | 'en'; svgRef?: Ref<SVGSVGElement>; neighbourhood?: Neighbourhood; lens?: Lens; selectedHouse?: number | null; selectedPerson?: number | null; selectedGroup?: number | null; onHouseSelect?: (id: number) => void; camera?: Camera; onCameraChange?: (next: Camera) => void }) {
  const id = useId().replace(/:/g, '');
  const pt = locale === 'pt';
  const localRef = useRef<SVGSVGElement>(null);
  const [compact, setCompact] = useState(false);
  const drag = useRef<{ x: number; y: number; camera: Camera; moved: boolean } | null>(null);
  // The input behind the latest press: only a finger gets nearest-house matching.
  const pointerType = useRef('');
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setCompact(entries[0].contentRect.width < 500));
    if (localRef.current) observer.observe(localRef.current);
    return () => observer.disconnect();
  }, []);
  const grouped = view !== 'village';
  const count = PEOPLE.filter(p => (!alone || p.size === 1) && (selectedGroup === null || groupFor(p,lens) === selectedGroup) && (selectedHouse === null || p.household === selectedHouse)).length;
  // Drags convert screen pixels to scene units through the screen matrix, not the box width: on a short screen the
  // block fits the viewport (P206) and the drawing is letterboxed inside a wider box.
  return <svg ref={node => { localRef.current = node; if (typeof svgRef === 'function') svgRef(node); else if (svgRef) svgRef.current = node; }} className="mini-scene" data-paused={paused} data-view={view} data-lens={lens} data-neighbourhood={neighbourhood} data-selected-house={selectedHouse ?? undefined} data-selected-group={selectedGroup ?? undefined} data-compact={compact} viewBox={compact && grouped ? `0 0 400 ${view === 'ages' ? 500 : 745}` : '0 0 1000 600'} role={onHouseSelect ? 'group' : 'img'} onPointerDown={event => { pointerType.current = event.pointerType; if (!onCameraChange || view !== 'village') return; drag.current = {x:event.clientX,y:event.clientY,camera,moved:false}; }} onPointerMove={event => { if (!drag.current || !onCameraChange || view !== 'village') return; const dx = event.clientX-drag.current.x, dy=event.clientY-drag.current.y; if(Math.abs(dx)+Math.abs(dy)>5){drag.current.moved=true;setDragging(true);event.currentTarget.setPointerCapture(event.pointerId);const matrix=event.currentTarget.getScreenCTM();const ratio=matrix?1/matrix.a:1000/event.currentTarget.getBoundingClientRect().width;onCameraChange({...camera,x:drag.current.camera.x+dx*ratio,y:drag.current.camera.y+dy*ratio});} }} onPointerUp={() => {setDragging(false);setTimeout(()=>{drag.current=null;},0);}} onPointerCancel={() => {drag.current=null;setDragging(false);}} onClick={event => {
      // A tap that lands between the houses (UXM2V-05): houses are about 29×28px on a phone, so a finger
      // chooses the nearest one within TAP_RADIUS_PX instead. A house's own click has already been handled.
      if (!onHouseSelect || view !== 'village' || pointerType.current !== 'touch' || drag.current?.moved) return;
      if ((event.target as Element).closest('.mini-house')) return;
      const matrix = event.currentTarget.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const world = { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
      const house = nearestHouse(world, neighbourhood, TAP_RADIUS_PX / (matrix.a * camera.scale));
      if (house !== null) onHouseSelect(house);
    }} style={{touchAction: camera.scale > 1 ? 'none' : 'pan-y'}} aria-labelledby={`${id}-title ${id}-desc`} xmlns="http://www.w3.org/2000/svg">
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
          <Figure colour={COLOURS[groupFor(person,lens)]} skin={SKINS[person.id%3]} grey={person.age>=65} legsClassName={!grouped?'mini-legs':undefined} />
        </g>
      </g>;
    })}
    </g>
    <g className="mini-scene-caption" opacity={compact && grouped ? 0 : 1} fill="#67776a" fontSize="12" fontFamily="Manrope, system-ui, sans-serif"><text x="36" y="565">{pt?'BAIRRO IMAGINADO · SEM LOCALIZAÇÃO REAL':'IMAGINED NEIGHBOURHOOD · NO REAL LOCATION'}</text><text x="965" y="565" textAnchor="end">{count} / 100</text></g>
  </svg>;
}
