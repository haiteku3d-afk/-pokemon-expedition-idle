import {cloudStore,ConflictError} from './cloud-store.mjs';
import {ActionError} from './actions.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handleGameRequest(request,user,db,config,clock=Date.now){
 if(!user?.userId)return json({error:'AUTH_REQUIRED'},401);
 try{
  const store=cloudStore(db,config,clock);let snapshot;
  if(request.method==='GET')snapshot=await store.load(user.userId);
  else if(request.method==='POST'){
   if(request.headers.get('x-game-client')!=='expedition-v13'||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Solicitud inválida'},403);
   const text=await request.text();if(text.length>12000)return json({error:'Solicitud demasiado grande'},413);const input=JSON.parse(text);
   if(!Number.isInteger(input.revision)||input.revision<0||typeof input.opId!=='string'||!/^[a-zA-Z0-9-]{8,100}$/.test(input.opId)||!input.action||Object.keys(input).some(k=>!['revision','opId','action'].includes(k)))return json({error:'Solicitud inválida'},400);
   snapshot=await store.execute(user.userId,input);
  }else return json({error:'Método no permitido'},405);
  return json({...snapshot,user:{id:user.userId,name:user.displayName||'Entrenador'}});
 }catch(error){
  if(error instanceof ConflictError)return json({...error.snapshot,error:error.message},409);
  if(error instanceof ActionError||error instanceof SyntaxError)return json({error:error.message},400);
  console.error('Game storage failed',error);return json({error:'No se pudo sincronizar. Intenta nuevamente.'},503);
 }
}
