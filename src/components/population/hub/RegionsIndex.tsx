import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { POPULATION_ROUTES } from '@/lib/config/population';
import type { RegionEntry } from './places';

/** The 20 region pages, alphabetical. Each lists its municípios and parishes. */
export function RegionsIndex({ regions, locale }: { regions: RegionEntry[]; locale: string }) {
  return (
    <ul className="grid gap-x-6 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
      {regions.map(region => (
        <li key={region.id} className="border-b border-line">
          <Link
            href={POPULATION_ROUTES.region(region.slug)}
            locale={locale}
            className="group flex min-h-12 items-center justify-between gap-3 py-2 text-[15px] font-semibold text-ink"
          >
            <span className="underline-offset-4 group-hover:underline">{region.title}</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
