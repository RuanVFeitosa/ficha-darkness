import {difficultyOptions,rollOutcome,activeSceneDifficulty} from './sceneDifficulty';
test('entrar em combate usa o ambiente de combate e sair recupera a dificuldade da cena',()=>{
 const scene={dificuldades:{ambiente:4,combateAmbiente:8,contexto:'ambiente'}};
 expect(activeSceneDifficulty(scene,[],false)).toMatchObject({id:'ambiente',value:4});
 const combat=activeSceneDifficulty(scene,[],true);
 expect(combat).toMatchObject({id:'combateAmbiente',value:8});
 expect(rollOutcome(5,combat.value).outcome).toBe('Falha grave');
 expect(activeSceneDifficulty(scene,[],false).value).toBe(4);
});
test('combate preserva a defesa de um inimigo selecionado',()=>{
 expect(activeSceneDifficulty({dificuldades:{contexto:'inimigo:a',combateAmbiente:8}},[{id:'a',defesa:12}],true)).toMatchObject({id:'inimigo:a',value:12});
});
test('separa categorias da cena e usa a defesa do inimigo',()=>{
 const options=difficultyOptions({dificuldades:{ambiente:8,combateAmbiente:10,conflitos:12}},[{id:'a',nome:'Monstro',defesa:15}]);
 expect(options.map(option=>option.value)).toEqual([8,10,15,12]);
 expect(options.find(option=>option.id==='inimigo:a').category).toBe('Combate');
});
test.each([[1,'Falha grave'],[3,'Falha'],[4,'Sucesso com consequência'],[6,'Sucesso'],[7,'Sucesso excepcional']])('classifica %s contra dificuldade 4', (result,outcome)=>{
 expect(rollOutcome(result,4)).toEqual({difficulty:4,margin:result-4,outcome});
});
