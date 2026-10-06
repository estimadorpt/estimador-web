/**
 * Server-only: the consultation shell (src/app/[locale]/populacao/consulta/page.tsx)
 * renders this script in its HTML, before the header.
 */
import { POPULATION_DATA_PATH, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { RECIPE_COPY } from '@/lib/population/labels';
import { PARISH_PREFETCH_KEY } from '@/lib/population/prefetch';

/**
 * The permalink's early script (SEO3V-M2). A shared result link,
 * /populacao/v/{release}/q/{id}, is served this shell, whose React resolver
 * fetched the id's lookup only after hydration and then loaded the parish
 * page: two full page loads before the reader saw the figure. Before any
 * bundle loads, this reads the address with the same rules as `resolve.ts`
 * (`parseCanonicalPath`, a full id or a prefix only one id starts with, the
 * bucket `id[3]`, `targetFor`'s anchors), fetches the bucket and replaces
 * the location with the parish page at the card's anchor.
 *
 * It leaves its request in `window.__populationPrefetch` (as the parish
 * shell's does), so the React resolver, which still handles every case this
 * script ignores (another release, an unknown or ambiguous id, a failed
 * fetch), reads the same response rather than fetching it again: the script
 * reads a clone. Plain ES5 with no backslashes (emitted verbatim into the
 * HTML); anything unexpected is ignored.
 */
export function consultaShellScript(locale: 'pt' | 'en'): string {
  const anchors = Object.fromEntries(Object.entries(RECIPE_COPY).map(([recipe, copy]) => [recipe, copy.anchor]));
  const parish = POPULATION_ROUTES.parish('');
  return `(function(){try{var m=new RegExp('^(?:/(pt|en))?/populacao/v/([^/]+)/q/([^/]+)/?$','i').exec(location.pathname);if(!m)return;var rel=decodeURIComponent(m[2]).replace(/^v/i,'');if(rel!==${JSON.stringify(POPULATION_RELEASE)})return;var id=decodeURIComponent(m[3]).trim().toLowerCase();var full=/^q1_[0-9a-f]{20}$/.test(id);if(!full&&!/^q1_[0-9a-f]{8,19}$/.test(id))return;var loc=m[1]?m[1].toLowerCase():${JSON.stringify(locale)};var u=${JSON.stringify(POPULATION_DATA_PATH)}+'/q/'+id.charAt(3)+'.json';var r=fetch(u);r.catch(function(){});var p=window.${PARISH_PREFETCH_KEY}=window.${PARISH_PREFETCH_KEY}||{};p[u]=r;var a=${JSON.stringify(anchors)};r.then(function(x){if(!x.ok)throw 0;return x.clone().json();}).then(function(t){var e=null;if(full){if(Object.prototype.hasOwnProperty.call(t,id))e=t[id];}else{var k=Object.keys(t).filter(function(key){return key.indexOf(id)===0;});if(k.length===1)e=t[k[0]];}if(!e)return;var c=e[0],h;if(c==='PT')h='/'+loc+'/populacao/#idade';else if(/^[0-9A-Z]{6}$/.test(c))h='/'+loc+${JSON.stringify(parish)}+c+'/'+(Object.prototype.hasOwnProperty.call(a,e[1])?'#'+a[e[1]]:'');else return;location.replace(h);}).catch(function(){});}catch(e){}})();`;
}
