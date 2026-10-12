import {stageMultiplier,moveById} from './combat.mjs';
const STATS=[['PS','PS'],['ATQ','Ataque'],['DEF','Defensa'],['A. ESP','Ataque especial'],['D. ESP','Defensa especial'],['VEL','Velocidad'],['PREC','Precisión'],['EVAS','Evasión']];
const STATUS={
 paralysis:['Parálisis','paralysis','Velocidad reducida y posibilidad de perder la acción.'],
 sleep:['Dormido','sleep','No actúa hasta despertar.'],
 freeze:['Congelado','freeze','No actúa hasta descongelarse.'],
 burn:['Quemadura','burn','Reduce el daño físico y causa daño residual.'],
 poison:['Veneno','poison','Causa daño residual.']
};
const VOLATILE={confusion:['Confusión','Puede dañarse a sí mismo.'],infatuation:['Enamorado','Puede perder la acción.'],trap:['Atrapado','Recibe daño residual.'],nightmare:['Pesadilla','Recibe daño residual mientras duerme.'],torment:['Tormento','No puede repetir el último movimiento.'],yawn:['Somnoliento','El sueño se activa al terminar la cuenta.'],healBlock:['Sin curación','La curación está bloqueada.'],seed:['Drenadoras','Pierde PS que recupera el rival.'],perish:['Canto mortal','Se debilita al terminar la cuenta.'],ingrain:['Arraigo','Recupera PS después de actuar.'],aquaRing:['Acua Aro','Recupera PS después de actuar.'],silence:['Silencio','Efecto temporal activo.'],tar:['Alquitranado','Recibe más daño de Fuego.'],protect:['Protegido','Reduce el próximo golpe recibido.'],reflect:['Reflejo','Reduce el daño físico recibido.'],lightScreen:['Pantalla luz','Reduce el daño especial recibido.'],flinch:['Retroceso','Pierde su próxima acción.']};
// Read-only view of the current fighter, never a reconstruction from event logs.
export function fighterEffects(f){
 if(!f||f.hp<=0)return [];
 const out=[],v=f.volatile||{},status=STATUS[f.status];
 if(status){let [label,tone,title]=status;if(f.status==='poison'&&v.toxic>0){label='Veneno grave';title='Daño residual creciente.';}if(f.status==='sleep'&&f.statusTurns>0)label+=' · '+f.statusTurns;out.push({key:'status',label,tone,title});}
 for(const [key,[label,title]] of Object.entries(VOLATILE))if(v[key])out.push({key,label:label+(['confusion','yawn','perish'].includes(key)&&Number.isFinite(v[key])?' · '+v[key]:''),tone:['protect','reflect','lightScreen','ingrain'].includes(key)?'buff':'condition',title});
 if(v.disabled)out.push({key:'disabled',label:'Bloqueado',tone:'debuff',title:moveById(v.disabled).name+' no se puede usar.'});
 if(f.substitute>0)out.push({key:'substitute',label:'Sustituto · '+f.substitute+' PS',tone:'buff',title:'El sustituto absorbe el daño recibido.'});
 STATS.forEach(([short,label],i)=>{const n=f.stages?.[i]||0;if(!n)return;out.push({key:'stage-'+i,label:short+' '+(n>0?'↑ +':'↓ ')+n,tone:n>0?'buff':'debuff',title:label+': '+(n>0?'+':'')+n+' niveles (×'+Number(stageMultiplier(n).toFixed(2))+').'});});
 return out;
}
export const weatherEffect=weather=>({sun:'☀ Sol',rain:'☂ Lluvia',sand:'◌ Tormenta de arena',snow:'❄ Nieve'}[weather]||'');
