import { FIELD_LABELS, PEOPLE, exploredPosition, type Lens, type Neighbourhood, type View } from './population';
import { BRAND, MARK_FULL } from '@/lib/brand';
import { WORDMARK_BASELINE, WORDMARK_NAME, WORDMARK_TLD, WORDMARK_X } from '@/lib/brand/wordmark';

/**
 * The card's text. The SVG is drawn into an <img> to make the PNG, where no
 * web font loads, so the site face is asked for and a plain sans stands in; the
 * signature itself is outlined paths and needs no font.
 */
const SANS = "'IBM Plex Sans Variable','IBM Plex Sans','Helvetica Neue',Arial,sans-serif";

/**
 * The site's signature (the interval mark and "estimador.pt", ".pt" in
 * BRAND.muted), drawn from the logo's own paths at `scale`, its 24-unit box
 * starting at (x, y).
 */
function signature(x: number, y: number, scale: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><title>estimador.pt</title><path d="${MARK_FULL}" fill="${BRAND.ink}"/><g transform="translate(${WORDMARK_X} ${WORDMARK_BASELINE})"><path d="${WORDMARK_NAME}" fill="${BRAND.ink}"/><path d="${WORDMARK_TLD}" fill="${BRAND.muted}"/></g></g>`;
}

/** Self-contained postcard: no network assets, external CSS or unpublished data. */
export function postcardSvg(source: SVGSVGElement, locale: 'pt' | 'en', view: View, animated: boolean, alone: boolean): string {
  const scene = source.cloneNode(true) as SVGSVGElement;
  scene.setAttribute('x', '20'); scene.setAttribute('y', '120');
  scene.setAttribute('width', '1160'); scene.setAttribute('height', '650');
  scene.removeAttribute('class');
  scene.querySelectorAll('[tabindex]').forEach(el=>{el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-pressed');});
  scene.querySelectorAll('.mini-person').forEach((node, i) => {
    const element = node as SVGElement;
    const pos = {x:Number(element.dataset.x),y:Number(element.dataset.y)};
    element.removeAttribute('style'); element.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
    element.setAttribute('opacity', element.dataset.highlighted === 'false' ? '.12' : '1');
    element.querySelectorAll('[style]').forEach(child => child.removeAttribute('style'));
    if (animated && view === 'village') {
      const motion = document.createElementNS('http://www.w3.org/2000/svg','animateTransform');
      motion.setAttribute('attributeName','transform'); motion.setAttribute('type','translate');
      motion.setAttribute('values',`${pos.x} ${pos.y};${pos.x+(i%2?42:-42)} ${pos.y+20};${pos.x} ${pos.y}`);
      motion.setAttribute('dur',`${8+i%7}s`); motion.setAttribute('repeatCount','indefinite');
      element.appendChild(motion);
    } else if (animated) {
      const from = source.dataset.compact === 'true' ? {x: 200, y: 220} : exploredPosition(PEOPLE[i], 'village', false, source.dataset.neighbourhood as Neighbourhood ?? 'town', 'age');
      const motion = document.createElementNS('http://www.w3.org/2000/svg','animateTransform');
      motion.setAttribute('attributeName','transform'); motion.setAttribute('type','translate');
      motion.setAttribute('values',`${from.x} ${from.y};${pos.x} ${pos.y};${pos.x} ${pos.y}`);
      motion.setAttribute('keyTimes','0;0.4;1'); motion.setAttribute('dur','5s'); motion.setAttribute('fill','freeze');
      element.appendChild(motion);
    }
  });
  if (animated && view === 'village') {
    const motions = [
      ['.land-tram', 'translate', '0 0;425 140;425 140;0 0', '18s'],
      ['.land-boat', 'translate', '-15 35;45 -60;-15 35', '22s'],
      ['.land-windmill', 'rotate', '0;360', '13s'],
      ['.land-wave', 'translate', '0 0;8 4;0 0', '4s'],
    ];
    motions.forEach(([selector, type, values, duration]) => {
      scene.querySelectorAll(selector).forEach(element => {
        const motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        motion.setAttribute('attributeName', 'transform'); motion.setAttribute('type', type);
        motion.setAttribute('values', values); motion.setAttribute('dur', duration);
        motion.setAttribute('repeatCount', 'indefinite'); element.appendChild(motion);
      });
    });
  }
  const labels = locale === 'pt' ? {views:{village:'Um bairro imaginado',ages:'As idades de um pequeno mundo',households:'Há muitas maneiras de ser família'},demo:'Demonstração, dados fictícios',note:'100 pessoas inventadas · 30 agregados · não representa Portugal',filter:'Em destaque: quem vive sozinho'} : {views:{village:'An imagined neighbourhood',ages:'The ages of a small world',households:'Many ways to be a household'},demo:'Demonstration, fictional data',note:'100 invented people · 30 households · not representative of Portugal',filter:'Highlighted: people living alone'};
  const groupNote = source.dataset.selectedGroup !== undefined ? ` · ${FIELD_LABELS[locale][source.dataset.lens as Lens][Number(source.dataset.selectedGroup)]}` : '';
  // The card in the instrument's grammar: white ground, the outlined signature top left (its
  // baseline on y 59, at 1.25 × the logo's 24px box), the title in ink, the demonstration label
  // in sentence case, semibold ink, on the right, a 1px ink rule under the head and a rule
  // above the foot, which is in graphite.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="880" viewBox="0 0 1200 880"><rect width="1200" height="880" fill="${BRAND.paper}"/>${signature(55, 35, 1.25)}<text x="1145" y="54" text-anchor="end" fill="${BRAND.ink}" font-family="${SANS}" font-size="16" font-weight="600">${labels.demo}</text><text x="55" y="109" fill="${BRAND.ink}" font-family="${SANS}" font-size="34" font-weight="700">${labels.views[view]}${source.dataset.selectedHouse ? ` · ${locale==='pt'?'Agregado':'Household'} ${Number(source.dataset.selectedHouse)+1}` : ''}</text><path d="M55 124.5H1145" stroke="${BRAND.ink}" stroke-width="1"/>${new XMLSerializer().serializeToString(scene)}<path d="M55 784.5H1145" stroke="${BRAND.line}" stroke-width="1"/><g fill="${BRAND.muted}" font-family="${SANS}" font-size="16"><text x="55" y="811">${labels.note}${groupNote}${alone ? ` · ${labels.filter}` : ''}</text><text x="55" y="845">estimador.pt/populacao/miniatura</text></g></svg>`;
}
export async function pngFromSvg(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml'}));
  try {
    const img = new Image();
    await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Image rendering failed'));img.src=url;});
    const canvas = document.createElement('canvas'); canvas.width=1200;canvas.height=880;
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img,0,0);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Export failed')),'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
export function downloadBlob(blob: Blob, filename: string) {
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
