const fs=require('fs'),r='frontend/src/';function e(f,fn){const s=fs.readFileSync(r+f,'utf8');fs.writeFileSync(r+f,fn(s));}
e('pages/fichaEspiral.jsx',s=>s.replace('value={weapon.damage}','value={espiralDiceText(weapon.damage)}').replace('onRoll?.(', 'onRoll?.('));
e('components/EspiralEncounters.jsx',s=>s.replace('value={weapon.damage}','value={espiralDiceText(weapon.damage)}').replace('1d6 ou 2d8+2','1⬡6 ou 2◇8+2'));
e('components/CharacterDossier.test.jsx',s=>s.replace("['d12','d6']","['⬢12','⬡6']"));
e('components/EspiralSummary.test.jsx',s=>s.replace("getByText('d12')","getByText('⬢12')"));
e('pages/Tabletop3D.jsx',s=>"import { espiralDie } from '../utils/espiralDice';\n"+s.replace('setNotice(`Rolagem d${sides}: ${result}.`);','setNotice(`Rolagem ${routeParams.get("sistema")==="espiral" ? espiralDie(sides) : `d${sides}`}: ${result}.`);').replace('>d{sides}</button>','>{routeParams.get("sistema")==="espiral" ? espiralDie(sides) : `d${sides}`}</button>').replace('>d{roll.sides}<strong>','>{routeParams.get("sistema")==="espiral" ? espiralDie(roll.sides) : `d${roll.sides}`}<strong>').replace('formula:roll.label','formula:roll.label,sistema:"espiral"'));
e('components/RollNotifications.jsx',s=>"import { espiralDiceText } from '../utils/espiralDice';\n"+s.replaceAll("{roll.expressao || 'Teste'}","{roll.detalhes?.sistema === 'espiral' ? espiralDiceText(roll.expressao || 'Teste') : roll.expressao || 'Teste'}"));
fs.writeFileSync(r+'utils/espiralDice.test.js',`import {espiralDie,espiralDiceText,normalizeEspiralDice} from './espiralDice';
import {parseDiceFormula} from '../data/espiral';
test('mapeia todos os dados Espiral e preserva dados sem símbolo definido',()=>{expect([4,6,8,10,12].map(espiralDie)).toEqual(['△4','⬡6','◇8','⬟10','⬢12']);expect(espiralDie(20)).toBe('d20');});
test('converte fórmulas sem confundir dezenas nem alterar quantidades',()=>{expect(espiralDiceText('2d6+1d10 / d12 / d100')).toBe('2⬡6+1⬟10 / ⬢12 / d100');expect(normalizeEspiralDice('2⬡6+3')).toBe('2d6+3');});
test('fórmulas com símbolos e legadas executam a mesma regra',()=>{for(const sides of [4,6,8,10,12])expect(parseDiceFormula('2'+espiralDie(sides)+'+3')).toEqual(parseDiceFormula('2d'+sides+'+3'));});
`);
