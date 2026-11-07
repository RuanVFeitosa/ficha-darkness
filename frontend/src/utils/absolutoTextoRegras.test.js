import {arvoresHabilidades} from '../data/Classes/arvoresHabilidades';
import {converterTextoAbsoluto,normalizarConteudoAbsoluto} from './absolutoModificadores';
import {prepararUso} from './absolutoHabilidadeUso';
import {HABILIDADES_ADAPTADAS} from './absolutoTextoRegras';

test.each([
 ['Faça um teste de Constituição CD 15.','Faça um teste de Fortitude DT 2.'],
 ['Use Conhecimento Médico ou Investigação.','Use Razão ou Razão.'],
 ['Teste de Destreza, Furtividade, Crime e Instinto.','Teste de Reflexos, Mobilidade, Mobilidade e Intuição.'],
 ['Diplomacia, Intimidação e Enganação.','Influência, Influência e Influência.'],
 ['Recebe vantagem (+2) em Investigação.','Recebe +1 dado em Razão.'],
 ['Recebe +2 Proteção e +1 Defesa.','Recebe +2 Proteção e +1 Defesa.'],
 ['Gaste 5 PE. Recupere +2 PI. Alcance +3m.','Gaste 5 PE. Recupere +2 PI. Alcance +3m.'],
])('adapta %s e permanece idempotente', (entrada,saida)=>{
 expect(converterTextoAbsoluto(entrada)).toBe(saida);
 expect(converterTextoAbsoluto(saida)).toBe(saida);
});
test('habilidades com mecânicas antigas recebem uma regra própria nas árvores e em cópias salvas',()=>{
 const vistos=new Set();
 function walk(n){if(!n||typeof n!=='object')return;
  if(n.id&&HABILIDADES_ADAPTADAS[n.id]){
   vistos.add(n.id);
   expect(n.descricao).not.toMatch(/margem de ameaça|multiplicador cr[ií]tico|\bCD\s*\d|\bDestreza\b|\bConstituição\b/i);
   expect(normalizarConteudoAbsoluto(n)).toEqual(n);
  }
  Object.values(n).forEach(v=>Array.isArray(v)?v.forEach(walk):walk(v));
 }
 walk(arvoresHabilidades);
 expect(vistos.size).toBeGreaterThan(20);
 expect(prepararUso({id:'calculo-de-probabilidades',grupo:'Aptidão',nome:'Cálculo',custo:'1 PE',descricao:'Role 1d6 e some ao teste.'}).descricaoUso).toContain('Não soma resultados');
});
test('nomes, custos, pré-requisitos, dados de arma e habilidades ESPIRAL não são renomeados',()=>{
 const p={id:'meu-id',nome:'Conhecimento Médico',custo:'5 PE',requisitos:'Destreza 2',descricao:'Teste de Conhecimento Médico CD 10.',armaStatus:{dmg:'3d10+3'}};
 const n=normalizarConteudoAbsoluto(p);
 expect(n.nome).toBe(p.nome);expect(n.custo).toBe(p.custo);expect(n.requisitos).toBe(p.requisitos);
 expect(n.armaStatus.dmg).toBe('3d10+3');expect(n.descricao).toBe('Teste de Razão DT 1.');
});
