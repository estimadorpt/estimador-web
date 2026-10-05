/**
 * The parish share card: a 1200×630 PNG drawn on a canvas in the reader's
 * browser.
 *
 * `shareCardModel` decides every word on the card and is pure (tested);
 * `drawShareCard` only lays those words out on a 2D context it is given. The
 * facts are published cells quoted with the producer's display string and the
 * population each one is a share of; a município fallback says so in the line
 * itself, because a card travels without the page around it.
 */
import { BRAND, MARK_FULL } from '@/lib/brand';
import { POPULATION_RELEASE } from '@/lib/config/population';
import type { ParishRecord, PopulationRecipe, PortraitRecipe, RecipeName } from '@/types/population';
import { headlineCell, formatDisplay } from './compact';
import { HONESTY, RECIPE_COPY, type Locale } from './labels';

export const SHARE_CARD = { width: 1200, height: 630 } as const;

type Text = Record<Locale, string>;

/**
 * Candidate facts, in the order the card prefers them. Each names one cell
 * and says whose share it is; the first three that are published are used.
 * The order is editorial (people first, then homes), never by value.
 */
export const SHARE_FACTS: Array<{ recipe: PortraitRecipe; cell: Record<string, string>; label: Text }> = [
  { recipe: 'elders_alone', cell: { living_alone: 'yes' }, label: RECIPE_COPY.elders_alone.short },
  { recipe: 'multigenerational', cell: { multigenerational: 'yes' }, label: RECIPE_COPY.multigenerational.short },
  { recipe: 'household_size', cell: { hh_size_bin: '1' }, label: { pt: 'Agregados de uma só pessoa', en: 'One-person households' } },
  { recipe: 'education', cell: { education_level_coarse5: '5' }, label: { pt: 'Pessoas com ensino superior (todas as idades)', en: 'People with tertiary education (all ages)' } },
  { recipe: 'employment', cell: { employment_status_coarse3: '11' }, label: { pt: 'Pessoas empregadas (todas as idades)', en: 'Employed people (all ages)' } },
];

export interface ShareFact {
  /** Who is counted, with the município named on a fallback. */
  label: string;
  /** The producer's display value in the reader's number format ("17,2%"). */
  value: string;
  /** The line as one sentence: "Pessoas com 65+ que vivem sozinhas: 17,2%". */
  text: string;
  /** Whether the figure is the município's. */
  fallback: boolean;
}

export interface ShareCardModel {
  eyebrow: string;
  title: string;
  /** "Águeda · Aveiro". */
  place: string;
  facts: ShareFact[];
  /** "Valores do concelho de Águeda" when any fact is the município's. */
  scopeNote: string | null;
  honesty: string;
  footer: string;
  fileName: string;
}

/** "Quem vive em Aguada de Cima?" / "Quem vive na União das freguesias de …?" */
export function parishQuestion(name: string, locale: Locale): string {
  if (locale === 'en') return `Who lives in ${name}?`;
  return /^União das freguesias/i.test(name) ? `Quem vive na ${name}?` : `Quem vive em ${name}?`;
}

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export interface ShareCardInput {
  record: ParishRecord;
  recipes: Record<RecipeName, PopulationRecipe>;
  /** The parish name as places.json spells it. */
  name: string;
  municipalityName: string;
  regionName: string;
  locale: Locale;
  maxFacts?: number;
}

export function shareCardModel({ record, recipes, name, municipalityName, regionName, locale, maxFacts = 3 }: ShareCardInput): ShareCardModel {
  const fallbackName = record.fallback?.name ?? municipalityName;
  const facts: ShareFact[] = [];
  for (const candidate of SHARE_FACTS) {
    if (facts.length >= maxFacts) break;
    const response = record.responses[candidate.recipe];
    if (!response || response.decision === 'refuse') continue;
    const cell = headlineCell(response, recipes[candidate.recipe], candidate.cell);
    if (!cell) continue;
    const fallback = response.decision === 'fallback';
    const scope = fallback ? (locale === 'pt' ? ` (concelho de ${fallbackName})` : ` (${fallbackName} municipality)`) : '';
    const label = `${candidate.label[locale]}${scope}`;
    const value = formatDisplay(cell.display, locale);
    facts.push({ label, value, text: `${label}: ${value}`, fallback });
  }
  const anyFallback = facts.some(fact => fact.fallback);
  return {
    eyebrow: locale === 'pt' ? 'População sintética · Censos 2021' : 'Synthetic population · 2021 Census',
    title: parishQuestion(name, locale),
    place: [municipalityName, regionName].filter(Boolean).join(' · '),
    facts,
    scopeNote: anyFallback
      ? (locale === 'pt' ? `Valores do concelho de ${fallbackName}, que inclui esta freguesia.` : `Figures for ${fallbackName} municipality, which includes this parish.`)
      : null,
    honesty: HONESTY.synthetic[locale],
    footer: locale === 'pt'
      ? `estimador.pt · População sintética v${POPULATION_RELEASE} · Censos 2021`
      : `estimador.pt · Synthetic population v${POPULATION_RELEASE} · 2021 Census`,
    fileName: `estimador-${record.code.toLowerCase()}-${slug(name) || 'freguesia'}.png`,
  };
}

