import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { RevisedDate } from '@/components/brand/RevisedDate';
import { TextLink } from '@/components/brand/TextLink';
import { Action } from '@/components/brand/Action';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { CONTAINER_CLASS } from '@/components/brand/Container';
import { RulerEdge } from '@/components/instrument/RulerEdge';
import { LogoHorizontal, Mark, MarkSmall } from '@/components/Logo';
import { Disclosure } from '@/components/viz/Disclosure';
import { ChartTable } from '@/components/viz/ChartTable';
import { SERIES, STATUS } from '@/components/viz/theme';
import { Coupon, type CouponFixture } from '@/components/football/Coupon';
import {
  BandGlyph, ChannelHead, ChartTabs, IntervalBand, NoMargin, NowGlyph, PosHist, ProbBar, ReadingRule, Register, Ruler, TickGlyph,
} from '@/components/instrument';
import { Chapter, DoDont, ExampleTag, MarkConstruction, Part, Rules, Specimen, Swatch, tr, type Copy } from '@/components/design-system/parts';
import { BRAND, MARK_BAND, MARK_LEFT, MARK_RIGHT } from '@/lib/brand';
import { BRAND_BIO, BRAND_DESCRIPTOR, BRAND_LINE } from '@/lib/brand/descriptor';
import { WORDMARK_WIDTH } from '@/lib/brand/wordmark';
import { partyColors } from '@/lib/config/colors';
import { teamColorOnPaper, teamDisplayName } from '@/lib/config/football';
import { formatPercent, formatPp, formatReadingTime, matchLabel } from '@/lib/football-format';
import { formatElectionProbability } from '@/lib/election-display';
import { formatCount } from '@/lib/population/format';
import { formatSignedNumber, ordinal } from '@/lib/typography';
import { setRequestLocale } from '@/i18n/request-locale';

/** The guide's own revision date (RevisedDate in the hero). */
const REVISED = '2026-10-11';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return createPageMetadata({
    locale,
    path: '/marca',
    title: locale === 'pt' ? 'Sistema de desenho' : 'Design system',
    description: locale === 'pt'
      ? 'Como se desenha o estimador.pt: princípios, as três marcas, a assinatura, cor, tipo, números, componentes, gráficos, escrita e ficheiros.'
      : 'How estimador.pt is drawn: principles, the three marks, the signature, colour, type, numbers, components, charts, writing and files.',
    index: false,
  });
}

const CHAPTERS: ReadonlyArray<readonly [id: string, Copy]> = [
  ['principios', ['Princípios', 'Principles']],
  ['regra', ['A regra de leitura', 'The reading rule']],
  ['assinatura', ['A assinatura', 'The signature']],
  ['cor', ['Cor', 'Colour']],
  ['tipo', ['Tipo', 'Type']],
  ['numeros', ['Números e datas', 'Numbers and dates']],
  ['grelha', ['Grelha, filetes e espaço', 'Grid, rules and space']],
  ['instrumentos', ['Instrumentos', 'Instruments']],
  ['componentes', ['Componentes', 'Components']],
  ['graficos', ['Gráficos e tabelas', 'Charts and tables']],
  ['escrita', ['Escrita', 'Writing']],
  ['partilha', ['Partilha e redes', 'Sharing and social']],
  ['acessibilidade', ['Acessibilidade', 'Accessibility']],
  ['ficheiros', ['Ficheiros', 'Files']],
];
const chapterTitle = (id: string, pt: boolean) => tr(pt, CHAPTERS.find(([key]) => key === id)![1]);
const chapterNumber = (id: string) => CHAPTERS.findIndex(([key]) => key === id) + 1;

const LOGO_FILES: ReadonlyArray<readonly [string, Copy]> = [
  ['brand/estimador-logo.svg', ['Assinatura, tinta sobre transparente', 'Signature, ink on transparent']],
  ['brand/estimador-logo-paper.svg', ['Assinatura, branco sobre transparente, para fundos escuros', 'Signature, white on transparent, for dark grounds']],
  ['brand/estimador-logo@4x.png', ['Assinatura em PNG, 4×', 'Signature as PNG, 4×']],
  ['brand/estimador-logo-paper@4x.png', ['Assinatura branca em PNG, 4×', 'White signature as PNG, 4×']],
  ['brand/estimador-mark.svg', ['Símbolo, 48 × 24', 'Mark, 48 × 24']],
  ['brand/estimador-mark-paper.svg', ['Símbolo, branco', 'Mark, white']],
  ['brand/estimador-mark-small.svg', ['Símbolo reduzido, 32 × 32, abaixo de 24 px', 'Small mark, 32 × 32, below 24px']],
  ['brand/estimador-app-icon.svg', ['Ícone de app, branco sobre tinta', 'App icon, white on ink']],
  ['brand/estimador-app-icon-512.png', ['Ícone de app em PNG, 512 px', 'App icon as PNG, 512px']],
];

const KIT: ReadonlyArray<readonly [string, string, Copy]> = [
  ['branding/avatar-1024-forest.png', '1024 × 1024', ['Avatar, branco sobre tinta', 'Avatar, white on ink']],
  ['branding/avatar-1024-paper.png', '1024 × 1024', ['Avatar, tinta sobre branco', 'Avatar, ink on white']],
  ['images/brand/banner-1500x500.png', '1500 × 500', ['Cabeçalho do X e do Bluesky', 'X and Bluesky header']],
  ['branding/banner-1500x500-dark.png', '1500 × 500', ['Cabeçalho, sobre tinta', 'Header, on ink']],
  ['branding/linkedin-cover-light.png', '1584 × 396', ['Capa do LinkedIn', 'LinkedIn cover']],
  ['branding/linkedin-cover-dark.png', '1584 × 396', ['Capa do LinkedIn, sobre tinta', 'LinkedIn cover, on ink']],
  ['branding/linkedin-post-light.png', '1200 × 1200', ['Publicação quadrada', 'Square post']],
  ['branding/linkedin-post-dark.png', '1200 × 1200', ['Publicação quadrada, sobre tinta', 'Square post, on ink']],
  ['branding/post-1600x900-light.png', '1600 × 900', ['Publicação 16:9', '16:9 post']],
  ['branding/story-1080x1920-light.png', '1080 × 1920', ['Story', 'Story']],
  ['branding/story-1080x1920-dark.png', '1080 × 1920', ['Story, sobre tinta', 'Story, on ink']],
];

/** The share cards this build serves, from the manifest scripts/generate-og-images.mjs writes. */
function currentCards(locale: string): Array<{ route: string; file: string; alt: string }> {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'og-manifest.json'), 'utf8')) as {
      cards: Record<string, Record<string, string>>; alt: Record<string, string>;
    };
    return Object.entries(manifest.cards[locale] ?? {}).map(([route, file]) => ({ route, file, alt: manifest.alt[file] ?? '' }));
  } catch {
    return [];
  }
}

