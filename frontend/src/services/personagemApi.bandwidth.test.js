import { buscarPersonagem, salvarPersonagem } from './personagemApi';
jest.mock('./supabase', () => ({ supabaseConfigurado:false, supabase:null }));

test('revalida pelo ETag e reutiliza o corpo em 304, recebendo alterações no próximo 200', async () => {
  const response = (nome, etag) => ({ ok:true, status:200, headers:{get:key => key.toLowerCase()==='etag' ? etag : 'application/json'}, json:async () => ({personagem:{nome}}) });
  global.fetch = jest.fn().mockResolvedValueOnce(response('Antes','"v1"'))
    .mockResolvedValueOnce({status:304, headers:{get:() => ''}})
    .mockResolvedValueOnce(response('Depois','"v2"'));
  const first = await buscarPersonagem('bandwidth-test');
  first.nome = 'Mutação local';
  expect((await buscarPersonagem('bandwidth-test')).nome).toBe('Antes');
  expect(fetch.mock.calls[1][1].headers['If-None-Match']).toBe('"v1"');
  expect((await buscarPersonagem('bandwidth-test')).nome).toBe('Depois');
});

test('consultas simultâneas compartilham um download com cópias independentes', async () => {
  global.fetch = jest.fn().mockResolvedValue({ok:true, status:200,
    headers:{get:() => 'application/json'}, json:async () => ({personagem:{nome:'Compartilhado'}})});
  const [first, second] = await Promise.all([buscarPersonagem('parallel'), buscarPersonagem('parallel')]);
  expect(fetch).toHaveBeenCalledTimes(1);
  first.nome = 'Local';
  expect(second.nome).toBe('Compartilhado');
});

test('uma gravação invalida o ETag anterior para não restaurar dados antigos', async () => {
  const response = nome => ({ok:true, status:200,
    headers:{get:key => key === 'etag' ? '"old"' : 'application/json'},
    json:async () => ({personagem:{nome}})});
  global.fetch = jest.fn().mockResolvedValueOnce(response('Antes'))
    .mockResolvedValueOnce(response('Depois')).mockResolvedValueOnce(response('Depois'));
  await buscarPersonagem('mutation');
  await salvarPersonagem('mutation', {nome:'Depois'});
  await buscarPersonagem('mutation');
  expect(fetch.mock.calls[2][1].headers['If-None-Match']).toBeUndefined();
});

test('falhas não ficam presas no agrupamento de consultas', async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    ok:true, status:200, headers:{get:() => 'application/json'}, json:async () => ({personagem:{nome:'Recuperado'}}),
  });
  await expect(buscarPersonagem('retry')).rejects.toThrow('offline');
  expect((await buscarPersonagem('retry')).nome).toBe('Recuperado');
  expect(fetch).toHaveBeenCalledTimes(2);
});
