import { useEffect, useState } from 'react';
import { CATALOGO_ESPIRAL } from '../data/catalogoEspiral';

const KEY = 'darkness:weapon-catalog:v1';
const EVENT = 'darkness:weapon-catalog-updated';
export function readWeaponCatalog() {
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { /* Mantém o catálogo padrão. */ }
  return CATALOGO_ESPIRAL.map(entry => ({ ...entry, ...overrides[entry.id], id: entry.id, type: entry.type, category: entry.category }));
}
export function saveEquipment(entry) {
  const name = String(entry.name || '').trim();
  const damage = String(entry.damage || '').trim();
  if (!name) throw new Error('Informe o nome do equipamento.');
  const original = CATALOGO_ESPIRAL.find(item => item.id === entry.id);
  if (!original) throw new Error('Equipamento não encontrado.');
  if (original.type === 'weapon' && !/^[1-9]\d*d(4|6|8|10|12)([+-]\d+)?$/i.test(damage)) throw new Error('Informe um dano válido, como 2d6 ou 1d8+2.');
  if (original.type === 'protection' && (String(entry.value).trim() === '' || !Number.isInteger(Number(entry.value)) || Number(entry.value) < 0)) throw new Error('A proteção deve ser um número inteiro igual ou maior que zero.');
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { /* Recupera armazenamento inválido. */ }
  overrides[entry.id] = { name, detail: String(entry.detail || '').trim(),
    ...(original.type === 'weapon' ? { damage: damage.toLowerCase(), weaponGroup: entry.weaponGroup === 'fogo' ? 'fogo' : 'brancas' } : {}),
    ...(original.type === 'protection' ? { value: Number(entry.value), region: String(entry.region || '').trim() } : {}),
  };
  localStorage.setItem(KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(EVENT));
}
export const saveWeapon = saveEquipment;
export function useDarknessWeaponCatalog() {
  const [catalog, setCatalog] = useState(readWeaponCatalog);
  useEffect(() => {
    const update = () => setCatalog(readWeaponCatalog());
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener('storage', update); };
  }, []);
  return catalog;
}
