export const PRESSURE_REACTIONS={
 Crise:[
  {id:'freeze',name:'Congelamento',effect:'Na próxima vez: Ação Padrão ou Movimento.',duration:'turn'},
  {id:'flight',name:'Fuga Instintiva',effect:'A próxima movimentação deve afastar você da ameaça, quando possível.',duration:'turn'},
  {id:'focus',name:'Foco Estreito',effect:'+1 dado contra a ameaça; −1 em ações não relacionadas.',duration:'turn',conditional:true},
  {id:'disorder',name:'Desorganização',effect:'Perca Mira, preparação ou outra vantagem temporária.',duration:'manual'},
  {id:'isolation',name:'Isolamento',effect:'Sem bônus de auxílio até o fim da próxima vez.',duration:'turn'},
  {id:'overload',name:'Sobrecarga',effect:'+2 dados de Pressão na próxima rolagem relevante.'},
 ],
 Ruptura:[
  {id:'paralysis',name:'Paralisia',effect:'Apenas Ações Livres e um Movimento até o fim da próxima vez.',duration:'turn'},
  {id:'escape',name:'Fuga',effect:'+1 dado para escapar; −1 para permanecer exposto à ameaça.',duration:'source',conditional:true},
  {id:'confront',name:'Confronto',effect:'+1 dado contra a ameaça; −1 em ações não relacionadas.',duration:'source',conditional:true},
  {id:'disconnect',name:'Desligamento',effect:'−1 dado em Controle Mental, Propósito e Influência. Ignora o próximo Abalo.',duration:'scene'},
  {id:'collapse',name:'Colapso',effect:'Sem Ação Padrão na próxima vez.',duration:'turn'},
  {id:'fixation',name:'Fixação',effect:'+1 dado relacionado ao alvo; −1 para abandoná-lo ou agir contra ele.',duration:'scene',conditional:true},
 ],
};
export const pressureEffects=sheet=>({nextPenalty:0,pending:[],conditions:[],sequence:0,ignoreAbalo:false,...sheet.pressureEffects});
export function pressureModifier(sheet,resource){const state=pressureEffects(sheet);return -state.nextPenalty+state.conditions.reduce((sum,item)=>sum+(item.id==='disconnect'&&['Controle Mental','Propósito','Influência'].includes(resource)?-1:item.conditional?Number(item.modifier)||0:0),0);}
export function settlePressure(sheet,result){
 const state={...pressureEffects(sheet),nextPenalty:0};
 const ones=(result.pressure||[]).filter(value=>value===1).length;
 const stress=['Controle','Abalo','Crise','Ruptura'][Math.min(3,ones)];
 let effect='';
 if(stress==='Abalo'){
  if(state.ignoreAbalo){state.ignoreAbalo=false;effect='Abalo ignorado por Desligamento';}
  else {state.nextPenalty=1;effect='Abalo · −1 dado no próximo teste';}
 }
 if(ones>=2)state.pending=[...state.pending,{id:++state.sequence,kind:stress}];
 state.conditions=state.conditions.map(item=>({...item,modifier:0}));
 return {sheet:{...sheet,pressure:Math.max(0,(Number(sheet.pressure)||0)-(result.pressure||[]).length),pressureEffects:state},report:{stress,effect,ones}};
}
export function applyPressureReaction(sheet,id,reactionId,reserve='sanity',target=''){
 const state=pressureEffects(sheet),pending=state.pending.find(item=>item.id===id);
 if(!pending)return sheet;
 const reaction=PRESSURE_REACTIONS[pending.kind]?.find(item=>item.id===reactionId);
 if(!reaction || (reaction.id==='fixation'&&!target.trim()) || !['sanity','hope'].includes(reserve))return sheet;
 const next={...sheet};
 if(pending.kind==='Ruptura')next[reserve]=Math.max(0,(Number(next[reserve])||0)-2);
 if(reaction.id==='overload')next.pressure=(Number(next.pressure)||0)+2;
 else state.conditions=[...state.conditions,{...reaction,key:id,target,modifier:0}];
 if(reaction.id==='disconnect')state.ignoreAbalo=true;
 return {...next,pressureEffects:{...state,pending:state.pending.filter(item=>item.id!==id)}};
}
export function endPressureEffects(sheet,period){const state=pressureEffects(sheet);return {...sheet,pressureEffects:{...state,conditions:state.conditions.filter(item=>period==='scene'?false:item.duration!=='turn'),...(period==='scene'?{ignoreAbalo:false}:{})}};}
