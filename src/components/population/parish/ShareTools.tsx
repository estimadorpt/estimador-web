'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Link2, Share2 } from 'lucide-react';
import { Action } from '@/components/brand/Action';
import { drawShareCard, SHARE_CARD, SHARE_CARD_FONTS, type ShareCardModel } from '@/lib/population/share-card';
import type { Locale } from '@/lib/population/labels';

async function renderCard(model: ShareCardModel, canvas: HTMLCanvasElement) {
  try {
    await Promise.all(SHARE_CARD_FONTS.map(spec => document.fonts.load(spec)));
  } catch {
    // Draw with the fallback face rather than not at all.
  }
  canvas.width = SHARE_CARD.width;
  canvas.height = SHARE_CARD.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  drawShareCard(ctx, model);
}

/**
 * Share the page (the system share sheet, or a copied link) and download the
 * 1200×630 card. The card is drawn here, in the browser, from the same
 * published cells the page shows. Its words are listed as text and the
 * preview, full width under the buttons, is the picture of them.
 */
export function ShareTools({ model, url, title, locale }: { model: ShareCardModel; url: string; title: string; locale: Locale }) {
  const preview = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed' | 'busy'>('idle');
  const [canShare, setCanShare] = useState(false);
  const pt = locale === 'pt';

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    const canvas = preview.current;
    if (!canvas) return;
    renderCard(model, canvas).catch(() => undefined);
  }, [model]);

  const share = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // The reader closed the sheet: nothing to do.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.setTimeout(() => setStatus('idle'), 2400);
  };

  const download = async () => {
    setStatus('busy');
    try {
      const canvas = document.createElement('canvas');
      await renderCard(model, canvas);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('png');
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = model.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  };

  const message = status === 'copied'
    ? (pt ? 'Ligação copiada.' : 'Link copied.')
    : status === 'failed'
      ? (pt ? 'Não foi possível concluir. Tenta outra vez.' : 'That did not work. Try again.')
      : '';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          {pt
            ? 'Partilha a ligação desta página ou descarrega um cartão (1200 × 630 px) para publicar. O cartão diz:'
            : 'Share this page’s link or download a card (1200 × 630 px) to post. The card says:'}
        </p>
        {/* The card's own words, readable at any width; the preview below is the picture of them. */}
        <ul className="mt-3 flex flex-col gap-1.5 text-[15px] text-ink">
          <li className="font-semibold">{model.title} <span className="font-normal text-stone-600">({model.place})</span></li>
          {model.facts.map(fact => (
            <li key={fact.label} className="flex flex-wrap gap-x-2">
              <span>{fact.label}:</span>
              <strong className="font-display font-extrabold tabular-nums">{fact.value}</strong>
            </li>
          ))}
          {(model.scopeNote ?? model.tierNote) && <li className="text-sm text-stone-600">{model.scopeNote ?? model.tierNote}</li>}
          <li className="text-sm text-stone-600">{model.honesty}</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Action variant="secondary" onClick={() => void share()}>
            {canShare ? <Share2 aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
            {canShare ? (pt ? 'Partilhar' : 'Share') : (pt ? 'Copiar ligação' : 'Copy link')}
          </Action>
          <Action variant="secondary" onClick={() => { if (status !== 'busy') void download(); }}>
            <Download aria-hidden="true" className="h-4 w-4" />
            {pt ? 'Descarregar cartão' : 'Download card'}
          </Action>
        </div>
        <p className="mt-2 min-h-5 text-sm text-stone-600" role="status">{message}</p>
      </div>
      {/* Full width of the panel: at desktop widths the card's smallest text (20 px of 1200) renders at 11 px or more. */}
      <figure>
        <canvas
          ref={preview}
          width={SHARE_CARD.width}
          height={SHARE_CARD.height}
          className="block h-auto w-full rounded-xl border border-line bg-paper"
          aria-hidden="true"
        />
        <figcaption className="mt-2 text-xs text-stone-500">
          {pt ? 'Pré-visualização do cartão. O texto que leva está na lista acima.' : 'Card preview. The text it carries is listed above.'}
        </figcaption>
      </figure>
    </div>
  );
}
