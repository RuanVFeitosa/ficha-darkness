import { sheetTabletopCampaigns } from './sheetTabletopCampaigns';
import { listarCampanhasDaFicha } from './mesaApi';
import { espiralTabletopUrl } from '../utils/espiralTabletop';
jest.mock('./mesaApi', () => ({ listarCampanhasDaFicha: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test('encontra vínculo remoto criado pelo mestre e leva o mesmo ID ao tabletop', async () => {
  listarCampanhasDaFicha.mockImplementation(async id => id === 'espiral_44085861' ? [{ id: 'mesa', codigo: 'ABCD', tabletop_tipo: '3d' }] : []);
  const campaigns = await sheetTabletopCampaigns('44085861');
  expect(campaigns).toHaveLength(1);
  expect(campaigns[0].linkedSheetId).toBe('espiral_44085861');
  const url = new URL(espiralTabletopUrl('44085861', campaigns[0]), 'http://localhost');
  expect(url.searchParams.get('ficha')).toBe('44085861');
  expect(url.searchParams.get('vinculo')).toBe('espiral_44085861');
});
test('preserva código completo da adaptação e não duplica a mesma mesa', async () => {
  listarCampanhasDaFicha.mockResolvedValue([{ id: 'mesa', codigo: 'ABCD', tabletop_tipo: '3d' }, { id: '2d', tabletop_tipo: '2d' }]);
  const campaigns = await sheetTabletopCampaigns('darkness-abc', 'origem');
  expect(listarCampanhasDaFicha).toHaveBeenCalledWith('espiral_darkness-abc');
  expect(campaigns).toHaveLength(1);
});
test('mostra falha de consulta em vez de afirmar que não há vínculo', async () => {
  listarCampanhasDaFicha.mockRejectedValue(new Error('Falha de conexão'));
  await expect(sheetTabletopCampaigns('44085861')).rejects.toThrow('Falha de conexão');
});
