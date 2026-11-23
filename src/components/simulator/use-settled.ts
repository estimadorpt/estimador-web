import { useEffect, useState } from 'react';

/** A value that follows `value` once it has stopped changing for `ms` (a dragged slider fires many changes). */
export function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}
