'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * A short entrance (200ms fade and lift) for something that appears after the
 * player acts: a new clue, a guess row, the end panel. Nothing moves under
 * prefers-reduced-motion, and the content stays in the accessibility tree
 * throughout. Only for client-rendered content (it starts transparent), and
 * `instant` for what is already there when the page arrives (published numbers
 * do not animate in).
 */
export function Reveal({ children, className = '', as: Tag = 'div', instant = false }: { children: ReactNode; className?: string; as?: 'div' | 'li'; instant?: boolean }) {
  const [shown, setShown] = useState(instant);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <Tag className={`motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out ${shown ? 'opacity-100 translate-y-0' : 'motion-safe:translate-y-1 motion-safe:opacity-0'} ${className}`}>
      {children}
    </Tag>
  );
}
