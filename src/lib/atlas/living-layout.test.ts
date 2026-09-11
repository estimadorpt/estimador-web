import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
import { geoContains } from 'd3';
import { interiorPoint } from './living-layout';
describe('illustrative home placement',()=>{
 it('places repeatable home anchors inside the selected parish, including island geometry',()=>{
  for(const municipality of ['1106','3103','4802']){
   const collection=JSON.parse(readFileSync(`public/data/population-geography/parishes/${municipality}.json`,'utf8'));
   for(const shape of collection.features)for(const seed of [1,17,29]){
    const point=interiorPoint(shape,seed);
    expect(point.every(Number.isFinite)).toBe(true);
    expect(geoContains(shape,point)).toBe(true);
    expect(interiorPoint(shape,seed)).toEqual(point);
   }
  }
 });
});
