import { creationWarnings, freshSheet, integrityMax, resolveRoll } from './espiral';

test('usa a tabela de criação escolhida, do d4 ao d12', () => {
  expect([1, 2, 3, 4, 5].map(stage => integrityMax(stage, 'creation'))).toEqual([30, 35, 40, 45, 50]);
  expect(freshSheet().integrity).toBe(35);
});

test('criação considera custo acumulado e separa resistências', () => {
  const sheet = freshSheet();
  sheet.attributes = { pulso: 4, razao: 4, sentido: 2, voz: 2 };
  sheet.resources.Armas = 3;
  sheet.resources.Pontaria = 2;
  sheet.resources.Medicina = 1;
  sheet.resources['Controle Mental'] = 3;
  expect(creationWarnings(sheet)).toEqual({ spent: 6, resourceSpent: 10, messages: [] });
  sheet.resources.Armas = 4;
  expect(creationWarnings(sheet).messages).toContain('Grau IV é reservado à progressão.');
});

test.each([[-3, 'Falha grave'], [-2, 'Falha'], [-1, 'Falha'], [0, 'Sucesso com consequência'], [1, 'Sucesso'], [2, 'Sucesso'], [3, 'Sucesso excepcional']])('margem %s resolve corretamente', (margin, outcome) => {
  expect(resolveRoll([5], [], 8, 5 - margin).outcome).toBe(outcome);
});

test('pressão pode vencer a reserva e causar ruptura independentemente do sucesso', () => {
  const result = resolveRoll([2, 3], [1, 1, 1, 6], 8, 3);
  expect(result).toMatchObject({ best: 6, margin: 3, outcome: 'Sucesso excepcional', stress: 'Ruptura', mastery: false });
});

test('domínio não converte falha em sucesso', () => {
  expect(resolveRoll([4, 4], [], 4, 6)).toMatchObject({ mastery: true, outcome: 'Falha' });
});
