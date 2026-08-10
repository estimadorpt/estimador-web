// Portuguese labels for the English strings that arrive in the football data
// feeds (Transfermarkt injury reasons and positions, model position codes).
// Kept out of the message files on purpose: these are data values, not UI copy.

export const injuryReasonPt: Record<string, string> = {
  "unknown injury": "Lesão não especificada",
  "Muscle injury": "Lesão muscular",
  "Cruciate ligament tear": "Rotura dos ligamentos cruzados",
  "Broken fibula": "Fratura do perónio",
  "Back problems": "Problemas nas costas",
  "Adductor injury": "Lesão nos adutores",
  "Achilles tendon rupture": "Rotura do tendão de Aquiles",
  "Metatarsal fracture": "Fratura do metatarso",
  "Knee injury": "Lesão no joelho",
  "Ankle injury": "Lesão no tornozelo",
  "Thigh problems": "Problemas na coxa",
  "Hamstring injury": "Lesão nos isquiotibiais",
  "Shoulder injury": "Lesão no ombro",
  "Calf injury": "Lesão na barriga da perna",
  "Groin injury": "Lesão na virilha",
  "Foot injury": "Lesão no pé",
  "Cruciate ligament injury": "Lesão nos ligamentos cruzados",
  "Meniscus injury": "Lesão no menisco",
  Suspension: "Suspensão",
};

export const positionPt: Record<string, string> = {
  Goalkeeper: "Guarda-redes",
  "Centre-Back": "Defesa central",
  "Left-Back": "Lateral esquerdo",
  "Right-Back": "Lateral direito",
  "Defensive Midfield": "Médio defensivo",
  "Central Midfield": "Médio centro",
  "Attacking Midfield": "Médio ofensivo",
  "Left Midfield": "Médio esquerdo",
  "Right Midfield": "Médio direito",
  "Left Winger": "Extremo esquerdo",
  "Right Winger": "Extremo direito",
  "Second Striker": "Segundo avançado",
  "Centre-Forward": "Ponta de lança",
};

/** Model position codes (G/D/M/F) used by the player skill feed. */
export const positionCodePt: Record<string, string> = {
  G: "Guarda-redes",
  D: "Defesa",
  M: "Médio",
  F: "Avançado",
};

export const positionCodeEn: Record<string, string> = {
  G: "Goalkeeper",
  D: "Defender",
  M: "Midfielder",
  F: "Forward",
};

export function injuryReasonLabel(reason: string | null, locale: string): string {
  if (!reason) return "";
  return locale === "en" ? reason : injuryReasonPt[reason] ?? reason;
}

export function positionLabel(position: string | null, locale: string): string {
  if (!position) return "";
  return locale === "en" ? position : positionPt[position] ?? position;
}
