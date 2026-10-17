import { grantEspiralCatalogEntry } from './espiralCatalogGrant';
import { CATALOGO_ESPIRAL } from '../data/catalogoEspiral';

test('concede armas e proteções no formato lido pela ficha ESPIRAL', () => {
  const sheet = { weapons: [{ id: 'old' }], protections: [] };
  const weapon = CATALOGO_ESPIRAL.find(item => item.name === 'Pistola');
  const armor = CATALOGO_ESPIRAL.find(item => item.name === 'Colete Balístico');
  expect(grantEspiralCatalogEntry(sheet, weapon, 'new').weapons).toEqual([{ id: 'old' }, expect.objectContaining({ id: 'new', sourceId: weapon.id, damage: '2d6', ammo: '' })]);
  expect(grantEspiralCatalogEntry(sheet, armor, 'armor').protections[0]).toEqual(expect.objectContaining({ value: '4', region: 'Torso' }));
  expect(sheet.weapons).toHaveLength(1);
});

test('mantém inventário antigo e estruturado ao conceder equipamento', () => {
  const item = CATALOGO_ESPIRAL.find(entry => entry.name === 'Lanterna');
  const result = grantEspiralCatalogEntry({ inventory: 'Corda\nLanterna', inventoryItems: [{ id: 'old' }] }, item, 'new');
  expect(result.inventory).toBe('Corda\nLanterna');
  expect(result.inventoryItems).toEqual([{ id: 'old' }, expect.objectContaining({ id: 'new', sourceId: item.id, name: 'Lanterna', quantity: 1 })]);
});

test('concede habilidade sem gastar evolução e evita duplicatas', () => {
  const entry = { type: 'ability', id: 'Ofensiva:Golpe Calculado', name: 'Golpe Calculado', category: 'Ofensiva' };
  const sheet = { evolution: { points: 7, vertente: { nome: 'Metódica', nivel: 2 }, abilities: [] } };
  const result = grantEspiralCatalogEntry(sheet, entry);
  expect(result.evolution).toEqual({ ...sheet.evolution, abilities: [{ id: entry.id, name: entry.name, category: entry.category, level: 1 }] });
  expect(grantEspiralCatalogEntry({ evolution: result.evolution }, entry)).toEqual({});
});
