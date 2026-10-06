/**
 * The trust pages' wording, taken from the producer's model card
 * (estimador-microsynthesis docs/public/model_card.md, published as
 * MODEL_CARD.md in github.com/estimadorpt/pt-synthpop) and the handoff (doc 206
 * §3 for v1.0.0; §5–§7 for v1.0.1 to v1.0.3, which keep v1.0.0's generated
 * population and change the public answers, two label columns and nuts2).
 * These are quotations of the producer's claims, in plain PT
 * and EN: no number here is computed on the site. When a release changes the
 * model card, this file changes with it.
 */
import { CONSTRAINT_LABEL, formatFit, type Locale } from '@/lib/population/labels';
import { formatCount } from '@/lib/population/format';

type Text = Record<Locale, string>;

/** The fail-closed release gates, as the model card lists them. */
export const RELEASE_GATES: Text[] = [
  {
    pt: 'Cobertura completa: 21 tabelas avaliadas em todas as 3 092 freguesias.',
    en: 'Coverage complete: 21 scored tables in all 3,092 parishes.',
  },
  // What a "structural violation" is: the glossary (METH3-03).
  { pt: 'Zero violações estruturais (registos impossíveis; ver o glossário).', en: 'Structural violations: 0 (impossible records; see the glossary).' },
  {
    // scorecard headline.child_deficit = +0.000127: the worst stratum sits above the published share (model card: "the worst at +0.01%").
    pt: 'A proporção de crianças nunca fica mais de 10% abaixo da publicada, em nenhuma região nem classe de tamanho. Nenhuma ficou abaixo: no pior caso fica 0,01% acima (o limite era −10%).',
    en: 'The child share is never more than 10% below the published one, in any region or size band. None fell below it: the worst case is 0.01% above (the limit was −10%).',
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
 * What a resident of a collective living quarter carries in the microdata
 * (v1.0.3 persons file, is_institutional = 1): appended after the fit, with
 * sex and age from INE's counts and education imputed (the release's column
 * dictionary says "hot-decked"); the other personal columns are filled, with
 * the same age rules as everyone else; nucleus_id and the work columns are
 * null for all of them. The /dados dictionary row lists the columns.
 */
export const INSTITUTIONAL_RECORDS: Text = {
  pt: 'As pessoas que vivem em lares e noutros alojamentos coletivos são acrescentadas depois do ajuste, a partir das contagens publicadas pelo INE. O sexo e a idade vêm dessas contagens e a escolaridade é imputada a partir de registos semelhantes; a condição perante o trabalho, o estado civil e a nacionalidade estão preenchidos. Ficam vazios, por conceção, o núcleo familiar e os campos de trabalho (situação na profissão, setor, profissão, ramo, local de trabalho e meio de transporte).',
  en: 'People living in care homes and other collective quarters are appended after the fit, from INE’s published counts. Sex and age come from those counts and education is imputed from similar records; employment status, marital status and nationality are filled. By design, the family nucleus and the work fields (status in employment, sector, occupation, industry, place of work and means of transport) are left empty.',
};

/**
 * The known limitations of the population, declared rather than hidden: the
 * model card's six, and the housing and nucleus caveats its column dictionary
 * states (in English only, until now).
 * The model card lists them for v1.0.0; v1.0.3 has the same generated
 * population, so they hold unchanged (its nuts2 correction is in SUPERSEDED).
 */
export const LIMITATIONS: Array<{ title: Text; body: Text }> = [
  {
    title: { pt: 'Trabalho e deslocações são os atributos mais fracos', en: 'Workplace and commuting are the weakest attributes' },
    body: {
      pt: 'O local de trabalho ou estudo, o meio de transporte, o ramo de atividade (secção da CAE) e a profissão (grande grupo da CPP) ficam muito mais longe das tabelas publicadas do que as tabelas demográficas e de agregado. São avaliados, mas por conceção não entram no ajuste: o modelo gera-os, condicionados à região. Do trabalho, entram no ajuste a condição perante o trabalho, o setor de atividade em quatro grandes grupos e a situação na profissão (ver «Que tabelas foram usadas?»).',
      en: 'Work or study location, transport mode, industry (CAE section) and occupation (CPP major group) sit much further from the published tables than the demographic and household tables do. They are scored but, by design, not fitted: the model generates them, conditioned on the region. Of the work fields, labour-force status, the four-group activity sector and status in employment are fitted (see “Which tables were used?”).',
    },
  },
  {
    title: { pt: 'Algumas combinações que o INE publica como zero', en: 'Some combinations INE publishes as zero' },
    body: {
      // Model card, "Rare combinations". Its causal clause ("so the model has no cell for them") is attributed, not restated, until the producer explains the mechanism.
      pt: 'Cerca de 22 000 pessoas ficam numa combinação que o INE publica como zero para a sua freguesia. A maior parte está na tabela de atividade dos agregados, que fica fora do ajuste como verificação independente. Nas tabelas de pessoas do ajuste são cerca de 7 900 entradas (no máximo 0,08% das pessoas; uma pessoa pode contar em mais de uma tabela), sobretudo em trabalho × escolaridade, escolaridade, condição perante o trabalho e estado civil. A ficha do modelo liga-as a combinações que não aparecem na amostra de treino.',
      en: 'About 22,000 people sit in a combination that INE publishes as zero for their parish. Most are in the household-activity table, which is held out of the fit as an independent check. In the fitted person tables there are about 7,900 such entries (at most 0.08% of people; one person can count in more than one table), mostly in labour × education, education, labour-force status and marital status. The model card links them to combinations that do not occur in the training sample.',
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
      pt: 'Em 116 freguesias grandes, a última fase de pesquisa parou no limite de tempo e não por ter convergido. Estes resultados dependem da velocidade da máquina; o nosso registo interno diz como terminou cada uma (não faz parte dos ficheiros publicados).',
      en: 'In 116 large parishes the final search stopped at its time budget rather than at convergence. These results depend on machine speed; our internal record names how each one ended (it is not part of the published files).',
    },
  },
  {
    title: { pt: 'Residentes em alojamentos coletivos são registos parciais', en: 'Residents of collective quarters are partial records' },
    body: {
      // One statement on every page (METH3-20, POP3-ACC-V02, PRO3-10), as the v1.0.3 persons file has it:
      // which columns are filled for is_institutional = 1 and which are null for all of them.
      pt: INSTITUTIONAL_RECORDS.pt,
      en: INSTITUTIONAL_RECORDS.en,
    },
  },
  {
    // From the release's column dictionary (hh_tenure_code, n_divisions, nucleus_id), which said it only in English.
    title: { pt: 'Habitação e núcleos familiares', en: 'Housing and family nuclei' },
    body: {
      pt: 'O regime de ocupação (proprietário ou arrendatário) e o número de divisões da casa são publicados nos microdados, mas não são ajustados por freguesia: nas aldeias, a população gerada tem mais arrendatários do que a real. E alguns núcleos familiares gerados têm uma só pessoa, quando no INE um núcleo tem sempre pelo menos duas.',
      en: 'Tenure (owner or tenant) and the number of rooms are published in the microdata but not fitted per parish: in villages the generated population has more renters than the real one. And some generated family nuclei have a single member, where INE’s nucleus always has at least two.',
    },
  },
];

// One name per evaluated table (and the fit formatter): they live with the
// rest of the population wording in labels.ts, because a parish page's tier
// sentence names its worst table too (MR2-03).
export { CONSTRAINT_LABEL, formatFit };

/** A scorecard key's site label, or the scorecard's own label for a key the map does not know yet. */
export function constraintLabel(key: string, fallback: Text, locale: Locale): string {
  return CONSTRAINT_LABEL[key]?.[locale] ?? fallback[locale];
}

/** The 12 fitted person tables, in the scorecard's order (the chart's rows). */
export const FITTED_PERSON_KEYS = ['p_age5', 'p_marital', 'p_educ', 'p_labour', 'p_income', 'p_labour3_educ5', 'p_labour3_income', 'p_nat', 'p_religion', 'p_sitprof', 'p_sector', 'p_union'] as const;

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const listOf = (items: string[], and: string) => `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;

/**
 * Which tables the population was fitted to and which were only scored, in
 * the evaluation's own terms (scorecard `constraints` with `was_constrained`,
 * the release's column dictionary for dwelling accessibility, "bound per
 * parish … and scored", and the evaluator's other scored tables). Together
 * they are the 21 tables of the coverage gate. The scorecard publishes a
 * median only for the fitted person tables; the others are listed by name.
 */
export const FITTED_TABLES: Text[] = [
  { pt: 'Pessoas por agregado e núcleos familiares por agregado', en: 'People per household and family nuclei per household' },
  { pt: 'Acessibilidade do alojamento a pessoas em cadeira de rodas (BGRI)', en: 'Dwelling wheelchair accessibility (BGRI)' },
  {
    pt: `As 12 tabelas de pessoas do gráfico acima: ${listOf(FITTED_PERSON_KEYS.map(key => lower(CONSTRAINT_LABEL[key].pt)), 'e')}`,
    en: `The 12 person tables in the chart above: ${listOf(FITTED_PERSON_KEYS.map(key => lower(CONSTRAINT_LABEL[key].en)), 'and')}`,
  },
];

export const SCORED_ONLY_TABLES: Text[] = [
  { pt: 'Local de trabalho ou estudo', en: 'Place of work or study' },
  { pt: 'Meio de transporte', en: 'Means of transport' },
  { pt: 'Ramo de atividade (secção da CAE)', en: 'Industry (CAE section)' },
  { pt: 'Profissão (grande grupo da CPP)', en: 'Occupation (CPP major group)' },
  { pt: 'Agregados por número de pessoas empregadas, e por pessoas ativas e dependentes', en: 'Households by number of employed people, and by active and dependent people' },
];

/** Words the trust pages use, with a reading a non-specialist can act on. */
export const GLOSSARY: Array<{ term: Text; body: Text }> = [
  {
    term: { pt: 'Erro típico (SRMSE)', en: 'Typical error (SRMSE)' },
    body: {
      pt: 'Compara, célula a célula, a contagem gerada com a que o INE publicou: é a raiz do desvio quadrático médio entre as duas, a dividir pela contagem média de uma célula dessa tabela. É um número sem unidades: 0 quer dizer igual; 0,10 quer dizer que, grosso modo, cada célula se afasta cerca de 10% do tamanho típico de uma célula. Quanto mais baixo, mais perto. Numa tabela com uma categoria muito grande (nacionalidade, religião), o erro fica perto de zero mesmo que as categorias pequenas se afastem bastante: não leias um valor baixo como garantia para os grupos pequenos.',
      en: 'Compares, cell by cell, the generated count with the one INE published: it is the root-mean-square deviation between the two, divided by the average size of a cell in that table. It has no unit: 0 means identical; 0.10 means that, roughly, each cell is off by about 10% of a typical cell’s size. The lower, the closer. In a table with one very large category (nationality, religion) the error stays near zero even when the small categories are well off: do not read a low value as a guarantee for the small groups.',
    },
  },
  {
    term: { pt: 'Erro do ajuste (todas as células)', en: 'Fit error (all cells)' },
    body: {
      pt: 'O erro típico de uma freguesia calculado de uma só vez sobre todas as células das 12 tabelas de pessoas do ajuste, na população residente. O gráfico por tamanho de freguesia mostra a mediana deste erro entre as freguesias de cada classe; é o número da ficha do modelo.',
      en: 'A parish’s typical error computed in one go over all the cells of the 12 fitted person tables, on the resident population. The chart by parish size shows the median of this error across the parishes of each band; it is the model card’s figure.',
    },
  },
  {
    term: { pt: 'Erro típico da freguesia', en: 'A parish’s typical error' },
    body: {
      pt: 'A mediana dos 12 erros típicos da freguesia, um por tabela de pessoas do ajuste (person_srmse_median no ficheiro de qualidade). É o primeiro critério dos níveis A e B. Não é o número do gráfico por tamanho de freguesia, que junta as células das 12 tabelas num só erro: os dois andam perto, mas não coincidem.',
      en: 'The median of the parish’s 12 typical errors, one per fitted person table (person_srmse_median in the quality file). It is the first criterion of tiers A and B. It is not the figure in the chart by parish size, which pools the cells of the 12 tables into one error: the two are close but do not coincide.',
    },
  },
  {
    term: { pt: 'Pior tabela', en: 'Worst table' },
    body: {
      pt: 'O maior erro típico entre as tabelas de pessoas da freguesia, contando também a idade ano a ano, que é avaliada mas não é uma das 12 tabelas de pessoas do ajuste. É o segundo critério dos níveis; na maior parte das freguesias, a pior tabela é a da idade ano a ano (worst_constraint no ficheiro de qualidade).',
      en: 'The largest typical error among the parish’s person tables, single-year age included, which is scored but is not one of the 12 fitted person tables. It is the tiers’ second criterion; in most parishes the worst table is single-year age (worst_constraint in the quality file).',
    },
  },
  {
    // The producer's release gate (estimador-microsynthesis evaluation/release_gates.py, GATED_STRUCTURAL_CHECKS
    // and GATED_RELATIONAL_CHECKS), in words; the model card names the gate but does not define it (METH3-03).
    term: { pt: 'Violação estrutural', en: 'Structural violation' },
    body: {
      pt: 'Um registo que a lógica dos dados não permite, verificado registo a registo antes de publicar: por exemplo, uma criança com menos de 15 anos empregada ou com um meio de vida, um curso superior antes dos 18 anos, uma idade negativa ou acima de 115, uma pessoa sem agregado, ou um agregado cujo tamanho não é o número das suas pessoas. Esta versão tem zero. Não conta as pessoas que ficam numa combinação que o INE publica como zero para a sua freguesia: essas combinações são possíveis, só não aparecem nessa freguesia nas tabelas do INE, e estão nas limitações.',
      en: 'A record the logic of the data does not allow, checked record by record before release: for example a child under 15 who is employed or has a source of livelihood, a university degree before 18, an age below zero or above 115, a person without a household, or a household whose size is not the number of its people. This release has none. It does not count the people who sit in a combination INE publishes as zero for their parish: those combinations are possible, they just do not occur in that parish in INE’s tables, and they are listed under the limitations.',
    },
  },
  {
    term: { pt: 'Ajuste de máxima entropia', en: 'Maximum-entropy fit' },
    body: {
      pt: 'A forma de aproximar os candidatos gerados das tabelas do INE, mudando o menos possível o peso de cada um.',
      en: 'The way the generated candidates are brought close to INE’s tables while changing each one’s weight as little as possible.',
    },
  },
  {
    term: { pt: 'AUC (inferência de pertença)', en: 'AUC (membership inference)' },
    body: {
      pt: 'Mede, de 0,5 (acaso) a 1 (certeza), se um teste consegue dizer quem estava na amostra. O valor publicado é o excesso sobre o acaso: perto de zero quer dizer que os dados não ajudam.',
      en: 'Measures, from 0.5 (chance) to 1 (certainty), whether a test can tell who was in the sample. The published figure is the excess over chance: near zero means the data do not help.',
    },
  },
  {
    term: { pt: 'Réplica SA/CO', en: 'SA/CO replay' },
    body: {
      pt: 'Um método de referência que monta a população copiando registos da amostra. Serve de termo de comparação para as coincidências: copia quase tudo, por conceção. A própria auditoria marca-o como não pronto para uso (not_ready); é só uma referência.',
      en: 'A reference method that builds the population by copying sample records. It is the yardstick for matches: by design it copies almost everything. The audit itself flags it as not ready for use (not_ready); it is a reference only.',
    },
  },
];

/**
 * The publication day's four releases (doc 206 §5–§7; ERRATA): v1.0.3
 * replaced v1.0.0, v1.0.1 and v1.0.2, all of 2026-10-05. A historical fact,
 * so it is written out, not read from the current release's metadata.
 */
export const SUPERSEDED: Text = {
  pt: 'A versão 1.0.3 substituiu as versões 1.0.0, 1.0.1 e 1.0.2, todas de 5 de outubro de 2026. A 1.0.0 aplicava às respostas do site limiares de lançamento que escondiam cerca de metade das respostas das freguesias; a 1.0.1 retirou-os, e cada freguesia passou a responder com os seus próprios números; a 1.0.2 passou as perguntas sobre agregados para os agregados privados e corrigiu a apresentação; a 1.0.3 corrigiu a coluna nuts2 dos microdados, que passou a seguir as regiões NUTS II de 2013. As pessoas e os agregados gerados são os mesmos nas quatro versões.',
  en: 'Release 1.0.3 replaced releases 1.0.0, 1.0.1 and 1.0.2, all of 5 October 2026. Release 1.0.0 applied launch thresholds to the site’s answers that hid about half of the parish answers; 1.0.1 removed them, so every parish answers with its own figures; 1.0.2 asked the household questions of private households and fixed the presentation; 1.0.3 corrected the microdata’s nuts2 column to the 2013 NUTS II regions. The generated people and households are the same in all four releases.',
};

/**
 * The history in one sentence, for the pages that point to /dados#versao.
 * GitHub has v1.0.0, v1.0.1 and v1.0.3 (v1.0.3 went up after midnight, on
 * 6 October in Lisbon); v1.0.2 was never released there.
 */
export const REPLACED: Text = {
  pt: 'Esta é a versão 1.0.3, que substituiu três versões datadas de 5 de outubro de 2026 (a 1.0.2 nunca chegou ao GitHub); a população gerada é a mesma em todas.',
  en: 'This is release 1.0.3, which replaced three releases dated 5 October 2026 (1.0.2 never reached GitHub); the generated population is the same in all of them.',
};

/**
 * When GitHub shows a release as published, where that differs from the
 * release's own date (release.json `published`, CITATION.cff): v1.0.3 was
 * uploaded at 00:01 UTC on 6 October 2026 (`gh api …/releases`).
 */
export const GITHUB_PUBLISHED: Record<string, string> = { '1.0.3': '2026-10-06' };

/**
 * Where the generated total and INE's resident count part (pt-synthpop
 * v1.0.3 quality.csv, `population` against `census_population`): 762 parishes
 * differ, from 119 people fewer to 30 more. Release columns, quoted; the
 * national totals are read from release.json and places.json where they are
 * rendered (`generatedGap`).
 */
export const GENERATED_VS_INE = { parishes: 762, fewest: 119, most: 30 } as const;

/** The generated total against INE's, in words, from the release's persons and the sum of places.json's INE residents. */
export function generatedGap(persons: number, ineResidents: number, locale: Locale): string {
  const gap = ineResidents - persons;
  const { parishes, fewest, most } = GENERATED_VS_INE;
  const fmt = (value: number) => formatCount(value, locale);
  if (locale === 'pt') {
    const national = gap === 0 ? 'no país, os totais coincidem' : `no país, são ${fmt(Math.abs(gap))} pessoas ${gap > 0 ? 'a menos' : 'a mais'} (${fmt(persons)} geradas, contra ${fmt(ineResidents)} residentes segundo o INE)`;
    return `O total gerado nem sempre é o do INE: em ${fmt(parishes)} freguesias difere, entre ${fmt(fewest)} pessoas a menos e ${fmt(most)} a mais; ${national}. Os níveis de qualidade usam a menor das duas contagens, a contagem de publicação.`;
  }
  const national = gap === 0 ? 'nationally, the totals agree' : `nationally, there are ${fmt(Math.abs(gap))} people ${gap > 0 ? 'fewer' : 'more'} (${fmt(persons)} generated, against ${fmt(ineResidents)} residents according to INE)`;
  return `The generated total is not always INE’s: in ${fmt(parishes)} parishes it differs, from ${fmt(fewest)} people fewer to ${fmt(most)} more; ${national}. The quality tiers use the smaller of the two counts, the publication count.`;
}

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
      pt: `${NOVELTY.pt}. Para comparação, uma réplica que reutiliza registos da amostra (o teste de referência SA/CO, que a própria auditoria marca como não pronto para uso) chega a 99,1% das pessoas e 99,9% dos agregados.`,
      en: `${NOVELTY.en}. For comparison, a replay that reuses sample records (the SA/CO benchmark, which the audit itself flags as not ready for use) reaches 99.1% of people and 99.9% of households.`,
    },
  },
  {
    // Model card, privacy section: the figure on the 11 generated attributes, beside the 13-attribute one (METH3-04).
    title: { pt: 'Combinações comuns', en: 'Common combinations' },
    body: {
      pt: 'Nos 11 atributos que o modelo gera, 80% das pessoas sintéticas partilham a combinação com alguma pessoa da amostra. São perfis comuns, e a distância ao registo mais próximo, nesses 11 atributos, continua maior do que entre as pessoas da própria amostra.',
      en: 'On the 11 attributes the model generates, 80% of synthetic persons share an attribute combination with some sample person. Those are common profiles, and the distance to the closest record on those 11 attributes is still larger than between the sample’s own people.',
    },
  },
  {
    title: { pt: 'Distância ao registo mais próximo', en: 'Distance to the closest record' },
    body: {
      pt: 'Numa amostra de 5 000 registos, as pessoas sintéticas estão mais longe da amostra do que as pessoas da amostra estão umas das outras: 10,8% das sintéticas coincidem exatamente com o registo mais próximo, contra 74,3% entre registos reais. É uma medida diferente da coincidência exata em 13 atributos (todas as pessoas).',
      en: 'In a sample of 5,000 records, synthetic persons are further from the sample than sample persons are from each other: 10.8% of the synthetic ones exactly match their closest record, against 74.3% real-to-real. It is a different measure from the exact match on 13 attributes (every person).',
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
    pt: 'Cenários agregados e pós-estratificação (reponderar um inquérito para que bata com a população). Esta versão não publica incerteza (uma só execução): trata os números como pontuais.',
    en: 'Aggregate scenario and poststratification work (reweighting a survey so it matches the population). This release publishes no uncertainty (a single run): treat the figures as point values.',
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
  // The model card's "fields marked unvalidated" names a class no published column belongs to; the
  // columns a reader can act on are the ones not fitted per parish, which the dictionary marks (PRO3-04).
  {
    pt: 'Conclusões sobre uma freguesia assentes em campos que não são ajustados por freguesia: ramo de atividade, profissão, local de trabalho, meio de transporte, regime de ocupação e divisões da casa (o dicionário de colunas diz quais são).',
    en: 'Parish-level claims based on fields that are not fitted per parish: industry, occupation, place of work, means of transport, tenure and number of rooms (the column dictionary says which they are).',
  },
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
  pt: 'Erro do ajuste face às tabelas do INE (SRMSE): 0 seria igual, e 0,10 quer dizer que cada célula se afasta, grosso modo, 10% do tamanho típico de uma célula. Para cada freguesia, é medido de uma só vez em todas as células das 12 tabelas de pessoas usadas no ajuste, sobre a população residente; o gráfico por tamanho mostra a mediana entre as freguesias de cada classe. É reportado, não é um critério de publicação, e não é o «erro típico da freguesia» que decide os níveis (ver o glossário). Como estas tabelas entraram no ajuste, o erro mede quão perto o ajuste chegou, não quão bem o modelo prevê o que não viu.',
  en: 'Fit error against INE’s tables (SRMSE): 0 would be identical, and 0.10 means each cell is off by roughly 10% of a typical cell’s size. For each parish it is measured in one go over all the cells of the 12 person tables used in the fit, on the resident population; the chart by size shows the median across the parishes of each band. It is reported, not used as a publication gate, and it is not the “parish’s typical error” that decides the tiers (see the glossary). Because these tables were in the fit, the error measures how close the fit came, not how well the model predicts what it did not see.',
};

/** Size bands, by the scorecard's stratum key, in words. */
export const SIZE_BAND: Record<string, Text> = {
  lt_500: { pt: 'Menos de 500 residentes', en: 'Fewer than 500 residents' },
  '500_2k': { pt: '500 a 2 000 residentes', en: '500 to 2,000 residents' },
  '2k_10k': { pt: '2 000 a 10 000 residentes', en: '2,000 to 10,000 residents' },
  gt_10k: { pt: 'Mais de 10 000 residentes', en: 'More than 10,000 residents' },
};

export { formatCount };

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
