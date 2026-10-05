'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { siteTitle } from '@/lib/site-title';
import { MapPinned } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageHero } from '@/components/PageHero';
import { Action } from '@/components/brand/Action';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { Mosaic } from '@/components/brand/Mosaic';
import { ParishLink } from '@/components/population/ParishLink';
import { ParishSearch } from '@/components/population/ParishSearch';
import { QualityBadge } from '@/components/population/QualityBadge';
import { ResponseCard } from '@/components/population/ResponseCard';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { BRAND } from '@/lib/brand';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { fetchMeta, fetchParish, fetchPlaces } from '@/lib/population/client';
import { formatCount } from '@/lib/population/format';
import { GUESS_RECIPES } from '@/lib/population/guess';
import { HONESTY, RECIPE_COPY, TIER_COPY, type Locale } from '@/lib/population/labels';
import { indexPlaces, normaliseParishCode, regionSlug, regionTitle, type Parish, type PlaceIndex } from '@/lib/population/places';
import { parishQuestion, shareCardModel } from '@/lib/population/share-card';
import type { ParishRecord, PopulationMeta, PortraitRecipe } from '@/types/population';
import { GuessFirstCard } from './GuessFirst';
import { howToReadItems, type HowToReadInput } from './how-to-read';
import { parishHead, parishUrl, unknownHead, watchHead } from './head';
import { HundredSection } from './HundredSection';
import { inScope, scopeSubject, type Scope } from './place-words';
import { ShareTools } from './ShareTools';

type State =
  | { kind: 'loading' }
  | { kind: 'unknown'; code: string | null }
  | { kind: 'error'; code: string }
  | { kind: 'ready'; code: string; place: Parish; record: ParishRecord; meta: PopulationMeta; index: PlaceIndex };

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
  return at >= 0 ? normaliseParishCode(decodeURIComponent(parts[at + 1] ?? '')) : null;
}

export function ParishPage({ locale }: { locale: Locale }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async (code: string) => {
    setState({ kind: 'loading' });
    const [meta, places, record] = await Promise.allSettled([fetchMeta(), fetchPlaces(), fetchParish(code)]);
    if (places.status === 'rejected') { setState({ kind: 'error', code }); return; }
    const index = indexPlaces(places.value);
    const place = index.byCode.get(code);
    if (!place) { setState({ kind: 'unknown', code }); return; }
    if (meta.status === 'rejected' || record.status === 'rejected') { setState({ kind: 'error', code }); return; }
    setState({ kind: 'ready', code, place, record: record.value, meta: meta.value, index });
  }, []);

  useEffect(() => {
    const code = codeFromPath(window.location.pathname);
    if (!code) { setState({ kind: 'unknown', code: null }); return; }
    void load(code);
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
          ? `Idades, trabalho, escolaridade e agregados em ${place.name} (${place.municipalityName}), numa população sintética gerada a partir dos Censos 2021.${place.level === 'municipality' ? ' Valores do concelho.' : ''}`
          : `Ages, work, education and households in ${place.name} (${place.municipalityName}), from a synthetic population generated from the 2021 Census.${place.level === 'municipality' ? ' Municipality figures.' : ''}`,
      }));
    }
    if (state.kind === 'unknown') {
      return watchHead(unknownHead(siteTitle(locale === 'pt' ? 'Freguesia não encontrada' : 'Parish not found')));
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
          width="5xl"
          eyebrow={EYEBROW[locale]}
          title={pt ? 'Não encontrámos esta freguesia' : 'We could not find this parish'}
          lede={state.code
            ? (pt ? `O código ${state.code} não corresponde a nenhuma freguesia da carta administrativa de 2021. Procura-a pelo nome.` : `The code ${state.code} does not match any parish in the 2021 administrative map. Search for it by name.`)
            : (pt ? 'Este endereço não tem um código de freguesia válido. Procura-a pelo nome.' : 'This address does not carry a valid parish code. Search for it by name.')}
        />
        <PopulationSectionNav current="parish" locale={locale} />
        <div className="mx-auto max-w-5xl px-4 py-10">
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
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        compact
        field="periwinkle"
        width="5xl"
        eyebrow={EYEBROW[locale]}
        title={state.kind === 'error'
          ? (pt ? 'Não foi possível carregar esta freguesia' : 'This parish could not be loaded')
          : (pt ? 'A carregar a freguesia…' : 'Loading the parish…')}
        lede={state.kind === 'error'
          ? (pt ? 'Os dados não chegaram. Pode ser a ligação; tenta outra vez.' : 'The data did not arrive. It may be the connection; try again.')
          : undefined}
        actions={state.kind === 'error' ? <Action onClick={() => void load(state.code)}>{pt ? 'Tentar de novo' : 'Try again'}</Action> : undefined}
      />
      <PopulationSectionNav current="parish" locale={locale} />
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-start justify-center px-4 py-16 text-ink">
        {state.kind === 'loading' && <MarkLoading height={28} color={BRAND.ink} ground={BRAND.paper} label={pt ? 'A carregar' : 'Loading'} />}
      </div>
    </main>
  );
}

