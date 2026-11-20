import { freshSheet, RESOURCES } from './espiral';

export const PROTOCOLO_RULESET = 'protocolo-darkness-v1';
export const MAX_PROTOCOL_DICE = 6;
export function protocolOutcome(successes,difficulty) {
  if(successes===0)return 'Falha crítica';
  const margin=successes-difficulty;
  return margin<=-3?'Falha grave':margin<0?'Falha':margin===0?'Sucesso com consequência':margin>=3?'Sucesso excepcional':'Sucesso';
}
export const PROTOCOL_DIFFICULTIES = [
  'Rotineira sob pressão', 'Exigente', 'Difícil', 'Extrema', 'Limite humano',
];
export const isProtocolSheet = sheet => sheet?.ruleset === PROTOCOLO_RULESET;
export function protocolDefenses(attributes) {
  const stage = value => Math.max(1, Math.min(5, Math.floor(Number(value) || 1)));
  const base = [1, 1, 2, 2, 3][stage(attributes?.sentido) - 1];
  return { base, dodge: base + 1, block: stage(attributes?.pulso) };
}
export const freshProtocolSheet = () => ({ ...freshSheet(), ruleset: PROTOCOLO_RULESET, pavor:{active:false,sides:6},
  relationships:[],relationshipMission:1,relationshipBonus:null,
  occupationBenefit: { type: 'training', resource: 'Investigação', condition: '' },
});

export function occupationTraining(sheet, resource) {
  const benefit = sheet.occupationBenefit;
  return benefit?.type === 'training' && benefit.resource === resource && RESOURCES.includes(resource)
    ? Math.max(0, 2 - (Number(sheet.resources?.[resource]) || 0)) : 0;
}

// Reserve space for explicit extra dice and pressure before filling attribute dice.
export function protocolPool({ count = 1, pressure = 0, extra = 0 }) {
  const safe = value => Math.max(0, Math.min(6, Math.floor(Number(value) || 0)));
  const extraCount = Math.min(5, safe(extra));
  const pressureCount = Math.min(5 - extraCount, safe(pressure));
  return { count: Math.min(Math.max(1, safe(count)), 6 - pressureCount - extraCount), pressure: pressureCount, extra: extraCount };
}

export function resolveProtocolRoll(dice, pressure = [], sides = 6, difficulty = 1, extra = [], extraSides = 6, extraDieSides) {
  if(extraDieSides && extraDieSides.length!==extra.length) throw new Error('Informe o tipo de cada dado adicional.');
  const groups = [[dice, sides], [pressure, 6], ...extra.map((value,index)=>[[value],extraDieSides?.[index] ?? extraSides])];
  const all = groups.flatMap(([values]) => values);
  if (!all.length || all.length > 6 || groups.some(([values, faces]) =>
    ![4, 6, 8, 10, 12].includes(faces) || values.some(value => !Number.isInteger(value) || value < 1 || value > faces))) {
    throw new Error('Use de 1 a 6 dados válidos de d4 a d12.');
  }
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) throw new Error('A dificuldade deve exigir de 1 a 5 êxitos.');
  const successes = all.filter(value => value >= 4).length;
  const margin = successes - difficulty;
  const ones = pressure.filter(value => value === 1).length;
  return { dice, pressure, extra, extraSides,...(extraDieSides?{extraDieSides}:{}), successes, best: successes, difficulty, margin,
    ruleset: PROTOCOLO_RULESET, outcome: protocolOutcome(successes,difficulty), criticalFailure:successes===0,
    stress: ['Controle', 'Abalo', 'Crise', 'Ruptura'][Math.min(3, ones)], mastery: false };
}

export function applyPavor(result, value, sides = 6) {
  if (![4,6,8,10,12].includes(sides) || !Number.isInteger(value) || value < 1 || value > sides) throw new Error('Dado de Pavor inválido.');
  const all = [...result.dice, ...result.pressure, ...(result.extra || [])];
  const cancelled = all.map(die => die < value);
  const remaining = all.filter((_,index) => !cancelled[index]);
  const successes = remaining.filter(die => die >= 4).length;
  const criticalFailure = successes === 0;
  return { ...result, pavor: { value, sides, cancelled, ends: value === 1 },
    successes, best: successes, margin: successes-result.difficulty, criticalFailure,
    outcome: protocolOutcome(successes,result.difficulty) };
}
