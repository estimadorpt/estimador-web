'use client';

// Aguarda parecer, the Lisbon housing game. The game itself (sim/, data/, ui/ and
// habitacao.css) is mirrored from bernardocaldas/habitacao (its src/): change it there and
// copy it across, so the two never drift. Rendered on the client only: it reads the saved
// game from localStorage, which the static export cannot know.
import dynamic from 'next/dynamic';
import { MarkLoading } from '@/components/brand/MarkLoading';
import './habitacao.css';

const App = dynamic(() => import('./ui/App').then((m) => m.App), {
  ssr: false,
  loading: () => (
    <div className="hab embedded" style={{ display: 'grid', placeItems: 'center' }}>
      <MarkLoading height={32} label="Aguarda parecer" />
    </div>
  ),
});

export function HousingGame({ locale }: { locale: 'pt' | 'en' }) {
  return <App lang={locale} embedded />;
}
