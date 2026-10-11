import type { ReactNode } from 'react';
import { NoMargin } from '@/components/instrument';
import { TextLink } from '@/components/brand/TextLink';
import { ParishSearch } from '@/components/population/ParishSearch';
import { parishHref } from '@/components/population/ParishLink';
import { ChartTable } from '@/components/viz/ChartTable';
import { POPULATION_ROUTES } from '@/lib/config/population';
import { REAL_PARISH } from '@/lib/miniatura/copy';
import { AGE_BANDS, FIT, HOUSEHOLDS, SIZES, byAge, bySize, distanceFromTarget, fittedCounts } from '@/lib/miniatura/population';
import { HONESTY } from '@/lib/population/labels';

/**
 * The explainer's static parts, rendered on the server: the scene's table
 * twins, the fit in miniature, the five steps and the real parish it ends on.
 */
type Locale = 'pt' | 'en';

const H2 = 'border-b border-ink pb-2 text-[26px] leading-7 text-ink md:text-[28px] md:leading-8';

/** A heading's hyphenated words ("lê-se") never break at the hyphen. */
export function keepHyphens(text: string): ReactNode {
  return text.split(/(\S+-\S+)/).map((part, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part));
}

/** The scene as tables: every home with its people's ages, and the two recounts. */
export function MiniatureTwins({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  return (
    <div className="flex flex-wrap gap-x-8">
      <ChartTable
        summaryLabel={pt ? 'Ver as casas em tabela' : 'View the homes as a table'}
        caption={pt ? 'Os 30 agregados inventados e as idades de quem lá vive' : 'The 30 invented households and the ages of who lives there'}
        columns={pt ? ['Agregado', 'Pessoas', 'Idades'] : ['Household', 'People', 'Ages']}
        align={[undefined, 'right', 'left']}
        rows={HOUSEHOLDS.map(h => [h.id + 1, h.people.length, h.people.map(p => p.age).join(', ')])}
      />
      <ChartTable
        summaryLabel={pt ? 'Ver as idades em tabela' : 'View the ages as a table'}
        caption={pt ? 'As 100 pessoas inventadas, por idade' : 'The 100 invented people, by age'}
        columns={pt ? ['Idade', 'Pessoas'] : ['Age', 'People']}
        rows={byAge().map((group, i) => [AGE_BANDS[locale][i], group.length])}
      />
      <ChartTable
        summaryLabel={pt ? 'Ver os tamanhos em tabela' : 'View the sizes as a table'}
        caption={pt ? 'As 100 pessoas inventadas, por tamanho do agregado' : 'The 100 invented people, by household size'}
        columns={pt ? ['Pessoas no agregado', 'Agregados', 'Pessoas'] : ['People in the household', 'Households', 'People']}
        rows={bySize().map((group, i) => [SIZES[i], HOUSEHOLDS.filter(h => h.people.length === SIZES[i]).length, group.length])}
      />
    </div>
  );
}

/**
 * The fit, in miniature: the neighbourhood's age groups next to an invented
 * table it had to match, and 30 households drawn at random before any fit.
 */
export function FitSection({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const fitted = fittedCounts();
  const near = distanceFromTarget(fitted);
  const far = distanceFromTarget(FIT.unfitted);
  const sum = (counts: readonly number[]) => counts.reduce((a, b) => a + b, 0);
  const people = (n: number) => (pt ? `${n} ${n === 1 ? 'pessoa' : 'pessoas'}` : `${n} ${n === 1 ? 'person' : 'people'}`);
  const th = 'px-2 py-2 align-bottom text-[12px] font-semibold leading-4 text-graphite';
  const td = 'border-b border-grid px-2 py-2 text-right';
  const rows = AGE_BANDS[locale].map((label, i) => ({ label, target: FIT.target[i], random: FIT.unfitted[i], fitted: fitted[i] }));

  return (
    <section aria-labelledby="mini-ajuste" className="mt-14">
      <h2 id="mini-ajuste" className={H2}>
        {pt ? `Com o ajuste, o bairro fica a ${people(near)} da tabela que tinha de acertar` : `After the fit, the neighbourhood is ${people(near)} away from the table it had to match`}
      </h2>
      <div className="max-w-3xl">
        <p className="mt-3 text-base leading-relaxed text-ink">
          {pt
            ? 'Na população publicada, os agregados não são escritos à mão como os deste bairro: o modelo escolhe-os até as contagens ficarem o mais perto possível das tabelas que o INE publica para cada freguesia. Em ponto pequeno, com uma tabela inventada no lugar da do INE:'
            : 'In the published population, households are not written by hand like this neighbourhood’s: the model chooses them until the counts come as close as possible to the tables INE publishes for each parish. In miniature, with an invented table standing in for INE’s:'}
        </p>
        <table className="mt-4 w-full max-w-xl border-collapse text-[15px] tabular-nums">
          <caption className="mb-1 text-left text-[15px] font-semibold text-ink">{pt ? 'Pessoas por idade, dados inventados' : 'People by age, invented data'}</caption>
          <thead>
            <tr className="border-b border-ink">
              <th scope="col" className={`${th} pl-0 text-left`}>{pt ? 'Idade' : 'Age'}</th>
              <th scope="col" className={`${th} text-right`}>{pt ? 'A tabela a acertar' : 'The table to match'}</th>
              <th scope="col" className={`${th} text-right`}>{pt ? '30 agregados ao acaso' : '30 households at random'}</th>
              <th scope="col" className={`${th} pr-0 text-right`}>{pt ? 'O bairro, com ajuste' : 'The neighbourhood, fitted'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th scope="row" className="whitespace-nowrap border-b border-grid py-2 pr-2 text-left font-medium text-ink">{row.label}</th>
                <td className={td}>{row.target}</td>
                <td className={td}>{row.random}</td>
                <td className={`${td} pr-0 font-semibold`}>{row.fitted}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="border-b border-ink py-2 pr-2 text-left font-medium text-ink">Total</th>
              <td className="border-b border-ink px-2 py-2 text-right">{sum(FIT.target)}</td>
              <td className="border-b border-ink px-2 py-2 text-right">{sum(FIT.unfitted)}</td>
              <td className="border-b border-ink py-2 pl-2 text-right font-semibold">{sum(fitted)}</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-2 text-left font-medium text-ink">{pt ? 'Longe da tabela' : 'Away from the table'}</th>
              <td className="px-2 py-2 text-right text-graphite">—</td>
              <td className="px-2 py-2 text-right">{far}</td>
              <td className="py-2 pl-2 text-right font-semibold">{near}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 max-w-xl text-[13px] leading-snug text-graphite">
          {pt
            ? `«Longe da tabela» soma as diferenças grupo a grupo. Tabela e agregados inventados para este exemplo; numa freguesia real, as tabelas são as do INE (Censos 2021).`
            : '“Away from the table” adds up the gaps group by group. Table and households invented for this example; in a real parish, the tables are INE’s (2021 Census).'}
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink">
          {pt
            ? `Trinta agregados tirados ao acaso ficavam a ${people(far)} da tabela; os trinta do bairro, escolhidos para ela, ficam a ${near}. Na população publicada, o ajuste é feito freguesia a freguesia, com várias tabelas do INE ao mesmo tempo (idade, estado civil, escolaridade, trabalho, entre outras), e corre uma só vez: cada número publicado é uma execução do modelo, sem margem. O nível de qualidade de cada freguesia (A, B ou C) diz quão perto ficou das suas tabelas.`
            : `Thirty households drawn at random were ${people(far)} away from the table; the neighbourhood’s thirty, chosen for it, are ${near} away. In the published population the fit is done parish by parish, against several of INE’s tables at once (age, marital status, education, work, among others), and it runs once: every published figure is one model run, with no margin. Each parish’s quality tier (A, B or C) says how close it came to its tables.`}
        </p>
      </div>
    </section>
  );
}

/** The five steps that build the published population, as the methodology tells them. */
export function BuildSteps({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  const steps = pt
    ? [
      ['Aprender as combinações.', 'Um modelo aprende, com a amostra pública dos Censos 2021, que pessoas e que agregados costumam aparecer juntos: idades, escolaridade, trabalho, quem vive com quem.'],
      ['Gerar candidatos e ajustá-los às tabelas do INE.', 'Para cada freguesia, o modelo gera milhares de agregados possíveis e dá mais peso aos que fazem as contagens bater com as tabelas que o INE publicou para ela: quantas pessoas em cada idade, em cada nível de escolaridade, em casas de cada tamanho. É o ajuste da tabela acima, com muitas tabelas ao mesmo tempo.'],
      ['Escolher agregados inteiros.', 'Dos candidatos escolhem-se agregados inteiros, como as casas do bairro: ninguém fica dividido.'],
      ['Acrescentar quem vive em lares.', 'As pessoas em lares e noutros alojamentos coletivos entram a partir das contagens do INE.'],
      ['Publicar com o nível de qualidade.', 'Cada coluna publicada tem um significado declarado, e cada freguesia sai com um nível (A, B ou C), que junta quão perto ficou das tabelas e o número de residentes.'],
    ]
    : [
      ['Learn the combinations.', 'A model learns, from the 2021 Census public-use sample, which people and households tend to occur together: ages, education, work, who lives with whom.'],
      ['Generate candidates and fit them to INE’s tables.', 'For each parish the model generates thousands of possible households and gives more weight to those that make the counts match the tables INE published for it: how many people of each age, each education level, in homes of each size. It is the fit in the table above, with many tables at once.'],
      ['Draw whole households.', 'Whole households are drawn from the candidates, like the homes in the neighbourhood: nobody is split.'],
      ['Add the residents of care homes.', 'People in care homes and other collective quarters are added from INE’s counts.'],
      ['Publish with a quality tier.', 'Every published column has a declared meaning, and each parish comes out with a tier (A, B or C), which combines how close it came to the tables and the number of residents.'],
    ];
  return (
    <section aria-labelledby="mini-passos" className="mt-14">
      <h2 id="mini-passos" className={H2}>{pt ? 'A população publicada constrói-se em cinco passos' : 'The published population is built in five steps'}</h2>
      <ol className="max-w-3xl">
        {steps.map(([title, text], i) => (
          <li key={title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 border-b border-rule py-3">
            <span aria-hidden="true" className="font-display text-[19px] font-bold leading-6 tabular-nums text-ink">{i + 1}</span>
            <p className="text-base leading-relaxed text-ink"><strong className="font-semibold">{title}</strong> {text}</p>
          </li>
        ))}
      </ol>
      <TextLink href={POPULATION_ROUTES.methodology} locale={locale} className="mt-2">
        {pt ? 'A explicação completa, na metodologia' : 'The full account, in the methodology'}
      </TextLink>
    </section>
  );
}

/** The end: a real parish, with the population's own sign before anything else. */
export function RealParish({ locale }: { locale: Locale }) {
  const pt = locale === 'pt';
  return (
    <section aria-labelledby="mini-real" className="mt-14">
      <h2 id="mini-real" className={H2}>{keepHyphens(pt ? 'Uma freguesia real lê-se da mesma maneira' : 'A real parish reads the same way')}</h2>
      <div className="max-w-3xl">
        <p className="mt-3 flex flex-col gap-1">
          <NoMargin locale={locale} />
          <span className="text-sm text-ink">{HONESTY.synthetic[locale]}</span>
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink">
          {pt
            ? 'Cada freguesia dos Censos 2021 tem a sua população gerada, ajustada às tabelas do INE dessa freguesia, com as mesmas perguntas: quem vive sozinho, as idades, o trabalho, as famílias.'
            : 'Every 2021 Census parish has its own generated population, fitted to INE’s tables for that parish, with the same questions: who lives alone, ages, work, families.'}
        </p>
        <ParishSearch
          locale={locale}
          label={pt ? 'Procura uma freguesia real' : 'Find a real parish'}
          className="mt-4 w-full max-w-xl"
        />
        <TextLink href={parishHref(REAL_PARISH.code, locale)} external className="mt-2">
          {pt ? `Ver uma freguesia real: ${REAL_PARISH.name}, em ${REAL_PARISH.municipality}` : `See a real parish: ${REAL_PARISH.name}, in ${REAL_PARISH.municipality}`}
        </TextLink>
      </div>
    </section>
  );
}
