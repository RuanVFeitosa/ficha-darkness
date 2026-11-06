import { readLocalCampaign, writeLocalCampaign, removeLocalCampaign } from './localCampaignStorage';

const records = new Map();
let abortWrite = false;
beforeAll(() => {
  // Transaction mock completes asynchronously, after the request is installed.
  global.indexedDB = { open: () => {
    const request = {};
    queueMicrotask(() => {
      request.result = { transaction: () => {
        const transaction = { objectStore: () => ({
          get: key => execute(() => records.get(key)),
          put: (value, key) => execute(() => records.set(key, value), true),
          delete: key => execute(() => records.delete(key), true),
        }) };
        function execute(action, write = false) {
          const operation = {};
          queueMicrotask(() => {
            if (write && abortWrite) {
              transaction.error = new Error('Disk full');
              transaction.onabort();
            } else {
              operation.result = action();
              transaction.oncomplete();
            }
          });
          return operation;
        }
        return transaction;
      } };
      request.onsuccess();
    });
    return request;
  } };
});
afterAll(() => { delete global.indexedDB; });
beforeEach(() => { localStorage.clear(); records.clear(); abortWrite = false; });

test('migrates a legacy campaign even when localStorage refuses further writes', async () => {
  const old = { cenas: [], inimigos: [] };
  localStorage.setItem('campaign', JSON.stringify(old));
  expect(await readLocalCampaign('campaign')).toEqual(old);
  const fail = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
  const updated = { ...old, inimigos: [{ nome: 'Guarda', tabletopTokenImage: 'data:image/png;base64,body' }] };
  try {
    await writeLocalCampaign('campaign', updated);
    expect(localStorage.getItem('campaign')).toBeNull();
    expect(await readLocalCampaign('campaign')).toEqual(updated);
    await removeLocalCampaign('campaign');
    expect(await readLocalCampaign('campaign')).toBeNull();
  } finally { fail.mockRestore(); }
});

test('failed durable write preserves the legacy campaign and reports failure', async () => {
  localStorage.setItem('campaign', JSON.stringify({ cenas: [], nome: 'Anterior' }));
  abortWrite = true;
  await expect(writeLocalCampaign('campaign', { nome: 'Nova' })).rejects.toThrow('Disk full');
  expect(await readLocalCampaign('campaign')).toEqual({ cenas: [], nome: 'Anterior' });
});
