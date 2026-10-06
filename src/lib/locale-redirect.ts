/**
 * The 404 page's first job: send an address typed without a locale to the
 * Portuguese page it names.
 *
 * Every page lives under /pt/ or /en/. People type (and the press prints)
 * "estimador.pt/populacao/misteriosa" or paste a club link with the prefix
 * lost. staticwebapp.config.json answers the section roots and the shareable
 * pages with a real 301, but Azure Static Web Apps cannot carry a wildcard
 * into a redirect target, so a parish, a region, a club or a match page would
 * otherwise end at the 404. Azure serves /404.html for every such address;
 * this inline script, which runs before anything renders, replaces the
 * address with /pt + the same path (trailing slash, query and hash kept).
 *
 * Only known section prefixes are touched, so a mistyped address still gets
 * the real 404, and an address already under /pt or /en never loops.
 */
export const LOCALE_SECTIONS = [
  'populacao', 'desporto', 'eleicoes', 'economia', 'artigos',
  'sobre', 'metodologia', 'privacidade', 'marca',
] as const;

export const LOCALE_REDIRECT_SCRIPT = `(function(){try{var l=window.location,p=l.pathname;`
  + `if(!/^\\/(${LOCALE_SECTIONS.join('|')})(\\/|$)/.test(p))return;`
  + `var last=p.split('/').pop()||'';`
  + `var t='/pt'+p+(p.charAt(p.length-1)==='/'||last.indexOf('.')>=0?'':'/');`
  + `l.replace(t+l.search+l.hash);}catch(e){}})();`;
