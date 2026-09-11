import { geographySelection } from './geography';
import { HOUSEHOLDS, PEOPLE, details, groupFor, type Lens, type Person } from '@/lib/miniatura/population';

// Interface fixtures only: deliberately unrelated to regional census totals.
export const ATLAS_RELEASE = 'atlas-demo-v1';
export const REGIONS = ['Aveiro','Beja','Braga','Bragança','Castelo Branco','Coimbra','Évora','Faro','Guarda','Leiria','Lisboa','Portalegre','Porto','Santarém','Setúbal','Viana do Castelo','Vila Real','Viseu','Açores','Madeira'] as const;
export type Region = typeof REGIONS[number];
export type AtlasPerson = Person & { key: string; region: Region };
export type Cohort = { age: number; employment: number; alone: boolean };
export const EMPTY_COHORT: Cohort = { age: -1, employment: -1, alone: false };
export const ATLAS_PEOPLE: AtlasPerson[] = REGIONS.flatMap((region, r) => {
  const homes = HOUSEHOLDS.filter(h => ((h.id * 7 + r * 11) % 31) < 12 + r % 9);
  return PEOPLE.filter(p => homes.some(h => h.id === p.household)).map(p => ({ ...p, key: `${r}:${p.id}`, region }));
});
export function matches(person: Person, cohort: Cohort) {
  return (cohort.age < 0 || person.band === cohort.age) && (cohort.employment < 0 || details(person).employment === cohort.employment) && (!cohort.alone || person.size === 1);
}
export function regionPeople(region: string) { return region === 'Portugal' ? ATLAS_PEOPLE : ATLAS_PEOPLE.filter(p => p.region === region); }
export function shares(people: Person[], lens: Lens) {
  const count = lens === 'employment' ? 3 : 4;
  return Array.from({ length: count }, (_, i) => people.length ? people.filter(p => groupFor(p, lens) === i).length / people.length : 0);
}
export function readAtlasState(query: URLSearchParams) {
  const validRegion = (value: string | null, fallback: string) => REGIONS.includes(value as Region) || value === 'Portugal' ? value! : fallback;
  const group = (key: string, max: number) => { const value = Number(query.get(key)); return query.has(key) && Number.isInteger(value) && value >= 0 && value < max ? value : -1; };
  const region=validRegion(query.get('region'), 'Portugal');
  return { ...geographySelection(region,query.get('municipality'),query.get('parish')),region, compare: validRegion(query.get('compare'), 'Porto'),
    mode: ['map','distribution','compare'].includes(query.get('mode') ?? '') ? query.get('mode') as 'map'|'distribution'|'compare' : 'map',
    lens: ['age','education','employment','transport'].includes(query.get('lens') ?? '') ? query.get('lens') as Lens : 'age',
    cohort: { age: group('age',4), employment: group('employment',3), alone: query.get('alone') === '1' } };
}

export function atlasQuery(state: Omit<ReturnType<typeof readAtlasState>,'municipality'|'parish'> & {municipality?:string;parish?:string}) {
  const query=new URLSearchParams({r:ATLAS_RELEASE,region:state.region,compare:state.compare,mode:state.mode,lens:state.lens});
  const geo=geographySelection(state.region,state.municipality??null,state.parish??null);
  if(geo.municipality)query.set('municipality',geo.municipality);
  if(geo.parish)query.set('parish',geo.parish);
  if(state.cohort.age>=0)query.set('age',String(state.cohort.age));
  if(state.cohort.employment>=0)query.set('employment',String(state.cohort.employment));
  if(state.cohort.alone)query.set('alone','1');
  return query.toString();
}

export function distributionPositions(lens: Lens, compact: boolean) {
  const totals=[0,0,0,0], counts=[0,0,0,0];
  ATLAS_PEOPLE.forEach(p=>totals[groupFor(p,lens)]++);
  return ATLAS_PEOPLE.map(p=>{
    const group=groupFor(p,lens),index=counts[group]++,columns=compact?22:13;
    const spacing=Math.min(compact?10:11,(compact?190:370)/Math.ceil(totals[group]/columns));
    return {x:compact?65+(group%2)*350+(index%columns)*11:55+group*171+(index%columns)*10,
      y:(compact?150+Math.floor(group/2)*250:138)+Math.floor(index/columns)*spacing};
  });
}
