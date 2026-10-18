import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { multipart, PART_SIZE } from './multipart.mjs';
globalThis.crypto ||= webcrypto;
function setup() {
  const stored = new Map(), calls = [];
  const upload = { uploadId: 'upload-1', uploadPart: async (number, bytes) => { calls.push(['part', number, bytes.byteLength]); return { partNumber: number, etag: 'etag-' + number }; }, complete: async parts => calls.push(['complete', parts]), abort: async () => calls.push(['abort']) };
  const env = { MEDIA: { createMultipartUpload: async () => upload, resumeMultipartUpload: () => upload, put: async (key, body) => stored.set(key, body), get: async key => stored.has(key) ? { json: async () => JSON.parse(stored.get(key)) } : null, delete: async key => stored.delete(key) } };
  const json = (body, status = 200) => Response.json(body, { status });
  const send = (path, method, body, user = 'owner') => multipart(new Request('https://media.test/multipart/' + path, { method, ...(body ? { body } : {}) }), env, { id: user }, json);
  return { send, stored, calls };
}
test('multipart validates ownership, ordering, exact size and completes only uploaded parts', async () => {
  const { send, calls, stored } = setup();
  const { id } = await (await send('create', 'POST', JSON.stringify({ path: 'modelos3d/map.glb', size: PART_SIZE + 3 }))).json();
  assert.equal((await send(`${id}/part?number=1`, 'PUT', new Uint8Array(PART_SIZE), 'other')).status, 404);
  assert.equal((await send(`${id}/complete`, 'POST')).status, 409);
  assert.equal((await send(`${id}/part?number=2`, 'PUT', new Uint8Array(3))).status, 409);
  assert.equal((await send(`${id}/part?number=1`, 'PUT', new Uint8Array(PART_SIZE))).status, 200);
  assert.equal((await send(`${id}/part?number=2`, 'PUT', new Uint8Array(2))).status, 400);
  assert.equal((await send(`${id}/part?number=2`, 'PUT', new Uint8Array(3))).status, 200);
  const completed = await (await send(`${id}/complete`, 'POST')).json();
  assert.match(completed.path, /^r2:owner\/mapas\//);
  assert.equal(calls.filter(call => call[0] === 'complete').length, 1);
  assert.equal(stored.size, 0);
});
test('multipart refuses oversized files and traversal paths', async () => {
  const { send, stored } = setup();
  for (const body of [{ path: 'modelos3d/file.glb', size: 513 * 1024 * 1024 }, { path: 'modelos3d/../secret', size: 3 }]) assert.equal((await send('create', 'POST', JSON.stringify(body))).status, 400);
  assert.equal(stored.size, 0);
});
test('abort removes the temporary session without completing an object', async () => {
  const { send, calls, stored } = setup();
  const { id } = await (await send('create', 'POST', JSON.stringify({ path: 'modelos3d/file.glb', size: 3 }))).json();
  assert.equal((await send(`${id}/abort`, 'DELETE')).status, 200);
  assert.deepEqual(calls, [['abort']]); assert.equal(stored.size, 0);
});
