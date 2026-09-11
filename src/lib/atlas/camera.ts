export type CameraView = { x: number; y: number; width: number };
export function fitCamera(bounds: [[number,number],[number,number]], aspect = 1000/620): CameraView {
 const [[x0,y0],[x1,y1]]=bounds;
 return {x:(x0+x1)/2,y:(y0+y1)/2,width:Math.max(x1-x0,(y1-y0)*aspect,0.001)*1.22};
}
export function cameraTransform(camera: CameraView) {
 const scale=1000/camera.width;
 return {scale,x:500-camera.x*scale,y:310-camera.y*scale};
}

/** Adjacent places respond promptly; long country-to-home journeys stay readable. */
export function flightDuration(from:CameraView,to:CameraView){
 const zoomDistance=Math.abs(Math.log(to.width/from.width));
 const panDistance=Math.hypot(to.x-from.x,to.y-from.y)/Math.max(from.width,to.width);
 return Math.min(1350,650+zoomDistance*180+Math.min(panDistance,1)*150);
}

/** Local household samples must not look like national population density. */
export function householdOverviewOpacity(width:number){
 return Math.max(0,Math.min(1,(1800-width)/700));
}
