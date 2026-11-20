import { consolidarOfensivasAdquiridas, ofensivaConsolidada } from '../data/ofensivasConsolidadas';
// Usa os mesmos campos consumidos pela loja, ficha e Transformação ESPIRAL.
export function grantEspiralCatalogEntry(sheet, entry, id) {
  if (entry.type === 'ability') {
    const abilities = consolidarOfensivasAdquiridas(Array.isArray(sheet.evolution?.abilities) ? sheet.evolution.abilities : []);
    const target = entry.customized ? entry : ofensivaConsolidada(entry.id) || entry;
    if (abilities.some(ability => ability.id === target.id)) return {};
    return { evolution: { ...sheet.evolution, abilities: [...abilities, { id: target.id, name: target.name, category: target.category, level: 1, ...(entry.customized ? { customized: true, action: entry.action, levels: entry.levels, hope: entry.hope, detail: entry.detail } : {}) }] } };
  }
  if (entry.type === 'weapon') {
    return { weapons: [...(Array.isArray(sheet.weapons) ? sheet.weapons : []), { id, sourceId: entry.id, name: entry.name, damage: entry.damage, ammo: entry.ammo == null ? '' : Math.max(0,Math.min(9999,Math.floor(Number(entry.ammo) || 0))), detail: entry.detail, category: entry.category, weaponGroup: entry.weaponGroup }] };
  }
  if (entry.type === 'protection') {
    return { protections: [...(Array.isArray(sheet.protections) ? sheet.protections : []), { id, sourceId: entry.id, name: entry.name, value: String(entry.value), region: entry.region, detail: entry.detail, category: entry.category }] };
  }
  if (entry.type !== 'item') throw new Error('Entrada inválida do catálogo ESPIRAL.');
  return {
    inventoryItems: [...(Array.isArray(sheet.inventoryItems) ? sheet.inventoryItems : []), { id, sourceId: entry.id, name: entry.name, type: entry.type, category: entry.category, detail: entry.detail, quantity: Math.max(1, Math.min(99, Math.floor(Number(entry.quantity) || 1))) }],
    inventory: [...new Set([...String(sheet.inventory || '').split('\n').filter(Boolean), entry.name])].join('\n'),
  };
}
