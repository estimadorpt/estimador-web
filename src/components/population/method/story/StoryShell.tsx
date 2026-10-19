'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BEATS, BEAT_STEP, READOUT, SCRUBBED, STEP_NAMES, type BeatId } from './data';
import { BESIDE_QUERY, activeBeat, readingLine } from './scroll';
import { Stage, type StoryData } from './Stage';
import { STEP_IDS, WHY_IDS } from '../rules';
import './story.css';

type Locale = 'pt' | 'en';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
/** How long a change of scene takes to land (story.css's longest move plus its delays). */
const SETTLE_MS = 1100;

/**
 * The scroll story's frame: a sticky stage (the ruler of why and the five
 * steps, the drawing and a caption) and the page's own text, split into beats. Which beat crosses the
 * reading line sets the scene; inside a scrubbed beat, how far it has crossed
 * sets the drawing's progress. The server renders the text; the drawing
 * appears once the stage is measured. A screen reader hears the caption of a
 * scene once it has held, so a fast scroll through several is not read out in
 * a queue.
 */
export function StoryShell({ locale, data, children }: { locale: Locale; data: StoryData; children: ReactNode }) {
  const pt = locale === 'pt';
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [state, setState] = useState<{ beat: BeatId; progress: number; inside: boolean }>({ beat: BEATS[0], progress: 0, inside: false });
  // Right after a change of scene the moves take their time; once they have landed, a scrubbed scene follows the scroll closely.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const next = { width: Math.round(r.width), height: Math.round(r.height) };
      setSize(prev => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const beats = Array.from(el.querySelectorAll<HTMLElement>('.mstory-beat[data-beat]'));
    if (beats.length === 0) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const s = stage.current;
      // A short window hides the stage (story.css): then there is no drawing to follow and nothing to read out.
      const shown = !!s && s.getClientRects().length > 0;
      const line = readingLine(window.innerHeight, window.matchMedia(BESIDE_QUERY).matches, shown && s ? s.getBoundingClientRect().bottom : null);
      const rects = beats.map(b => b.getBoundingClientRect());
      const { index, progress: through } = activeBeat(rects, line);
      const inside = shown && rects[0].top <= line && rects[rects.length - 1].bottom > 0;
      const beat = (beats[index].dataset.beat ?? BEATS[0]) as BeatId;
      // Only a scrubbed scene draws from the progress; elsewhere it stays 0, so the stage re-renders on a change of scene, not every frame.
      const progress = SCRUBBED.includes(beat) ? through : 0;
      setState(prev => (prev.beat === beat && prev.inside === inside && Math.abs(prev.progress - progress) < 0.003
        ? prev
        : { beat, progress: Math.round(progress * 1000) / 1000, inside }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // The text can change height without a scroll (the font arriving, a note opening): measure again then too.
    const observer = new ResizeObserver(schedule);
    const text = el.querySelector('.mstory-beats');
    if (text) observer.observe(text);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    // The beats are server-rendered children React never re-renders, so their data-active is set here, not through props.
    root.current?.querySelectorAll<HTMLElement>('.mstory-beat[data-beat]').forEach(b => b.toggleAttribute('data-active', b.dataset.beat === state.beat));
    setSettled(false);
    // Under reduced motion nothing glides, so there is nothing to wait for.
    const wait = window.matchMedia(REDUCED_QUERY).matches ? 0 : SETTLE_MS;
    const timer = window.setTimeout(() => setSettled(true), wait);
    return () => window.clearTimeout(timer);
  }, [state.beat]);

  const step = BEAT_STEP[state.beat];
  const readout = READOUT[locale][state.beat];

  return (
    <div ref={root} className="mstory">
      {/* Without a script there is no drawing: the text reads as a page, and the fixed drawings follow it. */}
      <noscript><style>{'.mstory{display:block}.mstory-stage,.mstory .mstory-short{display:none}.mstory-beat,.mstory-beat[data-scrubbed]{padding-bottom:1.5rem}.mstory-beats{padding:0}'}</style></noscript>
      <p className="mstory-short">
        {pt
          ? 'Com o telemóvel na vertical, um desenho acompanha estes passos. Os desenhos fixos estão no fim desta secção.'
          : 'With your phone upright, a drawing follows these steps. The fixed drawings are at the end of this section.'}
      </p>
      <div ref={stage} className="mstory-stage">
        <nav className="mstory-steps" aria-label={pt ? 'Porquê e os cinco passos' : 'Why, and the five steps'}>
          <ol>
            {STEP_NAMES[locale].map((name, i) => (
              <li key={name}>
                <a href={`#${i === 0 ? WHY_IDS[locale] : STEP_IDS[i - 1]}`} aria-current={step === i ? 'step' : undefined} data-why={i === 0 ? '' : undefined}>
                  {i > 0 && <span className="tnum">{i}</span>}
                  <span className="mstory-step-name">{name}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div ref={box} className="mstory-box">
          {size && size.width > 0 && size.height > 0 && (
            <Stage
              locale={locale}
              beat={state.beat}
              progress={state.progress}
              width={size.width}
              height={size.height}
              data={data}
              scrub={settled && SCRUBBED.includes(state.beat)}
            />
          )}
        </div>
        <p className="mstory-readout" aria-hidden="true">{readout}</p>
        <p className="sr-only" aria-live="polite">{settled && state.inside ? readout : ''}</p>
      </div>
      <div className="mstory-beats">{children}</div>
    </div>
  );
}
