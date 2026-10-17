export const ESPIRAL_DICE = Object.freeze({4:'△',6:'⬡',8:'◇',10:'⬟',12:'⬢'});
export function espiralDie(sides) { return (ESPIRAL_DICE[Number(sides)] || 'd') + sides; }
export function espiralDiceText(value) { return String(value ?? '').replace(/d(100|20|12|10|8|6|4)\b/gi, (_, sides) => espiralDie(sides)); }
export function normalizeEspiralDice(value) { return String(value ?? '').replace(/[△⬡◇⬟⬢](?=\d)/gu, 'd'); }
