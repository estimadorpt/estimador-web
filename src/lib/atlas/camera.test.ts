import { describe, expect, it } from 'vitest';
import { cameraTransform, fitCamera, flightDuration } from './camera';

describe('atlas camera framing', () => {
 it.each([[[10,20],[50,800]], [[-3400,-15000],[-3300,-14990]], [[1,1],[1,1]]])('keeps a geographic extent inside the viewport with breathing room', (a,b) => {
  const camera=fitCamera([a,b] as [[number,number],[number,number]]);
  const transform=cameraTransform(camera);
  for(const [x,y] of [a,b]) {
   expect(x*transform.scale+transform.x).toBeGreaterThan(0);
   expect(x*transform.scale+transform.x).toBeLessThan(1000);
   expect(y*transform.scale+transform.y).toBeGreaterThan(0);
   expect(y*transform.scale+transform.y).toBeLessThan(620);
  }
 });
 it('centres a selected home independently of its geographic coordinates',()=>{
  const view={x:-3200,y:-14700,width:12};
  const t=cameraTransform(view);
  expect(view.x*t.scale+t.x).toBeCloseTo(500);
  expect(view.y*t.scale+t.y).toBeCloseTo(310);
 });
});

it("bounds long flights and keeps adjacent zooms responsive",()=>{
 const country={x:0,y:0,width:5000},town={x:20,y:30,width:50},parish={x:22,y:32,width:20};
 expect(flightDuration(country,parish)).toBeLessThanOrEqual(1350);
 expect(flightDuration(town,parish)).toBeLessThan(1000);
 expect(flightDuration(parish,town)).toBe(flightDuration(town,parish));
});
