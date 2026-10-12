import assert from 'node:assert/strict';import fs from 'node:fs';
import {testDatabase} from './cloud-test-support.mjs';
import {handleGameRequest} from './cloud-api.mjs';
import {configureCombat,makeRoutes,advance} from './engine.mjs';
import {ensureDaily,recordDaily} from './progression-meta.mjs';
import {configureEvolution} from './evolution.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url))),catalog=read('catalog.json').map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)})),config={catalog,byId:Object.fromEntries(catalog.map(p=>[p.id,p])),routes:makeRoutes(catalog),chart:read('type-chart.json')};configureCombat(catalog,read('moves.json'));configureEvolution(catalog,read('evolutions.json'));
const db=testDatabase();let now=100000;const user={userId:'alice',displayName:'Alice'},second={userId:'bob',displayName:'Bob'};
const get=u=>handleGameRequest(new Request('https://game.test/api/game'),u,db,config,()=>now);
const command=(u,revision,action,opId=crypto.randomUUID(),extra={})=>handleGameRequest(new Request('https://game.test/api/game',{method:'POST',headers:{'Content-Type':'application/json','X-Game-Client':'expedition-v13'},body:JSON.stringify({opId,revision,action,...extra})}),u,db,config,()=>now);
assert.equal((await get(null)).status,401);assert.equal(db.sql.prepare('SELECT count(*) AS n FROM players').get().n,0);
let alice=await (await get(user)).json();assert.equal(alice.state.starterId,null);assert.deepEqual(alice.state.collection,{});
assert.equal((await command(user,alice.revision,{type:'starter',id:150})).status,400);assert.equal((await command(user,alice.revision,{type:'demo'})).status,400);assert.equal((await command(user,alice.revision,{type:'simulate',time:999999999})).status,400);assert.equal((await command(user,alice.revision,{type:'sync'},undefined,{state:{coins:999999}})).status,400);
const id=crypto.randomUUID();alice=await (await command(user,alice.revision,{type:'starter',id:7},id)).json();const retry=await (await command(user,0,{type:'starter',id:7},id)).json();assert.equal(retry.revision,alice.revision);assert.deepEqual(retry.state,alice.state);
const bob=await (await get(second)).json();assert.equal(bob.state.starterId,null);assert.equal(Object.keys(bob.state.collection).length,0);
const pc=alice;const mobile=await (await get(user)).json();assert.equal(mobile.state.starterId,7);const conflict=await command(user,pc.revision,{type:'begin',id:0,route:0});assert.equal(conflict.status,409);assert.equal((await conflict.json()).state.starterId,7);
alice=await (await command(user,mobile.revision,{type:'begin',id:0,route:0})).json();assert.equal(alice.state.teams[0].run.status,'active');
const expected=structuredClone(alice.state);now+=8*3600000;advance(expected,config.routes,now,config.chart);alice=await (await get(user)).json();assert.deepEqual(alice.state,expected);assert.equal(alice.state.teams[0].run.status,'fallen');
const endedCoins=alice.state.coins;now+=3600000;alice=await (await get(user)).json();assert.equal(alice.state.coins,endedCoins);
// Real earned packs open once even when the exact network request is retried.
if(!(alice.state.packs[0]>0)){for(let i=0;i<10&&!(alice.state.packs[0]>0);i++){alice=await (await command(user,alice.revision,{type:'quick',id:0})).json();now+=3600000;alice=await (await get(user)).json();}}
assert(alice.state.packs[0]>0);const packs=alice.state.packs[0],opening=crypto.randomUUID(),revision=alice.revision;const one=await (await command(user,revision,{type:'open',id:'0',count:1},opening)).json();const duplicate=await (await command(user,revision,{type:'open',id:'0',count:1},opening)).json();assert.equal(one.state.packs[0],packs-1);assert.deepEqual(one,duplicate);assert.equal(one.result.batch.results.length,3);assert(one.result.batch.results.every(x=>Number.isInteger(x.level)&&x.level>=1&&x.level<=10));
// Preparation plus expedition start is atomic; invalid batches cannot partly save.
let fresh=await (await get(second)).json();fresh=await (await command(second,fresh.revision,{type:'starter',id:7})).json();
const beforeBatch=JSON.stringify(fresh.state),family=fresh.state.teams[0].ids[0];
assert.equal((await command(second,fresh.revision,{type:'sync',preparation:[{type:'pick',id:0,family},{type:'starter',id:4}]})).status,400);
assert.equal(db.sql.prepare('SELECT state FROM players WHERE user_id = ?').get(second.userId).state,beforeBatch);
assert.equal((await command(second,fresh.revision,{type:'sync',preparation:[{type:'pick',id:0,family,preparation:[]}]})).status,400);
fresh=await (await command(second,fresh.revision,{type:'begin',id:0,route:0,preparation:[{type:'pick',id:0,family},{type:'pick',id:0,family},{type:'recommend',id:7}]})).json();
assert.equal(fresh.state.teams[0].run.status,'active');assert.equal(fresh.state.collection[family].autoMoves,true);
// Cloud purchases and daily claims are saved once even if the accepted response is lost.
let meta=await (await get(second)).json();const fixture=meta.state;fixture.coins=50000;fixture.gymProgress={0:{medal:true,cycles:1,wins:[1,0,0],pity:0},1:{medal:true,cycles:1,wins:[1,0,0],pity:0},2:{medal:true,cycles:1,wins:[1,0,0],pity:0}};fixture.teams[0].run=null;ensureDaily(fixture,now);fixture.daily.leaderMode=false;for(let i=0;i<30;i++)recordDaily(fixture,now,{routeId:0,drop:i<3});db.sql.prepare('UPDATE players SET state = ? WHERE user_id = ?').run(JSON.stringify(fixture),second.userId);
meta=await (await get(second)).json();const purchaseId=crypto.randomUUID(),purchaseRevision=meta.revision,priorCoins=meta.state.coins;meta=await (await command(second,purchaseRevision,{type:'reviveUpgrade',id:0},purchaseId)).json();assert.equal(meta.state.secondChance[0],1);assert.equal(meta.state.coins,priorCoins-200);const retryPurchase=await (await command(second,purchaseRevision,{type:'reviveUpgrade',id:0},purchaseId)).json();assert.deepEqual(retryPurchase,meta);assert.equal((await command(second,meta.revision,{type:'reviveUpgrade',id:1})).status,400);
const claimId=crypto.randomUUID(),claimRevision=meta.revision,priorPacks=meta.state.packs[0]||0,day=meta.state.daily.day;meta=await (await command(second,claimRevision,{type:'dailyClaim',id:0,day},claimId)).json();assert.equal(meta.state.packs[0],priorPacks+1);const retryClaim=await (await command(second,claimRevision,{type:'dailyClaim',id:0,day},claimId)).json();assert.deepEqual(retryClaim,meta);assert.equal((await command(second,meta.revision,{type:'dailyClaim',id:0,day})).status,400);assert.equal((await command(second,meta.revision,{type:'dailyClaim',id:1,day,route:10})).status,400);assert.equal((await command(second,meta.revision,{type:'dailyClaim',id:1,day:'1900-01-01',route:0})).status,400);
// Authenticated write boundary rejects missing custom header and oversized input.
assert.equal((await handleGameRequest(new Request('https://game.test/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),user,db,config,()=>now)).status,403);
assert.equal((await handleGameRequest(new Request('https://game.test/api/game',{method:'POST',headers:{'Content-Type':'application/json','X-Game-Client':'expedition-v13'},body:'x'.repeat(12001)}),user,db,config,()=>now)).status,413);
console.log('PASS account isolation, fresh account, no cheats/imports, invalid starters, same-request retry, device conflicts, offline death cutoff, server-earned packs and authenticated writes');
