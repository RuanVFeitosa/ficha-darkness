import { proporMigracaoV1 } from '../data/absolutoV1';

// Única escala de modificadores do Absoluto: cada efeito concede/retira um dado.
// Custos, recursos, alcances, durações, níveis e valores de Atributos não são bônus.
export const LIMITE_DADOS_ABSOLUTO = 8;
export const modificadorParaDado = valor => Math.sign(Number(valor) || 0);

export function prepararDadosAbsoluto(expressao, modificadores = []) {
  const texto = String(expressao).replace(/[−–]/g, '-').replace(/\s+/g, '').toLowerCase();
  const partes = texto.match(/[+-]?[^+-]+/g) || [];
  let quantidadeBase = 0;
  let faceBase = 6;
  let encontrouBase = false;
  let ajuste = 0;
  for (const [index, parte] of partes.entries()) {
    const sinal = parte.startsWith('-') ? -1 : 1;
    const termo = parte.replace(/^[+-]/, '');
    const dado = termo.match(/^(\d*)d(4|6|8|10|12|20|100)$/);
    if (dado) {
      const quantidade = Number(dado[1] || 1);
      if (!encontrouBase && index === 0 && sinal > 0) {
        faceBase = Number(dado[2]); encontrouBase = true;
        quantidadeBase = quantidade;
      } else ajuste += quantidade ? sinal : 0;
    } else if (/^\d+(?:[.,]\d+)?$/.test(termo)) {
      ajuste += Number(termo.replace(',', '.')) ? sinal : 0;
    } else if (/^(?:\d+)?dados?$/.test(termo) || /^\d*d$/.test(termo)) {
      ajuste += sinal;
    } else throw new Error('Use uma fórmula de dados, como 3d6+1d6 ou 2d8-1 dado.');
  }
  if (!encontrouBase) throw new Error('Informe o dano base em dados, como 2d6.');
  ajuste += modificadores.reduce((total, valor) => total + modificadorParaDado(valor), 0);
  // A reserva é limitada somente após os ajustes, antes de alocar/rolar os dados.
  const quantidade = Math.max(0, Math.min(LIMITE_DADOS_ABSOLUTO, quantidadeBase + ajuste));
  return { quantidade, faces: faceBase, formula: `${quantidade}d${faceBase}` };
}

export function rolarDadosAbsoluto(expressao, modificadores = [], random = Math.random, limite = LIMITE_DADOS_ABSOLUTO) {
  const reserva = prepararDadosAbsoluto(expressao, modificadores);
  reserva.quantidade = Math.min(reserva.quantidade, Math.max(0, Math.min(LIMITE_DADOS_ABSOLUTO, Number(limite) || 0)));
  reserva.formula = `${reserva.quantidade}d${reserva.faces}`;
  const dados = Array.from({ length: reserva.quantidade }, () => Math.floor(random() * reserva.faces) + 1);
  return { ...reserva, dados, total: dados.reduce((s, d) => s + d, 0) };
}

export const normalizarFormulaAbsoluto = expressao => prepararDadosAbsoluto(expressao).formula;

