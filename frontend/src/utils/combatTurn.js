export function nextCombatTurn(previous,entries,action,target) {
 const keys=entries.map(entry=>entry.chave);
 if(!keys.length) throw new Error('Adicione participantes à iniciativa antes de iniciar um turno.');
 const round=Math.max(1,Number(previous?.rodada)||1);
 let key=previous?.chave,rodada=round,estado='ativo';
 if(action==='start') {
  key=target || (keys.includes(key)?key:keys[0]);
  if(!keys.includes(key)) throw new Error('Este participante não está mais na iniciativa.');
 } else if(action==='end') {
  if(!key || previous?.estado!=='ativo') throw new Error('Não há turno em andamento.');
  estado='encerrado';
 } else if(action==='next') {
  const index=keys.indexOf(key);
  if(index>=0) {key=keys[(index+1)%keys.length];if(index===keys.length-1)rodada+=1;}
  else {
   const old=previous?.ordem || [];
   const oldIndex=old.indexOf(key);
   const following=old.slice(oldIndex+1).find(item=>keys.includes(item));
   key=following || keys[0];
   if(previous?.chave && !following)rodada+=1;
  }
 } else throw new Error('Ação de turno inválida.');
 return {chave:key,rodada,estado,ordem:keys,revision:(Number(previous?.revision)||0)+1};
}
