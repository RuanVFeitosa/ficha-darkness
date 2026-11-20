import { applyPavor } from './protocoloDarkness';
import { protocolDefenses } from './protocoloDarkness';
import { freshProtocolSheet, occupationTraining, protocolPool, resolveProtocolRoll } from './protocoloDarkness';

test.each([4, 6, 8, 10, 12])('cada resultado 4+ gera exatamente um êxito em d%i', sides => {
  expect(resolveProtocolRoll([1, 3, 4, sides], [], sides, 2).successes).toBe(2);
  expect(resolveProtocolRoll([1, 3, 4, sides], [], sides, 2).outcome).toBe('Sucesso com consequência');
});
test('conta dados mistos, bônus e pressão uma única vez', () => {
  const result = resolveProtocolRoll([3, 8], [1, 6], 8, 4, [4, 10], 10);
  expect(result.successes).toBe(4);
  expect(result.stress).toBe('Abalo');
  expect(result.margin).toBe(0);
});
test('limita toda a reserva, preservando ao menos um dado de atributo', () => {
  for (const count of [0, 1, 6, 20]) for (const extra of [0, 2, 20]) for (const pressure of [0, 3, 20]) {
    const pool = protocolPool({ count, extra, pressure });
    expect(pool.count).toBeGreaterThanOrEqual(1);
    expect(pool.count + pool.extra + pool.pressure).toBeLessThanOrEqual(6);
  }
  expect(() => resolveProtocolRoll(Array(7).fill(4))).toThrow();
  expect(() => resolveProtocolRoll([7], [], 6)).toThrow();
});
test('treinamento de ocupação garante grau II sem acumular bônus no recurso já treinado', () => {
  const sheet = freshProtocolSheet();
  expect(occupationTraining(sheet, 'Investigação')).toBe(2);
  expect(occupationTraining(sheet, 'Medicina')).toBe(0);
  sheet.resources.Investigação = 3;
  expect(occupationTraining(sheet, 'Investigação')).toBe(0);
  sheet.occupationBenefit.type = 'bonus';
  expect(occupationTraining(sheet, 'Investigação')).toBe(0);
});

test.each([[1,1,2,1],[2,1,2,2],[3,2,3,3],[4,2,3,4],[5,3,4,5]])('tabelas de Defesa no estágio %s', (stage,base,dodge,block)=>{expect(protocolDefenses({sentido:stage,pulso:stage})).toEqual({base,dodge,block});});

test.each([[[7,2],4,[false,true],1,'Sucesso com consequência'],[[3,1],5,[true,true],0,'Falha crítica'],[[6,5],3,[false,false],2,'Sucesso']])('Pavor anula resultados menores sem somar valores', (dice,dread,cancelled,successes,outcome)=>{const result=applyPavor(resolveProtocolRoll(dice,[],8,1),dread);expect(result.pavor.cancelled).toEqual(cancelled);expect(result.successes).toBe(successes);expect(result.outcome).toBe(outcome);});
test('empates sobrevivem e Pavor 1 encerra o efeito',()=>{expect(applyPavor(resolveProtocolRoll([4],[],6,1),4).successes).toBe(1);const result=applyPavor(resolveProtocolRoll([1,4],[],6,1),1);expect(result.pavor.ends).toBe(true);expect(result.pavor.cancelled).toEqual([false,false]);});
test('Pavor inclui Pressão e dados adicionais na anulação',()=>{const result=applyPavor(resolveProtocolRoll([6],[4],8,1,[5],10),5);expect(result.pavor.cancelled).toEqual([false,true,false]);expect(result.successes).toBe(2);});

test('dados adicionais mistos preservam seus tipos e validam os resultados',()=>{
 const result=resolveProtocolRoll([4],[],8,1,[6,12],6,[6,12]);
 expect(result.successes).toBe(3);
 expect(result.extraDieSides).toEqual([6,12]);
 expect(()=>resolveProtocolRoll([4],[],8,1,[7],6,[6])).toThrow();
});
