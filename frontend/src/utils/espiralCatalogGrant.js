// Usa os mesmos campos consumidos pela loja, ficha e Transformação ESPIRAL.
export function grantEspiralCatalogEntry(sheet, entry, id) {
  if (entry.type === 'ability') {
    const abilities = Array.isArray(sheet.evolution?.abilities) ? sheet.evolution.abilities : [];
    if (abilities.some(ability => ability.id === entry.id)) return {};
    return { evolution: { ...sheet.evolution, abilities: [...abilities, { id: entry.id, name: entry.name, category: entry.category, level: 1 }] } };
  }
  if (entry.type === 'weapon') {
    return { weapons: [...(Array.isArray(sheet.weapons) ? sheet.weapons : []), { id, sourceId: entry.id, name: entry.name, damage: entry.damage, ammo: '', detail: entry.detail, category: entry.category, weaponGroup: entry.weaponGroup }] };
  }
  if (entry.type === 'protection') {
    return { protections: [...(Array.isArray(sheet.protections) ? sheet.protections : []), { id, sourceId: entry.id, name: entry.name, value: String(entry.value), region: entry.region, detail: entry.detail, category: entry.category }] };
  }
  if (entry.type !== 'item') throw new Error('Entrada inválida do catálogo ESPIRAL.');
  return {
    inventoryItems: [...(Array.isArray(sheet.inventoryItems) ? sheet.inventoryItems : []), { id, sourceId: entry.id, name: entry.name, type: entry.type, category: entry.category, detail: entry.detail, quantity: 1 }],
    inventory: [...new Set([...String(sheet.inventory || '').split('\n').filter(Boolean), entry.name])].join('\n'),
  };
}
