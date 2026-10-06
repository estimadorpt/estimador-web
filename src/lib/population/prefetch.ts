/**
 * Server-only: the parish shell (src/app/[locale]/populacao/freguesia/[code]/page.tsx)
 * renders this script in its HTML; client.ts takes the requests it started.
 */
import { POPULATION_DATA_PATH } from '@/lib/config/population';
import { SITE_URL } from '@/lib/metadata';

/**
 * Where the script leaves its requests: data URL → fetch() promise. client.ts
 * reads the same window property (declared there) and takes each one once.
 */
export const PARISH_PREFETCH_KEY = '__populationPrefetch';

/**
 * The attribute that marks the head tags the parish page owns. head.ts
 * (`PARISH_HEAD_ATTR`, a 'use client' module, so not importable here) uses the
 * same literal: it re-values these tags once the page knows the parish, drops
 * them for a code that is not one, and removes them when the reader leaves.
 */
const OWNED = 'data-parish-head';

/**
 * The parish shell's one early script. All 3,092 parish pages are one exported
 * shell behind a host rewrite, so the static HTML cannot name the parish.
 * Before any bundle loads, this reads the code from the address (normalised as
 * `normaliseParishCode` does) and:
 *
 *  - starts meta.json and parish/{CODE}.json, so the data that draws the page
 *    is on its way while the JavaScript downloads instead of being asked for
 *    after hydration (UXM2V-01, SP2-10). These are fetch() calls, not
 *    <link rel=preload> elements: a preload link in the head before hydration
 *    made React add a second og:title and twitter:title;
 *  - writes the parish's canonical and pt/en/x-default alternates (SPV-03), so
 *    a crawler that runs scripts but not the app sees them from the start.
 *
 * The data arriving this early is what lets head.ts re-value the shell's
 * og:title before Next's metadata hydrates; head.ts drops the duplicate React
 * then adds (SP2-09). Plain ES5, no backslashes (emitted verbatim into the
 * HTML), anything unexpected ignored; inert for an address without a valid code.
 */
export function parishShellScript(locale: string): string {
  const site = JSON.stringify(SITE_URL);
  const data = JSON.stringify(POPULATION_DATA_PATH);
  return `(function(){try{var l=${JSON.stringify(locale)};var m=new RegExp('^/'+l+'/populacao/freguesia/([^/]+)/?$').exec(location.pathname);if(!m)return;var c=decodeURIComponent(m[1]).trim().toUpperCase();if(!/^[0-9A-Z]{6}$/.test(c))return;var d=${data};var p=window.${PARISH_PREFETCH_KEY}=window.${PARISH_PREFETCH_KEY}||{};[d+'/meta.json',d+'/parish/'+c+'.json'].forEach(function(u){var r=fetch(u);r.catch(function(){});p[u]=r;});var h=document.head;function u(x){return ${site}+'/'+x+'/populacao/freguesia/'+c+'/';}function add(a){var e=document.createElement('link');for(var k in a)e.setAttribute(k,a[k]);e.setAttribute('${OWNED}','');h.appendChild(e);}add({rel:'canonical',href:u(l)});add({rel:'alternate',hreflang:'pt',href:u('pt')});add({rel:'alternate',hreflang:'en',href:u('en')});add({rel:'alternate',hreflang:'x-default',href:u('pt')});}catch(e){}})();`;
}
