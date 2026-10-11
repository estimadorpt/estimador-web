/** The explainer's title: the page's h1 and its metadata title, kept as one string per locale. */
export const MINIATURA_TITLE = {
  pt: 'Uma população sintética lê-se agregado a agregado',
  en: 'A synthetic population is read household by household',
} as const;

/**
 * The real parish the explainer ends on: a small one (a village in Águeda),
 * after a neighbourhood of 100 invented people. Its page carries the figures;
 * the explainer prints only the name (copy.test.ts checks it against places.json).
 */
export const REAL_PARISH = { code: '010103', name: 'Aguada de Cima', municipality: 'Águeda' } as const;
