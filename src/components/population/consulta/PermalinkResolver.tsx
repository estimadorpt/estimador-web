'use client';

import { useEffect, useState } from 'react';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { Action } from '@/components/brand/Action';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { BRAND } from '@/lib/brand';
import { POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { fetchQueryLookup } from '@/lib/population/client';
import { siteTitle } from '@/lib/site-title';
import { isQueryId, isQueryIdPrefix, lookupEntry, parseCanonicalPath, queryBucket, targetFor } from './resolve';
import { otherReleaseText } from './other-release';

/**
 * The room the page keeps for its answer: the tallest card an unresolved link
 * ends on (measured at 360 to 1280 in both locales: up to 506px on a phone,
 * 336px from 640px, 260px from 768px), so swapping "A abrir…" for that card
 * moves nothing below it (SEO3-13: CLS 0.157).
 */
const RESERVED = 'min-h-[32rem] sm:min-h-[21rem] md:min-h-[16.5rem]';

type State =
  | { kind: 'resolving' }
  | { kind: 'redirecting'; href: string }
  | { kind: 'other-release'; release: string }
  | { kind: 'unknown' };

/**
 * Keeps the shell out of search results. Its metadata already says noindex
 * (createPageMetadata with index: false), so the tag is set in place rather
 * than a second robots tag added beside it (SP2-09); a new one only if the
 * page has none.
 */
function addNoindex() {
  const existing = document.querySelector('meta[name="robots"]');
  if (existing) { existing.setAttribute('content', 'noindex, follow'); return; }
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, follow';
  document.head.appendChild(meta);
}

/**
 * Resolves a canonical response link on the client. The first render does not
 * depend on the address (the exported shell is shared by every link); the
 * effect reads it, looks the id up and replaces the location, so the shell
 * never sits in the history.
 */
export function PermalinkResolver({ locale }: { locale: 'pt' | 'en' }) {
  const [state, setState] = useState<State>({ kind: 'resolving' });
  const pt = locale === 'pt';

  useEffect(() => {
    let cancelled = false;
    const parsed = parseCanonicalPath(window.location.pathname);
    if (!parsed || !(isQueryId(parsed.id) || isQueryIdPrefix(parsed.id))) {
      addNoindex();
      setState({ kind: 'unknown' });
      return;
    }
    if (parsed.release !== POPULATION_RELEASE) {
      addNoindex();
      setState({ kind: 'other-release', release: parsed.release });
      return;
    }
    fetchQueryLookup(queryBucket(parsed.id))
      .then(lookup => {
        if (cancelled) return;
        // A full id, or a shortened one that only one published id starts with (the id cards printed until round 3).
        const entry = lookupEntry(lookup, parsed.id);
        // An /en/populacao/v/… link opens the English page, even if the host served the Portuguese shell.
        const href = targetFor(entry, parsed.locale ?? locale);
        if (!href) {
          addNoindex();
          setState({ kind: 'unknown' });
          return;
        }
        setState({ kind: 'redirecting', href });
        window.location.replace(href);
      })
      .catch(() => {
        if (cancelled) return;
        addNoindex();
        setState({ kind: 'unknown' });
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // The tab, the history and a shared preview name what the page says, not "A abrir…" (SEO3-13).
  // Kept while the page is open: streamed metadata can write its <title> after this runs.
  useEffect(() => {
    const title = state.kind === 'other-release'
      ? siteTitle(pt ? 'Link de outra versão da população' : 'Link from another release of the population')
      : state.kind === 'unknown' ? siteTitle(pt ? 'Resultado não encontrado' : 'Result not found') : null;
    if (!title) return undefined;
    const apply = () => {
      const titles = document.querySelectorAll('title');
      if (titles.length === 0) { document.title = title; return; }
      titles.forEach(element => { if (element.textContent !== title) element.textContent = title; });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [state.kind, pt]);

  if (state.kind === 'resolving' || state.kind === 'redirecting') {
    return (
      <div className={RESERVED}>
      <div role="status" aria-live="polite" className="flex flex-col items-start gap-4 py-6">
        <MarkLoading height={36} color={BRAND.ink} ground={BRAND.paper} />
        <p className="text-base text-stone-600">
          {pt ? 'A abrir o resultado deste link…' : 'Opening the result this link points to…'}
        </p>
        {state.kind === 'redirecting' && (
          <a href={state.href} className="text-sm font-semibold text-ink underline underline-offset-4">
            {pt ? 'Se a página não abrir, segue por aqui' : 'If the page does not open, follow this link'}
          </a>
        )}
      </div>
      </div>
    );
  }

  const otherRelease = state.kind === 'other-release';
  return (
    <div className={RESERVED}>
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-cream p-6 md:flex-row md:items-start md:p-8">
      <EmptyStateMark />
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-ink md:text-2xl">
          {otherRelease
            ? (pt ? 'Este link é de outra versão da população' : 'This link is from another release of the population')
            : (pt ? 'Não encontrámos este resultado' : 'We could not find this result')}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-stone-600">
          {/* What changed between the releases, question by question (PRO3-07). */}
          {otherRelease
            ? otherReleaseText(state.release, locale)
            : (pt
              ? 'O endereço não corresponde a nenhum resultado publicado nesta versão. Pode ter sido copiado incompleto: um identificador encurtado precisa de pelo menos 8 caracteres depois de «q1_». Procura a freguesia diretamente.'
              : 'The address does not match any result published in this release. It may have been copied incompletely: a shortened id needs at least 8 characters after “q1_”. Look the parish up directly.')}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Action href="/populacao" locale={locale} arrow>
            {pt ? 'Procurar uma freguesia' : 'Look up a parish'}
          </Action>
          {otherRelease && (
            <Action href={`${POPULATION_ROUTES.data}#versao`} locale={locale} variant="text" arrow>
              {pt ? 'O que mudou entre as versões' : 'What changed between releases'}
            </Action>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
