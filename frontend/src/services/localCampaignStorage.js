// Campaigns contain maps and inline portraits that exceed localStorage's quota.
// Read legacy saves, but commit to IndexedDB before removing the old copy.
const DB = 'darkness-local-campaigns';
const STORE = 'campaigns';
let database;
let channel;
const bus = () => {
  if (!channel && typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(DB);
  return channel;
};
export function listenLocalCampaign(key, onChange) {
  const receive = event => { if (event.data?.key === key) onChange(event); };
  const broadcast = bus();
  broadcast?.addEventListener('message', receive);
  return () => broadcast?.removeEventListener('message', receive);
}
const open = () => {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => { database = null; throw error; });
  return database;
};
async function access(key, value, remove = false) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, value === undefined && !remove ? 'readonly' : 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = remove ? store.delete(key) : value === undefined ? store.get(key) : store.put(value, key);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error || new Error('Não foi possível salvar a campanha neste dispositivo.'));
    transaction.onerror = () => reject(transaction.error);
  });
}
export async function readLocalCampaign(key) {
  if (typeof indexedDB !== 'undefined') {
    const saved = await access(key);
    if (saved !== undefined) return saved;
  }
  return JSON.parse(localStorage.getItem(key));
}
export async function writeLocalCampaign(key, state) {
  if (typeof indexedDB === 'undefined') {
    localStorage.setItem(key, JSON.stringify(state));
    return;
  }
  await access(key, state);
  localStorage.removeItem(key);
  bus()?.postMessage({ key });
  // Existing campaign subscribers use the storage event to refresh other tabs.
  try { localStorage.setItem(key + ':revision', String(Date.now() + Math.random())); } catch {}
}
export async function removeLocalCampaign(key) {
  if (typeof indexedDB !== 'undefined') await access(key, undefined, true);
  localStorage.removeItem(key);
}
