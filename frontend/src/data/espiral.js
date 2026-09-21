export const ATTRIBUTES = {
  pulso: { name: 'Pulso', hint: 'O corpo em ação', stages: ['Frágil', 'Regular', 'Preparado', 'Vigoroso', 'Imponente'] },
  razao: { name: 'Razão', hint: 'A ordem do pensamento', stages: ['Nebulosa', 'Prática', 'Analítica', 'Metódica', 'Brilhante'] },
  sentido: { name: 'Sentido', hint: 'O mundo antes das palavras', stages: ['Distraído', 'Atento', 'Vigilante', 'Aguçado', 'Preciso'] },
  voz: { name: 'Voz', hint: 'Sua presença nos outros', stages: ['Apagada', 'Contida', 'Presente', 'Marcante', 'Dominante'] },
};
export const RESOURCES = ['Armas', 'Pontaria', 'Atletismo', 'Sobrevivência', 'Investigação', 'Medicina', 'Técnica', 'Tecnologia', 'Influência', 'Dissimulação', 'Subterfúgio', 'Condução', 'Controle Mental', 'Propósito'];
export const GRADES = ['Sem preparo', 'Familiar', 'Treinado', 'Experiente', 'Dominado'];
export const VERTENTES = {
  Agressiva: ['Pressão ofensiva', 'Uma vez por rodada, adicione +1 dado de atributo a um ataque.'],
  Metódica: ['Método', 'Uma vez por cena, prepare-se para uma situação. A próxima rolagem relacionada recebe +2 dados de atributo.'],
  Adaptável: ['Improviso', 'Uma vez por cena, trate um recurso de grau 0 como grau I em uma rolagem.'],
  Vigilante: ['Prontidão', 'Receba +1 dado de atributo na primeira rolagem em resposta a um perigo inesperado na cena.'],
  Resiliente: ['Ainda de pé', 'Uma vez por cena, ignore uma penalidade debilitante durante uma ação ou rolagem, a critério do mestre.'],
  Influente: ['Leitura social', 'Uma vez por cena, use uma informação relevante sobre alguém para receber +2 dados em uma rolagem relacionada.'],
  Obstinada: ['Recusa', 'O benefício de Forçar-se diverge entre as páginas 58 e 154. Combine com o mestre e ajuste os dados de Pressão manualmente.'],
};
export const integrityMax = (stage, table) => (table === 'creation' ? 25 + stage * 5 : 9 + stage * 3);
export const freshSheet = () => ({ version: 1, name: '', occupation: '', player: '', age: '', vertente: 'Metódica', attributes: { pulso: 2, razao: 2, sentido: 2, voz: 2 }, resources: Object.fromEntries(RESOURCES.map(r => [r, 0])), integrityTable: 'creation', integrity: 35, sanity: 10, hope: 10, pressure: 0, failures: 0, purpose: '', notes: '', inventory: '', abilities: '', injuries: [], phase: 'creation' });
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
