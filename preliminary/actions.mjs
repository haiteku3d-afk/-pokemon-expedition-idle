import {ensureMeta,ensureDaily,dailyObjectives,reviveUpgrade,archiveRun} from './progression-meta.mjs';
import {chooseStarter,begin,quickStart,gym,openPacks,slots,ensureMoves,recommendedMoves,gymPackSources,routeUnlocked} from './engine.mjs';
import {autoEvolve,evolveTo} from './evolution.mjs';
export const STARTERS=new Set([1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912]);
export const GAME_ACTIONS=new Set(['starter','pick','order','equip','recommend','begin','recall','quick','gymBegin','open','evolveChoice','form','reviveUpgrade','toggleRevive','dailyClaim','sync']);
export class ActionError extends Error {}
const requireValid=(v,message='Acción no disponible')=>{if(!v)throw new ActionError(message);};
const integer=v=>{const n=Number(v);requireValid(v!==undefined&&v!==null&&v!==''&&Number.isInteger(n)&&n>=0,'Selección inválida');return n;};
export const PREPARATION_ACTIONS=new Set(['pick','order','equip','recommend','toggleRevive']);
export function applyAction(s,a,config){
 const {catalog,byId,routes,now}=config;
 if(a?.preparation!==undefined){
  requireValid(Array.isArray(a.preparation)&&a.preparation.length<=100,'Demasiados cambios pendientes');
  for(const edit of a.preparation){requireValid(edit&&PREPARATION_ACTIONS.has(edit.type)&&edit.preparation===undefined,'Preparación inválida');applyAction(s,edit,config);}
 }
 requireValid(a&&GAME_ACTIONS.has(a.type),'Acción desconocida');const result={};if(a.type==='sync')return result;
 const id=a.type==='open'?a.id:integer(a.id),owned=id=>{const p=byId[id],c=p&&s.collection[p.family];requireValid(c,'Pokémon no capturado');return {p,c};},editable=family=>requireValid(!s.teams.some(t=>t.run?.status==='active'&&t.ids.includes(family)),'Retira el equipo antes de editarlo');
 const team=index=>{requireValid(index<slots(s)&&s.teams[index],'Equipo bloqueado');return s.teams[index];};
 switch(a.type){
 case 'starter':requireValid(STARTERS.has(id)&&chooseStarter(s,byId[id]),'Inicial no disponible');break;
 case 'pick':{const t=team(id),family=integer(a.family);requireValid(!t.run&&s.collection[family]);if(t.ids.includes(family))t.ids=t.ids.filter(x=>x!==family);else{requireValid(t.ids.length<6&&!s.teams.some((other,i)=>i!==id&&other.ids.includes(family)),'Pokémon ocupado o equipo completo');t.ids.push(family);}break;}
 case 'order':{const t=team(id),index=integer(a.index),direction=Number(a.direction),next=index+direction;requireValid(!t.run&&[-1,1].includes(direction)&&index<t.ids.length&&next>=0&&next<t.ids.length);[t.ids[index],t.ids[next]]=[t.ids[next],t.ids[index]];break;}
 case 'equip':{const {p,c}=owned(id),mid=integer(a.move);editable(p.family);ensureMoves(c,p);requireValid(c.learnedMoves.includes(mid),'Movimiento no aprendido');if(c.equippedMoves.includes(mid)){requireValid(c.equippedMoves.length>1,'Conserva un movimiento');c.equippedMoves=c.equippedMoves.filter(x=>x!==mid);}else{requireValid(c.equippedMoves.length<4,'Máximo cuatro movimientos');c.equippedMoves.push(mid);}c.autoMoves=false;break;}
 case 'recommend':{const {p,c}=owned(id);editable(p.family);c.autoMoves=true;c.equippedMoves=recommendedMoves(c,p);break;}
 case 'begin':{team(id);const r=routes[integer(a.route)];requireValid(r&&begin(s,id,r,byId,now),'No se puede iniciar la expedición');break;}
 case 'recall':{const t=team(id);archiveRun(t,now);t.run=null;break;}
 case 'quick':{team(id);requireValid(quickStart(s,id,routes,byId,now),'Equipo o destino no disponible');break;}
 case 'gymBegin':requireValid(gym(s,byId,now,id,integer(a.rank??0),integer(a.team??0)).ok,'Gimnasio o equipo no disponible');break;
 case 'open':{const source=[...routes,...gymPackSources(catalog)].find(r=>String(r.id)===String(id));requireValid(source,'Sobre desconocido');const n=integer(a.count??1);requireValid(n>0&&n<=1000&&(s.packs[source.id]||0)>0,'No hay sobres disponibles');const batch=openPacks(s,source,n);result.batch={count:batch.count,results:batch.results.map(x=>({pokemonId:x.p.id,shiny:x.shiny,result:x.result}))};break;}
 case 'evolveChoice':{const c=s.collection[id];requireValid(c);editable(id);requireValid(evolveTo(c,integer(a.pokemon)),'Evolución no disponible');autoEvolve(c);break;}
 case 'reviveUpgrade':{const upgrade=reviveUpgrade(s,id);requireValid(upgrade?.canBuy,'Mejora bloqueada, completada o monedas insuficientes');s.coins-=upgrade.cost;s.secondChance[id]++;result.message='Segunda oportunidad '+(id+1)+': '+s.secondChance[id]*10+'%';break;}
 case 'toggleRevive':{const t=team(id);requireValid(t.run?.status!=='active','La opción se elige antes de salir');requireValid(['true','false'].includes(String(a.enabled)),'Opción inválida');t.autoRevive=String(a.enabled)==='true';break;}
 case 'dailyClaim':{const d=ensureDaily(s,now);requireValid(a.day===d.day,'Las misiones cambiaron de día; revisa las nuevas');requireValid(id<=3&&!d.claimed[id],'Recompensa ya reclamada');const objectives=dailyObjectives(s,now);let source;
  if(id===3)requireValid(d.claimed.slice(0,3).every(Boolean),'Reclama las tres misiones primero');else requireValid(objectives[id].complete,'Misión incompleta');
  if(id===2&&d.leaderMode)source=d.leaderSource;
  else if(id===0||id===2){source=Number(Object.entries(d.routeWins).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]))[0]?.[0]??0);}
  else{const route=routes[integer(a.route)];requireValid(route&&routeUnlocked(s,route),'Ruta bloqueada');source=route.id;}
  requireValid(source!==null&&source!==undefined,'Recompensa no disponible');d.claimed[id]=true;s.packs[source]=(s.packs[source]||0)+1;result.message='¡Sobre diario reclamado!';break;}
 case 'form':{const c=s.collection[id],pid=integer(a.pokemon);requireValid(c&&c.unlocked.includes(pid));editable(id);c.id=pid;ensureMoves(c,byId[pid]);break;}
 }
 return result;
}
