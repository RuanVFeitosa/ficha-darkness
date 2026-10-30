import { custoAtributos, custoDominios, integridadeInicial } from '../data/absolutoV1';
import { gerarPersonagemTemplate, IDEIAS_PERSONAGEM, clonarModeloPersonagem } from './characterTemplateGenerator';
import { creationWarnings, integrityMax } from '../data/espiral';
jest.mock('../pages/fichaPersonagem',()=>({estadoInicial:{nivel:1,atributos:{},inventario:[],rituais:[]}}));
const perfil = { nome:'Ana', pronome:'Ela' };
function random(seed) { return () => { seed = (seed*1664525+1013904223)>>>0; return seed/4294967296; }; }

test.each(IDEIAS_PERSONAGEM.map(i=>[i.id]))('gera %s nos dois sistemas com orçamentos válidos',async id=>{
 for(let seed=1;seed<=8;seed++) {
  const espiral=await gerarPersonagemTemplate('espiral',id,perfil,random(seed));
  expect(creationWarnings(espiral).messages).toEqual([]);
  expect(espiral.integrity).toBe(integrityMax(espiral.attributes.pulso));
  expect(espiral.player).toBe('Ana');
  expect(espiral.inventoryItems.length).toBeGreaterThan(0);
  const absoluto=await gerarPersonagemTemplate('darkness',id,perfil,random(seed));
  expect(absoluto.versaoRegras).toBe('1.0');
  expect(absoluto.existencia.pontos).toBe(100);
  expect(custoAtributos(absoluto.atributos)+custoDominios(absoluto.dominios)).toBeLessThanOrEqual(100);
  expect(Math.max(...Object.values(absoluto.atributos))).toBeLessThanOrEqual(3);
  expect(absoluto.membros).toEqual(integridadeInicial(absoluto.atributos.fonitude));
  expect(absoluto.classeId).toBeTruthy();
  expect(absoluto.classeEspecialidade.arquetipoDetalhes.habilidadePrincipal).toBeTruthy();
 }
});
test('cópias mantêm escolhas do modelo sem identidade nem referências compartilhadas',()=>{
 const original={nome:'Original',atributos:{forca:30},inventario:[{nome:'Espada'}],codigo:'1234',id:'antigo'};
 const modelo={nome:'Guerreiro',sistema:'darkness',dados:original};
 const clone=clonarModeloPersonagem(modelo,perfil);
 expect(clone.id).toBeUndefined();expect(clone.codigo).toBeUndefined();
 expect(clone.nomeJogador).toBe('Ana');
 clone.inventario[0].nome='Outra';
 expect(original.inventario[0].nome).toBe('Espada');
});
