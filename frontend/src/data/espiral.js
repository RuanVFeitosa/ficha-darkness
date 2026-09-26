export const ATTRIBUTES = {
  pulso: { name: 'Pulso', hint: 'O corpo em ação', stages: ['Frágil', 'Regular', 'Preparado', 'Vigoroso', 'Imponente'] },
  razao: { name: 'Razão', hint: 'A ordem do pensamento', stages: ['Nebulosa', 'Prática', 'Analítica', 'Metódica', 'Brilhante'] },
  sentido: { name: 'Sentido', hint: 'O mundo antes das palavras', stages: ['Distraído', 'Atento', 'Vigilante', 'Aguçado', 'Preciso'] },
  voz: { name: 'Voz', hint: 'Sua presença nos outros', stages: ['Apagada', 'Contida', 'Presente', 'Marcante', 'Dominante'] },
};
export const RESOURCES = ['Armas', 'Pontaria', 'Atletismo', 'Sobrevivência', 'Investigação', 'Medicina', 'Técnica', 'Tecnologia', 'Influência', 'Dissimulação', 'Subterfúgio', 'Condução', 'Controle Mental', 'Propósito'];
export const GRADES = ['Sem preparo', 'Familiar', 'Treinado', 'Experiente', 'Dominado'];
export const TEMA_PADRAO_ESPIRAL = { primaria: '#ffffff', secundaria: '#101010', texto: '#f5f5f5', fundo: '#050505', borda: '#343434' };
export const VERTENTE_HABILIDADES = {
  Agressiva: { nome: 'Pressão ofensiva', niveis: ['Uma vez por rodada, ao fazer um Ataque, adicione +1 dado de Atributo à reserva.', 'Quando um ataque beneficiado obtiver Sucesso Excepcional, adicione +1 dado de dano.', 'Use este benefício duas vezes por rodada, em ataques diferentes.'] },
  Metódica: { nome: 'Método', niveis: ['Uma vez por cena, prepare-se ou analise uma situação específica. A próxima rolagem relacionada recebe +2 dados de Atributo.', 'A preparação beneficia as duas próximas rolagens relacionadas.', 'Conceda um uso do benefício a um aliado que tenha participado da preparação ou recebido suas instruções.'] },
  Adaptável: { nome: 'Improviso', niveis: ['Uma vez por cena, trate um Recurso de Grau 0 como Grau I em uma rolagem.', 'Use este benefício duas vezes por cena, nunca duas vezes na mesma rolagem.', 'Ao usar Improviso, trate o Recurso como Grau II naquela rolagem.'] },
  Vigilante: { nome: 'Prontidão', niveis: ['Receba +1 dado de Atributo na primeira rolagem feita em resposta a um perigo inesperado na cena.', 'Receba +1 Defesa contra o primeiro ataque inesperado da cena.', 'Ao ativar, escolha um aliado próximo: ele também recebe +1 dado na primeira reação ao mesmo perigo.'] },
  Resiliente: { nome: 'Ainda de pé', niveis: ['Uma vez por cena, ignore temporariamente uma penalidade debilitante durante uma ação ou rolagem.', 'Ignore penalidades de até -2 dados.', 'Use este benefício duas vezes por cena.'] },
  Influente: { nome: 'Leitura social', niveis: ['Uma vez por cena, após descobrir algo sobre uma pessoa, receba +2 dados em uma rolagem relacionada a ela.', 'Use o benefício em duas rolagens diferentes contra a mesma pessoa na cena.', 'Após observar ou conversar o bastante, pergunte ao Mestre qual emoção, interesse ou preocupação é mais evidente na pessoa.'] },
  Obstinada: { nome: 'Recusa', niveis: ['Uma vez por cena, ao Forçar-se, receba 3 Dados de Pressão em vez de 2.', 'O primeiro resultado 1 entre os Dados de Pressão de Forçar-se é ignorado, inclusive para determinar uma Crise.', 'Uma vez por cena, ao Forçar-se, role 2 Dados de Pressão de uma vez e use ambos na reserva, recebendo as consequências normais.'] },
};
export const VERTENTES = Object.fromEntries(Object.entries(VERTENTE_HABILIDADES).map(([vertente, habilidade]) => [vertente, [habilidade.nome, habilidade.niveis[0]]]));
export const integrityMax = (stage) => 25 + stage * 5;
export const freshSheet = () => ({ version: 1, name: '', profileImage: '', occupation: '', player: '', pronoun: '', age: '', vertente: 'Metódica', attributes: { pulso: 2, razao: 2, sentido: 2, voz: 2 }, resources: Object.fromEntries(RESOURCES.map(r => [r, 0])), temporaryResources: {}, temaFicha: { ...TEMA_PADRAO_ESPIRAL }, integrityTable: 'creation', integrity: 35, sanity: 10, hope: 10, pressure: 0, failures: 0, purpose: '', notes: '', inventory: '', abilities: '', abilityProgress: [{ name: '', detail: '', level: 1 }, { name: '', detail: '', level: 1 }], injuries: [], weapons: [{ id: 'desarmado', name: 'Desarmado', damage: '1d4', ammo: '' }], protections: [], phase: 'creation' });
export function creationWarnings(sheet) {
  const stages = Object.values(sheet.attributes);
  const spent = stages.reduce((sum, stage) => sum + [-1, 0, 1, 3, 6][stage - 1], 0);
  const resourceSpent = RESOURCES.slice(0, 12).reduce((sum, r) => sum + [0, 1, 3, 6, 10][sheet.resources[r]], 0);
  return { spent, resourceSpent, messages: [spent !== 6 && `Atributos: distribua exatamente 6 pontos (saldo: ${6 - spent}).`, stages.filter(s => s === 1).length > 1 && 'Apenas um atributo pode estar em d4.', stages.filter(s => s === 5).length > 1 && 'Apenas um atributo pode estar em d12.', resourceSpent !== 10 && `Recursos convencionais: distribua 10 pontos (saldo: ${10 - resourceSpent}).`, RESOURCES.some(r => sheet.resources[r] > 3) && 'Grau IV é reservado à progressão.'].filter(Boolean) };
}
export function resolveRoll(dice, pressure, sides, difficulty) {
  const best = Math.max(...dice, ...pressure);
  const margin = best - difficulty;
  const ones = pressure.filter(n => n === 1).length;
  return { dice, pressure, best, margin, difficulty, outcome: margin <= -3 ? 'Falha grave' : margin < 0 ? 'Falha' : margin === 0 ? 'Sucesso com consequência' : margin < 3 ? 'Sucesso' : 'Sucesso excepcional', stress: ['Controle', 'Abalo', 'Crise', 'Ruptura'][Math.min(3, ones)], mastery: dice.filter(n => n === sides).length + pressure.filter(n => n === 6).length >= 2 };
}

// Rolagens livres são úteis para dano, tabelas e efeitos que não usam a
// reserva padrão. O limite impede que uma fórmula acidental trave a ficha.
export function parseDiceFormula(value) {
const formula = String(value || '').replace(/\s+/g, '').toLowerCase();
  const match = formula.match(/^(\d*)d(4|6|8|10|12|20|100)([+-]\d+)?$/);
  if (!match) return null;
  const amount = Number(match[1] || 1);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  if (!Number.isInteger(amount) || amount < 1 || amount > 50) return null;
  return { amount, sides, modifier, formula: `${amount}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}` };
}
