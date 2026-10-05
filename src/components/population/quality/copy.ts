/**
 * The trust pages' wording, taken from the producer's model card
 * (estimador-microsynthesis docs/public/model_card.md, published as
 * MODEL_CARD.md in github.com/estimadorpt/pt-synthpop) and the handoff (doc 206
 * §3 for v1.0.0, §5 for v1.0.1, which keeps v1.0.0's microdata and changes
 * only the public answers). These are quotations of the producer's claims, in plain PT
 * and EN: no number here is computed on the site. When a release changes the
 * model card, this file changes with it.
 */
import type { Locale } from '@/lib/population/labels';

type Text = Record<Locale, string>;

/** The fail-closed release gates, as the model card lists them. */
export const RELEASE_GATES: Text[] = [
  {
    pt: 'Cobertura completa: 21 tabelas avaliadas em todas as 3 092 freguesias.',
    en: 'Coverage complete: 21 scored tables in all 3,092 parishes.',
  },
  { pt: 'Zero violações estruturais.', en: 'Structural violations: 0.' },
  {
    pt: 'A proporção de crianças nunca fica mais de 10% abaixo do publicado, em nenhuma região nem estrato de tamanho; o pior caso fica em +0,01%.',
    en: 'The child share is no worse than −10% in every region and size stratum, with the worst at +0.01%.',
  },
  {
    pt: 'O total exato de menores de 15 anos em todas as 3 092 freguesias, tanto nos agregados privados como em toda a população residente.',
    en: 'The exact under-15 total in all 3,092 parishes, in both the private and the resident universe.',
  },
  {
    pt: 'Uma auditoria de integridade de cada freguesia, com zero erros.',
    en: 'An integrity audit of every parish, with 0 errors.',
  },
];

/**
 * The six known limitations of the population, declared rather than hidden.
 * The model card lists them for v1.0.0; v1.0.1 has the same microdata, so
 * they hold unchanged.
 */
export const LIMITATIONS: Array<{ title: Text; body: Text }> = [
  {
    title: { pt: 'Trabalho e deslocações são os atributos mais fracos', en: 'Workplace and commuting are the weakest attributes' },
    body: {
      pt: 'O local de trabalho, o meio de transporte, o setor e a profissão ajustam-se às tabelas publicadas muito pior do que as tabelas demográficas e de agregado. Por conceção, não são ajustados a essas tabelas: o modelo gera-os, condicionados à região.',
      en: 'Work location, transport mode, industry and occupation fit the published tables far less well than the demographic and household tables do. By design they are not fitted to those tables: the model generates them, conditioned on the region.',
    },
  },
  {
    title: { pt: 'Algumas combinações que o INE publica como zero', en: 'Some combinations INE publishes as zero' },
    body: {
      pt: 'No máximo 0,08% das pessoas estão, numa tabela ajustada, numa combinação que o INE publica como zero para a sua freguesia. São combinações que nunca aparecem na amostra de treino, por isso o modelo não tem lugar para elas.',
      en: 'At most 0.08% of people sit, in a fitted table, in a combination that INE publishes as zero for their parish. These combinations never occur in the training sample, so the model has no cell for them.',
    },
  },
  {
    title: { pt: 'Células pequenas podem faltar', en: 'Small published cells may be missing' },
    body: {
      pt: 'Cerca de 47 000 células pequenas das tabelas publicadas não são reproduzidas; 87% delas têm uma só pessoa.',
      en: 'About 47,000 small published cells are not reproduced; 87% of them hold a single person.',
    },
  },
  {
    title: { pt: 'Algumas famílias invulgares', en: 'A few unusual families' },
    body: {
      pt: 'Bem menos de 1% dos núcleos familiares têm uma forma que os agregados reais da amostra não têm: por exemplo, um núcleo sem ninguém com 15 ou mais anos, ou uma diferença de idade entre mãe e filho acima de 50 anos.',
      en: 'Well under 1% of family units have a shape that real households in the sample do not have: for example a family unit without a member aged 15 or over, or a mother–child gap above 50 years.',
    },
  },
  {
    title: { pt: 'Otimização com limite de tempo', en: 'Clock-bound optimisation' },
    body: {
      pt: 'Em 116 freguesias grandes, a última fase de pesquisa parou no limite de tempo e não por ter convergido. Estes resultados dependem da velocidade da máquina; o registo de cada freguesia diz como terminou.',
      en: 'In 116 large parishes the final search stopped at its time budget rather than at convergence. These results depend on machine speed; each parish’s record names the exit.',
    },
  },
  {
    title: { pt: 'Residentes em alojamentos coletivos são registos parciais', en: 'Residents of collective quarters are partial records' },
    body: {
      pt: 'As pessoas que vivem em lares e noutros alojamentos coletivos são acrescentadas a partir das contagens publicadas pelo INE. O sexo e a idade vêm dessas contagens; os restantes atributos estão incompletos, por conceção.',
      en: 'People living in care homes and other collective quarters are appended from INE’s published counts. Sex and age come from those counts; their other attributes are partial, by design.',
    },
  },
];

