import {ensureMoves} from './combat.mjs';
let species={},rules={};
export function configureEvolution(catalog,data){species=Object.fromEntries(catalog.map(p=>[p.id,p]));rules=data;}
export function evolutionOptions(c){return Object.values(species).filter(p=>p.parent===c.id).map(p=>({p,level:rules[p.id]?.level||(p.stage===1?25:40),adapted:rules[p.id]?.adapted??true}));}
export function evolveTo(c,id){const option=evolutionOptions(c).find(o=>o.p.id===id);if(!option||c.level<option.level)return false;c.id=id;if(!c.unlocked.includes(id))c.unlocked.push(id);ensureMoves(c,option.p);return true;}
export function autoEvolve(c){const changes=[];for(let i=0;i<4;i++){const options=evolutionOptions(c);if(options.length!==1||c.level<options[0].level)break;const from=c.id; if(!evolveTo(c,options[0].p.id))break;changes.push({from,to:c.id});}return changes;}
