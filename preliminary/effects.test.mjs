import assert from 'node:assert/strict';
import {fighterEffects,weatherEffect} from './effects.mjs';
import {applyMove} from './combat.mjs';
const f=()=>({hp:100,maxHp:100,level:10,types:[1],stats:[100,20,20,20,20,20],stages:Array(8).fill(0),volatile:{},aura:1});
const a=f(),d=f(),run={seed:1};
const base={id:1,name:'Prueba',key:'test',type:1,category:2,power:1,accuracy:100,minHits:1,maxHits:1};
// Indicators reflect real state and stat changes made by the combat engine.
applyMove(a,d,{...base,ailment:4,ailmentChance:100,changes:[[2,-1]],statChance:100,target:10,adapted:true},{},run);
assert(fighterEffects(d).some(e=>e.label==='Quemadura'));
assert(fighterEffects(d).some(e=>e.label==='ATQ ↓ -1'&&e.tone==='debuff'));
applyMove(a,d,{...base,changes:[[4,2]],statChance:100,target:7},{},run);
assert(fighterEffects(a).some(e=>e.label==='A. ESP ↑ +2'&&e.tone==='buff'));
applyMove(a,d,{...base,key:'haze'},{},run);assert(!fighterEffects(d).some(e=>e.key.startsWith('stage-')));assert(!fighterEffects(a).some(e=>e.key.startsWith('stage-')));assert(fighterEffects(d).some(e=>e.label==='Quemadura'));
d.status=null;assert(!fighterEffects(d).some(e=>e.key==='status'));
for(const status of ['paralysis','sleep','freeze','burn','poison']){d.status=status;assert(fighterEffects(d).some(e=>e.key==='status'));}
d.volatile.toxic=3;assert(fighterEffects(d).some(e=>e.label==='Veneno grave'));
d.status='sleep';d.statusTurns=2;d.volatile={confusion:3,perish:2,reflect:1,lightScreen:1,protect:1,seed:3,disabled:33};d.substitute=10;const snapshot=JSON.stringify(d);const effects=fighterEffects(d);assert(effects.some(e=>e.label==='Dormido · 2'));assert(effects.some(e=>e.label==='Confusión · 3'));assert(effects.some(e=>e.label==='Canto mortal · 2'));assert(effects.some(e=>e.label==='Reflejo'));assert(effects.some(e=>e.label==='Pantalla luz'));assert(effects.some(e=>e.label==='Sustituto · 10 PS'));assert(effects.some(e=>e.key==='disabled'));assert.equal(JSON.stringify(d),snapshot);
d.hp=0;assert.deepEqual(fighterEffects(d),[]);assert.deepEqual(fighterEffects(null),[]);assert.deepEqual(fighterEffects(f()),[]);assert.equal(weatherEffect(null),'');for(const key of ['sun','rain','sand','snow'])assert(weatherEffect(key));console.log('PASS real combat states, stat stages, reset and cure, volatile effects, read-only indicators, fainting and weather');
