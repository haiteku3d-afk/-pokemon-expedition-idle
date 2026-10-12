// Game-specific type circuit. Leaders' rosters are adapted for this idle game.
export const TEAM_BADGES=[0,2,5,9,13,18];
export const RANKS=[{name:'Bronce',offset:0,pwb:350,cycles:0},{name:'Plata',offset:20,pwb:500,cycles:3},{name:'Oro',offset:40,pwb:Infinity,cycles:10}];
export const GYMS=[
 [1,'Normal','Whitney',235],[12,'Planta','Erika',455],[10,'Fuego','Blaine',324],[11,'Agua','Misty',370],[7,'Bicho','Bugsy',213],[13,'Eléctrico','Lt. Surge',417],
 [6,'Roca','Brock',703],[5,'Tierra','Giovanni',618],[3,'Volador','Falkner',441],[4,'Veneno','Koga',336],[2,'Lucha','Chuck',538],[15,'Hielo','Pryce',225],
 [14,'Psíquico','Sabrina',876],[8,'Fantasma','Morty',442],[17,'Siniestro','Piers',359],[9,'Acero','Jasmine',303],[16,'Dragón','Clair',621],[18,'Hada','Valerie',764]
].map(([type,label,name,exclusive],i)=>({id:i,type,label,name,exclusive,group:Math.floor(i/6),badge:[0,4,10][Math.floor(i/6)],level:[10,26,44][Math.floor(i/6)],scene:[0,1,3,2,1,6,3,7,4,1,6,5,9,6,3,8,7,6][i]}));
export const EXCLUSIVE_IDS=new Set(GYMS.map(g=>g.exclusive));
export const LEGACY_GYM_TYPES=[6,11,13,12,4,14,10,5];
export const gymKey=(id,rank)=>`gym:${id}:${rank}`;
export const zoneSpeed=level=>Math.round(5+1.2*level);
export function gymProgress(s,id){return s.gymProgress?.[id]||{medal:false,cycles:0,wins:[0,0,0],pity:0};}
export function gymUnlocked(s,g,rank=0){if(!g||!RANKS[rank])return false;const p=gymProgress(s,g.id);if(s.badges<g.badge&&!p.medal)return false;return rank===0||(p.medal&&p.cycles>=RANKS[rank].cycles&&(rank===1||p.wins[1]>0));}
export function gymLevel(g,rank=0){return g.level+RANKS[rank].offset;}
export function gymPool(catalog,g,rank){return catalog.filter(p=>p.types.includes(g.type)&&!EXCLUSIVE_IDS.has(p.id)&&p.bst<=RANKS[rank].pwb).sort((a,b)=>a.bst-b.bst||a.id-b.id);}
export function gymSpecies(s,catalog,g,rank){const floor=rank?RANKS[rank-1].pwb:0,pool=gymPool(catalog,g,rank).filter(p=>p.bst>floor),p=gymProgress(s,g.id),inherited=rank?gymSpecies(s,catalog,g,rank-1):[];return [...inherited,...pool.slice(0,5+5*Math.floor(p.wins[rank]/2))];}
export function gymPackSource(catalog,g,rank){return {id:gymKey(g.id,rank),kind:'gym',gymId:g.id,rank,name:`${g.label} · ${RANKS[rank].name}`,pool:gymPool(catalog,g,rank)};}
export function gymPackSources(catalog){return GYMS.flatMap(g=>RANKS.map((_,rank)=>gymPackSource(catalog,g,rank)));}
