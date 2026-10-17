import { ATTRIBUTES, RESOURCES, freshSheet, integrityMax, resolveRoll } from '../data/espiral';

export const ESPIRAL_ENCOUNTERS_KEY = 'espiral:encounters:v1';
const bounded = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export function createEspiralEncounter(type, id) {
  return { ...freshSheet(), id, sistema: 'espiral', tipo: type === 'npc' ? 'npc' : 'inimigo', name: type === 'npc' ? 'Novo NPC' : 'Novo inimigo', folder: '', phase: 'play' };
}

export function normalizeEspiralEncounter(record) {
  const base = createEspiralEncounter(record.tipo, record.id);
  const attributes = Object.fromEntries(Object.keys(ATTRIBUTES).map(key => [key, Math.round(bounded(record.attributes?.[key] ?? base.attributes[key], 1, 5))]));
  return {
    ...base, ...record, version: 1, sistema: 'espiral', tipo: record.tipo === 'npc' ? 'npc' : 'inimigo',
    name: String(record.name || base.name).trim() || base.name, folder: String(record.folder || '').trim(), attributes,
    resources: Object.fromEntries(RESOURCES.map(name => [name, Math.round(bounded(record.resources?.[name] || 0, 0, 4))])),
    integrity: bounded(record.integrity ?? base.integrity, 0, integrityMax(attributes.pulso)),
    sanity: bounded(record.sanity ?? 10, 0, 10), hope: bounded(record.hope ?? 10, 0, 10), pressure: Math.round(bounded(record.pressure || 0, 0, 20)), failures: Math.round(bounded(record.failures || 0, 0, 3)),
    weapons: Array.isArray(record.weapons) ? record.weapons : base.weapons,
    protections: Array.isArray(record.protections) ? record.protections : [],
    injuries: Array.isArray(record.injuries) ? record.injuries : [],
    inventoryItems: Array.isArray(record.inventoryItems) ? record.inventoryItems : [],
  };
}

export function readEspiralEncounters(storage) {
  const raw = storage.getItem(ESPIRAL_ENCOUNTERS_KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.records) || data.records.some(record => !record?.id || record.version !== 1 || record.sistema !== 'espiral')) {
    throw new Error('O arquivo de encontros ESPIRAL é inválido. Os dados foram preservados.');
  }
  return data.records.map(normalizeEspiralEncounter);
}

export function writeEspiralEncounter(storage, record) {
  const records = readEspiralEncounters(storage);
  const normalized = normalizeEspiralEncounter(record);
  const exists = records.some(item => item.id === record.id);
  const next = exists ? records.map(item => item.id === record.id ? normalized : item) : [...records, normalized];
  storage.setItem(ESPIRAL_ENCOUNTERS_KEY, JSON.stringify({ version: 1, records: next }));
  return next;
}

export function rollEspiralEncounter(sheet, attribute, resource, difficulty, die) {
  const normalized = normalizeEspiralEncounter(sheet);
  const sides = normalized.attributes[attribute] * 2 + 2;
  const count = 1 + normalized.resources[resource];
  const pressure = normalized.pressure + (resource === 'Controle Mental' && normalized.sanity === 0 ? 1 : 0);
  return { ...resolveRoll(Array.from({ length: count }, () => die(sides)), Array.from({ length: pressure }, () => die(6)), sides, bounded(difficulty, 1, 30)), label: `${ATTRIBUTES[attribute].name} + ${resource}`, sides };
}
