import { ATRIBUTOS_ABSOLUTO, DOMINIOS, limitar, quantidadeDados, resolverTeste } from '../data/absolutoV1';
import { LIMITE_DADOS_ABSOLUTO } from './absolutoModificadores';
import { bonusHabilidades } from './absolutoHabilidadeUso';

export function executarTesteDominio(personagem, chave, opcoes = {}, random = Math.random) {
  return executarTeste(personagem, chave, opcoes, random, false);
}

export function executarTesteAtributo(personagem, chave, opcoes = {}, random = Math.random) {
  return executarTeste(personagem, chave, opcoes, random, true);
}

function executarTeste(personagem, chave, opcoes, random, atributo) {
  const anterior = opcoes.repetir;
  if (atributo ? !Object.hasOwn(ATRIBUTOS_ABSOLUTO, chave) : !Object.hasOwn(DOMINIOS, chave)) throw new Error(atributo ? 'Escolha um Atributo válido.' : 'Escolha um Domínio válido.');
  if (anterior && (atributo ? anterior.chaveAtributo !== chave : anterior.chaveDominio !== chave)) throw new Error('A repetição deve usar o mesmo teste.');
  if (anterior && (anterior.repetida || anterior.esforco || anterior.danoResolvido)) throw new Error('Este teste já foi repetido, usou Esforço Extraordinário ou já teve seu dano resolvido.');
  const custo = anterior ? 2 : opcoes.esforco ? 1 : 0;
  if ((Number(personagem.esperanca?.atual) || 0) < custo) throw new Error('Esperança insuficiente.');
  const baseAtributo = atributo ? limitar(personagem.atributos?.[chave]) : 0;
  const n = anterior ? Math.min(LIMITE_DADOS_ABSOLUTO, anterior.dados.length) : atributo
    ? baseAtributo ? limitar(baseAtributo + (Number(opcoes.vantagem) || 0) + (opcoes.esforco ? 1 : 0) - (opcoes.contraFonte && Number(personagem.medo) >= 3 ? 1 : 0), 1, LIMITE_DADOS_ABSOLUTO) : 0
    : quantidadeDados(personagem, chave, (Number(opcoes.vantagem)||0) + bonusHabilidades(personagem,chave), opcoes.esforco ? 1 : 0, opcoes.contraFonte);
  if (!n) throw new Error('Atributo 0: não é possível realizar um teste convencional.');
  const dominio = atributo ? 0 : anterior ? anterior.dominio : limitar(personagem.dominios?.[chave]);
  const resultado = resolverTeste(Array.from({ length: n }, () => Math.floor(random() * 6) + 1), anterior ? anterior.dt : opcoes.dt || 1, dominio);
  const rolagem = {
    ...resultado, versaoRegras: '1.0', ...(atributo ? { chaveAtributo: chave } : { chaveDominio: chave }), tipo: 'teste', titulo: atributo ? ATRIBUTOS_ABSOLUTO[chave] : DOMINIOS[chave].nome,
    modo: atributo ? 'Teste de Atributo' : 'Teste de Domínio', formula: atributo ? `${n}d6 · Êxitos em 6 · DT ${resultado.dt}` : `${n}d6 · Domínio ${dominio} · DT ${resultado.dt}`,
    esforco: !anterior && Boolean(opcoes.esforco), repetida: Boolean(anterior),
    quantidadeBase: n, maiorResultado: Math.max(...resultado.dados),
    bonusAtivo: 0, bonusPassiva: 0, bonusFinais: 0, resultadosExtras: [],
  };
  return {
    rolagem,
    personagem: custo ? { ...personagem, esperanca: { ...personagem.esperanca, atual: personagem.esperanca.atual - custo } } : personagem,
  };
}
