'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { lisbonDate } from '@/lib/population/game';
import { siteTitle } from '@/lib/site-title';
import { ChevronDown, MapPinned } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { Disclosure } from '@/components/viz/Disclosure';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { ParishLink } from '@/components/population/ParishLink';
import { ParishSearch } from '@/components/population/ParishSearch';
import { QualityBadge } from '@/components/population/QualityBadge';
import { ResponseCard } from '@/components/population/ResponseCard';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { CopyButton } from '@/components/population/data/CopyButton';
import { POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { fetchMeta, fetchParish, fetchPlaces } from '@/lib/population/client';
import { parishCitation, SHORT_ATTRIBUTION } from '@/lib/population/cite';
import { formatCount } from '@/lib/population/format';
import { GUESS_RECIPES } from '@/lib/population/guess';
import { HONESTY, RECIPE_COPY, tierMeaningFor, type Locale, type WorstTable } from '@/lib/population/labels';
import { breadcrumbJsonLd, jsonLd } from '@/lib/structured-data';
import { indexPlaces, NEARBY_KEY, normaliseParishCode, regionSlug, regionTitle, type Parish, type PlaceIndex } from '@/lib/population/places';
import { parishQuestion, shareCardModel } from '@/lib/population/share-card';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';
import { formatDay } from '../quality/copy';
import { GuessFirstCard } from './GuessFirst';
import { howToReadItems, type HowToReadInput } from './how-to-read';
import { parishHead, parishUrl, unknownHead, watchHead } from './head';
import { parishDescription, parishTitle } from './head-text';
import { inScope, isLongName, isUnion, municipalityPhrase, scopeSubject, THIS_PARISH, type Scope } from './place-words';
import { ShareTools } from './ShareTools';

/** What the page needs to know about the place: from the parish file's `place` (v1.0.3 on), else places.json. */
interface PagePlace {
  code: string;
  name: string;
  municipality: string;
  municipalityName: string;
  region: string;
  regionName: string;
  tier: 'A' | 'B' | 'C';
  level: 'parish' | 'municipality';
  censusPopulation: number;
  generatedHouseholds: number;
  publicationPopulation: number;
  /** quality.csv's worst table, from the parish file only (places.json does not carry it). */
  worst?: WorstTable | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'unknown'; code: string | null }
  | { kind: 'error'; code: string }
  | { kind: 'ready'; code: string; place: PagePlace; record: ParishRecord; meta: PopulationMeta; target: string | null; nearby: boolean };

/** People questions first, then homes; each group keeps the producer's order. */
const GROUPS: Array<{ id: string; title: Record<Locale, string>; recipes: PortraitRecipe[] }> = [
  { id: 'pessoas', title: { pt: 'Pessoas', en: 'People' }, recipes: ['elders_alone', 'who_lives_alone', 'age', 'employment', 'education'] },
  { id: 'casas', title: { pt: 'Casas e famílias', en: 'Homes and families' }, recipes: ['multigenerational', 'household_size', 'household_type'] },
];

const EYEBROW: Record<Locale, string> = { pt: 'População sintética · Censos 2021', en: 'Synthetic population · 2021 Census' };


/** The code from the address: in production the shell's params say "_", so the URL is the only source. */
function codeFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const at = parts.indexOf('freguesia');
  try {
    return at >= 0 ? normaliseParishCode(decodeURIComponent(parts[at + 1] ?? '')) : null;
  } catch {
    return null;
  }
}

function fromIndex(parish: Parish): PagePlace {
  return { ...parish };
}

