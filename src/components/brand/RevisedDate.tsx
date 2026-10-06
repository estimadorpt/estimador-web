/**
 * When a page's wording was last checked, written one way everywhere
 * (audit FRESH-08): "Revisto a 6 de outubro de 2026" / "Revised 6 October
 * 2026", always a full date. It goes in the PageHero's `meta` slot of
 * methodology, about and privacy pages; the date is a constant next to the
 * page (`REVISED = 'YYYY-MM-DD'`) that is moved when the text is.
 */
export function revisedLabel(isoDate: string, locale: string): string {
  const date = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
  return locale === 'en' ? `Revised ${date}` : `Revisto a ${date}`;
}

export function RevisedDate({ date, locale }: { date: string; locale: string }) {
  return <time dateTime={date.slice(0, 10)}>{revisedLabel(date, locale)}</time>;
}
