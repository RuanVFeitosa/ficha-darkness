import { campaignCharacters, tabletopPlayerId } from './tabletopCharacters';
test('identifica jogador Darkness pelo código e Espiral pela ficha', () => {
  expect(tabletopPlayerId(new URLSearchParams('ficha=helena&senha=1234'))).toBe('1234');
  expect(tabletopPlayerId(new URLSearchParams('sistema=espiral&ficha=5678&senha=1234'))).toBe('5678');
  expect(tabletopPlayerId(new URLSearchParams('ficha=legado'))).toBe('legado');
});
test('usa somente membros da campanha e preserva fichas locais vinculadas', () => {
  const linked = { id: 'espiral:1', sheet: { name: 'Ana', tabletopTokenImage: 'ana.png' } };
  const locals = [linked, { id: 'darkness:2', sheet: { nome: 'Outra campanha' } }];
  expect(campaignCharacters({ membros: [{ ficha_id: 'espiral:1' }, { ficha_id: '3', nome: 'Remoto' }, { ficha_id: 'custom3d:4' }] }, locals))
    .toEqual([linked, { id: 'darkness:3', sheet: { name: 'Remoto' } }]);
  expect(campaignCharacters({ membros: [] }, locals)).toEqual([]);
  expect(campaignCharacters(null, locals)).toEqual([]);
});