function fromRecord(record: ParishRecord): PagePlace | null {
  const place = record.place;
  if (!place) return null;
  return {
    code: record.code,
    name: place.name,
    municipality: place.municipality,
    municipalityName: place.municipality_name,
    region: place.region,
    regionName: place.region_name,
    tier: record.tier,
    level: place.level === 'p' ? 'parish' : 'municipality',
    censusPopulation: place.census_population,
    generatedHouseholds: place.generated_households,
    publicationPopulation: place.publication_population,
    worst: place.worst_constraint && typeof place.worst_constraint_srmse === 'number'
      ? {
        key: place.worst_constraint,
        srmse: place.worst_constraint_srmse,
        median: typeof place.person_srmse_median === 'number' ? place.person_srmse_median : null,
      }
      : null,
  };
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ParishPage({ locale }: { locale: Locale }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async (code: string, target: string | null, nearby: boolean) => {
    setState({ kind: 'loading' });
    // The parish file alone draws the page; places.json (every parish) comes later, for the neighbours.
    const [meta, record] = await Promise.allSettled([fetchMeta(), fetchParish(code)]);
    if (record.status === 'rejected') {
      const missing = String((record.reason as Error)?.message ?? '').startsWith('404');
      setState(missing ? { kind: 'unknown', code } : { kind: 'error', code });
      return;
    }
    if (meta.status === 'rejected') { setState({ kind: 'error', code }); return; }
    let place = fromRecord(record.value);
    if (!place) {
      try {
        const found = indexPlaces(await fetchPlaces()).byCode.get(code);
        place = found ? fromIndex(found) : null;
      } catch {
        place = null;
      }
    }
    if (!place) { setState({ kind: 'error', code }); return; }
    setState({ kind: 'ready', code, place, record: record.value, meta: meta.value, target, nearby });
  }, []);

  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const code = codeFromPath(pathname);
    if (!code) { setState({ kind: 'unknown', code: null }); return; }
    // One address per parish: the upper-case code with the trailing slash (the
    // language switch and shared links build on it). The host serves the
    // slashless and lower-case forms too; the address bar is corrected in place.
    const canonicalPath = pathname.replace(/\/freguesia\/[^/]*\/?$/, `/freguesia/${code}/`);
    if (canonicalPath !== pathname) {
      try { window.history.replaceState(window.history.state, '', `${canonicalPath}${search}${hash}`); } catch { /* the address is a convenience */ }
    }
    let target: string | null = null;
    try { target = hash ? decodeURIComponent(hash.slice(1)) : null; } catch { target = null; }
    let nearby = false;
    try {
      nearby = window.sessionStorage.getItem(NEARBY_KEY) === code;
      window.sessionStorage.removeItem(NEARBY_KEY);
    } catch { /* private mode */ }
    void load(code, target, nearby);
  }, [load]);

  // Head tags follow the state: the parish's own canonical, or noindex for a code that is not a parish.
  useEffect(() => {
    if (state.kind === 'ready') {
      const { place, code } = state;
      return watchHead(parishHead({
        locale,
        code,
        // Within 70 and 155 characters for every parish, union names included (SPV-01).
        title: parishTitle(place.name, locale),
        description: parishDescription({
          name: place.name,
          municipalityName: place.municipalityName,
          censusPopulation: place.censusPopulation,
          municipalityFigures: place.level === 'municipality',
          locale,
        }),
      }), code);
    }
    if (state.kind === 'unknown') {
      return watchHead(unknownHead(siteTitle(locale === 'pt' ? 'Freguesia não encontrada' : 'Parish not found')), state.code);
    }
    return undefined;
  }, [state, locale]);

  if (state.kind === 'ready') return <Ready {...state} locale={locale} />;

  const pt = locale === 'pt';
  if (state.kind === 'unknown') {
    return (
      <main id="main-content" tabIndex={-1}>
        <PageHero
          compact
          field="periwinkle"
          measure="wide"
          eyebrow={EYEBROW[locale]}
          title={pt ? 'Não encontrámos esta freguesia' : 'We could not find this parish'}
          lede={state.code
            ? (pt ? `O código ${state.code} não corresponde a nenhuma freguesia da carta administrativa de 2021. Procura-a pelo nome.` : `The code ${state.code} does not match any parish in the 2021 administrative map. Search for it by name.`)
            : (pt ? 'Este endereço não tem um código de freguesia válido. Procura-a pelo nome.' : 'This address does not carry a valid parish code. Search for it by name.')}
        />
        <PopulationSectionNav current="parish" locale={locale} />
        <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-5xl">
          <div className="flex flex-col gap-6 rounded-2xl border border-line bg-cream p-5 md:flex-row md:items-start md:p-8">
            <EmptyStateMark />
            <div className="min-w-0 flex-1">
              <ParishSearch locale={locale} withLocation />
              <p className="mt-6 text-[15px] text-stone-600">
                {pt ? 'Ou explora as freguesias no mapa.' : 'Or explore the parishes on the map.'}
              </p>
              <Action href={POPULATION_ROUTES.hub} locale={locale} variant="text" arrow>
                {pt ? 'Ver o mapa das freguesias' : 'See the parish map'}
              </Action>
            </div>
          </div>
        </div></div>
      </main>
    );
  }

  if (state.kind === 'error') {
    return (
      <main id="main-content" tabIndex={-1}>
        <PageHero
          compact
          field="periwinkle"
          measure="wide"
          eyebrow={EYEBROW[locale]}
          title={pt ? 'Não foi possível carregar esta freguesia' : 'This parish could not be loaded'}
          lede={pt ? 'Os dados não chegaram. Pode ser a ligação; tenta outra vez.' : 'The data did not arrive. It may be the connection; try again.'}
          actions={<Action onClick={() => void load(state.code, null, false)}>{pt ? 'Tentar de novo' : 'Try again'}</Action>}
        />
        <PopulationSectionNav current="parish" locale={locale} />
        <div className="min-h-[50vh]" />
      </main>
    );
  }

  return <Skeleton locale={locale} />;
}

