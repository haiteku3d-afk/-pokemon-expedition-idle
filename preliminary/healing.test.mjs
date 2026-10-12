import assert from 'node:assert/strict';import fs from 'node:fs';
import {configureCombat,moveById,applyMove,moveCharge} from './combat.mjs';
import {initial,chooseStarter,begin,advance,makeRoutes} from './engine.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url))),catalog=read('catalog.json').map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)})),by=Object.fromEntries(catalog.map(p=>[p.id,p])),routes=makeRoutes(catalog);configureCombat(catalog,read('moves.json'));
const f=()=>({id:1,hp:160,maxHp:160,level:10,types:[1],stats:[160,10,10,10,10,50],stages:Array(8).fill(0),volatile:{},aura:1});
const hit=(a,d,key,seed=123)=>applyMove(a,d,{...moveById(key),accuracy:100},{},{seed,weather:null});
// Real Drenadoras applies a nonstacking mark, then drains when its target acts.
const caster=f(),target=f();caster.hp=40;hit(caster,target,73);assert(target.volatile.seed);const before=target.hp,result=hit(target,caster,45);assert.equal(before-target.hp,20);assert.equal(caster.hp,40-result.damage+20);assert(result.hpEvents.some(e=>e.side===1&&e.kind==='heal'&&e.damage===20));assert(result.notes.some(n=>n.includes('drenadoras +20')));
// A target with 3 HP yields only 3 HP, not the nominal 20.
const dying=f(),receiver=f();dying.hp=3;dying.volatile.seed=1;receiver.hp=40;const short=hit(dying,receiver,45);assert.equal(dying.hp,0);assert.equal(receiver.hp,40-short.damage+3);assert(short.hpEvents.some(e=>e.kind==='heal'&&e.damage===3));
const blocked=f(),seeded=f();blocked.hp=40;blocked.volatile.healBlock=1;seeded.volatile.seed=1;const noHeal=hit(seeded,blocked,45);assert(!noHeal.hpEvents.some(e=>e.kind==='heal'));assert.equal(blocked.hp,40-noHeal.damage);
const fainted=f(),drainer=f();fainted.hp=0;drainer.volatile.seed=1;assert(!hit(drainer,fainted,45).hpEvents.some(e=>e.kind==='heal'));assert.equal(fainted.hp,0);
// Acua Aro now regens 1/16, reusing it never doubles the effect.
const ring=f(),dummy=f();ring.hp=40;const first=hit(ring,dummy,392);assert.equal(ring.hp,50);assert(ring.volatile.aquaRing);assert(first.hpEvents.some(e=>e.kind==='heal'&&e.damage===10));hit(ring,dummy,392);assert.equal(ring.hp,60);
ring.volatile.ingrain=1;hit(ring,dummy,45);assert.equal(ring.hp,80);
// Regeneration cannot revive a Pokemon that falls to poison/burn in its action.
const poisoned=f();poisoned.hp=1;poisoned.status='poison';poisoned.volatile={ingrain:1,aquaRing:1};assert(!hit(poisoned,f(),45).hpEvents.some(e=>e.kind==='heal'));assert.equal(poisoned.hp,0);
// Drain is based on actual damage and visual heals respect missing HP.
const absorber=f(),low=f();absorber.hp=40;low.hp=3;const absorbed=hit(absorber,low,71);assert.equal(absorbed.damage,3);assert.equal(absorber.hp,41);assert(absorbed.hpEvents.some(e=>e.kind==='heal'&&e.damage===1));
const recover=f();recover.hp=159;const capped=hit(recover,f(),105);assert.equal(recover.hp,160);assert(capped.hpEvents.some(e=>e.kind==='heal'&&e.damage===1));assert(capped.notes.some(n=>n==='curación +1 PS'));
const rest=f();rest.hp=20;rest.volatile.healBlock=1;hit(rest,f(),156);assert.equal(rest.hp,20);assert.notEqual(rest.status,'sleep');delete rest.volatile.healBlock;hit(rest,f(),156);assert.equal(rest.hp,160);assert.equal(rest.status,'sleep');
const charge=f(),plain={...moveById(73),ailment:0};assert(moveCharge(charge,moveById(73))>moveCharge(charge,plain));assert(moveCharge(charge,moveById(105))>moveCharge(charge,{...moveById(105),healing:0}));
// Live event mapping shows healing on the ally during an enemy action, and
// offline replay stays identical with both damage and healing in one action.
const s=initial(0);chooseStarter(s,by[1]);begin(s,0,routes[0],by,0);const run=s.teams[0].run;advance(s,routes,run.encounterAt,{});const ally=run.fighters[0],foe=run.enemies[0];ally.hp=5;foe.volatile.seed=1;foe.moves=[45];foe.queuedMove=45;foe.readyAt=run.next;ally.readyAt=run.next+10000;foe.stats[1]=1;foe.stats[3]=1;const beforeOnline=structuredClone(s);advance(s,routes,run.next,{});assert(run.visualEvents.some(e=>e.side===0&&e.kind==='heal'));const live=structuredClone(beforeOnline);advance(beforeOnline,routes,3600000,{});for(let time=200;time<=3600000;time+=200)advance(live,routes,time,{});assert.deepEqual(live,beforeOnline);
console.log('PASS Drenadoras real HP and visible healing, near-death absorption, heal block, no revives, Acua Aro, nonstacking regen, capped recovery, Descanso, charge balance and offline equivalence');
