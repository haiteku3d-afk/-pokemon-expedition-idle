import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,makeRoutes,acquire,begin,advance,fighter,activeFighter,migrate,gym,configureCombat} from './engine.mjs';
import {bestFighter,matchupScore} from './combat.mjs';
import {configureEvolution} from './evolution.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url))),catalog=read('catalog.json').map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)})),by=Object.fromEntries(catalog.map(p=>[p.id,p])),chart=read('type-chart.json'),routes=makeRoutes(catalog);
configureCombat(catalog,read('moves.json'));configureEvolution(catalog,read('evolutions.json'));
const make=(id,type,move)=>({id,family:by[id]?.family??id,level:30,types:[type],moves:[move],stats:[100,60,60,60,60,60],maxHp:100,hp:100,aura:1,stages:Array(8).fill(0),volatile:{},moveCursor:0});
const fire=make(4,10,52),water=make(7,11,55),grass=make(1,12,22),foe=make(99,12,22);
const before=JSON.stringify([fire,water,foe]);assert.equal(bestFighter([water,fire],foe,chart),fire);assert.equal(JSON.stringify([fire,water,foe]),before);
assert.equal(bestFighter([fire,water],make(98,10,52),chart),water);
const wounded={...fire,hp:1};assert.equal(bestFighter([wounded,water],foe,chart),water);
assert.equal(bestFighter([{...fire,hp:0},water],foe,chart),water);assert.equal(bestFighter([{...fire,hp:0}],foe,chart),undefined);
const twin={...fire,id:44,family:44};assert.equal(bestFighter([twin,fire],foe,chart),twin);assert.equal(bestFighter([fire,twin],foe,chart),fire);
const strong={...water,stats:[100,600,600,600,600,600]};assert.equal(bestFighter([fire,strong],foe,chart),strong);
assert(matchupScore({...fire,status:'burn'},foe,chart)<matchupScore(fire,foe,chart));
function state(){const s=initial(0);for(const id of [1,4,7])acquire(s,by[id],false,30);s.teams[0].ids=[by[7].family,by[1].family,by[4].family];assert(begin(s,0,routes[0],by,0));s.teams[0].run.fighters=[structuredClone(water),structuredClone(grass),structuredClone(fire)];s.teams[0].run.enemies=[structuredClone(foe)];return s;}
const s=state(),run=s.teams[0].run,ids=[...s.teams[0].ids];advance(s,routes,run.encounterAt,chart);assert.equal(activeFighter(run).id,4);assert.equal(run.activeFamily,by[4].family);assert.deepEqual(s.teams[0].ids,ids);assert.deepEqual(run.fighters.map(f=>f.id),[7,1,4]);assert.equal(run.fighters[0].readyAt,undefined);
// It stays selected even if a reserve later has a higher score.
run.fighters[0].stats=[100,6000,6000,6000,6000,6000];const at=run.next;advance(s,routes,at,chart);assert.equal(activeFighter(run).id,4);
// Exhaustion replaces it against the same wounded foe without healing reserves.
run.fighters[0].stats=[100,60,60,60,60,60];run.enemies[0].hp=80;run.next=run.duelEndsAt;const reserveHp=run.fighters[0].hp;advance(s,routes,run.next,chart);assert.equal(run.fighters[2].hp,0);assert.equal(activeFighter(run).id,1);assert.equal(run.enemies[0].hp,80);assert.equal(run.fighters[0].hp,reserveHp);assert(run.currentReport.swaps.some(x=>x.from===4&&x.to===1));assert.equal(activeFighter(run).queuedMove,22);
// Existing saved duels retain the already charged participant until they end.
const legacy=state(),lr=legacy.teams[0].run;advance(legacy,routes,lr.encounterAt,chart);delete lr.activeFamily;lr.currentReport.participants=[by[7].family];lr.fighters[0].readyAt=lr.next+10000;lr.fighters[0].queuedMove=55;lr.fighters[2].readyAt=null;lr.enemies[0].readyAt=lr.next;assert.equal(activeFighter(lr).id,7);migrate(legacy);advance(legacy,routes,lr.next,chart);assert.equal(lr.activeFamily,by[7].family);assert(lr.currentReport.events.some(e=>e.target===7));
// Fresh encounters re-evaluate all survivors, including after serialization.
const second=state(),sr=second.teams[0].run;advance(second,routes,sr.encounterAt,chart);sr.phase='walk';sr.enemies=[make(98,10,52)];for(const f of sr.fighters){f.hp=100;f.readyAt=null;f.moveCursor=0;}sr.next=sr.encounterAt+10000;const restored=JSON.parse(JSON.stringify(second));advance(restored,routes,sr.next,chart);assert.equal(activeFighter(restored.teams[0].run).id,7);
const offline=state(),online=structuredClone(offline);advance(offline,routes,3600000,chart);for(let at=200;at<=3600000;at+=200)advance(online,routes,at,chart);assert.deepEqual(online,offline);
// Gym opponents use the same selection and remain subject to their level cap.
const g=initial(0);for(const id of [1,4,7])acquire(g,by[id],false,30);g.teams[0].ids=[by[7].family,by[1].family,by[4].family];assert(gym(g,by,0,2,0,0).ok);const gr=g.teams[0].run,expected=bestFighter(gr.fighters,gr.enemies[0],chart);advance(g,routes,gr.encounterAt,chart);assert.equal(activeFighter(gr).family,expected.family);assert(gr.fighters.every(f=>f.level<=gr.levelCap));
console.log('PASS per-opponent selection, moves/types/stats/HP, deterministic ties, no mutation, locked duels, faint replacement, saved duels, new rivals, offline parity and gyms');
