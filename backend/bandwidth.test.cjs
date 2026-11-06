const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');

test('JSON comprimido, revalidação sem corpo e CORS preservam a ficha atual', async () => {
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'darkness-bandwidth-'));
  process.env.SUPABASE_URL = '';
  process.env.SUPABASE_SERVICE_ROLE_KEY = '';
  await fs.writeFile(path.join(process.env.DATA_DIR, 'teste.json'), JSON.stringify({ nome:'Teste', historia:'Uma história longa. '.repeat(3000) }));
  const server = http.createServer(require('./server').handleRequest);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const request = headers => new Promise((resolve,reject) => {
    http.get({ hostname:'127.0.0.1', port:server.address().port, path:'/api/personagens/teste', headers }, response => {
      const chunks=[];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({status:response.statusCode, headers:response.headers, body:Buffer.concat(chunks)}));
    }).on('error',reject);
  });
  try {
    const plain = await request({ 'Accept-Encoding':'identity' });
    const zipped = await request({ 'Accept-Encoding':'gzip' });
    assert.equal(zipped.headers['content-encoding'], 'gzip');
    assert.deepEqual(gunzipSync(zipped.body), plain.body);
    assert(zipped.body.length < plain.body.length / 5);
    assert(zipped.headers.vary.includes('Origin'));
    assert(zipped.headers.vary.includes('Accept-Encoding'));
    assert.equal(zipped.headers['access-control-expose-headers'], 'ETag');
    assert(zipped.headers['access-control-allow-headers'].includes('If-None-Match'));
    const unchanged = await request({ 'If-None-Match':zipped.headers.etag });
    assert.equal(unchanged.status,304);
    assert.equal(unchanged.body.length,0);
    const weak = await request({ 'If-None-Match':`"other", W/${zipped.headers.etag}` });
    assert.equal(weak.status,304);
    const refused = await request({ 'Accept-Encoding':'gzip;q=0' });
    assert.equal(refused.headers['content-encoding'], undefined);
    const base=`http://127.0.0.1:${server.address().port}`;
    const destinos = await fetch(base+'/api/destinos');
    assert.equal(destinos.status,200);
    assert(destinos.headers.get('etag'));
    assert.equal(destinos.headers.get('cache-control'),'private, no-cache');
    const destinosUnchanged = await fetch(base+'/api/destinos', {headers:{'If-None-Match':destinos.headers.get('etag')}});
    assert.equal(destinosUnchanged.status,304);
    assert.equal(await destinosUnchanged.text(),'');
    await fetch(base+'/api/personagens/teste',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:'Alterado'})});
    const changed = await request({ 'If-None-Match':zipped.headers.etag });
    assert.equal(changed.status,200);
    assert.equal(JSON.parse(changed.body).personagem.nome,'Alterado');
    console.log(`Tráfego do cenário de teste: ${plain.body.length} bytes → ${zipped.body.length} bytes; ficha sem alteração → 0 bytes de corpo.`);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
