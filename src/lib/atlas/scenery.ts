import type { Geometry } from 'geojson';
export type ParishScenery = {kind:'urban'|'town'|'rural';coastal:boolean;density:number;apartments:number;highrise:number;latitude:number};
export type SceneryCollection = {vintage:string;profiles:Record<string,ParishScenery>;water:Geometry|null};
export function sceneryLabel(profile:ParishScenery,pt:boolean) {
 const place=pt?{urban:'Malha urbana',town:'Vila e bairro',rural:'Povoamento rural'}:{urban:'Urban fabric',town:'Town and neighbourhood',rural:'Rural settlement'};
 return place[profile.kind]+(profile.coastal?(pt?' · junto à costa':' · near the coast'):'');
}
export function sceneryPalette(profile?:ParishScenery) {
 if(!profile)return {ground:'#416952',field:'#71815a',tree:'#4e8056',road:'#aec098'};
 if(profile.kind==='urban')return {ground:'#687b6b',field:'#5a805f',tree:'#42785b',road:'#d2c8a7'};
 if(profile.coastal)return {ground:'#738870',field:'#a4a57a',tree:'#568474',road:'#e3d4aa'};
 if(profile.latitude<39.5)return {ground:'#7f8254',field:'#b4a365',tree:'#657644',road:'#d6c393'};
 return {ground:'#4e7453',field:'#78945c',tree:'#345f49',road:'#b9c397'};
}
