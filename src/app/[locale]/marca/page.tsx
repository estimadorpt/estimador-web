import { TileCard } from '@/components/economics/dashboard/TileCard';
import { StoryLineChart, StoryChartLegend } from '@/components/economics/stories/StoryLineChart';
import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionIllustration } from '@/components/brand/SectionIllustration';
import { HomeArt } from '@/components/home/HomeArt';
import { TextLink } from '@/components/brand/TextLink';
import { PageHero } from '@/components/PageHero';
import { LogoHorizontal, Mark, MarkSmall } from '@/components/Logo';
import { Mosaic } from '@/components/brand/Mosaic';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { Action } from '@/components/brand/Action';
import { VizShowcase } from '@/components/viz/Showcase';
import { BRAND } from '@/lib/brand';
import { BRAND_BIO, BRAND_DESCRIPTOR, BRAND_LINE } from '@/lib/brand/descriptor';
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({
    locale,
    path: '/marca',
    title: locale === 'pt' ? 'A marca estimador.pt' : 'The estimador.pt brand',
    description: locale === 'pt'
      ? 'Símbolo, cor, tipo, pinturas, mosaico e movimento: o guia da identidade do estimador.pt, com os ficheiros para descarregar.'
      : 'Mark, colour, type, paintings, mosaic and motion: the estimador.pt identity guide, with the files to download.',
    index: false,
  });
}

/** Copy for the guide's lists: Portuguese first, English second. */
type Copy = readonly [pt: string, en: string];
const tr = (pt: boolean, [ptText, enText]: Copy) => (pt ? ptText : enText);

const SURFACES: readonly (readonly [Copy, string, string, Copy])[] = [
  [['Papel', 'Paper'], 'paper', BRAND.paper, ['O chão de todas as páginas.', 'The ground of every page.']],
  [['Creme', 'Cream'], 'cream', BRAND.cream, ['Painéis, cartões, linhas de tabela.', 'Panels, cards, table rows.']],
  [['Pergaminho', 'Parchment'], 'parchment', BRAND.parchment, ['Zonas afundadas e estados de hover.', 'Sunken areas and hover states.']],
  [['Linha', 'Line'], 'line', BRAND.line, ['Filetes e separadores.', 'Hairlines and dividers.']],
];
const INKS: readonly (readonly [Copy, string, string, Copy])[] = [
  [['Pinho', 'Pine'], 'ink', BRAND.ink, ['Texto, botões, o símbolo.', 'Text, buttons, the mark.']],
  [['Pinho escuro', 'Dark pine'], 'ink-dark', BRAND.inkDark, ['Hover de ligações e botões.', 'Link and button hover.']],
  [['Cinza-verde', 'Green-grey'], 'stone-500', BRAND.muted, ['Texto secundário e o .pt da assinatura, 4,5:1 sobre papel.', 'Secondary text and the .pt of the signature, 4.5:1 on paper.']],
  [['Cinza claro', 'Light grey'], 'stone-400', BRAND.faint, ['Etiquetas pequenas e decoração; nunca o .pt, que ficaria abaixo de 3:1.', 'Small labels and decoration; never the .pt, which would fall below 3:1.']],
  [['Floresta', 'Forest'], 'forest', BRAND.forest, ['Superfícies escuras: o ícone de app e os cartões sociais escuros.', 'Dark surfaces: the app icon and the dark social cards.']],
];
const DATA: readonly (readonly [Copy, string, string, string, string])[] = [
  [['Menta', 'Mint'], 'mint', BRAND.mint, BRAND.mintSoft, 'mint-soft'],
  [['Mostarda', 'Mustard'], 'mustard', BRAND.mustard, BRAND.mustardSoft, 'mustard-soft'],
  [['Coral', 'Coral'], 'coral', BRAND.coral, BRAND.coralSoft, 'coral-soft'],
  [['Pervinca', 'Periwinkle'], 'periwinkle', BRAND.periwinkle, BRAND.periwinkleSoft, 'periwinkle-soft'],
];
const SEMANTIC: readonly (readonly [Copy, string, string, Copy])[] = [
  [['Positivo', 'Positive'], 'positive', BRAND.tree, ['Subidas, sinal positivo.', 'Rises, a positive sign.']],
  [['Negativo', 'Negative'], 'negative', BRAND.terracotta, ['Descidas, sinal negativo, erros.', 'Falls, a negative sign, errors.']],
  [['Aviso', 'Caveat'], 'gold', BRAND.gold, ['Dados desatualizados, provisórios. Nunca na marca.', 'Stale or provisional data. Never in the brand.']],
  [['Teal', 'Teal'], 'teal', BRAND.teal, ['A cor da secção Economia.', 'The economy section colour.']],
];
const KIT: readonly (readonly [string, string, Copy])[] = [
  ['branding/avatar-1024-forest.png', '1024 × 1024', ['Avatar em todas as redes', 'Avatar on every network']],
  ['branding/avatar-1024-paper.png', '1024 × 1024', ['Avatar claro', 'Light avatar']],
  ['images/brand/banner-1500x500.png', '1500 × 500', ['Cabeçalho do X e do Bluesky', 'X and Bluesky header']],
  ['branding/banner-1500x500-dark.png', '1500 × 500', ['Cabeçalho, sobre floresta', 'Header, on forest']],
  ['branding/linkedin-cover-light.png', '1584 × 396', ['Capa do LinkedIn, clara', 'LinkedIn cover, light']],
  ['branding/linkedin-cover-dark.png', '1584 × 396', ['Capa do LinkedIn, sobre floresta', 'LinkedIn cover, on forest']],
  ['branding/linkedin-post-light.png', '1200 × 1200', ['Publicação quadrada, clara', 'Square post, light']],
  ['branding/linkedin-post-dark.png', '1200 × 1200', ['Publicação quadrada, sobre floresta', 'Square post, on forest']],
  ['branding/post-1600x900-light.png', '1600 × 900', ['Publicação 16:9', '16:9 post']],
  ['branding/story-1080x1920-light.png', '1080 × 1920', ['Story, clara', 'Story, light']],
  ['branding/story-1080x1920-dark.png', '1080 × 1920', ['Story, sobre floresta', 'Story, on forest']],
];
/** The mosaic's four variants and where each one lives (owner decision of 6 October 2026). */
const MOSAIC_USES: readonly (readonly ['cover' | 'corner' | 'quarters' | 'people', Copy, boolean])[] = [
  ['cover', ['Cartão de partilha da marca e kit social.', 'The OG brand card and the social kit.'], true],
  ['corner', ['O cabeçalho deste guia, e só este.', 'This guide\'s header, and no other.'], true],
  ['quarters', ['Estados vazios e de erro, e o 404.', 'Empty and error states, and the 404.'], true],
  ['people', ['Fora das páginas: ao lado dos gráficos de pontos verdadeiros, lê-se como dados.', 'On no page: next to the real dot charts, it reads as data.'], false],
];

