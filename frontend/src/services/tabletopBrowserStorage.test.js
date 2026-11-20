import { readTabletopValue, storeTabletopValue, resetTokenCache } from './tabletopBrowserStorage';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => jest.restoreAllMocks());
test('reset com cota local cheia mantém os outros tokens e restaura pela cópia da aba', () => {
  const originalWrite = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
    if (this === localStorage) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return originalWrite.call(this, key, value);
  });
  const current = { ana: { x: 2, z: 3, scale: 2 }, bia: { x: 4, z: 5 } };
  const next = resetTokenCache(current, 'ana', 'tokens');
  expect(next).toEqual({ bia: current.bia });
  expect(current.ana).toEqual({ x: 2, z: 3, scale: 2 });
  expect(JSON.parse(readTabletopValue('tokens'))).toEqual({ bia: expect.objectContaining({ x: 4, z: 5 }) });
});
test('reset não derruba a cena mesmo se os dois armazenamentos estiverem cheios', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  expect(resetTokenCache({ ana: { x: 1 }, bia: { x: 2 } }, 'ana', 'tokens')).toEqual({ bia: { x: 2 } });
  expect(storeTabletopValue('camera', '1')).toBe(false);
});
test('valor recente da aba tem prioridade sobre cache antigo e volta ao armazenamento local quando possível', () => {
  localStorage.setItem('speed', '1'); sessionStorage.setItem('speed', '2');
  expect(readTabletopValue('speed')).toBe('2');
  expect(storeTabletopValue('speed', '3')).toBe(true);
  expect(readTabletopValue('speed')).toBe('3');
  expect(sessionStorage.getItem('speed')).toBeNull();
});
