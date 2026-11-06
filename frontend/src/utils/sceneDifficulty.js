export function difficultyOptions(scene,enemies=[]) {
 const d=scene?.dificuldades || {};
 const combatEnemy=enemies.find(enemy=>String(enemy.id)===String(d.combateInimigoId));
 return [
  {id:'ambiente',category:'Ambiente',label:'Ambiente da cena',value:Number(d.ambiente ?? 4)},
  {id:'combateAmbiente',category:'Combate',label:'Ambiente do combate',value:Number(combatEnemy?.defesa ?? d.combateAmbiente ?? 4)},
  ...enemies.map(enemy=>({id:`inimigo:${enemy.id}`,category:'Combate',label:enemy.nome || 'Inimigo',value:Number(enemy.defesa ?? 4)})),
  {id:'conflitos',category:'Conflitos',label:'Perseguições e outros conflitos',value:Number(d.conflitos ?? 4)}
 ];
}
export function activeSceneDifficulty(scene,enemies=[],combat=false) {
 const options=difficultyOptions(scene,enemies);
 if(combat && scene?.dificuldades?.combateInimigoId) return options.find(option=>option.id==='combateAmbiente');
 const selected=options.find(option=>option.id===(scene?.dificuldades?.contexto || 'ambiente')) || options[0];
 // A postura de combate troca o contexto de cena, mas conserva um inimigo escolhido pelo mestre.
 return combat && selected.category!=='Combate' ? options.find(option=>option.id==='combateAmbiente') : selected;
}
export function rollOutcome(result,difficulty) {
 const margin=Number(result)-Number(difficulty);
 return {difficulty:Number(difficulty),margin,outcome:margin<=-3?'Falha grave':margin<0?'Falha':margin===0?'Sucesso com consequência':margin<3?'Sucesso':'Sucesso excepcional'};
}
