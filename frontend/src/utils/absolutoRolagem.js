import { DOMINIOS, limitar, quantidadeDados, resolverTeste } from '../data/absolutoV1';
import { LIMITE_DADOS_ABSOLUTO } from './absolutoModificadores';

export function executarTesteDominio(personagem, chave, opcoes = {}, random = Math.random) {
  const anterior = opcoes.repetir;
  if (!DOMINIOS[chave]) throw new Error('Escolha um Domínio válido.');
  if (anterior && (anterior.repetida || anterior.esforco || anterior.danoResolvido)) throw new Error('Este teste já foi repetido, usou Esforço Extraordinário ou já teve seu dano resolvido.');
  const custo = anterior ? 2 : opcoes.esforco ? 1 : 0;
  if ((Number(personagem.esperanca?.atual) || 0) < custo) throw new Error('Esperança insuficiente.');
  const n = anterior ? Math.min(LIMITE_DADOS_ABSOLUTO, anterior.dados.length) : quantidadeDados(personagem, chave, opcoes.vantagem || 0, opcoes.esforco ? 1 : 0, opcoes.contraFonte);
  if (!n) throw new Error('Atributo 0: não é possível realizar um teste convencional.');
  const dominio = anterior ? anterior.dominio : limitar(personagem.dominios?.[chave]);
  const resultado = resolverTeste(Array.from({ length: n }, () => Math.floor(random() * 6) + 1), anterior ? anterior.dt : opcoes.dt || 1, dominio);
  const rolagem = {
    ...resultado, versaoRegras: '1.0', chaveDominio: chave, tipo: 'teste', titulo: DOMINIOS[chave].nome,
    modo: 'Teste de Domínio', formula: `${n}d6 · Domínio ${dominio} · DT ${resultado.dt}`,
    esforco: !anterior && Boolean(opcoes.esforco), repetida: Boolean(anterior),
    quantidadeBase: n, maiorResultado: Math.max(...resultado.dados),
    bonusAtivo: 0, bonusPassiva: 0, bonusFinais: 0, resultadosExtras: [],
  };
  return {
    rolagem,
    personagem: custo ? { ...personagem, esperanca: { ...personagem.esperanca, atual: personagem.esperanca.atual - custo } } : personagem,
  };
}
