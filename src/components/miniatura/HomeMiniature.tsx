'use client';
import { useState } from 'react';
import { ArrowUpRight, Play, Pause } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Scene } from './Scene';
import './miniatura.css';

export function HomeMiniature({ locale }: { locale: 'pt' | 'en' }) {
  const pt=locale==='pt';
  const [live,setLive]=useState(false);
  return <section className="mini-home" data-live={live}><div className="mini-home-inner"><div className="mini-home-copy"><p className="mini-eyebrow">{pt?'O LABORATÓRIO DO ESTIMADOR':'THE ESTIMADOR LAB'}</p><h1>{pt?<>Portugal,<br/>à escala humana.</>:<>Portugal,<br/>on a human scale.</>}</h1><p>{pt?'Explora o país, compara lugares e descobre as pessoas por trás dos números. Do mapa à porta de casa.':'Explore the country, compare places and discover the people behind the numbers. From the map to a household.'}</p><Link href="/populacao" locale={locale}>{pt?'Explorar Portugal':'Explore Portugal'}<ArrowUpRight size={19}/></Link><span>{pt?'Demonstração interativa · dados fictícios':'Interactive demo · fictional data'}</span></div><div className="mini-home-world"><div aria-hidden="true"><Scene view="village" alone={false} paused={true} locale={locale}/></div><button type="button" className="mini-live" aria-pressed={live} onClick={()=>setLive(v=>!v)}>{live?<Pause size={13} aria-hidden="true"/>:<Play size={13} aria-hidden="true"/>}{live?(pt?'Parar a aldeia':'Pause the village'):(pt?'Dar vida à aldeia':'Bring the village to life')}</button></div></div></section>;
}
