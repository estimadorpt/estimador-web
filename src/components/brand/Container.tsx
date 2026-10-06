import type { ElementType, ReactNode } from 'react';

/**
 * One page container. The header, the section tab rows, every PageHero and
 * the body of a page share it, so their left edges line up at every width:
 * 16px gutters, centred, at most 80rem (Tailwind's max-w-7xl), exactly the
 * header's box.
 *
 * A narrower reading column is a `measure` inside the container, aligned to
 * its left edge, never a second, narrower centred container: that is what made
 * heroes, tab bars and text start at four different x positions (UXD-05).
 *
 *   <Container>…</Container>                       full width, like the header
 *   <Container measure="reading">…</Container>     prose column, same left edge
 *
 * `width` remains for pages that still centre a narrower box (the older
 * `max-w-4xl mx-auto` pattern). Migrating a page means dropping `width` and
 * using `measure` for its text.
 */
export const CONTAINER_CLASS = 'mx-auto w-full max-w-7xl px-4';

export const CONTAINER_WIDTHS = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
} as const;

export type ContainerWidth = keyof typeof CONTAINER_WIDTHS;

/** Inner column widths, left-aligned inside the container. */
export const MEASURES = {
  full: '',
  /** About 70 characters of body text: methodology, about, notes. */
  reading: 'max-w-3xl',
  /** Tables and two-column reading pages. */
  wide: 'max-w-5xl',
} as const;

export type Measure = keyof typeof MEASURES;

/** The container's class string, for a component that renders its own element. */
export function containerClass(width: ContainerWidth = '7xl'): string {
  return width === '7xl' ? CONTAINER_CLASS : `mx-auto w-full ${CONTAINER_WIDTHS[width]} px-4`;
}

export function Container({ as: Tag = 'div', width = '7xl', measure = 'full', className = '', children }: {
  as?: ElementType;
  width?: ContainerWidth;
  measure?: Measure;
  className?: string;
  children: ReactNode;
}) {
  const inner = MEASURES[measure];
  return (
    <Tag className={`${containerClass(width)} ${className}`}>
      {inner ? <div className={inner}>{children}</div> : children}
    </Tag>
  );
}
