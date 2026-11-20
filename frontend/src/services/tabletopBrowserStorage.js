import { tokenTransformCache } from '../utils/tabletopTokenState';

// Browser storage is a cache, never a prerequisite for a live tabletop action.
export function readTabletopValue(key) {
  try { const value = sessionStorage.getItem(key); if (value !== null) return value; } catch { /* Try persistent storage. */ }
  try { return localStorage.getItem(key); } catch { return null; }
}
export function storeTabletopValue(key, value) {
  try {
    localStorage.setItem(key, value);
    try { sessionStorage.removeItem(key); } catch { /* Cache only. */ }
    return true;
  } catch {
    try { sessionStorage.setItem(key, value); return true; } catch { return false; }
  }
}
export function resetTokenCache(current, personId, storageKey) {
  const next = { ...current };
  delete next[personId];
  storeTabletopValue(storageKey, JSON.stringify(tokenTransformCache(next)));
  return next;
}
