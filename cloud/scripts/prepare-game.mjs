import {readFile,writeFile,mkdir,copyFile,cp,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');let source=resolve(root,'game-source');try{await access(source);}catch{source=resolve(root,'../preliminary');}
await mkdir(resolve(root,'public'),{recursive:true});await mkdir(resolve(root,'game'),{recursive:true});
for(const name of ['app.mjs','summary-view.mjs','progression-meta.mjs','actions.mjs','sync-client.mjs','engine.mjs','combat.mjs','evolution.mjs','effects.mjs','gyms.mjs','visuals.mjs','catalog.json','moves.json','type-chart.json','evolutions.json','style.css'])await copyFile(resolve(source,name),resolve(root,'public',name));
for(const name of ['progression-meta.mjs','engine.mjs','combat.mjs','evolution.mjs','gyms.mjs','actions.mjs','cloud-store.mjs','cloud-api.mjs','catalog.json','moves.json','type-chart.json','evolutions.json'])await copyFile(resolve(source,name),resolve(root,'game',name));
await cp(resolve(source,'assets'),resolve(root,'public/assets'),{recursive:true});
await writeFile(resolve(root,'game/html.ts'),'export const GAME_HTML='+JSON.stringify(await readFile(resolve(source,'index.html'),'utf8'))+';\n');
