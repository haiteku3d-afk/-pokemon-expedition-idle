export const IV_NAMES=['PS','Ataque','Defensa','At. esp.','Def. esp.','Velocidad'];
export const tier=b=>b<300?'D':b<400?'C':b<500?'B':b<600?'A':'S';
export function makeRoutes(catalog){
 const bounds=[0,250,300,350,400,450,500,550,600,650,700,Infinity];
 return bounds.slice(0,-1).map((min,i)=>({id:i,name:['Pradera inicial','Sendero del bosque','Ribera tranquila','Cavernas de ámbar','Costa esmeralda','Cumbre nevada','Santuario antiguo','Valle de los dragones','Templo legendario','Dimensión astral','Origen del mundo'][i],level:1+i*10,min,max:bounds[i+1],badge:Math.min(8,Math.floor(i/1.4)),pool:catalog.filter(p=>p.bst>=min&&p.bst<bounds[i+1]),enemy:210+i*50}));
}
export function initial(now=Date.now()){return {version:1,coins:0,badges:0,collection:{},teams:Array.from({length:6},()=>({ids:[],run:null})),packs:{},last:now,seed:123456789,log:[]};}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function acquire(s,p,shiny=false){
 let c=s.collection[p.family];let reward='Nuevo';
 if(!c){c=s.collection[p.family]={id:p.id,level:5,iv:[0,0,0,0,0,0],spent:0,dust:0,shiny:false,unlocked:[p.id]};}
 else{c.dust+=[1,3,6][Math.min(2,p.stage)];if(!c.unlocked.includes(p.id))c.unlocked.push(p.id);reward='Reciclado';}
 if(shiny&&!c.shiny){c.shiny=true;reward+=' · ★ Aura shiny +5%';}
 while(c.spent<186&&c.dust>=1+c.spent){
  c.dust-=1+c.spent;const lowest=Math.min(...c.iv);c.iv[c.iv.indexOf(lowest)]++;c.spent++;
 }
 return reward;
}
export function strength(c,p){return (p.bst+c.iv.reduce((a,b)=>a+b,0))* (1+c.level/40)*(c.shiny?1.05:1);}
export function slots(s){return Math.min(6,1+Math.floor(s.badges*5/8));}
export function begin(s,t,r,byId,now=Date.now()){
 if(t>=slots(s)||s.teams[t].run||s.badges<r.badge)return false;
 const team=s.teams[t];if(!team.ids.length)return false;
 const power=team.ids.reduce((a,f)=>a+strength(s.collection[f],byId[s.collection[f].id]),0);
 const hp=team.ids.reduce((a,f)=>a+100+s.collection[f].level*5+byId[s.collection[f].id].stats[0],0);
 team.run={route:r.id,hp,maxHp:hp,power,step:0,next:now+15000,status:'active',started:now};return true;
}
export function advance(s,routes,now=Date.now()){
 let completed=0;
 for(const t of s.teams){const run=t.run;if(!run||run.status!=='active')continue;const route=routes[run.route];
  const damage=Math.max(1,Math.ceil(18*Math.pow(route.enemy/run.power,1.25)));
  const due=Math.max(0,Math.floor((now-run.next)/15000)+1);const survival=Math.ceil(run.hp/damage);const n=Math.min(due,survival);if(!n)continue;
  const wins=Math.min(n,Math.max(0,survival-1));run.hp=Math.max(0,run.hp-n*damage);run.step+=wins;run.next+=n*15000;completed+=wins;
  s.packs[route.id]=(s.packs[route.id]||0)+wins;s.coins+=wins*(10+route.id*5);
  for(const f of t.ids){const c=s.collection[f];c.xp=(c.xp||0)+wins;while(c.xp>=5+c.level&&c.level<100){c.xp-=5+c.level;c.level++;}}
  if(run.hp<=0)run.status='fallen';
 }
 s.last=now;return completed;
}
export function openPack(s,r){if(!(s.packs[r.id]>0)||!r.pool.length)return [];
 s.packs[r.id]--;return Array.from({length:3},()=>{
 const weights=r.pool.map(p=>Math.exp(-(p.bst-r.min)/30)*(p.legendary?.15:1));let x=random(s)*weights.reduce((a,b)=>a+b,0);let i=0;while(i<weights.length-1&&x>=weights[i])x-=weights[i++];
 const p=r.pool[i];const shiny=random(s)<1/512;return {p,shiny,result:acquire(s,p,shiny)};
 });}
export function gym(s,byId){if(s.badges>=8)return {ok:false,required:0};
 const power=s.teams[0].ids.reduce((a,f)=>a+strength(s.collection[f],byId[s.collection[f].id]),0);const required=[500,900,1400,2000,2800,3700,4800,6200][s.badges];
 if(power<required)return {ok:false,required,power};s.badges++;s.coins+=500;s.teams[0].ids.forEach(f=>s.collection[f].level=Math.min(100,s.collection[f].level+3));return {ok:true,required,power};}
