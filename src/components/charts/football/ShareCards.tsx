"use client";

import { Download, Share2 } from "lucide-react";

export interface ShareCard {
  id: string;
  file: string;
  matchday: number;
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
}

export interface CardsManifest {
  season: string;
  matchday: number;
  generated: string;
  cards: ShareCard[];
}

const CARDS_BASE = "/images/cards";

/**
 * Small "partilhar" strip: the matchday cards the model repo renders, offered
 * as previews with direct downloads. Renders nothing when there is nothing to
 * show, so a missing card never leaves a hole in the page.
 */
export function ShareCards({
  manifest,
  locale = "pt",
}: {
  manifest: CardsManifest | null;
  locale?: string;
}) {
  const pt = locale !== "en";
  if (!manifest || manifest.cards.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <Share2 className="w-4 h-4 text-stone-400 self-center" />
        <h2 className="text-xl font-bold tracking-tight">
          {pt ? "Partilhar" : "Share"}
        </h2>
        <span className="text-xs text-stone-400">
          {pt ? `jornada ${manifest.matchday}` : `matchday ${manifest.matchday}`}
        </span>
      </div>
      <p className="text-sm text-stone-500 mb-6 max-w-3xl">
        {pt
          ? "Cartões prontos a publicar, gerados a partir dos mesmos números desta página. Livres de usar, com atribuição a estimador.pt."
          : "Ready-to-post cards, generated from the same numbers as this page. Free to use, with attribution to estimador.pt."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {manifest.cards.map((card) => {
          const href = `${CARDS_BASE}/${card.file}`;
          const title = pt ? card.title_pt : card.title_en;
          const description = pt ? card.description_pt : card.description_en;
          return (
            <figure key={card.id} className="border border-stone-200">
              <a href={href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={href}
                  alt={title}
                  loading="lazy"
                  className="w-full h-auto bg-stone-50"
                />
              </a>
              <figcaption className="p-3 border-t border-stone-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-stone-900">{title}</div>
                    <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                      {description}
                    </p>
                  </div>
                  <a
                    href={href}
                    download
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {pt ? "Descarregar" : "Download"}
                  </a>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
