// Section configuration for the multi-domain platform
import { BRAND } from '@/lib/brand';
import { POPULATION_DATA_PATH, POPULATION_ROUTES } from '@/lib/config/population';

export interface SectionConfig {
  id: string;
  type: 'football' | 'elections' | 'economics' | 'demographics';
  slug: string;
  nameKey: string;
  descriptionKey: string;
  isActive: boolean;
  accentColor: string;
  dataPath: string;
  href: string;
}

export const SECTIONS: SectionConfig[] = [
  {
    id: 'population',
    type: 'demographics',
    slug: 'populacao',
    nameKey: 'sections.population',
    descriptionKey: 'sections.populationDescription',
    isActive: true,
    // The data pastel for the atlas's people (see Design Language in CLAUDE.md).
    accentColor: BRAND.mint,
    // The versioned release directory: /data/population/v<POPULATION_RELEASE>.
    dataPath: POPULATION_DATA_PATH,
    href: POPULATION_ROUTES.hub,
  },
  {
    id: 'gdp-nowcast',
    type: 'economics',
    slug: 'economia',
    nameKey: 'sections.economics',
    descriptionKey: 'sections.economicsDescription',
    isActive: true,
    accentColor: '#245c68',
    dataPath: 'economics',
    href: '/economia',
  },
  {
    id: 'liga-portugal',
    type: 'football',
    slug: 'desporto/liga',
    nameKey: 'sections.ligaPortugal',
    descriptionKey: 'sections.ligaPortugalDescription',
    isActive: true,
    accentColor: '#4e8056',
    dataPath: 'football/liga-2026-27',
    href: '/desporto/liga',
  },
  {
    id: 'presidential-2026',
    type: 'elections',
    slug: 'eleicoes/presidenciais',
    nameKey: 'sections.presidential2026',
    descriptionKey: 'sections.presidential2026Description',
    isActive: false,
    accentColor: '#234c40',
    dataPath: 'elections/presidential-2026',
    href: '/eleicoes/presidenciais',
  },
  {
    id: 'parliamentary-2025',
    type: 'elections',
    slug: 'eleicoes/legislativas',
    nameKey: 'sections.parliamentary2025',
    descriptionKey: 'sections.parliamentary2025Description',
    isActive: false,
    accentColor: '#234c40',
    dataPath: 'elections/parliamentary-2025',
    href: '/eleicoes/legislativas',
  },
];

export function getActiveSections(): SectionConfig[] {
  return SECTIONS.filter(s => s.isActive);
}

export function getArchiveSections(): SectionConfig[] {
  return SECTIONS.filter(s => !s.isActive);
}

export function getSectionBySlug(slug: string): SectionConfig | undefined {
  return SECTIONS.find(s => s.slug === slug);
}

export function getSectionAccentColor(pathname: string): string | undefined {
  const section = SECTIONS.find(s => pathname.includes(s.slug));
  return section?.accentColor;
}
