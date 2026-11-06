import {nextCombatTurn} from './combatTurn';
const entries=[{chave:'a'},{chave:'inimigo:boss:1'},{chave:'inimigo:boss:2'}];
test('inicia, encerra e avança cada turno, incluindo dois turnos do mesmo boss',()=>{
 let turn=nextCombatTurn(null,entries,'start','a');
 expect(turn).toMatchObject({chave:'a',rodada:1,estado:'ativo'});
 turn=nextCombatTurn(turn,entries,'end');
 expect(turn).toMatchObject({chave:'a',estado:'encerrado'});
 turn=nextCombatTurn(turn,entries,'next');
 expect(turn.chave).toBe('inimigo:boss:1');
 turn=nextCombatTurn(turn,entries,'next');
 expect(turn.chave).toBe('inimigo:boss:2');
 turn=nextCombatTurn(turn,entries,'next');
 expect(turn).toMatchObject({chave:'a',rodada:2,estado:'ativo',revision:5});
});
test('avança após remover o participante atual sem perder os turnos seguintes',()=>{
 const turn=nextCombatTurn(null,entries,'start','inimigo:boss:1');
 expect(nextCombatTurn(turn,[entries[0],entries[2]],'next').chave).toBe('inimigo:boss:2');
 expect(()=>nextCombatTurn(null,[],'start')).toThrow();
});