/**
 * How the public answers changed on publication day (doc 206 §5): v1.0.1
 * replaced v1.0.0's launch thresholds. A historical fact about v1.0.0, so its
 * counts are written out, not read from the current release's metadata.
 */
export const SUPERSEDED: Text = {
  pt: 'A versão 1.0.0, publicada a 5 de outubro de 2026, aplicava às respostas do site limiares de lançamento definidos em julho: as 1 611 freguesias de qualidade C mostravam os números do concelho, e as categorias com menos de 10 pessoas geradas ficavam escondidas. No mesmo dia, a versão 1.0.1 substituiu esses limiares: cada freguesia responde com os seus próprios números e o seu nível de qualidade, nada é suprimido, e uma categoria sem ninguém aparece como 0,0%. As pessoas e os agregados gerados são os mesmos nas duas versões.',
  en: 'Release 1.0.0, published on 5 October 2026, applied launch thresholds written in July to the site’s answers: the 1,611 quality C parishes showed their municipality’s figures, and categories with fewer than 10 generated people were hidden. The same day, release 1.0.1 replaced those thresholds: every parish answers with its own figures and its quality tier, nothing is suppressed, and a category with no one in it shows 0.0%. The generated people and households are the same in both releases.',
};

/** Novelty, verbatim from the handoff (scorecard.novelty, rounded by the producer). */
export const NOVELTY: Text = {
  pt: '10,5% das pessoas e 0,8% dos agregados coincidem com um registo da amostra em 13 atributos',
  en: '10.5% of people and 0.8% of households match a sample record on 13 attributes',
};

export const ACCIDENTAL_MATCHES: Text = {
  pt: 'Sintético não quer dizer que coincidências acidentais sejam impossíveis.',
  en: 'Synthetic does not mean that accidental attribute matches are impossible.',
};

/** The national privacy audit's findings, as the model card states them. */
export const PRIVACY_FINDINGS: Array<{ title: Text; body: Text }> = [
  {
    title: { pt: 'Coincidências exatas', en: 'Exact matches' },
    body: {
      pt: `${NOVELTY.pt}. Para comparação, uma réplica que reutiliza registos da amostra (o teste de referência SA/CO) chega a 99,1% das pessoas e 99,9% dos agregados.`,
      en: `${NOVELTY.en}. For comparison, a replay that reuses sample records (the SA/CO benchmark) reaches 99.1% of people and 99.9% of households.`,
    },
  },
  {
    title: { pt: 'Distância ao registo mais próximo', en: 'Distance to the closest record' },
    body: {
      pt: 'As pessoas sintéticas estão mais longe da amostra do que as pessoas da amostra estão umas das outras: 10,8% coincidem exatamente, contra 74,3% entre registos reais.',
      en: 'Synthetic persons are further from the sample than sample persons are from each other: 10.8% are exact matches, against 74.3% real-to-real.',
    },
  },
  {
    title: { pt: 'Inferência de pertença', en: 'Membership inference' },
    body: {
      pt: 'Sem sinal em excesso: saber se alguém estava na amostra não fica mais fácil com estes dados (−0,002 AUC para pessoas, −0,007 para agregados).',
      en: 'No excess signal: telling whether someone was in the sample does not get easier with these data (−0.002 AUC for persons, −0.007 for households).',
    },
  },
  {
    title: { pt: 'Inferência de atributos', en: 'Attribute inference' },
    body: {
      pt: 'Sem vantagem: adivinhar um atributo de alguém a partir dos restantes não fica mais fácil do que com os próprios dados reais (−0,002).',
      en: 'No advantage: guessing someone’s attribute from the others does not get easier than with the real data themselves (−0.002).',
    },
  },
];