/** The painting family: one picture per section, in the site's section order. */
const PAINTINGS: readonly (readonly ['population' | 'football' | 'elections' | 'economy', Copy, Copy, string])[] = [
  ['population', ['População: a casa', 'Population: the house'], ['No painel da população da página inicial e neste guia. Nunca nas páginas de dados da população.', 'The homepage\'s population panel, and this guide. Never on the population data pages.'], '/images/home/population-square-800.webp'],
  ['football', ['Futebol: o campo', 'Football: the ground'], ['Cabeçalhos da Liga e do simulador; painel da página inicial.', 'Liga and simulator headers; the homepage panel.'], '/images/sections/football.webp'],
  ['elections', ['Eleições: a mesa de voto', 'Elections: the polling place'], ['Cabeçalhos do arquivo, das legislativas e das presidenciais; painel da página inicial.', 'Archive, parliamentary and presidential headers; the homepage panel.'], '/images/sections/elections.webp'],
  ['economy', ['Economia: a loja', 'Economy: the shop'], ['Painel da página inicial e um pequeno acento no explicador da Economia. Sem cabeçalho.', 'The homepage panel and a small accent in the economy explainer. No header.'], '/images/sections/economy.webp'],
];

/** Which header each kind of page gets (owner decision of 6 October 2026; the same table is in CLAUDE.md). */
const HEADERS: readonly (readonly [kind: Copy, header: Copy, pages: Copy])[] = [
  [
    ['Entrada de secção com pintura', 'Section entrance with a painting'],
    ['A pintura de 13 de setembro da secção, carregada logo.', 'The section\'s 13 September painting, loaded eagerly.'],
    ['Liga, simulador da Liga, /eleicoes/arquivo, /eleicoes/legislativas, /eleicoes/presidenciais. Na página inicial, cada painel leva a pintura da sua secção (população: a casa).', 'Liga hub, Liga simulator, /eleicoes/arquivo, /eleicoes/legislativas, /eleicoes/presidenciais. On the homepage, each panel carries its section\'s painting (population: the house).'],
  ],
  [
    ['Páginas de dados, painéis, ferramentas', 'Data pages, dashboards, tools'],
    ['Campo de cor compacto, sem imagem.', 'A compact tinted field, no art.'],
    ['/populacao, as freguesias, as regiões, /populacao/misteriosa, /economia, /artigos.', '/populacao, the parish pages, the region pages, /populacao/misteriosa, /economia, /artigos.'],
  ],
  [
    ['Referência, metodologia, editorial', 'Reference, methodology, editorial'],
    ['Papel liso.', 'Plain paper.'],
    ['As subpáginas da Liga e das eleições (clube, jogo, jogador, modelo, dados, 2025-26, jogo-previsoes, mapa), todas as metodologias, /populacao/qualidade, /dados, /sobre, /privacidade, /metodologia.', 'The Liga and election sub-pages (club, match, player, modelo, dados, 2025-26, jogo-previsoes, mapa), every methodology page, /populacao/qualidade, /dados, /sobre, /privacidade, /metodologia.'],
  ],
  [
    ['Explicador com mundo próprio', 'Explainer with its own world'],
    ['O seu próprio desenho, por baixo do cabeçalho comum.', 'Its own drawing, below the shared header.'],
    ['/populacao/miniatura (a aldeia).', '/populacao/miniatura (the village).'],
  ],
  [
    ['Vazio, erro, 404', 'Empty, error, 404'],
    ['Um pequeno mosaico quarters e um passo seguinte.', 'A small quarters mosaic and one next step.'],
    ['Freguesia desconhecida, ligação desconhecida, arquivo vazio, artigos vazios, estados recusados ou indisponíveis, 404.', 'Unknown parish, unknown permalink, empty archive, empty articles, refused or unavailable states, 404.'],
  ],
  [
    ['Material de marca', 'Brand material'],
    ['Mosaico.', 'Mosaic.'],
    ['/marca, o cartão de partilha da marca, o kit social.', '/marca, the OG brand card, the social kit.'],
  ],
];

