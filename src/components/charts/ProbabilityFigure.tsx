import { electionProbabilityParts } from '@/lib/election-display';

/**
 * A headline probability. Bounded values ("mais de 99%", "menos de 1%") set
 * the bound as small text before the number: in Manrope 800 a bare ">" or "<"
 * reads as a chevron. No hooks, so server and client components share it.
 */
export function ProbabilityFigure({ probability, locale, className = '' }: { probability: number; locale: string; className?: string }) {
  const { bound, value } = electionProbabilityParts(probability, locale);
  return (
    <span className={className}>
      {bound && <span className="mr-1 text-[max(11px,0.42em)] font-bold tracking-normal">{bound}</span>}
      {value}
    </span>
  );
}
