import book from '../data/ordemRulebook.json';

export const STORAGE_KEY = 'ordem:fichas:v1';
export const attributes = {
  AGI: 'Agilidade', FOR: 'Força', INT: 'Intelecto', PRE: 'Presença', VIG: 'Vigor',
};

export const skills = Object.entries({
  Acrobacia: 'AGI', Adestramento: 'PRE', Artes: 'PRE', Atletismo: 'FOR',
  Atualidades: 'INT', Ciências: 'INT', Crime: 'AGI', Diplomacia: 'PRE',
  Enganação: 'PRE', Fortitude: 'VIG', Furtividade: 'AGI', Iniciativa: 'AGI',
  Intimidação: 'PRE', Intuição: 'PRE', Investigação: 'INT', Luta: 'FOR',
  Medicina: 'INT', Ocultismo: 'INT', Percepção: 'PRE', Pilotagem: 'AGI',
  Pontaria: 'AGI', Profissão: 'INT', Reflexos: 'AGI', Religião: 'PRE',
  Sobrevivência: 'INT', Tática: 'INT', Tecnologia: 'INT', Vontade: 'PRE',
});

export const resources = { pv: 'Pontos de vida', san: 'Sanidade', pe: 'Pontos de esforço' };
export const ordemId = () => window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function readOrdemSheets() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return Array.isArray(saved) ? saved : [];
}

export function writeOrdemSheets(sheets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
}

export function newOrdemSheet() {
  return {
    id: ordemId(),
    nome: '', jogador: '', origem: '', classe: '', trilha: '', afinidade: '', nex: 5, limitePe: 1,
    attributes: Object.fromEntries(Object.keys(attributes).map(key => [key, 1])),
    resources: Object.fromEntries(Object.keys(resources).map(key => [key, { current: 0, max: 0, temp: 0 }])),
    skills: {}, attacks: [], defenseBonus: 0, displacement: 9,
    rituals: [], inventory: [], abilities: [], conditions: '', notes: '',
  };
}

export const normalizeOrdem = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const ritualText = book.pages.filter(page => page.printedPage >= 124 && page.printedPage <= 143)
  .map(page => page.content.replace(new RegExp(`^${page.printedPage}\\s*`), '')).join('\n');
const ritualHeadings = [...ritualText.matchAll(/^([^\n]+)\n *((?:SANGUE|MORTE|CONHECIMENTO|ENERGIA|MEDO) +[1-4](?: +(?:SANGUE|MORTE|CONHECIMENTO|ENERGIA|MEDO) +[1-4])*) *$/gm)];

function ritualDetails(text) {
  const lines = text.trim().replace(/-\n-?/g, '').split('\n');
  const fields = [];
  let bodyStart = 0;
  for (const line of lines) {
    const field = /^(Execução|Alcance|Alvos?|Área|Efeito|Duração|Re\s?sistência):\s*(.*)$/i.exec(line);
    if (field) fields.push({ label: field[1].replace('Re ', 'Re'), value: field[2].replace('instantâ nea', 'instantânea') });
    else if (fields.length && /^à metade\b/i.test(line)) fields[fields.length - 1].value += ` ${line}`;
    else break;
    bodyStart++;
  }
  const body = lines.slice(bodyStart).join('\n');
  const headings = [...body.matchAll(/^\s*((?:Discente|Verdadeiro)(?:\s*\([^)]*\))?)\s*:/gim)];
  const paragraphs = text => text.trim().split(/\n\s*\n/).filter(Boolean).map(paragraph => paragraph.replace(/\s+/g, ' '));
  return {
    fields,
    paragraphs: paragraphs(body.slice(0, headings[0]?.index)),
    variants: headings.map((match, index) => ({
      label: match[1],
      paragraphs: paragraphs(body.slice(match.index + match[0].length, headings[index + 1]?.index)),
    })),
  };
}

export const rituals = ritualHeadings.flatMap(([heading, title, elements], index) => {
  const name = title.trim().replace('TecerIlusão', 'Tecer Ilusão');
  const start = ritualHeadings[index].index + heading.length;
  const details = ritualDetails(ritualText.slice(start, ritualHeadings[index + 1]?.index));
  const options = [...elements.matchAll(/(\S+) +([1-4])/g)];
  return options.map(([, element, circle]) => ({
    name: options.length > 1 ? `${name} (${element[0]}${element.slice(1).toLowerCase()})` : name,
    element, circle: Number(circle), ...details,
  }));
});

export function rollOrdemTest(attribute, diceBonus, bonus, random = Math.random) {
  const pool = attribute + diceBonus;
  const lowest = pool < 1;
  const count = lowest ? (attribute || 2) + Math.abs(diceBonus) : pool;
  const dice = Array.from({ length: count }, () => 1 + Math.floor(random() * 20));
  const chosen = lowest ? Math.min(...dice) : Math.max(...dice);
  return { dice, chosen, bonus, total: chosen + bonus, lowest };
}

export function rollOrdemDamage(expression, random = Math.random) {
  const match = /^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d{1,3})?$/i.exec(expression.replace(/\s/g, ''));
  if (!match || Number(match[1]) < 1) return null;
  const [, quantity, sides, modifier] = match;
  const dice = Array.from({ length: Number(quantity) }, () => 1 + Math.floor(random() * Number(sides)));
  const bonus = Number(modifier || 0);
  return { dice, bonus, total: dice.reduce((sum, die) => sum + die, bonus) };
}
