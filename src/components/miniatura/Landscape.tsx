import type { Neighbourhood } from '@/lib/miniatura/population';
import { FIELD, GRAPHITE, GRID, HAIR, INK, LINE, PAPER, RULE } from './scene-palette';

/**
 * The four imagined landscapes, drawn as an instrument would: ink outlines on
 * white, grey fills for ground, water and roads, and one moving thing each
 * (waves and a boat on the coast, a windmill in the countryside, a stream in
 * the hills, a tram in the city). No colour: colour in the scene belongs to
 * the people's groups.
 */
function Tree({ x, y, pine = false }: { x: number; y: number; pine?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M0 5V-20" stroke={INK} strokeWidth="2" />
    {pine
      ? <path d="M0 -61L-22 -19H-13L-27 -3H27L13 -19H22Z" fill={GRID} {...LINE} />
      : <ellipse cy="-23" rx="22" ry="15" fill={GRID} {...LINE} />}
  </g>;
}

export function Landscape({ kind }: { kind: Neighbourhood }) {
  if (kind === 'town') return <g data-landscape="coast">
    <path d="M0 35H1000V600H0Z" fill={PAPER} />
    {/* The sea, deeper offshore, and the dry sand along the shore. */}
    <path d="M0 30H270Q345 129 262 240T301 447Q332 523 220 600H0Z" fill={GRID} />
    <path d="M0 20H186Q287 100 198 259T225 462Q264 545 143 600H0Z" fill={RULE} />
    <path d="M280 35Q362 132 279 258T317 445Q346 529 232 600" fill="none" stroke={FIELD} strokeWidth="34" />
    {/* The shoreline, the one ink line between water and land. */}
    <path d="M270 30Q345 129 262 240T301 447Q332 523 220 600" fill="none" {...LINE} />
    {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} className="land-wave" style={{ animationDelay: `${-i * .8}s` }} d={`M${34 + i % 2 * 23} ${100 + i * 65} q55 -13 118 1`} fill="none" stroke={GRAPHITE} strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
    <path d="M350 70Q397 160 343 270T379 480L353 563" fill="none" stroke={GRID} strokeWidth="17" />
    {[0, 1, 2, 3, 4].map(row => <path key={row} d={`M${367 - row * 15} ${157 + row * 78}l494 80`} stroke={FIELD} strokeWidth="18" />)}
    {/* The lighthouse. */}
    <g transform="translate(220 390)">
      <ellipse cy="20" rx="29" ry="12" fill={RULE} {...LINE} />
      <path d="M-18 17L-10 -47H10L18 17Z" fill={PAPER} {...LINE} />
      <path d="M-13 -24H13L12 -36H-12Z" fill={INK} />
      <path d="M-10 -47H10V-39H-10Z" fill={PAPER} {...LINE} />
      <path d="M-14 -48L0 -61 14 -48Z" fill={INK} />
    </g>
    <g className="land-boat"><g transform="translate(110 295)">
      <path d="M-32 0L29 0 15 14H-17Z" fill={PAPER} {...LINE} />
      <path d="M0 -64V0" stroke={INK} strokeWidth="2" />
      <path d="M-3 -57L-26 -5H-3Z" fill={PAPER} {...LINE} />
      <path d="M4 -50L24 -7H4Z" fill={RULE} {...LINE} />
      <path d="M-39 22h78" {...HAIR} />
    </g></g>
    {/* Beach umbrellas. */}
    {[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${313 - i * 9} ${190 + i * 77})`}><path d="M0 0v16" stroke={INK} /><ellipse rx="13" ry="7" fill={i % 2 ? RULE : PAPER} {...LINE} /></g>)}
  </g>;
  if (kind === 'village') return <g data-landscape="countryside">
    <path d="M0 85Q235 -15 496 66T1000 35V600H0Z" fill={PAPER} {...LINE} />
    <path d="M0 375Q200 211 400 378T1000 305V600H0Z" fill={FIELD} {...LINE} />
    <path d="M0 500L180 382 435 551 320 600H0Z" fill={GRID} {...LINE} />
    {/* Furrows, kept inside the wheat field (the postcard shows the drawing past its edges). */}
    <clipPath id="mini-wheat-field"><path d="M0 500L180 382 435 551 320 600H0Z" /></clipPath>
    <g clipPath="url(#mini-wheat-field)">{Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 29} 600l-154 -151`} {...HAIR} />)}</g>
    {[0, 1, 2, 3, 4].map(row => <path key={row} d={`M130 ${207 + row * 74} Q450 ${231 + row * 74} 931 ${204 + row * 74}`} fill="none" stroke={FIELD} strokeWidth="16" />)}
    <path d="M161 86Q210 210 156 352T208 600" fill="none" stroke={GRID} strokeWidth="25" />
    {[[85, 242], [95, 405], [895, 99], [930, 220], [832, 548], [403, 102], [687, 104], [947, 512]].map(([x, y], i) => <Tree key={i} x={x} y={y} />)}
    {/* The windmill. */}
    <g transform="translate(108 128)">
      <path d="M-21 25L-12 -40H12L21 25Z" fill={PAPER} {...LINE} />
      <path d="M-15 -40L0 -58 15 -40Z" fill={INK} />
      <g className="land-windmill">
        {[0, 90, 180, 270].map(a => <g transform={`rotate(${a})`} key={a}><path d="M0 0V-44" stroke={INK} strokeWidth="2" /><path d="M1 -9H11V-43H1Z" fill={PAPER} {...LINE} /></g>)}
        <circle r="5" fill={INK} />
      </g>
    </g>
  </g>;
  if (kind === 'hills') return <g data-landscape="hills">
    <path d="M0 210L132 53 239 142 390 24 570 162 696 42 857 148 1000 76V600H0Z" fill={GRID} {...LINE} />
    <path d="M0 336L196 132 346 224 534 111 709 257 877 169 1000 304V600H0Z" fill={FIELD} {...LINE} />
    {/* Terraces: each one's edge is an ink line, like a contour, with a path along it. */}
    {[0, 1, 2, 3, 4].map(i => <g key={i}>
      <path d={`M110 ${173 + i * 78}Q510 ${92 + i * 78} 906 ${183 + i * 78}L926 ${230 + i * 78}Q500 ${142 + i * 78} 80 ${225 + i * 78}Z`} fill={i % 2 ? PAPER : FIELD} />
      <path d={`M120 ${199 + i * 78}Q480 ${125 + i * 78} 898 ${212 + i * 78}`} stroke={GRID} strokeWidth="15" fill="none" />
      <path d={`M80 ${225 + i * 78}Q500 ${142 + i * 78} 926 ${230 + i * 78}`} fill="none" {...LINE} />
    </g>)}
    {[[83, 339], [106, 472], [904, 144], [945, 399], [798, 88], [282, 115], [591, 93], [847, 501]].map(([x, y], i) => <Tree key={i} x={x} y={y} pine />)}
    <path d="M930 166Q865 239 930 329T934 600" fill="none" stroke={RULE} strokeWidth="17" />
    <path className="land-stream" d="M930 166Q865 239 930 329T934 600" fill="none" stroke={PAPER} strokeWidth="3" strokeDasharray="12 24" />
  </g>;
  return <g data-landscape="city">
    <path d="M66 201L383 31 977 344 641 589 62 316Z" fill={FIELD} {...LINE} />
    {[0, 1, 2, 3, 4].map(row => <g key={row}>
      <path d={`M${232 - row * 31} ${171 + row * 65}l581 191`} stroke={RULE} strokeWidth="32" />
      <path d={`M${232 - row * 31} ${171 + row * 65}l581 191`} stroke={PAPER} strokeWidth="1.3" strokeDasharray="10 14" />
    </g>)}
    {[0, 1, 2, 3, 4, 5].map(col => <path key={col} d={`M${285 + col * 82} ${111 + col * 27}l-144 316`} stroke={PAPER} strokeWidth="20" />)}
    {/* The tram line, its rails and the tram. */}
    <path d="M135 369L748 571" stroke={GRID} strokeWidth="34" />
    <path d="M135 365L748 567M135 374L748 576" {...LINE} />
    <g className="land-tram"><g transform="translate(200 390)">
      <path d="M-25 -20L12 -8V17L-25 5Z" fill={PAPER} {...LINE} />
      <path d="M12 -8L30 -18V7L12 17Z" fill={RULE} {...LINE} />
      <path d="M-25 -20L-8 -30 30 -18 12 -8Z" fill={GRID} {...LINE} />
      {[0, 1, 2].map(i => <path key={i} d={`M${-21 + i * 10} ${-16 + i * 3}l7 2v10l-7 -2Z`} fill={INK} />)}
      <path d="M16 -5l10 -6v9l-10 6Z" fill={INK} />
      <path d="M-13 -26v-19l28 9v19" stroke={INK} fill="none" strokeWidth="2" />
    </g></g>
    {/* A small park and a fountain. */}
    <path d="M126 511L226 451 340 510 249 567Z" fill={GRID} {...LINE} />
    {[[167, 504], [228, 491], [280, 524], [872, 402], [185, 269], [789, 300]].map(([x, y], i) => <Tree key={i} x={x} y={y} />)}
    <g transform="translate(881 504)">
      <ellipse rx="37" ry="16" fill={RULE} {...LINE} />
      <ellipse cy="-4" rx="29" ry="12" fill={GRID} {...LINE} />
      <ellipse cy="-4" rx="14" ry="6" fill="none" {...HAIR} />
    </g>
  </g>;
}
