import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MUNICIPALITIES,geographySelection } from './geography';
import { REGIONS,readAtlasState,atlasQuery } from './population';
describe('CAOP 2021 atlas hierarchy',()=>{
 it('covers all municipalities and parishes with matching downloadable boundaries',()=>{
  expect(MUNICIPALITIES).toHaveLength(308);
  const parishes=MUNICIPALITIES.flatMap(m=>m.parishes.map(p=>p.code));
  expect(parishes).toHaveLength(3092);expect(new Set(parishes).size).toBe(3092);
  for(const region of REGIONS){
   const towns=MUNICIPALITIES.filter(m=>m.region===region);expect(towns.length).toBeGreaterThan(0);
   const data=JSON.parse(readFileSync(`public/data/population-geography/municipalities/${towns[0].regionId}.json`,'utf8'));
   expect(data.features.map(f=>f.properties.code).sort()).toEqual(towns.map(t=>t.code).sort());
  }
  for(const town of MUNICIPALITIES){
   const data=JSON.parse(readFileSync(`public/data/population-geography/parishes/${town.code}.json`,'utf8'));
   expect(data.features.map(f=>f.properties.code).sort()).toEqual(town.parishes.map(p=>p.code).sort());
   expect(data.features.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type))).toBe(true);
  }
 });
 it('rejects place combinations with the wrong parents',()=>{
  expect(geographySelection('Porto','1106','110601')).toEqual({municipality:'',parish:''});
  expect(geographySelection('Lisboa','1106','130101')).toEqual({municipality:'1106',parish:''});
 });
 it('saves and restores an entire district-to-parish path',()=>{
  const town=MUNICIPALITIES.find(m=>m.code==='1106')!;
  const state=readAtlasState(new URLSearchParams(`region=Lisboa&municipality=1106&parish=${town.parishes[0].code}&age=3&alone=1`));
  expect(state.municipality).toBe('1106');expect(state.parish).toBe(town.parishes[0].code);
  expect(readAtlasState(new URLSearchParams(atlasQuery(state)))).toEqual(state);
 });
});
