import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { LogoHorizontal, Mark, MarkSmall } from '@/components/Logo';
import { Mosaic } from '@/components/brand/Mosaic';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { Action } from '@/components/brand/Action';
import { VizShowcase } from '@/components/viz/Showcase';
import { BRAND } from '@/lib/brand';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: '/marca',
    title: locale === 'pt' ? 'A marca estimador.pt' : 'The estimador.pt brand',
    description: locale === 'pt'
      ? 'Símbolo, cor, tipo, mosaico e movimento: o guia da identidade do estimador.pt, com os ficheiros para descarregar.'
      : 'Mark, colour, type, mosaic and motion: the estimador.pt identity guide, with the files to download.',
    index: false,
  });
}

const SURFACES = [
  ['Papel', 'paper', BRAND.paper, 'O chão de todas as páginas.'],
  ['Creme', 'cream', BRAND.cream, 'Painéis, cartões, linhas de tabela.'],
  ['Pergaminho', 'parchment', BRAND.parchment, 'Zonas afundadas e estados de hover.'],
  ['Linha', 'line', BRAND.line, 'Filetes e separadores.'],
] as const;
const INKS = [
  ['Pinho', 'ink', BRAND.ink, 'Texto, botões, o símbolo.'],
  ['Pinho escuro', 'ink-dark', BRAND.inkDark, 'Hover de ligações e botões.'],
  ['Cinza-verde', 'stone-500', BRAND.muted, 'Texto secundário, 4,5:1 sobre papel.'],
  ['Cinza claro', 'stone-400', BRAND.faint, 'Etiquetas pequenas e o .pt da assinatura.'],
  ['Floresta', 'forest', BRAND.forest, 'Superfícies escuras: o mundo do atlas, cartões sociais.'],
] as const;
const DATA = [
  ['Menta', 'mint', BRAND.mint, BRAND.mintSoft, 'mint-soft'],
  ['Mostarda', 'mustard', BRAND.mustard, BRAND.mustardSoft, 'mustard-soft'],
  ['Coral', 'coral', BRAND.coral, BRAND.coralSoft, 'coral-soft'],
  ['Pervinca', 'periwinkle', BRAND.periwinkle, BRAND.periwinkleSoft, 'periwinkle-soft'],
] as const;
const SEMANTIC = [
  ['Positivo', 'positive', BRAND.tree, 'Subidas, sinal positivo.'],
  ['Negativo', 'negative', BRAND.terracotta, 'Descidas, sinal negativo, erros.'],
  ['Aviso', 'gold', BRAND.gold, 'Dados desatualizados, provisórios. Nunca na marca.'],
  ['Teal', 'teal', BRAND.teal, 'A cor da secção Economia.'],
] as const;
const KIT = [
  ['branding/avatar-1024-forest.png', '1024 × 1024', 'Avatar em todas as redes'],
  ['branding/avatar-1024-paper.png', '1024 × 1024', 'Avatar claro'],
  ['images/brand/banner-1500x500.png', '1500 × 500', 'Cabeçalho do X e do Bluesky'],
  ['branding/banner-1500x500-dark.png', '1500 × 500', 'Cabeçalho, sobre floresta'],
  ['branding/linkedin-cover-light.png', '1584 × 396', 'Capa do LinkedIn, clara'],
  ['branding/linkedin-cover-dark.png', '1584 × 396', 'Capa do LinkedIn, sobre floresta'],
  ['branding/linkedin-post-light.png', '1200 × 1200', 'Publicação quadrada, clara'],
  ['branding/linkedin-post-dark.png', '1200 × 1200', 'Publicação quadrada, sobre floresta'],
  ['branding/post-1600x900-light.png', '1600 × 900', 'Publicação 16:9'],
  ['branding/story-1080x1920-light.png', '1080 × 1920', 'Story, clara'],
  ['branding/story-1080x1920-dark.png', '1080 × 1920', 'Story, sobre floresta'],
] as const;
const FILES = [
  ['estimador-logo.svg', 'Assinatura, pinho sobre transparente'],
  ['estimador-logo-paper.svg', 'Assinatura, papel sobre transparente, para fundos escuros'],
  ['estimador-logo@4x.png', 'Assinatura em PNG, 880 px'],
  ['estimador-logo-paper@4x.png', 'Assinatura em PNG sobre floresta'],
  ['estimador-mark.svg', 'Símbolo completo, 48 × 24'],
  ['estimador-mark-paper.svg', 'Símbolo completo, papel'],
  ['estimador-mark-small.svg', 'Símbolo reduzido, 32 × 32, para menos de 24 px'],
  ['estimador-app-icon.svg', 'Ícone de app, papel sobre floresta'],
  ['estimador-app-icon-512.png', 'Ícone de app em PNG, 512 px'],
] as const;

