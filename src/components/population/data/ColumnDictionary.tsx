import { Disclosure } from '@/components/viz/Disclosure';
import type { Locale } from '@/lib/population/labels';
import type { ReleaseColumn } from '@/types/population';
import { columnDescription, SITE_LABEL_MAPS } from './dictionary';

type Text = Record<Locale, string>;

/**
 * The provenance classes the release's column dictionary uses (the producer's
 * release spec, §B.0). `G/C` is a generated column made consistent afterwards.
 */
export const PROVENANCE_CODES: Array<{ code: string; name: Text; meaning: Text }> = [
  {
    code: 'G',
    name: { pt: 'Gerado', en: 'Generated' },
    meaning: {
      pt: 'Produzido pelo modelo. Pode estar ajustado a uma tabela do INE por freguesia ou não; a descrição da coluna diz qual é o caso.',
      en: 'Produced by the model. It may or may not be fitted to an INE parish table; the column’s description says which.',
    },
  },
  {
    code: 'D',
    name: { pt: 'Derivado', en: 'Derived' },
    meaning: {
      pt: 'Calculado a partir de outra coluna por uma regra fixa (um agrupamento, uma etiqueta). Tão fiável como a coluna de origem.',
      en: 'Computed from another column by a fixed rule (a grouping, a label). As reliable as its parent column.',
    },
  },
  {
    code: 'C',
    name: { pt: 'Tornado coerente', en: 'Consistency-enforced' },
    meaning: {
      pt: 'Recalculado depois de gerado para ser coerente com o resto do registo; por exemplo, o tamanho do agregado é o número das suas pessoas.',
      en: 'Recomputed after generation to agree with the rest of the record; for example, household size is the number of its persons.',
    },
  },
  {
    code: 'X',
    name: { pt: 'Geográfico', en: 'Geographic' },
    meaning: {
      pt: 'Atribuído a partir do código da freguesia (CAOP 2021). Um identificador, não um resultado do modelo.',
      en: 'Assigned from the parish code (CAOP 2021). An identifier, not a model output.',
    },
  },
  {
    code: 'key',
    name: { pt: 'Chave', en: 'Key' },
    meaning: { pt: 'Liga pessoas a agregados.', en: 'Links persons to households.' },
  },
  {
    code: 'flag',
    name: { pt: 'Indicador', en: 'Flag' },
    meaning: { pt: 'Um indicador 0/1.', en: 'A 0/1 indicator.' },
  },
];

function Description({ table, name, column, locale }: { table: 'persons' | 'households'; name: string; column: ReleaseColumn; locale: Locale }) {
  const pt = locale === 'pt';
  const { text, edited } = columnDescription(table, name, column);
  const siteMap = SITE_LABEL_MAPS[`${table}.${name}`];
  return (
    <>
      {text}
      {edited && <span className="ml-1 text-xs text-stone-500">{pt ? '(texto revisto pelo site)' : '(wording revised by the site)'}</span>}
      {column.label_map && (
        <span className="mt-1 block text-xs text-stone-500">
          {pt ? 'Etiquetas: ' : 'Labels: '}<code className="font-mono">label_maps.{column.label_map}</code>
        </span>
      )}
      {siteMap && (
        <span className="mt-1 block text-xs leading-relaxed text-stone-600">
          <span className="font-semibold text-ink">{pt ? 'Etiquetas (do site; o ficheiro ainda não as tem): ' : 'Labels (from the site; the file does not carry them yet): '}</span>
          {siteMap.map((entry, i) => (
            <span key={entry.code}>{i > 0 && ' · '}<code className="font-mono">{entry.code}</code> {entry.label[locale]}</span>
          ))}
        </span>
      )}
    </>
  );
}

function Table({ table, title, columns, locale }: { table: 'persons' | 'households'; title: string; columns: Record<string, ReleaseColumn>; locale: Locale }) {
  const pt = locale === 'pt';
  const entries = Object.entries(columns);
  return (
    <>
      {/* Phones: one stacked entry per column, so the description wraps under the name instead of hiding behind a sideways scroll (PRO2-V02). */}
      <dl className="divide-y divide-line sm:hidden">
        {entries.map(([name, column]) => (
          <div key={name} className="px-3 py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2 font-mono text-[13px] text-ink">
              <span className="font-semibold [overflow-wrap:anywhere]">{name}</span>
              <span className="text-stone-500">{pt ? 'origem' : 'provenance'} {column.provenance}</span>
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-stone-700">
              <Description table={table} name={name} column={column} locale={locale} />
            </dd>
          </div>
        ))}
      </dl>
      {/* A scroll area: focusable, so a keyboard can scroll it, and named (A11Y2-06); the edge shadow says there is more. */}
      <div tabIndex={0} role="region" aria-label={pt ? `Dicionário de colunas: ${title}` : `Column dictionary: ${title}`} className="scroll-cue hidden max-h-[36rem] overflow-auto sm:block">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {[pt ? 'Coluna' : 'Column', pt ? 'Origem' : 'Provenance', pt ? 'Descrição (em inglês)' : 'Description'].map(header => (
                <th key={header} scope="col" className="sticky top-0 border-b-2 border-ink bg-cream px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([name, column]) => (
              <tr key={name} className="align-top">
                <th scope="row" className="whitespace-nowrap border-b border-line px-3 py-2 text-left font-mono text-[13px] font-normal text-ink">{name}</th>
                <td className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-[13px] text-ink">{column.provenance}</td>
                <td className="min-w-[18rem] border-b border-line px-3 py-2 leading-relaxed text-stone-700">
                  <Description table={table} name={name} column={column} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** The release's own column dictionary, persons and households, behind the site's one disclosure (UXD2-26). */
export function ColumnDictionary({ dictionary, locale }: {
  dictionary: { persons: Record<string, ReleaseColumn>; households: Record<string, ReleaseColumn> };
  locale: Locale;
}) {
  const pt = locale === 'pt';
  const groups = [
    { key: 'persons' as const, title: pt ? 'Pessoas' : 'Persons', columns: dictionary.persons },
    { key: 'households' as const, title: pt ? 'Agregados' : 'Households', columns: dictionary.households },
  ];
  return (
    <div className="space-y-4">
      {groups.map(group => (
        <Disclosure
          key={group.key}
          className="rounded-2xl border border-line bg-cream"
          summaryClassName="w-full px-5 py-1.5"
          summary={<>{group.title} <span className="font-normal text-stone-500">· {Object.keys(group.columns).length} {pt ? 'colunas' : 'columns'}</span></>}
        >
          <div className="border-t border-line p-2 md:p-3">
            <Table table={group.key} title={group.title} columns={group.columns} locale={locale} />
          </div>
        </Disclosure>
      ))}
    </div>
  );
}
