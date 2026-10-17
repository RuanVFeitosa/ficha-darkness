import { criarCampanhaMesa, salvarCena } from './mesaApi';
import { supabase } from './supabase';
jest.mock('./supabase', () => ({
  supabaseConfigurado: true,
  supabaseObrigatorioAusente: false,
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
const missing = column => ({ code: 'PGRST204', message: `Could not find the '${column}' column in the schema cache` });
let writes;
function databaseResponses(...responses) {
  const single = jest.fn();
  responses.forEach(response => single.mockResolvedValueOnce(response));
  const query = { insert: jest.fn(payload => { writes.push({ ...payload }); return query; }), upsert: jest.fn(payload => { writes.push({ ...payload }); return query; }), select: jest.fn(() => query), single };
  supabase.from.mockReturnValue(query);
}
beforeEach(() => {
  jest.clearAllMocks();
  writes = [];
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'master' } } });
});
test('cria campanha 2D em banco anterior à migração 034', async () => {
  databaseResponses({ error: missing('tabletop_tipo') }, { data: { id: 'c1', nome: 'Campanha' }, error: null });
  expect(await criarCampanhaMesa('Campanha')).toEqual({ id: 'c1', nome: 'Campanha' });
  expect(writes[0].tabletop_tipo).toBe('2d');
  expect(writes[1]).not.toHaveProperty('tabletop_tipo');
});
test('informa a migração necessária sem criar campanha 3D como 2D', async () => {
  databaseResponses({ error: missing('tabletop_tipo') });
  await expect(criarCampanhaMesa('Campanha', '3d')).rejects.toThrow('migração 034');
  expect(writes).toHaveLength(1);
});
test('salva cena em banco sem dificuldades e loja_disponivel', async () => {
  databaseResponses({ error: missing('dificuldades') }, { error: missing('loja_disponivel') }, { data: { id: 'scene' }, error: null });
  expect(await salvarCena('c1', { nome: 'Cena' })).toEqual({ id: 'scene' });
  expect(writes[2]).not.toHaveProperty('dificuldades');
  expect(writes[2]).not.toHaveProperty('loja_disponivel');
});
test('preserva dificuldades personalizadas quando a migração existe', async () => {
  databaseResponses({ data: { id: 'scene' }, error: null });
  await salvarCena('c1', { nome: 'Cena', dificuldades: { ambiente: 7, combateAmbiente: 4, conflitos: 4 } });
  expect(writes[0].dificuldades.ambiente).toBe(7);
});
test('não descarta dificuldades personalizadas se a migração 038 falta', async () => {
  databaseResponses({ error: missing('dificuldades') });
  await expect(salvarCena('c1', { nome: 'Cena', dificuldades: { ambiente: 7, combateAmbiente: 4, conflitos: 4 } })).rejects.toThrow('migração 038');
  expect(writes).toHaveLength(1);
});
test('não repete escrita recusada por permissões', async () => {
  const error = { code: '42501', message: 'permission denied' };
  databaseResponses({ error });
  await expect(salvarCena('c1', { nome: 'Cena' })).rejects.toEqual(error);
  expect(writes).toHaveLength(1);
});
