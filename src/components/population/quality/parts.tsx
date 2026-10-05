import type { ReactNode } from 'react';
import { CircleCheck, Info } from 'lucide-react';
import { Mosaic } from '@/components/brand/Mosaic';
import { Action } from '@/components/brand/Action';
import { BRAND } from '@/lib/brand';

/**
 * A state, always as an icon and a word: `pass` on the plain moss surface,
 * `caveat` in amber (amber is a caveat on this site, never emphasis).
 */
export function StatusItem({ tone, label, value, children }: {
  tone: 'pass' | 'caveat';
  label: string;
  value: string;
  children?: ReactNode;
}) {
  const Icon = tone === 'pass' ? CircleCheck : Info;
  return (
    <div className="rounded-2xl border border-line bg-cream p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold ${tone === 'pass' ? 'bg-moss text-ink' : 'bg-amber-100 text-amber-900'}`}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {value}
      </p>
      {children && <div className="mt-3 text-sm leading-relaxed text-stone-600">{children}</div>}
    </div>
  );
}

/** A section with a question as its heading. */
export function Section({ id, title, lede, children }: { id: string; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line pt-8 md:pt-10">
      <h2 id={`${id}-title`} className="text-2xl text-ink md:text-[1.75rem]">{title}</h2>
      {lede && <div className="mt-3 max-w-3xl leading-relaxed text-stone-600">{lede}</div>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** What a trust page shows when its release file is missing: no number, a next step. */
export function PopulationUnavailable({ locale }: { locale: string }) {
  const pt = locale === 'pt';
  return (
    <div className="grid items-center gap-8 rounded-2xl border border-line bg-cream p-6 md:grid-cols-[1fr_200px] md:p-8">
      <div>
        <h2 className="text-xl font-bold text-ink">{pt ? 'Os ficheiros desta versão não estão disponíveis' : 'This release’s files are not available'}</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-stone-600">
          {pt
            ? 'Não mostramos números que não conseguimos ler da versão publicada. Tenta mais tarde, ou consulta a ficha do modelo no repositório público.'
            : 'We do not show figures we could not read from the published release. Try again later, or read the model card in the public repository.'}
        </p>
        <div className="mt-6"><Action href="/populacao" locale={locale} arrow>{pt ? 'Voltar à população' : 'Back to population'}</Action></div>
      </div>
      <div aria-hidden="true" className="hidden md:block"><Mosaic variant="quarters" className="w-full" ground={BRAND.cream} /></div>
    </div>
  );
}
