import { supabase } from "./supabase";
import { supabaseMedia } from './supabaseMedia';
import { externalizarImagens, mediaStorage, r2Configurado } from "./mediaStorage";

const tables = ["campanhas", "cenas", "tokens_mapa", "documentos_investigacao", "inimigos_campanha", "personagens"];
const sourceUrl = (process.env.REACT_APP_SUPABASE_URL || "").replace(/\/$/, "");
const migrated = new Map();
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);
export async function verificarConfiguracaoMidia() {
  if (!r2Configurado) throw new Error("R2 não está configurado neste frontend. Reinicie o servidor de desenvolvimento; se estiver usando o build, gere um novo build com REACT_APP_MEDIA_URL.");
  if (!supabase) throw new Error("Configure o Supabase para autenticar os uploads.");
  const { data, error } = await supabaseMedia.auth.getSession();
  if (error) throw error;
  if (!data?.session?.access_token) throw new Error("Você está acessando sem uma sessão Supabase. Entre na sua conta do mestre para enviar e migrar arquivos.");
  return data.session;
}
export async function substituirImagens(value, onUpload = () => {}) {
  if (typeof value === "string") {
    if (/^data:image\/(png|jpeg|webp|avif|gif);base64,/i.test(value)) {
      const result = await externalizarImagens(value);
      if (result !== value) onUpload();
      return result;
    }
    if (sourceUrl && value.startsWith(sourceUrl + "/storage/v1/object/public/")) {
      let operation = migrated.get(value);
      if (!operation) {
        operation = (async () => {
          const response = await fetch(value);
          if (!response.ok) throw new Error("Não foi possível ler a imagem antiga: HTTP " + response.status);
          const type = (response.headers.get("Content-Type") || "").split(";")[0];
          if (!imageTypes.has(type)) return value;
          const file = await response.blob();
          const oldPath = new URL(value).pathname.split("/object/public/")[1];
          const storage = mediaStorage.from("mapas");
          const upload = await storage.upload("migracao/" + oldPath, file, { contentType: type });
          if (upload.error) throw upload.error;
          onUpload();
          return storage.getPublicUrl(upload.data.path).data.publicUrl;
        })();
        migrated.set(value, operation);
        operation.catch(() => migrated.delete(value));
      }
      return operation;
    }
    return value;
  }
  // Sequential uploads avoid saturating the player's connection and Worker memory.
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) next.push(await substituirImagens(item, onUpload));
    return next;
  }
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) next[key] = await substituirImagens(item, onUpload);
    const endpoint = (process.env.REACT_APP_MEDIA_URL || "").trim().replace(/\/$/, "");
    const tag = url => "r2:" + url.slice((endpoint + "/files/").length).split("/").map(decodeURIComponent).join("/");
    if (endpoint) {
      for (const [imageKey, pathKeys] of [["url", ["storage_path", "storagePath"]], ["image", ["imageStoragePath"]]]) {
        if (next[imageKey] !== value[imageKey] && typeof next[imageKey] === "string" && next[imageKey].startsWith(endpoint + "/files/")) {
          for (const pathKey of pathKeys) if (typeof value[pathKey] === "string" && value[pathKey] && !value[pathKey].startsWith("interactive:")) next[pathKey] = tag(next[imageKey]);
        }
      }
    }
    return next;
  }
  return value;
}
export function baixarBackupMidia(backup) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = "backup-imagens-" + Date.now() + ".json";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function migrarImagensExistentes(onProgress, backupWriter = baixarBackupMidia) {
  await verificarConfiguracaoMidia();
  const backup = { version: 1, createdAt: new Date().toISOString(), tables: {}, local: {} };
  const report = { updated: 0, images: 0, errors: [] };
  for (const table of tables) {
    onProgress("Lendo " + table + "…");
    const rows = [];
    for (let offset = 0; ; offset += 250) {
      const { data, error } = await supabase.from(table).select("*").order("id").range(offset, offset + 249);
      if (error) { report.errors.push(table + ": " + error.message); break; }
      rows.push(...data);
      if (data.length < 250) break;
    }
    backup.tables[table] = rows;
  }
  for (const key of Object.keys(localStorage)) {
    if (!/^(espiral:sheet:v1:|fichaRPG_personagem_|darkness_tabletop|darkness_mesa_demo|darkness_campanhas_demo)/.test(key)) continue;
    const value = localStorage.getItem(key);
    try { JSON.parse(value); backup.local[key] = value; } catch { /* Plain text is not an image record. */ }
  }
  // Download original data before changing any database or browser references.
  await backupWriter(backup);
  const countImage = () => { report.images += 1; };
  for (const [table, rows] of Object.entries(backup.tables)) {
    for (const row of rows) {
      onProgress("Migrando " + table + " · " + (report.updated + 1));
      try {
        const next = await substituirImagens(row, countImage);
        const patch = {};
        for (const key of Object.keys(row)) if (key !== "id" && JSON.stringify(row[key]) !== JSON.stringify(next[key])) patch[key] = next[key];
        if (!Object.keys(patch).length) continue;
        // Reject edits made after the backup rather than overwriting a live session.
        const current = await supabase.from(table).select("*").eq("id", row.id).single();
        if (current.error) throw current.error;
        if (Object.keys(patch).some(key => JSON.stringify(current.data[key]) !== JSON.stringify(row[key]))) throw new Error("O registro mudou durante a migração. Tente novamente depois de terminar as edições.");
        const saved = await supabase.from(table).update(patch).eq("id", row.id).select("id");
        if (saved.error) throw saved.error;
        if (!saved.data?.length) throw new Error("Sem permissão para atualizar este registro.");
        report.updated += 1;
      } catch (error) { report.errors.push(table + "/" + row.id + ": " + error.message); }
    }
  }
  for (const [key, value] of Object.entries(backup.local)) {
    try {
      const next = JSON.stringify(await substituirImagens(JSON.parse(value), countImage));
      if (next === value) continue;
      if (localStorage.getItem(key) !== value) throw new Error("A ficha foi editada durante a migração.");
      localStorage.setItem(key, next); report.updated += 1;
    } catch (error) { report.errors.push(key + ": " + error.message); }
  }
  return report;
}
