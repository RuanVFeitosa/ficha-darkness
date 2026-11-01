import { LIMITE_DADOS_ABSOLUTO, rolarDadosAbsoluto } from '../utils/absolutoModificadores';
// Protocolo Absoluto 1.0, páginas 10–23 e 113–118.
// Regras incompletas do manuscrito são configuradas pela mesa, nunca inferidas.
export const VERSAO_ABSOLUTO = '1.0';
export const ATRIBUTOS_ABSOLUTO = {
  forca: 'Força', fonitude: 'Fortitude', inteligencia: 'Inteligência',
  vontade: 'Vontade', reflexos: 'Reflexos',
};
export const DOMINIOS = {
  razao: { nome: 'Razão', atributo: 'inteligencia', descricao: 'Analisar informações, investigar e construir hipóteses.' },
  intuicao: { nome: 'Intuição', atributo: 'inteligencia', descricao: 'Interpretar intenções, emoções e sinais instintivos.' },
  percepcao: { nome: 'Percepção', atributo: 'inteligencia', descricao: 'Observar o ambiente e reconhecer detalhes e ameaças.' },
  mobilidade: { nome: 'Mobilidade', atributo: 'reflexos', descricao: 'Agir sob pressão, mover-se furtivamente e controlar movimentos rápidos.' },
  precisao: { nome: 'Precisão', atributo: 'reflexos', descricao: 'Mirar e executar movimentos e trabalhos delicados.' },
  violencia: { nome: 'Violência', atributo: 'forca', descricao: 'Aplicar força e técnica em confrontos físicos.' },
  influencia: { nome: 'Influência', atributo: 'vontade', descricao: 'Modificar comportamentos e decisões por comunicação e presença.' },
  determinacao: { nome: 'Determinação', atributo: 'vontade', descricao: 'Resistir à pressão psicológica e preservar a vontade de agir.' },
  vigor: { nome: 'Vigor', atributo: 'fonitude', descricao: 'Resistir a venenos, sangramento e desgaste físico.' },
};
export const REGIOES = {
  cabeca: { nome: 'Cabeça', base: 18, fator: 3 },
  pescoco: { nome: 'Pescoço', base: 14, fator: 3 },
  torso: { nome: 'Tórax', base: 40, fator: 5 },
  abdomen: { nome: 'Abdômen', base: 32, fator: 4 },
  bracoDireito: { nome: 'Braço direito', base: 20, fator: 4 },
  bracoEsquerdo: { nome: 'Braço esquerdo', base: 20, fator: 4 },
  pernaDireita: { nome: 'Perna direita', base: 24, fator: 4 },
  pernaEsquerda: { nome: 'Perna esquerda', base: 24, fator: 4 },
};
export const ESCALA_DOMINIO = ['Inexperiente', 'Treinado', 'Especialista', 'Mestre', 'Excepcional', 'Absoluto'];
export const EXITO_DOMINIO = ['Apenas 6', '5 e 6', '5 e 6; um único 4 adicional', '4, 5 e 6', '4, 5 e 6; um único 3 adicional', '3, 4, 5 e 6'];
export const limitar = (valor, min = 0, max = 5) => Math.min(max, Math.max(min, Math.trunc(Number(valor) || 0)));
export const atributosIniciais = () => Object.fromEntries(Object.keys(ATRIBUTOS_ABSOLUTO).map(k => [k, 1]));
export const dominiosIniciais = () => Object.fromEntries(Object.keys(DOMINIOS).map(k => [k, 0]));
export const custoAtributo = valor => [0, 0, 10, 25, 50, 80][limitar(valor)];
export const custoAtributos = atributos => Object.keys(ATRIBUTOS_ABSOLUTO).reduce((s, k) => s + custoAtributo(atributos?.[k]), 0);
export const custoDominios = dominios => Object.keys(DOMINIOS).reduce((s, k) => s + limitar(dominios?.[k]) * 10, 0);
export const integridadeInicial = fortitude => Object.fromEntries(Object.entries(REGIOES).map(([k, r]) => {
  const max = r.base + limitar(fortitude) * r.fator;
  return [k, { atual: max, max, defesa: 0, ferido: false, grave: false }];
}));
export const recursosIniciais = atributos => ({
  sanidade: 12 + limitar(atributos?.vontade) * 2,
  esperanca: 6 + limitar(atributos?.vontade),
});
export const ehAbsolutoV1 = personagem => personagem?.versaoRegras === VERSAO_ABSOLUTO;