export function converterTextoAbsoluto(valor) {
  let texto = String(valor);
  // Uma fórmula de dano é convertida como reserva, não como soma de pontos.
  texto = texto.replace(/\b\d+d(?:100|20|12|10|8|6|4)(?:\s*[+−–-]\s*\d+(?:d(?:100|20|12|10|8|6|4))?)*(?!\d)/gi, (formula, offset, original) => {
    const anterior = original.slice(0, offset).trimEnd().slice(-1);
    if (/[+−–-]/.test(anterior)) return formula; // dado adicional, tratado abaixo
    try { return normalizarFormulaAbsoluto(formula); } catch { return formula; }
  });
  texto = texto.replace(/(^|[\s(,:;])([+−–-])\s*(\d+(?:[.,]\d+)?)(?:\s*(?:dados?\b|d\d*\b))?/gim, (trecho, prefixo, sinal, numero, offset, original) => {
    const depois = original.slice(offset + trecho.length);
    // Alterações diretas de recursos e medidas conservam suas unidades.
    if (/^\s*(?:de\s+)?(?:PE\b|PI\b|PV\b|SAN\b|EX\b|pontos?\s+de\s+(?:Sanidade|Esperan[çc]a|Exist[êe]ncia)|Sanidade\b|Esperan[çc]a\b|Medo\b|moedas?\b|cr[ée]ditos?\b|m\b|metros?\b|kg\b|%)/i.test(depois)) return trecho;
    if (Number(numero.replace(',', '.')) === 0) return trecho;
    return `${prefixo}${sinal === '+' ? '+' : '−'}1 dado`;
  });
  texto = texto.replace(/\b(b[oô]nus|penalidade)(?:\s+de)?\s+(\d+)\b(?!\s*(?:dados?|PE|PI|PV|metros?)\b)/gi, (_, tipo) => `${tipo} de ${/^penal/i.test(tipo) ? '−' : '+'}1 dado`);
  texto = texto.replace(/([+−–-])\s*(?:(?:seu|sua|o|a)\s+)*(?:mod(?:ificador)?\.?\s*(?:de\s+)?)(?:For[çc]a|Fortitude|Intelig[êe]ncia|Vontade|Reflexos|Destreza|Constitui[çc][aã]o|Carisma|Conhecimento M[ée]dico|FOR|FORT|INT|VON|REF)\b/gi, (_, sinal) => `${sinal === '+' ? '+' : '−'}1 dado`);
  return texto;
}

const CAMPOS_DANO = new Set(['dmg','dano','cura','formula']);
const CAMPOS_PRESERVADOS = new Set(['id','nome','titulo','codigo','fichaId','tipo','categoria','subcategoria','preco','custo','requisitos','nivel','nivelRito','data','historia','anotacao','humanidade','recriacaoPendente','historicoRecriacao','legadoAbsoluto','arquetipoId','classeId','idade','imagem','fotoPerfil','url','arquivo','createdAt','updatedAt','bonusMunicao']);

export function normalizarConteudoAbsoluto(valor, campo = '') {
  if (Array.isArray(valor)) return valor.map(v => normalizarConteudoAbsoluto(v, campo));
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k,v]) => [k, CAMPOS_PRESERVADOS.has(k) ? v : normalizarConteudoAbsoluto(v,k)]));
  if (typeof valor === 'number' && /^(?:bonus|penalidade)/i.test(campo)) return modificadorParaDado(valor);
  if (typeof valor !== 'string') return valor;
  if (CAMPOS_DANO.has(campo)) {
    try { return normalizarFormulaAbsoluto(valor); } catch { return converterTextoAbsoluto(valor); }
  }
  if (/^(?:bonus|penalidade)/i.test(campo)) {
    if (/^[+−–-]?\s*0(?:d\d*)?$/.test(valor.trim())) return '';
    if (/^[+−–-]?\s*\d+(?:d\d*)?(?:\s*[+−–-]\s*\d+(?:d\d*)?)*$/.test(valor.trim())) return `${/^[−–-]/.test(valor.trim()) || /^penalidade/i.test(campo) ? '−' : '+'}1 dado`;
    return converterTextoAbsoluto(valor);
  }
  return converterTextoAbsoluto(valor);
}

export function normalizarFichaAbsoluto(personagem) {
  if (!personagem || personagem.sistema === 'espiral' || personagem.tipo === 'espiral' || personagem.attributes) return personagem;
  // Migra antes de normalizar textos para preservar uma cópia fiel do original.
  // Uma versão futura não deve ser rebaixada para 1.0.
  const base = personagem.atributos && (!personagem.versaoRegras || Number(personagem.versaoRegras) < 1)
    ? proporMigracaoV1(personagem)
    : personagem;
  const atualizado = normalizarConteudoAbsoluto(base);
  if (atualizado.versaoRegras === '1.0') atualizado.configuracaoAbsoluto = { ...atualizado.configuracaoAbsoluto, limiteDados: LIMITE_DADOS_ABSOLUTO };
  return atualizado;
}
