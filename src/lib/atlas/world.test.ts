import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {geoContains} from 'd3';
import {parishScene,worldProjection,type PlaceCollection} from './world';
import {cameraTransform} from './camera';
function parish(municipality:string,code:string){const c:PlaceCollection=JSON.parse(readFileSync(`public/data/population-geography/parishes/${municipality}.json`,'utf8'));return c.features.find(f=>f.properties.code===code)!;}
describe('one country coordinate system',()=>{
 it('keeps urban and rural buildings at the same world scale',()=>{
  const urban=parishScene(parish('1106','110618'),'Lisboa');
  const rural=parishScene(parish('0204','020401'),'Beja');
  expect(rural.unit).toBe(urban.unit);
  expect(rural.view.width).toBeGreaterThan(urban.view.width);
 });
 it('retains the same homes on a return visit and places them inside their parish',()=>{
  for(const [m,code,region] of [['1106','110618','Lisboa'],['0204','020401','Beja'],['0808','080805','Faro']]){
   const f=parish(m,code),scene=parishScene(f,region);
   expect(parishScene(f,region).homes).toEqual(scene.homes);
   for(const home of scene.homes)expect(geoContains(f,worldProjection.invert!([home.x,home.y]))).toBe(true);
  }
 });
 it('zooms the viewport to a home without changing any world coordinates',()=>{
  const scene=parishScene(parish('1106','110618'),'Lisboa'),home=scene.homes[0];
  const before=JSON.stringify(scene.homes);
  const parishCamera=cameraTransform(scene.view);
  const homeCamera=cameraTransform({x:home.x,y:home.y,width:scene.unit*1000/2.8});
  expect(homeCamera.scale).toBeGreaterThan(parishCamera.scale);
  expect(home.x*homeCamera.scale+homeCamera.x).toBeCloseTo(500);
  expect(home.y*homeCamera.scale+homeCamera.y).toBeCloseTo(310);
  expect(JSON.stringify(scene.homes)).toBe(before);
 });
});
