import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {MUNICIPALITIES} from './geography';
import {countryExtent,worldPath,type ParishScene,type PlaceCollection} from './world';
import {fitCamera,householdOverviewOpacity} from './camera';
const read=(path:string)=>JSON.parse(readFileSync(`public/data/population-geography/${path}.json`,'utf8'));
describe('prepared atlas geography',()=>{
 it('provides first-visit household positions for every district and parish',()=>{
  const regions=[...new Set(MUNICIPALITIES.map(m=>m.regionId))];let count=0;
  for(const region of regions){
   const overview:{code:string;municipality:string;homes:ParishScene['homes']}[]=read(`overview/${region}`);
   const towns=MUNICIPALITIES.filter(m=>m.regionId===region);
   expect(overview.map(p=>p.code).sort()).toEqual(towns.flatMap(m=>m.parishes.map(p=>p.code)).sort());
   for(const town of towns){const scenes:ParishScene[]=read(`scenes/${town.code}`);
    expect(scenes.map(s=>s.code).sort()).toEqual(town.parishes.map(p=>p.code).sort());
    for(const scene of scenes){expect(scene.homes.length).toBeGreaterThan(0);expect(scene.homes).toEqual(overview.find(p=>p.code===scene.code)!.homes);count++;}
   }
  }
  expect(count).toBe(3092);
 });
 it('makes the mainland prominent without relocating island geometry',()=>{
  const country:PlaceCollection=read('country');
  const mainland=countryExtent(country);
  expect(mainland.features).toHaveLength(18);
  expect(fitCamera(worldPath.bounds(mainland)).width).toBeLessThan(fitCamera(worldPath.bounds(country)).width/2);
  expect(countryExtent(country,true)).toBe(country);
 });
});

it("hides cached local households at national scale and reveals them in districts",()=>{
 const country:PlaceCollection=read("country");
 for(const extent of [country,countryExtent(country)])expect(householdOverviewOpacity(fitCamera(worldPath.bounds(extent)).width)).toBe(0);
 for(const code of ["01","09","11"])expect(householdOverviewOpacity(fitCamera(worldPath.bounds(read(`municipalities/${code}`))).width)).toBe(1);
});
