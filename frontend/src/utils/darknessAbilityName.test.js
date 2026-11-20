import { darknessAbilityName } from './darknessAbilityName';

test('apresenta nomes Darkness sem procedência de classe ou especialismo', () => {
  expect(darknessAbilityName('Corte Devastador · Aniquilador / LUTADOR DESARMADO')).toBe('Corte Devastador');
  expect(darknessAbilityName('Golpe Baixo · Renegado / Marco 7')).toBe('Golpe Baixo');
  expect(darknessAbilityName('Domínio Absoluto · Atirador de Elite')).toBe('Domínio Total');
  expect(darknessAbilityName('Golpe Calculado')).toBe('Golpe Calculado');
});
