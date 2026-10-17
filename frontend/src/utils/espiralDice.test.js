import {espiralDie,espiralDiceText,normalizeEspiralDice} from './espiralDice';
import {parseDiceFormula} from '../data/espiral';
test('mapeia todos os dados Espiral e preserva dados sem símbolo definido',()=>{expect([4,6,8,10,12].map(espiralDie)).toEqual(['△4','⬡6','◇8','⬟10','⬢12']);expect(espiralDie(20)).toBe('d20');});
test('converte fórmulas sem confundir dezenas nem alterar quantidades',()=>{expect(espiralDiceText('2d6+1d10 / d12 / d100')).toBe('2⬡6+1⬟10 / ⬢12 / d100');expect(normalizeEspiralDice('2⬡6+3')).toBe('2d6+3');});
test('fórmulas com símbolos e legadas executam a mesma regra',()=>{for(const sides of [4,6,8,10,12])expect(parseDiceFormula('2'+espiralDie(sides)+'+3')).toEqual(parseDiceFormula('2d'+sides+'+3'));});
