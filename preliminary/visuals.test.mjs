import assert from 'node:assert/strict';
import {ROUTE_THEMES,damageTone,visibleDamageEvents,campMotion} from './visuals.mjs';
assert.equal(new Set(ROUTE_THEMES.map(t=>t.key)).size,11);
assert.deepEqual([.1,.25,.5,1,2,4].map(damageTone),['minimal','resisted','resisted','normal','effective','overwhelming']);
assert.deepEqual(visibleDamageEvents([{at:0,damage:5},{at:1900,damage:7},{at:2000,damage:0},{at:2100,damage:8}],2000),[{at:1900,damage:7}]);
for(let id=1;id<=1025;id++){const a=campMotion(id,100000),b=campMotion(id,101000);assert(a.x>=8&&a.x<=84&&a.y>=18&&a.y<=79);assert.notDeepEqual(a,b);assert.deepEqual(a,campMotion(id,100000));}
console.log('PASS route themes, effectiveness, stale hits and camp movement for every species');
for(let id=1;id<=1025;id++)for(let time=0;time<100000;time+=997){const m=campMotion(id,time);assert(m.x>=14&&m.x<=81&&m.y>=30&&m.y<=74);}
console.log('PASS every species stays within the open meadow across its walking cycle');
