/** Design fixture only. Never import unpublished population records here. */
export const DEMO_RELEASE = 'miniatura-demo-v2';
export type View = 'village' | 'ages' | 'households';
export type Person = { id: number; household: number; member: number; size: number; age: number; band: number };
export const VIEWS: View[] = ['village', 'ages', 'households'];
export const AGE_LABELS = ['0–17', '18–39', '40–64', '65+'];
export const PEOPLE: Person[] = [];
for (let household = 0; household < 30; household++) {
  const size = [1, 2, 3, 4, 5, 5][household % 6];
  for (let member = 0; member < size; member++) {
    // Adults anchor every household; larger households can include children.
    const age = size === 1 ? 24 + (household / 6) * 15 : member >= 2 ? 4 + ((household * 3 + member * 2) % 14) : 24 + ((household * 11 + member * 7) % 62);
    PEOPLE.push({ id: PEOPLE.length, household, member, size, age, band: age < 18 ? 0 : age < 40 ? 1 : age < 65 ? 2 : 3 });
  }
}
export const HOUSEHOLDS = Array.from({ length: 30 }, (_, id) => ({ id, people: PEOPLE.filter(p => p.household === id) }));
export function housePosition(id: number) {
  const col = id % 6, row = Math.floor(id / 6);
  return { x: 450 + (col - row) * 67, y: 102 + (col + row) * 38 };
}
export function personPosition(person: Person, view: View, compact = false) {
  if (view === 'village') {
    const house = housePosition(person.household);
    return { x: house.x + 19 + person.member * 8, y: house.y + 36 + (person.member % 2) * 6 };
  }
  const group = view === 'ages' ? person.band : person.size - 1;
  const members = PEOPLE.filter(p => view === 'ages' ? p.band === group : p.size - 1 === group);
  const index = members.findIndex(p => p.id === person.id);
  if (compact) return { x: 31 + (group % 2) * 200 + (index % 10) * 14, y: 88 + Math.floor(group / 2) * 240 + Math.floor(index / 10) * 20 };
  const cols = view === 'ages' ? 8 : 6;
  return { x: (view === 'ages' ? 145 + group * 215 : 104 + group * 178) + (index % cols) * 15, y: 215 + Math.floor(index / cols) * 23 };
}
export function parseView(value: string | null): View {
  return VIEWS.includes(value as View) ? value as View : 'village';
}

export type Neighbourhood = 'village' | 'town' | 'city' | 'hills';
export type Lens = 'age' | 'education' | 'employment' | 'transport';
export const LENSES: Lens[] = ['age', 'education', 'employment', 'transport'];
export const NEIGHBOURHOODS: Neighbourhood[] = ['village', 'town', 'city', 'hills'];
export const FIELD_LABELS = {
  pt: {
    age: ['0–17 anos', '18–39 anos', '40–64 anos', '65+ anos'],
    education: ['Em idade escolar', 'Básico', 'Secundário', 'Superior'],
    employment: ['Empregado', 'Desempregado', 'Inativo'],
    transport: ['A pé / bicicleta', 'Automóvel', 'Transp. coletivo', 'Não aplicável'],
  },
  en: {
    age: ['Ages 0–17', 'Ages 18–39', 'Ages 40–64', 'Ages 65+'],
    education: ['School age', 'Basic', 'Secondary', 'Higher'],
    employment: ['Employed', 'Unemployed', 'Inactive'],
    transport: ['Walk / bicycle', 'Car', 'Public transport', 'Not applicable'],
  },
};
// All detail values below are invented fixtures. These concepts map to the
// producer schema; their presence here does not assert release availability.
export function details(person: Person) {
  const employment = person.age < 18 || person.age >= 66 ? 2 : person.id % 7 === 0 ? 1 : 0;
  return {
    sex: person.id % 2 === 0 ? 'F' : 'M',
    education: person.age < 18 ? 0 : 1 + ((person.household + person.member) % 3),
    employment,
    transport: employment !== 0 && person.age >= 18 || person.age < 6 ? 3 : person.id % 3,
    marital: person.age < 18 || person.id % 3 === 0 ? 0 : person.id % 5 === 0 ? 2 : 1,
    workplace: employment === 0 ? person.id % 3 : null,
  };
}
export function householdDetails(id: number) {
  return { rooms: 2 + id % 5, tenure: id % 3 === 0 ? 1 : 0, heating: id % 3,
    buildingPeriod: id % 3, elevator: id % 4 === 0, accessibility: id % 3 !== 0 };
}
export function groupFor(person: Person, lens: Lens) {
  return lens === 'age' ? person.band : details(person)[lens];
}
export function distribution(lens: Lens) {
  return FIELD_LABELS.pt[lens].map((_, i) => PEOPLE.filter(p => groupFor(p, lens) === i));
}
export function neighbourhoodPosition(id: number, neighbourhood: Neighbourhood) {
  const col = id % 6, row = Math.floor(id / 6);
  if (neighbourhood === 'village') return { x: 200 + col * 116 + (row % 2) * 22, y: 175 + row * 74 + Math.sin(id * 2) * 9 };
  if (neighbourhood === 'town') return { x: 430 + col * 80 - row * 28, y: 120 + row * 78 + col * 13 };
  if (neighbourhood === 'hills') return { x: 220 + col * 105 + (row % 2) * 35, y: 150 + row * 78 + Math.sin(col * .9) * 30 };
  return { x: 310 + col * 82 - row * 31, y: 145 + row * 65 + col * 27 };
}
export function exploredPosition(person: Person, view: View, compact: boolean, neighbourhood: Neighbourhood, lens: Lens) {
  if (view === 'village') {
    const house = neighbourhoodPosition(person.household, neighbourhood);
    return { x: house.x + 19 + person.member * 8, y: house.y + 36 + person.member % 2 * 6 };
  }
  if (view === 'households') return personPosition(person, view, compact);
  const group = groupFor(person, lens), members = distribution(lens)[group];
  const index = members.findIndex(p => p.id === person.id), n = distribution(lens).length;
  if (compact) return { x: 31 + group % 2 * 200 + index % 10 * 14, y: 88 + Math.floor(group / 2) * 240 + Math.floor(index / 10) * 20 };
  const center = 90 + (group + .5) * (820 / n);
  return { x: center - 60 + index % 9 * 15, y: 215 + Math.floor(index / 9) * 23 };
}
