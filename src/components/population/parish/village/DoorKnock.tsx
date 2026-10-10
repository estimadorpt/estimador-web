'use client';
/**
 * The parish page's "Bate à porta" section body. Light on purpose: the village
 * (Village.tsx: the miniatura's drawing, the word tables) and the parish's
 * sample file load only when the section comes near the screen.
 */
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { fetchSample } from '@/lib/population/client';
import type { Locale, ParishSample } from '@/lib/population/sample';

const loadVillage = () => import('./Village');
const Village = dynamic(loadVillage, { ssr: false, loading: () => <Placeholder /> });

function Placeholder() {
  return <div aria-hidden="true" className="aspect-[4/5] w-full rounded-2xl border border-line bg-parchment motion-safe:animate-pulse sm:aspect-[16/9]" />;
}

export function DoorKnock({ code, locale, region, municipality, censusPopulation }: { code: string; locale: Locale; region: string; municipality: string; censusPopulation: number }) {
  const pt = locale === 'pt';
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [file, setFile] = useState<ParishSample | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); setNear(true); }
    }, { rootMargin: '600px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let live = true;
    void loadVillage();
    fetchSample(code)
      .then(data => { if (live) setFile(data); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [near, code]);

  return (
    <div ref={ref}>
      {failed ? (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-cream p-5">
          <EmptyStateMark />
          <p className="text-[15px] text-stone-700">
            {pt ? 'As casas desta freguesia não carregaram. Recarrega a página para bateres à porta.' : 'This parish’s houses did not load. Reload the page to knock.'}
          </p>
        </div>
      ) : file ? (
        <Village file={file} locale={locale} region={region} municipality={municipality} censusPopulation={censusPopulation} />
      ) : (
        <Placeholder />
      )}
    </div>
  );
}
