/**
 * Server-safe (no 'use client'): the parish shell renders this script in its
 * HTML, and client.ts takes the requests it started.
 */
import { POPULATION_DATA_PATH } from '@/lib/config/population';

/**
 * The parish shell's first script: it reads the code from the address and
 * starts meta.json and parish/<CODE>.json at once, while the page's JavaScript
 * is still downloading, so the parish arrives about 1.5 s sooner on a slow
 * phone (UXM2V-01). ParishPage then takes those requests instead of starting
 * its own. Plain ES5, no dependencies; anything unexpected is ignored.
 */
export function parishPrefetchScript(): string {
  const base = JSON.stringify(POPULATION_DATA_PATH);
  // No backslashes: this is emitted verbatim into the HTML.
  return `(function(){try{var m=new RegExp('/populacao/freguesia/([^/]+)/?$').exec(location.pathname);if(!m)return;var c=decodeURIComponent(m[1]).trim().toUpperCase();if(!/^[0-9A-Z]{6}$/.test(c))return;var b=${base};var p=window.__populationPrefetch=window.__populationPrefetch||{};[b+'/meta.json',b+'/parish/'+c+'.json'].forEach(function(u){var r=fetch(u);r.catch(function(){});p[u]=r;});}catch(e){}})();`;
}
