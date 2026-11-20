export const RELATION_GRADES={1:{name:'Afinidade',die:6},2:{name:'Vínculo',die:8},3:{name:'Devoção',die:12}};
export function relationshipBenefits(grade) {
  const {die}=RELATION_GRADES[grade] || RELATION_GRADES[1];
  return [{id:'focus',label:`Foco · +1d${die} no seu teste`},{id:'help',label:`Ajudar · +1d${die} no teste da pessoa`},...(grade>=2?[{id:'motivate',label:`Motivar · recuperar 2d${grade===3?6:4} PE`}]:[]),...(grade===3?[{id:'action',label:'Proteger · ação extra para ajudar a pessoa em perigo'}]:[])];
}
export function invokeRelationship(sheet,id,benefit,narrative,recoveryDice=[],inDanger=false) {
  const relation=(sheet.relationships || []).find(item=>item.id===id);
  if(!relation || relation.used) throw new Error('Esta relação já foi invocada nesta missão.');
  if(!narrative.trim()) throw new Error('Descreva o sentimento e como ele ajuda você a perseverar.');
  if(!relationshipBenefits(relation.grade).some(item=>item.id===benefit)) throw new Error('Benefício indisponível para este grau.');
  if(benefit==='focus'&&sheet.relationshipBonus) throw new Error('Use o bônus de relação pendente antes de invocar outro.');
  if(benefit==='action'&&!inDanger) throw new Error('A pessoa precisa estar em perigo para conceder a ação extra.');
  const grade=RELATION_GRADES[relation.grade];
  const sides=relation.grade===3?6:4;
  if(benefit==='motivate'&&(recoveryDice.length!==2||recoveryDice.some(value=>!Number.isInteger(value)||value<1||value>sides))) throw new Error('A recuperação exige dois dados válidos.');
  const recovery=recoveryDice.reduce((sum,value)=>sum+value,0);
  const message=benefit==='focus'?`+1d${grade.die} preparado para um teste relacionado a ${relation.name}.`:benefit==='help'?`${relation.name} recebe +1d${grade.die} no teste ajudado. Aplique na ficha da pessoa, respeitando o limite de 6 dados.`:benefit==='motivate'?`Gaste uma ação: ${relation.name} recupera ${recovery} PE (${recoveryDice.join(' + ')}). Registre a recuperação na ficha da pessoa, até o máximo de Esperança.`:`Uma ação extra neste turno, apenas para ajudar ${relation.name} em perigo.`;
  return {...sheet,relationships:sheet.relationships.map(item=>item.id===id?{...item,used:true,lastInvocation:{benefit,narrative:narrative.trim(),message,recoveryDice,at:Date.now()}}:item),...(benefit==='focus'?{relationshipBonus:{relationId:id,name:relation.name,sides:grade.die}}:{})};
}

export function startRelationshipMission(sheet) {
  return {...sheet,relationshipMission:(sheet.relationshipMission || 1)+1,relationshipBonus:null,relationships:(sheet.relationships || []).map(item=>({...item,used:false}))};
}
