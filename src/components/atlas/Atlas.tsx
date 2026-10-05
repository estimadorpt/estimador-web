'use client';
import { Link } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Globe2, Map, Users, SlidersHorizontal, Pause, Play, SkipForward, X, Link2 } from 'lucide-react';
import { ATLAS_PEOPLE, ATLAS_RELEASE, REGIONS, EMPTY_COHORT, matches, regionPeople, shares, readAtlasState, atlasQuery, type Cohort } from '@/lib/atlas/population';
import { FIELD_LABELS, LENSES, groupFor, type Lens } from '@/lib/miniatura/population';
import { cohortAnswer, aloneComparison, effectiveLens, filterOutcomeLabel, shareOf, questionDefaults } from '@/lib/atlas/cohort';
import { initialJourney, openExample, closeExample, setScope, changeMode, scopeToExample, cameraPlace, journeyParams, readExample, type Journey } from '@/lib/atlas/journey';
import { AtlasMap, ATLAS_COLOURS } from './AtlasMap';
import './atlas.css';
import { HouseholdInspector } from '@/components/miniatura/HouseholdInspector';
import '../miniatura/miniatura.css';
import { LocalMap } from './LocalMap';
import { MUNICIPALITIES, municipalityFor } from '@/lib/atlas/geography';

export function Atlas({locale}:{locale:'pt'|'en'}){
 const pt=locale==='pt';
 const panelRef=useRef<HTMLElement>(null),workspaceRef=useRef<HTMLDivElement>(null),answerRef=useRef<HTMLHeadingElement>(null),ageFilterRef=useRef<HTMLSelectElement>(null);
 const [panelOpen,setPanelOpen]=useState(false);
 // Which seeded question is on screen. Distinct from `nav`: this never affects counting.
 const [question,setQuestion]=useState<'older'|'compare'|'people'|null>(null);
 function revealQuestion(value:'older'|'compare'|'people'){setQuestion(value);workspaceRef.current?.scrollIntoView({block:'start',behavior:'instant'});requestAnimationFrame(()=>answerRef.current?.focus({preventScroll:true}));}
 // `nav` separates the analysis scope (what is counted) from the camera/example
 // location (what the map is currently showing). See src/lib/atlas/journey.ts.
 const [nav,setNav]=useState<Journey>(()=>initialJourney({region:'Portugal',municipality:'',parish:''},'map'));
 const scope=nav.scope,mode=nav.mode,camera=cameraPlace(nav);
 const town=municipalityFor(scope.municipality);
 const parishName=town?.parishes.find(p=>p.code===scope.parish)?.name;
 const exampleTown=nav.example?municipalityFor(nav.example.municipality):undefined;
 const exampleParishName=nav.example?exampleTown?.parishes.find(p=>p.code===nav.example!.parish)?.name:undefined;
 const exampleElsewhere=!!nav.example&&(camera.region!==scope.region||camera.municipality!==scope.municipality);
 useEffect(()=>{if(!nav.example)return;panelRef.current?.scrollTo({top:0});if((workspaceRef.current?.getBoundingClientRect().top??0)<60)workspaceRef.current?.scrollIntoView({block:'start',behavior:'instant'});},[nav.example,nav.example?.house,nav.example?.parish]);
 function chooseRegion(value:string){setNav(current=>setScope(current,{region:value,municipality:'',parish:''}));}
 function chooseMunicipality(value:string){setNav(current=>setScope(current,{region:municipalityFor(value)?.region??cameraPlace(current).region,municipality:value,parish:''},'map'));}
 function chooseParish(value:string){setNav(current=>{const here=cameraPlace(current);return setScope(current,{region:here.region,municipality:here.municipality,parish:value},'map');});}
 function zoomBack(){if(nav.example){setNav(closeExample(nav));setPanelOpen(false);}else if(scope.parish)chooseParish('');else if(scope.municipality)chooseMunicipality('');else chooseRegion('Portugal');}
 function openHouse(parishCode:string,id:number){const person=regionPeople(camera.region).find(p=>p.household===id)?.id??-1;setNav(current=>openExample(current,{municipality:camera.municipality,parish:parishCode,house:id,person}));setPanelOpen(true);}
 const [compare,setCompare]=useState('Porto');
 const [lens,setLens]=useState<Lens>('age');
 const [cohort,setCohort]=useState<Cohort>(EMPTY_COHORT),[paused,setPaused]=useState(false),[skipMotion,setSkipMotion]=useState(false),[ready,setReady]=useState(false),[notice,setNotice]=useState('');
 function askQuestion(id:'older'|'compare'|'people'){
  const defaults=questionDefaults(id);
  revealQuestion(id);setCohort(defaults.cohort);setLens(defaults.lens);setCompare(defaults.compare);setPanelOpen(false);
  setNav(current=>setScope(current,{region:defaults.region,municipality:'',parish:''},defaults.mode));
 }
 useEffect(()=>{
  const query=new URLSearchParams(window.location.search);
  if(!query.has('r')||query.get('r')===ATLAS_RELEASE){
   const state=readAtlasState(query);
   const q=query.get('question');
   const bareQuestion=(q==='older'||q==='compare'||q==='people')&&!query.has('age')&&!query.has('mode')&&!query.has('lens')&&!query.has('region')?q:null;
   const seed=bareQuestion?questionDefaults(bareQuestion):null;
   const startScope={region:seed?.region??state.region,municipality:state.municipality,parish:state.parish};
   const {example,priorMode}=readExample(query,startScope);
   const startMode=seed?.mode??state.mode;
   setNav(example?{scope:startScope,mode:'map',example,priorMode:priorMode??startMode}:initialJourney(startScope,startMode));
   setCompare(seed?.compare??state.compare);setLens(seed?.lens??state.lens);setCohort(seed?.cohort??state.cohort);
   if(q==='older'||q==='compare'||q==='people')setQuestion(q);
   if(example)setPanelOpen(true);
  } else setNotice(pt?'Esta ligação usa outra versão. A demonstração atual foi reposta.':'This link uses another version. The current demo has been restored.');
  setReady(true);
 },[pt]);
 useEffect(()=>{
  if(!ready)return;
  const query=new URLSearchParams(atlasQuery({region:scope.region,compare,mode,lens,cohort,municipality:scope.municipality,parish:scope.parish}));
  if(question)query.set('question',question);
  for(const [key,value] of Object.entries(journeyParams(nav)))query.set(key,value);
  window.history.replaceState(null,'',`${window.location.pathname}?${query}`);
 },[ready,nav,compare,lens,cohort,question]); // eslint-disable-line react-hooks/exhaustive-deps
 const population=regionPeople(scope.region),selected=population.filter(p=>matches(p,cohort)),other=regionPeople(compare),otherSelected=other.filter(p=>matches(p,cohort));
 const active=cohort.age>=0||cohort.employment>=0||cohort.alone;
 const percent=(n:number,total:number)=>new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(total?n/total:0);
 const filterSummary=active?[cohort.age>=0?FIELD_LABELS[locale].age[cohort.age]:null,cohort.employment>=0?FIELD_LABELS[locale].employment[cohort.employment]:null,cohort.alone?(pt?'vive sozinho':'lives alone'):null].filter(Boolean).join(' · '):(pt?'sem filtros de perfil':'no profile filters');
 const filterLabel=filterOutcomeLabel(cohort,FIELD_LABELS[locale].age,FIELD_LABELS[locale].employment,locale);
 // A lens that only restates an active filter (e.g. "age" once age is filtered) teaches nothing:
 // show a lens that still varies within the cohort, and say so.
 const shownLens=effectiveLens(lens,cohort);
 const lensSwitched=shownLens!==lens;
 const selectedCounts=FIELD_LABELS[locale][shownLens].map((label,index)=>({label,count:selected.filter(person=>groupFor(person,shownLens)===index).length}));
 const compareCounts=FIELD_LABELS[locale][shownLens].map((_,index)=>otherSelected.filter(person=>groupFor(person,shownLens)===index).length);
 const household=selected[0];
 const answer=cohortAnswer(population,cohort);
 const alone=aloneComparison(population,cohort);
 const ageLabelEn=cohort.age>=0?FIELD_LABELS.en.age[cohort.age].replace(/^Ages /,''):'';
 function meetHousehold(){
  if(!household)return;
  const m=town??MUNICIPALITIES.find(m=>m.region===household.region)!;
  const code=scope.parish||m.parishes[0].code;
  setNav(current=>openExample(current,{municipality:m.code,parish:code,house:household.household,person:household.id}));
  setPanelOpen(true);
 }
 function resetFilters(){setCohort(EMPTY_COHORT);setNotice(pt?'Filtros limpos. Podes escolher outro perfil.':'Filters cleared. You can choose another profile.');requestAnimationFrame(()=>ageFilterRef.current?.focus());}
 async function share(){try{await navigator.clipboard.writeText(window.location.href);setNotice(pt?'Ligação copiada com os lugares e filtros escolhidos.':'Link copied with your selected places and filters.');}catch{setNotice(pt?'Podes copiar a ligação da barra de endereços.':'Copy the link from your address bar.');}}
 return <main id="main-content" tabIndex={-1} className="atlas-shell">
  <div className="atlas-kicker"><span><Globe2 size={15}/>{pt?'O ATLAS HUMANO':'THE HUMAN ATLAS'}</span><span>{pt?'PRÉVIA · POPULAÇÃO FICTÍCIA':'PREVIEW · FICTIONAL POPULATION'}</span></div>
  <header className="atlas-heading"><div><h1>{pt?<>O que mostram pessoas fictícias<br/><em>ligadas entre si?</em></>:<>What can linked<br/><em>fictional people show?</em></>}</h1><p>{pt?'Experimenta uma pergunta com pessoas fictícias. Os resultados demonstram a ferramenta, não descrevem Portugal.':'Try a question with fictional people. Results demonstrate the tool; they do not describe Portugal.'}</p></div><button className="atlas-share" onClick={share}><Link2 size={16}/>{pt?'Partilhar perspetiva':'Share this view'}</button></header>
  <div className="atlas-prompts"><span>{pt?'COMEÇA POR UMA PERGUNTA':'START WITH A QUESTION'}</span><button onClick={()=>askQuestion('older')}>{pt?'Encontrar idosos que vivem sozinhos':'Find older people living alone'}<ArrowRight size={15}/></button><button onClick={()=>askQuestion('compare')}>{pt?'Lisboa e Bragança, lado a lado':'Lisboa and Bragança, side by side'}<ArrowRight size={15}/></button><button onClick={()=>askQuestion('people')}>{pt?'Vê o país transformar-se em pessoas':'Watch the country become people'}<ArrowRight size={15}/></button></div>
  <p className="mb-5 text-sm text-ink-muted">{pt?'Para investigação: ':'For research: '}<Link href="/populacao/dados" locale={locale} className="font-semibold underline underline-offset-4">{pt?'ver disponibilidade e limites dos dados':'check data availability and limits'}</Link></p>
  <div ref={workspaceRef} tabIndex={-1} style={{scrollMarginTop:80}} aria-label={pt?'Resultado da exploração':'Exploration result'} className="atlas-workspace atlas-immersive" data-panel-open={panelOpen}>
   <section className="atlas-world" aria-label={pt?'Explorar Portugal':'Explore Portugal'}>
    <div className="atlas-world-top"><div className="atlas-modes" role="group" aria-label={pt?'Perspetiva':'View'}>{(['map','distribution','compare'] as const).map((m,i)=><button key={m} aria-pressed={mode===m} onClick={()=>setNav(current=>changeMode(current,m))}>{i===0?<Map size={15}/>:i===1?<Users size={15}/>:null}{(pt?['Território','Pessoas','Comparar']:['Territory','People','Compare'])[i]}</button>)}</div><button className="atlas-profile-toggle" aria-label={pt?'Lugares e perfil':'Places and profile'} aria-expanded={panelOpen} aria-controls="atlas-profile-panel" onClick={()=>setPanelOpen(!panelOpen)}><SlidersHorizontal size={16}/><span>{pt?'Lugares e perfil':'Places and profile'}</span></button><button className="atlas-pause" aria-pressed={skipMotion} onClick={()=>setSkipMotion(!skipMotion)} aria-label={pt?'Saltar a animação da câmara':'Skip the camera animation'}><SkipForward size={17}/></button><button className="atlas-pause" onClick={()=>setPaused(!paused)} aria-label={paused?(pt?'Retomar movimento':'Resume motion'):(pt?'Pausar movimento':'Pause motion')}>{paused?<Play size={17}/>:<Pause size={17}/>}</button></div>
    {question&&<div className="px-6 pt-10 pb-3"><h2 ref={answerRef} tabIndex={-1} className="text-sm leading-relaxed text-[#f5efd9]">{question==='older'?(answer.ageGroupTotal!==null?(pt?`Entre as ${answer.ageGroupTotal} pessoas fictícias com ${FIELD_LABELS.pt.age[cohort.age]}, ${answer.matched} vivem sozinhas (${percent(answer.matched,answer.ageGroupTotal)}). São ${percent(answer.matched,answer.total)} das ${answer.total} pessoas deste exemplo.`:`Among the ${answer.ageGroupTotal} fictional people aged ${ageLabelEn}, ${answer.matched} live alone (${percent(answer.matched,answer.ageGroupTotal)}). That is ${percent(answer.matched,answer.total)} of the ${answer.total} people in this example.`):(pt?`${answer.matched} de ${answer.total} pessoas fictícias correspondem aos filtros atuais.`:`${answer.matched} of ${answer.total} fictional people match the current filters.`)):question==='compare'?(pt?'Compara as proporções de dois exemplos fictícios na mesma escala. Muda os lugares ou o olhar; estas diferenças não são conclusões sobre Portugal.':'Compare two fictional examples on the same scale. Change places or lens; these differences are not findings about Portugal.'):(pt?'As cores agrupam as pessoas pela idade. Em Lugares e perfil podes mudar o olhar para escolaridade, emprego ou transportes.':'Colours group people by age. In Places and profile you can switch to education, employment or transport.')} </h2>{question==='older'&&<p className="mt-1 text-[11px] text-[#b7c9b5]">{pt?`${answer.matchedHouseholds} agregados fictícios correspondem a esta seleção.`:`${answer.matchedHouseholds} fictional households match this selection.`}</p>}<p className="mt-2 text-[11px] text-[#b7c9b5]">{pt?`Escopo atual: ${scope.region} · população fictícia de demonstração · ${filterSummary}.`:`Current scope: ${scope.region} · fictional demonstration population · ${filterSummary}.`}</p></div>}
    {question==='older'&&<div className="px-6 pb-4"><div className="atlas-alone-chart" role="group" aria-label={pt?'Vivem sozinhas ou com outras pessoas, entre as pessoas mais velhas deste exemplo':'Live alone or with others, among the older people in this example'}><div className="atlas-alone-bar"><span>{pt?'Vivem sozinhas':'Live alone'}</span><div className="atlas-alone-track"><i style={{width:`${shareOf(alone.alone,alone.total)*100}%`}}/></div><strong>{alone.alone} · {percent(alone.alone,alone.total)}</strong></div><div className="atlas-alone-bar"><span>{pt?'Vivem com outras pessoas':'Live with others'}</span><div className="atlas-alone-track"><i style={{width:`${shareOf(alone.withOthers,alone.total)*100}%`}}/></div><strong>{alone.withOthers} · {percent(alone.withOthers,alone.total)}</strong></div></div></div>}
    {question==='older'&&<div className="flex flex-wrap gap-3 px-6 pb-4"><button className="rounded-lg bg-[#eeeadd] px-4 py-3 text-sm font-semibold text-[#193c32]" onClick={meetHousehold} disabled={!household}>{pt?'Conhecer um agregado':'Meet a household'}</button><button className="px-3 py-3 text-sm underline underline-offset-4" onClick={()=>setPanelOpen(true)}>{pt?'Ajustar filtros':'Adjust filters'}</button></div>}
    <div className="atlas-breadcrumb" data-root={scope.region==='Portugal'}><button onClick={()=>chooseRegion('Portugal')}>Portugal</button>{scope.region!=='Portugal'&&<><span>/</span><button aria-label={`${pt?'Voltar ao distrito ou região':'Back to district or region'}: ${scope.region}`} onClick={()=>chooseMunicipality('')}>{scope.region}</button>{town&&mode==='map'&&<><span>/</span><button aria-label={`${pt?'Voltar ao município':'Back to municipality'}: ${town.name}`} onClick={()=>chooseParish('')}>{town.name}</button></>}{parishName&&mode==='map'&&<><span>/</span><button onClick={()=>{setNav(current=>closeExample(current));setPanelOpen(false);}}>{parishName}</button></>}<button aria-label={pt?'Ver todo o país':'See the whole country'} onClick={()=>chooseRegion('Portugal')}><X size={13}/></button></>}</div>
    {mode==='compare'?<div className="atlas-comparison"><div className="atlas-compare-intro"><span>{pt?'DOIS LUGARES. A MESMA ESCALA.':'TWO PLACES. THE SAME SCALE.'}</span><h2>{pt?'O que nos aproxima?':'What connects us?'}</h2><p>{pt?'Proporções nos exemplos fictícios. Cada ponto representa 1% do grupo em destaque.':'Proportions in the fictional examples. Each dot represents 1% of the highlighted group.'}</p></div><div className="atlas-compare-grid">{[{name:scope.region,people:selected,total:population.length},{name:compare,people:otherSelected,total:other.length}].map((item,index)=>{const values=shares(item.people,shownLens);return <div key={index} className="atlas-compare-place"><label htmlFor={`atlas-place-${index}`}>{index===0?(pt?'Primeiro lugar':'First place'):(pt?'Segundo lugar':'Second place')}</label><select id={`atlas-place-${index}`} value={item.name} onChange={e=>index===0?chooseRegion(e.target.value):setCompare(e.target.value)}><option>Portugal</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select><div className="atlas-hundred" aria-label={pt?'100 pontos normalizados pela distribuição':'100 dots normalized to the distribution'}>{item.people.length?Array.from({length:100},(_,i)=>{let sum=0;const group=values.findIndex(v=>{sum+=v;return (i+.5)/100<=sum;});return <span key={i} style={{background:ATLAS_COLOURS[Math.max(0,group)]}}/>;}):<p>{pt?'Sem correspondências':'No matches'}</p>}</div><p className="atlas-sample">{item.people.length} / {item.total} {pt?'pessoas fictícias':'fictional people'} · {percent(item.people.length,item.total)}</p><div className="atlas-compare-bars">{values.map((v,i)=><div key={i}><span>{FIELD_LABELS[locale][shownLens][i]}<strong>{percent(v,1)}</strong></span><div><i style={{width:`${v*100}%`,background:ATLAS_COLOURS[i]}}/></div></div>)}</div></div>;})}</div></div>:<div className="atlas-map-stack"><div hidden={mode!=='distribution'}><AtlasMap locale={locale} region={scope.region} cohort={cohort} lens={shownLens} distribution={true} paused={paused} onRegion={chooseRegion}/></div><div hidden={mode!=='map'} className="atlas-continuous-layer"><LocalMap locale={locale} region={camera.region} municipality={camera.municipality} parish={camera.parish} onRegion={chooseRegion} onMunicipality={chooseMunicipality} onParish={chooseParish} onBack={zoomBack} cohort={cohort} lens={shownLens} paused={paused} instant={skipMotion} selectedHouse={nav.example?.house??null} selectedPerson={nav.example&&nav.example.person>=0?nav.example.person:null} onHouse={openHouse}/></div></div>}

    <div className="atlas-world-bottom"><div className="atlas-legend" >{FIELD_LABELS[locale][shownLens].map((label,i)=><span key={label}><i style={{background:ATLAS_COLOURS[i]}}/>{label}</span>)}</div><p>{mode==='map'?(pt?(scope.region==='Portugal'?'Cada ponto é uma pessoa fictícia. Clica num distrito ou região.':'As mesmas pessoas fictícias acompanham o zoom.'):(scope.region==='Portugal'?'Each dot is a fictional person. Select a district or region.':'The same fictional people follow the zoom.')):mode==='distribution'?(pt?'As mesmas pessoas, agrupadas. Os filtros mantêm a seleção.':'The same people, grouped. Filters preserve the selection.'):(pt?'Comparação distrital · percentagens arredondadas.':'District comparison · rounded percentages.')}</p></div>
    <section className="atlas-accessible-summary" aria-label={pt?'Resumo acessível do exemplo fictício':'Accessible fictional-example summary'}><h2>{pt?'Resumo em tabela':'Table summary'}</h2><p>{pt?`Exemplo fictício em ${scope.region}${mode==='compare'?` e ${compare}`:''}; ${filterSummary}. Esta tabela não descreve a população real destes lugares.`:`Fictional example in ${scope.region}${mode==='compare'?` and ${compare}`:''}; ${filterSummary}. This table does not describe the real population of these places.`}</p><table><caption>{pt?`Distribuição por ${['idade','escolaridade','atividade','transportes'][LENSES.indexOf(shownLens)]}, entre pessoas fictícias selecionadas.`:`Distribution by ${shownLens}, among selected fictional people.`}</caption><thead><tr><th scope="col">{pt?'Grupo':'Group'}</th><th scope="col">{scope.region}</th>{mode==='compare'&&<th scope="col">{compare}</th>}</tr></thead><tbody>{selectedCounts.map(({label,count},index)=><tr key={label}><th scope="row">{label}</th><td>{count} · {percent(count,selected.length)}</td>{mode==='compare'&&<td>{compareCounts[index]} · {percent(compareCounts[index],otherSelected.length)}</td>}</tr>)}</tbody></table></section>
   </section>
   <aside ref={panelRef} id="atlas-profile-panel" className="atlas-panel" inert={!panelOpen} aria-hidden={!panelOpen}><div className="atlas-drawer-title"><strong>{pt?'A tua perspetiva':'Your perspective'}</strong><button aria-label={pt?'Fechar painel':'Close panel'} onClick={()=>setPanelOpen(false)}><X size={18}/></button></div>
    {nav.example&&<div className="atlas-inline-house">
     <div className="atlas-example-note">
      <span>{pt?'EXEMPLO DENTRO DA RESPOSTA':'EXAMPLE INSIDE THE ANSWER'}</span>
      <p>{pt?`Uma pessoa entre as ${selected.length} que respondem à tua pergunta em ${scope.region}${exampleParishName?`, ilustrada em ${exampleParishName}${exampleTown?`, ${exampleTown.name}`:''}`:''}. Entrar nesta casa não muda essa contagem.`:`One person among the ${selected.length} who answer your question in ${scope.region}${exampleParishName?`, illustrated in ${exampleParishName}${exampleTown?`, ${exampleTown.name}`:''}`:''}. Entering this home does not change that count.`}</p>
      {exampleElsewhere&&<button className="atlas-scope-action" onClick={()=>setNav(current=>scopeToExample(current))}>{pt?`Analisar só ${camera.region}`:`Analyse ${camera.region} only`}</button>}
     </div>
     <HouseholdInspector household={nav.example.house} locale={locale} selectedPerson={nav.example.person>=0?nav.example.person:null} onPersonSelect={id=>setNav(current=>current.example?{...current,example:{...current.example,person:id}}:current)} onClose={()=>setNav(current=>closeExample(current))} onChange={id=>{
      const homes=[...new Set(regionPeople(camera.region).map(p=>p.household))];
      const current=nav.example!.house;
      const direction=id===(current+1)%30?1:-1;
      const next=homes[(homes.indexOf(current)+direction+homes.length)%homes.length];
      const person=regionPeople(camera.region).find(p=>p.household===next)?.id??-1;
      setNav(state=>state.example?openExample(state,{...state.example,house:next,person}):state);
     }}/>
    </div>}

    <label className="atlas-field" htmlFor="atlas-region">{pt?'01 / ESCOLHE UM LUGAR':'01 / CHOOSE A PLACE'}<select id="atlas-region" value={scope.region} onChange={e=>chooseRegion(e.target.value)}><option>Portugal</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></label>
    {scope.region!=='Portugal'&&<div className="atlas-local-selectors"><label htmlFor="atlas-municipality">{pt?'Município':'Municipality'}<select id="atlas-municipality" value={scope.municipality} onChange={e=>chooseMunicipality(e.target.value)}><option value="">{pt?'Todos os municípios':'All municipalities'}</option>{MUNICIPALITIES.filter(m=>m.region===scope.region).sort((a,b)=>a.name.localeCompare(b.name,'pt')).map(m=><option key={m.code} value={m.code}>{m.name}</option>)}</select></label>{town&&<label htmlFor="atlas-parish">{pt?'Freguesia':'Parish'}<select id="atlas-parish" value={scope.parish} onChange={e=>chooseParish(e.target.value)}><option value="">{pt?'Todas as freguesias':'All parishes'}</option>{[...town.parishes].sort((a,b)=>a.name.localeCompare(b.name,'pt')).map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></label>}<p>{parishName?`${parishName} · ${scope.parish}`:town?`${town.parishes.length} ${pt?'freguesias':'parishes'}`:`${MUNICIPALITIES.filter(m=>m.region===scope.region).length} ${pt?'municípios':'municipalities'}`} · CAOP 2021</p><p>{pt?'Estas pessoas e casas são ilustrativas e acompanham o zoom. Não são estimativas da população local.':'These illustrative people and homes follow the zoom. They are not local population estimates.'}</p></div>}
    <label className="atlas-field" htmlFor="atlas-lens">{pt?'02 / MUDA O OLHAR':'02 / CHANGE YOUR LENS'}<select id="atlas-lens" value={lens} onChange={e=>setLens(e.target.value as Lens)}>{LENSES.map((l,i)=><option value={l} key={l}>{(pt?['Idade','Escolaridade','Emprego','Transportes']:['Age','Education','Employment','Transport'])[i]}</option>)}</select></label>
    <p className="atlas-lens-hint">{pt?'O olhar muda a cor e o agrupamento. Não muda quem está a ser contado.':'The lens changes colour and grouping. It does not change who is counted.'}</p>
    {lensSwitched&&<p className="atlas-lens-note">{pt?`A idade já está filtrada, por isso mostramos ${(pt?['idade','escolaridade','emprego','transportes']:['age','education','employment','transport'])[LENSES.indexOf(shownLens)]} em vez disso.`:`Age is already filtered, so we show ${shownLens} instead.`}</p>}
    <div className="atlas-cohort"><div className="atlas-cohort-title"><Users size={18}/><h2>{pt?'Pessoas como…':'People like…'}</h2>{active&&<button onClick={resetFilters}>{pt?'Limpar':'Clear'}</button>}</div><p>{pt?'Estes filtros escolhem quem é contado no exemplo fictício.':'These filters choose who is counted in the fictional example.'}</p>{filterLabel&&<p className="atlas-active-filter">{filterLabel}</p>}<label htmlFor="atlas-age">{pt?'Idade':'Age'}<select ref={ageFilterRef} id="atlas-age" value={cohort.age} onChange={e=>setCohort({...cohort,age:Number(e.target.value)})}><option value={-1}>{pt?'Todas as idades':'All ages'}</option>{FIELD_LABELS[locale].age.map((l,i)=><option value={i} key={l}>{l}</option>)}</select></label><label htmlFor="atlas-employment">{pt?'Atividade':'Activity'}<select id="atlas-employment" value={cohort.employment} onChange={e=>setCohort({...cohort,employment:Number(e.target.value)})}><option value={-1}>{pt?'Todas as situações':'All situations'}</option>{FIELD_LABELS[locale].employment.map((l,i)=><option value={i} key={l}>{l}</option>)}</select></label><label className="atlas-check"><input type="checkbox" checked={cohort.alone} onChange={e=>setCohort({...cohort,alone:e.target.checked})}/>{pt?'Vive sozinho':'Lives alone'}</label></div>
    <div className="atlas-result" aria-live="polite"><span>{scope.region} · {pt?'EXEMPLO FICTÍCIO':'FICTIONAL EXAMPLE'}</span><strong>{selected.length}<small> / {population.length}</small></strong><p>{pt?'pessoas correspondem à tua seleção neste exemplo':'people match your selection in this example'} · {percent(selected.length,population.length)}</p>{selected.length===0&&<p>{pt?'Este exemplo não contém esse perfil. Experimenta retirar os filtros; o foco regressa à idade.':'This example has no matching profile. Clear the filters; focus returns to age.'}</p>}{selected.length===0&&<button className="atlas-reset" onClick={resetFilters}>{pt?'Limpar os filtros':'Clear the filters'}</button>}</div>
    {household&&<button className="atlas-enter" onClick={meetHousehold}><div><span>{pt?'POR DENTRO DA ESTATÍSTICA':'INSIDE THE STATISTIC'}</span><strong>{pt?'Conhece um agregado':'Meet a household'}</strong><small>{household.region} · {household.size} {pt?(household.size===1?'pessoa fictícia':'pessoas fictícias'):(household.size===1?'fictional person':'fictional people')}</small></div><ArrowUpRight size={23}/></button>}
   </aside>
  </div>

  <footer className="atlas-method" id="metodo"><p><strong>{pt?'Geografia real. População de demonstração.':'Real geography. Demonstration population.'}</strong> {pt?`As ${ATLAS_PEOPLE.length} pessoas deste atlas foram inventadas para testar a experiência. As diferenças entre lugares não representam Portugal.`:`The ${ATLAS_PEOPLE.length} people in this atlas were invented to test the experience. Differences between places do not represent Portugal.`}</p><details><summary>{pt?'O que chega com a população nacional?':'What comes with the national population?'}</summary><p>{pt?'A ligação à população sintética nacional depende da versão aprovada para publicação. Os totais, filtros e comparações serão calculados a partir dessa versão. O detalhe por município e freguesia depende da cobertura e qualidade disponibilizadas. As ilustrações não localizam pessoas em moradas reais.':'The national synthetic population will be connected when a release is approved for publication. Totals, filters and comparisons will be calculated from that release. Municipality and parish detail depends on available coverage and quality. Illustrations do not place people at real addresses.'}</p><p>{ATLAS_RELEASE}</p></details></footer><p className="atlas-notice" role="status">{notice}</p>
 </main>;
}
