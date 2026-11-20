import catalogo from './habilidadesDarknessAdaptadas.json';
import fusoes from './fusoesOfensivas.json';

export const FONTES_OFENSIVAS_MESCLADAS = new Set(fusoes.flatMap(group => group.members));
export const OFENSIVAS_CONSOLIDADAS = fusoes.map(group => ({
  id: `Ofensiva:${group.name}`, name: group.name, category: 'Ofensiva',
  action: group.action, hope: group.hope, limit: group.limit || 'cena',
  detail: group.effects[0], levels: group.effects.map((effect, index) =>
    index ? `${group.effects[0]} ${group.effects.slice(1, index + 1).join(' ')}` : effect),
  rules: catalogo[0].rules,
  mergedSourceIds: group.members,
}));

const aliases = new Map();
fusoes.forEach((group, index) => {
  const target = OFENSIVAS_CONSOLIDADAS[index];
  group.members.forEach(sourceId => {
    if (sourceId.startsWith('base:')) {
      aliases.set(`Ofensiva:${sourceId.slice(5)}`, target);
      return;
    }
    const source = catalogo.find(entry => entry.sourceId === sourceId && entry.category === 'Ofensiva');
    if (!source) throw new Error(`Habilidade ofensiva não encontrada: ${sourceId}`);
    aliases.set(source.id, target);
    aliases.set(`Ofensiva:${source.name}`, target);
  });
});

export function ofensivaConsolidada(id) {
  return aliases.get(id) || OFENSIVAS_CONSOLIDADAS.find(entry => entry.id === id);
}

export function consolidarIdsBuildOfensivos(ids = []) {
  return [...new Set(ids.map(id => {
    if (!id.startsWith('espiral:')) return id;
    const target = ofensivaConsolidada(id.slice('espiral:'.length));
    return target ? `espiral:${target.id}` : id;
  }))];
}

// Conserva o maior nível, os registros anteriores e o saldo; nunca soma efeitos.
export function consolidarOfensivasAdquiridas(abilities) {
  if (!Array.isArray(abilities)) return abilities;
  const result = [];
  const positions = new Map();
  for (const ability of abilities) {
    const target = ofensivaConsolidada(ability.id);
    if (!target) { result.push(ability); continue; }
    const level = Math.max(1, Math.min(3, Number(ability.level) || 1));
    const history = ability.mergedFrom || (ability.id !== target.id ? [{ ...ability }] : []);
    if (!positions.has(target.id)) {
      positions.set(target.id, result.length);
      result.push({ ...ability, id: target.id, name: ability.customized ? ability.name : target.name, category: 'Ofensiva', level,
        ...(history.length ? { mergedFrom: history } : {}) });
    } else {
      const previous = result[positions.get(target.id)];
      previous.level = Math.max(previous.level, level);
      previous.mergedFrom = [...(previous.mergedFrom || []), ...history];
    }
  }
  return result;
}
