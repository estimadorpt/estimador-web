import { describe, expect, it } from 'vitest';
import { PEOPLE, HOUSEHOLDS, VIEWS, personPosition, parseView } from './population';

describe('the explicitly fictional miniature', () => {
  it('keeps exactly 100 distinct people in 30 internally consistent households', () => {
    expect(PEOPLE).toHaveLength(100);
    expect(new Set(PEOPLE.map(p=>p.id)).size).toBe(100);
    expect(HOUSEHOLDS).toHaveLength(30);
    expect(HOUSEHOLDS.flatMap(h=>h.people)).toHaveLength(100);
    for(const home of HOUSEHOLDS){
      expect(home.people.every(p=>p.size===home.people.length)).toBe(true);
      expect(home.people.some(p=>p.age>=18)).toBe(true);
    }
    expect(PEOPLE.filter(p=>p.size===1)).toHaveLength(5);
  });
  it('keeps everyone within the scene, away from chart captions, without overlapping positions', () => {
    for(const view of VIEWS){
      const positions=PEOPLE.map(p=>personPosition(p,view));
      expect(new Set(positions.map(p=>`${p.x},${p.y}`)).size).toBe(100);
      for(const p of positions){expect(p.x).toBeGreaterThan(20);expect(p.x).toBeLessThan(980);expect(p.y).toBeGreaterThan(20);expect(p.y).toBeLessThan(view==='village'?540:430);}
    }
  });
  it('rejects unknown saved views',()=>{expect(parseView('script')).toBe('village');expect(parseView(null)).toBe('village');expect(parseView('ages')).toBe('ages');});
});

import { LENSES, NEIGHBOURHOODS, details, distribution, exploredPosition, neighbourhoodPosition } from './population';
describe('connected exploration fixtures', () => {
  it('partitions the same 100 people under every lens', () => {
    for (const lens of LENSES) {
      const groups = distribution(lens);
      expect(groups.flat()).toHaveLength(100);
      expect(new Set(groups.flat().map(p=>p.id)).size).toBe(100);
    }
  });
  it('keeps each compact distribution above its total and within its column', () => {
    for(const lens of LENSES) for(const group of distribution(lens)) {
      const positions=group.map(p=>exploredPosition(p,'ages',true,'town',lens));
      expect(new Set(positions.map(p=>`${p.x},${p.y}`)).size).toBe(group.length);
      for(const pos of positions){expect(pos.x).toBeGreaterThan(0);expect(pos.x).toBeLessThan(400);expect(pos.y%240).toBeLessThan(215);}
    }
  });
  it('keeps homes and their members together when the neighbourhood changes', () => {
    for(const n of NEIGHBOURHOODS) for(const p of PEOPLE){
      const home=neighbourhoodPosition(p.household,n),pos=exploredPosition(p,'village',false,n,'age');
      expect(Math.abs(home.x-pos.x)).toBeLessThan(65);expect(Math.abs(home.y-pos.y)).toBeLessThan(50);
    }
  });
  it('does not assign a workplace to children or non-employed people',()=>{
    for(const p of PEOPLE){const info=details(p);if(p.age<18||info.employment!==0)expect(info.workplace).toBeNull();}
  });
});
