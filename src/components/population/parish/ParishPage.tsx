'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { siteTitle } from '@/lib/site-title';
import { ChevronDown, MapPinned } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { Mosaic } from '@/components/brand/Mosaic';
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
import { HONESTY, RECIPE_COPY, tierMeaningFor, type Locale } from '@/lib/population/labels';
import { breadcrumbJsonLd, jsonLd } from '@/lib/structured-data';
import { indexPlaces, NEARBY_KEY, normaliseParishCode, regionSlug, regionTitle, type Parish, type PlaceIndex } from '@/lib/population/places';
import { parishQuestion, shareCardModel } from '@/lib/population/share-card';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';
import { formatDay } from '../quality/copy';
import { GuessFirstCard } from './GuessFirst';
import { howToReadItems, type HowToReadInput } from './how-to-read';
import { parishHead, parishUrl, unknownHead, watchHead } from './head';
import { HundredSection } from './HundredSection';
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
      const question = parishQuestion(place.name, locale);
      return watchHead(parishHead({
        locale,
        code,
        title: siteTitle(`${question} · ${locale === 'pt' ? 'População sintética' : 'Synthetic population'}`),
        description: locale === 'pt'
          ? `Idades, trabalho, escolaridade e agregados em ${place.name} (${place.municipalityName}), numa população sintética gerada a partir dos Censos 2021. ${formatCount(place.censusPopulation, locale)} residentes (INE).${place.level === 'municipality' ? ' Valores do concelho.' : ''}`
          : `Ages, work, education and households in ${place.name} (${place.municipalityName}), from a synthetic population generated from the 2021 Census. ${formatCount(place.censusPopulation, locale)} residents (INE).${place.level === 'municipality' ? ' Municipality figures.' : ''}`,
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
            <Mosaic variant="corner" className="h-16 w-16 shrink-0" />
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
            <div className="h-[64px] rounded-2xl border border-line bg-cream lg:h-[300px]" />
            <div className={`h-9 w-3/4 ${bar}`} />
            <div className="h-[720px] rounded-2xl border border-line bg-cream sm:h-[520px]" />
            <div className="h-[640px] rounded-2xl border border-line bg-cream" />
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
  const regionHeading = regionTitle(place.region, place.regionName, locale);
  const fallbackName = record.fallback?.name ?? null;
  const municipalityFigures = place.level === 'municipality' || record.status === 'fallback';
  const parishScope: Scope = { name: place.name, municipality: false };
  const subject = scopeSubject(parishScope, locale);
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  // A union's name already fills the h1 and the hero; below them the page says "esta freguesia".
  const long = isLongName(place.name);
  const regionInline = pt && place.region !== 'azores' && place.region !== 'madeira'
    ? regionHeading.charAt(0).toLowerCase() + regionHeading.slice(1)
    : regionHeading;
  const url = parishUrl(locale, code);

  // Every parish (for the neighbours list) only once the page is drawn.
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      fetchPlaces().then(data => { if (live) setIndex(indexPlaces(data)); }).catch(() => undefined);
    }, 300);
    return () => { live = false; window.clearTimeout(timer); };
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

  const neighbours = useMemo(
    () => (index
      ? index.parishes.filter(other => other.municipality === place.municipality && other.code !== place.code).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      : null),
    [index, place],
  );
  const shareModel = useMemo(() => shareCardModel({
    record, recipes: meta.recipes, name: place.name, municipalityName: place.municipalityName, regionName: place.regionName, locale, url,
  }), [record, meta, place, locale, url]);

  const regionHref = POPULATION_ROUTES.region(regionSlug(place.regionName));
  const order = meta.recipe_order;
  const groups = GROUPS.map(group => ({ ...group, recipes: order.filter(recipe => group.recipes.includes(recipe)) }));

  const tierMeaning = tierMeaningFor(place.tier, place.publicationPopulation)[locale];
  const publication = municipalityFigures
    ? (pt
      ? `Os números desta página são valores do concelho de ${fallbackName ?? place.municipalityName}, que inclui esta freguesia: os da própria freguesia não atingem a qualidade necessária para publicar.`
      : `The figures on this page are those of ${fallbackName ?? place.municipalityName} municipality, which includes this parish: the parish's own figures do not reach the quality needed to publish.`)
    : (pt ? 'Todas as respostas desta página usam os números da própria freguesia.' : 'Every answer on this page uses the parish’s own figures.');

  const toc = [
    { href: '#cem', label: pt ? 'Se fosse 100' : 'If it were 100' },
    ...groups.flatMap(group => [
      { href: `#${group.id}`, label: group.title[locale], group: true },
      ...group.recipes.map(recipe => ({ href: `#${RECIPE_COPY[recipe].anchor}`, label: RECIPE_COPY[recipe].short[locale] })),
    ]),
    { href: '#partilhar', label: pt ? 'Partilhar' : 'Share' },
    { href: '#citar', label: pt ? 'Como citar' : 'How to cite' },
    { href: '#outras', label: pt ? 'Outras freguesias' : 'Other parishes' },
  ] as Array<{ href: string; label: string; group?: boolean }>;

  const renderToc = (className = '') => (
    <ol className={`flex flex-col text-sm ${className}`}>
      {toc.map(item => (
        <li key={item.href}>
          <a
            href={item.href}
            className={`flex min-h-9 items-center rounded-md px-2 transition-colors duration-150 hover:bg-parchment hover:text-ink ${item.group ? 'mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500' : 'text-stone-600'}`}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  const where = (scope: Scope) => (long && !scope.municipality ? THIS_PARISH.in[locale] : inScope(scope, locale));
  const citation = parishCitation({ name: place.name, code, url });
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
            <QualityBadge kind={place.tier} locale={locale} title={tierMeaning} />
            {municipalityFigures && (
              <QualityBadge
                kind="municipality"
                locale={locale}
                label={pt ? `Valores do concelho de ${fallbackName ?? place.municipalityName}` : `${fallbackName ?? place.municipalityName} municipality figures`}
              />
            )}
            <span className="font-mono text-[13px] text-stone-600">{pt ? 'Código' : 'Code'} {code}</span>
            <span className="basis-full text-[13px] text-stone-600 sm:basis-auto">{publication}</span>
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
            <div className="sticky top-24">
              <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{pt ? 'Nesta página' : 'On this page'}</p>
              {renderToc()}
            </div>
          </nav>

          <div className="flex min-w-0 flex-col gap-12">
            <details className="rounded-2xl border border-line bg-cream lg:hidden">
              <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-semibold text-ink">
                {pt ? 'Nesta página: oito perguntas' : 'On this page: eight questions'}
              </summary>
              {renderToc('px-2 pb-3')}
            </details>

            <HowToRead
              place={{ tier: place.tier, municipalityName: place.municipalityName, publicationPopulation: place.publicationPopulation }}
              record={record}
              meta={meta}
              locale={locale}
              fallbackName={fallbackName}
              municipalityFigures={municipalityFigures}
              union={isUnion(place.name)}
            />

            <HundredSection record={record} meta={meta} locale={locale} name={place.name} fallbackName={fallbackName ?? place.municipalityName} />

            {groups.map(group => (
              <section key={group.id} aria-labelledby={group.id} className="flex flex-col gap-5">
                <h2 id={group.id} className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
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
                      // The work grid is drawn once, in "Se fosse 100" above.
                      bars={recipe === 'employment'}
                      highlight={highlight === anchor}
                    />
                  );
                })}
              </section>
            ))}

            <section id="partilhar" aria-labelledby="partilhar-title">
              <h2 id="partilhar-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? `Queres mostrar ${long ? THIS_PARISH.subject.pt : 'esta freguesia'} a alguém?` : 'Want to show this parish to someone?'}
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <ShareTools model={shareModel} url={url} title={parishQuestion(place.name, locale)} locale={locale} />
              </div>
            </section>

            <section id="citar" aria-labelledby="citar-title">
              <h2 id="citar-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? 'Como cito esta página?' : 'How do I cite this page?'}
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
                  <dt className="font-bold text-ink">{pt ? 'Freguesia' : 'Parish'}</dt>
                  <dd className="text-stone-700">{place.name} <span className="font-mono text-[13px]">({code})</span>, CAOP 2021</dd>
                  <dt className="font-bold text-ink">{pt ? 'Versão' : 'Release'}</dt>
                  <dd className="text-stone-700">
                    {pt
                      ? `População sintética v${POPULATION_RELEASE}, publicada a ${formatDay(POPULATION_PUBLISHED, locale)}`
                      : `Synthetic population v${POPULATION_RELEASE}, published ${formatDay(POPULATION_PUBLISHED, locale)}`}
                  </dd>
                  <dt className="font-bold text-ink">{pt ? 'Licença' : 'Licence'}</dt>
                  <dd className="text-stone-700">
                    <a href={pt ? 'https://creativecommons.org/licenses/by/4.0/deed.pt' : 'https://creativecommons.org/licenses/by/4.0/'} className="font-semibold text-ink underline underline-offset-4">CC BY 4.0</a>
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
                    ? 'Cada resposta tem também a sua ligação permanente, com a versão: «Copiar ligação», no fundo de cada cartão.'
                    : 'Each answer also has its own permanent link, with the release: “Copy link”, at the foot of each card.'}
                </p>
              </div>
            </section>

            <section id="outras" aria-labelledby="outras-title">
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
                  {pt ? `Freguesias: ${regionHeading.charAt(0).toLowerCase()}${regionHeading.slice(1)}` : `Parishes: ${regionHeading}`}
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
 * "Como ler esta página", as a disclosure: open on a wide screen, where it
 * sits beside the contents list, and closed on a phone, so the first answer
 * is not a screen and a half down (the hero already carries the honesty line).
 */
function HowToRead(props: HowToReadInput & { union: boolean }) {
  const { locale, union } = props;
  const pt = locale === 'pt';
  const items = howToReadItems(props);
  // Decided on the first render (this page only renders in the browser), so the
  // layout does not move under a shared link's scroll to its card.
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  return (
    <details
      open={open}
      onToggle={event => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="group rounded-2xl border border-line bg-cream"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <h2 id="ler-title" className="text-lg font-bold tracking-[-0.02em] text-ink">{pt ? 'Como ler esta página' : 'How to read this page'}</h2>
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
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
