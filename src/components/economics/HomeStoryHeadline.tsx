'use client';

// Homepage teaser: surfaces ONE data-story headline (official numbers +
// explicit arithmetic — no model values), rotating deterministically by
// day-of-year. Server-rendered HTML shows the first story; the client swaps in
// the day's pick after mount to avoid hydration mismatches across midnight.

import { useEffect, useState } from 'react';

export interface HomeStoryItem {
  id: string;
  headline: string; // already localized by the server
}

export function HomeStoryHeadline({ items }: { items: HomeStoryItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const now = new Date();
    const start = Date.UTC(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000);
    setIndex(dayOfYear % items.length);
  }, [items.length]);

  const item = items[index] ?? items[0];
  if (!item) return null;

  return (
    <span className="text-xs text-stone-500 leading-snug">{item.headline}</span>
  );
}
