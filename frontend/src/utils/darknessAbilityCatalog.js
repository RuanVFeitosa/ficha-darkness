import { useEffect, useState } from 'react';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from '../data/habilidadesEspiral';

const KEY = 'darkness:ability-catalog:v1';
const EVENT = 'darkness:ability-catalog-updated';
const base = Object.entries(HABILIDADES_ESPIRAL).flatMap(([category, entries]) => entries.map(([name, action, detail]) => ({
  id: `${category}:${name}`, name, category, action, detail, type: 'ability',
  levels: APRIMORAMENTOS_HABILIDADES_ESPIRAL[name] || [detail, detail, detail], hope: CUSTOS_ESPERANCA_HABILIDADES[name] || [0, 0],
})));
function overrides() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return value && !Array.isArray(value) && typeof value === 'object' ? value : {}; } catch { return {}; }
}
export function readAbilityCatalog() {
  const edits = overrides();
  return base.filter(entry => !edits[entry.id]?.deleted).map(entry => ({ ...entry, ...edits[entry.id], id: entry.id, category: entry.category, type: 'ability' }));
}
export function deleteAbility(id, deleted = true) {
  if (!base.some(entry => entry.id === id)) throw new Error('Habilidade não encontrada.');
  const edits = overrides();
  edits[id] = { ...edits[id], deleted };
  localStorage.setItem(KEY, JSON.stringify(edits));
  window.dispatchEvent(new Event(EVENT));
}
export function saveAbility(entry) {
  if (!base.some(item => item.id === entry.id)) throw new Error('Habilidade não encontrada.');
  if (!String(entry.name || '').trim()) throw new Error('Informe o nome da habilidade.');
  if (!Array.isArray(entry.levels) || entry.levels.length !== 3 || entry.levels.some(level => !String(level || '').trim())) throw new Error('Preencha os efeitos dos três níveis.');
  if (!Array.isArray(entry.hope) || entry.hope.length !== 2 || entry.hope.some(value => String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < 0)) throw new Error('Os custos devem ser números inteiros iguais ou maiores que zero.');
  const edits = overrides();
  edits[entry.id] = { name: entry.name.trim(), action: String(entry.action || '').trim(), levels: entry.levels.map(level => level.trim()), detail: entry.levels[0].trim(), hope: entry.hope.map(Number), customized: true };
  localStorage.setItem(KEY, JSON.stringify(edits));
  window.dispatchEvent(new Event(EVENT));
}
export function useDarknessAbilityCatalog() {
  const [catalog, setCatalog] = useState(readAbilityCatalog);
  useEffect(() => {
    const refresh = () => setCatalog(readAbilityCatalog());
    window.addEventListener(EVENT, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  return catalog;
}