export function criarBaseV1(atributos = atributosIniciais(), dominios = dominiosIniciais()) {
  const normalizados = Object.fromEntries(Object.keys(ATRIBUTOS_ABSOLUTO).map(k => [k, limitar(atributos[k] ?? 1)]));
  const recursos = recursosIniciais(normalizados);
  return {
    versaoRegras: VERSAO_ABSOLUTO, atributos: normalizados,
    dominios: Object.fromEntries(Object.keys(DOMINIOS).map(k => [k, limitar(dominios[k])])),
    membros: integridadeInicial(normalizados.fonitude),
    sanidade: { atual: recursos.sanidade, max: recursos.sanidade },
    esperanca: { atual: recursos.esperanca, max: recursos.esperanca },
    medo: 0, rupturaNaCena: false, esperancaNarrativaSessao: 0,
    existencia: { pontos: 100, gastosAtributos: custoAtributos(normalizados), gastosDominios: custoDominios(dominios) },
    configuracaoAbsoluto: { limiteDados: LIMITE_DADOS_ABSOLUTO, integridadeFormula:2 },
    // Estes grupos deixam de participar de qualquer cálculo na versão 1.0.
    habilidadesCombate: {}, habilidadesPassivas: {}, habilidadesTemporarias: {},
    vida: { atual: 0, max: 0 },
  };
}

// Conversão automática das fichas antigas. O original é preservado.
export function proporMigracaoV1(personagem) {
  if (ehAbsolutoV1(personagem)) return personagem;
  const atributos = Object.fromEntries(Object.keys(ATRIBUTOS_ABSOLUTO).map(k => {
    const valor = Number(personagem.atributos?.[k]) || 0;
    return [k, limitar(Math.floor(valor / 10))];
  }));
  const antigos = personagem.habilidadesCombate || {};
  const aliases = { mobilidade: 'firmeza', influencia: 'carisma', determinacao: 'persistencia', vigor: 'resistencia' };
  const dominios = Object.fromEntries(Object.keys(DOMINIOS).map(k => [k, limitar(antigos[k] ?? antigos[aliases[k]])]));
  const { legadoAbsoluto, ...original } = personagem;
  return { ...personagem, ...criarBaseV1(atributos, dominios), legadoAbsoluto: legadoAbsoluto || original };
}

export function quantidadeDados(personagem, dominio, vantagem = 0, extra = 0, contraFonte = false) {
  const atributo = limitar(personagem.atributos?.[DOMINIOS[dominio]?.atributo]);
  if (!atributo) return 0;
  const penalidadeMedo = contraFonte && Number(personagem.medo) >= 3 ? 1 : 0;
  return limitar(atributo + (Number(vantagem) || 0) + extra - penalidadeMedo, 1, LIMITE_DADOS_ABSOLUTO);
}

export function resolverTeste(dados, dt, dominio) {
  if (dominio == null || !Number.isInteger(Number(dominio)) || Number(dominio) < 0 || Number(dominio) > 5) throw new Error('O Domínio deve ficar entre 0 e 5.');
  if (!dados.length || dados.length > LIMITE_DADOS_ABSOLUTO || dados.some(d => !Number.isInteger(d) || d < 1 || d > 6)) throw new Error('Use de um a oito dados de seis faces.');
  if (!Number.isInteger(Number(dt)) || Number(dt) < 1 || Number(dt) > 5) throw new Error('A DT deve ficar entre 1 e 5.');
  const nivel = Number(dominio);
  const limiar = [6, 5, 5, 4, 4, 3][nivel];
  let adicionalUsado = false;
  const dadosExitos = dados.map(d => {
    if (d >= limiar) return true;
    if ((nivel === 2 || nivel === 4) && d === limiar - 1 && !adicionalUsado) { adicionalUsado = true; return true; }
    return false;
  });
  const exitos = dadosExitos.filter(Boolean).length;
  const finais = dados.filter(d => d === 6).length;
  const falhaCritica = dados.filter(d => d === 1).length >= 2;
  const sucesso = !falhaCritica && exitos >= Number(dt);
  return { dados, dadosExitos, faces: 6, dt: Number(dt), dominio: nivel, exitos, finais, falhaCritica, sucesso, critico: sucesso && finais >= 2, total: exitos };
}

