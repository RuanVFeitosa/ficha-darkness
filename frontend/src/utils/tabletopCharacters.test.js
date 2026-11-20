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


test('vínculo remoto Darkness encontra o token da ficha adaptada sem alterar seu código', () => {
  const local = { id: 'espiral:darkness-abc', sheet: { name: 'Ellie', tabletopTokenImage: '/ellie.png' } };
  expect(campaignCharacters({ membros: [{ ficha_id: 'espiral_darkness-abc', nome: 'Ellie' }] }, [local])).toEqual([local]);
});


test('mestre move a ficha selecionada sem precisar importar outro token', () => {
  const { floorMovementTarget } = require('./tabletopCharacters');
  expect(floorMovementTarget({ mestre: true, people: [{ id: 'espiral:ana' }], selected: 0 })).toEqual({ kind: 'person', index: 0, id: 'espiral:ana' });
  expect(floorMovementTarget({ mestre: true, people: [], tokenMode: true, selectedToken: 'custom' })).toEqual({ kind: 'custom', id: 'custom' });
  expect(floorMovementTarget({ mestre: true, people: [], pendingToken: {} })).toEqual({ kind: 'place' });
});
test('jogador só move a própria ficha mesmo se outro token estiver selecionado', () => {
  const { floorMovementTarget } = require('./tabletopCharacters');
  const options = { mestre: false, people: [{ id: 'outro' }, { id: 'proprio' }], selected: 0, playerIndex: 1, tokenMode: true, selectedToken: 'custom', pendingToken: {} };
  expect(floorMovementTarget(options)).toEqual({ kind: 'person', index: 1, id: 'proprio' });
  expect(floorMovementTarget({ ...options, playerIndex: -1 })).toBeNull();
});
