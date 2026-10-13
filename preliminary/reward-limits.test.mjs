import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,makeRoutes,acquire,begin,advance,gym,configureCombat,experienceShares,expeditionXpMultiplier,RUN_PACK_LIMIT,migrate,quickStart} from './engine.mjs';
import {configureEvolution} from './evolution.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url))),catalog=read('catalog.json').map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)})),by=Object.fromEntries(catalog.map(p=>[p.id,p])),routes=makeRoutes(catalog),chart=read('type-chart.json');configureCombat(catalog,read('moves.json'));configureEvolution(catalog,read('evolutions.json'));
assert.equal(RUN_PACK_LIMIT,50);
for(const [step,multiplier] of [[1,1],[25,1],[26,.75],[50,.75],[51,.5],[75,.5],[76,.25],[100,.25],[101,.1],[250,.1],[251,0],[5000,0]])assert.equal(expeditionXpMultiplier(step),multiplier);
const split={step:26,enemies:[{baseExperience:140,level:7}],fighters:[{family:1,hp:10},{family:2,hp:10},{family:3,hp:0}],lastBattle:{winnerFamily:1}};assert.deepEqual(experienceShares(split),[{family:1,amount:52},{family:2,amount:52}]);split.step=251;assert(experienceShares(split).every(x=>x.amount===0));
function state(){const s=initial(0);acquire(s,by[132],false,30);s.teams[0].ids=[by[132].family];assert(begin(s,0,routes[0],by,0));return s;}
function win(s){const r=s.teams[0].run,f=r.fighters[0],enemy=r.enemies[0];f.hp=f.maxHp;f.moves=[33];f.stats[1]=10000;f.stats[5]=10000;enemy.hp=1;enemy.baseExperience=140;enemy.level=7;enemy.moves=[33];enemy.stats[5]=1;const before=r.step;while(r.status==='active'&&r.step===before)advance(s,routes,r.next,chart);assert.equal(r.step,before+1);}
for(const previous of [24,25,49,50,74,75,99,100,249,250,1000]){const s=state(),r=s.teams[0].run;r.step=previous;r.drops=50;const oldXp=s.collection[by[132].family].xp,packs=JSON.stringify(s.packs);win(s);assert.equal(s.collection[by[132].family].xp-oldXp,Math.floor(140*expeditionXpMultiplier(previous+1)));assert.equal(r.drops,50);assert.equal(JSON.stringify(s.packs),packs);assert.equal(r.status,'active');}
// Reach the cap without exceeding it, regardless of further successful rolls.
const capped=state(),cr=capped.teams[0].run;cr.drops=49;capped.packs[0]=900;for(let i=0;i<100&&cr.drops<50;i++)win(capped);assert.equal(cr.drops,50);assert.equal(capped.packs[0],901);for(let i=0;i<100;i++)win(capped);assert.equal(cr.drops,50);assert.equal(capped.packs[0],901);
// No EXP beyond 250, but remaining pack allowance can still be earned.
const expCap=state(),er=expCap.teams[0].run;er.step=250;const xp=expCap.collection[by[132].family].xp;for(let i=0;i<100;i++)win(expCap);assert.equal(expCap.collection[by[132].family].xp,xp);assert(er.drops>0);assert.equal(er.status,'active');
// Existing runs retain their counters and already earned rewards.
const legacy=state(),lr=legacy.teams[0].run;lr.step=5000;lr.drops=900;legacy.packs[0]=900;const oldXp=legacy.collection[by[132].family].xp;migrate(legacy);win(legacy);assert.equal(lr.drops,900);assert.equal(legacy.packs[0],900);assert.equal(legacy.collection[by[132].family].xp,oldXp);lr.status='fallen';assert(quickStart(legacy,0,routes,by,legacy.last));assert.equal(legacy.teams[0].run.step,0);assert.equal(legacy.teams[0].run.drops,0);assert.equal(legacy.packs[0],900);
// Gym cap preserves medals and category progress, with no EXP or coins.
const gs=initial(0);acquire(gs,by[132],false,30);gs.teams[0].ids=[by[132].family];assert(gym(gs,by,0,0,0,0).ok);const gr=gs.teams[0].run;gr.drops=50;const oldPacks=JSON.stringify(gs.packs);for(let i=0;i<5;i++)win(gs);assert.equal(gr.drops,50);assert.equal(JSON.stringify(gs.packs),oldPacks);assert(gs.gymProgress[0].medal);assert.equal(gr.xp,0);assert.equal(gr.coins,0);
// The same event timeline produces identical online and offline rewards.
const off=state(),rr=off.teams[0].run;rr.step=249;rr.drops=49;rr.fighters[0].stats=[100000,10000,10000,10000,10000,10000];rr.fighters[0].hp=rr.fighters[0].maxHp=100000;rr.fighters[0].moves=[33];const on=structuredClone(off);advance(off,routes,3600000,chart);for(let at=1000;at<=3600000;at+=1000)advance(on,routes,at,chart);assert.deepEqual(on,off);assert(rr.step>250);assert(rr.drops<=50);
console.log('PASS all EXP boundaries, shared EXP, independent caps, pack ceiling, existing balances/runs, restart, gym medals and online/offline parity');