/**
 * The page before its data: the hero, the section row and the first blocks at
 * their real heights, so nothing below moves when the parish arrives (and the
 * footer does not start in view and then jump down).
 */
function Skeleton({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const bar = 'rounded-md bg-parchment motion-safe:animate-pulse';
  return (
    <main id="main-content" tabIndex={-1} aria-busy="true">
      <PageHero
        compact
        field="periwinkle"
        measure="wide"
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'População sintética' : 'Synthetic population', locale }}
        eyebrow={EYEBROW[locale]}
        title={<span className="sr-only" role="status">{pt ? 'A carregar a freguesia…' : 'Loading the parish…'}</span>}
        lede={
          <span aria-hidden="true" className="block">
            <span className={`block h-9 w-4/5 md:h-11 ${bar}`} />
            <span className={`mt-5 block h-4 w-full ${bar}`} />
            <span className={`mt-2 block h-4 w-11/12 ${bar}`} />
            <span className={`mt-2 block h-4 w-2/3 ${bar}`} />
          </span>
        }
        meta={<span aria-hidden="true" className={`inline-block h-7 w-48 ${bar}`} />}
      />
      <PopulationSectionNav current="parish" locale={locale} />
      <div aria-hidden="true" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8"><div className="max-w-5xl">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          <div className="hidden lg:block"><div className={`h-[520px] ${bar}`} /></div>
          <div className="flex min-w-0 flex-col gap-12">
            <div className={`h-12 lg:hidden ${bar}`} />
            {/* "Como ler" (closed at every width), then "Pessoas" and its first two cards, at their measured heights. */}
            <div className="h-[54px] rounded-2xl border border-line bg-cream" />
            <div className="flex flex-col gap-5">
              <div className={`h-8 w-1/3 md:h-9 ${bar}`} />
              <div className="h-[800px] rounded-2xl border border-line bg-cream sm:h-[600px]" />
              <div className="h-[860px] rounded-2xl border border-line bg-cream sm:h-[470px]" />
            </div>
          </div>
        </div>
      </div></div>
    </main>
  );
}

