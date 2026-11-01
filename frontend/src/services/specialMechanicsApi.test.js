import { salvarMecanicasCampanha } from './mesaApi';
import { emptyMechanics, applyMechanicAction } from '../utils/specialMechanics';
import { supabase } from './supabase';
jest.mock('./supabase', () => ({ supabaseConfigurado: true, supabaseObrigatorioAusente: false, supabase: { from: jest.fn() } }));
const next = () => applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'challenge', id: 'test' });
let query;
beforeEach(() => {
  query = { update: jest.fn(() => query), eq: jest.fn(() => query), select: jest.fn(() => query), maybeSingle: jest.fn() };
  supabase.from.mockReturnValue(query);
});
test('salva usando campanha e revisão esperada e retorna apenas o estado confirmado', async () => {
  const state = next();
  query.maybeSingle.mockResolvedValue({ data: { mecanicas_especiais: state }, error: null });
  expect(await salvarMecanicasCampanha('campaign', state, 0)).toEqual(state);
  expect(query.eq).toHaveBeenCalledWith('id', 'campaign');
  expect(query.eq).toHaveBeenCalledWith('mecanicas_especiais->>revision', '0');
});
test('não confirma alteração quando a revisão mudou ou não houve acesso à linha', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  await expect(salvarMecanicasCampanha('campaign', next(), 0)).rejects.toMatchObject({ code: 'MECHANIC_CONFLICT' });
});
test('informa migração ausente e mantém erros de permissão', async () => {
  query.maybeSingle.mockResolvedValue({ error: { code: 'PGRST204', message: 'Missing mecanicas_especiais' } });
  await expect(salvarMecanicasCampanha('campaign', next(), 0)).rejects.toThrow('migração');
  query.maybeSingle.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });
  await expect(salvarMecanicasCampanha('campaign', next(), 0)).rejects.toMatchObject({ code: '42501' });
});
