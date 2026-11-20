import { searchMasterSheets } from './darknessMaster';

const sheets = [{ fichaId: 'old', personagem: { nome: 'Ágata', jogador: 'Ruan', classe: 'Médica' } }, { fichaId: 'new', personagem: { name: 'Lia', player: 'Ana', occupation: 'Investigadora' } }];
test('reúne fichas antigas e atuais sem alterar os registros', () => {
  expect(searchMasterSheets(sheets, '')).toEqual(sheets);
  expect(searchMasterSheets(sheets, 'agata medica')).toEqual([sheets[0]]);
  expect(searchMasterSheets(sheets, 'ANA')).toEqual([sheets[1]]);
  expect(searchMasterSheets(sheets, 'inexistente')).toEqual([]);
});