/** Intended uses, from the model card. */
export const INTENDED_USES: Text[] = [
  { pt: 'Exploração demográfica descritiva.', en: 'Descriptive demographic exploration.' },
  {
    pt: 'Análise de agregados e da população em áreas pequenas, dentro das regras de qualidade publicadas.',
    en: 'Small-area household and population analysis within the published quality rules.',
  },
  { pt: 'Jornalismo e aplicações de dados cívicos.', en: 'Journalism and civic-data applications.' },
  { pt: 'Ensino e investigação reprodutível.', en: 'Education and reproducible research.' },
  {
    pt: 'Cenários agregados e pós-estratificação, desde que a incerteza seja propagada.',
    en: 'Aggregate scenario and poststratification work that propagates uncertainty.',
  },
  {
    pt: 'Testar ferramentas que precisam de registos populacionais realistas, mas que não identificam ninguém.',
    en: 'Testing tools that require realistic but non-identifying population records.',
  },
];

/** Uses the release does not support, from the model card. */
export const NON_USES: Text[] = [
  {
    pt: 'Identificar, localizar ou tomar decisões sobre pessoas reais.',
    en: 'Identifying, locating, or making decisions about real people.',
  },
  {
    pt: 'Tratar uma linha sintética como uma pessoa, uma família ou uma morada.',
    en: 'Treating a synthetic row as an individual, family, or address.',
  },
  {
    pt: 'Cruzamentos sem restrições em freguesias muito pequenas ou de qualidade fraca.',
    en: 'Unrestricted cross-tabulation in tiny or weak-quality parishes.',
  },
  { pt: 'Conclusões assentes em campos não validados.', en: 'Claims based on fields marked unvalidated.' },
  { pt: 'Conclusões causais sobre efeitos de políticas.', en: 'Causal conclusions about policy effects.' },
  {
    pt: 'Prever comportamentos ou simular agentes sem um modelo próprio e validado.',
    en: 'Behavioural prediction or agent-based simulation without a separate validated model.',
  },
  { pt: 'Substituir as estatísticas oficiais dos Censos.', en: 'Replacing official Census statistics.' },
  {
    pt: 'Decisões jurídicas, de crédito, de seguros, de emprego, policiais ou de elegibilidade.',
    en: 'Legal, credit, insurance, employment, policing, or eligibility decisions.',
  },
];

/** Plain words for the scorecard's per-parish fit statistic. */
export const FIT_EXPLAINED: Text = {
  pt: 'Erro típico face às tabelas do INE; quanto mais baixo, mais perto. É a mediana, entre freguesias, do erro de todas as células das 12 tabelas de pessoas (SRMSE), medido sobre a população residente. É reportado, não é um critério de publicação.',
  en: 'Typical error against INE’s tables; the lower, the closer. It is the median, across parishes, of the all-cell error over the 12 person tables (SRMSE), measured on the resident population. It is reported, not used as a publication gate.',
};

/** Size bands, by the scorecard's stratum key, in words. */
export const SIZE_BAND: Record<string, Text> = {
  lt_500: { pt: 'Menos de 500 residentes', en: 'Fewer than 500 residents' },
  '500_2k': { pt: '500 a 2 000 residentes', en: '500 to 2,000 residents' },
  '2k_10k': { pt: '2 000 a 10 000 residentes', en: '2,000 to 10,000 residents' },
  gt_10k: { pt: 'Mais de 10 000 residentes', en: 'More than 10,000 residents' },
};

/** Fit statistics are shown with three decimals, as the model card prints them. */
export function formatFit(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatCount(value: number, locale: Locale): string {
  // pt-PT leaves four-digit numbers ungrouped by default ("1215"); the site
  // and the model card write "1 215", so grouping is forced.
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { useGrouping: 'always' }).format(value);
}

/** A calendar date (YYYY-MM-DD) in words, e.g. "5 de outubro de 2026". */
export function formatDay(iso: string, locale: Locale): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
