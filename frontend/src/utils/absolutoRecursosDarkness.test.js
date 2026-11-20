import { grauDominioDarkness, sugerirRecursosAbsoluto, DOMINIOS_RECURSOS_DARKNESS } from './absolutoRecursosDarkness';
import { adaptarParaDarkness } from './adaptarParaDarkness';

test.each([[0,0],[1,1],[2,1],[3,2],[4,2],[5,3]])('Domínio %s contribui %s pontos', (value, grade) => {
  expect(grauDominioDarkness(value)).toBe(grade);
});
test('Razão alta contribui uma vez e especialidade médica orienta a sugestão', () => {
  const original = { classe: 'Médico', dominios: { razao: 5 } };
  const plan = sugerirRecursosAbsoluto(original);
  expect(plan.budget).toBe(3);
  expect(plan.resources.Medicina).toBe(3);
  expect(plan.resources.Investigação).toBe(0);
  expect(plan.resources.Técnica).toBe(0);
  expect(plan.resources.Tecnologia).toBe(0);
  expect(Object.values(plan.resources).reduce((a,b) => a+b, 0)).toBe(3);
});
test('preserva orçamento sem ultrapassar Grau III, mesmo com todos os Domínios no máximo', () => {
  const plan = sugerirRecursosAbsoluto({ dominios: Object.fromEntries(Object.keys(DOMINIOS_RECURSOS_DARKNESS).map(id => [id, 5])) });
  expect(plan.budget).toBe(27);
  expect(Object.values(plan.resources).every(grade => grade >= 0 && grade <= 3)).toBe(true);
  expect(Object.values(plan.resources).reduce((a,b) => a+b, 0)).toBeLessThanOrEqual(plan.budget);
});
test('conversão usa Domínios em vez das antigas passivas e arquiva a origem', () => {
  const original = { nome: 'Médico', especialidade: 'Cirurgião', dominios: { razao: { valor: 5 }, precisao: 3 }, habilidadesPassivas: { hacking: 100 } };
  const sheet = adaptarParaDarkness(original, 'absoluto', 'medico');
  expect(sheet.resources.Medicina).toBe(3);
  expect(sheet.resources.Pontaria).toBe(2);
  expect(sheet.resources.Tecnologia).toBe(0);
  expect(sheet.adaptationResources.budget).toBe(5);
  expect(sheet.adaptationSource.original).toEqual(original);
});
test('ausência de Domínios não inventa pontos', () => {
  expect(sugerirRecursosAbsoluto({})).toMatchObject({ budget: 0, missingDomains: true });
});