export function alterarMedo(personagem, variacao) {
  const medo = limitar(Number(personagem.medo || 0) + Number(variacao), 0, 6);
  if (medo === 6 && Number(personagem.medo || 0) < 6) return {
    ...personagem, medo: 6, rupturaNaCena: true,
    sanidade: { ...personagem.sanidade, atual: Math.max(0, personagem.sanidade.atual - 5) },
  };
  return { ...personagem, medo };
}

export function descansar(personagem) {
  return { ...personagem, medo: 0, esperanca: { ...personagem.esperanca, atual: Math.min(personagem.esperanca.max, personagem.esperanca.atual + 2) } };
}

export function recalcularBases(personagem, atributos) {
  const recursos = recursosIniciais(atributos);
  recursos.sanidade = Math.max(0, recursos.sanidade + (Number(personagem.ajustesRecursosV1?.sanidade) || 0));
  recursos.esperanca = Math.max(0, recursos.esperanca + (Number(personagem.ajustesRecursosV1?.esperanca) || 0));
  const recalcular = (recurso, max) => ({ ...recurso, max, atual: Math.max(0, Math.min(max, max - (recurso.max - recurso.atual))) });
  const membros = integridadeInicial(atributos.fonitude);
  for (const k of Object.keys(membros)) {
    const anterior = personagem.membros[k];
    if (anterior) membros[k] = { ...anterior, ...recalcular(anterior, membros[k].max), ...(anterior.atual===0 ? {atual:0} : {}) };
  }
  return { ...personagem, atributos, membros, sanidade: recalcular(personagem.sanidade, recursos.sanidade), esperanca: recalcular(personagem.esperanca, recursos.esperanca) };
}

export function custoEvolucaoAtributo(atual, destino = atual + 1) {
  if (!Number.isInteger(atual) || !Number.isInteger(destino) || atual < 1 || destino <= atual || destino > 5) return null;
  return custoAtributo(destino) - custoAtributo(atual);
}

export function evoluirV1(personagem, grupo, chave, _custo, destino) {
  const opcoes = grupo === 'atributos' ? ATRIBUTOS_ABSOLUTO : grupo === 'dominios' ? DOMINIOS : {};
  if (!opcoes[chave]) throw new Error('Escolha um Atributo ou Domínio válido.');
  const valor = Number(personagem[grupo]?.[chave]) || 0;
  if (valor >= 5) throw new Error('O limite desta característica é 5.');
  const alvo = destino === undefined ? valor + 1 : Number(destino);
  if (!Number.isInteger(alvo) || alvo <= valor || alvo > 5) throw new Error('Escolha um nível superior ao atual, até 5.');
  const custo = grupo === 'dominios' ? (alvo - valor) * 10 : custoEvolucaoAtributo(valor, alvo);
  if (custo === null) throw new Error('O custo de Atributo de 0 para 1 ainda não foi definido.');
  const saldo = Number(personagem.pontosEvolucao?.disponiveis) || 0;
  if (custo > saldo) throw new Error('Pontos de evolução insuficientes.');
  const valores = { ...personagem[grupo], [chave]: alvo };
  const atualizado = grupo === 'atributos' ? recalcularBases(personagem, valores) : { ...personagem, dominios: valores };
  return { ...atualizado, pontosEvolucao: { ...personagem.pontosEvolucao, disponiveis: saldo - custo }, historicoEvolucaoV1: [...(personagem.historicoEvolucaoV1 || []), { grupo, chave, anterior: valor, valor: alvo, custo, data: new Date().toISOString() }] };
}

export function rolarDanoV1(expressao, critico = false, random = Math.random) {
  return { tipo: 'dano', ...rolarDadosAbsoluto(expressao, critico ? [1] : [], random) };
}

// Apply the new regional formulas once, preserving injuries and exhausted limbs.
export function atualizarIntegridadeV1(personagem){
 if(!ehAbsolutoV1(personagem) || personagem.configuracaoAbsoluto?.integridadeFormula===2)return personagem;
 const membros=integridadeInicial(personagem.atributos?.fonitude);
 for(const [key,novo] of Object.entries(membros)){
  const old=personagem.membros?.[key];if(!old)continue;
  const max=Number(old.max),atual=Number(old.atual);
  const damage=Number.isFinite(max)&&Number.isFinite(atual) ? Math.max(0,max-atual) : 0;
  membros[key]={...old,max:novo.max,atual:Number.isFinite(atual)&&atual<=0 ? 0 : Math.max(0,novo.max-damage)};
 }
 return {...personagem,membros,configuracaoAbsoluto:{...personagem.configuracaoAbsoluto,integridadeFormula:2}};
}
