import assert from 'node:assert/strict';
import fs from 'node:fs';
import {configureCombat,initial,acquire,makeRoutes,gym,advance,GYMS,RANKS,gymKey,gymUnlocked,gymProgress,gymSpecies,gymPackSources,openPacks,slots,TEAM_BADGES,encounterDelay,teamSpeed,migrate,routeUnlocked,quickStart} from './engine.mjs';
import {EXCLUSIVE_IDS} from './gyms.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url)));
const catalog=read('catalog.json').map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)})),by=Object.fromEntries(catalog.map(p=>[p.id,p])),routes=makeRoutes(catalog),chart=read('type-chart.json');configureCombat(catalog,read('moves.json'));
const award=(s,id)=>{s.gymProgress[id]={medal:true,cycles:10,wins:[9,1,0],pity:0};s.badges=Object.keys(s.gymProgress).length;};
const strong=()=>{const s=initial(0);for(const id of [150,382,383,384,493,890]){acquire(s,by[id]);const c=s.collection[by[id].family];c.level=100;c.xp=1000000;s.teams[0].ids.push(by[id].family);}return s;};
assert.equal(GYMS.length,18);assert.equal(new Set(GYMS.map(g=>g.type)).size,18);assert.equal(EXCLUSIVE_IDS.size,18);assert.equal(new Set([...routes.flatMap(r=>r.pool.map(p=>p.id)),...EXCLUSIVE_IDS]).size,1025);
for(const g of GYMS){assert(by[g.exclusive].types.includes(g.type));assert.equal(by[g.exclusive].parent,0);assert(!catalog.some(p=>p.parent===g.exclusive));}
for(let n=0;n<=18;n++)assert.equal(slots({...initial(0),badges:n}),TEAM_BADGES.filter(x=>n>=x).length);
const gate=initial(0);assert.equal(GYMS.filter(g=>gymUnlocked(gate,g)).length,6);for(let i=0;i<4;i++)award(gate,i);assert.equal(GYMS.filter(g=>gymUnlocked(gate,g)).length,12);for(let i=4;i<10;i++)award(gate,i);assert.equal(GYMS.filter(g=>gymUnlocked(gate,g)).length,18);
assert(!gymUnlocked(initial(),GYMS[0],1));const rankState=initial();award(rankState,0);rankState.gymProgress[0].cycles=2;assert(!gymUnlocked(rankState,GYMS[0],1));rankState.gymProgress[0].cycles=3;assert(gymUnlocked(rankState,GYMS[0],1));assert(!gymUnlocked(rankState,GYMS[0],2));rankState.gymProgress[0].cycles=10;rankState.gymProgress[0].wins[1]=0;assert(!gymUnlocked(rankState,GYMS[0],2));rankState.gymProgress[0].wins[1]=1;assert(gymUnlocked(rankState,GYMS[0],2));
// Real duels in all 54 combinations: type matching, level cap, endless cycles,
// finite defeat, no XP/coins, chronological offline identity and no rewards after defeat.
let wins=0,packs=0;
for(const g of GYMS)for(let rank=0;rank<3;rank++){
 const s=strong();for(const other of GYMS)if(other.id!==g.id)award(s,other.id);if(rank)award(s,g.id);
 const before=JSON.stringify(s.collection),coins=s.coins,oldBadges=s.badges;assert(gym(s,by,0,g.id,rank).ok);const run=s.teams[0].run;
 assert(run.fighters.every(f=>f.level===g.level+RANKS[rank].offset+2));assert(run.opponents.every(f=>f.types.includes(g.type)));assert.equal(run.opponents.length,5+rank);
 const live=structuredClone(s);advance(s,routes,8*3600000,chart);for(let time=1000;time<=8*3600000;time+=1000)advance(live,routes,time,chart);assert.deepEqual(s,live);
 assert.equal(run.status,'fallen');assert(run.step>0);if(!rank)assert(run.cycle>=1);assert.equal(s.badges,rank?oldBadges:oldBadges+1);assert.equal(JSON.stringify(s.collection),before);assert.equal(s.coins,coins);assert.deepEqual(s.routeWins,{});assert.equal(s.packs[gymKey(g.id,rank)]||0,run.drops);if(!rank)assert(run.drops>0);
 const ended=JSON.stringify({...s,last:0});advance(s,routes,16*3600000,chart);assert.equal(JSON.stringify({...s,last:0}),ended);
 assert(quickStart(s,0,routes,by,16*3600000));assert.equal(s.teams[0].run.gymIndex,g.id);assert.equal(s.teams[0].run.rank,rank);assert.equal(s.teams[0].run.cycle,0);assert.equal(s.teams[0].run.hp,s.teams[0].run.maxHp);wins+=run.step;packs+=run.drops;
}
// Bulk type packs never leak another exclusive, obey category limits and are
// identical to individual opens. Pity spans categories and caps the drought at 20.
for(const g of GYMS){const s=initial(0);award(s,g.id);s.gymProgress[g.id].pity=19;const sources=gymPackSources(catalog).filter(r=>r.gymId===g.id);for(const source of sources){s.packs[source.id]=50;const one=structuredClone(s);const batch=openPacks(s,source,50);for(let i=0;i<50;i++)openPacks(one,source,1);assert.deepEqual(s,one);assert.equal(batch.results.length,150);assert(batch.results.every(x=>x.p.types.includes(g.type)));assert(batch.results.every(x=>!EXCLUSIVE_IDS.has(x.p.id)||x.p.id===g.exclusive));assert(batch.results.every(x=>x.p.id===g.exclusive||x.p.bst<=RANKS[source.rank].pwb));let drought=source.rank===0?19:0;for(let i=0;i<batch.results.length;i+=3){const has=batch.results.slice(i,i+3).some(x=>x.p.id===g.exclusive);drought=has?0:drought+1;assert(drought<20);}if(source.rank===0)assert.equal(batch.results[0].p.id,g.exclusive);}
 for(let rank=1;rank<3;rank++){const previous=gymSpecies(s,catalog,g,rank-1);const next=gymSpecies(s,catalog,g,rank);assert(previous.every(p=>next.some(q=>q.id===p.id)));assert(next.some(p=>p.bst>RANKS[rank-1].pwb));}const locked=initial(0),source=sources[0];locked.packs[source.id]=100;assert(openPacks(locked,source,100).results.every(x=>x.p.id!==g.exclusive));const before=gymSpecies(locked,catalog,g,0).length;locked.gymProgress[g.id]={medal:true,cycles:2,wins:[2,0,0],pity:0};assert.equal(gymSpecies(locked,catalog,g,0).length,Math.min(source.pool.length,before+5));
}
// Old saves preserve all previously available routes and team slots without
// creating duplicate medals or resetting collection/route packs.
for(let badges=0;badges<=8;badges++){
 const s=strong();s.version=6;s.badges=badges;delete s.gymProgress;s.packs[0]=4;s.teams[0].run={kind:'gym',status:'active'};
 const collection=JSON.stringify(s.collection);migrate(s);assert.equal(s.version,7);assert.equal(s.badges,badges);assert(slots(s)>=1+Math.floor(badges*5/8));assert.equal(s.packs[0],4);assert.equal(s.teams[0].run,null);assert.equal(JSON.stringify(s.collection),collection);
 for(const r of routes)if(Math.min(8,Math.floor(r.id/1.4))<=badges)assert(routeUnlocked(s,r));assert.deepEqual(migrate(structuredClone(s)),s);
}
// Zone-relative travel: equal/below threshold remains 15s; adding a slow member
// cannot create speed; fainted members no longer affect the average.
const f=n=>({hp:10,stats:[10,10,10,10,10,n]});assert.equal(encounterDelay([f(10)],20),15000);assert.equal(encounterDelay([f(20)],20),15000);assert.equal(encounterDelay([f(40)],20),10000);assert.equal(encounterDelay([f(60)],20),7500);assert.equal(encounterDelay([f(10000)],20),3000);assert(encounterDelay([f(80),f(10)],20)>encounterDelay([f(80)],20));assert.equal(teamSpeed([f(80),{...f(10),hp:0}]),80);assert.equal(encounterDelay([f(50)],routes[10]),15000);assert(routes.every((r,i)=>i===0||r.speed>routes[i-1].speed));
// Simultaneous first clears award only one medal and share rank progress offline.
const multi=strong();for(let i=0;i<5;i++)award(multi,i);multi.teams[1].ids=multi.teams[0].ids.splice(3);assert(gym(multi,by,0,5,0,0).ok);assert(gym(multi,by,0,5,0,1).ok);const online=structuredClone(multi);advance(multi,routes,3600000,chart);for(let at=1000;at<=3600000;at+=1000)advance(online,routes,at,chart);assert.deepEqual(multi,online);assert(multi.badges<=6);
console.log('PASS 18 types / 54 categories, real-duel survival, rank gates, medals, team slots, typed packs, exclusivity, pity, bulk equivalence, migration, travel thresholds, concurrent offline simulation', {wins,packs});
