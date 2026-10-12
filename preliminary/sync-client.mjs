// Local preparation is optimistic; only commands, never save snapshots, leave the client.
export function createSyncClient({revision,request,accept,preview,notify,changed,completed,delay=2000}){
 let pending=[],flight=null,uncertain=null,timer=null,critical=false,error=false;
 const status=()=>({busy:!!flight,pending:pending.length>0||!!uncertain,critical,error});
 const update=()=>changed(status());
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>flush(),delay);update();}
 function edit(action){
  if(error||critical){notify(error?'Reconecta para guardar los cambios':'Espera a que se confirme la operación');return;}
  try{if(pending.length>=100)throw Error('Espera a que se guarden los cambios pendientes');preview(action);pending.push(action);schedule();if(pending.length>=80&&!flight)flush();}catch(e){notify(e.message);}
 }
 async function perform(action=null){
  const edits=pending.splice(0);const operation=uncertain||{revision:revision(),opId:crypto.randomUUID(),action:{...(action||{type:'sync'}),preparation:edits}};
  // An uncertain operation must keep its exact ID and payload when retried.
  if(uncertain)pending.unshift(...edits);
  try{
   let response,data;
   for(let attempt=0;attempt<3;attempt++){
    try{response=await request(operation);data=await response.json();if(response.status<500)break;}catch(e){if(attempt===2)throw e;}
   }
   if(!response?.ok){
    if(response?.status===409&&data.state){pending=[];uncertain=null;error=false;accept(data);notify(data.error);return false;}
    if(response?.status>=400&&response.status<500){pending=[];uncertain=null;error=true;notify(data.error||'Vuelve a sincronizar tu cuenta');return false;}
    throw Error(data?.error||'Sin conexión');
   }
   uncertain=null;error=false;accept(data);
   // Edits made during the background request are reapplied to the new authority.
   const next=pending;pending=[];
   for(const edit of next){try{preview(edit);pending.push(edit);}catch(e){notify(e.message);}}
   if(operation.action.type!=='sync')completed(operation.action,data.result);
   return true;
  }catch(e){uncertain=operation;error=true;notify('Sin conexión. Tus cambios están pendientes; pulsa Sincronizar para reintentar.');return false;}
 }
 async function flush(action=null){
  clearTimeout(timer);
  if(!action&&flight)return flight;
  if(action&&critical)return false;
  if(action&&error){notify('Sincroniza tu cuenta para comprobar la última operación');return false;}
  if(action)critical=true;
  try{
   if(flight){const ok=await flight;if(!ok)return false;}
   if(error&&!uncertain)return false;
   if(uncertain){flight=perform();update();const ok=await flight;flight=null;if(!ok)return false;}
   if(!action&&!pending.length)return true;
   flight=perform(action);update();return await flight;
  }finally{flight=null;if(action)critical=false;update();if(pending.length&&!error&&!critical)schedule();}
 }
 async function refresh(load){
  if(critical)return false;
  if(flight)return flight;
  if(error&&!uncertain)error=false;
  if(uncertain||pending.length){const ok=await flush();if(!ok)return false;}
  // Reserve the transport so commands wait behind this read as well.
  flight=(async()=>{try{const data=await load();error=false;accept(data);const edits=pending;pending=[];for(const a of edits){try{preview(a);pending.push(a);}catch(e){notify(e.message);}}return true;}catch(e){error=true;notify(e.message);return false;}})();
  update();try{return await flight;}finally{flight=null;update();if(pending.length&&!error&&!critical)schedule();}
 }
 return {edit,flush,refresh,status};
}
