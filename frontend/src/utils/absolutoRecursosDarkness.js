import { RESOURCES } from '../data/espiral';

export const DOMINIOS_RECURSOS_DARKNESS = {
  razao: { nome: 'Razão', recursos: ['Investigação', 'Medicina', 'Técnica', 'Tecnologia'] },
  intuicao: { nome: 'Intuição', recursos: ['Sobrevivência', 'Investigação', 'Influência'] },
  percepcao: { nome: 'Percepção', recursos: ['Investigação', 'Pontaria', 'Sobrevivência'] },
  mobilidade: { nome: 'Mobilidade', recursos: ['Atletismo', 'Subterfúgio', 'Condução'] },
  precisao: { nome: 'Precisão', recursos: ['Pontaria', 'Técnica', 'Condução'] },
  violencia: { nome: 'Violência', recursos: ['Armas', 'Atletismo'] },
  influencia: { nome: 'Influência', recursos: ['Influência', 'Dissimulação'] },
  determinacao: { nome: 'Determinação', recursos: ['Controle Mental', 'Propósito'] },
  vigor: { nome: 'Vigor', recursos: ['Sobrevivência', 'Atletismo'] },
};
const numeric = value => Number(typeof value === 'object' && value !== null ? value.atual ?? value.valor ?? 0 : value) || 0;
export const grauDominioDarkness = value => Math.ceil(Math.max(0, Math.min(5, Math.trunc(numeric(value)))) / 2);
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const specialties = {
  Medicina: ['medic', 'cirurg', 'socor', 'enferm'], Tecnologia: ['hacker', 'hacking', 'tecnolog', 'informat', 'program'],
  Técnica: ['mecanic', 'engenhe', 'tecnic', 'artifice'], Investigação: ['investig', 'detet', 'perit'],
  Condução: ['pilot', 'motorista', 'condutor'], Subterfúgio: ['furtiv', 'ladrao', 'infiltr'],
  Atletismo: ['atleta', 'acrob'], Dissimulação: ['engan', 'disfarc', 'manipul'],
  Sobrevivência: ['rastread', 'cacador', 'sobreviv'], Pontaria: ['atirador', 'sniper'],
  Armas: ['lutador', 'combatente'], Influência: ['diplomat', 'negoci'], Propósito: ['devoto', 'sacerd', 'fe'],
};

export function sugerirRecursosAbsoluto(original) {
  // Apenas identidade/especialidades orientam a sugestão; o histórico livre não concede pontos.
  const identity = normalize(JSON.stringify([original.classe, original.especialidade, original.especialismos, original.ocupacao]));
  const resources = Object.fromEntries(RESOURCES.map(name => [name, 0]));
  const domains = Object.entries(DOMINIOS_RECURSOS_DARKNESS).map(([id, meta]) => {
    const value = Math.max(0, Math.min(5, Math.trunc(numeric(original.dominios?.[id]))));
    return { id, ...meta, value, points: grauDominioDarkness(value) };
  });
  const budget = domains.reduce((total, domain) => total + domain.points, 0);
  for (const domain of domains) {
    const candidates = [...domain.recursos].sort((a, b) => {
      const score = name => (specialties[name] || []).filter(term => identity.includes(term)).length;
      return score(b) - score(a);
    });
    let left = domain.points;
    for (const resource of candidates) {
      const amount = Math.min(left, 3 - resources[resource]);
      resources[resource] += amount;
      left -= amount;
      if (!left) break;
    }
    // Se todos os candidatos atingirem III, o saldo permanece livre para escolha.
  }
  return { resources, budget, domains, missingDomains: !original.dominios };
}