/** Greedy word wrap against a width measure; the last allowed line ends in "…" if the text does not fit. */
export function wrapLines(text: string, maxWidth: number, measure: (text: string) => number, maxLines = Infinity): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || measure(next) <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.includes(' ') && measure(`${last}…`) > maxWidth) last = last.slice(0, last.lastIndexOf(' '));
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/** The largest size from `sizes` at which the text wraps into `maxLines` or fewer. */
export function fitFontSize(text: string, maxWidth: number, maxLines: number, sizes: number[], measureAt: (text: string, size: number) => number): number {
  for (const size of sizes) {
    if (wrapLines(text, maxWidth, t => measureAt(t, size)).length <= maxLines) return size;
  }
  return sizes[sizes.length - 1];
}

const FONT = 'Manrope, system-ui, sans-serif';
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

/** The weights the card uses; load them before drawing (document.fonts.load). */
export const SHARE_CARD_FONTS = [font(800, 52), font(700, 20), font(600, 21), font(500, 24)];

/**
 * Lays the model out: the signature top left, the question and the place on
 * the left, up to three facts in a cream panel on the right, and the honesty
 * line and the source along the bottom. Paper ground, ink text, no mosaic.
 */
export function drawShareCard(ctx: CanvasRenderingContext2D, model: ShareCardModel): void {
  const { width, height } = SHARE_CARD;
  const pad = 72;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  ctx.fillStyle = BRAND.paper;
  ctx.fillRect(0, 0, width, height);

  // Signature: the interval mark (48×24 box) and the wordmark, Manrope 800.
  const markHeight = 30;
  ctx.save();
  ctx.translate(pad, 56);
  ctx.scale(markHeight / 24, markHeight / 24);
  ctx.fillStyle = BRAND.ink;
  ctx.fill(new Path2D(MARK_FULL));
  ctx.restore();
  ctx.font = font(800, 32);
  ctx.fillStyle = BRAND.ink;
  const wordX = pad + markHeight * 2 + 14;
  ctx.fillText('estimador', wordX, 56 + 26);
  ctx.fillStyle = BRAND.faint;
  ctx.fillText('.pt', wordX + ctx.measureText('estimador').width, 56 + 26);

  // Left column: eyebrow, question, place.
  const hasFacts = model.facts.length > 0;
  const leftWidth = hasFacts ? 500 : width - pad * 2;
  ctx.fillStyle = BRAND.muted;
  ctx.font = font(700, 20);
  ctx.fillText(model.eyebrow.toUpperCase(), pad, 172);

  const measureAt = (text: string, size: number) => { ctx.font = font(800, size); return ctx.measureText(text).width; };
  const titleSize = fitFontSize(model.title, leftWidth, 4, [56, 50, 44, 40, 36], measureAt);
  ctx.font = font(800, titleSize);
  ctx.fillStyle = BRAND.ink;
  const titleLines = wrapLines(model.title, leftWidth, t => ctx.measureText(t).width, 4);
  const lineHeight = Math.round(titleSize * 1.12);
  let y = 172 + 22 + lineHeight;
  for (const line of titleLines) { ctx.fillText(line, pad, y); y += lineHeight; }

  ctx.font = font(500, 26);
  ctx.fillStyle = BRAND.muted;
  for (const line of wrapLines(model.place, leftWidth, t => ctx.measureText(t).width, 2)) {
    y += 6;
    ctx.fillText(line, pad, y);
    y += 30;
  }
  if (model.scopeNote) {
    ctx.font = font(600, 21);
    ctx.fillStyle = BRAND.ink;
    y += 14;
    for (const line of wrapLines(model.scopeNote, leftWidth, t => ctx.measureText(t).width, 2)) {
      ctx.fillText(line, pad, y);
      y += 27;
    }
  }

  // Right column: the facts in a cream panel with a hairline.
  if (hasFacts) {
    const panelX = 620;
    const panelY = 112;
    const panelW = width - pad - panelX;
    const panelH = 384;
    ctx.fillStyle = BRAND.cream;
    ctx.strokeStyle = BRAND.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(panelX, panelY, panelW, panelH, 20);
    else ctx.rect(panelX, panelY, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    const inner = panelW - 64;
    const rowH = panelH / 3;
    model.facts.forEach((fact, i) => {
      const top = panelY + i * rowH;
      if (i > 0) {
        ctx.strokeStyle = BRAND.line;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(panelX + 32, top);
        ctx.lineTo(panelX + panelW - 32, top);
        ctx.stroke();
      }
      ctx.fillStyle = BRAND.ink;
      ctx.font = font(800, 48);
      ctx.fillText(fact.value, panelX + 32, top + 62);
      ctx.font = font(500, 21);
      ctx.fillStyle = BRAND.ink;
      wrapLines(fact.label, inner, t => ctx.measureText(t).width, 2).forEach((line, j) => {
        ctx.fillText(line, panelX + 32, top + 94 + j * 25);
      });
    });
  }

  // Bottom: the honesty line, never shortened, then the source.
  ctx.strokeStyle = BRAND.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, height - 102);
  ctx.lineTo(width - pad, height - 102);
  ctx.stroke();
  ctx.font = font(500, 20);
  ctx.fillStyle = BRAND.muted;
  ctx.fillText(model.honesty, pad, height - 68);
  ctx.font = font(700, 20);
  ctx.fillStyle = BRAND.ink;
  ctx.fillText(model.footer, pad, height - 36);

  ctx.restore();
}
