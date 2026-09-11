import type { CSSProperties } from 'react';
import type { Neighbourhood } from '@/lib/miniatura/population';

function Olive({ x, y, pine=false }: {x:number;y:number;pine?:boolean}) {
  return <g transform={`translate(${x} ${y})`}><ellipse cy="7" rx="18" ry="7" fill="#354f3522"/><path d="M0 5V-22" stroke="#786c4f" strokeWidth="5"/>{pine?<path d="M0 -61L-22 -19H-13L-27 -3H27L13 -19H22Z" fill="#476b54"/>:<g className="land-tree"><ellipse cy="-23" rx="23" ry="16" fill="#728163"/><ellipse cx="-10" cy="-26" rx="15" ry="12" fill="#8e9a76"/></g>}</g>;
}
function Bird({ x,y,delay }: {x:number;y:number;delay:number}) {
  return <g transform={`translate(${x} ${y})`}><g className="land-bird" style={{'--offset':`${delay}s`} as CSSProperties}><path d="M-9 0Q-4 -7 0 0Q4 -7 9 0" fill="none" stroke="#5a6970" strokeWidth="2"/></g></g>;
}
export function Landscape({ kind }: { kind: Neighbourhood }) {
  if(kind==='town') return <g data-landscape="coast">
    <path d="M0 35H1000V600H0Z" fill="#e6d6b1"/>
    <path d="M0 30H270Q345 129 262 240T301 447Q332 523 220 600H0Z" fill="#81b5b8"/>
    <path d="M0 20H186Q287 100 198 259T225 462Q264 545 143 600H0Z" fill="#659da7"/>
    <path d="M280 35Q362 132 279 258T317 445Q346 529 232 600" fill="none" stroke="#fff1cc" strokeWidth="34"/>
    {[0,1,2,3,4,5,6].map(i=><path key={i} className="land-wave" style={{animationDelay:`${-i*.8}s`}} d={`M${34+i%2*23} ${100+i*65} q55 -13 118 1`} fill="none" stroke="#d3eddf" strokeWidth="3" opacity=".65"/>)}
    <path d="M350 70Q397 160 343 270T379 480L353 563" fill="none" stroke="#cbb891" strokeWidth="17"/>
    {[0,1,2,3,4].map(row=><path key={row} d={`M${367-row*15} ${157+row*78}l494 80`} stroke="#f4e9cd" strokeWidth="18"/>)}
    <g transform="translate(220 390)"><path d="M-18 17L-10 -47H10L18 17Z" fill="#fcf3de"/><path d="M-13 -24H13L12 -36H-12Z" fill="#bf6450"/><path d="M-14 -48L0 -61 14 -48Z" fill="#ad5543"/><path d="M-10 -47H10V-39H-10Z" fill="#f1cf72"/><ellipse cy="20" rx="29" ry="12" fill="#c9b78f"/></g>
    <g className="land-boat"><g transform="translate(110 295)"><path d="M-32 0L29 0 15 14H-17Z" fill="#f2e4c8"/><path d="M0 -64V0" stroke="#6c6254" strokeWidth="3"/><path d="M-3 -57L-26 -5H-3Z" fill="#fff7e6"/><path d="M4 -50L24 -7H4Z" fill="#ca785a"/><path d="M-39 22h78" stroke="#a7d3d1" strokeWidth="3"/></g></g>
    {[0,1,2].map(i=><Bird key={i} x={80+i*63} y={110+i*26} delay={-i*3}/>)}
    {[0,1,2,3].map(i=><g key={i} transform={`translate(${313-i*9} ${190+i*77})`}><ellipse rx="13" ry="7" fill={i%2?'#ce7454':'#f5e9c9'}/><path d="M0 0v16" stroke="#998362"/></g>)}
  </g>;
  if(kind==='village') return <g data-landscape="countryside">
    <path d="M0 85Q235 -15 496 66T1000 35V600H0Z" fill="#d4cc99"/>
    <path d="M0 375Q200 211 400 378T1000 305V600H0Z" fill="#b7bd89"/>
    <path d="M0 500L180 382 435 551 320 600H0Z" fill="#d8bc74"/>
    {Array.from({length:12},(_,i)=><path key={i} d={`M${i*29} 600l-154 -151`} stroke="#bc9e59" strokeWidth="2" opacity=".55"/>)}
    {[0,1,2,3,4].map(row=><path key={row} d={`M130 ${207+row*74} Q450 ${231+row*74} 931 ${204+row*74}`} fill="none" stroke="#e9dcba" strokeWidth="16"/>)}
    <path d="M161 86Q210 210 156 352T208 600" fill="none" stroke="#e9dcba" strokeWidth="25"/>
    {[[85,242],[95,405],[895,99],[930,220],[832,548],[403,102],[687,104],[947,512]].map(([x,y],i)=><Olive key={i} x={x} y={y}/>)}
    <g transform="translate(108 128)"><path d="M-21 25L-12 -40H12L21 25Z" fill="#f6ecd7"/><path d="M-15 -40L0 -58 15 -40Z" fill="#aa624c"/><g className="land-windmill"><circle r="5" fill="#867257"/>{[0,90,180,270].map(a=><g transform={`rotate(${a})`} key={a}><path d="M0 0V-44" stroke="#867257" strokeWidth="2"/><path d="M1 -9H11V-43H1Z" fill="#ece7d5" stroke="#9e9177" strokeWidth="1"/></g>)}</g></g>
    <g className="land-cloud"><ellipse cx="145" cy="64" rx="55" ry="13" fill="#fff9e4" opacity=".6"/><ellipse cx="180" cy="54" rx="34" ry="18" fill="#fff9e4" opacity=".6"/></g>
  </g>;
  if(kind==='hills') return <g data-landscape="hills">
    <path d="M0 210L132 53 239 142 390 24 570 162 696 42 857 148 1000 76V600H0Z" fill="#aebbad"/>
    <path d="M0 336L196 132 346 224 534 111 709 257 877 169 1000 304V600H0Z" fill="#8fa68c"/>
    {[0,1,2,3,4].map(i=><g key={i}><path d={`M110 ${173+i*78}Q510 ${92+i*78} 906 ${183+i*78}L926 ${230+i*78}Q500 ${142+i*78} 80 ${225+i*78}Z`} fill={i%2?'#bbc5a4':'#cbd0ad'}/><path d={`M80 ${225+i*78}Q500 ${142+i*78} 926 ${230+i*78}`} fill="none" stroke="#8a8d76" strokeWidth="10"/><path d={`M120 ${199+i*78}Q480 ${125+i*78} 898 ${212+i*78}`} stroke="#e3dcc4" strokeWidth="15" fill="none"/></g>)}
    {[[83,339],[106,472],[904,144],[945,399],[798,88],[282,115],[591,93],[847,501]].map(([x,y],i)=><Olive key={i} x={x} y={y} pine/>)}
    <path d="M930 166Q865 239 930 329T934 600" fill="none" stroke="#8ab6b4" strokeWidth="17"/>
    <path className="land-stream" d="M930 166Q865 239 930 329T934 600" fill="none" stroke="#d1e9df" strokeWidth="3" strokeDasharray="12 24"/>
    <g className="land-mist"><ellipse cx="260" cy="88" rx="151" ry="18" fill="#eef1e6" opacity=".3"/><ellipse cx="721" cy="154" rx="200" ry="13" fill="#eef1e6" opacity=".25"/></g>
    <Bird x={200} y={81} delay={0}/><Bird x={570} y={56} delay={-5}/>
  </g>;
  return <g data-landscape="city">
    <path d="M66 201L383 31 977 344 641 589 62 316Z" fill="#d7d5cb"/>
    {[0,1,2,3,4].map(row=><g key={row}><path d={`M${232-row*31} ${171+row*65}l581 191`} stroke="#9aa6a0" strokeWidth="32"/><path d={`M${232-row*31} ${171+row*65}l581 191`} stroke="#e9e5d7" strokeWidth="1.3" strokeDasharray="10 14"/></g>)}
    {[0,1,2,3,4,5].map(col=><path key={col} d={`M${285+col*82} ${111+col*27}l-144 316`} stroke="#ede8d9" strokeWidth="20"/>)}
    <path d="M135 369L748 571" stroke="#899d93" strokeWidth="34"/><path d="M135 365L748 567M135 374L748 576" stroke="#d4d8c9" strokeWidth="2"/>
    <g className="land-tram"><g transform="translate(200 390)"><ellipse cx="5" cy="10" rx="31" ry="9" fill="#3f534544"/><path d="M-25 -20L12 -8V17L-25 5Z" fill="#d4ab42"/><path d="M12 -8L30 -18V7L12 17Z" fill="#b29335"/><path d="M-25 -20L-8 -30 30 -18 12 -8Z" fill="#ece4cc"/>{[0,1,2].map(i=><path key={i} d={`M${-21+i*10} ${-16+i*3}l7 2v10l-7 -2Z`} fill="#527a7d"/>)}<path d="M16 -5l10 -6v9l-10 6Z" fill="#527a7d"/><path d="M-13 -26v-19l28 9v19" stroke="#61736c" fill="none" strokeWidth="2"/></g></g>
    <path d="M126 511L226 451 340 510 249 567Z" fill="#9eb08a"/>
    {[[167,504],[228,491],[280,524],[872,402],[185,269],[789,300]].map(([x,y],i)=><Olive key={i} x={x} y={y}/>)}
    <g transform="translate(881 504)"><ellipse rx="37" ry="16" fill="#bfc8bd"/><ellipse cy="-4" rx="29" ry="12" fill="#8ab5b4"/><ellipse className="mini-water" cy="-4" rx="14" ry="6" stroke="#deeee1" fill="none"/></g>
  </g>;
}
