'use client';
import { useState } from 'react';
import { ArrowUpRight, Play, Pause } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Scene } from './Scene';
import './miniatura.css';

export function HomeMiniature({ locale }: { locale: 'pt' | 'en' }) {
  const pt=locale==='pt';
  const [live,setLive]=useState(false);
  return <section className="mini-home" data-live={live}><div className="mini-home-inner"><div className="mini-home-copy"><p className="mini-eyebrow">{pt?'PESSOAS IMAGINADAS':'IMAGINED PEOPLE'}</p><h1>{pt?<>Portugal,<br/>à escala humana.</>:<>Portugal,<br/>on a human scale.</>}</h1><p>{pt?'Um exemplo com pessoas inventadas de como se constrói uma população sintética.':'An example, with invented people, of how a synthetic population is built.'}</p><Link href="/populacao/miniatura" locale={locale}>{pt?'Ver o exemplo':'See the example'}<ArrowUpRight size={19}/></Link><span>{pt?'Explicador · pessoas imaginadas':'Explainer · imagined people'}</span></div><div className="mini-home-world"><div aria-hidden="true"><Scene view="village" alone={false} paused={true} locale={locale}/></div><button type="button" className="mini-live" aria-pressed={live} onClick={()=>setLive(v=>!v)}>{live?<Pause size={13} aria-hidden="true"/>:<Play size={13} aria-hidden="true"/>}{live?(pt?'Parar a aldeia':'Pause the village'):(pt?'Dar vida à aldeia':'Bring the village to life')}</button></div></div></section>;
}
