import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { Atlas } from '@/components/atlas/Atlas';
import { createPageMetadata } from '@/lib/metadata';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;return createPageMetadata({locale,path:'/populacao',title:locale==='pt'?'O atlas humano de Portugal — demonstração':'The human atlas of Portugal — demo',description:locale==='pt'?'Explora Portugal, compara lugares e encontra pessoas num atlas interativo com população fictícia.':'Explore Portugal, compare places and find people in an interactive atlas with a fictional population.',index:false});
}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <><Header/><Atlas locale={locale==='en'?'en':'pt'}/><SiteFooter locale={locale}/></>;}
