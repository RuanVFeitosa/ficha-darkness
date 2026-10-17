const buckets = new Set(["mapas", "evidencias", "documentos-campanha"]);
const types = /^(image\/(png|jpeg|webp|avif|gif)|audio\/[a-z0-9.+-]+|video\/(mp4|webm)|application\/(pdf|octet-stream|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)|model\/gltf-binary)$/i;
const limit = 100 * 1024 * 1024;
const validKey = key => key.length < 1024 && key.split("/").every(part => part && part !== "." && part !== ".." && !/[\\\x00-\x1f]/.test(part));
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(item => item.trim());
    const cors = { "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null", "Access-Control-Allow-Methods": "GET,HEAD,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Authorization,Content-Type", Vary: "Origin" };
    const json = (payload, status = 200) => Response.json(payload, { status, headers: cors });
    if (origin && !allowed.includes(origin)) return json({ error: "Origem não autorizada." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(request.url);
      if (["GET", "HEAD"].includes(request.method) && url.pathname.startsWith("/files/")) {
        const key = decodeURIComponent(url.pathname.slice(7));
        if (!validKey(key)) return json({ error: "Arquivo inválido." }, 400);
        const object = request.method === "HEAD" ? await env.MEDIA.head(key) : await env.MEDIA.get(key);
        if (!object) return json({ error: "Arquivo não encontrado." }, 404);
        const headers = new Headers(cors);
        object.writeHttpMetadata(headers);
        headers.set("ETag", object.httpEtag);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("X-Content-Type-Options", "nosniff");
        return new Response(request.method === "HEAD" ? null : object.body, { headers });
      }
      if (!((request.method === "PUT" && url.pathname.startsWith("/upload/")) || (request.method === "DELETE" && url.pathname === "/files"))) return json({ error: "Rota não encontrada." }, 404);
      const authorization = request.headers.get("Authorization");
      if (!authorization?.startsWith("Bearer ") || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: "Entre na sua conta para enviar arquivos." }, 401);
      const auth = await fetch(env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user", { headers: { Authorization: authorization, apikey: env.SUPABASE_ANON_KEY } });
      if (!auth.ok) return json({ error: "Sessão expirada. Entre novamente." }, 401);
      const user = await auth.json();
      if (!user.id) return json({ error: "Sessão inválida." }, 401);
      if (request.method === "DELETE") {
        const payload = await request.json();
        if (!Array.isArray(payload.paths) || payload.paths.length > 100 || payload.paths.some(key => typeof key !== "string" || !validKey(key) || !key.startsWith(user.id + "/"))) return json({ error: "Você só pode remover os arquivos da sua conta." }, 403);
        await env.MEDIA.delete(payload.paths);
        return json({ ok: true });
      }
      const parts = url.pathname.slice(8).split("/").map(decodeURIComponent);
      const bucket = parts.shift();
      const path = parts.join("/");
      if (!buckets.has(bucket) || !validKey(path)) return json({ error: "Destino inválido." }, 400);
      const contentType = (request.headers.get("Content-Type") || "").split(";")[0];
      if (!types.test(contentType)) return json({ error: "Formato não permitido." }, 415);
      if (Number(request.headers.get("Content-Length")) > limit) return json({ error: "O arquivo excede 100 MB." }, 413);
      const body = await request.arrayBuffer();
      if (!body.byteLength || body.byteLength > limit) return json({ error: "Arquivo vazio ou maior que 100 MB." }, 413);
      // Content-addressed keys keep cached URLs immutable and deduplicate repeat uploads.
      const digest = await crypto.subtle.digest("SHA-256", body);
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const key = user.id + "/" + bucket + "/" + hash + "/" + path;
      await env.MEDIA.put(key, body, { httpMetadata: { contentType } });
      return json({ path: "r2:" + key, url: url.origin + "/files/" + key.split("/").map(encodeURIComponent).join("/") });
    } catch (error) {
      console.error("media request failed", error.message);
      return json({ error: "Não foi possível processar o arquivo." }, 500);
    }
  },
};
