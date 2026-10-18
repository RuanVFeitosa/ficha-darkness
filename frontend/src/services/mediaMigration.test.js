jest.mock("./supabase", () => ({ supabase: { auth: { getSession: jest.fn() }, from: jest.fn() } }));
jest.mock('./supabaseMedia', () => ({ supabaseMedia: require('./supabase').supabase }));
jest.mock("./mediaStorage", () => ({ r2Configurado: true, externalizarImagens: jest.fn(async value => value.replace("data:image/png;base64,abc", "https://media.test/files/user/mapas/token.png")), mediaStorage: { from: jest.fn() } }));
let api, supabase, storage;
beforeEach(() => {
  jest.resetModules(); localStorage.clear();
  process.env.REACT_APP_SUPABASE_URL = "https://project.supabase.co";
  api = require("./mediaMigration"); supabase = require("./supabase").supabase;
  supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: "session" } } });
  storage = { upload: jest.fn().mockResolvedValue({ data: { path: "r2:user/mapas/migrated.png" } }), getPublicUrl: jest.fn(() => ({ data: { publicUrl: "https://media.test/files/user/mapas/migrated.png" } })) };
  require("./mediaStorage").mediaStorage.from.mockReturnValue(storage);
});
afterEach(() => { delete process.env.REACT_APP_SUPABASE_URL; delete global.fetch; });
test("nested base64 images are replaced without changing unrelated fields", async () => {
  expect(await api.substituirImagens({ posicoes: [{ image: "data:image/png;base64,abc", x: 3 }] })).toEqual({ posicoes: [{ image: "https://media.test/files/user/mapas/token.png", x: 3 }] });
});
test("only images from the configured Supabase project are copied", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: { get: () => "image/png" }, blob: async () => new Blob(["image"]) });
  const old = "https://project.supabase.co/storage/v1/object/public/mapas/a.png";
  expect(await api.substituirImagens(old)).toBe("https://media.test/files/user/mapas/migrated.png");
  expect(await api.substituirImagens("https://other.test/a.png")).toBe("https://other.test/a.png");
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("an unreadable old image remains unchanged instead of corrupting references", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(api.substituirImagens("https://project.supabase.co/storage/v1/object/public/mapas/missing.png")).rejects.toThrow("HTTP 404");
  expect(storage.upload).not.toHaveBeenCalled();
});
test("migration downloads backup before local references are changed", async () => {
  const key = "espiral:sheet:v1:123";
  const old = JSON.stringify({ tabletopTokenImage: "data:image/png;base64,abc" });
  localStorage.setItem(key, old);
  const chain = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], error: null }) };
  supabase.from.mockReturnValue(chain);
  const backup = jest.fn(saved => { expect(saved.local[key]).toBe(old); expect(localStorage.getItem(key)).toBe(old); });
  const report = await api.migrarImagensExistentes(jest.fn(), backup);
  expect(backup).toHaveBeenCalledTimes(1); expect(report.errors).toEqual([]); expect(report.updated).toBe(1);
  expect(JSON.parse(localStorage.getItem(key)).tabletopTokenImage).toBe("https://media.test/files/user/mapas/token.png");
});
test("missing authentication fails before reading or updating database rows", async () => {
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  await expect(api.migrarImagensExistentes(jest.fn(), jest.fn())).rejects.toThrow("sem uma sessão Supabase");
  expect(supabase.from).not.toHaveBeenCalled();
});
