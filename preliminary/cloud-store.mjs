import {initial,migrate,advance} from './engine.mjs';
import {applyAction,ActionError} from './actions.mjs';
const select='SELECT * FROM players WHERE user_id = ?';
const response=(state,revision,now,result={})=>({state,revision,now,result});
export class ConflictError extends Error{constructor(snapshot){super('La partida cambió en otro dispositivo. Se cargó el progreso actualizado.');this.snapshot=snapshot;}}
export function cloudStore(db,config,clock=Date.now){
 async function rowFor(userId){let row=await db.prepare(select).bind(userId).first();if(!row){const now=clock(),s=initial(now);s.seed=crypto.getRandomValues(new Uint32Array(1))[0];await db.prepare('INSERT INTO players (user_id, state, revision, updated_at, last_op, last_result) VALUES (?, ?, 0, ?, NULL, NULL) ON CONFLICT(user_id) DO NOTHING').bind(userId,JSON.stringify(s),now).run();row=await db.prepare(select).bind(userId).first();}return row;}
 async function run(userId,operation=null){
  for(let attempt=0;attempt<4;attempt++){
   const row=await rowFor(userId),now=clock();let state=migrate(JSON.parse(row.state));
   if(operation?.opId&&row.last_op===operation.opId)return response(state,row.revision,now,JSON.parse(row.last_result||'{}'));
   if(operation&&operation.revision!==row.revision){advance(state,config.routes,now,config.chart);throw new ConflictError(response(state,row.revision,now));}
   advance(state,config.routes,now,config.chart);let result={};
   if(operation)result=applyAction(state,operation.action,{...config,now});
   const next=row.revision+1;
   const saved=await db.prepare('UPDATE players SET state = ?, revision = ?, updated_at = ?, last_op = ?, last_result = ? WHERE user_id = ? AND revision = ?').bind(JSON.stringify(state),next,now,operation?.opId??row.last_op,operation?JSON.stringify(result):row.last_result,userId,row.revision).run();
   if(saved.meta.changes===1)return response(state,next,now,result);
  }
  throw new ActionError('La partida está ocupada. Vuelve a sincronizar.');
 }
 return {load:userId=>run(userId),execute:(userId,operation)=>run(userId,operation)};
}
