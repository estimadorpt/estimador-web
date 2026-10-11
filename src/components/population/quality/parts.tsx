import type { ReactNode } from 'react';
import { CircleCheck, Info } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';

/**
 * A state as a ruled item: its name, then an icon and a word, never a chip:
 * `pass` in ink, `caveat` in the caveat colour as text (amber 700, never a
 * fill; amber is a caveat on this site, never emphasis), then a line on what
 * it means.
 */
export function StatusItem({ tone, label, value, children }: {
  tone: 'pass' | 'caveat';
  label: string;
  value: string;
  children?: ReactNode;
}) {
  const Icon = tone === 'pass' ? CircleCheck : Info;
  return (
    <div className="border-t border-ink pt-2">
      <p className="text-[12px] text-graphite">{label}</p>
      <p className={`mt-1.5 inline-flex items-center gap-1.5 text-[17px] font-semibold ${tone === 'pass' ? 'text-ink' : 'text-amber-700'}`}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {value}
      </p>
      {children && <div className="mt-2 text-sm leading-relaxed text-graphite">{children}</div>}
    </div>
  );
}

/**
 * A section with a statement as its heading, over an ink rule (an
 * instrument's head); its explicit id keeps the anchors other pages link to.
 */
export function Section({ id, title, lede, children }: { id: string; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="border-b border-ink pb-2 text-[26px] leading-7 text-ink md:text-[28px] md:leading-8">{title}</h2>
      {lede && <div className="mt-3 max-w-3xl leading-relaxed text-graphite">{lede}</div>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** What a trust page shows when its release file is missing: no number, a next step. */
export function PopulationUnavailable({ locale }: { locale: string }) {
  const pt = locale === 'pt';
  return (
    <div className="flex flex-col gap-6 border-t border-ink pt-4 md:flex-row md:items-start">
      <EmptyStateMark />
      <div className="min-w-0 flex-1">
        <h2 className="text-xl text-ink">{pt ? 'Os ficheiros desta versão não estão disponíveis' : 'This release’s files are not available'}</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-graphite">
          {pt
            ? 'Não mostramos números que não conseguimos ler da versão publicada. Tenta mais tarde, ou consulta a ficha do modelo no repositório público.'
            : 'We do not show figures we could not read from the published release. Try again later, or read the model card in the public repository.'}
        </p>
        <div className="mt-6"><Action href="/populacao" locale={locale} arrow>{pt ? 'Ver a população sintética' : 'See the synthetic population'}</Action></div>
      </div>
    </div>
  );
}
