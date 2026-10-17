import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "./worker.mjs";
globalThis.crypto ||= webcrypto;
let writes, deletions, env;
beforeEach(() => {
  writes = []; deletions = [];
  env = { ALLOWED_ORIGINS: "http://localhost:3000", SUPABASE_URL: "https://test.supabase.co", SUPABASE_ANON_KEY: "anon", MEDIA: { put: async (...args) => writes.push(args), delete: async paths => deletions.push(paths), get: async () => null } };
  globalThis.fetch = async () => Response.json({ id: "user-1" });
});
const request = (path, method = "PUT", extra = {}) => new Request("https://media.test" + path, { method, headers: { Origin: "http://localhost:3000", Authorization: "Bearer session", "Content-Type": "image/png", ...extra.headers }, ...(method === "PUT" ? { body: new Uint8Array([1,2,3]) } : {}), ...extra });
test("unauthenticated writes are refused", async () => {
  const req = request("/upload/mapas/test.png"); req.headers.delete("Authorization");
  assert.equal((await worker.fetch(req, env)).status, 401); assert.equal(writes.length, 0);
});
test("uploads use owner namespace, tagged paths and immutable content hashes", async () => {
  const response = await worker.fetch(request("/upload/mapas/campaign/test.png"), env);
  assert.equal(response.status, 200); const data = await response.json();
  assert.match(data.path, /^r2:user-1\/mapas\/[a-f0-9]{64}\/campaign\/test.png$/);
  assert.equal(writes[0][0], data.path.slice(3)); assert.ok(data.url.startsWith("https://media.test/files/"));
});
test("another user's objects cannot be deleted", async () => {
  const res = await worker.fetch(request("/files", "DELETE", { body: JSON.stringify({ paths: ["user-2/mapas/token.png"] }), headers: { Origin: "http://localhost:3000", Authorization: "Bearer session", "Content-Type": "application/json" } }), env);
  assert.equal(res.status, 403); assert.equal(deletions.length, 0);
});
test("owner deletion is allowed", async () => {
  const res = await worker.fetch(request("/files", "DELETE", { body: JSON.stringify({ paths: ["user-1/mapas/token.png"] }), headers: { Authorization: "Bearer session", "Content-Type": "application/json" } }), env);
  assert.equal(res.status, 200); assert.equal(deletions.length, 1);
});
test("HTML uploads and other origins are refused", async () => {
  assert.equal((await worker.fetch(request("/upload/mapas/file.html", "PUT", { headers: { Authorization: "Bearer session", "Content-Type": "text/html" } }), env)).status, 415);
  assert.equal((await worker.fetch(request("/upload/mapas/test.png", "PUT", { headers: { Origin: "https://other.test" } }), env)).status, 403);
});
test("expired sessions cannot write", async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  assert.equal((await worker.fetch(request("/upload/mapas/test.png"), env)).status, 401);
});