function Section({ id, kicker, title, lede, children }: { id: string; kicker: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-line py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{kicker}</p>
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        {lede && <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Swatch({ name, token, hex, note, light }: { name: string; token: string; hex: string; note?: string; light?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-16 rounded-lg border border-line" style={{ backgroundColor: hex }} />
      <div className="text-sm font-semibold text-ink">{name}</div>
      <div className="font-mono text-[11px] text-stone-500">{hex} · {token}</div>
      {note && <div className={`text-xs leading-snug ${light ? 'text-stone-500' : 'text-stone-600'}`}>{note}</div>}
    </div>
  );
}

function Rule({ yes, children }: { yes: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-ink">
      <span className={`mt-1.5 inline-block h-2.5 w-2.5 flex-none rounded-full ${yes ? 'bg-tree' : 'bg-terracotta'}`} aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default async function BrandPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const pt = locale !== 'en';
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <PageHero
        width="5xl"
        eyebrow={pt ? 'Marca · guia de identidade' : 'Brand · identity guide'}
        title={pt ? 'Uma mediana sobre um intervalo.' : 'A median on an interval.'}
        lede={pt
          ? 'O estimador.pt publica estimativas com a incerteza à vista. A marca é isso mesmo: um intervalo de credibilidade desenhado numa só tinta, o nome na fonte da interface, e um mosaico de pastéis reservado para as superfícies onde não há dados a ler.'
          : 'estimador.pt publishes estimates with their uncertainty in plain sight. The brand is exactly that: a credible interval drawn in one ink, the name in the interface face, and a pastel mosaic reserved for surfaces where nothing is being measured.'}
        meta={<span>{pt ? 'Versão de setembro de 2026 · ficheiros no fim da página' : 'September 2026 · files at the end of the page'}</span>}
        art={<Mosaic variant="corner" className="h-full w-full" />}
      />

      <Section id="simbolo" kicker="01" title={pt ? 'O símbolo' : 'The mark'} lede={pt ? 'Um intervalo: duas extremidades quadradas, uma faixa, um ponto vazado ligeiramente à esquerda do centro. Um só caminho, uma só cor. Os bigodes mantêm-se em todos os tamanhos; abaixo de 24 px ficam mais curtos, com extremidades mais espessas.' : 'An interval: two square caps, a band, a punched counter slightly left of centre. One path, one colour. Whiskers stay at every size; below 24px they become shorter, with thicker caps.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-44 items-center justify-center rounded-xl border border-line bg-cream"><Mark height={64} color={BRAND.ink} title="Símbolo sobre creme" /></div>
          <div className="flex h-44 items-center justify-center rounded-xl bg-forest"><Mark height={64} color={BRAND.paper} title="Símbolo sobre floresta" /></div>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-8">
          {[48, 32, 24].map(h => (
            <div key={h} className="flex flex-col items-center gap-2"><div className="flex h-14 items-center"><Mark height={h} color={BRAND.ink} /></div><span className="text-[11px] text-stone-500">{h} px</span></div>
          ))}
          {[20, 16].map(s => (
            <div key={s} className="flex flex-col items-center gap-2"><div className="flex h-14 items-center"><MarkSmall size={s} color={BRAND.ink} /></div><span className="text-[11px] text-stone-500">{s} px</span></div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 items-center"><div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-line bg-cream px-3 py-2"><MarkSmall size={16} color={BRAND.ink} /><span className="text-xs text-ink">estimador.pt</span></div></div>
            <span className="text-[11px] text-stone-500">favicon</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest"><MarkSmall size={38} color={BRAND.paper} /></div></div>
            <span className="text-[11px] text-stone-500">{pt ? 'ícone de app' : 'app icon'}</span>
          </div>
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Pinho sobre claro, papel sobre escuro. Nada mais.' : 'Pine on light, paper on dark. Nothing else.'}</Rule>
          <Rule yes>{pt ? 'Mínimo 16 px. Nunca retirar os bigodes nem recentrar o ponto.' : 'Minimum 16px. Never remove the whiskers or recentre the counter.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca uma faixa colorida: menta, mostarda ou coral no símbolo voltam a fazer dele um interruptor ou uma bandeira.' : 'Never a coloured band: mint, mustard or coral in the mark turn it back into a switch or a flag.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca dentro de um gráfico: a tabela da Liga já desenha intervalos nas cores dos clubes.' : 'Never inside a chart: the league table already draws intervals in club colours.'}</Rule>
        </ul>
      </Section>

      <Section id="assinatura" kicker="02" title={pt ? 'A assinatura' : 'The signature'} lede={pt ? 'O símbolo e o nome em Manrope 800, com o .pt em cinza. Há uma só assinatura: não existe versão em serifa nem versão empilhada.' : 'The mark and the name in Manrope 800, with the .pt in grey. There is one signature: no serif version, no stacked version.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-40 items-center justify-center rounded-xl border border-line bg-cream"><span className="brand-link inline-block"><LogoHorizontal size={34} /></span></div>
          <div className="flex h-40 items-center justify-center rounded-xl bg-forest"><span className="brand-link inline-block"><LogoHorizontal size={34} tone="paper" /></span></div>
        </div>
        <p className="mt-3 text-xs text-stone-500">{pt ? 'Passa o rato por cima: o intervalo abre dois pontos e volta a fechar. É o único movimento da assinatura.' : 'Hover: the interval opens by two units and closes again. It is the signature\'s only movement.'}</p>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Espaço livre à volta: metade da altura do símbolo, no mínimo.' : 'Clear space around it: at least half the mark\'s height.'}</Rule>
          <Rule yes>{pt ? 'No cabeçalho, 22 px de símbolo; em rodapés, 20 px; em cartões sociais, 26 a 34 px.' : 'In the header, a 22px mark; in footers, 20px; on social cards, 26 to 34px.'}</Rule>
          <Rule yes={false}>{pt ? 'Não se recompõe: o nome nunca vai por baixo do símbolo, nem em serifa, nem sem o .pt.' : 'It is never rearranged: the name never goes under the mark, never in a serif, never without the .pt.'}</Rule>
          <Rule yes={false}>{pt ? 'Não se anima em ciclo: o gesto de abrir e fechar responde ao rato, não ao tempo.' : 'It never loops: opening and closing answers the pointer, not the clock.'}</Rule>
        </ul>
      </Section>

      <Section id="cor" kicker="03" title={pt ? 'A cor' : 'Colour'} lede={pt ? 'A marca tem um tom, não um matiz: pinho sobre papel. Os quatro pastéis existem em duas forças, uma para dados e outra para superfícies, e as cores dos partidos e dos clubes são deles.' : 'The brand owns a tone, not a hue: pine on paper. The four pastels come in two strengths, one for data and one for surfaces, and party and club colours belong to them.'}>
        <h3 className="text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Superfícies' : 'Surfaces'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">{SURFACES.map(([n, t, h, note]) => <Swatch key={t} name={n} token={t} hex={h} note={note} />)}</div>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Tinta' : 'Ink'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-5">{INKS.map(([n, t, h, note]) => <Swatch key={t} name={n} token={t} hex={h} note={note} />)}</div>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Pastéis: dados e superfícies' : 'Pastels: data and surfaces'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">
          {DATA.map(([n, t, h, soft, softToken]) => (
            <div key={t} className="flex flex-col gap-2">
              <div className="flex h-16 overflow-hidden rounded-lg border border-line"><div className="flex-1" style={{ backgroundColor: h }} /><div className="flex-1" style={{ backgroundColor: soft }} /></div>
              <div className="text-sm font-semibold text-ink">{n}</div>
              <div className="font-mono text-[11px] text-stone-500">{h} · {t}</div>
              <div className="font-mono text-[11px] text-stone-500">{soft} · {softToken}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-stone-500">{pt ? 'À esquerda de cada par, a versão de dados: categorias nos gráficos e as pessoas do atlas. À direita, a versão de superfície: mosaico, capas, fundos. Uma nunca faz o trabalho da outra.' : 'Left of each pair, the data version: chart categories and the atlas\'s people. Right, the surface version: mosaic, covers, backgrounds. Neither ever does the other\'s job.'}</p>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Semânticas' : 'Semantic'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">{SEMANTIC.map(([n, t, h, note]) => <Swatch key={t} name={n} token={t} hex={h} note={note} />)}</div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Separar por croma: os dados são saturados, o cromo fica abaixo de 15% de saturação.' : 'Separate by chroma: data is saturated, chrome stays under 15% saturation.'}</Rule>
          <Rule yes>{pt ? 'Um número é tinta, salvo se o assunto tem cor própria: clube, partido, sinal.' : 'A number is ink, unless its subject has a colour of its own: club, party, sign.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem ocre nem mostarda como destaque: é a família do AD e o âmbar dos avisos.' : 'No ochre or mustard as highlight: it is AD\'s family and the warning amber.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem verde da marca dentro de dados de futebol: o verde é do Sporting quando está numa tabela.' : 'No brand green inside football data: green belongs to Sporting when it sits in a table.'}</Rule>
        </ul>
      </Section>

      <Section id="tipo" kicker="04" title={pt ? 'O tipo' : 'Type'} lede={pt ? 'Uma família para tudo o que é interface e título: Manrope. Uma face de leitura, Newsreader, só no corpo dos artigos, da metodologia e do sobre.' : 'One family for everything that is interface and title: Manrope. One reading face, Newsreader, only in the body of articles, the methodology and about pages.'}>
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-line bg-cream p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Manrope</p>
            <p className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-ink md:text-5xl">Portugal, à escala humana.</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.02em] text-ink">Classificação prevista</p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink">Classificação prevista com base em 50 000 simulações. Pontos médios e probabilidades de cada resultado.</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">Liga Portugal — época 2026-27</p>
            <p className="mt-3 text-4xl font-extrabold tabular-nums tracking-[-0.03em] text-ink">55<span className="text-2xl text-stone-400">%</span></p>
            <p className="mt-4 text-xs text-stone-500">{pt ? 'Títulos 800, subtítulos 700, texto 400 e 500, etiquetas 700 em versaletes, números 800 com algarismos tabulares.' : 'Titles 800, subtitles 700, text 400 and 500, labels 700 in small caps, numbers 800 with tabular figures.'}</p>
          </div>
          <div className="rounded-xl border border-line bg-cream p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Newsreader</p>
            <div className="article-body mt-4">
              <p>O estimador.pt utiliza modelos estatísticos Bayesianos para prever eleições portuguesas. A nossa abordagem é fundamentalmente probabilística: em vez de prever um único resultado, estimamos distribuições de probabilidade.</p>
            </div>
            <p className="mt-4 text-xs text-stone-500">{pt ? 'Só em parágrafos, listas e citações de peças longas. Títulos, legendas, tabelas e figuras ficam em Manrope.' : 'Only in paragraphs, lists and quotes of long pieces. Titles, captions, tables and figures stay in Manrope.'}</p>
          </div>
        </div>
      </Section>

      <Section id="mosaico" kicker="05" title={pt ? 'O mosaico' : 'The mosaic'} lede={pt ? 'O registo brincalhão do site, com um vocabulário pequeno e com sentido: um quarto de círculo é uma quota, um círculo é uma pessoa, uma grelha de pontos é uma população, um bloco arredondado é um lugar. As faixas ficam no símbolo.' : 'The site\'s playful register, with a small vocabulary that means something: a quarter-circle is a share, a circle a person, a grid of dots a population, a rounded block a place. Bands stay in the mark.'}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(['cover', 'corner', 'quarters', 'people'] as const).map(v => (
            <div key={v} className="flex flex-col gap-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line bg-cream p-4"><Mosaic variant={v} className="h-full w-full" ground={BRAND.cream} /></div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500">{v}</span>
            </div>
          ))}
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Capas de marca e de explicadores, fundos de herói em páginas sem dados, estados vazios, 404, avatares.' : 'Brand and explainer covers, hero backgrounds on pages without data, empty states, the 404, avatars.'}</Rule>
          <Rule yes>{pt ? 'Sempre nas versões de superfície dos pastéis, sobre papel ou creme.' : 'Always in the surface versions of the pastels, on paper or cream.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca ao lado de um número de clube ou de partido, nem em painéis de previsão.' : 'Never beside a club or party number, never on a forecast panel.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca a codificar informação: o mosaico decora, não explica.' : 'Never encoding information: the mosaic decorates, it does not explain.'}</Rule>
        </ul>
      </Section>

      <Section id="movimento" kicker="06" title={pt ? 'O movimento' : 'Motion'} lede={pt ? 'Um só gesto, sempre na mesma tinta: a incerteza mexe-se. Enquanto algo carrega, o ponto percorre a faixa; ao passar o rato pela assinatura, o intervalo abre e fecha. Nada disto acontece sobre uma previsão já publicada.' : 'One gesture, always in the same ink: the uncertainty moves. While something loads, the counter travels the band; on hover, the interval opens and closes. None of it happens over a published forecast.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-xl bg-forest"><MarkLoading height={36} color={BRAND.paper} ground={BRAND.forest} label={pt ? 'A estimar' : 'Estimating'} /><span className="text-xs text-stone-300">{pt ? 'A estimar…' : 'Estimating…'}</span></div>
          <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-cream"><span className="brand-link inline-block"><Mark height={36} color={BRAND.ink} /></span><span className="text-xs text-stone-500">{pt ? 'Passa o rato por cima.' : 'Hover.'}</span></div>
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Respeita prefers-reduced-motion: sem movimento, o símbolo fica parado e completo.' : 'Respects prefers-reduced-motion: without motion, the mark stays still and complete.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem animações de números nem de barras a "recalcular": uma previsão publicada não se mexe.' : 'No animated numbers, no bars "recalculating": a published forecast does not move.'}</Rule>
        </ul>
      </Section>

      <Section id="componentes" kicker="07" title={pt ? 'Os componentes' : 'Components'} lede={pt ? 'Três níveis de expressão: entradas, explicadores e estados vazios são os mais brincalhões; painéis e previsões ficam contidos; artigos e metodologia são editoriais. As peças partilhadas são poucas e iguais em todo o lado.' : 'Three levels of expression: entrances, explainers and empty states are the most playful; dashboards and forecasts stay restrained; articles and methodology are editorial. The shared pieces are few and the same everywhere.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-cream p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Ações' : 'Actions'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Action href="/populacao" locale={locale} arrow>{pt ? 'Explorar' : 'Explore'}</Action>
              <Action href="/economia" locale={locale} variant="secondary" arrow>{pt ? 'Comparar' : 'Compare'}</Action>
              <Action href="/metodologia" locale={locale} variant="tint" arrow>{pt ? 'Saber mais' : 'Learn more'}</Action>
              <Action href="/sobre" locale={locale} variant="text">{pt ? 'Ver metodologia' : 'See methodology'}</Action>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">{pt ? 'Pinho para a ação principal, uma por vista; creme com contorno para a secundária; tinta pervinca para entradas suaves; texto sublinhado ao passar. 48 px de altura, cantos de 10 px, seta só quando a ação leva a algum lado. O foco de teclado é um anel duplo, papel por dentro e pinho por fora, igual em todos os elementos.' : 'Pine for the main action, one per view; bordered cream for the secondary; periwinkle tint for soft entrances; underlined text on hover. 48px tall, 10px corners, an arrow only when the action leads somewhere. Keyboard focus is a double ring, paper inside and pine outside, the same on every element.'}</p>
          </div>
          <div className="rounded-2xl border border-line bg-cream p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Campos e seletores' : 'Fields and selectors'}</p>
            <label className="mt-4 block text-sm font-medium text-ink" htmlFor="marca-demo-select">{pt ? 'Selecionar tema' : 'Select a topic'}</label>
            <select id="marca-demo-select" className="mt-1.5 block min-h-12 w-full rounded-[10px] border border-line bg-cream px-3 text-sm text-ink" defaultValue="populacao">
              <option value="populacao">{pt ? 'População' : 'Population'}</option>
              <option value="economia">{pt ? 'Economia' : 'Economy'}</option>
            </select>
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-ink"><input type="checkbox" defaultChecked className="h-4 w-4 accent-ink" />{pt ? 'Mostrar apenas dados mais recentes' : 'Show only the most recent data'}</label>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">{pt ? 'Etiqueta sempre visível por cima, 48 px de altura, contorno visível. Erros dizem-se com texto e um ícone, nunca só com cor.' : 'Label always visible above, 48px tall, visible border. Errors are said with text and an icon, never with colour alone.'}</p>
          </div>
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Cartões com cantos de 16 px, contorno fino e sem sombra. Tabelas densas e gráficos num só painel, não em cartões encaixados.' : 'Cards with 16px corners, a thin border and no shadow. Dense tables and charts share one panel rather than nested cards.'}</Rule>
          <Rule yes>{pt ? 'Espaço em múltiplos de 4: 8 e 12 dentro de controlos, 16 e 24 dentro de componentes, 32, 48 e 64 entre secções.' : 'Spacing in multiples of 4: 8 and 12 inside controls, 16 and 24 inside components, 32, 48 and 64 between sections.'}</Rule>
          <Rule yes>{pt ? 'Um campo de cor por página, no máximo, e um acento de apoio. Painéis e números ficam sempre em creme.' : 'One colour field per page at most, and one supporting accent. Panels and numbers always stay on cream.'}</Rule>
          <Rule yes>{pt ? 'Movimento de 140 a 200 ms nas respostas e de 200 a 300 ms nos painéis; opacidade e cor, sem rotações nem saltos.' : 'Motion of 140 to 200ms for feedback and 200 to 300ms for panels; opacity and colour, no rotations or jumps.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem um herói ilustrado enorme em cima de cada painel: a informação útil aparece logo.' : 'No huge illustrated hero above every dashboard: the useful information appears at once.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem cor a fingir de conclusão: um pastel nunca diz que um número é bom ou mau.' : 'No colour posing as a conclusion: a pastel never says a number is good or bad.'}</Rule>
        </ul>
      </Section>

      <Section id="visualizacoes" kicker="08" title={pt ? 'As visualizações' : 'Visualisations'} lede={pt ? 'Os tipos de gráfico e de número que o site usa, como componentes do sistema: um cartão de dados com fonte, data e metodologia, painéis de número, linha com banda de incerteza, barras ordenadas, a barra de três resultados, colunas com ênfase e a grelha de cem pessoas. Todos com legenda, rótulos diretos, dica ao passar e uma tabela por baixo.' : 'The chart and number types the site uses, as system components: a data card with source, date and methodology, stat tiles, a line with an uncertainty band, ranked bars, the three-outcome bar, emphasised columns and the hundred-people grid. All with a legend, direct labels, a hover tip and a table underneath.'}>
        <VizShowcase pt={pt} />
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Primeiro a forma, depois a cor: um número é um painel, não um gráfico de uma barra; magnitude é uma cor, identidade são as séries, polaridade é um par.' : 'Form first, colour last: a number is a tile, not a one-bar chart; magnitude is one hue, identity is the series, polarity is a pair.'}</Rule>
          <Rule yes>{pt ? 'Um só eixo. Duas medidas de escalas diferentes são dois gráficos.' : 'One axis. Two measures of different scale are two charts.'}</Rule>
          <Rule yes>{pt ? 'Marcas finas: linhas de 2 px, barras até 24 px, pontos de 8 px com anel de creme, grelha de um fio.' : 'Thin marks: 2px lines, bars up to 24px, 8px dots with a cream ring, a hairline grid.'}</Rule>
          <Rule yes>{pt ? 'Cada gráfico tem a sua tabela e a sua fonte com data; a dica ao passar acrescenta, nunca esconde.' : 'Every chart has its table and its dated source; the hover tip adds, it never hides.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem cores de partido ou de clube inventadas, sem arco-íris, sem tartes.' : 'No invented party or club colours, no rainbows, no pies.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem pastel de superfície dentro de um gráfico: menta, mostarda, coral e pervinca claros ficam nas capas.' : 'No surface pastel inside a chart: light mint, mustard, coral and periwinkle stay on covers.'}</Rule>
        </ul>
      </Section>

      <Section id="comunicacao" kicker="09" title={pt ? 'A comunicação' : 'Communication'} lede={pt ? 'A voz é a do site: quente, precisa e honesta com a incerteza. Uma frase, uma descrição e duas biografias, iguais em todo o lado, e um kit para as redes gerado pelo mesmo código dos cartões de partilha.' : 'The voice is the site\'s: warm, precise and honest about uncertainty. One line, one description and two bios, the same everywhere, and a social kit generated by the same code as the sharing cards.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-cream p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Frase e descrição' : 'Line and description'}</p>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-ink">Dados para compreender Portugal.</p>
            <p className="mt-3 text-base leading-relaxed text-ink">Previsões e análises com a incerteza à vista: economia, Liga Portugal, eleições e população.</p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Biografia · 160 caracteres' : 'Bio · 160 characters'}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink">Previsões e análises sobre Portugal, com a incerteza à vista. Economia, Liga Portugal, eleições e um atlas humano do país. Metodologia aberta.</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Forecasts and analysis on Portugal, uncertainty in plain sight. Economy, Liga Portugal, elections and a human atlas of the country. Open methodology.</p>
          </div>
          <div className="rounded-2xl border border-line bg-cream p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Como se escreve' : 'How it is written'}</p>
            <ul className="mt-4 grid gap-2">
              <Rule yes>{pt ? 'Frases em caixa baixa; versaletes só em categorias editoriais.' : 'Sentence case; small caps only for editorial categories.'}</Rule>
              <Rule yes>{pt ? 'Perguntas como títulos onde há uma pergunta a responder: "Como está a economia?"' : 'Questions as headings where there is a question to answer: "How is the economy doing?"'}</Rule>
              <Rule yes>{pt ? 'A incerteza diz-se: intervalo, data, fonte. Uma estimativa nunca se apresenta como um facto.' : 'Uncertainty is stated: interval, date, source. An estimate is never presented as a fact.'}</Rule>
              <Rule yes>{pt ? 'Uma ação por peça, com um verbo: explorar, comparar, ler.' : 'One action per piece, with a verb: explore, compare, read.'}</Rule>
              <Rule yes={false}>{pt ? 'Sem entusiasmo de startup, sem emojis, sem pontos de exclamação.' : 'No startup enthusiasm, no emoji, no exclamation marks.'}</Rule>
              <Rule yes={false}>{pt ? 'Sem cor a dizer se um número é bom: quem diz é o texto.' : 'No colour saying whether a number is good: the text says it.'}</Rule>
            </ul>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/banner-1500x500.png" alt={pt ? 'Cabeçalho para o X e o Bluesky' : 'Header for X and Bluesky'} className="w-full rounded-2xl border border-line" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/linkedin-cover-dark.png" alt={pt ? 'Capa do LinkedIn sobre floresta' : 'LinkedIn cover on forest'} className="w-full rounded-2xl border border-line" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/linkedin-post-light.png" alt={pt ? 'Publicação quadrada' : 'Square post'} className="w-full rounded-2xl border border-line" />
        </div>
        <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-cream">
          {KIT.map(([file, size, note]) => (
            <li key={file} className="flex items-center justify-between gap-4 px-4 py-3">
              <div><div className="font-mono text-sm text-ink">{file.split('/').pop()}</div><div className="text-xs text-stone-500">{size} · {note}</div></div>
              <a href={`/${file}`} download className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-parchment"><Download aria-hidden="true" className="h-3.5 w-3.5" />{pt ? 'Descarregar' : 'Download'}</a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-500">{pt ? 'Regenera tudo com npm run brand. O cartão de jornada da Liga sai de node scripts/generate-social-images.mjs.' : 'Regenerate everything with npm run brand. The Liga matchday card comes from node scripts/generate-social-images.mjs.'}</p>
      </Section>

      <Section id="ficheiros" kicker="10" title={pt ? 'Os ficheiros' : 'The files'} lede={pt ? 'Os ficheiros que valem: SVG para tudo o que é ecrã e impressão, PNG para onde o SVG não entra.' : 'The files that matter: SVG for everything on screen and in print, PNG where SVG is not accepted.'}>
        <ul className="divide-y divide-line rounded-xl border border-line bg-cream">
          {FILES.map(([file, note]) => (
            <li key={file} className="flex items-center justify-between gap-4 px-4 py-3">
              <div><div className="font-mono text-sm text-ink">{file}</div><div className="text-xs text-stone-500">{note}</div></div>
              <a href={`/brand/${file}`} download className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-parchment"><Download aria-hidden="true" className="h-3.5 w-3.5" />{pt ? 'Descarregar' : 'Download'}</a>
            </li>
          ))}
        </ul>
      </Section>

      <SiteFooter locale={locale} />
    </div>
  );
}
