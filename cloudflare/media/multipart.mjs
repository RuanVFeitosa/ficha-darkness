export const PART_SIZE = 8 * 1024 * 1024;
export const MODEL_LIMIT = 512 * 1024 * 1024;
async function readLimited(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new Error('Parte maior que o limite.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export async function multipart(request, env, user, json) {
  const url = new URL(request.url);
  if (url.pathname === '/multipart/create' && request.method === 'POST') {
    const body = JSON.parse(new TextDecoder().decode(await readLimited(request, 4096)));
    if (!Number.isSafeInteger(body.size) || body.size <= 0 || body.size > MODEL_LIMIT || typeof body.path !== 'string' || !/^modelos3d\/[a-zA-Z0-9._/-]+$/.test(body.path) || body.path.split('/').some(p => !p || p === '.' || p === '..') || body.path.length > 512) return json({ error: 'Modelo inválido ou maior que 512 MB.' }, 400);
    const id = crypto.randomUUID();
    const key = `${user.id}/mapas/${id}/${body.path}`;
    const contentType = /\.glb$/i.test(body.path) ? 'model/gltf-binary' : 'application/octet-stream';
    const upload = await env.MEDIA.createMultipartUpload(key, { httpMetadata: { contentType } });
    const session = { key, uploadId: upload.uploadId, size: body.size, parts: [], bytes: 0, created: Date.now() };
    try { await env.MEDIA.put(`_multipart/${user.id}/${id}`, JSON.stringify(session)); }
    catch (error) { await upload.abort(); throw error; }
    return json({ id, partSize: PART_SIZE });
  }
  const match = url.pathname.match(/^\/multipart\/([a-f0-9-]{36})\/(part|complete|abort)$/);
  if (!match) return json({ error: 'Rota multipart inválida.' }, 404);
  const [, id, action] = match;
  const sessionKey = `_multipart/${user.id}/${id}`;
  const object = await env.MEDIA.get(sessionKey);
  if (!object) return json({ error: 'Envio não encontrado para esta conta.' }, 404);
  const session = await object.json();
  const upload = env.MEDIA.resumeMultipartUpload(session.key, session.uploadId);
  if (action === 'abort' && request.method === 'DELETE') {
    await upload.abort(); await env.MEDIA.delete(sessionKey); return json({ ok: true });
  }
  if (Date.now() - session.created > 86400000) return json({ error: 'Envio expirado. Inicie novamente.' }, 410);
  if (action === 'part' && request.method === 'PUT') {
    const number = Number(url.searchParams.get('number'));
    if (number !== session.parts.length + 1 || session.bytes >= session.size) return json({ error: 'Sequência de partes inválida.' }, 409);
    const expected = Math.min(PART_SIZE, session.size - session.bytes);
    const body = await readLimited(request, expected);
    if (body.byteLength !== expected) return json({ error: 'Tamanho da parte inválido.' }, 400);
    const part = await upload.uploadPart(number, body);
    session.parts.push(part); session.bytes += body.byteLength;
    await env.MEDIA.put(sessionKey, JSON.stringify(session));
    return json({ uploaded: session.bytes });
  }
  if (action === 'complete' && request.method === 'POST') {
    if (session.bytes !== session.size) return json({ error: 'Envio incompleto.' }, 409);
    await upload.complete(session.parts);
    await env.MEDIA.delete(sessionKey);
    return json({ path: `r2:${session.key}`, url: url.origin + '/files/' + session.key.split('/').map(encodeURIComponent).join('/') });
  }
  return json({ error: 'Método inválido.' }, 405);
}
