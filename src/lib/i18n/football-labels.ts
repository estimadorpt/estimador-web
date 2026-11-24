// Portuguese labels for the English strings that arrive in the football data
// feeds (injury reasons and positions from SofaScore line-ups, and earlier
// from Transfermarkt; model position codes).
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
  "Meniscus tear": "Rotura do menisco",
  Fitness: "Falta de forma física",
  "Torn lateral knee ligament": "Rotura do ligamento lateral do joelho",
  "Broken ankle": "Fratura do tornozelo",
  "Pubic bone bruise": "Contusão no osso púbico",
  "Hip problems": "Problemas na anca",
  "Knock": "Pancada",
  "Ill": "Doença",
  "Illness": "Doença",
  "Ligament injury": "Lesão ligamentar",
  "Ankle sprain": "Entorse no tornozelo",
  "Torn muscle fibre": "Rotura de fibras musculares",
  "Hamstring strain": "Distensão nos isquiotibiais",
  "Calf problems": "Problemas na barriga da perna",
  "Broken foot": "Fratura do pé",
  "Concussion": "Concussão",
  "Lumbar vertebra problems": "Problemas nas vértebras lombares",
  "Torn knee ligaments": "Rotura dos ligamentos do joelho",
  Suspension: "Suspensão",
  // SofaScore's reasons, as the football export words them (19 Nov 2026).
  "Red card suspension": "Castigo por expulsão",
  "Yellow card accumulation": "Acumulação de amarelos",
  "Card suspension": "Castigo por cartões",
  "Disciplinary suspension": "Castigo disciplinar",
  "Physical discomfort": "Desconforto físico",
  "Broken leg": "Fratura da perna",
};

// Transfermarkt adds new reasons through the season, and the injury collector
// publishes them unattended. A reason the table above lacks must still read in
// Portuguese and must never fail the build (17 Oct 2026: two new reasons
// turned main red and stopped deploys). So the common shapes ("Knee injury",
// "Broken wrist", "Torn calf muscle") are composed from a body-part list, and
// anything else falls back to a neutral "Indisponível" / "Suspensão".

type Part = { name: string; g: "m" | "f"; pl?: boolean };

const BODY_PARTS: Record<string, Part> = {
  knee: { name: "joelho", g: "m" },
  ankle: { name: "tornozelo", g: "m" },
  foot: { name: "pé", g: "m" },
  toe: { name: "dedo do pé", g: "m" },
  heel: { name: "calcanhar", g: "m" },
  hip: { name: "anca", g: "f" },
  back: { name: "costas", g: "f", pl: true },
  shoulder: { name: "ombro", g: "m" },
  thigh: { name: "coxa", g: "f" },
  calf: { name: "barriga da perna", g: "f" },
  "calf muscle": { name: "músculo da barriga da perna", g: "m" },
  groin: { name: "virilha", g: "f" },
  hamstring: { name: "isquiotibiais", g: "m", pl: true },
  adductor: { name: "adutores", g: "m", pl: true },
  abdominal: { name: "abdominais", g: "m", pl: true },
  meniscus: { name: "menisco", g: "m" },
  "achilles tendon": { name: "tendão de Aquiles", g: "m" },
  tendon: { name: "tendão", g: "m" },
  metatarsal: { name: "metatarso", g: "m" },
  fibula: { name: "perónio", g: "m" },
  tibia: { name: "tíbia", g: "f" },
  shin: { name: "canela", g: "f" },
  leg: { name: "perna", g: "f" },
  arm: { name: "braço", g: "m" },
  hand: { name: "mão", g: "f" },
  finger: { name: "dedo da mão", g: "m" },
  wrist: { name: "pulso", g: "m" },
  elbow: { name: "cotovelo", g: "m" },
  rib: { name: "costela", g: "f" },
  ribs: { name: "costelas", g: "f", pl: true },
  collarbone: { name: "clavícula", g: "f" },
  clavicle: { name: "clavícula", g: "f" },
  head: { name: "cabeça", g: "f" },
  neck: { name: "pescoço", g: "m" },
  nose: { name: "nariz", g: "m" },
  face: { name: "cara", g: "f" },
  jaw: { name: "maxilar", g: "m" },
  eye: { name: "olho", g: "m" },
  muscle: { name: "músculo", g: "m" },
  ligament: { name: "ligamento", g: "m" },
  ligaments: { name: "ligamentos", g: "m", pl: true },
  "knee ligament": { name: "ligamento do joelho", g: "m" },
  "knee ligaments": { name: "ligamentos do joelho", g: "m", pl: true },
  "ankle ligament": { name: "ligamento do tornozelo", g: "m" },
  "cruciate ligament": { name: "ligamentos cruzados", g: "m", pl: true },
  "lumbar vertebra": { name: "vértebras lombares", g: "f", pl: true },
  vertebra: { name: "vértebra", g: "f" },
  "pubic bone": { name: "osso púbico", g: "m" },
  pelvis: { name: "bacia", g: "f" },
};

