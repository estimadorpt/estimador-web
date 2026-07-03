// "Histórias dos dados" — the data-stories section below the dashboard tiles.
// Every number here is OFFICIAL data plus explicit arithmetic (no models); the
// feed-level disclaimer (bilingual, from the payload) is rendered verbatim as
// the section intro. Modules degrade individually: an unavailable module is
// simply skipped (its absence is honest — we never fill gaps with estimates).

import { getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { pickText, isModuleAvailable, type EconomyStories } from '@/types/economy-stories';
import { MortgageResetStory } from './MortgageResetStory';
import { RealWagesStory } from './RealWagesStory';
import { TourismStory } from './TourismStory';
import { FoodBasketStory } from './FoodBasketStory';
import { HousingStory } from './HousingStory';
import { SavingsGapStory } from './SavingsGapStory';
import { PublicAccountsStory } from './PublicAccountsStory';
import { ReleaseCalendarCard } from './ReleaseCalendar';

export async function StoriesSection({
  stories,
  locale,
}: {
  stories: EconomyStories;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'economics' });
  const m = stories?.modules ?? {};

  const anyAvailable = [
    m.mortgage_reset,
    m.real_wages,
    m.tourism_pulse,
    m.food_basket,
    m.housing_affordability,
    m.savings_gap,
    m.public_accounts,
  ].some((mod) => isModuleAvailable(mod));

  if (!anyAvailable) return null;

  return (
    <section id="historias" aria-labelledby="stories-heading" className="pt-4">
      <div className="border-t border-stone-200 pt-8">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="w-4 h-4 text-stone-400" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t('storiesEyebrow')}
          </span>
        </div>
        <h2 id="stories-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
          {t('storiesTitle')}
        </h2>
        {/* feed-level disclaimer, verbatim from the payload (bilingual) */}
        {pickText(locale, stories?.disclaimer) && (
          <p className="mt-2 text-xs leading-relaxed text-stone-500 max-w-3xl">
            {pickText(locale, stories.disclaimer)}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* flagship: the two-part mortgage honesty demonstration */}
        {isModuleAvailable(m.mortgage_reset) && (
          <div className="lg:col-span-2">
            <MortgageResetStory data={m.mortgage_reset} locale={locale} />
          </div>
        )}

        {isModuleAvailable(m.real_wages) && (
          <RealWagesStory data={m.real_wages} locale={locale} />
        )}

        {isModuleAvailable(m.tourism_pulse) && (
          <TourismStory data={m.tourism_pulse} locale={locale} />
        )}

        {isModuleAvailable(m.food_basket) && (
          <FoodBasketStory data={m.food_basket} locale={locale} />
        )}

        {isModuleAvailable(m.housing_affordability) && (
          <HousingStory data={m.housing_affordability} locale={locale} />
        )}

        {isModuleAvailable(m.savings_gap) && (
          <div className="lg:col-span-2">
            <SavingsGapStory data={m.savings_gap} locale={locale} />
          </div>
        )}

        {isModuleAvailable(m.public_accounts) && (
          <div className="lg:col-span-2">
            <PublicAccountsStory data={m.public_accounts} locale={locale} />
          </div>
        )}

        {isModuleAvailable(m.release_calendar) && (
          <div className="lg:col-span-2">
            <ReleaseCalendarCard data={m.release_calendar} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}
