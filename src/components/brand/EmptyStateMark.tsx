import { BRAND } from '@/lib/brand';
import { Mosaic } from './Mosaic';

/**
 * The one mark an empty, error, refused or unavailable state carries: the
 * `quarters` mosaic at 72px, the same at every width, beside or above the
 * message and its next step. Size and variant live here so every state draws
 * the same thing; the 404 is the one larger mosaic (NotFoundBody), and the
 * rest of the mosaic belongs to brand material (/marca, the OG brand card, the
 * social kit). Never beside a number or a chart.
 *
 * `surface` is the colour the state sits on: it fills the mosaic's window
 * circle, which is drawn over the quarter rather than cut out of it.
 *
 * No hooks and no messages: server pages and client components both use it.
 */
export function EmptyStateMark({ surface = 'cream' }: { surface?: 'paper' | 'cream' | 'parchment' }) {
  return <Mosaic variant="quarters" className="size-18 shrink-0" ground={BRAND[surface]} />;
}
