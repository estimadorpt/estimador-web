'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, House, Info, Link2, Minus, Plus, Pause, Play, RotateCcw, Users, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FIELD_LABELS, LENSES, NEIGHBOURHOODS, DEMO_RELEASE, HOUSEHOLDS, PEOPLE, VIEWS, parseView, distribution, groupFor, neighbourhoodPosition, type Lens, type Neighbourhood, type View } from '@/lib/miniatura/population';
import { downloadBlob, pngFromSvg, postcardSvg } from '@/lib/miniatura/postcard';
import { Scene, COLOURS, type Camera } from './Scene';
import { HouseholdInspector } from './HouseholdInspector';
import './miniatura.css';
import { REGIONS, readAtlasState, atlasQuery, type Region } from '@/lib/atlas/population';

export function Miniature({ locale }: { locale: 'pt' | 'en' }) {
  const pt=locale==='pt';
  const [atlasRegion,setAtlasRegion]=useState<string|null>(null);
  const [atlasReturn,setAtlasReturn]=useState('/populacao');
  const [view,setView]=useState<View>('village');
  const [alone,setAlone]=useState(false),[paused,setPaused]=useState(false),[tour,setTour]=useState(false);
  const [neighbourhood,setNeighbourhood]=useState<Neighbourhood>('town'),[lens,setLens]=useState<Lens>('age');
  const [selectedHouse,setSelectedHouse]=useState<number|null>(null),[selectedGroup,setSelectedGroup]=useState<number|null>(null);
  const [selectedPerson,setSelectedPerson]=useState<number|null>(null);
  const [camera,setCamera]=useState<Camera>({x:0,y:0,scale:1});
  const [ready,setReady]=useState(false),[reduced,setReduced]=useState(false),[exporting,setExporting]=useState(false),[notice,setNotice]=useState('');
  const [postcard,setPostcard]=useState<string|null>(null);
  const svgRef=useRef<SVGSVGElement>(null),dialogRef=useRef<HTMLDialogElement>(null);
  const views=pt?['Explorar','Distribuições','Agregados']:['Explore','Distributions','Households'];
  const titles=pt?['Um pequeno mundo.\nTantas formas de viver.','As mesmas pessoas.\nUma nova perspetiva.','Cada casa.\nUma história.']:['A small world.\nSo many ways to live.','The same people.\nA new perspective.','Every home.\nA different story.'];
  const descriptions=pt?['Passeia por um bairro imaginado. Descobre quem aqui vive e vê as pessoas transformarem-se em dados.','As pessoas juntam-se por idade. Cada cor acompanha o mesmo grupo em todas as perspetivas.','As pessoas juntam-se pelo tamanho do seu agregado. Cada figura continua a ser a mesma pessoa.']:['Wander through an imagined neighbourhood. Discover who lives here and watch people become data.','People gather by age. Each colour follows the same age group across all perspectives.','People gather by household size. Every figure is still the same person.'];
  const index=VIEWS.indexOf(view);
  useEffect(()=>{
    const query=new URLSearchParams(window.location.search);
    if(query.has('atlasReturn')){const state=readAtlasState(new URLSearchParams(query.get('atlasReturn')!));if(state.parish){const home=Number(query.get('home'));const extra=query.has('home')&&Number.isInteger(home)&&home>=0&&home<30?`&home=${home}&person=${Number(query.get('person'))}`:'';window.location.replace(`/${locale}/populacao/?${atlasQuery(state)}${extra}`);return;}}
    if(REGIONS.includes(query.get('atlasRegion') as Region))setAtlasRegion(query.get('atlasRegion'));
    if(query.has('atlasReturn'))setAtlasReturn(`/populacao?${atlasQuery(readAtlasState(new URLSearchParams(query.get('atlasReturn')!)))}`);
    else if(REGIONS.includes(query.get('atlasRegion') as Region))setAtlasReturn(`/populacao?region=${encodeURIComponent(query.get('atlasRegion')!)}`);
    if(!query.has('r')||query.get('r')===DEMO_RELEASE){setView(parseView(query.get('view')));setAlone(query.get('alone')==='1');
      if(NEIGHBOURHOODS.includes(query.get('form') as Neighbourhood))setNeighbourhood(query.get('form') as Neighbourhood);
      if(LENSES.includes(query.get('lens') as Lens))setLens(query.get('lens') as Lens);
      const incomingLens=LENSES.includes(query.get('lens') as Lens)?query.get('lens') as Lens:'age';const group=Number(query.get('group'));if(query.has('group')&&Number.isInteger(group)&&group>=0&&group<distribution(incomingLens).length)setSelectedGroup(group);
      const h=Number(query.get('home'));if(query.has('home')&&Number.isInteger(h)&&h>=0&&h<30){setSelectedHouse(h);const person=Number(query.get('person'));setSelectedPerson(query.has('person')&&HOUSEHOLDS[h].people.some(p=>p.id===person)?person:HOUSEHOLDS[h].people[0].id);const pos=neighbourhoodPosition(h,NEIGHBOURHOODS.includes(query.get('form') as Neighbourhood)?query.get('form') as Neighbourhood:'town');setCamera({x:500-pos.x*2.8,y:310-pos.y*2.8,scale:2.8});}
    }
    else setNotice(pt?'Este postal usa outra versão. Estás a ver a demonstração atual.':'This postcard uses another version. You are viewing the current demo.');
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{setReduced(media.matches);if(media.matches){setPaused(true);setTour(false);}};
    update();media.addEventListener('change',update);setReady(true);
    return ()=>media.removeEventListener('change',update);
  },[pt,locale]);
  useEffect(()=>{
    if(!ready)return;
    const url=new URL(window.location.href);url.searchParams.set('r',DEMO_RELEASE);url.searchParams.set('view',view);url.searchParams.set('form',neighbourhood);url.searchParams.set('lens',lens);if(selectedGroup!==null)url.searchParams.set('group',String(selectedGroup));else url.searchParams.delete('group');if(selectedPerson!==null&&selectedHouse!==null)url.searchParams.set('person',String(selectedPerson));else url.searchParams.delete('person');if(selectedHouse!==null)url.searchParams.set('home',String(selectedHouse));else url.searchParams.delete('home');if(alone)url.searchParams.set('alone','1');else url.searchParams.delete('alone');window.history.replaceState(null,'',url);
  },[ready,view,alone,neighbourhood,lens,selectedHouse,selectedGroup,selectedPerson]);
  useEffect(()=>{
    if(!tour||paused||reduced)return;
    const timer=setTimeout(()=>{if(view==='households'){setTour(false);return;}setView(VIEWS[VIEWS.indexOf(view)+1]);},4500);
    return()=>clearTimeout(timer);
  },[tour,view,paused,reduced]);
  useEffect(()=>()=>{if(postcard)URL.revokeObjectURL(postcard);},[postcard]);
  function select(next: View){setView(next);setTour(false);setNotice('');setSelectedHouse(null);setCamera({x:0,y:0,scale:1});}
  function enterHouse(id:number){setSelectedHouse(id);setSelectedPerson(HOUSEHOLDS[id].people[0].id);setSelectedGroup(null);setAlone(false);setTour(false);setView('village');const pos=neighbourhoodPosition(id,neighbourhood);setCamera({x:500-pos.x*2.8,y:310-pos.y*2.8,scale:2.8});}
  function zoomBy(amount:number){const scale=Math.min(4,Math.max(.8,camera.scale+amount));const ratio=scale/camera.scale;setCamera({scale,x:500-(500-camera.x)*ratio,y:300-(300-camera.y)*ratio});}
  function changeNeighbourhood(next:Neighbourhood){setNeighbourhood(next);setSelectedHouse(null);setCamera({x:0,y:0,scale:1});setView('village');setTour(false);}
  function reset(){select('village');setAlone(false);setCamera({x:0,y:0,scale:1});setSelectedGroup(null);}
  async function openPostcard(){
    if(!svgRef.current)return;setExporting(true);setNotice('');
    try{const blob=await pngFromSvg(postcardSvg(svgRef.current,locale,view,false,alone));setPostcard(URL.createObjectURL(blob));dialogRef.current?.showModal();}
    catch{setNotice(pt?'Não foi possível criar o postal. Tenta novamente.':'Could not create the postcard. Please try again.');}
    finally{setExporting(false);}
  }
  async function save(animated: boolean){
    if(!svgRef.current)return;setExporting(true);
    try{const svg=postcardSvg(svgRef.current,locale,view,animated,alone);const blob=animated?new Blob([svg],{type:'image/svg+xml'}):await pngFromSvg(svg);downloadBlob(blob,`${DEMO_RELEASE}-${neighbourhood}-${view}-${lens}${alone?'-alone':''}.${animated?'svg':'png'}`);setNotice(pt?'Postal preparado para guardar.':'Postcard ready to save.');}
    catch{setNotice(pt?'Não foi possível guardar. Tenta novamente.':'Could not save. Please try again.');}
    finally{setExporting(false);}
  }
  async function copyLink(){try{await navigator.clipboard.writeText(window.location.href);setNotice(pt?'Ligação copiada com esta perspetiva.':'Link copied with this perspective.');}catch{setNotice(pt?'Copia a ligação na barra de endereços do navegador.':'Copy the link from your browser address bar.');}}
  return <main id="main-content" className="miniature" data-motion={paused||reduced?'off':'on'}>
    <div className="mini-top"><Link href={atlasReturn} locale={locale} className="mini-back"><ArrowLeft size={15}/>{pt?'Voltar ao atlas':'Back to the atlas'}</Link><span className="mini-edition"><span/> {pt?'LABORATÓRIO · DEMONSTRAÇÃO':'LAB · DEMONSTRATION'}</span></div>
    <div className="mini-heading"><div><p className="mini-eyebrow">{pt?'PORTUGAL EM MINIATURA':'PORTUGAL IN MINIATURE'}</p><h1>{pt?'Um país feito de pessoas.':'A country made of people.'}</h1></div><button className="mini-postcard-button" onClick={openPostcard} disabled={exporting}><ArrowDownToLine size={17}/>{exporting?(pt?'A preparar…':'Preparing…'):(pt?'Criar um postal':'Create a postcard')}</button></div>
    {atlasRegion&&<p className="mini-atlas-origin">{pt?`Agregado do exemplo fictício de ${atlasRegion}. A paisagem é ilustrativa; não representa uma morada real.`:`Household from the fictional ${atlasRegion} example. The landscape is illustrative; it does not represent a real address.`}</p>}
    <div className="mini-workspace">
      <aside className="mini-sidebar">
        <div className="mini-place"><span className="mini-place-icon"><House size={20}/></span><div><strong>{(pt?{village:'Campo alentejano',town:'Costa atlântica',city:'Bairro urbano',hills:'Aldeia serrana'}:{village:'Alentejo countryside',town:'Atlantic coast',city:'Urban neighbourhood',hills:'Mountain village'})[neighbourhood]}</strong><span>{pt?'100 pessoas · 30 agregados':'100 people · 30 households'}</span></div></div>
        <div className="mini-neighbourhoods" role="group" aria-label={pt?'Paisagem portuguesa':'Portuguese landscape'}>{NEIGHBOURHOODS.map((n,i)=><button key={n} aria-pressed={n===neighbourhood} onClick={()=>changeNeighbourhood(n)}>{(pt?['Campo','Costa','Cidade','Serra']:['Countryside','Coast','City','Hills'])[i]}</button>)}</div>
        <div className="mini-tabs" role="group" aria-label={pt?'Perspetiva':'Perspective'}>{VIEWS.map((v,i)=><button key={v} onClick={()=>select(v)} aria-pressed={view===v}><span>0{i+1}</span>{views[i]}<ArrowRight size={16}/></button>)}</div>
        <div className="mini-lens-control"><label htmlFor="mini-lens">{pt?'Olhar para…':'Look at…'}</label><select id="mini-lens" value={lens} onChange={e=>{setLens(e.target.value as Lens);setSelectedGroup(null);}}>{LENSES.map((l,i)=><option key={l} value={l}>{(pt?['Idade','Escolaridade','Emprego','Transportes']:['Age','Education','Employment','Transport'])[i]}</option>)}</select></div>
        {selectedHouse!==null ? <HouseholdInspector key={selectedHouse} household={selectedHouse} locale={locale} selectedPerson={selectedPerson} onPersonSelect={setSelectedPerson} onClose={()=>{setSelectedHouse(null);setCamera({x:0,y:0,scale:1});}} onChange={enterHouse}/> : <>
        <div className="mini-narrative"><span className="mini-chapter">0{index+1} / 03</span><h2>{view==='village'?(pt?'Escolhe uma casa. Entra na história.':'Choose a home. Step inside.') : titles[index].split('\n')[0]}</h2><p>{view==='village'?(pt?'Clica numa casa para descobrir quem lá vive. Amplia e arrasta para passear pelo bairro.':'Click a home to discover who lives there. Zoom and drag to explore the neighbourhood.'):view==='ages'?(pt?'As pessoas juntam-se pelo atributo escolhido. As cores ligam cada grupo ao bairro.':'People gather by the selected attribute. Colours connect each group to the neighbourhood.'):descriptions[index]}</p></div>
        <div className="mini-distribution" role="group" aria-label={pt?'Destacar um grupo':'Highlight a group'}>{distribution(lens).map((people,i)=><button key={i} aria-pressed={selectedGroup===i} onClick={()=>setSelectedGroup(selectedGroup===i?null:i)}><span><i style={{background:COLOURS[i]}}/>{FIELD_LABELS[locale][lens][i]}<strong>{people.length}</strong></span><span className="mini-bar-track"><span style={{width:`${people.length}%`,background:COLOURS[i]}}/></span></button>)}</div>
        </>}
        <label className="mini-filter"><input type="checkbox" checked={alone} onChange={e=>setAlone(e.target.checked)}/><span>{pt?'Destacar quem vive sozinho':'Highlight people living alone'}</span></label>
        <div className="mini-answer" aria-live="polite"><strong>{PEOPLE.filter(p=>(!alone||p.size===1)&&(selectedGroup===null||groupFor(p,lens)===selectedGroup)&&(selectedHouse===null||p.household===selectedHouse)).length}<span> / 100</span></strong><p>{alone?(pt?'pessoas vivem sozinhas neste exemplo':'people live alone in this example'):(pt?'pessoas em destaque neste exemplo':'people highlighted in this example')}</p></div>
        <button className="mini-tour" onClick={()=>{if(tour){setTour(false);}else{setSelectedHouse(null);setCamera({x:0,y:0,scale:1});setView('village');setPaused(false);setTour(true);}}} disabled={reduced}>{tour?<Pause size={16}/>:<Play size={16}/>} {tour?(pt?'Parar percurso':'Stop tour'):(pt?'Ver a transformação':'Watch the transformation')}</button>
        <label className="mini-house-picker" htmlFor="mini-house">{pt?'Ir para um agregado':'Go to a household'}<select id="mini-house" value={selectedHouse??''} onChange={e=>{if(e.target.value!=='')enterHouse(Number(e.target.value));}}><option value="">{pt?'Escolher uma casa…':'Choose a home…'}</option>{HOUSEHOLDS.map(h=><option key={h.id} value={h.id}>{pt?'Agregado':'Household'} {h.id+1} · {h.people.length} {pt?(h.people.length===1?'pessoa':'pessoas'):(h.people.length===1?'person':'people')}</option>)}</select></label>
      </aside>
      <section className="mini-stage" aria-label={pt?'População animada':'Animated population'}>
        <div className="mini-stage-top"><span><span className="mini-live-dot"/>{pt?'UM RETRATO EM MOVIMENTO':'A PORTRAIT IN MOTION'}</span><button onClick={()=>{setPaused(!paused);setTour(false);}} disabled={reduced} aria-label={paused?(pt?'Retomar movimento':'Resume motion'):(pt?'Pausar movimento':'Pause motion')}>{paused||reduced?<Play size={16}/>:<Pause size={16}/>}</button></div>
        <div className="mini-canvas"><Scene view={view} alone={alone} paused={paused||reduced} locale={locale} svgRef={svgRef} neighbourhood={neighbourhood} lens={lens} selectedHouse={selectedHouse} selectedPerson={selectedPerson} selectedGroup={selectedGroup} onHouseSelect={enterHouse} camera={camera} onCameraChange={next=>setCamera({...next,x:Math.min(140,Math.max(1000*(1-next.scale)-140,next.x)),y:Math.min(100,Math.max(600*(1-next.scale)-100,next.y))})}/></div>
        <div className="mini-stage-bottom"><span className="mini-stage-caption">{pt?'Cada figura é uma pessoa fictícia.':'Every figure is a fictional person.'}</span><div><button aria-label={pt?'Repor vista inicial':'Reset view'} onClick={reset}><RotateCcw size={17}/></button><button aria-label={pt?'Reduzir':'Zoom out'} disabled={view!=='village'||camera.scale<=.8} onClick={()=>zoomBy(-.4)}><Minus size={17}/></button><span className="mini-zoom-level">{Math.round(camera.scale*100)}%</span><button aria-label={pt?'Ampliar':'Zoom in'} disabled={view!=='village'||camera.scale>=4} onClick={()=>zoomBy(.4)}><Plus size={17}/></button></div></div>
        {selectedHouse!==null&&<div className="mini-selected-summary"><div><strong>{pt?'Agregado':'Household'} {selectedHouse+1}</strong><span>{HOUSEHOLDS[selectedHouse].people.length} {pt?(HOUSEHOLDS[selectedHouse].people.length===1?'pessoa fictícia':'pessoas fictícias'):(HOUSEHOLDS[selectedHouse].people.length===1?'fictional person':'fictional people')}</span></div><button onClick={()=>document.getElementById('mini-household-detail')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}>{pt?'Ver pessoas':'See people'}<ArrowRight size={14}/></button></div>}
        <div className="mini-legend" aria-label={pt?'Legenda':'Legend'}>{FIELD_LABELS[locale][lens].map((label,i)=><span key={label}><i style={{background:COLOURS[i]}}/>{label}</span>)}</div>
      </section>
    </div>
    <div className="mini-under"><p><Info size={16}/><span>{pt?'Um mundo inventado para explorar uma ideia. Os números não representam Portugal.':'An invented world to explore an idea. These numbers do not represent Portugal.'}</span></p><details><summary>{pt?'De onde vêm estes dados?':'Where does this data come from?'}</summary><p>{pt?'Esta demonstração usa 100 pessoas e 30 agregados criados para testar a experiência. Não contém registos da população sintética nacional. Os edifícios e movimentos são ilustrativos. Campo, costa, cidade e serra mudam a paisagem ilustrada, mantendo as mesmas pessoas. Os atributos de detalhe seguem os conceitos do esquema de microsíntese, mas a sua disponibilidade na versão nacional depende do dicionário final e das regras de publicação. A futura ligação aos Censos 2021 depende de resultados aprovados para publicação.':'This demonstration uses 100 people and 30 households created to test the experience. It contains no records from the national synthetic population. Buildings and movement are illustrative. Countryside, coast, city and hills change the illustrated landscape while keeping the same people. Detail attributes follow the microsynthesis schema concepts, but their national-release availability depends on the final dictionary and publication rules. A future connection to the 2021 Census depends on results approved for publication.'}</p><p>{DEMO_RELEASE}</p></details></div>
    <details className="mini-data"><summary><Users size={16}/>{pt?'Ver os números sem animação':'View the numbers without animation'}</summary><div className="mini-data-grid"><table><caption>{pt?'Distribuição · dados fictícios':'Distribution · fictional data'}</caption><thead><tr><th>{pt?'Grupo':'Group'}</th><th>{pt?'Pessoas':'People'}</th></tr></thead><tbody>{FIELD_LABELS[locale][lens].map((label,i)=><tr key={label}><th scope="row">{label}</th><td>{PEOPLE.filter(p=>groupFor(p,lens)===i).length}</td></tr>)}</tbody></table><table><caption>{pt?'Agregados · dados fictícios':'Households · fictional data'}</caption><thead><tr><th>{pt?'Dimensão':'Size'}</th><th>{pt?'Agregados':'Households'}</th><th>{pt?'Pessoas':'People'}</th></tr></thead><tbody>{[1,2,3,4,5].map(n=><tr key={n}><th scope="row">{n}</th><td>{HOUSEHOLDS.filter(h=>h.people.length===n).length}</td><td>{PEOPLE.filter(p=>p.size===n).length}</td></tr>)}</tbody></table></div></details>
    <p className="mini-notice" role="status">{notice}</p>
    <dialog ref={dialogRef} className="mini-dialog"><div className="mini-dialog-head"><h2>{pt?'O teu pequeno mundo, num postal.':'Your little world, on a postcard.'}</h2><button onClick={()=>dialogRef.current?.close()} autoFocus aria-label={pt?'Fechar':'Close'}><X size={20}/></button></div>{postcard&&<Image unoptimized src={postcard} alt={pt?'Pré-visualização do postal com a perspetiva atual e indicação de dados fictícios':'Postcard preview showing the current view and fictional data label'} width="1200" height="880"/>}<p>{pt?'Guarda a imagem para partilhar. O SVG mantém a animação quando aberto num navegador; as redes sociais podem mostrá-lo sem movimento.':'Save the image to share. The SVG keeps its animation when opened in a browser; social networks may show a still image.'}</p><div className="mini-dialog-actions"><button onClick={()=>save(false)} disabled={exporting}><ArrowDownToLine size={16}/>PNG</button><button onClick={()=>save(true)} disabled={exporting||reduced}><Play size={16}/>{pt?'SVG animado':'Animated SVG'}</button><button onClick={copyLink}><Link2 size={16}/>{pt?'Copiar ligação':'Copy link'}</button></div>{notice&&<p role="status"><Check size={14}/>{notice}</p>}</dialog>
  </main>;
}
