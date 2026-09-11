import {readFileSync} from 'node:fs';
import {geoContains} from 'd3';
import {describe,it,expect} from 'vitest';
import {worldProjection,type ParishScene} from './world';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const context=read('public/data/population-geography/tagus-context.json');
const overrides=read('scripts/data/tagus-parish-land.json');
describe('Tagus physical shoreline',()=>{
 it('keeps the estuary open and Lisbon and Almada on land',()=>{
  for(const point of [[-9.1,38.65],[-9.13,38.66],[-9.15,38.69]] as [number,number][]) expect(geoContains(context.water,point)).toBe(true);
  for(const point of [[-9.14,38.72],[-9.16,38.68]] as [number,number][]) expect(geoContains(context.land,point)).toBe(true);
 });
 it('has neither missing wedges nor overlapping land and water',()=>{
  for(let x=-9.64;x<-8.66;x+=.04)for(let y=38.36;y<39.09;y+=.04){
   expect(Number(geoContains(context.land,[x,y]))+Number(geoContains(context.water,[x,y]))).toBe(1);
  }
 });
 it('places prepared riverside households on physical land',()=>{
  const towns=[...new Set(Object.keys(overrides).map(code=>code.slice(0,4)))];let checked=0;
  for(const town of towns){const scenes:ParishScene[]=read(`public/data/population-geography/scenes/${town}.json`);
   for(const scene of scenes.filter(s=>overrides[s.code]))for(const home of scene.homes){
    expect(geoContains(context.water,worldProjection.invert!([home.x,home.y])),`${scene.code}/${home.id}`).toBe(false);checked++;
   }
  }
  expect(checked).toBeGreaterThan(800);
 });
 it('retains the coastline attribution and license',()=>{
  expect(context.license).toBe('ODbL-1.0');
  expect(context.sourceUrl).toBe('https://www.openstreetmap.org/copyright');
 });
});
