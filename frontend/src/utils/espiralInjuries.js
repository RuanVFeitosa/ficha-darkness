export function damageImpact(damage, protection = 0, reduction = 0) {
  return Math.max(0, Math.floor(Number(damage) || 0) - Math.max(0, Math.floor(Number(protection) || 0)) - Math.max(0, Math.floor(Number(reduction) || 0)));
}

export function injurySeverity(impact, criticalRegion = false) {
  if (impact <= 0) return null;
  if (impact <= 3) return 'Superficial';
  if (impact <= 6) return 'Moderada';
  if (impact <= 9) return 'Grave';
  if (impact <= 12) return 'Crítica';
  return criticalRegion ? 'Fatal' : 'Catastrófica';
}

export const INJURY_EFFECTS = {
  Superficial: 'Normalmente sem penalidade mecânica. Registre quando narrativamente relevante.',
  Moderada: 'Pode impor −1 dado em ações diretamente dependentes da região. Pode provocar Sangramento.',
  Grave: '−2 dados em ações diretamente dependentes da região. Algumas ações podem ser impossíveis. Grande chance de Sangramento.',
  Crítica: 'A região normalmente deixa de poder ser utilizada adequadamente. Pode inutilizar uma parte do corpo ou ameaçar a vida.',
  Catastrófica: 'Dano extremo ao membro. A perda de função não significa amputação: a arma e as circunstâncias precisam permitir isso.',
  Fatal: 'Vida imediatamente ameaçada. Conforme o ferimento, morte imediata ou Estado Crítico. Não há chance artificial de sobreviver a um ferimento incompatível com a vida.',
  'Catastrófica / Fatal': 'Em membros, dano extremo; em Região Crítica, ameaça imediata à vida. A arma e as circunstâncias determinam as consequências.',
};
