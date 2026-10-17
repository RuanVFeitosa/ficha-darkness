export function difficultyOptions(scene,enemies=[]) {
 const d=scene?.dificuldades || {};
 return [
  {id:'ambiente',category:'Ambiente',label:'Ambiente da cena',value:Number(d.ambiente ?? 4)},
  {id:'combateAmbiente',category:'Combate',label:'Ambiente do combate',value:Number(d.combateAmbiente ?? 4)},
  ...enemies.map(enemy=>({id:`inimigo:${enemy.id}`,category:'Combate',label:enemy.nome || 'Inimigo',value:Number(enemy.defesa ?? 4)})),
  {id:'conflitos',category:'Conflitos',label:'Perseguições e outros conflitos',value:Number(d.conflitos ?? 4)}
 ];
}
export function rollOutcome(result,difficulty) {
 const margin=Number(result)-Number(difficulty);
 return {difficulty:Number(difficulty),margin,outcome:margin<=-3?'Falha grave':margin<0?'Falha':margin===0?'Sucesso com consequência':margin<3?'Sucesso':'Sucesso excepcional'};
}