import { convertDarknessToEspiral } from './darknessToEspiral';
import { freshProtocolSheet, PROTOCOLO_RULESET } from '../data/protocoloDarkness';
import { integrityMax } from '../data/espiral';
import { sugerirRecursosAbsoluto } from './absolutoRecursosDarkness';

// O topo humano do Absoluto não concede o estágio excepcional do Darkness.
export const estagioAbsolutoParaDarkness = value => {
  const score = Math.max(0, Math.min(5, Math.trunc(Number(value) || 0)));
  return score === 0 ? 1 : score <= 2 ? 2 : score <= 4 ? 3 : 4;
};

export function adaptarParaDarkness(original, sistema, sourceId) {
  const legacy = sistema === 'absoluto';
  const valor = value => typeof value === 'object' && value !== null ? value.atual ?? value.valor ?? 0 : value;
  const atributos = Object.fromEntries(Object.entries(original.atributos || {}).map(([key, value]) => [key, valor(value)]));
  const base = legacy ? convertDarknessToEspiral({ ...original, atributos }) : original;
  if (legacy) {
    base.attributes = {
      pulso: estagioAbsolutoParaDarkness(Math.max(Number(atributos.forca) || 0, Number(atributos.fonitude ?? atributos.fortitude) || 0)),
      razao: estagioAbsolutoParaDarkness(atributos.inteligencia),
      sentido: estagioAbsolutoParaDarkness(atributos.reflexos),
      voz: estagioAbsolutoParaDarkness(atributos.vontade),
    };
    base.integrity = integrityMax(base.attributes.pulso, base.integrityTable);
    const plan = sugerirRecursosAbsoluto(original);
    base.resources = plan.resources;
    base.adaptationResources = { budget: plan.budget, domains: plan.domains, missingDomains: plan.missingDomains };
  }
  return {
    ...freshProtocolSheet(), ...base, ruleset: PROTOCOLO_RULESET,
    player: original.player || original.nomeJogador || original.jogador || '',
    name: base.name || original.nome || '',
    adaptationSource: { sistema, fichaId: sourceId, original: JSON.parse(JSON.stringify(original)) },
    notes: [base.notes, 'ADAPTAÇÃO PARA DARKNESS: revise armas, habilidades e efeitos com o mestre; valores antigos foram preservados como referência.'].filter(Boolean).join('\n\n'),
  };
}
