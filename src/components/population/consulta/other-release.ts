/**
 * What a link to an earlier release can say (PRO3-07). A response id hashes
 * its release, so the site, which serves only the current release's lookup,
 * cannot tell which parish or question an older id was for. It can say what
 * changed between the releases: the generated people and households are the
 * same in all of them, and the answers changed as below. Compared response by
 * response, v1.0.1 against v1.0.3 (same parish, same question, producer
 * bundles): age, education, employment status and multigenerational homes
 * are identical in every parish; household size, household type, elders
 * alone and (in a few parishes) who lives alone changed when v1.0.2 counted
 * private households only. v1.0.0 hid about half the parish answers behind
 * the município or no answer at all (SUPERSEDED).
 */
import { POPULATION_RELEASE } from '@/lib/config/population';

type Locale = 'pt' | 'en';

export function otherReleaseText(release: string, locale: Locale): string {
  const pt = locale === 'pt';
  const where = pt
    ? `O link aponta para a versão ${release}; o site mostra a ${POPULATION_RELEASE}.`
    : `The link points to release ${release}; the site shows ${POPULATION_RELEASE}.`;
  const find = pt
    ? 'O link não diz de que freguesia é a resposta: procura-a na versão atual.'
    : 'The link does not say which parish the answer is for: look it up in the current release.';
  if (release === '1.0.1') {
    return pt
      ? `${where} As pessoas e os agregados gerados são os mesmos nas duas. As respostas sobre idades, escolaridade, condição perante o trabalho e casas com crianças e pessoas de 65+ têm os mesmos números; as perguntas sobre pessoas por agregado, núcleos familiares e quem vive sozinho passaram, na 1.0.2, a contar só os agregados privados, e os seus números podem ter mudado. ${find}`
      : `${where} The generated people and households are the same in both. The answers on ages, education, employment status and homes with children and people aged 65+ have the same figures; the questions on people per household, family nuclei and living alone counted private households only from 1.0.2, and their figures may have changed. ${find}`;
  }
  if (release === '1.0.0') {
    return pt
      ? `${where} As pessoas e os agregados gerados são os mesmos nas duas, mas as respostas mudaram: a 1.0.0 escondia cerca de metade das respostas das freguesias (mostrava o concelho, ou nenhuma resposta), e na 1.0.2 as perguntas sobre agregados e sobre quem vive sozinho passaram a contar só os agregados privados. ${find}`
      : `${where} The generated people and households are the same in both, but the answers changed: 1.0.0 hid about half the parish answers (it showed the municipality, or no answer), and from 1.0.2 the questions on households and on living alone counted private households only. ${find}`;
  }
  return pt
    ? `${where} Os números das duas versões podem não coincidir. ${find}`
    : `${where} The two releases’ figures may not agree. ${find}`;
}