function Ready({ code, place, record, meta, index, locale }: Extract<State, { kind: 'ready' }> & { locale: Locale }) {
  const pt = locale === 'pt';
  const region = index.regionById.get(place.region);
  const regionName = region?.name ?? place.regionName;
  const regionHeading = regionTitle(place.region, regionName, locale);
  const fallbackName = record.fallback?.name ?? null;
  const municipalityFigures = place.level === 'municipality' || record.status === 'fallback';
  const parishScope: Scope = { name: place.name, municipality: false };
  const subject = scopeSubject(parishScope, locale);
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  const regionInline = pt && place.region !== 'azores' && place.region !== 'madeira'
    ? regionHeading.charAt(0).toLowerCase() + regionHeading.slice(1)
    : regionHeading;
  const neighbours = useMemo(
    () => index.parishes
      .filter(other => other.municipality === place.municipality && other.code !== place.code)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [index, place],
  );
  const shareModel = useMemo(() => shareCardModel({
    record, recipes: meta.recipes, name: place.name, municipalityName: place.municipalityName, regionName, locale,
  }), [record, meta, place, regionName, locale]);

  const regionHref = POPULATION_ROUTES.region(regionSlug(regionName));
  const order = meta.recipe_order;
  const groups = GROUPS.map(group => ({ ...group, recipes: order.filter(recipe => group.recipes.includes(recipe)) }));

  const tier = TIER_COPY[place.tier];
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

  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        compact
        field="periwinkle"
        width="5xl"
        back={{ href: regionHref, label: regionHeading, locale }}
        eyebrow={EYEBROW[locale]}
        title={parishQuestion(place.name, locale)}
        lede={
          <>
            {pt
              ? `${Subject} fica no concelho de ${place.municipalityName} (${regionInline}). Os Censos 2021 contaram ${formatCount(place.censusPopulation, locale)} residentes em ${formatCount(place.households, locale)} agregados (INE).`
              : `${Subject} is in ${place.municipalityName} municipality (${regionInline}). The 2021 Census counted ${formatCount(place.censusPopulation, locale)} residents in ${formatCount(place.households, locale)} households (INE).`}
            {' '}
            <strong className="font-semibold text-ink">{HONESTY.synthetic[locale]}</strong>
          </>
        }
        meta={
          <>
            <QualityBadge kind={place.tier} locale={locale} title={tier.meaning[locale]} />
            {municipalityFigures && (
              <QualityBadge
                kind="municipality"
                locale={locale}
                label={pt ? `Valores do concelho de ${fallbackName ?? place.municipalityName}` : `${fallbackName ?? place.municipalityName} municipality figures`}
              />
            )}
            <span className="basis-full text-[13px] text-stone-600 sm:basis-auto">{publication}</span>
          </>
        }
      />
      <PopulationSectionNav current="parish" locale={locale} />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
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

            <HowToRead place={place} record={record} meta={meta} locale={locale} fallbackName={fallbackName} municipalityFigures={municipalityFigures} />

            <HundredSection record={record} meta={meta} locale={locale} name={place.name} fallbackName={fallbackName ?? place.municipalityName} />

            {groups.map(group => (
              <section key={group.id} aria-labelledby={group.id} className="flex flex-col gap-5">
                <h2 id={group.id} className="scroll-mt-24 text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                  {group.title[locale]}
                </h2>
                {group.recipes.map(recipe => {
                  const response = record.responses[recipe];
                  const scope: Scope = response.decision === 'fallback'
                    ? { name: fallbackName ?? place.municipalityName, municipality: true }
                    : parishScope;
                  return GUESS_RECIPES.includes(recipe) ? (
                    <GuessFirstCard
                      key={recipe}
                      recipeName={recipe}
                      recipe={meta.recipes[recipe]}
                      record={response}
                      locale={locale}
                      placeName={place.name}
                      fallbackName={fallbackName}
                      where={inScope(scope, locale)}
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
                    />
                  );
                })}
              </section>
            ))}

            <section id="partilhar" aria-labelledby="partilhar-title" className="scroll-mt-24">
              <h2 id="partilhar-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? 'Queres mostrar esta freguesia a alguém?' : 'Want to show this parish to someone?'}
              </h2>
              <div className="mt-4 rounded-2xl border border-line bg-cream p-5 md:p-6">
                <ShareTools model={shareModel} url={parishUrl(locale, code)} title={parishQuestion(place.name, locale)} locale={locale} />
              </div>
            </section>

            <section id="outras" aria-labelledby="outras-title" className="scroll-mt-24">
              <h2 id="outras-title" className="text-2xl font-bold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {pt ? `Outras freguesias do concelho de ${place.municipalityName}` : `Other parishes in ${place.municipalityName} municipality`}
              </h2>
              {neighbours.length > 0 ? (
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
      </div>
    </main>
  );
}

function HowToRead(props: HowToReadInput) {
  const { locale } = props;
  const pt = locale === 'pt';
  const items = howToReadItems(props);
  return (
    <section aria-labelledby="ler-title" className="rounded-2xl border border-line bg-cream p-5 md:p-6">
      <h2 id="ler-title" className="text-lg font-bold tracking-[-0.02em] text-ink">{pt ? 'Como ler esta página' : 'How to read this page'}</h2>
      <dl className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {items.map(item => (
          <div key={item.term}>
            <dt className="text-sm font-bold text-ink">{item.term}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-stone-600">{item.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm">
        <Link href={POPULATION_ROUTES.quality} locale={locale} className="font-semibold text-ink underline underline-offset-4">
          {pt ? 'Como medimos a qualidade' : 'How quality is measured'}
        </Link>
      </p>
    </section>
  );
}
