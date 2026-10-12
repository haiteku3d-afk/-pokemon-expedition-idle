import assert from 'node:assert/strict';
import {createSyncClient} from './sync-client.mjs';
const originalSetTimeout=globalThis.setTimeout,originalClearTimeout=globalThis.clearTimeout;
let timer;globalThis.setTimeout=fn=>(timer=fn,1);globalThis.clearTimeout=()=>{timer=null;};
let state={value:0},revision=0,server=0,calls=[],notifications=[],completions=[],gate=null,offline=false,loseResponse=false,conflict=false;
const records=new Map();
const sync=createSyncClient({revision:()=>revision,preview:a=>{state.value+=a.delta;},accept:d=>{state={...d.state};revision=d.revision;},notify:t=>notifications.push(t),changed:()=>{},completed:(a,r)=>completions.push(a.type),request:async op=>{
 calls.push(structuredClone(op));if(gate)await gate;if(offline)throw Error('offline');
 if(conflict)return Response.json({state:{value:server},revision,error:'otro dispositivo'},{status:409});
 if(records.has(op.opId))return Response.json(records.get(op.opId));
 for(const a of op.action.preparation)server+=a.delta;
 const data={state:{value:server},revision:++revision,result:{}};records.set(op.opId,data);
 if(loseResponse){loseResponse=false;throw Error('response lost');}return Response.json(data);
}});
sync.edit({type:'pick',delta:1});sync.edit({type:'order',delta:2});assert.equal(state.value,3);assert.equal(calls.length,0);assert(sync.status().pending);
// Start carries preparation in one authoritative operation.
await sync.flush({type:'begin'});assert.equal(calls.length,1);assert.equal(calls[0].action.preparation.length,2);assert.equal(server,3);assert.deepEqual(completions,['begin']);
// Background response cannot erase edits made while it travels.
sync.edit({type:'equip',delta:4});let release;gate=new Promise(r=>release=r);const saving=sync.flush();sync.edit({type:'recommend',delta:8});assert.equal(state.value,15);release();await saving;gate=null;assert.equal(state.value,15);assert.equal(server,7);assert(sync.status().pending);await sync.flush();assert.equal(server,15);
// Several critical clicks cannot spend a pack twice. Preparation waits for background save.
sync.edit({type:'pick',delta:1});gate=new Promise(r=>release=r);const background=sync.flush();const start=sync.flush({type:'open'});assert.equal(await sync.flush({type:'open'}),false);release();await background;await start;gate=null;assert.equal(completions.filter(x=>x==='open').length,1);
// Exact payload survives all failed attempts and reconnect, including an accepted lost response.
sync.edit({type:'pick',delta:2});offline=true;await sync.flush();const failed=calls.at(-1);assert(sync.status().error);offline=false;loseResponse=true;await sync.refresh(async()=>({state:{value:server},revision}));assert.equal(server,18);assert(calls.filter(x=>x.opId===failed.opId).every(x=>JSON.stringify(x)===JSON.stringify(failed)));assert(!sync.status().pending);
// Conflicts discard stale optimistic toggles instead of replaying them on another device's team.
sync.edit({type:'order',delta:100});conflict=true;await sync.flush();assert.equal(state.value,18);assert(!sync.status().pending);assert(notifications.includes('otro dispositivo'));conflict=false;
// The debounce executes without a second click.
sync.edit({type:'pick',delta:3});await timer();assert.equal(server,21);
globalThis.setTimeout=originalSetTimeout;globalThis.clearTimeout=originalClearTimeout;
console.log('PASS immediate preparation, debounce, atomic start, concurrent edits, duplicate critical clicks, lost responses, reconnect and device conflicts');
