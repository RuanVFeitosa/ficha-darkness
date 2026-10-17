import {difficultyOptions,rollOutcome} from './sceneDifficulty';
test('separa categorias da cena e usa a defesa do inimigo',()=>{
 const options=difficultyOptions({dificuldades:{ambiente:8,combateAmbiente:10,conflitos:12}},[{id:'a',nome:'Monstro',defesa:15}]);
 expect(options.map(option=>option.value)).toEqual([8,10,15,12]);
 expect(options.find(option=>option.id==='inimigo:a').category).toBe('Combate');
});
test.each([[1,'Falha grave'],[3,'Falha'],[4,'Sucesso com consequência'],[6,'Sucesso'],[7,'Sucesso excepcional']])('classifica %s contra dificuldade 4', (result,outcome)=>{
 expect(rollOutcome(result,4)).toEqual({difficulty:4,margin:result-4,outcome});
});