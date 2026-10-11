import { useId, useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { FONT_STACK } from '@/lib/brand';
import { FIELD_LABELS, HOUSEHOLDS, PEOPLE, neighbourhoodPosition, exploredPosition, distribution, groupFor, type Lens, type Neighbourhood, type View } from '@/lib/miniatura/population';

import { Landscape } from './Landscape';
import { houseShape, nearestHouse } from './hit-test';
import { COLOURS, FIELD, GRAPHITE, GRID, HAIR, INK, LINE, PAPER, RULE, STONE } from './scene-palette';

export { COLOURS };

/** How far from a house a finger may land and still choose it, in CSS pixels. */
const TAP_RADIUS_PX = 44;

/**
 * One household's home, as an ink line drawing on light greys: the lit wall
 * (left) in field grey, the shaded wall in rule grey, the roof between. Each
 * landscape keeps its own kind of house through line work, not colour: the
 * Alentejo's base band and chimney, the coast's striped boards, the hills'
 * stone courses, the city's flat-roofed blocks with a band per floor.
 */
function House({ id, neighbourhood, selected, onSelect, locale }: { id: number; neighbourhood: Neighbourhood; selected: boolean; onSelect?: () => void; locale: 'pt' | 'en' }) {
  const { x, y } = neighbourhoodPosition(id, neighbourhood);
  const urban=neighbourhood==='city',stone=neighbourhood==='hills',coast=neighbourhood==='town';
  const { floors, height } = houseShape(id, neighbourhood);
  return <g className={`mini-house ${selected ? 'mini-house-selected' : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `${locale === 'pt' ? 'Entrar no agregado' : 'Enter household'} ${id + 1}` : undefined} aria-pressed={onSelect ? selected : undefined} onClick={onSelect} onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(); } }}>
    <ellipse className="mini-house-target" cx="6" cy="5" rx="40" ry="34" fill="transparent" />
    {/* The chosen home: a ruled ellipse on the ground around it. */}
    {selected && <ellipse className="mini-mark" cx="6" cy="10" rx="39" ry="23" fill={FIELD} stroke={INK} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>}
    <path d={`M-24 1 L5 17 L5 ${17-height} L-24 ${1-height}Z`} fill={urban||stone?FIELD:PAPER} {...LINE} />
    <path d={`M5 17 L31 2 L31 ${2-height} L5 ${17-height}Z`} fill={RULE} {...LINE} />
    {stone&&[0,1,2,3].map(row=><path key={row} d={`M-23 ${-row*8}l27 15M-12 ${-row*8+4}v-7`} fill="none" {...HAIR}/>)}
    {coast&&[0,1,2,3].map(i=><path key={i} d={`M${-20+i*7} ${3+i*4}v${-height}`} fill="none" {...HAIR}/>)}
    {[...Array(floors)].map((_,floor)=><g key={floor} transform={`translate(0 ${-floor*16})`}>
      <path d="M-18 -3l7 4v-10l-7 -4Z M-5 4l7 4v-10l-7 -4Z M12 9l9 -5v-10l-9 5Z" fill={PAPER} {...LINE}/>
      {urban&&<path d="M-21 0l25 14 5 -3 -25 -14Z" fill={GRID} {...LINE}/>}
    </g>)}
    <path d="M12 11l7 -4v-14l-7 4Z" fill={STONE} {...LINE}/>
    {/* The base band (the Alentejo's barra, a plinth elsewhere). */}
    <path d="M-23 2l27 15v-4l-27 -15Z" fill={neighbourhood==='village'?INK:GRID} />
    <g className="mini-roof" style={{transform:selected?'translateY(-35px)':'translateY(0)',opacity:selected?.25:1}}>
      {urban?<><path d={`M-27 ${1-height}l29 17 32 -17 -30 -17Z`} fill={GRID} {...LINE}/><path d={`M-27 ${1-height}v-5l29 17 32 -17v5l-32 17Z`} fill={PAPER} {...LINE}/><path d={`M-12 ${-height-2}l11 6 8 -5 -11 -6Z`} fill={RULE} {...LINE}/><path d={`M16 ${-height-7}v-18m-6 6h12`} stroke={INK} fill="none" strokeWidth="1.5"/></>:
      <><path d={`M-29 ${2-height}L-3 ${-17-height}L35 ${1-height}L5 ${20-height}Z`} fill={GRID} {...LINE}/><path d={`M-29 ${2-height}L-3 ${-17-height}L3 ${-5-height}L-23 ${13-height}Z`} fill={FIELD} {...LINE}/>{[0,1,2,3].map(i=><path key={i} d={`M${-20+i*8} ${-4-height+i*4}l24 13`} {...HAIR}/>)}{!coast&&<path d={`M14 ${-height}v-17l8 4v17Z`} fill={PAPER} {...LINE}/>}</>}
    </g>
    {selected&&<text x="3" y={-height-43} textAnchor="middle" fontSize="12" fontWeight="600" fill={INK} fontFamily={FONT_STACK}>{locale==='pt'?'Casa':'Home'} {id+1}</text>}
    {coast&&id%3===0&&<path d="M-28 3l30 17 7 -4 -30 -17Z" fill={GRID} {...LINE}/>}
    {neighbourhood==='village'&&<><path d="M-33 18l26 15" stroke={FIELD} strokeWidth="7"/><circle cx="-26" cy="11" r="6" fill={GRID} {...LINE}/></>}

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
    <g data-camera="true" className="mini-camera" style={{transform:view==='village'?`translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`:'translate(0, 0) scale(1)',transition:dragging?'none':undefined}}>
    <g className="mini-world" opacity={grouped ? compact ? 0 : .07 : 1}>
      <Landscape kind={neighbourhood}/>
      {[...HOUSEHOLDS].sort((a,b)=>neighbourhoodPosition(a.id,neighbourhood).y-neighbourhoodPosition(b.id,neighbourhood).y).map(h=><House id={h.id} key={h.id} locale={locale} neighbourhood={neighbourhood} selected={selectedHouse===h.id} onSelect={onHouseSelect && view==='village'?()=>{if(!drag.current?.moved)onHouseSelect(h.id);}:undefined}/>)}
    </g>
    {grouped && <g className="mini-group-labels" fill={INK} fontFamily={FONT_STACK} textAnchor="middle">
      {(view === 'ages' ? FIELD_LABELS[locale][lens] : ['1','2','3','4','5']).map((label,i)=>{
        const group = PEOPLE.filter(p=>view==='ages'?groupFor(p,lens)===i:p.size===i+1);
        const x = compact ? 100 + (i % 2) * 200 : view==='ages'?90+(i+.5)*(820/distribution(lens).length):142+i*178;
        const row = compact ? Math.floor(i / 2) * 240 : 0;
        return <g key={label}><text x={x} y={compact ? 38 + row : 145} fontSize={view==='ages' ? compact ? 13 : 22 : compact ? 25 : 34} fontFamily={FONT_STACK} fontWeight="700">{label}</text><text x={x} y={compact ? 59 + row : 174} fontSize={compact ? 12 : 15} fill={GRAPHITE}>{view==='ages'?(pt?'pessoas':'people'):(pt?i===0?'pessoa por agregado':'pessoas por agregado':i===0?'person per household':'people per household')}</text><text x={x} y={compact ? 220 + row : 454} fontSize={compact ? 15 : 22}>{group.length} {pt?'pessoas':'people'}</text>{view==='households' && !compact && <text x={x} y="480" fontSize="15" fill={GRAPHITE}>{HOUSEHOLDS.filter(h=>h.people.length===i+1).length} {pt?'agregados':'households'}</text>}</g>;
      })}
    </g>}
    {PEOPLE.map(person=>{
      const pos = exploredPosition(person,view,compact && grouped,neighbourhood,lens);
      const highlighted = (!alone || person.size===1) && (selectedGroup === null || groupFor(person,lens) === selectedGroup) && (selectedHouse === null || person.household === selectedHouse);
      return <g key={person.id} className="mini-person" data-person={person.id} data-x={pos.x} data-y={pos.y} data-highlighted={highlighted} style={{transform:`translate(${pos.x}px, ${pos.y}px)`,opacity:highlighted?1:.12}}>
        <g className={!grouped?'mini-stroll':undefined} style={{'--delay':`${-(person.id%11)}s`,'--drift':`${person.id%2?42:-42}px`,'--pace':`${8+person.id%7}s`} as CSSProperties}>
        {/* The person chosen in the household panel: a ruled ring around the figure. */}
        {selectedHouse!==null && selectedPerson===person.id && <ellipse className="mini-mark" cy="-4" rx="8" ry="12" fill="none" stroke={INK} strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>}
          {/* A figure: ink legs and head, the body in its group's series colour. */}
          <path className={!grouped?'mini-legs':undefined} d="M-1 0 l-1 4 M1 0 l1 4" stroke={INK} strokeWidth="1.4" strokeLinecap="square" />
          <rect x="-3" y="-8" width="6" height="8" fill={COLOURS[groupFor(person,lens)]} />
          <circle cy="-11" r="2.8" fill={INK} />
        </g>
      </g>;
    })}
    </g>
    <g className="mini-scene-caption" opacity={compact && grouped ? 0 : 1} fill={GRAPHITE} fontSize="12" fontFamily={FONT_STACK}><text x="36" y="565">{pt?'Bairro imaginado, sem localização real':'Imagined neighbourhood, no real location'}</text><text x="965" y="565" textAnchor="end">{count} / 100</text></g>
  </svg>;
}
