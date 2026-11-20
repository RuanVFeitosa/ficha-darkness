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

export function remainingInjuryImpact(injury) {
  const value=injury.remainingImpact ?? injury.impact;
  return value!==undefined && value!==null && Number.isFinite(Number(value)) ? Math.max(0,Number(value)) : null;
}

// A cura usa uma única reserva, distribuída pelos ferimentos em ordem de registro.
export function healInjuries(sheet,amount,region,maximum,manualImpacts={}) {
  if(!Number.isInteger(amount)||amount<=0) throw new Error('Informe uma quantidade inteira de cura maior que zero.');
  let budget=amount,removed=0,improved=0,unquantified=0;
  const injuries=(sheet.injuries || []).flatMap(injury=>{
    if(region && injury.region!==region)return [injury];
    const remaining=remainingInjuryImpact(injury) ?? (manualImpacts[injury.id]!==undefined?Number(manualImpacts[injury.id]):null);
    if(remaining===null || !Number.isFinite(remaining) || remaining<=0){unquantified++;return [injury];}
    const spent=Math.min(budget,remaining);
    budget-=spent;
    if(!spent)return [injury];
    const next=remaining-spent;
    if(!next){removed++;return [];}
    improved++;
    return [{...injury,remainingImpact:next,healed:(Number(injury.healed)||0)+spent,severity:injurySeverity(next,injury.criticalRegion ?? !/^(Braço|Perna)/.test(injury.region))}];
  });
  const integrity=Math.min(maximum,Math.max(0,Number(sheet.integrity)||0)+amount);
  return {sheet:{...sheet,integrity,injuries},recovered:Math.max(0,integrity-(Number(sheet.integrity)||0)),removed,improved,unquantified};
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
