export const IV_NAMES=['PS','Ataque','Defensa','At. esp.','Def. esp.','Velocidad'];
export const TYPE_NAMES=['','Normal','Lucha','Volador','Veneno','Tierra','Roca','Bicho','Fantasma','Acero','Fuego','Agua','Planta','Eléctrico','Psíquico','Hielo','Dragón','Siniestro','Hada'];
export const PACK_CHANCE=.2;
export const tier=b=>b<300?'D':b<400?'C':b<500?'B':b<600?'A':'S';
export const pwb=p=>p.bst;
export const pwt=(c,p)=>p.bst+c.iv.reduce((a,b)=>a+b,0);
export function makeRoutes(catalog){const bounds=[0,250,300,350,400,450,500,550,600,650,700,Infinity];return bounds.slice(0,-1).map((min,i)=>({id:i,name:['Pradera inicial','Sendero del bosque','Ribera tranquila','Cavernas de ámbar','Costa esmeralda','Cumbre nevada','Santuario antiguo','Valle de los dragones','Templo legendario','Dimensión astral','Origen del mundo'][i],level:3+i*8,min,max:bounds[i+1],badge:Math.min(8,Math.floor(i/1.4)),pool:catalog.filter(p=>p.bst>=min&&p.bst<bounds[i+1]),enemy:210+i*50}));}
export function initial(now=Date.now()){return {version:3,coins:0,badges:0,collection:{},teams:Array.from({length:6},()=>({ids:[],run:null})),packs:{},last:now,seed:123456789,log:[],starterId:null};}
export function migrate(s){if(!s)return initial();if([1,2].includes(s.version)){s.version=3;s.starterId=s.starterId||Object.values(s.collection)[0]?.id||null;for(const t of s.teams)t.run=null;}return s.version===3?s:initial();}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function acquire(s,p,shiny=false){let c=s.collection[p.family];let reward='Nuevo';if(!c)c=s.collection[p.family]={id:p.id,level:5,iv:[0,0,0,0,0,0],spent:0,dust:0,shiny:false,unlocked:[p.id]};else{c.dust+=[1,3,6][Math.min(2,p.stage)];if(!c.unlocked.includes(p.id))c.unlocked.push(p.id);reward='Reciclado';}if(shiny&&!c.shiny){c.shiny=true;reward+=' · ★ Aura shiny +5%';}while(c.spent<186&&c.dust>=1+c.spent){c.dust-=1+c.spent;const lowest=Math.min(...c.iv);c.iv[c.iv.indexOf(lowest)]++;c.spent++;}return reward;}
export function chooseStarter(s,p){if(s.starterId||Object.keys(s.collection).length)return false;acquire(s,p);s.starterId=p.id;s.teams[0].ids=[p.family];return true;}
export function strength(c,p){return pwt(c,p)*(1+c.level/40)*(c.shiny?1.05:1);}
export function slots(s){return Math.min(6,1+Math.floor(s.badges*5/8));}
export function effectiveness(attack,defense,chart){return Math.max(.1,defense.reduce((m,t)=>m*(chart[`${attack},${t}`]??1),1));}
export function fighter(p,c){const level=c.level,st=p.stats.map((b,i)=>Math.floor((2*b+c.iv[i])*level/100)+(i===0?level+10:5));return {id:p.id,family:p.family,level,types:p.types,stats:st,hp:st[0],maxHp:st[0],aura:c.shiny?1.05:1};}
export function damage(a,d,chart){const type=a.types.reduce((best,t)=>effectiveness(t,d.types,chart)>effectiveness(best,d.types,chart)?t:best,a.types[0]);const special=a.stats[3]>a.stats[1];const atk=a.stats[special?3:1],def=d.stats[special?4:2];const raw=Math.floor(Math.floor((2*a.level/5+2)*40*atk/Math.max(1,def))/50)+2;return {amount:Math.max(1,Math.floor(raw*1.5*effectiveness(type,d.types,chart)*a.aura)),type,multiplier:effectiveness(type,d.types,chart)};}
export const DUEL_TIME=4000;
export function encounterDelay(fighters){const alive=fighters.filter(f=>f.hp>0);const speed=alive.reduce((a,f)=>a+f.stats[5],0)/Math.max(1,alive.length);return Math.round(Math.max(3000,12000/(1+speed/25)));}
export function attackCharge(f){return Math.round(Math.max(500,3000/(1+f.stats[5]/25)));}
function addLog(run,at,text){run.logs??=[];run.logs.push({at,text});run.logs=run.logs.slice(-8);}
function prepareEncounter(run,route,at){run.enemies=Array.from({length:run.partySize},()=>{const p=route.pool[Math.floor(random(run)*route.pool.length)];const level=Math.max(1,route.level+Math.floor(random(run)*3)-1);return fighter(p,{level,iv:[0,0,0,0,0,0],shiny:false});});run.cycleStartedAt=at;run.travelMs=encounterDelay(run.fighters);run.encounterAt=at+run.travelMs;run.next=run.encounterAt+DUEL_TIME;run.encounterLogged=false;}
export function begin(s,t,r,byId,now=Date.now()){if(t>=slots(s)||s.teams[t].run||s.badges<r.badge)return false;const team=s.teams[t];if(!team.ids.length)return false;if(s.teams.some((other,i)=>i!==t&&other.ids.some(f=>team.ids.includes(f))))return false;const fighters=team.ids.map(f=>fighter(byId[s.collection[f].id],s.collection[f]));const hp=fighters.reduce((a,f)=>a+f.hp,0);random(s);const run=team.run={route:r.id,hp,maxHp:hp,power:team.ids.reduce((a,f)=>a+strength(s.collection[f],byId[s.collection[f].id]),0),step:0,drops:0,status:'active',started:now,seed:s.seed,fighters,partySize:fighters.length,lastBattle:null,logs:[]};addLog(run,now,'El equipo sale hacia '+r.name+'.');prepareEncounter(run,r,now);return true;}
export function battle(run,route,chart){const foes=run.enemies;const fighters=run.fighters;const report={enemy:foes.map(f=>({id:f.id,level:f.level})),dealt:0,taken:0,multipliers:[],events:[]};
 for(let round=0;round<60&&fighters.some(f=>f.hp>0)&&foes.some(f=>f.hp>0);round++){
 const actors=[...fighters.map(f=>({f,side:0})),...foes.map(f=>({f,side:1}))].sort((a,b)=>b.f.stats[5]-a.f.stats[5]||a.side-b.side);
 for(const {f,side} of actors){if(f.hp<=0)continue;const targets=(side?fighters:foes).filter(x=>x.hp>0);if(!targets.length)break;const target=targets[Math.floor(random(run)*targets.length)],hit=damage(f,target,chart),actual=Math.min(target.hp,hit.amount);target.hp=Math.max(0,target.hp-hit.amount);report.events.push({attacker:f.id,target:target.id,side,damage:actual,multiplier:hit.multiplier,fainted:target.hp===0});report.events=report.events.slice(-4);if(side)report.taken+=actual;else{report.dealt+=actual;if(!report.multipliers.includes(hit.multiplier))report.multipliers.push(hit.multiplier);}}
 }
 const won=fighters.some(f=>f.hp>0)&&!foes.some(f=>f.hp>0);if(!won)fighters.forEach(f=>f.hp=0);run.hp=fighters.reduce((a,f)=>a+f.hp,0);run.lastBattle={...report,won};return won;
}
export function advance(s,routes,now=Date.now(),chart={}){let completed=0;for(const t of s.teams){const run=t.run;if(!run||run.status!=='active')continue;const route=routes[run.route];if(!run.fighters||!run.enemies){run.status='fallen';run.hp=0;continue;}while(run.status==='active'){
 if(!run.encounterLogged&&run.encounterAt<=now){addLog(run,run.encounterAt,'Aparecen '+run.enemies.length+' rivales de nivel '+run.enemies.map(f=>f.level).join('/')+'. Comienza el duelo.');run.encounterLogged=true;}
 if(run.next>now)break;const at=run.next;const won=battle(run,route,chart);
 for(const event of run.lastBattle.events)addLog(run,at,'#'+event.attacker+' causa '+event.damage+' PS a #'+event.target+' (×'+event.multiplier+').'+(event.fainted?' Cae debilitado.':''));
 if(!won){run.status='fallen';addLog(run,at,'El equipo ha caído. Expedición terminada.');break;}
 run.step++;completed++;const drop=random(run)<PACK_CHANCE;if(drop){s.packs[route.id]=(s.packs[route.id]||0)+1;run.drops++;}s.coins+=10+route.id*5;addLog(run,at,'Victoria '+run.step+' · '+(10+route.id*5)+' monedas'+(drop?' · ¡Sobre encontrado!':' · sin sobre')+'.');
 for(const f of t.ids){const c=s.collection[f];c.xp=(c.xp||0)+1;while(c.xp>=5+c.level&&c.level<100){c.xp-=5+c.level;c.level++;}}
 prepareEncounter(run,route,at);
 }}s.last=now;return completed;}
