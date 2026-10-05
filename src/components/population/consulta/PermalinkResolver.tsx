'use client';

import { useEffect, useState } from 'react';
import { Mosaic } from '@/components/brand/Mosaic';
import { Action } from '@/components/brand/Action';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { BRAND } from '@/lib/brand';
import { POPULATION_RELEASE, POPULATION_DOWNLOADS } from '@/lib/config/population';
import { fetchQueryLookup } from '@/lib/population/client';
import { isQueryId, parseCanonicalPath, queryBucket, targetFor } from './resolve';

type State =
  | { kind: 'resolving' }
  | { kind: 'redirecting'; href: string }
  | { kind: 'other-release'; release: string }
  | { kind: 'unknown' };

function addNoindex() {
  if (document.head.querySelector('meta[name="robots"][data-consulta]')) return;
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, follow';
  meta.setAttribute('data-consulta', '');
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
    if (!parsed || !isQueryId(parsed.id)) {
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
        const entry = Object.prototype.hasOwnProperty.call(lookup, parsed.id) ? lookup[parsed.id] : undefined;
        const href = targetFor(entry, locale);
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

  if (state.kind === 'resolving' || state.kind === 'redirecting') {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-start gap-4 py-6">
        <MarkLoading height={36} color={BRAND.ink} ground={BRAND.paper} />
        <p className="text-base text-stone-600">
          {pt ? 'A abrir o resultado desta ligação…' : 'Opening the result this link points to…'}
        </p>
        {state.kind === 'redirecting' && (
          <a href={state.href} className="text-sm font-semibold text-ink underline underline-offset-4">
            {pt ? 'Se a página não abrir, segue por aqui' : 'If the page does not open, follow this link'}
          </a>
        )}
      </div>
    );
  }

  const otherRelease = state.kind === 'other-release';
  return (
    <div className="grid items-center gap-8 rounded-2xl border border-line bg-cream p-6 md:grid-cols-[1fr_200px] md:p-8">
      <div>
        <h2 className="text-xl font-bold text-ink md:text-2xl">
          {otherRelease
            ? (pt ? 'Esta ligação é de outra versão da população' : 'This link is from another release of the population')
            : (pt ? 'Não encontrámos este resultado' : 'We could not find this result')}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-stone-600">
          {otherRelease
            ? (pt
              ? `A ligação aponta para a versão ${state.release}. O site mostra a versão ${POPULATION_RELEASE}, e os números de versões diferentes não se substituem uns aos outros. Procura a freguesia na versão atual, ou consulta o registo de alterações.`
              : `The link points to release ${state.release}. The site shows release ${POPULATION_RELEASE}, and figures from different releases do not stand in for one another. Look the parish up in the current release, or check the change log.`)
            : (pt
              ? 'O endereço não corresponde a nenhum resultado publicado nesta versão. Pode ter sido copiado incompleto. Procura a freguesia diretamente.'
              : 'The address does not match any result published in this release. It may have been copied incompletely. Look the parish up directly.')}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Action href="/populacao" locale={locale} arrow>
            {pt ? 'Procurar uma freguesia' : 'Look up a parish'}
          </Action>
          {otherRelease && (
            <Action external href={POPULATION_DOWNLOADS.errata} variant="text">
              {pt ? 'Registo de alterações' : 'Change log'}
            </Action>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="hidden md:block">
        <Mosaic variant="quarters" className="w-full" ground={BRAND.cream} />
      </div>
    </div>
  );
}
