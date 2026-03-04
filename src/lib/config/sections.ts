// Section configuration for the multi-domain platform

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
    id: 'liga-portugal',
    type: 'football',
    slug: 'desporto/liga',
    nameKey: 'sections.ligaPortugal',
    descriptionKey: 'sections.ligaPortugalDescription',
    isActive: true,
    accentColor: '#006B3F',
    dataPath: 'football/liga-2025-26',
    href: '/desporto/liga',
  },
  {
    id: 'presidential-2026',
    type: 'elections',
    slug: 'eleicoes/presidenciais',
    nameKey: 'sections.presidential2026',
    descriptionKey: 'sections.presidential2026Description',
    isActive: false,
    accentColor: '#1e3a5f',
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
    accentColor: '#1e3a5f',
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