/** "no joelho", "nas costas" (em + article). */
function inPart(p: Part): string {
  return `${p.g === "m" ? "no" : "na"}${p.pl ? "s" : ""} ${p.name}`;
}

/** "do joelho", "das costas" (de + article). */
function ofPart(p: Part): string {
  return `${p.g === "m" ? "do" : "da"}${p.pl ? "s" : ""} ${p.name}`;
}

// [pattern, noun, in|of]; the captured words name the body part.
const SHAPES: [RegExp, string, "in" | "of"][] = [
  [/^(.+) injury$/i, "Lesão", "in"],
  [/^(.+) problems?$/i, "Problemas", "in"],
  [/^(.+) (?:surgery|operation)$/i, "Cirurgia", "in"],
  [/^(.+) inflammation$/i, "Inflamação", "in"],
  [/^(.+) sprain$/i, "Entorse", "in"],
  [/^(.+) strain$/i, "Distensão", "in"],
  [/^(.+) (?:bruise|contusion)$/i, "Contusão", "in"],
  [/^(.+) (?:fracture|break)$/i, "Fratura", "of"],
  [/^broken (.+)$/i, "Fratura", "of"],
  [/^fractured (.+)$/i, "Fratura", "of"],
  [/^(.+) (?:tear|rupture)$/i, "Rotura", "of"],
  [/^(?:torn|ruptured) (.+)$/i, "Rotura", "of"],
  [/^partially torn (.+)$/i, "Rotura parcial", "of"],
];

/** Compose a Portuguese label from a reason's shape, or null. */
export function composeInjuryReasonPt(reason: string): string | null {
  const text = reason.trim();
  for (const [pattern, noun, rel] of SHAPES) {
    const match = pattern.exec(text);
    if (!match) continue;
    const part = BODY_PARTS[match[1].trim().toLowerCase()];
    if (part) return `${noun} ${rel === "in" ? inPart(part) : ofPart(part)}`;
  }
  return null;
}

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
  // SofaScore's broad positions (the line-ups give G/D/M/F).
  Defender: "Defesa",
  Midfielder: "Médio",
  Forward: "Avançado",
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

/**
 * The reason as the reader's language should show it. English pages keep
 * the source's text. Portuguese pages use the table, then a composed label,
 * then the neutral "Indisponível" (or "Suspensão" for a suspension): never English.
 */
export function injuryReasonLabel(
  reason: string | null,
  locale: string,
  kind: string = "injury",
): string {
  if (!reason) return "";
  if (locale === "en") return reason;
  return (
    injuryReasonPt[reason] ??
    composeInjuryReasonPt(reason) ??
    (kind === "suspension" ? "Suspensão" : "Indisponível")
  );
}

export function positionLabel(position: string | null, locale: string): string {
  if (!position) return "";
  return locale === "en" ? position : positionPt[position] ?? position;
}
