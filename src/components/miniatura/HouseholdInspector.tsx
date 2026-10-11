'use client';

import { ArrowLeft } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { ChoiceGroup } from '@/components/brand/Choice';
import { Register } from '@/components/instrument';
import { ACTIVITY, COMMUTE, EDUCATION, HOUSEHOLDS, MARITAL, details, householdDetails } from '@/lib/miniatura/population';

/**
 * Inside one invented home: who lives there (one person at a time, chosen
 * with the site's choice boxes) and that person's columns as a ruled register.
 */
export function HouseholdInspector({ household, person, locale, onPerson, onHousehold, onClear }: {
  household: number;
  person: number | null;
  locale: 'pt' | 'en';
  onPerson: (id: number) => void;
  onHousehold: (id: number) => void;
  onClear: () => void;
}) {
  const pt = locale === 'pt';
  const home = HOUSEHOLDS[household];
  const shown = home.people.find(p => p.id === person) ?? home.people[0];
  const info = details(shown);
  const dwelling = householdDetails(household);
  const n = home.people.length;
  const count = HOUSEHOLDS.length;

  return (
    <section id="mini-agregado" aria-labelledby="mini-agregado-title" className="border-t border-ink pt-2">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="mini-agregado-title" className="text-[19px] leading-6">{pt ? `Agregado ${household + 1}` : `Household ${household + 1}`}</h3>
        <Action variant="text" onClick={onClear}>{pt ? 'Limpar' : 'Clear'}</Action>
      </div>
      <p className="text-[14px] leading-snug text-graphite">
        {pt
          ? `${n} ${n === 1 ? 'pessoa inventada' : 'pessoas inventadas'}, numa casa de ${dwelling.rooms} divisões, ${dwelling.rented ? 'arrendada' : 'própria'}.`
          : `${n} invented ${n === 1 ? 'person' : 'people'}, in a ${dwelling.rooms}-room home, ${dwelling.rented ? 'rented' : 'owned'}.`}
      </p>

      {n > 1 && (
        <ChoiceGroup
          className="mt-3"
          label={pt ? 'Pessoa' : 'Person'}
          value={String(shown.id)}
          onChange={value => onPerson(Number(value))}
          options={home.people.map(p => ({ value: String(p.id), label: pt ? `${p.age} anos` : `${p.age} years` }))}
        />
      )}

      <Register
        className="mt-3"
        items={[
          { label: pt ? 'Idade e sexo' : 'Age and sex', value: `${shown.age} · ${info.sex === 'F' ? (pt ? 'mulher' : 'woman') : (pt ? 'homem' : 'man')}` },
          { label: pt ? 'Escolaridade' : 'Education', value: EDUCATION[locale][info.education] },
          { label: pt ? 'Atividade' : 'Activity', value: ACTIVITY[locale][info.activity] },
          { label: pt ? 'Estado civil' : 'Marital status', value: MARITAL[locale][info.marital] },
          { label: pt ? 'Vai trabalhar' : 'Commute', value: COMMUTE[locale][info.commute] },
        ]}
      />
      <p className="mt-2 text-[13px] leading-snug text-graphite">
        {pt
          ? 'Valores inventados para este exemplo. Na população publicada, cada pessoa e cada agregado têm colunas como estas.'
          : 'Values invented for this example. In the published population, every person and every household has columns like these.'}
      </p>

      <div className="flex flex-wrap gap-x-6">
        <Action variant="text" onClick={() => onHousehold((household + count - 1) % count)}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />{pt ? 'Agregado anterior' : 'Previous household'}
        </Action>
        <Action variant="text" arrow onClick={() => onHousehold((household + 1) % count)}>
          {pt ? 'Agregado seguinte' : 'Next household'}
        </Action>
      </div>
    </section>
  );
}
