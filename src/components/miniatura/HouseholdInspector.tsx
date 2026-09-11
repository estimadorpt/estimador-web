'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { HOUSEHOLDS, FIELD_LABELS, details, householdDetails } from '@/lib/miniatura/population';
import { COLOURS } from './Scene';

export function HouseholdInspector({ household, locale, onClose, onChange, selectedPerson, onPersonSelect }: { household: number; locale: 'pt' | 'en'; onClose: () => void; onChange: (id:number) => void; selectedPerson: number | null; onPersonSelect: (id:number) => void }) {
  const pt=locale==='pt',home=HOUSEHOLDS[household],housing=householdDetails(household);
  const [housingOpen,setHousingOpen]=useState(false);
  const member=Math.max(0,home.people.findIndex(p=>p.id===selectedPerson));
  const person=home.people[member] ?? home.people[0], info=details(person);
  const labels=FIELD_LABELS[locale];
  return <section id="mini-household-detail" className="mini-inspector" aria-label={pt?'Detalhe do agregado':'Household details'}>
    <div className="mini-inspector-top"><span>{pt?'DENTRO DE CASA':'INSIDE THE HOME'}</span><button onClick={onClose} aria-label={pt?'Sair do agregado':'Leave household'}><X size={17}/></button></div>
    <h2>{pt?'Agregado':'Household'} {String(household+1).padStart(2,'0')}</h2>
    <p className="mini-inspector-sub">{home.people.length} {pt?(home.people.length===1?'pessoa fictícia':'pessoas fictícias'):(home.people.length===1?'fictional person':'fictional people')} · {housing.rooms} {pt?'divisões':'rooms'}</p>
    <div className="mini-members" role="group" aria-label={pt?'Escolher uma pessoa':'Choose a person'}>{home.people.map((p,i)=><button key={p.id} aria-pressed={member===i} onClick={()=>onPersonSelect(p.id)} aria-label={`${pt?'Pessoa':'Person'} ${p.id+1}, ${p.age} ${pt?'anos':'years'}`}><span className="mini-avatar" style={{background:COLOURS[p.band]}}><i/></span><span>{p.age}<small>{pt?'anos':'years'}</small></span></button>)}</div>
    <div className="mini-person-details" aria-live="polite"><h3>{pt?'Pessoa fictícia':'Fictional person'} #{String(person.id+1).padStart(3,'0')}</h3><dl>
      <div><dt>{pt?'Idade / sexo':'Age / sex'}</dt><dd>{person.age} · {info.sex==='F'?(pt?'Feminino':'Female'):(pt?'Masculino':'Male')}</dd></div>
      <div><dt>{pt?'Escolaridade':'Education'}</dt><dd>{labels.education[info.education]}</dd></div>
      <div><dt>{pt?'Atividade':'Activity'}</dt><dd>{labels.employment[info.employment]}</dd></div>
      <div><dt>{pt?'Deslocação':'Transport'}</dt><dd>{labels.transport[info.transport]}</dd></div>
      <div><dt>{pt?'Estado civil':'Marital status'}</dt><dd>{(pt?['Solteiro/a','Casado/a','Divorciado/a']:['Single','Married','Divorced'])[info.marital]}</dd></div>
      <div><dt>{pt?'Local de trabalho':'Work location'}</dt><dd>{info.workplace===null?(pt?'Não aplicável':'Not applicable'):(pt?['Em casa','No município','Noutro município']:['At home','In the municipality','Another municipality'])[info.workplace]}</dd></div>
    </dl></div>
    <button className="mini-housing-toggle" onClick={()=>setHousingOpen(!housingOpen)} aria-expanded={housingOpen}>{pt?'Explorar a habitação':'Explore the dwelling'}<span>{housingOpen?'−':'+'}</span></button>
    {housingOpen&&<dl className="mini-housing-facts"><div><dt>{pt?'Ocupação':'Tenure'}</dt><dd>{housing.tenure?(pt?'Arrendamento':'Rented'):(pt?'Propriedade':'Owned')}</dd></div><div><dt>{pt?'Construção':'Built'}</dt><dd>{['Antes de 1946','1946–1990','1991–2021'].map((s,i)=>pt?s:['Before 1946','1946–1990','1991–2021'][i])[housing.buildingPeriod]}</dd></div><div><dt>{pt?'Aquecimento':'Heating'}</dt><dd>{(pt?['Central','Individual','Sem aquecimento']:['Central','Individual','No heating'])[housing.heating]}</dd></div><div><dt>{pt?'Elevador':'Lift'}</dt><dd>{housing.elevator?(pt?'Sim':'Yes'):(pt?'Não':'No')}</dd></div><div><dt>{pt?'Acesso sem barreiras':'Step-free access'}</dt><dd>{housing.accessibility?(pt?'Sim':'Yes'):(pt?'Não':'No')}</dd></div></dl>}
    <p className="mini-detail-note">{pt?'Atributos inventados com base nos campos previstos. Não se inferem parentescos nem rotinas.':'Invented attributes based on planned fields. No relationships or routines are inferred.'}</p>
    <div className="mini-house-nav"><button onClick={()=>onChange((household+29)%30)} aria-label={pt?'Agregado anterior':'Previous household'}><ArrowLeft size={16}/></button><span>{household+1} / 30</span><button onClick={()=>onChange((household+1)%30)} aria-label={pt?'Agregado seguinte':'Next household'}><ArrowRight size={16}/></button></div>
  </section>;
}
