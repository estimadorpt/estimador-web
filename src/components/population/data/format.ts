import type { Locale } from '@/lib/population/labels';

/**
 * A download size in decimal units: MB with one decimal from a megabyte up,
 * whole kB below that (a 7 kB file would otherwise read "0,0 MB").
 */
export function formatBytes(bytes: number, locale: Locale): string {
  const intl = locale === 'pt' ? 'pt-PT' : 'en-GB';
  if (bytes >= 1e6) {
    return `${new Intl.NumberFormat(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1e6)} MB`;
  }
  if (bytes >= 1e3) return `${new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }).format(bytes / 1e3)} kB`;
  return `${bytes} B`;
}
