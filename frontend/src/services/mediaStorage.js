import { supabase } from "./supabase";

const endpoint = (process.env.REACT_APP_MEDIA_URL || "").trim().replace(/\/$/, "");
export const r2Configurado = Boolean(endpoint);
const urls = new Map();
const pending = new Map();
const encodePath = path => path.split("/").map(encodeURIComponent).join("/");

async function headers() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data?.session?.access_token) throw new Error("Entre na sua conta para enviar arquivos ao R2.");
  return { Authorization: "Bearer " + data.session.access_token };
}
async function request(path, options) {
  const response = await fetch(endpoint + path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível acessar os arquivos no R2.");
  return result;
}
export const mediaStorage = {
  from(bucket) {
    return {
      async upload(path, file, options = {}) {
        if (!endpoint) return supabase.storage.from(bucket).upload(path, file, options);
        try {
          const result = await request("/upload/" + encodeURIComponent(bucket) + "/" + encodePath(path), {
            method: "PUT", body: file,
            headers: { ...await headers(), "Content-Type": options.contentType || file.type || "application/octet-stream" },
          });
          urls.set(bucket + ":" + path, result.url);
          return { data: { path: result.path }, error: null };
        } catch (error) { return { data: null, error }; }
      },
      getPublicUrl(path) {
        const publicUrl = path.startsWith("r2:")
          ? endpoint + "/files/" + encodePath(path.slice(3))
          : urls.get(bucket + ":" + path) || supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        return { data: { publicUrl } };
      },
      async remove(paths) {
        const legacy = paths.filter(path => !path.startsWith("r2:"));
        const remote = paths.filter(path => path.startsWith("r2:"));
        try {
          if (legacy.length) {
            const result = await supabase.storage.from(bucket).remove(legacy);
            if (result.error) throw result.error;
          }
          if (remote.length) {
            if (!endpoint) throw new Error("Configure o R2 antes de remover arquivos dele.");
            await request("/files", { method: "DELETE", headers: { ...await headers(), "Content-Type": "application/json" }, body: JSON.stringify({ paths: remote.map(path => path.slice(3)) }) });
          }
          return { data: paths, error: null };
        } catch (error) { return { data: null, error }; }
      },
    };
  },
};

// Only image data URIs are replaced. Local demo assets and existing URLs stay intact.
export async function externalizarImagens(value) {
  if (!endpoint) return value;
  if (typeof value === "string" && /^data:image\/(png|jpeg|webp|avif|gif);base64,/i.test(value)) {
    let operation = pending.get(value);
    if (!operation) {
      operation = (async () => {
        const file = await (await fetch(value)).blob();
        const bytes = await file.arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte => byte.toString(16).padStart(2, "0")).join("");
        const path = "tokens/" + hash + "." + file.type.split("/")[1];
        const result = await mediaStorage.from("mapas").upload(path, file);
        if (result.error) throw result.error;
        return mediaStorage.from("mapas").getPublicUrl(result.data.path).data.publicUrl;
      })();
      pending.set(value, operation);
      operation.then(() => { if (pending.size > 32) pending.delete(pending.keys().next().value); }, () => pending.delete(value));
    }
    return operation;
  }
  if (Array.isArray(value)) return Promise.all(value.map(externalizarImagens));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await externalizarImagens(item)])));
  return value;
}