export default async function DesignSystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== 'en';
  const lang = pt ? 'pt' : 'en';
  const ex = <ExampleTag pt={pt} />;

  // Illustrative instruments: generic clubs, so a screenshot never reads as a forecast.
  const clubs = pt ? ['Clube A', 'Clube B', 'Clube C'] : ['Club A', 'Club B', 'Club C'];
  const bands = [
    { name: clubs[0], share: 0.48, now: 24, lo: 72, md: 81, hi: 90, hist: [0.48, 0.3, 0.14, 0.05, 0.02, 0.01] },
    { name: clubs[1], share: 0.31, now: 19, lo: 68, md: 78, hi: 87, hist: [0.31, 0.36, 0.2, 0.08, 0.03, 0.02] },
    { name: clubs[2], share: 0.2, now: 17, lo: 66, md: 76, hi: 85, hist: [0.2, 0.28, 0.33, 0.12, 0.05, 0.02] },
  ];
  const fixtures: CouponFixture[] = [
    {
      home: clubs[0], away: clubs[2], matchday: 9, kickoff: '2026-10-18T19:30:00Z', kickoffConfirmed: true,
      p_home: 0.52, p_draw: 0.26, p_away: 0.22,
      scenario: {
        home_team: clubs[0], away_team: clubs[2],
        conditionals: {
          H: { n_sims: 50000, teams: { [clubs[0]]: { p_champion: 0.55, p_top3: 0.9, p_relegation: 0 }, [clubs[2]]: { p_champion: 0.15, p_top3: 0.6, p_relegation: 0 } } },
          D: { n_sims: 50000, teams: { [clubs[0]]: { p_champion: 0.43, p_top3: 0.86, p_relegation: 0 }, [clubs[2]]: { p_champion: 0.2, p_top3: 0.65, p_relegation: 0 } } },
          A: { n_sims: 50000, teams: { [clubs[0]]: { p_champion: 0.39, p_top3: 0.82, p_relegation: 0 }, [clubs[2]]: { p_champion: 0.27, p_top3: 0.72, p_relegation: 0 } } },
        },
      },
    },
    {
      home: clubs[1], away: pt ? 'Clube D' : 'Club D', matchday: 9, kickoff: '2026-10-19T17:00:00Z', kickoffConfirmed: false,
      p_home: 0.71, p_draw: 0.18, p_away: 0.11, scenario: null,
    },
  ];

  const cards = currentCards(locale);
  const contentsCols = 'grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          eyebrow={pt ? 'Marca · sistema de desenho' : 'Brand · design system'}
          title={pt ? 'O estimador.pt desenha-se como um instrumento de medida' : 'estimador.pt is drawn as a measuring instrument'}
          lede={pt
            ? 'Tinta preta sobre branco, filetes de 1 px entre instrumentos, conclusões como títulos e uma gramática de três marcas, usada da mesma maneira em todas as páginas. Este guia é a referência de tudo isso: princípios, marcas, assinatura, cor, tipo, números, componentes, gráficos, escrita e ficheiros. Cada exemplo é o componente que o site usa.'
            : 'Black ink on white, 1px rules between instruments, findings as headlines and one grammar of three marks, used the same way on every page. This guide is the reference for all of it: principles, marks, signature, colour, type, numbers, components, charts, writing and files. Every specimen is the component the site uses.'}
          meta={<RevisedDate date={REVISED} locale={locale} />}
        />

        <div className={`${CONTAINER_CLASS} pb-24`}>
          <nav aria-label={pt ? 'Capítulos' : 'Chapters'} className="mt-2 border-t border-ink">
            <ol className={contentsCols}>
              {CHAPTERS.map(([id, title], i) => (
                <li key={id} className="border-b border-grid">
                  <a href={`#${id}`} className="flex min-h-11 items-center gap-3 text-[14.5px] no-underline hover:underline">
                    <span className="disp w-7 text-[13px] text-graphite">§{i + 1}</span>{tr(pt, title)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* §1 Principles */}
          <Chapter id="principios" n={chapterNumber('principios')} title={chapterTitle('principios', pt)}
            lede={pt
              ? 'Sete regras decidem quase tudo. Quando uma página parece "feita por uma máquina", é quase sempre porque quebra uma delas.'
              : 'Seven rules decide almost everything. When a page looks "machine-made", it is almost always because it breaks one of them.'}>
            <ol className="grid gap-x-10 border-t border-ink md:grid-cols-2">
              {([
                [['Cada secção é um instrumento.', 'Each section is an instrument.'], ['Nome, leitura, data, filete. A página lê-se de cima para baixo como um painel: o que mede, o que marca, quando foi lido.', 'Name, reading, date, rule. A page reads top to bottom like a panel: what it measures, what it reads, when it was read.']],
                [['Conclusões, não perguntas.', 'Findings, not questions.'], ['O título diz o resultado em palavras que se repetem; as contagens vão na entrada. Perguntas só quando se pergunta mesmo alguma coisa ao leitor.', 'The headline states the result in words people repeat; the counts go in the standfirst. Questions only where the reader is actually asked something.']],
                [['A incerteza desenha-se.', 'Uncertainty is drawn.'], ['Uma banda e o intervalo impresso ao lado, não prosa cautelosa. A margem é um objeto que se vê e se mede.', 'A band and the range printed beside it, not hedging prose. The margin is an object you can see and measure.']],
                [['Tinta sobre branco.', 'Ink on white.'], ['Preto, branco e filetes. A cor pertence aos dados (clubes, partidos, séries); o amarelo pertence à margem do modelo e a mais nada.', 'Black, white and rules. Colour belongs to the data (clubs, parties, series); the yellow belongs to the model’s margin and nothing else.']],
                [['Datado e com fonte.', 'Dated and sourced.'], ['Datas absolutas, à hora de Lisboa. Cada gráfico tem título, fonte, data, ligação ao método e uma tabela gémea.', 'Absolute dates, in Lisbon time. Every chart has a title, a source, a date, a link to the method and a table twin.']],
                [['Uma ação por peça.', 'One action per piece.'], ['Um instrumento pede no máximo uma coisa ao leitor: procurar a freguesia, ver o clube, abrir o método.', 'An instrument asks at most one thing of the reader: find the parish, see the club, open the method.']],
                [['Nada de enfeites.', 'No ornament.'], ['Sem pílulas, etiquetas em maiúsculas espaçadas, pinturas, mosaicos, sombras, cantos redondos, gradientes nem emoji. A única decoração é a aresta da régua, no cabeçalho e no rodapé.', 'No pills, letter-spaced uppercase labels, paintings, mosaics, shadows, rounded corners, gradients or emoji. The one decoration is the ruler edge, in the header and the footer.']],
              ] as const).map(([title, body], i) => (
                <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] border-b border-grid py-3.5">
                  <span className="disp text-[15px]">{i + 1}</span>
                  <span><b className="font-semibold">{tr(pt, title)}</b> <span className="text-graphite">{tr(pt, body)}</span></span>
                </li>
              ))}
            </ol>
          </Chapter>

          {/* §2 The reading rule */}
          <Chapter id="regra" n={chapterNumber('regra')} title={chapterTitle('regra', pt)}
            lede={pt
              ? 'Três marcas, e só três, para tudo o que o site mede. Estão impressas no topo da página inicial e no rodapé, e em versão curta debaixo de qualquer gráfico que as use.'
              : 'Three marks, and only three, for everything the site measures. They are printed at the top of the homepage and in the footer, and in short form under any chart that uses them.'}>
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
              <Specimen name={pt ? 'Quadrado preto' : 'Black square'} code="<NowGlyph />, IntervalBand now">
                <p className="flex items-center gap-3 text-[15px]"><span className="inline-block size-4 bg-ink" aria-hidden="true" />{pt ? 'O que já aconteceu.' : 'What has already happened.'}</p>
                <p className="mt-2 text-[13px] leading-[19px] text-graphite">{pt ? 'Os pontos de um clube hoje, o resultado de um jogo, a contagem que se verificou.' : 'A club’s points today, a game’s result, the count that occurred.'}</p>
              </Specimen>
              <Specimen name={pt ? 'Banda amarela' : 'Yellow band'} code="<IntervalBand />">
                <IntervalBand lo={35} md={52} hi={70} min={0} max={100} label={pt ? 'Exemplo de banda de 35 a 70, mediana 52' : 'Example band from 35 to 70, median 52'} />
                <p className="mt-2 text-[13px] leading-[19px] text-graphite">{pt ? 'A margem do modelo: um intervalo de 90%, salvo se a etiqueta disser outra coisa. Tampas finas a tinta, a mediana como traço.' : 'The model’s margin: a 90% interval unless the label says otherwise. Thin ink caps, the median as a tick.'}</p>
              </Specimen>
              <Specimen name={pt ? 'Traço só' : 'Lone tick'} code="<NoMargin />">
                <NoMargin locale={locale} />
                <p className="mt-2 text-[13px] leading-[19px] text-graphite">{pt ? 'Uma corrida do modelo, sem margem. Todo o número da população sintética o leva, antes do primeiro valor.' : 'One model run, no margin. Every synthetic-population figure carries it, before the first value.'}</p>
              </Specimen>
            </div>
            <Part title={pt ? 'A legenda' : 'The legend'} note={pt ? 'Completa no topo da página inicial e no rodapé; curta debaixo de um gráfico, só com as marcas que ele usa.' : 'In full at the top of the homepage and in the footer; short under a chart, with only the marks it uses.'}>
              <div className="grid gap-3 text-[13px] text-graphite">
                <ReadingRule locale={locale} />
                <ReadingRule locale={locale} variant="short" marks={['now', 'band']} />
              </div>
            </Part>
            <Part title={pt ? 'Variantes da banda' : 'Band variants'} note={pt ? 'Todas na escala da própria célula: min e max são os do Ruler impresso por cima.' : 'All on the cell’s own scale: min and max are those of the Ruler printed above.'}>
              <div tabIndex={0} role="region" aria-label={pt ? 'Variantes da banda' : 'Band variants'} className="scroll-cue overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-ink text-left text-[12.5px] text-graphite">
                      <th scope="col" className="w-[38%] pb-1.5 pr-4 font-medium">{pt ? 'Uso' : 'Use'}</th>
                      <th scope="col" className="pb-1.5 pr-4 font-medium"><span className="block">{pt ? 'Pontos' : 'Points'}</span><Ruler min={0} max={100} minor={5} major={25} labels={[0, 25, 50, 75, 100]} className="mt-1" /></th>
                      <th scope="col" className="w-[28%] pb-1.5 font-medium">{pt ? 'Propriedade' : 'Prop'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      [['Margem de 90%', '90% margin'], { lo: 62, md: 74, hi: 86 }, 'lo md hi'],
                      [['Com o que já aconteceu', 'With what already happened'], { lo: 62, md: 74, hi: 86, now: 24 }, 'now'],
                      [['Com o resultado, no fim', 'With the outcome, at the end'], { lo: 62, md: 74, hi: 86, result: 79 }, 'result'],
                      [['Atenuada (meio da tabela)', 'De-emphasised (mid-table)'], { lo: 40, md: 49, hi: 58, low: true }, 'low'],
                      [['Com uma referência', 'With a reference'], { lo: 30, md: 41, hi: 52, reference: 45 }, 'reference'],
                    ] as const).map(([label, props, code]) => (
                      <tr key={code} className="border-b border-grid">
                        <th scope="row" className="py-2 pr-4 text-left font-normal">{tr(pt, label)}</th>
                        <td className="py-2 pr-4"><IntervalBand min={0} max={100} {...props} /></td>
                        <td className="py-2 font-mono text-[12px] text-graphite">{code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Part>
            <Part title={pt ? 'Regras' : 'Rules'}>
              <Rules items={pt ? [
                <>O amarelo (<code className="font-mono text-[13px]">--color-signal</code>, #ffd400) quer dizer a margem do modelo e mais nada: nunca um destaque, um botão, um aviso ou uma cor de clube. A versão atenuada (<code className="font-mono text-[13px]">--color-signal-low</code>) é a mesma banda com menos peso.</>,
                'O significado nunca depende do amarelo (1,4:1 sobre branco): as tampas a tinta, a mediana e o intervalo impresso ao lado dizem o mesmo. Em cores forçadas a banda é desenhada em CanvasText.',
                'Uma banda tem sempre o intervalo escrito ao lado ou na tabela gémea ("82 72–91"). Uma banda sem números é decoração.',
                'Sem bandas onde a dispersão não é a incerteza do modelo: os gráficos de título e despromoção da Liga não as têm (a dispersão por blocos de 500 simulações não é uma margem).',
                'A população sintética nunca leva banda: é uma corrida. Leva o traço só e a frase de honestidade antes do primeiro número.',
              ] : [
                <>The yellow (<code className="font-mono text-[13px]">--color-signal</code>, #ffd400) means the model’s margin and nothing else: never a highlight, a button, a warning or a club colour. The low version (<code className="font-mono text-[13px]">--color-signal-low</code>) is the same band with less weight.</>,
                'The meaning never depends on the yellow (1.4:1 on white): the ink caps, the median and the range printed beside it say the same. In forced colours the band is drawn in CanvasText.',
                'A band always has its range written beside it or in the table twin ("82 72–91"). A band without numbers is decoration.',
                'No bands where the spread is not the model’s uncertainty: the Liga title and relegation charts have none (the spread of 500-simulation blocks is not a margin).',
                'The synthetic population never carries a band: it is one run. It carries the lone tick and the honesty line before the first figure.',
              ]} />
            </Part>
          </Chapter>

          {/* §3 The signature */}
          <Chapter id="assinatura" n={chapterNumber('assinatura')} title={chapterTitle('assinatura', pt)}
            lede={pt
              ? 'O símbolo é um intervalo desenhado como as páginas o desenham: tampas quadradas em bigodes, uma banda de pontas retas e a ranhura da mediana um pouco à esquerda do centro. O nome está em IBM Plex Sans 700, a letra dos títulos, com o .pt em cinza. Uma só cor, uma só assinatura.'
              : 'The mark is an interval drawn the way the pages draw one: square caps on whiskers, a square-ended band and the median slot a little left of centre. The name is in IBM Plex Sans 700, the headline face, with the .pt in grey. One colour, one signature.'}>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
              <Specimen name={pt ? 'Sobre branco' : 'On white'} code="<LogoHorizontal size={32} />">
                <div className="flex flex-col items-start gap-5 py-2">
                  <LogoHorizontal size={40} className="h-auto max-w-full" />
                  <LogoHorizontal size={24} />
                  <LogoHorizontal size={18} />
                </div>
              </Specimen>
              <Specimen name={pt ? 'Sobre tinta' : 'On ink'} code={'<LogoHorizontal tone="paper" />'}>
                <div className="flex flex-col items-start gap-5 bg-forest p-6">
                  <LogoHorizontal size={40} tone="paper" className="h-auto max-w-full" />
                  <LogoHorizontal size={24} tone="paper" />
                </div>
              </Specimen>
              <Specimen name={pt ? 'O símbolo' : 'The mark'} code="<Mark />, <MarkSmall />" note={pt ? 'Abaixo de 24 px usa-se o símbolo reduzido (32 × 32): bigodes mais curtos e banda mais alta, para o favicon e os avatares.' : 'Below 24px use the small mark (32 × 32): shorter whiskers and a taller band, for the favicon and avatars.'}>
                <div className="flex flex-wrap items-end gap-8">
                  <Mark height={48} color={BRAND.ink} />
                  <Mark height={24} color={BRAND.ink} />
                  <MarkSmall size={32} color={BRAND.ink} />
                  <MarkSmall size={16} color={BRAND.ink} />
                  <span className="inline-flex bg-forest p-2"><MarkSmall size={32} color={BRAND.paper} /></span>
                </div>
              </Specimen>
              <Specimen name={pt ? 'Em movimento' : 'In motion'} code="<MarkLoading />, .brand-link:hover" note={pt ? 'Ao passar o cursor pela assinatura, o intervalo abre duas unidades e volta. Enquanto algo carrega mesmo, a ranhura da mediana percorre a banda. Ambos param com prefers-reduced-motion. Uma previsão publicada nunca se mostra "a estimar".' : 'On hover the signature’s interval opens by two units and closes again. While something really loads, the median slot travels the band. Both stop under prefers-reduced-motion. A published forecast is never shown "estimating".'}>
                <div className="flex items-center gap-8">
                  <a href="#assinatura" className="brand-link inline-flex"><LogoHorizontal size={28} /></a>
                  <MarkLoading height={28} color={BRAND.ink} label={pt ? 'A carregar' : 'Loading'} />
                </div>
              </Specimen>
            </div>
            <Part title={pt ? 'Construção' : 'Construction'} note={pt ? `Uma grelha de 48 × 24 unidades. As tampas têm 2 × 10, os bigodes 9 × 2, a banda 22 × 12 e a ranhura 2 × 8, das unidades 21 a 23 (o centro da banda é a 24). Na assinatura, o nome começa na unidade 58 de uma caixa de ${WORDMARK_WIDTH} × 24. A geometria vive em src/lib/brand/geometry.json e o nome em wordmark-paths.json; npm run brand gera tudo a partir deles.` : `A 48 × 24 unit grid. The caps are 2 × 10, the whiskers 9 × 2, the band 22 × 12 and the slot 2 × 8, from unit 21 to 23 (the band’s centre is 24). In the signature, the name starts at unit 58 of a ${WORDMARK_WIDTH} × 24 box. The geometry lives in src/lib/brand/geometry.json and the name in wordmark-paths.json; npm run brand generates everything from them.`}>
              <MarkConstruction pt={pt} left={MARK_LEFT} band={MARK_BAND} right={MARK_RIGHT} />
            </Part>
            <Part title={pt ? 'Espaço e tamanhos' : 'Space and sizes'}>
              <Rules items={pt ? [
                'Margem livre à volta da assinatura: a altura da banda (12 unidades, metade da altura do símbolo) em todos os lados.',
                'Tamanho mínimo da assinatura: 18 px de altura no ecrã, 6 mm impressa. Abaixo disso, o símbolo reduzido sozinho.',
                'No cabeçalho a assinatura tem 22 px de altura (18 px no telemóvel); no rodapé, 20 px. No cabeçalho liga sempre à página inicial, com o nome acessível "estimador.pt — página inicial".',
              ] : [
                'Clear space around the signature: the band’s height (12 units, half the mark’s height) on every side.',
                'Minimum signature size: 18px tall on screen, 6mm in print. Below that, the small mark alone.',
                'In the header the signature is 22px tall (18px on phones); in the footer, 20px. In the header it always links to the homepage, named "estimador.pt — home".',
              ]} />
            </Part>
            <Part title={pt ? 'O que não fazer' : 'What not to do'}>
              <DoDont pt={pt} rows={pt ? [
                ['Tinta sobre branco, ou branco sobre tinta.', 'Amarelo, cor de clube ou de partido no símbolo.', 'O amarelo é a margem do modelo; no símbolo leria como um dado.'],
                ['O nome desenhado a partir dos caminhos.', 'Escrever "estimador.pt" numa letra do sistema ao lado do símbolo.', 'A assinatura não depende da letra da página (LogoHorizontal desenha caminhos).'],
                ['Uma assinatura horizontal.', 'Versões empilhadas, em serifa ou com o nome de alguém.', 'Uma só assinatura; o nome do autor fica no rodapé e no Sobre.'],
                ['Escalar mantendo a proporção.', 'Esticar, rodar, contornar ou pôr sombra.', 'Um instrumento não se deforma.'],
              ] : [
                ['Ink on white, or white on ink.', 'Yellow, a club or party colour in the mark.', 'The yellow is the model’s margin; in the mark it would read as data.'],
                ['The name drawn from its paths.', 'Typing "estimador.pt" in a system font beside the mark.', 'The signature never depends on the page’s font (LogoHorizontal draws paths).'],
                ['One horizontal signature.', 'Stacked, serif or named versions.', 'One signature; the author’s name lives in the footer and on About.'],
                ['Scaling in proportion.', 'Stretching, rotating, outlining or adding a shadow.', 'An instrument does not deform.'],
              ]} />
            </Part>
          </Chapter>

          {/* §4 Colour */}
          <Chapter id="cor" n={chapterNumber('cor')} title={chapterTitle('cor', pt)}
            lede={pt
              ? 'Branco, tinta e dois cinzentos de filete fazem a página; o amarelo faz a margem; o resto da cor é dos dados. Os tokens vivem em src/app/globals.css e, para SVG, Plot e canvas, em BRAND (src/lib/brand). Os contrastes abaixo são calculados, não escritos à mão.'
              : 'White, ink and two rule greys make the page; the yellow makes the margin; every other colour belongs to the data. The tokens live in src/app/globals.css and, for SVG, Plot and canvas, in BRAND (src/lib/brand). The contrasts below are computed, not typed.'}>
            <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
              <Part title={pt ? 'Superfícies e filetes' : 'Surfaces and rules'} flush>
                <Swatch pt={pt} name={pt ? 'Papel' : 'Paper'} token="bg-paper" hex={BRAND.paper} use={pt ? 'O chão de todas as páginas e de todos os painéis.' : 'The ground of every page and every panel.'} />
                <Swatch pt={pt} name={pt ? 'Campo' : 'Field'} token="bg-field" hex="#f4f4f4" use={pt ? 'Hover, zonas afundadas, fundos de separador.' : 'Hover, sunken areas, tab grounds.'} />
                <Swatch pt={pt} name={pt ? 'Filete' : 'Rule'} token="border-rule" hex={BRAND.line} use={pt ? '1 px entre instrumentos e à volta de campos.' : '1px between instruments and around fields.'} />
                <Swatch pt={pt} name={pt ? 'Grelha' : 'Grid'} token="border-grid" hex={BRAND.grid} use={pt ? 'Linhas de tabela e grelhas de gráfico.' : 'Table row hairlines and chart grids.'} />
              </Part>
              <Part title={pt ? 'Tinta' : 'Ink'} flush>
                <Swatch pt={pt} textual name={pt ? 'Tinta' : 'Ink'} token="text-ink · border-ink" hex={BRAND.ink} use={pt ? 'Texto, marcas, ações primárias, o filete sob a cabeça de um instrumento.' : 'Text, marks, primary actions, the rule under an instrument’s head.'} />
                <Swatch pt={pt} textual name={pt ? 'Grafite' : 'Graphite'} token="text-graphite" hex={BRAND.muted} use={pt ? 'Texto secundário, etiquetas, texto de gráfico, o .pt da assinatura.' : 'Secondary text, labels, chart text, the .pt of the signature.'} />
                <Swatch pt={pt} textual name={pt ? 'Escala' : 'Scale'} token="--color-scale" hex={BRAND.faint} use={pt ? 'Marcas menores de régua e traços. Nunca palavras.' : 'Minor ruler ticks and strokes. Never words.'} />
              </Part>
              <Part title={pt ? 'Sinal' : 'Signal'} flush>
                <Swatch pt={pt} name={pt ? 'Sinal' : 'Signal'} token="--color-signal" hex={BRAND.signal} use={pt ? 'A banda da margem do modelo. Mais nada.' : 'The band of the model’s margin. Nothing else.'} />
                <Swatch pt={pt} name={pt ? 'Sinal atenuado' : 'Signal, low'} token="--color-signal-low" hex={BRAND.signalLow} use={pt ? 'A mesma banda com menos peso (meio da tabela).' : 'The same band with less weight (mid-table).'} />
              </Part>
              <Part title={pt ? 'Estado' : 'Status'} flush note={pt ? 'Como texto, vermelho e verde usam o passo 700. Um estado leva sempre um ícone e uma palavra; a cor nunca está sozinha.' : 'As text, red and green use the 700 step. A status always ships with an icon and a word; colour is never alone.'}>
                <Swatch pt={pt} textual name={pt ? 'Positivo' : 'Positive'} token="text-green-700 · --color-positive" hex={BRAND.tree} use={pt ? 'Subidas e confirmações, com sinal e palavra.' : 'Rises and confirmations, with a sign and a word.'} />
                <Swatch pt={pt} textual name={pt ? 'Negativo' : 'Negative'} token="text-red-700 · --color-negative" hex={BRAND.terracotta} use={pt ? 'Descidas, erros, despromoção nos textos de estado.' : 'Falls, errors, relegation in status text.'} />
                <Swatch pt={pt} textual name={pt ? 'Ressalva' : 'Caveat'} token="text-amber-700" hex="#92400e" use={pt ? 'Notas de ressalva (dados provisórios, um erro conhecido do produtor).' : 'Caveat notes (provisional data, a known producer error).'} />
              </Part>
            </div>
            <Part title={pt ? 'Cor dos dados' : 'Colour of the data'} note={pt ? 'Clubes e partidos têm os seus próprios mapas; as séries genéricas são quatro, numa ordem fixa, nunca recicladas e nunca em texto. Uma cor de clube que não chega a 3:1 sobre branco escurece até chegar (teamColorOnPaper): os amarelos do Estoril e do Arouca nunca se confundem com a banda.' : 'Clubs and parties keep their own maps; the generic series are four, in a fixed order, never cycled and never on text. A club colour short of 3:1 on white is darkened until it reaches it (teamColorOnPaper): Estoril’s and Arouca’s yellows never pass for the band.'}>
              <div className="grid gap-x-10 gap-y-6 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-[13px] font-semibold">{pt ? 'Séries (SERIES)' : 'Series (SERIES)'}</p>
                  <ul className="grid gap-1.5">
                    {SERIES.map((hex, i) => (
                      <li key={hex} className="flex items-center gap-3 text-[13px]"><span className="inline-block h-3 w-10" style={{ backgroundColor: hex }} aria-hidden="true" /><span className="font-mono text-[12px] text-graphite">{i + 1} · {hex}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-semibold">{pt ? 'Clubes, sobre branco' : 'Clubs, on white'}</p>
                  <ul className="grid gap-1.5">
                    {['Porto', 'Sporting CP', 'Benfica', 'SC Braga', 'Estoril', 'Arouca'].map(team => (
                      <li key={team} className="flex items-center gap-3 text-[13px]"><span className="inline-block size-3" style={{ backgroundColor: teamColorOnPaper(team) }} aria-hidden="true" />{teamDisplayName(team)} <span className="font-mono text-[12px] text-graphite">{teamColorOnPaper(team)}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-semibold">{pt ? 'Partidos (arquivo)' : 'Parties (archive)'}</p>
                  <ul className="grid gap-1.5">
                    {(['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'] as const).map(party => (
                      <li key={party} className="flex items-center gap-3 text-[13px]"><span className="inline-block size-3" style={{ backgroundColor: partyColors[party] }} aria-hidden="true" />{party} <span className="font-mono text-[12px] text-graphite">{partyColors[party]}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-graphite">
                {(Object.entries(STATUS) as Array<[string, string]>).map(([k, hex]) => (
                  <span key={k} className="inline-flex items-center gap-2"><span className="inline-block size-3" style={{ backgroundColor: hex }} aria-hidden="true" />STATUS.{k} <span className="font-mono text-[12px]">{hex}</span></span>
                ))}
              </p>
            </Part>
          </Chapter>

          {/* §5 Type */}
          <Chapter id="tipo" n={chapterNumber('tipo')} title={chapterTitle('tipo', pt)}
            lede={pt
              ? 'Uma família, IBM Plex Sans, numa só largura, para texto, títulos, figuras e tabelas; servida a partir do estimador.pt. Uma face de leitura, Newsreader, só dentro do corpo das peças longas. Os pesos fazem a hierarquia: 700 nos títulos e nas figuras, 600 nos nomes, 400 no texto.'
              : 'One family, IBM Plex Sans, in one width, for text, headlines, figures and tables; served from estimador.pt. One reading face, Newsreader, only inside the body of long pieces. Weights make the hierarchy: 700 for headlines and figures, 600 for names, 400 for text.'}>
            <div className="border-t border-ink pt-4">
              <p className="text-[44px] font-bold leading-none tracking-[-0.01em] sm:text-[64px] md:text-[96px]">Aa 0123456789</p>
              <p className="mt-3 text-[15px] text-graphite">IBM Plex Sans · 400 500 600 700 · <span className="tnum">1 234 567,89 −12,5% 72–91</span></p>
            </div>
            <Part title={pt ? 'Escala' : 'Scale'} note={pt ? 'Etiquetas em minúsculas de frase, 12 px em grafite: nada de maiúsculas espaçadas. Nada abaixo de 11 px, nem num SVG. Figuras tabulares em todo o td, th e .tnum.' : 'Labels in sentence case, 12px in graphite: no letter-spaced uppercase. Nothing below 11px, not even in an SVG. Tabular figures in every td, th and .tnum.'}>
              <div tabIndex={0} role="region" aria-label={pt ? 'Escala tipográfica' : 'Type scale'} className="scroll-cue overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="border-b border-ink text-left text-[12.5px] text-graphite">
                      <th scope="col" className="w-[22%] pb-1.5 pr-4 font-medium">{pt ? 'Papel' : 'Role'}</th>
                      <th scope="col" className="pb-1.5 pr-4 font-medium">{pt ? 'Amostra' : 'Sample'}</th>
                      <th scope="col" className="w-[26%] pb-1.5 font-medium">{pt ? 'Tamanho, peso, classe' : 'Size, weight, class'}</th>
                    </tr>
                  </thead>
                  <tbody className="align-baseline">
                    {([
                      [['Título de página', 'Page title'], <span key="s" className="block text-[36px] font-bold leading-[1.05] md:text-[48px]">{pt ? 'A Liga em metade das épocas' : 'The league in half the seasons'}</span>, 'h1 · 36/48 · 700'],
                      [['Conclusão', 'Finding'], <span key="s" className="disp block text-[34px] leading-[0.98] md:text-[46px]">{pt ? 'O Porto ganha a Liga em metade das épocas simuladas' : 'Porto win the league in half of the simulated seasons'}</span>, '.disp · 34/46 · 700'],
                      [['Cabeça de instrumento', 'Instrument head'], <span key="s" className="block text-[27px] font-bold leading-7">Liga Portugal <span className="disp text-[15px]">J8</span></span>, 'ChannelHead h2 · 26/27 · 700'],
                      [['Subtítulo', 'Subheading'], <span key="s" className="block text-[19px] font-semibold leading-6">{pt ? 'Despromoção, 17.º ou 18.º' : 'Relegation, 17th or 18th'}</span>, 'h3 · 19 · 600'],
                      [['Figura', 'Figure'], <span key="s" className="fig block text-[36px] leading-none">51<span className="text-[18px]">%</span></span>, '.fig · 18–36 · 700'],
                      [['Nome em tabela', 'Name in a table'], <span key="s" className="name-cut block text-[15px]">Sporting</span>, '.name-cut · 14–15 · 600'],
                      [['Texto', 'Text'], <span key="s" className="block max-w-[52ch] text-[16px] leading-[25px]">{pt ? 'Em 25 335 de 50 000 épocas simuladas, numa previsão feita com 5 dos 9 jogos da jornada 8 disputados.' : 'In 25,335 of 50,000 simulated seasons, in a forecast made with 5 of matchday 8’s 9 games played.'}</span>, '15.5–16 · 400'],
                      [['Etiqueta', 'Label'], <span key="s" className="block text-[12px] text-graphite">{pt ? 'Jogo, hora de Lisboa' : 'Game, Lisbon time'}</span>, '12–13 · 400–500 · graphite'],
                      [['Texto de gráfico', 'Chart text'], <span key="s" className="block text-[11.5px] text-graphite">0 25 50 75 100</span>, 'FURNITURE · 11–12'],
                      [['Leitura longa', 'Long reading'], <span key="s" className="block font-serif text-[18px] leading-[28px]">{pt ? 'A população sintética é uma corrida de um modelo.' : 'The synthetic population is one run of a model.'}</span>, '.article-body · Newsreader'],
                    ] as const).map(([role, sample, spec], i) => (
                      <tr key={i} className="border-b border-grid">
                        <th scope="row" className="py-3 pr-4 text-left text-[13px] font-normal text-graphite">{tr(pt, role)}</th>
                        <td className="py-3 pr-4">{sample}</td>
                        <td className="py-3 font-mono text-[12px] text-graphite">{spec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Part>
            <Part title={pt ? 'No código' : 'In code'}>
              <Rules items={pt ? [
                <>CSS: <code className="font-mono text-[13px]">--font-sans</code> para o texto e <code className="font-mono text-[13px]">--font-display</code> para o papel de título (hoje a mesma face); <code className="font-mono text-[13px]">--display-weight</code> 700.</>,
                <>SVG, Plot e canvas não leem variáveis CSS: usam <code className="font-mono text-[13px]">FONT_STACK</code> e <code className="font-mono text-[13px]">DISPLAY_FONT_STACK</code> de src/lib/brand. Mudam juntos.</>,
                'As letras são servidas pelo próprio site (@fontsource); nenhuma visita contacta um serviço de letras.',
              ] : [
                <>CSS: <code className="font-mono text-[13px]">--font-sans</code> for text and <code className="font-mono text-[13px]">--font-display</code> for the headline role (the same face today); <code className="font-mono text-[13px]">--display-weight</code> 700.</>,
                <>SVG, Plot and canvas cannot read CSS variables: they use <code className="font-mono text-[13px]">FONT_STACK</code> and <code className="font-mono text-[13px]">DISPLAY_FONT_STACK</code> from src/lib/brand. They change together.</>,
                'Fonts are served by the site itself (@fontsource); no page view contacts a font host.',
              ]} />
            </Part>
          </Chapter>

          {/* §6 Numbers and dates */}
          <Chapter id="numeros" n={chapterNumber('numeros')} title={chapterTitle('numeros', pt)}
            lede={pt
              ? 'Um número escreve-se sempre da mesma maneira, em português e em inglês, porque passa sempre pela mesma função. A tabela é calculada por essas funções ao gerar esta página.'
              : 'A number is always written the same way, in Portuguese and in English, because it always goes through the same function. The table is computed by those functions when this page is built.'}>
            <div tabIndex={0} role="region" aria-label={pt ? 'Formatos' : 'Formats'} className="scroll-cue overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-ink text-left text-[12.5px] text-graphite">
                    <th scope="col" className="pb-1.5 pr-4 font-medium">{pt ? 'O quê' : 'What'}</th>
                    <th scope="col" className="pb-1.5 pr-4 font-medium">{pt ? 'Função' : 'Function'}</th>
                    <th scope="col" className="pb-1.5 pr-4 text-right font-medium">PT</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">EN</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    [['Parte de simulações', 'Share of simulations'], 'formatPercent', (l: string) => `${formatPercent(0.507, l)} · ${formatPercent(0.0612, l)} · ${formatPercent(0.0002, l)} · ${formatPercent(0.997, l)}`],
                    [['Probabilidade eleitoral', 'Election probability'], 'formatElectionProbability', (l: string) => `${formatElectionProbability(0.004, l)} · ${formatElectionProbability(0.997, l)}`],
                    [['Variação', 'Change'], 'formatPp', (l: string) => `${formatPp(0.037, l)} · ${formatPp(-0.008, l)}`],
                    [['Negativo', 'Negative'], 'formatSignedNumber · MINUS', (l: string) => formatSignedNumber(-2.5, l, 1)],
                    [['Contagem', 'Count'], 'formatCount', (l: string) => `${formatCount(3092, l === 'en' ? 'en' : 'pt')} · ${formatCount(10340441, l === 'en' ? 'en' : 'pt')}`],
                    [['Intervalo', 'Range'], pt ? 'travessão' : 'en dash', () => '72–91'],
                    [['Data e hora de uma leitura', 'A reading’s date and time'], 'formatReadingTime', (l: string) => formatReadingTime('2026-10-10T23:11:00Z', l)],
                    [['Ordinal', 'Ordinal'], 'ordinal', (l: string) => `${ordinal(5, l)} · ${ordinal(1, l, 'f')}`],
                    [['Jogo', 'Game'], 'matchLabel', () => matchLabel('Benfica', 'Vitória')],
                  ] as const).map(([what, fn, render]) => (
                    <tr key={fn} className="border-b border-grid">
                      <th scope="row" className="py-2 pr-4 text-left font-normal">{tr(pt, what)}</th>
                      <td className="py-2 pr-4 font-mono text-[12px] text-graphite">{fn}</td>
                      <td className="py-2 pr-4 text-right tnum">{render('pt')}</td>
                      <td className="py-2 text-right tnum">{render('en')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Part title={pt ? 'Regras' : 'Rules'}>
              <Rules items={pt ? [
                'Percentagens de simulações: inteiras a partir de 10%, uma casa decimal abaixo, "<0,1%" e ">99%" nas pontas; nada diferente de zero se lê 0% e nada que não seja certo se lê 100%.',
                'Probabilidades eleitorais por extenso nas pontas: "menos de 1%", "mais de 99%".',
                'O sinal de menos é U+2212 (−), em texto, tabelas, rótulos de SVG e eixos. Variações em pp com sinal.',
                'Contagens agrupadas a partir de quatro algarismos, com espaço inseparável em português ("3 092").',
                'Datas absolutas e à hora de Lisboa ("11 out. 2026, 00:11"). Nunca "hoje" ou "amanhã" numa página estática: o relógio do leitor (ClockSwitch) trata da passagem do tempo.',
              ] : [
                'Shares of simulations: whole numbers from 10%, one decimal below, "<0.1%" and ">99%" at the ends; nothing non-zero reads 0% and nothing short of certain reads 100%.',
                'Election probabilities in words at the ends: "under 1%", "over 99%".',
                'The minus sign is U+2212 (−), in text, tables, SVG labels and axes. Changes in pp, signed.',
                'Counts grouped from four digits ("3,092"; a no-break space in Portuguese).',
                'Absolute dates in Lisbon time ("11 Oct 2026, 00:11"). Never "today" or "tomorrow" in a static page: the reader’s clock (ClockSwitch) handles the passing of time.',
              ]} />
            </Part>
          </Chapter>

          {/* §7 Grid, rules and space */}
          <Chapter id="grelha" n={chapterNumber('grelha')} title={chapterTitle('grelha', pt)}
            lede={pt
              ? 'Um só contentor alinha o cabeçalho, as abas de secção, o herói e o corpo; dentro dele, filetes separam instrumentos em vez de caixas. Sem cartões com fundo, sem sombras, sem raios: todos os tokens --radius-* valem 0.'
              : 'One container lines up the header, the section tabs, the hero and the body; inside it, rules separate instruments instead of boxes. No cards with backgrounds, no shadows, no radii: every --radius-* token is 0.'}>
            <Rules items={pt ? [
              <><code className="font-mono text-[13px]">CONTAINER_CLASS</code> (mx-auto w-full max-w-7xl px-4) para tudo. Uma coluna mais estreita é uma medida alinhada à esquerda dentro dele, nunca uma segunda caixa centrada.</>,
              'Filetes: 1 px border-rule entre instrumentos, border-grid entre linhas de tabela, 1 px border-ink sob a cabeça de um instrumento ou de uma tabela, 2 px de tinta por cima do rodapé.',
              'Pontos de quebra: sm 640, md 768, lg 1024, xl 1280. O contentor para nos 1280 px, por isso nada se reorganiza acima disso: num ecrã largo a página ganha margens, não colunas.',
              'Página inicial: Liga em dois terços e a população no último terço a partir de lg; empilhados abaixo.',
              'Alvos de toque com 44 px pelo menos (min-h-11); campos de formulário com 44 a 48 px, etiqueta visível e 16 px de letra abaixo de 640 px.',
              'scroll-padding-top de 5rem no html, para as âncoras não ficarem debaixo do cabeçalho.',
            ] : [
              <><code className="font-mono text-[13px]">CONTAINER_CLASS</code> (mx-auto w-full max-w-7xl px-4) for everything. A narrower column is a left-aligned measure inside it, never a second centred box.</>,
              'Rules: 1px border-rule between instruments, border-grid between table rows, 1px border-ink under an instrument’s or a table’s head, 2px of ink above the footer.',
              'Breakpoints: sm 640, md 768, lg 1024, xl 1280. The container stops at 1280px, so nothing rearranges above it: a wide screen gains margins, not columns.',
              'Homepage: the Liga in two thirds and the population in the last third from lg; stacked below.',
              'Tap targets at least 44px (min-h-11); form fields 44 to 48px, with a visible label and 16px type below 640px.',
              'scroll-padding-top of 5rem on html, so anchors do not land under the header.',
            ]} />
            <Part title={pt ? 'Anatomia de um instrumento' : 'Anatomy of an instrument'} note={pt ? 'A ordem é sempre esta: cabeça (nome, série, data), a conclusão, a entrada com as contagens, a figura, a legenda das marcas que usa, a fonte. Uma ação, se houver.' : 'Always in this order: the head (name, serial, date), the finding, the standfirst with the counts, the figure, the key to the marks it uses, the source. One action, if any.'}>
              <div className="max-w-[760px] border-t border-rule pt-5">
                <ChannelHead id="ds-anatomy" title="Liga Portugal" serial="J8" aside={pt ? <>previsão de <b className="font-semibold text-ink">11 out. 2026, 00:11</b></> : <>forecast of <b className="font-semibold text-ink">11 Oct 2026, 00:11</b></>} />
                <p className="disp mt-4 text-[30px] leading-[1]">{pt ? 'O Clube A ganha a Liga em metade das épocas simuladas' : 'Club A win the league in half of the simulated seasons'}</p>
                <p className="mt-2 text-[15px] leading-[22px]">{pt ? <>Em <b>24 000</b> de 50 000 épocas simuladas.</> : <>In <b>24,000</b> of 50,000 simulated seasons.</>}</p>
                <div className="mt-4"><IntervalBand lo={72} md={81} hi={90} min={0} max={100} now={24} /></div>
                <p className="mt-3 text-[12.5px] text-graphite"><ReadingRule locale={locale} variant="short" marks={['now', 'band']} /></p>
                <p className="mt-1 text-[12.5px] text-graphite">{pt ? 'Fonte: modelo estimador.pt, 50 000 simulações.' : 'Source: estimador.pt model, 50,000 simulations.'} <span className="ml-1">{ex}</span></p>
              </div>
            </Part>
            <Part title={pt ? 'A aresta da régua' : 'The ruler edge'} note={pt
              ? 'A única decoração: graduações num filete de tinta, alinhadas com a coluna (uma marca fina a cada 8 px, uma mais longa a cada 40 px, uma inteira a tinta a cada 80 px), terminadas sempre numa marca inteira. As marcas apontam para longe do conteúdo, para nunca parecerem a escala de um gráfico: no cabeçalho sobem do filete, só do lado do logótipo, e param antes do menu, longe do sublinhado da secção atual; no rodapé descem do filete de 2 px. Sem números, sem amarelo, escondida em cores forçadas, nunca ao lado de um número.'
              : 'The one decoration: graduations on an ink rule, aligned to the column (a fine tick every 8px, a longer one every 40px, a full ink one every 80px), always ending on a full tick. The ticks point away from the content, so they never read as a chart’s scale: in the header they rise from the rule, on the logo’s side only, and stop before the menu, clear of the current section’s underline; in the footer they hang from the 2px rule. No numbers, no yellow, hidden in forced colours, never beside a figure.'}>
              <div className="grid gap-8 md:grid-cols-2">
                <Specimen name={pt ? 'Cabeçalho' : 'Header'} code={'<RulerEdge direction="up" />'}>
                  <div className="relative flex h-[60px] items-center border-b border-ink">
                    <RulerEdge direction="up" className="absolute bottom-0 left-0" />
                    <LogoHorizontal size={18} />
                  </div>
                </Specimen>
                <Specimen name={pt ? 'Rodapé' : 'Footer'} code={'<RulerEdge direction="down" />'}>
                  <div className="h-[52px]" aria-hidden="true" />
                  <div className="border-t-2 border-ink"><RulerEdge direction="down" /></div>
                </Specimen>
              </div>
            </Part>
          </Chapter>

          {/* §8 Instruments */}
          <Chapter id="instrumentos" n={chapterNumber('instrumentos')} title={chapterTitle('instrumentos', pt)}
            lede={pt
              ? 'As peças de src/components/instrument (todas servem no servidor) e as duas da Liga. Os exemplos usam clubes genéricos e valores ilustrativos.'
              : 'The pieces in src/components/instrument (all server-safe) and the Liga’s two. The examples use generic clubs and illustrative values.'}>
            <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
              <Specimen name="ChannelHead" code={'<ChannelHead title serial aside />'} note={pt ? 'O h2 de um instrumento, com série opcional ("J8", "v1.0.3") e a data da leitura à direita, sobre um filete a tinta.' : 'An instrument’s h2, with an optional serial ("J8", "v1.0.3") and the reading’s date on the right, over an ink rule.'}>
                <ChannelHead id="ds-channel" title={pt ? 'População sintética' : 'Synthetic population'} serial="v1.0.3" aside={pt ? 'datada de 5 de outubro de 2026' : 'dated 5 October 2026'} />
              </Specimen>
              <Specimen name="Register" code={'<Register items />'} note={pt ? 'Os factos de uma leitura como lista definida com filetes, em vez de pílulas ou cadeias com pontos médios.' : 'A reading’s facts as a ruled definition list, instead of pills or middle-dot chains.'} example={ex}>
                <Register title={pt ? 'Ficha desta previsão' : 'This forecast'} items={[
                  { label: pt ? 'Modelo' : 'Model', value: pt ? 'Poisson bivariado com remates à baliza' : 'Bivariate Poisson with shots on target' },
                  { label: pt ? 'Simulações' : 'Simulations', value: pt ? '50 000 épocas' : '50,000 seasons' },
                  { label: pt ? 'Dados até' : 'Data to', value: pt ? '11 out. 2026, 00:11' : '11 Oct 2026, 00:11' },
                ]} />
              </Specimen>
              <Specimen name="Ruler · IntervalBand · PosHist" code={'<Ruler /> <IntervalBand /> <PosHist />'} note={pt ? 'A régua impressa na cabeça da coluna tem o mesmo min e max que as bandas por baixo. PosHist: onde um clube pode acabar, do 1.º ao 18.º.' : 'The ruler in the column head has the same min and max as the bands below. PosHist: where a club can finish, 1st to 18th.'} example={ex}>
                <div tabIndex={0} role="region" aria-label="IntervalBand" className="scroll-cue overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-[14px]">
                    <thead>
                      <tr className="border-b border-ink text-left align-bottom text-[12px] text-graphite">
                        <th scope="col" className="pb-1 pr-3 font-medium">{pt ? 'Clube' : 'Club'}</th>
                        <th scope="col" className="pb-1 pr-3 text-right font-medium">{pt ? 'Título' : 'Title'}</th>
                        <th scope="col" className="w-[44%] pb-1 pr-3 font-medium"><Ruler min={0} max={100} minor={5} major={25} labels={[0, 50, 100]} /></th>
                        <th scope="col" className="pb-1 font-medium">{pt ? 'Posição' : 'Place'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bands.map(b => (
                        <tr key={b.name} className="border-b border-grid">
                          <th scope="row" className="name-cut py-2 pr-3 text-left">{b.name}</th>
                          <td className="py-2 pr-3 text-right"><span className="fig text-[18px]">{formatPercent(b.share, locale)}</span></td>
                          <td className="py-2 pr-3"><IntervalBand lo={b.lo} md={b.md} hi={b.hi} min={0} max={100} now={b.now} /></td>
                          <td className="py-2"><PosHist probs={[...b.hist, ...Array(12).fill(0)]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Specimen>
              <Specimen name="ProbBar" code={'<ProbBar p />'} note={pt ? 'Uma barra a tinta numa régua de 0 a 100, sem trilho cinzento: despromoção, probabilidades isoladas.' : 'An ink bar on a 0–100 ruler, no grey track: relegation, single probabilities.'} example={ex}>
                <ul className="grid gap-2 text-[14px]">
                  {[[clubs[0], 0.53], [clubs[1], 0.36], [clubs[2], 0.08]].map(([name, p]) => (
                    <li key={name as string} className="grid grid-cols-[110px_160px_auto] items-center gap-3"><span className="name-cut">{name}</span><ProbBar p={p as number} width={150} /><span className="fig text-[16px]">{formatPercent(p as number, locale)}</span></li>
                  ))}
                </ul>
              </Specimen>
              <Specimen name="Coupon" code={'<Coupon fixtures locale forecastTimestamp />'} note={pt ? 'Os jogos que faltam: hora de Lisboa, 1X2 em números inteiros com o mais provável a mais peso, e por baixo o que cada jogo põe em jogo do lado do clube que mais mexe.' : 'The games to come: Lisbon time, 1X2 in whole numbers with the likeliest heavier, and under each game what it puts at stake from the side of the club it moves most.'} example={ex}>
                <Coupon fixtures={fixtures} locale={locale} forecastTimestamp="2026-10-10T23:11:00Z" />
              </Specimen>
              <Specimen name="ChartTabs" code={'<ChartTabs chart table />'} note={pt ? '"Gráfico | Tabela" como separadores CSS, sem script. A tabela é uma alternativa completa, não um resumo.' : '"Chart | Table" as CSS tabs, no script. The table is a complete alternative, not a summary.'} example={ex}>
                <ChartTabs
                  id="ds-tabs"
                  locale={locale}
                  title={pt ? 'Despromoção, 17.º ou 18.º' : 'Relegation, 17th or 18th'}
                  chart={<ul className="grid gap-2 py-2 text-[14px]">{[[clubs[0], 0.53], [clubs[1], 0.36]].map(([n, p]) => <li key={n as string} className="grid grid-cols-[110px_160px_auto] items-center gap-3"><span className="name-cut">{n}</span><ProbBar p={p as number} width={150} /><span className="fig text-[16px]">{formatPercent(p as number, locale)}</span></li>)}</ul>}
                  table={<ChartTable caption={pt ? 'Despromoção, exemplo' : 'Relegation, example'} columns={[pt ? 'Clube' : 'Club', pt ? 'Despromoção' : 'Relegation']} rows={[[clubs[0], formatPercent(0.53, locale)], [clubs[1], formatPercent(0.36, locale)]]} align={['left', 'right']} />}
                  note={pt ? 'Fonte: exemplo ilustrativo.' : 'Source: illustrative example.'}
                />
              </Specimen>
            </div>
          </Chapter>

          {/* §9 Components */}
          <Chapter id="componentes" n={chapterNumber('componentes')} title={chapterTitle('componentes', pt)}
            lede={pt
              ? 'Ações, ligações, divulgação, estados vazios e carregamento. Quadrados, a tinta, com 44 a 48 px de altura e o anel de foco global.'
              : 'Actions, links, disclosure, empty states and loading. Square, in ink, 44 to 48px tall, with the global focus ring.'}>
            <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
              <Specimen name="Action" code={'<Action variant="primary | secondary | text" />'} note={pt ? 'Uma ação primária por instrumento. Quadrada, 48 px. A secundária é contornada; a de texto, sublinhada.' : 'One primary action per instrument. Square, 48px. The secondary is outlined; the text one is underlined.'}>
                <div className="flex flex-wrap items-center gap-3">
                  <Action href="/populacao" locale={locale}>{pt ? 'Procurar a freguesia' : 'Find the parish'}</Action>
                  <Action href="/desporto/liga" locale={locale} variant="secondary" arrow>{pt ? 'Ver a Liga' : 'See the Liga'}</Action>
                  <Action href="/metodologia" locale={locale} variant="text" arrow>{pt ? 'Como funciona' : 'How it works'}</Action>
                </div>
              </Specimen>
              <Specimen name="TextLink" code={'<TextLink href />'} note={pt ? 'Ligações isoladas: tinta, sublinhadas em repouso, 44 px de alvo.' : 'Standalone links: ink, underlined at rest, a 44px target.'}>
                <TextLink href="/sobre#reutilizar" locale={locale}>{pt ? 'Reutilizar e citar' : 'Reuse and cite'}</TextLink>
              </Specimen>
              <Specimen name="Disclosure" code={'<Disclosure summary />'} note={pt ? 'Mostrar e esconder: um <details> nativo, resumo de 44 px, chevron à esquerda, etiqueta em minúsculas de frase.' : 'Show and hide: a native <details>, a 44px summary, a left chevron, a sentence-case label.'}>
                <Disclosure summary={pt ? 'Como se calcula a margem' : 'How the margin is computed'}>
                  <p className="text-[14px] leading-[21px]">{pt ? 'A margem é o intervalo central de 90% das épocas simuladas: 5% das épocas acabam abaixo dela e 5% acima.' : 'The margin is the central 90% interval of the simulated seasons: 5% of seasons end below it and 5% above.'}</p>
                </Disclosure>
              </Specimen>
              <Specimen name="PageHero" code={'<PageHero back eyebrow title lede meta />'} note={pt ? 'Toda a página abre com ele: nome da secção, título, entrada e linha de meta (RevisedDate, versão). A ligação de volta é uma seta e o nome do pai ("← Liga Portugal"), nunca "Voltar à…". Sem ícone, campo ou pintura.' : 'Every page opens with it: section name, title, lede and meta line (RevisedDate, version). The back link is an arrow and the parent’s name ("← Liga Portugal"), never "Back to…". No icon, field or painting.'}>
                <p className="text-[13px] text-graphite"><RevisedDate date={REVISED} locale={locale} /></p>
              </Specimen>
              <Specimen name="EmptyStateMark" code={'<EmptyStateMark size="sm | lg" />'} note={pt ? 'Um instrumento sem leitura: a régua está lá, a banda é só um contorno tracejado. Em todo o estado vazio, recusado ou de erro, e maior no 404. Nunca ao lado de um número.' : 'An instrument with no reading: the ruler is there, the band only a dashed outline. On every empty, refused or error state, and larger on the 404. Never beside a number.'}>
                <div className="flex items-center gap-4">
                  <EmptyStateMark />
                  <p className="text-[14px]">{pt ? 'Ainda não há artigos publicados.' : 'No articles published yet.'}</p>
                </div>
              </Specimen>
              <Specimen name={pt ? 'Campo de procura' : 'Search field'} code="input · 48px · label" note={pt ? 'Etiqueta visível por cima, campo quadrado com filete, 48 px, 16 px de letra no telemóvel.' : 'A visible label above, a square ruled field, 48px, 16px type on phones.'}>
                <label className="block max-w-[420px]">
                  <span className="mb-1.5 block text-[13px] font-semibold">{pt ? 'Procura a tua freguesia' : 'Find your parish'}</span>
                  <input type="search" placeholder={pt ? 'Freguesia ou concelho' : 'Parish or municipality'} className="h-12 w-full border border-rule bg-paper px-3 text-[16px] placeholder:text-graphite sm:text-[15px]" />
                </label>
              </Specimen>
            </div>
          </Chapter>

          {/* §10 Charts and tables */}
          <Chapter id="graficos" n={chapterNumber('graficos')} title={chapterTitle('graficos', pt)}
            lede={pt
              ? 'Um gráfico sem título, fonte e tabela gémea não está acabado. Os gráficos usam as mesmas marcas que o resto do site e o mesmo tipo, em grafite.'
              : 'A chart without a title, a source and a table twin is not finished. Charts use the same marks as the rest of the site and the same type, in graphite.'}>
            <Rules items={pt ? [
              'Moldura: título, frase de fonte (fonte, data, ligação ao método) e tabela gémea (ChartTable ou ChartTabs). Uma previsão arquivada nomeia a sua corrida ("Fonte: modelo estimador.pt, 9 000 simulações · Previsão de 16 de maio de 2025").',
              'Todo o Observable Plot passa por quietPlot() antes de entrar na página; o título e a tabela são a versão acessível. Texto de gráfico em FURNITURE.font, cor FURNITURE.axis.',
              'A tabela gémea é completa: todos os pontos à resolução do gráfico, bandas e quantis em colunas próprias. Nas probabilidades da Liga, jornadas da mais recente para a mais antiga.',
              'Tabelas largas no telemóvel: primeira coluna e cabeçalho fixos com a sombra .scroll-cue; outras áreas de deslocação com tabIndex 0, role region e aria-label. Números à direita, palavras à esquerda.',
              'Sem bandas de probabilidade nos gráficos de título e despromoção da Liga. Os intervalos de 90% dos pontos finais ficam.',
              'Nada num SVG abaixo de 11 px. As séries genéricas seguem a ordem de SERIES; clubes e partidos os seus mapas.',
            ] : [
              'Frame: a title, a source sentence (source, date, method link) and a table twin (ChartTable or ChartTabs). An archived forecast names its run ("Source: estimador.pt model, 9,000 simulations · Forecast of 16 May 2025").',
              'Every Observable Plot output goes through quietPlot() before it is inserted; the title and the table are the accessible version. Chart text in FURNITURE.font, colour FURNITURE.axis.',
              'The table twin is complete: every point at the chart’s resolution, bands and quantiles in their own columns. Liga probabilities list matchdays newest first.',
              'Wide tables on phones: first column and header sticky with the .scroll-cue shadow; other scroll areas get tabIndex 0, role region and an aria-label. Figures right-aligned, words left.',
              'No probability bands on the Liga title and relegation charts. The 90% final-points ranges stay.',
              'Nothing in an SVG below 11px. Generic series follow SERIES’ order; clubs and parties their own maps.',
            ]} />
          </Chapter>

          {/* §11 Writing */}
          <Chapter id="escrita" n={chapterNumber('escrita')} title={chapterTitle('escrita', pt)}
            lede={pt
              ? 'Uma linha, um descritor e uma biografia, escritos uma vez em src/lib/brand/descriptor.json e lidos por todas as superfícies. Depois, a voz: frases curtas, conclusões, incerteza desenhada e datada.'
              : 'One line, one descriptor and one bio, written once in src/lib/brand/descriptor.json and read by every surface. Then the voice: short sentences, findings, uncertainty drawn and dated.'}>
            <Register items={[
              { label: pt ? 'Linha' : 'Line', value: BRAND_LINE[lang] },
              { label: pt ? 'Descritor' : 'Descriptor', value: <span className="font-normal">{BRAND_DESCRIPTOR[lang]}</span> },
              { label: pt ? 'Biografia' : 'Bio', value: <span className="font-normal">{BRAND_BIO[lang]}</span> },
            ]} className="max-w-[860px]" />
            <Part title={pt ? 'Voz' : 'Voice'}>
              <DoDont pt={pt} rows={pt ? [
                ['O Porto ganha a Liga em metade das épocas simuladas', 'Quem vai ganhar a Liga?', 'Um título diz o resultado; a pergunta fica para quando se pergunta ao leitor.'],
                ['82 pontos, 72–91 (90%)', 'Cerca de 80 pontos, com alguma incerteza', 'A incerteza desenha-se e imprime-se; não se declara.'],
                ['11 out. 2026, 00:11', 'Hoje à noite', 'Uma página estática não sabe que dia é.'],
                ['Procura a tua freguesia', 'Procure a sua freguesia', 'Tratamos o leitor por tu.'],
                ['Publicamos os ficheiros', 'O produtor empacota o bundle', 'Quem publica é o estimador.pt: "nós". Sem jargão de produção.'],
                ['Liga Portugal', 'Desporto, campeonato português', 'Um só nome para a secção, nas duas línguas.'],
                ['Dados para compreender Portugal.', 'Dados incríveis para compreender Portugal!', 'Sem adjetivos de venda, pontos de exclamação nem emoji.'],
              ] : [
                ['Porto win the league in half of the simulated seasons', 'Who will win the league?', 'A headline states the result; questions are for when the reader is asked something.'],
                ['82 points, 72–91 (90%)', 'Around 80 points, with some uncertainty', 'Uncertainty is drawn and printed, not declared.'],
                ['11 Oct 2026, 00:11', 'Tonight', 'A static page does not know what day it is.'],
                ['Favourite, colour, matchday', 'Favorite, color, game week', 'English is en-GB.'],
                ['We publish the files', 'The producer packages the bundle', 'The publisher is estimador.pt: "we". No production jargon.'],
                ['Liga Portugal', 'The Liga, Portuguese league', 'One name for the section; "the Liga" reads as Spain’s.'],
                ['Data to understand Portugal.', 'Amazing data to understand Portugal!', 'No sales adjectives, exclamation marks or emoji.'],
              ]} />
            </Part>
            <Part title={pt ? 'Mais regras' : 'More rules'}>
              <Rules items={pt ? [
                'Minúsculas de frase em títulos, etiquetas e botões.',
                'Português de Portugal; os termos que os leitores dizem em inglês ficam em inglês: download, link, checksums, online, email, feed, app.',
                'Clubes sempre com artigo em português: "o Porto", "do Benfica", "no Casa Pia" (teamWithArticle).',
                'O que está em jogo diz-se do lado do clube: "Título do Porto: 55% se ganhar, 43% se empatar, 39% se perder"; abaixo de 5 pp, "Pouco em jogo".',
                'Títulos de página por siteTitle(), com o sufixo " | estimador.pt" uma só vez.',
              ] : [
                'Sentence case in headlines, labels and buttons.',
                'Portuguese is PT-PT; the terms readers say in English stay in English: download, link, checksums, online, email, feed, app.',
                'Stakes are stated from the club’s side: "Porto’s title chance: 55% with a win, 43% with a draw, 39% with a defeat"; under 5 pp, "Little at stake".',
                'Page titles through siteTitle(), with the " | estimador.pt" suffix once.',
              ]} />
            </Part>
          </Chapter>

          {/* §12 Sharing and social */}
          <Chapter id="partilha" n={chapterNumber('partilha')} title={chapterTitle('partilha', pt)}
            lede={pt
              ? 'Um cartão de partilha é a página que liga, lida de relance: a assinatura, a cabeça do instrumento com a data, a conclusão, as figuras com as suas marcas e a legenda. Gerados por npm run og a partir dos dados publicados; o kit social por npm run brand. Nunca com o nome de alguém.'
              : 'A share card is the page it links to, read at a glance: the signature, the instrument head with its date, the finding, the figures with their marks and the key. Generated by npm run og from the published data; the social kit by npm run brand. Never with anyone’s name.'}>
            {cards.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {cards.map(card => (
                  <figure key={card.file} className="border-t border-rule pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a static export with unoptimized images */}
                    <img src={`/${card.file}`} alt={card.alt} width={1200} height={630} loading="lazy" className="h-auto w-full border border-rule" />
                    <figcaption className="mt-2 font-mono text-[12px] text-graphite">{card.route} · {card.file}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <Part title={pt ? 'Kit social' : 'Social kit'}>
              <ul className="grid gap-x-8 border-t border-ink sm:grid-cols-2">
                {KIT.map(([file, size, label]) => (
                  <li key={file} className="flex items-center justify-between gap-3 border-b border-grid py-2 text-[14px]">
                    <a href={`/${file}`} download className="min-h-11 content-center">{tr(pt, label)}</a>
                    <span className="text-[12px] text-graphite tnum">{size}</span>
                  </li>
                ))}
              </ul>
            </Part>
          </Chapter>

          {/* §13 Accessibility */}
          <Chapter id="acessibilidade" n={chapterNumber('acessibilidade')} title={chapterTitle('acessibilidade', pt)}>
            <Rules items={pt ? [
              'Texto em AA pelo menos: tinta 18,9:1, grafite 6,4:1; stone-400 e acima leem-se como texto. --color-scale nunca é texto.',
              'O significado nunca depende só da cor: a banda tem tampas, mediana e intervalo impresso; os estados têm ícone e palavra; as cores de clube vão em quadrados e barras, nunca em texto.',
              'Cores forçadas: bandas, marcas e o estado vazio em CanvasText; o estado premido dos botões de alternar com contorno (PRESSED_IN_FORCED_COLORS).',
              'Um só elemento main por página (id main-content, tabIndex −1), aberto antes do PageHero; a ligação "saltar para o conteúdo" aponta para ele.',
              'Foco: o anel global de globals.css em todos os elementos; nada o retira.',
              'Movimento: transições de 140 a 300 ms; nenhuma animação com prefers-reduced-motion.',
              'Cada gráfico tem uma tabela gémea completa e um título; o Plot é silenciado para leitores de ecrã (quietPlot).',
            ] : [
              'Text at least AA: ink 18.9:1, graphite 6.4:1; stone-400 and up read as text. --color-scale is never text.',
              'Meaning never depends on colour alone: the band has caps, a median and a printed range; statuses have an icon and a word; club colours go on squares and bars, never on text.',
              'Forced colours: bands, marks and the empty state in CanvasText; the pressed state of toggles as an outline (PRESSED_IN_FORCED_COLORS).',
              'One main element per page (id main-content, tabIndex −1), opened before the PageHero; the skip link targets it.',
              'Focus: the global ring from globals.css on every element; nothing removes it.',
              'Motion: transitions of 140 to 300ms; no animation under prefers-reduced-motion.',
              'Every chart has a complete table twin and a title; Plot is silenced for screen readers (quietPlot).',
            ]} />
          </Chapter>

          {/* §14 Files */}
          <Chapter id="ficheiros" n={chapterNumber('ficheiros')} title={chapterTitle('ficheiros', pt)}
            lede={pt
              ? 'A assinatura e o símbolo, prontos a usar. A marca estimador.pt fica fora da licença CC BY-NC dos dados: pode ser usada para referir o site, não como marca de outra coisa.'
              : 'The signature and the mark, ready to use. The estimador.pt brand stays outside the data’s CC BY-NC licence: it may be used to refer to the site, not as the mark of something else.'}>
            <ul className="grid gap-x-8 border-t border-ink sm:grid-cols-2">
              {LOGO_FILES.map(([file, label]) => (
                <li key={file} className="flex items-center justify-between gap-3 border-b border-grid py-2 text-[14px]">
                  <a href={`/${file}`} download className="min-h-11 content-center">{tr(pt, label)}</a>
                  <span className="font-mono text-[12px] text-graphite">{file.split('/').pop()}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-graphite">
              <span className="inline-flex items-center gap-2"><NowGlyph />{pt ? 'o que já aconteceu' : 'what has already happened'}</span>
              <span className="inline-flex items-center gap-2"><BandGlyph />{pt ? 'a margem do modelo' : 'the model’s margin'}</span>
              <span className="inline-flex items-center gap-2"><TickGlyph />{pt ? 'uma corrida, sem margem' : 'one run, no margin'}</span>
            </p>
          </Chapter>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
