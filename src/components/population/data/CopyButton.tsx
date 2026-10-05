'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Copies a fixed text (an attribution, a citation, a command). The result is
 * announced in words; when the clipboard is unavailable the reader is told to
 * select the text instead.
 */
export function CopyButton({ text, label, locale }: { text: string; label: string; locale: 'pt' | 'en' }) {
  const pt = locale === 'pt';
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 4000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-cream px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-parchment"
      >
        {state === 'copied' ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
        {label}
      </button>
      <span role="status" aria-live="polite" className="text-sm text-stone-600">
        {state === 'copied' ? (pt ? 'Copiado.' : 'Copied.') : state === 'failed' ? (pt ? 'Não foi possível copiar: seleciona o texto acima.' : 'Could not copy: select the text above.') : ''}
      </span>
    </div>
  );
}
