import type { ReleaseColumn } from '@/types/population';

/**
 * Site-side wording for the columns whose release description points at the
 * producer's internal documents (doc numbers, script paths, rulings, a
 * CLAUDE.md section) or says something the model card and the data contradict
 * (industry and occupation as "per-parish INE targets"; a "6-digit" parish
 * code that has letters in Barcelos; município names from a "CAOP lookup" that
 * are INE 2021's). The meaning is kept, and so are the INE table numbers;
 * where the two differ, the site follows the model card. The metadata file in
 * the download keeps the producer's original text. Keyed by "table.column".
 */
const PARISH_CODE = '6-character DICOFRE parish code of residence (CAOP 2021). Eight Barcelos codes contain letters (0302FA to 0302FH): read the column as text.';
const MUNICIPALITY_NAME = 'Municipality name from INE’s 2021 Census geography (e.g. ‘Calheta (R.A.M.)’, ‘Lagoa (R.A.A.)’), CAOP 2024.1 where INE has none. The site shows CAOP 2021 names: join on municipio, not on the name.';

export const DESCRIPTION_OVERRIDES: Record<string, string> = {
  'households.freguesia': PARISH_CODE,
  'households.municipio_name': MUNICIPALITY_NAME,
  'persons.freguesia': PARISH_CODE,
  'persons.municipio_name': MUNICIPALITY_NAME,
  'households.accessibility_code': 'Dwelling accessible to a wheelchair user (Census PUF ACESSO): 1 yes, 2 no. Bound per parish to INE’s dwelling-accessibility table (BGRI) and scored. Null where hh_tenure_code is.',
  'households.hh_rooms_bin': 'n_divisions at the grain INE publishes per parish: 1_2, 3_4, 5+.',
  'households.hh_tenure_code': 'Tenure (regime de ocupação) in INE table 12498’s vocabulary: 1 owner or co-owner, 3 tenant or sub-tenant, 4 other (a one-to-one recode of the Census PUF’s COND_OCUP). Null outside habitual classical dwellings (0.16% of private households) and for collective living quarters. Published but not fitted per parish: villages overstate renters.',
  'households.hh_type_top': 'Household type by number of family nuclei: 1 none, 2 one, 3 two, 4 three or more. Derived from n_nuclei when the release is packaged, so a household and its persons always agree. Null for collective living quarters.',
  'households.n_divisions': 'Rooms (divisões) of the dwelling, ‘1’..‘10’ where ‘10’ = 10 or more. Same universe and null set as hh_tenure_code. Not fitted per parish.',
  'persons.activity_sector_code': 'Activity sector in four groups (1–4); employed only. Derived from the generated activity; the activity-sector table is one of the tables the population was fitted to.',
  'persons.age': 'Age in completed years, generated as a single year; for residents of collective quarters, drawn inside the published 5-year band.',
  'persons.age_group': '‘0 - 14 anos’ if age < 15, else ‘15 e mais anos’, derived from age.',
  'persons.industry_section': 'CAE Rev. 3 section of the activity, A..U with S split into S_94_96 / S_95; employed only. Generated, and compared with INE’s per-parish employed × sex × industry table when scoring; not fitted to it (see the quality page).',
  'persons.is_institutional': '1 = resident of a collective living quarter, appended after the fit: sex and age from INE’s published counts, education imputed from similar records, other attributes partial.',
  'persons.nucleus_id': 'Family-nucleus membership inside the household: ‘0’ = in no nucleus, ‘1’..‘5’ = the person’s nucleus (a label, numbered by first appearance in age-descending member order; not a rank). Known defect: INE’s nucleus has at least two members, and some generated nuclei have one. It does not identify couples: the release carries no partner link.',
  'persons.occupation_code': 'CPP 2010 3-digit minor group; employed only. Derived inside the generated occupation_major from INE table 12306’s per-parish × sex shares (else the município’s, else the national ones), so it rolls up to occupation_major exactly.',
  'persons.occupation_major': 'CPP 2010 major group (first digit of occupation_code); employed only. Generated, and compared with INE’s per-parish employed × sex × occupation table when scoring; not fitted to it (see the quality page).',
};

/**
 * Code-to-label maps for the three code columns the release's `label_maps`
 * leaves out (PRO2-03), supplied by the site until the producer adds them.
 * Sector: INE's grouping of the CAE sections, read off a crosstab of
 * industry_section in the v1.0.3 microdata (section S splits: 94 and 96 are
 * social services, 95 repairs is economic). Education: the five levels the
 * site's education card uses. nuts2: the 2013 NUTS II regions.
 */
export const SITE_LABEL_MAPS: Record<string, Array<{ code: string; label: { pt: string; en: string } }>> = {
  'persons.activity_sector_code': [
    { code: '1', label: { pt: 'Setor primário (CAE A)', en: 'Primary sector (CAE A)' } },
    { code: '2', label: { pt: 'Setor secundário (CAE B a F)', en: 'Secondary sector (CAE B to F)' } },
    { code: '3', label: { pt: 'Terciário social (CAE O a U, sem a divisão 95)', en: 'Social tertiary (CAE O to U, without division 95)' } },
    { code: '4', label: { pt: 'Terciário económico (CAE G a N, e a divisão 95)', en: 'Economic tertiary (CAE G to N, and division 95)' } },
  ],
  'persons.education_level_coarse5': [
    { code: '1', label: { pt: 'Nenhum', en: 'None' } },
    { code: '2', label: { pt: 'Ensino básico (1.º a 3.º ciclo)', en: 'Basic education (1st to 3rd cycle)' } },
    { code: '3', label: { pt: 'Ensino secundário', en: 'Upper secondary' } },
    { code: '4', label: { pt: 'Pós-secundário', en: 'Post-secondary' } },
    { code: '5', label: { pt: 'Ensino superior', en: 'Tertiary' } },
  ],
  'households.nuts2': [
    { code: '11', label: { pt: 'Norte', en: 'Norte' } },
    { code: '15', label: { pt: 'Algarve', en: 'Algarve' } },
    { code: '16', label: { pt: 'Centro', en: 'Centro' } },
    { code: '17', label: { pt: 'Área Metropolitana de Lisboa', en: 'Lisbon Metropolitan Area' } },
    { code: '18', label: { pt: 'Alentejo', en: 'Alentejo' } },
    { code: '20', label: { pt: 'Região Autónoma dos Açores', en: 'Autonomous Region of the Azores' } },
    { code: '30', label: { pt: 'Região Autónoma da Madeira', en: 'Autonomous Region of Madeira' } },
  ],
};

/** A pattern for internal references a public description must not carry (tested on every column). */
export const INTERNAL_REFERENCE = /CLAUDE\.md|\bdoc \d|scripts\/|\bruling\b|\bspec \d|\.py\b|§|A′|\bR9\b|encoding\.|srmse_|\bD5\b/;

export function columnDescription(table: 'persons' | 'households', name: string, column: ReleaseColumn): { text: string; edited: boolean } {
  const override = DESCRIPTION_OVERRIDES[`${table}.${name}`];
  return override ? { text: override, edited: true } : { text: column.description, edited: false };
}

