import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { createPageMetadata } from '@/lib/metadata';
import { ATLAS_PEOPLE, ATLAS_RELEASE } from '@/lib/atlas/population';

export async function generateMetadata({params}: {params: Promise<{locale:string}>}) {
  const {locale}=await params;
  return createPageMetadata({locale,path:'/populacao/dados',title:locale==='pt'?'Posso usar os dados da população?':'Can I use the population data?',description:locale==='pt'?'O que está disponível, o que a demonstração permite e o que falta para investigação.':'Availability, demonstration limits and requirements for research.'});
}
export default async function PopulationData({params}: {params: Promise<{locale:string}>}) {
  const {locale}=await params; const pt=locale==='pt';
  const rows=pt ? [
    ['Pessoas e agregados', `${ATLAS_PEOPLE.length} pessoas fictícias, organizadas em agregados, para testar a experiência.`],
    ['Campos na demonstração', 'Idade, composição do agregado, escolaridade, atividade e transportes. São exemplos inventados, não distribuições validadas.'],
    ['Geografia', 'Navegação por distrito, município e freguesia. A presença de uma fronteira real não torna os exemplos representativos desse lugar.'],
    ['Uso adequado hoje', 'Experimentar a interface e discutir perguntas de investigação. Não estimar efeitos de políticas nem fazer inferências sobre a população real.'],
    ['Acesso para investigação', 'Não há nesta página uma versão nacional aprovada para descarga, licença de reutilização ou referência de citação.'],
  ] : [
    ['People and households', `${ATLAS_PEOPLE.length} fictional people organised into households to test the experience.`],
    ['Demonstration fields', 'Age, household composition, education, activity and transport. These are invented examples, not validated distributions.'],
    ['Geography', 'District, municipality and parish navigation. Real boundaries do not make the examples representative of those places.'],
    ['Appropriate use today', 'Explore the interface and discuss research questions. Do not estimate policy effects or infer characteristics of the real population.'],
    ['Research access', 'This page does not provide an approved national download, reuse licence or citation reference.'],
  ];
  return <div className="min-h-screen bg-paper"><Header/><PageHero width="5xl" compact back={{href:'/',label:pt?'INÍCIO':'HOME',locale}} eyebrow={pt?'POPULAÇÃO · PARA INVESTIGAÇÃO':'POPULATION · FOR RESEARCH'} title={pt?'Posso usar estes dados?':'Can I use these data?'} lede={pt?'Para experimentar a demonstração, sim. Para resultados de investigação sobre Portugal, ainda não.':'To explore the demonstration, yes. For research findings about Portugal, not yet.'}/>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <p className="mb-8 max-w-3xl text-lg leading-relaxed text-ink-muted">{pt?'Uma população sintética pode servir de base a microssimulações: estudar como uma mudança afeta pessoas e agregados diferentes. Esse potencial exige dados validados e um modelo adequado à pergunta. O atlas atual demonstra a exploração, não essa capacidade de estimar efeitos.':'A synthetic population can underpin microsimulation: studying how a change affects different people and households. That potential requires validated data and a model suited to the question. The current atlas demonstrates exploration, not the ability to estimate effects.'}</p>
      <h2 className="text-2xl">{pt?'O que está disponível agora':'What is available now'}</h2>
      <p className="mt-2 text-xs text-ink-muted">{ATLAS_RELEASE}</p>
      <dl className="mt-5 divide-y divide-line border-y border-line">{rows.map(([label,text])=><div key={label} className="grid gap-2 py-5 md:grid-cols-[220px_1fr]"><dt className="font-bold text-ink">{label}</dt><dd className="leading-relaxed text-ink-muted">{text}</dd></div>)}</dl>
      <section className="mt-10 max-w-3xl"><h2 className="text-2xl">{pt?'Antes de usar uma versão nacional':'Before using a national release'}</h2><p className="mt-3 leading-relaxed text-ink-muted">{pt?'Procura a versão e o ano de referência, o dicionário de variáveis, a cobertura geográfica, a validação das distribuições e relações familiares, as limitações, a licença e a forma de citar. Estes elementos devem acompanhar a versão publicada; os campos da demonstração não garantem o conteúdo dessa versão.':'Look for the release and reference year, variable dictionary, geographic coverage, validation of distributions and household relationships, limitations, licence and citation. These should accompany the published release; demonstration fields do not guarantee its contents.'}</p></section>
      <section className="mt-10 border-t border-line pt-7"><h2 className="text-2xl">{pt?'Qual é a tua pergunta de investigação?':'What is your research question?'}</h2><p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{pt?'Para discutir um possível uso, indica a pergunta, a geografia e as variáveis de que precisas. O contacto não implica acesso antecipado nem uma data de publicação.':'To discuss a potential use, describe your question, geography and required variables. Contact does not imply early access or a publication date.'}</p><div className="mt-5 flex flex-wrap gap-4"><Action external href="mailto:info@estimador.pt" arrow>{pt?'Discutir um uso':'Discuss a use case'}</Action><Action href="/populacao" locale={locale} variant="secondary" arrow>{pt?'Experimentar a demonstração':'Explore the demonstration'}</Action></div></section>
    </main><SiteFooter locale={locale}/></div>;
}
