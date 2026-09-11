import { describe, expect, it } from 'vitest';
import { ATLAS_PEOPLE, REGIONS, matches, regionPeople, shares, readAtlasState, atlasQuery, distributionPositions } from './population';
import { HOUSEHOLDS, LENSES } from '@/lib/miniatura/population';
describe('national atlas fixtures', () => {
  it('covers every region with unique people and complete households', () => {
    expect(new Set(ATLAS_PEOPLE.map(p => p.key)).size).toBe(ATLAS_PEOPLE.length);
    for (const region of REGIONS) {
      const people=regionPeople(region); expect(people.length).toBeGreaterThan(0);
      for (const h of new Set(people.map(p=>p.household))) expect(people.filter(p=>p.household===h)).toHaveLength(HOUSEHOLDS[h].people.length);
    }
    expect(REGIONS.reduce((sum,r)=>sum+regionPeople(r).length,0)).toBe(ATLAS_PEOPLE.length);
  });
  it('combines filters and handles impossible intersections without inventing matches', () => {
    expect(ATLAS_PEOPLE.filter(p=>matches(p,{age:0,employment:0,alone:false}))).toHaveLength(0);
    const alone=ATLAS_PEOPLE.filter(p=>matches(p,{age:-1,employment:-1,alone:true}));
    expect(ATLAS_PEOPLE.filter(p=>matches(p,{age:3,employment:-1,alone:true})).length).toBeGreaterThan(0);
    expect(alone.length).toBeGreaterThan(0); expect(alone.every(p=>p.size===1)).toBe(true);
    expect(shares([], 'age')).toEqual([0,0,0,0]);
    expect(shares(ATLAS_PEOPLE,'age').reduce((a,b)=>a+b,0)).toBeCloseTo(1);
  });
  it('fits every person in the desktop and phone distribution frames, including the largest groups',()=>{for(const lens of LENSES)for(const compact of [false,true]){const points=distributionPositions(lens,compact);expect(points).toHaveLength(ATLAS_PEOPLE.length);expect(new Set(points.map(p=>`${p.x}:${p.y}`)).size).toBe(points.length);for(const p of points){expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(740);expect(p.y).toBeGreaterThan(110);expect(p.y).toBeLessThan(595);}}});
  it('preserves the full perspective on a household return journey',()=>{const state=readAtlasState(new URLSearchParams('region=Açores&compare=Lisboa&mode=compare&lens=transport&age=2&employment=0&alone=1'));expect(readAtlasState(new URLSearchParams(atlasQuery(state)))).toEqual(state);});
  it('validates saved states instead of accepting unsupported filters', () => {
    const state=readAtlasState(new URLSearchParams('region=Nowhere&age=99&employment=cat&mode=bad&lens=income'));
    expect(state.region).toBe('Portugal');expect(state.cohort.age).toBe(-1);expect(state.mode).toBe('map');expect(state.lens).toBe('age');
    expect(readAtlasState(new URLSearchParams('region=Açores&age=2&alone=1')).cohort).toEqual({age:2,employment:-1,alone:true});
  });
});
