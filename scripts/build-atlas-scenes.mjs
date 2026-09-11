/** Bake deterministic geometry once, rather than during a visitor's camera flight. */
import {createServer} from 'vite';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
const server=await createServer({configFile:'vitest.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
try {
 const {parishScene}=await server.ssrLoadModule('/src/lib/atlas/world.ts');
 const places=JSON.parse(await readFile('src/lib/atlas/places.json','utf8'));
 const base='public/data/population-geography';
 await mkdir(`${base}/scenes`,{recursive:true});await mkdir(`${base}/overview`,{recursive:true});
 const overrides=JSON.parse(await readFile('scripts/data/tagus-parish-land.json','utf8'));
 const overview={};let count=0;
 const round=(_key,value)=>typeof value==='number'?Math.round(value*100000)/100000:value;
 for(const file of (await readdir(`${base}/parishes`)).filter(f=>f.endsWith('.json'))){
  const municipality=file.slice(0,-5),m=places.municipalities.find(m=>m.code===municipality);
  const collection=JSON.parse(await readFile(`${base}/parishes/${file}`,'utf8'));
  const scenes=collection.features.map(f=>{const {people,...scene}=parishScene(overrides[f.properties.code]?{...f,geometry:overrides[f.properties.code]}:f,m.region);void people;return {...scene,municipality};});
  await writeFile(`${base}/scenes/${file}`,JSON.stringify(scenes,round));
  (overview[m.regionId]??=[]).push(...scenes.map(s=>({code:s.code,municipality,homes:s.homes})));
  count+=scenes.length;
 }
 for(const [region,scenes] of Object.entries(overview))await writeFile(`${base}/overview/${region}.json`,JSON.stringify(scenes,round));
 console.log(`Baked ${count} parish scenes and ${Object.keys(overview).length} district overviews.`);
}finally{await server.close();}
