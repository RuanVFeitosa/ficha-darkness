jest.mock("./supabase", () => ({ supabase: { auth: { getSession: jest.fn() }, storage: { from: jest.fn() } } }));
jest.mock('./supabaseMedia', () => ({ supabaseMedia: require('./supabase').supabase }));
jest.mock('../components/midia/MediaLogin', () => ({ __esModule: true, default: jest.fn(() => Promise.reject(new Error('Entre na sua conta para enviar arquivos ao R2.'))) }));
const originalFetch = global.fetch;
let mediaStorage, supabase;
beforeEach(() => {
  jest.resetModules(); process.env.REACT_APP_MEDIA_URL = "https://media.test";
  supabase = require("./supabase").supabase;
  supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: "session" } } });
  mediaStorage = require("./mediaStorage").mediaStorage;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ path: "r2:user/mapas/token.png", url: "https://media.test/files/user/mapas/token.png" }) });
});
afterEach(() => { delete process.env.REACT_APP_MEDIA_URL; global.fetch = originalFetch; });
test("uploads to R2 with session and resolves the tagged URL", async () => {
  const file = new Blob(["image"], { type: "image/png" });
  const storage = mediaStorage.from("mapas");
  const result = await storage.upload("campaign/token.png", file);
  expect(result.data.path).toBe("r2:user/mapas/token.png");
  expect(global.fetch).toHaveBeenCalledWith("https://media.test/upload/mapas/campaign/token.png", expect.objectContaining({ method: "PUT", headers: expect.objectContaining({ Authorization: "Bearer session" }) }));
  expect(storage.getPublicUrl(result.data.path).data.publicUrl).toBe("https://media.test/files/user/mapas/token.png");
  expect(storage.getPublicUrl("campaign/token.png").data.publicUrl).toBe("https://media.test/files/user/mapas/token.png");
});
test("R2 failure does not upload to Supabase silently", async () => {
  global.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Upload recusado" }) });
  const result = await mediaStorage.from("mapas").upload("token.png", new Blob());
  expect(result.error.message).toBe("Upload recusado"); expect(supabase.storage.from).not.toHaveBeenCalled();
});

test('model uploads require R2 even when its environment variable is missing', async () => {
  jest.resetModules(); delete process.env.REACT_APP_MEDIA_URL;
  const api = require('./mediaStorage');
  const result = await api.mediaStorage.from('mapas').upload('model.glb', new Blob(['x']), { requireR2: true, multipart: true });
  expect(result.error.message).toMatch(/R2 obrigatório/);
  expect(require('./supabase').supabase.storage.from).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('multipart sends slices, completes and resolves a Cloudflare URL', async () => {
  const file = { size: 134 * 1024 * 1024, slice: jest.fn(() => new Blob(['part'])) };
  global.fetch.mockImplementation(async url => ({ ok: true, json: async () => url.endsWith('/create') ? { id: 'session-id', partSize: 8 * 1024 * 1024 } : url.endsWith('/complete') ? { path: 'r2:owner/mapas/map.glb', url: 'https://media.test/files/owner/mapas/map.glb' } : { uploaded: 1 } }));
  const progress = jest.fn();
  const result = await mediaStorage.from('mapas').upload('campaign/map.glb', file, { multipart: true, requireR2: true, onProgress: progress });
  expect(result.error).toBeNull(); expect(file.slice).toHaveBeenCalledTimes(17);
  expect(progress).toHaveBeenLastCalledWith(file.size, file.size);
  expect(supabase.storage.from).not.toHaveBeenCalled();
});

test('failed multipart aborts without falling back to Supabase', async () => {
  global.fetch.mockImplementation(async url => ({ ok: !url.includes('/part?'), json: async () => url.endsWith('/create') ? { id: 'test', partSize: 8 * 1024 * 1024 } : { error: 'Parte recusada' } }));
  const result = await mediaStorage.from('mapas').upload('model.glb', { size: 4, slice: () => new Blob(['part']) }, { multipart: true, requireR2: true });
  expect(result.error.message).toBe('Parte recusada');
  expect(global.fetch).toHaveBeenCalledWith('https://media.test/multipart/test/abort', expect.objectContaining({ method: 'DELETE' }));
  expect(supabase.storage.from).not.toHaveBeenCalled();
});
test("mixed cleanup dispatches each path to its original provider", async () => {
  const remove = jest.fn().mockResolvedValue({ error: null });
  supabase.storage.from.mockReturnValue({ remove });
  const result = await mediaStorage.from("evidencias").remove(["campaign/old.png", "r2:user/evidencias/new.png"]);
  expect(result.error).toBeNull(); expect(remove).toHaveBeenCalledWith(["campaign/old.png"]);
  expect(global.fetch).toHaveBeenCalledWith("https://media.test/files", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ paths: ["user/evidencias/new.png"] }) }));
});
test("without a session the user gets a clear error", async () => {
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  const result = await mediaStorage.from("mapas").upload("token.png", new Blob());
  expect(result.error.message).toMatch(/Entre na sua conta/); expect(global.fetch).not.toHaveBeenCalled();
});
test("without R2 configuration existing storage remains active", async () => {
  jest.resetModules(); delete process.env.REACT_APP_MEDIA_URL;
  const storage = { upload: jest.fn().mockResolvedValue({ data: { path: "legacy" }, error: null }) };
  require("./supabase").supabase.storage.from.mockReturnValue(storage);
  const api = require("./mediaStorage");
  await api.mediaStorage.from("mapas").upload("legacy", new Blob());
  expect(storage.upload).toHaveBeenCalled();
  expect(await api.externalizarImagens({ image: "data:image/png;base64,YQ==" })).toEqual({ image: "data:image/png;base64,YQ==" });
});

test("nested token images become URLs and repeated images upload only once", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(global, "crypto");
  Object.defineProperty(global, "crypto", { configurable: true, value: { subtle: { digest: jest.fn(async () => new Uint8Array([1,2]).buffer) } } });
  global.fetch.mockImplementation(async url => url.startsWith("data:")
    ? { blob: async () => ({ type: "image/png", arrayBuffer: async () => new Uint8Array([1]).buffer }) }
    : { ok: true, json: async () => ({ path: "r2:user/mapas/token.png", url: "https://media.test/files/user/mapas/token.png" }) });
  try {
    const api = require("./mediaStorage");
    const image = "data:image/png;base64,YQ==";
    const result = await api.externalizarImagens({ image, portrait: image, position: [1,2,3] });
    expect(result).toEqual({ image: "https://media.test/files/user/mapas/token.png", portrait: "https://media.test/files/user/mapas/token.png", position: [1,2,3] });
    expect(global.fetch.mock.calls.filter(([url]) => url.startsWith("https://media.test/upload/"))).toHaveLength(1);
  } finally {
    if (descriptor) Object.defineProperty(global, "crypto", descriptor); else delete global.crypto;
  }
});