const FILES: readonly (readonly [string, Copy])[] = [
  ['estimador-logo.svg', ['Assinatura, pinho sobre transparente', 'Signature, pine on transparent']],
  ['estimador-logo-paper.svg', ['Assinatura, papel sobre transparente, para fundos escuros', 'Signature, paper on transparent, for dark grounds']],
  ['estimador-logo@4x.png', ['Assinatura em PNG, 880 px', 'Signature as PNG, 880px']],
  ['estimador-logo-paper@4x.png', ['Assinatura em PNG sobre floresta', 'Signature as PNG on forest']],
  ['estimador-mark.svg', ['Símbolo completo, 48 × 24', 'Full mark, 48 × 24']],
  ['estimador-mark-paper.svg', ['Símbolo completo, papel', 'Full mark, paper']],
  ['estimador-mark-small.svg', ['Símbolo reduzido, 32 × 32, para menos de 24 px', 'Small mark, 32 × 32, for under 24px']],
  ['estimador-app-icon.svg', ['Ícone de app, papel sobre floresta', 'App icon, paper on forest']],
  ['estimador-app-icon-512.png', ['Ícone de app em PNG, 512 px', 'App icon as PNG, 512px']],
];

function Section({ id, kicker, title, lede, children }: { id: string; kicker: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-line py-12 last:border-b-0 md:py-16">
      <div className="mx-auto w-full max-w-7xl px-4"><div className="max-w-5xl">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{kicker}</p>
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        {lede && <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div></div>
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
  setRequestLocale(locale);
  const pt = locale !== 'en';
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
        eyebrow={pt ? 'Marca · guia de identidade' : 'Brand · identity guide'}
        title={pt ? 'Uma mediana sobre um intervalo.' : 'A median on an interval.'}
        lede={pt
          ? 'O estimador.pt publica estimativas com a incerteza à vista. A marca é isso mesmo: um intervalo de credibilidade desenhado numa só tinta, o nome na fonte da interface, uma família de pinturas à entrada das secções e um mosaico de pastéis guardado para a marca e para quando falta alguma coisa.'
          : 'estimador.pt publishes estimates with their uncertainty in plain sight. The brand is exactly that: a credible interval drawn in one ink, the name in the interface face, one family of paintings at the section entrances, and a pastel mosaic kept for brand material and for when something is missing.'}
        meta={<span>{pt ? 'Versão de outubro de 2026 · ficheiros no fim da página' : 'October 2026 · files at the end of the page'}</span>}
        art={<Mosaic variant="corner" className="h-full w-full" />}
      />

      <Section id="simbolo" kicker="01" title={pt ? 'O símbolo' : 'The mark'} lede={pt ? 'Um intervalo: duas extremidades quadradas, uma faixa, um ponto vazado ligeiramente à esquerda do centro. Um só caminho, uma só cor. Os bigodes mantêm-se em todos os tamanhos; abaixo de 24 px ficam mais curtos, com extremidades mais espessas.' : 'An interval: two square caps, a band, a punched counter slightly left of centre. One path, one colour. Whiskers stay at every size; below 24px they become shorter, with thicker caps.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-44 items-center justify-center rounded-xl border border-line bg-cream"><Mark height={64} color={BRAND.ink} title={pt ? 'Símbolo sobre creme' : 'Mark on cream'} /></div>
          <div className="flex h-44 items-center justify-center rounded-xl bg-forest"><Mark height={64} color={BRAND.paper} title={pt ? 'Símbolo sobre floresta' : 'Mark on forest'} /></div>
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
        <p className="mt-3 text-xs text-stone-500">{pt ? 'Passa o cursor por cima ou foca a ligação com o teclado: o intervalo abre dois pontos e volta a fechar. É o único movimento da assinatura.' : 'Hover over it or focus the link with the keyboard: the interval opens by two units and closes again. It is the signature\'s only movement.'}</p>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Espaço livre à volta: metade da altura do símbolo, no mínimo.' : 'Clear space around it: at least half the mark\'s height.'}</Rule>
          <Rule yes>{pt ? 'No cabeçalho, 22 px de símbolo; em rodapés, 20 px; em cartões sociais, 26 a 34 px.' : 'In the header, a 22px mark; in footers, 20px; on social cards, 26 to 34px.'}</Rule>
          <Rule yes={false}>{pt ? 'Não se recompõe: o nome nunca vai por baixo do símbolo, nem em serifa, nem sem o .pt.' : 'It is never rearranged: the name never goes under the mark, never in a serif, never without the .pt.'}</Rule>
          <Rule yes={false}>{pt ? 'Não se anima em ciclo: o gesto de abrir e fechar responde ao cursor e ao teclado, não ao tempo.' : 'It never loops: opening and closing answers the pointer, not the clock.'}</Rule>
        </ul>
      </Section>

      <Section id="cor" kicker="03" title={pt ? 'A cor' : 'Colour'} lede={pt ? 'A marca tem um tom, não um matiz: pinho sobre papel. Os quatro pastéis existem em duas forças, uma para dados e outra para superfícies, e as cores dos partidos e dos clubes são deles.' : 'The brand owns a tone, not a hue: pine on paper. The four pastels come in two strengths, one for data and one for surfaces, and party and club colours belong to them.'}>
        <h3 className="text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Superfícies' : 'Surfaces'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">{SURFACES.map(([n, t, h, note]) => <Swatch key={t} name={tr(pt, n)} token={t} hex={h} note={tr(pt, note)} />)}</div>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Tinta' : 'Ink'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-5">{INKS.map(([n, t, h, note]) => <Swatch key={t} name={tr(pt, n)} token={t} hex={h} note={tr(pt, note)} />)}</div>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Pastéis: dados e superfícies' : 'Pastels: data and surfaces'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">
          {DATA.map(([n, t, h, soft, softToken]) => (
            <div key={t} className="flex flex-col gap-2">
              <div className="flex h-16 overflow-hidden rounded-lg border border-line"><div className="flex-1" style={{ backgroundColor: h }} /><div className="flex-1" style={{ backgroundColor: soft }} /></div>
              <div className="text-sm font-semibold text-ink">{tr(pt, n)}</div>
              <div className="font-mono text-[11px] text-stone-500">{h} · {t}</div>
              <div className="font-mono text-[11px] text-stone-500">{soft} · {softToken}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-stone-500">{pt ? 'À esquerda de cada par, a versão de dados: categorias e marcas pequenas, como uma escolha errada na Freguesia misteriosa (as séries dos gráficos usam passos mais escuros dos mesmos quatro tons). À direita, a versão de superfície: campos de cor, fundos, o mosaico. Uma nunca faz o trabalho da outra.' : 'Left of each pair, the data version: categories and small marks, such as a wrong pick in the Mystery parish (chart series use darker steps of the same four hues). Right, the surface version: tinted fields, backgrounds, the mosaic. Neither ever does the other\'s job.'}</p>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Semânticas' : 'Semantic'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">{SEMANTIC.map(([n, t, h, note]) => <Swatch key={t} name={tr(pt, n)} token={t} hex={h} note={tr(pt, note)} />)}</div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Separar por croma: os dados são saturados, o cromo fica abaixo de 15% de saturação.' : 'Separate by chroma: data is saturated, chrome stays under 15% saturation.'}</Rule>
          <Rule yes>{pt ? 'Um número é tinta, salvo se o assunto tem cor própria: clube, partido, sinal.' : 'A number is ink, unless its subject has a colour of its own: club, party, sign.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem ocre nem mostarda como destaque: é a família do AD e o âmbar dos avisos.' : 'No ochre or mustard as highlight: it is AD\'s family and the warning amber.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem verde da marca dentro de dados de futebol: o verde é do Sporting quando está numa tabela.' : 'No brand green inside football data: green belongs to Sporting when it sits in a table.'}</Rule>
        </ul>
      </Section>

      <Section id="tipo" kicker="04" title={pt ? 'O tipo' : 'Type'} lede={pt ? 'Uma família para tudo o que é interface e título: Manrope. Uma face de leitura, Newsreader, só no corpo dos artigos, da metodologia e do sobre.' : 'One family for everything that is interface and title: Manrope. One reading face, Newsreader, only in the body of articles, the methodology and about pages.'}>
        {/* One specimen sheet, two faces split by a hairline (stacked below md):
            as two cards, the shorter Newsreader one ended in blank cream. From lg the
            reading column is narrower (a reading measure), so the paragraph wraps to
            about the Manrope column's height and neither column ends in a blank band. */}
        <div className="grid divide-y divide-line rounded-xl border border-line bg-cream md:grid-cols-[1.4fr_1fr] md:divide-x md:divide-y-0 lg:grid-cols-[2fr_1fr]">
          <div className="p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Manrope</p>
            <p lang="pt" className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-ink md:text-5xl">Portugal, à escala humana.</p>
            <p lang="pt" className="mt-3 text-2xl font-bold tracking-[-0.02em] text-ink">Classificação prevista</p>
            <p lang="pt" className="mt-3 max-w-md text-base leading-relaxed text-ink">Classificação prevista com base em 50 000 simulações. Pontos médios e probabilidades de cada resultado.</p>
            <p lang="pt" className="mt-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">Liga Portugal — época 2026-27</p>
            <p className="mt-3 text-4xl font-extrabold tabular-nums tracking-[-0.03em] text-ink">55<span className="text-2xl text-stone-400">%</span></p>
            <p className="mt-4 text-xs text-stone-500">{pt ? 'Títulos 800, subtítulos 700, texto 400 e 500, etiquetas 700 em versaletes, números 800 com algarismos tabulares.' : 'Titles 800, subtitles 700, text 400 and 500, labels 700 in small caps, numbers 800 with tabular figures.'}</p>
          </div>
          <div className="p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Newsreader</p>
            <div lang="pt" className="article-body mt-4">
              <p>O estimador.pt utiliza modelos estatísticos Bayesianos para prever eleições portuguesas. A nossa abordagem é fundamentalmente probabilística: em vez de prever um único resultado, estimamos distribuições de probabilidade.</p>
            </div>
            <p className="mt-4 text-xs text-stone-500">{pt ? 'Só em parágrafos, listas e citações de peças longas. Títulos, legendas, tabelas e figuras ficam em Manrope.' : 'Only in paragraphs, lists and quotes of long pieces. Titles, captions, tables and figures stay in Manrope.'}</p>
          </div>
        </div>
      </Section>

      <Section id="mosaico" kicker="05" title={pt ? 'O mosaico' : 'The mosaic'} lede={pt ? 'Material de marca, com um vocabulário pequeno e com sentido: um quarto de círculo é uma quota, um círculo é uma pessoa, um bloco arredondado é um lugar. As faixas ficam no símbolo. Desde 6 de outubro de 2026, vive em três sítios: a marca, o 404 e os estados vazios. Não é cabeçalho de nenhuma página, salvo a deste guia, que também é material de marca.' : 'Brand material, with a small vocabulary that means something: a quarter-circle is a share, a circle a person, a rounded block a place. Bands stay in the mark. Since 6 October 2026 it lives in three places: brand material, the 404 and empty states. It heads no page but this guide, which is brand material itself.'}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MOSAIC_USES.map(([v, use, live]) => (
            <div key={v} className="flex flex-col gap-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line bg-cream p-4"><Mosaic variant={v} className="h-full w-full" ground={BRAND.cream} /></div>
              <span className="font-mono text-[11px] text-stone-500">{v}{live ? '' : (pt ? ' · só espécime' : ' · specimen only')}</span>
              <span className="text-xs leading-snug text-stone-600">{tr(pt, use)}</span>
            </div>
          ))}
        </div>
        <h3 className="mt-10 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'O estado vazio' : 'The empty state'}</h3>
        <div className="mt-4 flex max-w-xl items-start gap-4 rounded-2xl border border-line bg-cream p-5">
          <EmptyStateMark surface="cream" />
          <div className="min-w-0">
            <p className="font-bold text-ink">{pt ? 'Não encontrámos esta freguesia.' : 'We could not find this parish.'}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{pt ? 'O endereço pode ter um código antigo ou incompleto.' : 'The address may carry an old or incomplete code.'}</p>
            <TextLink href="/populacao" locale={locale}>{pt ? 'Procurar uma freguesia' : 'Search for a parish'}</TextLink>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-stone-500">{pt ? 'Exemplo. Todos os estados vazios, de erro, recusados ou indisponíveis usam o mesmo quarters a 72 px, igual em todas as larguras, ao lado ou por cima da mensagem e de um passo seguinte concreto (EmptyStateMark). O 404 é o único maior: até 200 px no desktop e 112 px no telemóvel.' : 'Example. Every empty, error, refused or unavailable state uses the same quarters at 72px, the same at every width, beside or above the message and one specific next step (EmptyStateMark). The 404 is the only larger one: up to 200px on desktop and 112px on phones.'}</p>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Material de marca (este guia, o cartão de partilha da marca, o kit social), o 404 e os estados vazios, sempre com um passo seguinte.' : 'Brand material (this guide, the OG brand card, the social kit), the 404 and empty states, always with a next step.'}</Rule>
          <Rule yes>{pt ? 'Sempre nas versões de superfície dos pastéis, sobre papel ou creme.' : 'Always in the surface versions of the pastels, on paper or cream.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca no cabeçalho de uma página do site fora deste guia, nem ao lado de um número ou de um gráfico: saiu dos cabeçalhos da Liga, da Economia e dos Artigos a 11 de setembro e dos da População a 6 de outubro.' : 'Never in the header of a site page outside this guide, never beside a number or a chart: it came off the Liga, economy and articles headers on 11 September and off the population ones on 6 October.'}</Rule>
          <Rule yes={false}>{pt ? 'Nunca a codificar informação, nem a parecer que codifica: a grelha de pontos fica fora das páginas, porque ao lado dos gráficos de pontos verdadeiros lê-se como dados.' : 'Never encoding information, nor looking as if it does: the dot grid stays off every page, because next to the real dot charts it reads as data.'}</Rule>
        </ul>
      </Section>

      <Section id="ilustracao" kicker="05.1" title={pt ? 'Uma família de pinturas' : 'One family of paintings'} lede={pt ? 'Quatro pinturas, uma por secção: a casa, o campo, a mesa de voto e a loja. Dão contexto à entrada; o conteúdo e os dados ocupam o centro da página. Não há outras.' : 'Four paintings, one per section: the house, the ground, the polling place and the shop. They give context at the entrance; content and data take the centre of the page. There are no others.'}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PAINTINGS.map(([scene, name, use, file]) => (
            <div key={scene} className="flex flex-col rounded-2xl border border-line bg-cream p-4">
              {/* One mat for all four: each painting whole, at its own shape, with the same margin
                  above and below. The house has no 3:2 crop (it fills its master's height), so it
                  sits as the square the homepage uses rather than pillarboxed in a 3:2 box. */}
              <div className="relative flex aspect-[3/2] w-full items-center justify-center rounded-xl bg-parchment">
                {scene === 'population'
                  ? <HomeArt name="population" shape="square" sizes="(min-width: 1024px) 160px, (min-width: 640px) 28vw, 60vw" className="absolute left-1/2 top-[6%] aspect-square h-[88%] -translate-x-1/2 rounded-2xl" />
                  : <div className="w-[88%]"><SectionIllustration scene={scene} sizes="(min-width: 1024px) 180px, (min-width: 640px) 40vw, calc(100vw - 96px)" /></div>}
              </div>
              <h3 className="mt-4 text-lg">{tr(pt, name)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{tr(pt, use)}</p>
              <a href={file} download className="mt-auto inline-flex min-h-11 items-center pt-2 text-sm font-bold underline underline-offset-4">{pt ? 'Descarregar pintura' : 'Download painting'}<span className="sr-only">{`: ${file.split('/').pop()}`}</span></a>
            </div>
          ))}
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Cenas frontais e concretas, com arquitetura, materiais e pequenos gestos humanos.' : 'Concrete, frontal scenes with architecture, materials and small human gestures.'}</Rule>
          <Rule yes>{pt ? 'Cabeçalhos compactos: imagem até 295 px no desktop, carregada logo, por ser o que a página pinta de maior. Em ferramentas, o controlo vem primeiro.' : 'Compact headers: artwork up to 295 px on desktop, loaded eagerly, since it is the page\'s largest paint. In tools, controls come first.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem moradores pintados nas páginas de dados da população: a casa só aparece na página inicial (e neste guia).' : 'No painted residents on the population data pages: the house appears on the homepage only (and in this guide).'}</Rule>
          <Rule yes={false}>{pt ? 'Sem imagens atrás de dados, símbolos indecifráveis, cores de partidos decorativas ou personagens genéricas como assinatura.' : 'No imagery behind data, unreadable symbols, decorative party colours or generic characters as the signature.'}</Rule>
        </ul>

        <h3 id="cabecalhos" className="mt-12 text-base font-bold uppercase tracking-wider text-stone-500">{pt ? 'Que cabeçalho tem cada página' : 'Which header each page gets'}</h3>
        <div className="mt-4 rounded-2xl border border-line bg-cream">
          <div aria-hidden="true" className="hidden gap-6 border-b border-line px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-stone-500 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
            <span>{pt ? 'Tipo de página' : 'Page kind'}</span><span>{pt ? 'Cabeçalho' : 'Header'}</span><span>{pt ? 'Páginas' : 'Pages'}</span>
          </div>
          <ul className="divide-y divide-line">
            {HEADERS.map(([kind, header, pages]) => (
              <li key={kind[1]} className="grid gap-1.5 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] md:gap-6">
                <h4 className="text-sm font-bold text-ink">{tr(pt, kind)}</h4>
                <p className="text-sm leading-relaxed text-ink"><span className="font-semibold text-stone-500 md:sr-only">{pt ? 'Cabeçalho: ' : 'Header: '}</span>{tr(pt, header)}</p>
                <p className="text-sm leading-relaxed text-stone-600"><span className="font-semibold text-stone-500 md:sr-only">{pt ? 'Páginas: ' : 'Pages: '}</span>{tr(pt, pages)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink">
          <span>{pt ? 'Um campo de cor por página e uma cor por secção:' : 'One tinted field per page and one colour per section:'}</span>
          {([['periwinkle', ['População', 'Population']], ['mint', ['Economia', 'Economy']], ['mustard', ['Artigos', 'Articles']]] as const).map(([field, name]) => (
            <span key={field} className="inline-flex items-center gap-2"><span aria-hidden="true" className={`field-${field} inline-block h-4 w-6 rounded border border-line`} />{tr(pt, name)}</span>
          ))}
        </div>
      </Section>

      <Section id="economia-componentes" kicker="05.2" title={pt ? 'Contexto, depois evidência' : 'Context, then evidence'} lede={pt ? 'Um exemplo de componente económico. Dados fictícios para mostrar hierarquia e legibilidade; não descrevem a economia portuguesa.' : 'An economy component example. Fictional data demonstrate hierarchy and readability; they do not describe the Portuguese economy.'}>
        <TileCard title={pt ? 'Uma série ao longo do tempo' : 'A series over time'} eyebrow={pt ? 'Exemplo visual · índice' : 'Visual example · index'} label={pt ? 'Dados fictícios' : 'Fictional data'} honesty={pt ? 'A mesma escala e os mesmos valores no telemóvel e no desktop. A composição adapta-se para manter as etiquetas legíveis.' : 'The same scale and values on phone and desktop. The composition adapts to keep labels readable.'}>
          <StoryLineChart ariaLabel={pt ? 'Série fictícia de exemplo' : 'Fictional example series'} series={[{ label: pt ? 'Exemplo' : 'Example', color: '#245c68', values: [8, 12, 10, 16, 18, 15, 20] }]} xStartLabel={pt ? 'Início' : 'Start'} xEndLabel={pt ? 'Fim' : 'End'} />
          <StoryChartLegend items={[{label: pt ? 'Série fictícia' : 'Fictional series', color: '#245c68'}]} />
        </TileCard>
      </Section>

      <Section id="movimento" kicker="06" title={pt ? 'O movimento' : 'Motion'} lede={pt ? 'Um só gesto, sempre na mesma tinta: a incerteza mexe-se. Enquanto algo carrega, o ponto percorre a faixa; ao passar o cursor pela assinatura, o intervalo abre e fecha. Nada disto acontece sobre uma previsão já publicada.' : 'One gesture, always in the same ink: the uncertainty moves. While something loads, the counter travels the band; on hover, the interval opens and closes. None of it happens over a published forecast.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-xl bg-forest"><MarkLoading height={36} color={BRAND.paper} ground={BRAND.forest} label={pt ? 'A estimar' : 'Estimating'} /><span className="text-xs text-stone-300">{pt ? 'A estimar…' : 'Estimating…'}</span></div>
          <div className="flex h-36 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-cream"><span className="brand-link inline-block"><Mark height={36} color={BRAND.ink} /></span><span className="text-xs text-stone-500">{pt ? 'Passa o cursor por cima.' : 'Hover over it.'}</span></div>
        </div>
        <ul className="mt-8 grid gap-2 md:grid-cols-2">
          <Rule yes>{pt ? 'Respeita prefers-reduced-motion: sem movimento, o símbolo fica parado e completo.' : 'Respects prefers-reduced-motion: without motion, the mark stays still and complete.'}</Rule>
          <Rule yes={false}>{pt ? 'Sem animações de números nem de barras a "recalcular": uma previsão publicada não se mexe.' : 'No animated numbers, no bars "recalculating": a published forecast does not move.'}</Rule>
        </ul>
      </Section>

      <Section id="componentes" kicker="07" title={pt ? 'Os componentes' : 'Components'} lede={pt ? 'Três níveis de expressão: as entradas de secção têm a sua pintura; páginas de dados, painéis e ferramentas ficam contidos, com um campo de cor compacto; referência, metodologia e textos editoriais ficam sobre papel liso (a tabela de cabeçalhos está em 05.1). As peças partilhadas são poucas e iguais em todo o lado.' : 'Three levels of expression: section entrances carry their painting; data pages, dashboards and tools stay restrained, with a compact tinted field; reference, methodology and editorial pieces sit on plain paper (the header table is in 05.1). The shared pieces are few and the same everywhere.'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-cream p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Ações' : 'Actions'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Action href="/populacao" locale={locale} arrow>{pt ? 'Explorar' : 'Explore'}</Action>
              <Action href="/economia" locale={locale} variant="secondary" arrow>{pt ? 'Comparar' : 'Compare'}</Action>
              <Action href="/metodologia" locale={locale} variant="tint" arrow>{pt ? 'Saber mais' : 'Learn more'}</Action>
              <Action href="/metodologia" locale={locale} variant="text">{pt ? 'Ver metodologia' : 'See methodology'}</Action>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">{pt ? 'Pinho para a ação principal, uma por vista; creme com contorno para a secundária; tinta pervinca para entradas suaves; texto em tinta, sempre sublinhado. 48 px de altura, cantos de 10 px, seta só quando a ação leva a algum lado. O foco de teclado é um anel duplo, papel por dentro e pinho por fora, igual em todos os elementos.' : 'Pine for the main action, one per view; bordered cream for the secondary; periwinkle tint for soft entrances; ink text, always underlined. 48px tall, 10px corners, an arrow only when the action leads somewhere. Keyboard focus is a double ring, paper inside and pine outside, the same on every element.'}</p>
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
          <Rule yes={false}>{pt ? 'Sem pastel de superfície dentro de um gráfico: menta, mostarda, coral e pervinca claros ficam nos campos de cor e nos fundos.' : 'No surface pastel inside a chart: light mint, mustard, coral and periwinkle stay in tinted fields and backgrounds.'}</Rule>
        </ul>
      </Section>

      <Section id="comunicacao" kicker="09" title={pt ? 'A comunicação' : 'Communication'} lede={pt ? 'A voz é a do site: quente, precisa e honesta com a incerteza. Uma frase, uma descrição e duas biografias, iguais em todo o lado, e um kit para as redes gerado pelo mesmo código dos cartões de partilha.' : 'The voice is the site\'s: warm, precise and honest about uncertainty. One line, one description and two bios, the same everywhere, and a social kit generated by the same code as the sharing cards.'}>
        {/* One card in two bands split by a hairline: what is said, then how it is
            written. The line heads the first band and the descriptor and the bios sit
            side by side under it (stacked below md), so the two columns hold about the
            same text; the six rules follow in two columns of three. As two columns
            (descriptor and bios beside the rules), the rules ended 160px above the card's
            bottom. */}
        <div className="divide-y divide-line rounded-2xl border border-line bg-cream">
          <div className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Frase e descrição' : 'Line and description'}</p>
            <p lang="pt" className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-ink">{BRAND_LINE.pt}</p>
            <div className="mt-3 grid gap-x-8 gap-y-4 md:grid-cols-2">
              <div>
                <p lang="pt" className="text-base leading-relaxed text-ink">{BRAND_DESCRIPTOR.pt}</p>
                <p lang="en" className="mt-2 text-sm leading-relaxed text-stone-600">{BRAND_LINE.en} {BRAND_DESCRIPTOR.en}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Biografia · 160 caracteres' : 'Bio · 160 characters'}</p>
                <p lang="pt" className="mt-2 text-sm leading-relaxed text-ink">{BRAND_BIO.pt}</p>
                <p lang="en" className="mt-2 text-sm leading-relaxed text-stone-600">{BRAND_BIO.en}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Como se escreve' : 'How it is written'}</p>
            <ul className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2">
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
              <div><div className="font-mono text-sm text-ink">{file.split('/').pop()}</div><div className="text-xs text-stone-500">{size} · {tr(pt, note)}</div></div>
              <a href={`/${file}`} download className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-parchment"><Download aria-hidden="true" className="h-3.5 w-3.5" />{pt ? 'Descarregar' : 'Download'}<span className="sr-only">{`: ${file.split('/').pop()}`}</span></a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-500">{pt ? 'Regenera tudo com npm run brand. O cartão de jornada da Liga sai de node scripts/generate-social-images.mjs.' : 'Regenerate everything with npm run brand. The Liga matchday card comes from node scripts/generate-social-images.mjs.'}</p>
      </Section>

      <Section id="ficheiros" kicker="10" title={pt ? 'Os ficheiros' : 'The files'} lede={pt ? 'Os ficheiros que valem: SVG para tudo o que é ecrã e impressão, PNG para onde o SVG não entra.' : 'The files that matter: SVG for everything on screen and in print, PNG where SVG is not accepted.'}>
        <ul className="divide-y divide-line rounded-xl border border-line bg-cream">
          {FILES.map(([file, note]) => (
            <li key={file} className="flex items-center justify-between gap-4 px-4 py-3">
              <div><div className="font-mono text-sm text-ink">{file}</div><div className="text-xs text-stone-500">{tr(pt, note)}</div></div>
              <a href={`/brand/${file}`} download className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-parchment"><Download aria-hidden="true" className="h-3.5 w-3.5" />{pt ? 'Descarregar' : 'Download'}<span className="sr-only">{`: ${file.split('/').pop()}`}</span></a>
            </li>
          ))}
        </ul>
      </Section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