function Ready({ code, place, record, meta, target, nearby, locale }: Extract<State, { kind: 'ready' }> & { locale: Locale }) {
  const pt = locale === 'pt';
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  /** The rail's current section: the last one whose top has scrolled past the header. */
  const [current, setCurrent] = useState<string | null>(null);
  const regionHeading = regionTitle(place.region, place.regionName, locale);
  const fallbackName = record.fallback?.name ?? null;
  const municipalityFigures = place.level === 'municipality' || record.status === 'fallback';
  const parishScope: Scope = { name: place.name, municipality: false };
  // A union's name already fills the h1; from the lede on, the page says "esta freguesia" (UXM2-17).
  const long = isLongName(place.name);
  const subject = long ? THIS_PARISH.subject[locale] : scopeSubject(parishScope, locale);
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  const regionInline = pt && place.region !== 'azores' && place.region !== 'madeira'
    ? regionHeading.charAt(0).toLowerCase() + regionHeading.slice(1)
    : regionHeading;
  const url = parishUrl(locale, code);

  // Every parish (87 KB, for the neighbours list) only when that list comes near
  // the screen, not with the page (UXM2-21).
  useEffect(() => {
    let live = true;
    const target = document.getElementById('outras');
    const load = () => { fetchPlaces().then(data => { if (live) setIndex(indexPlaces(data)); }).catch(() => undefined); };
    if (!target || typeof IntersectionObserver === 'undefined') { load(); return () => { live = false; }; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
    }, { rootMargin: '800px 0px' });
    observer.observe(target);
    return () => { live = false; observer.disconnect(); };
  }, []);

  // A shared link to one answer (#vivem-sozinhas, from /populacao/v/…/q/…):
  // the page drew after the browser looked for the anchor, so bring the card
  // into view, put focus on its heading and mark it for a moment.
  useEffect(() => {
    if (!target) return;
    let timer = 0;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(target);
      if (!element) return;
      element.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      const heading = element.matches('h2, h3') ? element : element.querySelector<HTMLElement>('h2, h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        (heading as HTMLElement).focus({ preventScroll: true });
      }
      setHighlight(target);
      timer = window.setTimeout(() => setHighlight(null), 2600);
    });
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [target]);

  // Which section is in view, for the rail's marker (aria-current).
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>('[data-rail]')];
    if (targets.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let found: string | null = null;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= 140) found = `#${target.id}`;
      }
      setCurrent(found);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const neighbours = useMemo(
    () => (index
      ? index.parishes.filter(other => other.municipality === place.municipality && other.code !== place.code).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      : null),
    [index, place],
  );
  const shareModel = useMemo(() => shareCardModel({
    record, recipes: meta.recipes, name: place.name, municipalityName: place.municipalityName, regionName: place.regionName, region: place.region, locale, url,
    censusPopulation: place.censusPopulation, publicationPopulation: place.publicationPopulation,
  }), [record, meta, place, locale, url]);

  const regionHref = POPULATION_ROUTES.region(regionSlug(place.regionName));
  const order = meta.recipe_order;
  const groups = GROUPS.map(group => ({ ...group, recipes: order.filter(recipe => group.recipes.includes(recipe)) }));

  // INE's count and the worst table too: the page then never says "500 residentes" and "menos de 500" at once (160707), and a tier C parish of 500 or more names what set its tier (MR2-03).
  const tierMeaning = tierMeaningFor(place.tier, place.publicationPopulation, place.censusPopulation, place.worst)[locale];
  const publication = municipalityFigures
    ? (pt
      ? `Os números desta página são valores do concelho de ${fallbackName ?? place.municipalityName}, que inclui esta freguesia: os da própria freguesia não atingem a qualidade necessária para publicar.`
      : `The figures on this page are those of ${fallbackName ?? place.municipalityName} municipality, which includes this parish: the parish's own figures do not reach the quality needed to publish.`)
    : (pt ? 'Todas as respostas desta página usam os números da própria freguesia.' : 'Every answer on this page uses the parish’s own figures.');

  // The rail names each card by its own title (the question), so the two read the same (UXD2-11).
  const toc = [
    ...groups.flatMap(group => [
      { href: `#${group.id}`, label: group.title[locale], group: true },
      ...group.recipes.map(recipe => ({ href: `#${RECIPE_COPY[recipe].anchor}`, label: RECIPE_COPY[recipe].question[locale] })),
    ]),
    { href: '#partilhar', label: pt ? 'Partilhar' : 'Share', after: true },
    { href: '#citar', label: pt ? 'Como citar' : 'How to cite' },
    { href: '#outras', label: pt ? 'Outras freguesias' : 'Other parishes' },
  ] as Array<{ href: string; label: string; group?: boolean; after?: boolean }>;

  // 44px rows on phones and on any touch screen (UXM2-09); the desktop rail, under a mouse, keeps 36px so it stays short.
  const renderToc = (className = '', marker = false) => (
    <ol className={`flex flex-col text-sm ${className}`}>
      {toc.map(item => {
        const here = marker && current === item.href;
        return (
          <li key={item.href} className={item.after ? 'mt-5' : ''}>
            <a
              href={item.href}
              aria-current={here ? 'location' : undefined}
              className={`flex min-h-11 items-center rounded-md border-l-2 px-2 py-1.5 leading-snug lg:pointer-fine:min-h-9 transition-colors duration-150 hover:bg-parchment hover:text-ink ${here ? 'border-ink font-semibold text-ink' : 'border-transparent'} ${item.group ? 'mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500' : here ? '' : 'text-stone-600'}`}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ol>
  );

  const where = (scope: Scope) => (long && !scope.municipality ? THIS_PARISH.in[locale] : inScope(scope, locale));
  // Under 500 residents (the count the tier uses), said once, under the tier: a card's
  // percentages are of its own group (people aged 65+, those who live alone), not of the
  // parish's residents, and no release publishes that group's size (POP3-ACC-02, PRO3-01).
  const small = place.publicationPopulation < 500;
  const subsetNote = small
    ? (pt
      ? 'Cada pergunta conta só o seu grupo (por exemplo, quem vive sozinho), que pode ser de poucas pessoas: uma percentagem pode assentar em uma ou duas.'
      : 'Each question counts only its own group (for example, those who live alone), which can be a handful of people: a percentage can rest on one or two.')
    : null;
  // Every card names its place, so a shared link or a screenshot of one card still says
  // where the figures are from (PRO3-V01); a small parish adds INE's count of residents.
  const placeLine = [
    `${place.name} (${code})`,
    municipalityPhrase(place.municipalityName, locale),
    small ? (pt ? `${formatCount(place.censusPopulation, locale)} residentes (INE)` : `${formatCount(place.censusPopulation, locale)} residents (INE)`) : null,
  ].filter(Boolean).join(' · ');
  // The page shows the current release, so a citation says when it was read (PRO2-10).
  const citation = parishCitation({ name: place.name, code, url, accessed: formatDay(lisbonDate(new Date()), locale), locale });
  // Population › region › parish (SP-10). The shell is one page for every
  // parish, so the breadcrumb is rendered here, once the place is known.
  const breadcrumbs = jsonLd(breadcrumbJsonLd(locale, [
    { name: pt ? 'População' : 'Population', path: POPULATION_ROUTES.hub },
    { name: place.regionName, path: regionHref },
    { name: place.name },
  ]));

  return (
    <main id="main-content" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <PageHero
        compact
        field="periwinkle"
        measure="wide"
        back={{ href: regionHref, label: regionHeading, locale }}
        eyebrow={EYEBROW[locale]}
        title={parishQuestion(place.name, locale)}
        lede={
          <>
            {pt
              ? `${Subject} fica no ${municipalityPhrase(place.municipalityName, locale)} (${regionInline}). Os Censos 2021 contaram ${formatCount(place.censusPopulation, locale)} residentes (INE). A população gerada tem ${formatCount(place.generatedHouseholds, locale)} agregados, contando cada alojamento coletivo como um.`
              : `${Subject} is in ${place.municipalityName} municipality (${regionInline}). The 2021 Census counted ${formatCount(place.censusPopulation, locale)} residents (INE). The generated population has ${formatCount(place.generatedHouseholds, locale)} households, counting each collective living quarter as one.`}
            {' '}
            <strong className="font-semibold text-ink">{HONESTY.synthetic[locale]}</strong>
          </>
        }
        meta={
          <>
            <QualityBadge kind={place.tier} locale={locale} />
            {municipalityFigures && (
              <QualityBadge
                kind="municipality"
                locale={locale}
                label={pt ? `Valores do concelho de ${fallbackName ?? place.municipalityName}` : `${fallbackName ?? place.municipalityName} municipality figures`}
              />
            )}
            <span className="font-mono text-[13px] text-stone-600">{pt ? 'Código' : 'Code'} {code}</span>
            <span className="basis-full text-[13px] text-stone-600 sm:basis-auto">{publication}</span>
            {/* What the tier means for this parish, on screen rather than in a tooltip (CL3-05). */}
            <span className="basis-full max-w-3xl text-[13px] leading-relaxed text-stone-600">
              {tierMeaning}{subsetNote && ` ${subsetNote}`}
            </span>
            {nearby && (
              <span className="basis-full text-[13px] font-semibold text-ink">
                {pt ? 'Freguesia mais próxima da tua localização (calculada no teu dispositivo).' : 'The parish nearest your location (worked out on your device).'}
              </span>
            )}
          </>
        }
      />
      <PopulationSectionNav current="parish" locale={locale} />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8"><div className="max-w-5xl">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          <nav aria-label={pt ? 'Nesta página' : 'On this page'} className="hidden lg:block">
            {/* Pulled left by the links' rule and padding, so the rail's text lines up with the hero's (UXD2-14). */}
            <div className="sticky top-24 -ml-2.5">
              <p className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Nesta página' : 'On this page'}</p>
              {renderToc('', true)}
            </div>
          </nav>

          <div className="flex min-w-0 flex-col gap-12">
            <Disclosure
              className="rounded-2xl border border-line bg-cream lg:hidden"
              summaryClassName="w-full px-4 py-0.5"
              summary={pt ? 'Nesta página: oito perguntas' : 'On this page: eight questions'}
            >
              {renderToc('px-2 pb-3')}
            </Disclosure>

            <HowToRead
              place={{ tier: place.tier, municipalityName: place.municipalityName, publicationPopulation: place.publicationPopulation, censusPopulation: place.censusPopulation, worst: place.worst }}
              record={record}
              meta={meta}
              locale={locale}
              fallbackName={fallbackName}
              municipalityFigures={municipalityFigures}
              union={isUnion(place.name)}
            />

            {groups.map(group => (
              <section key={group.id} aria-labelledby={group.id} className="flex flex-col gap-5">
                <h2 id={group.id} data-rail className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                  {group.title[locale]}
                </h2>
                {group.recipes.map(recipe => {
                  const response = record.responses[recipe];
                  const scope: Scope = response.decision === 'fallback'
                    ? { name: fallbackName ?? place.municipalityName, municipality: true }
                    : parishScope;
                  const anchor = RECIPE_COPY[recipe].anchor;
                  return GUESS_RECIPES.includes(recipe) ? (
                    <GuessFirstCard
                      key={recipe}
                      recipeName={recipe}
                      recipe={meta.recipes[recipe]}
                      record={response}
                      locale={locale}
                      placeName={place.name}
                      fallbackName={fallbackName}
                      where={where(scope)}
                      initiallyRevealed={target === anchor}
                      highlight={highlight === anchor}
                      place={placeLine}
                    />
                  ) : (
                    <ResponseCard
                      key={recipe}
                      recipeName={recipe}
                      recipe={meta.recipes[recipe]}
                      record={response}
                      locale={locale}
                      placeName={place.name}
                      fallbackName={fallbackName}
                      // Employment is drawn as 100 dots here, once (the page has no separate "Se fosse 100" block).
                      highlight={highlight === anchor}
                      place={placeLine}
                    />
                  );
                })}
              </section>
            ))}

            <section id="partilhar" data-rail aria-labelledby="partilhar-title">
              <h2 id="partilhar-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? `Queres mostrar ${long ? THIS_PARISH.subject.pt : 'esta freguesia'} a alguém?` : 'Want to show this parish to someone?'}
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <ShareTools model={shareModel} url={url} title={parishQuestion(place.name, locale)} locale={locale} />
              </div>
            </section>

            <section id="citar" data-rail aria-labelledby="citar-title">
              <h2 id="citar-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? 'Como cito esta página?' : 'How do I cite this page?'}
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
                  <dt className="font-bold text-ink">{pt ? 'Freguesia' : 'Parish'}</dt>
                  <dd className="text-stone-700">{place.name} <span className="font-mono text-[13px]">({code})</span>, CAOP 2021</dd>
                  <dt className="font-bold text-ink">{pt ? 'Versão' : 'Release'}</dt>
                  <dd className="text-stone-700">
                    {/* The release's own date; GitHub's upload day is on /dados (FR3-09). */}
                    {pt
                      ? `População sintética v${POPULATION_RELEASE}, datada de ${formatDay(POPULATION_PUBLISHED, locale)}`
                      : `Synthetic population v${POPULATION_RELEASE}, dated ${formatDay(POPULATION_PUBLISHED, locale)}`}
                  </dd>
                  <dt className="font-bold text-ink">{pt ? 'Licença' : 'Licence'}</dt>
                  <dd className="text-stone-700">
                    <a href={pt ? 'https://creativecommons.org/licenses/by-nc/4.0/deed.pt' : 'https://creativecommons.org/licenses/by-nc/4.0/'} className="tap-target font-semibold text-ink underline underline-offset-4">CC BY-NC 4.0</a>
                    {pt ? ' (população sintética); dados do INE: CC BY 4.0' : ' (synthetic population); INE data: CC BY 4.0'}
                  </dd>
                  <dt className="font-bold text-ink">{pt ? 'Atribuição' : 'Attribution'}</dt>
                  <dd className="text-stone-700">{SHORT_ATTRIBUTION[locale]}</dd>
                </dl>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'Citar como' : 'Cite as'}</p>
                <p className="mt-1 break-words text-[15px] leading-relaxed text-ink">{citation}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <CopyButton text={citation} label={pt ? 'Copiar citação' : 'Copy citation'} locale={locale} />
                  <Link href={`${POPULATION_ROUTES.data}#citar`} locale={locale} className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4">
                    {pt ? 'Atribuição completa e ficheiros' : 'Full attribution and files'}
                  </Link>
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  {pt
                    ? 'Cada resposta tem também o seu link permanente, com a versão: «Copiar link», no fundo de cada cartão.'
                    : 'Each answer also has its own permanent link, with the release: “Copy link”, at the foot of each card.'}
                </p>
              </div>
            </section>

            <section id="outras" data-rail aria-labelledby="outras-title">
              <h2 id="outras-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? `Outras freguesias do ${municipalityPhrase(place.municipalityName, locale)}` : `Other parishes in ${place.municipalityName} municipality`}
              </h2>
              {neighbours === null ? (
                <div aria-hidden="true" className="mt-4 h-24 rounded-xl bg-parchment motion-safe:animate-pulse" />
              ) : neighbours.length > 0 ? (
                <ul className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                  {neighbours.map(other => (
                    <li key={other.code} className="border-b border-line">
                      <ParishLink code={other.code} locale={locale} className="flex min-h-11 items-center py-2 text-[15px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                        {other.name}
                      </ParishLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[15px] text-stone-600">
                  {pt ? `${Subject} é a única freguesia do concelho.` : `${Subject} is the only parish in the municipality.`}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
                <Action href={regionHref} locale={locale} variant="text" arrow>
                  {/* "distrito de Braga" mid-sentence, but "Região Autónoma dos Açores" keeps its capitals (POP3-ACC-V01). */}
                  {pt ? `Freguesias: ${regionInline}` : `Parishes: ${regionHeading}`}
                </Action>
                <Link href={POPULATION_ROUTES.hub} locale={locale} className="inline-flex min-h-12 items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
                  <MapPinned aria-hidden="true" className="h-4 w-4" />
                  {pt ? 'Ver no mapa' : 'See on the map'}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div></div>
    </main>
  );
}

/**
 * "Como ler esta página", as a disclosure, closed at every width: the hero
 * already carries the tier and the honesty line, so the first answer is what
 * follows it (UXD2-25). Its own <details> only because the summary holds the
 * section's h2, which Disclosure's label span cannot; the look is the same
 * (left chevron, 44px row, sentence case, UXD2-26).
 */
function HowToRead(props: HowToReadInput & { union: boolean }) {
  const { locale, union } = props;
  const pt = locale === 'pt';
  const items = howToReadItems(props);
  return (
    <details className="group rounded-2xl border border-line bg-cream">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-1.5 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ink transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
        <h2 id="ler-title" className="text-lg font-bold tracking-[-0.02em] text-ink">{pt ? 'Como ler esta página' : 'How to read this page'}</h2>
      </summary>
      <div className="border-t border-line px-5 pb-5 pt-4">
        <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {items.map(item => (
            <div key={item.term}>
              <dt className="text-sm font-bold text-ink">{item.term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-stone-600">{item.body}</dd>
            </div>
          ))}
          {union && (
            <div>
              <dt className="text-sm font-bold text-ink">{pt ? 'Uma união de freguesias de 2021' : 'A 2021 union of parishes'}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-stone-600">
                {pt
                  ? 'Esta é a freguesia tal como existia nos Censos 2021 (CAOP 2021). A Lei n.º 25-A/2025 desagregou 135 uniões em 302 freguesias, com efeito a partir das eleições autárquicas de outubro de 2025; se esta foi uma delas, os números referem-se à união de 2021.'
                  : 'This is the parish as it stood in the 2021 Census (CAOP 2021). Law 25-A/2025 split 135 unions into 302 parishes, effective from the October 2025 local elections; if this was one of them, the figures refer to the 2021 union.'}
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-4 flex flex-wrap gap-x-6 text-sm">
          <Link href={POPULATION_ROUTES.quality} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">
            {pt ? 'Como medimos a qualidade' : 'How quality is measured'}
          </Link>
          <Link href={`${POPULATION_ROUTES.quality}#glossario`} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">
            {pt ? 'O que quer dizer cada termo' : 'What each term means'}
          </Link>
        </p>
      </div>
    </details>
  );
}
