import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
import { geoContains } from 'd3';
import { MUNICIPALITIES } from './geography';
import { interiorPoint } from './living-layout';
import type { SceneryCollection } from './scenery';
const load=(code:string):SceneryCollection=>JSON.parse(readFileSync(`public/data/population-geography/scenery/${code}.json`,'utf8'));
describe('geographically matched scenery',()=>{
 it('has a valid census-derived profile for every mapped parish',()=>{
  let count=0;
  for(const m of MUNICIPALITIES){const data=load(m.code);expect(Object.keys(data.profiles).sort()).toEqual(m.parishes.map(p=>p.code).sort());
   for(const p of Object.values(data.profiles)){
    expect(['rural','town','urban']).toContain(p.kind);
    expect(Number.isFinite(p.density)&&p.density>=0).toBe(true);
    expect(p.apartments).toBeGreaterThanOrEqual(0);expect(p.apartments).toBeLessThanOrEqual(1);
    expect(p.highrise).toBeGreaterThanOrEqual(0);expect(p.highrise).toBeLessThanOrEqual(1);count++;
   }
  }
  expect(count).toBe(3092);
 });
 it('distinguishes dense Lisboa, rural Barrancos and the Algarve coast',()=>{
  expect(load('1106').profiles['110618'].kind).toBe('urban');
  expect(load('1106').profiles['110618'].coastal).toBe(false);
  expect(load('0204').profiles['020401']).toMatchObject({kind:'rural',coastal:false});
  expect(load('0808').profiles['080805']).toMatchObject({kind:'town',coastal:true});
 });
 it('keeps illustrative home positions out of the sea, including island parishes',()=>{
  for(const code of ['1106','0808','1001','3103','4802']){
   const {water}=load(code);if(!water)continue;
   const collection=JSON.parse(readFileSync(`public/data/population-geography/parishes/${code}.json`,'utf8'));
   for(const f of collection.features)for(const seed of [2,9,29])expect(geoContains(water,interiorPoint(f,seed))).toBe(false);
  }
 });
});
