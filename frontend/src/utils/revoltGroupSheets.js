import { ATRIBUTOS_ABSOLUTO, DOMINIOS } from '../data/absolutoV1';
const presets = {
  popular: { name: 'Frente Popular', attribute: 'vontade', domain: 'influencia', tests: { advance: 'domain:influencia', regroup: 'domain:determinacao', support: 'domain:influencia', defend: 'domain:vigor', retreat: 'domain:mobilidade', final: 'domain:influencia' } },
  communications: { name: 'Frente de Comunicações', attribute: 'inteligencia', domain: 'razao', tests: { advance: 'domain:razao', regroup: 'domain:intuicao', support: 'domain:percepcao', defend: 'domain:mobilidade', retreat: 'domain:mobilidade', final: 'domain:razao' } },
  supplies: { name: 'Frente de Suprimentos', attribute: 'fonitude', domain: 'vigor', tests: { advance: 'domain:vigor', regroup: 'domain:vigor', support: 'domain:precisao', defend: 'domain:violencia', retreat: 'domain:mobilidade', final: 'domain:vigor' } },
};
const level = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(5, Math.floor(Number(value)))) : fallback;
export function revoltGroupSheet(front, key) {
  const preset = presets[key] || presets.popular, supplied = front?.sheet || {};
  return {
    nome: String(supplied.nome || preset.name).slice(0, 100),
    atributos: Object.fromEntries(Object.keys(ATRIBUTOS_ABSOLUTO).map(id => [id, level(supplied.atributos?.[id] ?? (id === preset.attribute ? 3 : 2), 2)])),
    dominios: Object.fromEntries(Object.keys(DOMINIOS).map(id => [id, level(supplied.dominios?.[id] ?? (id === preset.domain ? 2 : 1), 1)])),
    tests: Object.fromEntries(Object.entries(preset.tests).map(([action, fallback]) => {
      const value = String(supplied.tests?.[action] || fallback), [type, id] = value.split(':');
      return [action, (type === 'domain' && Object.hasOwn(DOMINIOS, id)) || (type === 'attribute' && Object.hasOwn(ATRIBUTOS_ABSOLUTO, id)) ? value : fallback];
    })),
    esperanca: { atual: 0, max: 0 },
  };
}
export function groupActionTest(front, key, action) {
  const sheet = revoltGroupSheet(front, key);
  const [testKind, testKey] = sheet.tests[action].split(':');
  const attribute = testKind === 'domain' ? DOMINIOS[testKey].atributo : testKey;
  return { sheet, testKind, testKey, label: testKind === 'domain' ? DOMINIOS[testKey].nome : ATRIBUTOS_ABSOLUTO[testKey], dice: sheet.atributos[attribute] };
}
