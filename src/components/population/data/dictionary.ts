import type { ReleaseColumn } from '@/types/population';

/**
 * Site-side wording for the columns whose release description points at the
 * producer's internal documents (doc numbers, script paths, rulings, a
 * CLAUDE.md section). The meaning is kept, and so are the INE table numbers; the
 * metadata file in the download keeps the producer's original text. Keyed by
 * "table.column".
 */
export const DESCRIPTION_OVERRIDES: Record<string, string> = {
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

/** A pattern for internal references a public description must not carry (tested on every column). */
export const INTERNAL_REFERENCE = /CLAUDE\.md|\bdoc \d|scripts\/|\bruling\b|\bspec \d|\.py\b|§|A′|\bR9\b|encoding\.|srmse_|\bD5\b/;

export function columnDescription(table: 'persons' | 'households', name: string, column: ReleaseColumn): { text: string; edited: boolean } {
  const override = DESCRIPTION_OVERRIDES[`${table}.${name}`];
  return override ? { text: override, edited: true } : { text: column.description, edited: false };
}