export function openPack(s,r){if(!(s.packs[r.id]>0)||!r.pool.length)return [];s.packs[r.id]--;return Array.from({length:3},()=>{const weights=r.pool.map(p=>Math.exp(-(p.bst-r.min)/30)*(p.legendary?.15:1));let x=random(s)*weights.reduce((a,b)=>a+b,0);let i=0;while(i<weights.length-1&&x>=weights[i])x-=weights[i++];const p=r.pool[i],shiny=random(s)<1/512;return {p,shiny,result:acquire(s,p,shiny)};});}
export function openPacks(s,r,count){const n=Math.max(0,Math.min(Math.floor(count),s.packs[r.id]||0,1000));const results=[];for(let i=0;i<n;i++)results.push(...openPack(s,r));return {count:n,results};}
export function gym(s,byId){if(s.badges>=8)return {ok:false,required:0};const power=s.teams[0].ids.reduce((a,f)=>a+strength(s.collection[f],byId[s.collection[f].id]),0);const required=[500,900,1400,2000,2800,3700,4800,6200][s.badges];if(power<required)return {ok:false,required,power};s.badges++;s.coins+=500;s.teams[0].ids.forEach(f=>s.collection[f].level=Math.min(100,s.collection[f].level+3));return {ok:true,required,power};}
