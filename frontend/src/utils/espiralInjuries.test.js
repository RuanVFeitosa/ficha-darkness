import { damageImpact, injurySeverity } from './espiralInjuries';

test.each([[0, null], [1, 'Superficial'], [3, 'Superficial'], [4, 'Moderada'], [6, 'Moderada'], [7, 'Grave'], [9, 'Grave'], [10, 'Crítica'], [12, 'Crítica'], [13, 'Catastrófica'], [30, 'Catastrófica']])('Impacto %s produz %s em membro', (impact, expected) => {
  expect(injurySeverity(impact)).toBe(expected);
});
test('Impacto 13+ é fatal em Região Crítica', () => {
  expect(injurySeverity(13, true)).toBe('Fatal');
  expect(injurySeverity(12, true)).toBe('Crítica');
});
test('proteções e efeitos reduzem o dano antes da gravidade, sem impacto negativo', () => {
  expect(damageImpact(15, 3, 5)).toBe(7);
  expect(damageImpact(3, 8, 2)).toBe(0);
});
