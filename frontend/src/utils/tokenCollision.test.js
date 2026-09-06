import { limitarMovimentoToken } from "./tokenCollision";

const origem = { x: 10, y: 50 };
const destino = { x: 90, y: 50 };
const parede = { x1: 50, y1: 0, x2: 50, y2: 100 };

test("arrasto rapido para antes da primeira parede em ambos os sentidos", () => {
  const config = { paredes: [parede, { ...parede, x1: 70, x2: 70 }] };
  expect(limitarMovimentoToken(origem, destino, config).x).toBeCloseTo(49.95);
  expect(limitarMovimentoToken(destino, origem, config).x).toBeCloseTo(70.05);
});

test("porta fechada bloqueia; aberta permite atravessar o vao", () => {
  const config = { paredes: [{ ...parede, y2: 40 }, { ...parede, y1: 60 }], portas: [{ ...parede, y1: 40, y2: 60, aberta: false }] };
  expect(limitarMovimentoToken(origem, destino, config).x).toBeLessThan(50);
  config.portas[0].aberta = true;
  expect(limitarMovimentoToken(origem, destino, config)).toEqual(destino);
  expect(limitarMovimentoToken({ x: 10, y: 20 }, { x: 90, y: 20 }, config).x).toBeLessThan(50);
});

test("movimentos repetidos e soltura nao atravessam o bloqueio", () => {
  const config = { paredes: [parede] };
  let posicao = origem;
  for (let i = 0; i < 20; i += 1) posicao = limitarMovimentoToken(posicao, destino, config);
  expect(posicao.x).toBeCloseTo(49.95);
  expect(limitarMovimentoToken(posicao, origem, config)).toEqual(origem);
});

test("movimento paralelo, sem obstaculos e parado permanece livre", () => {
  expect(limitarMovimentoToken(origem, destino)).toEqual(destino);
  expect(limitarMovimentoToken(origem, origem, { paredes: [parede] })).toEqual(origem);
  expect(limitarMovimentoToken(origem, { x: 10, y: 90 }, { paredes: [parede] })).toEqual({ x: 10, y: 90 });
});

test("paredes diagonais e extremidades tambem bloqueiam", () => {
  expect(limitarMovimentoToken(origem, destino, { paredes: [{ x1: 30, y1: 30, x2: 70, y2: 70 }] }).x).toBeCloseTo(49.95);
  expect(limitarMovimentoToken(origem, destino, { paredes: [{ ...parede, y1: 50 }] }).x).toBeLessThan(50);
});
