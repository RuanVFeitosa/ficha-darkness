const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
test('perfil persiste separado da lista de personagens e valida dados', async () => {
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'darkness-jogador-test-'));
  process.env.SUPABASE_URL = ''; process.env.SUPABASE_SERVICE_ROLE_KEY = '';
  const { handleRequest } = require('./server');
  const server = http.createServer(handleRequest);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const perfil = {fotoPerfil:'data:image/png;base64,AA==',perfilConfigurado:true,nome:'Jogador teste',pronome:'Ela',paletaPagina:{primaria:'#ffffff',secundaria:'#111111',texto:'#eeeeee',fundo:'#000000',borda:'#333333'},tema:'escuro',personagens:[{id:'1234',sistema:'darkness'}],builds:[{id:'b1',nome:'Combo',habilidades:['espiral:Ofensiva:Golpe Calculado'],notas:'Evoluir depois'}]};
  try {
    assert.equal((await (await fetch(`${base}/jogadores/1234`)).json()).jogador,null);
    const saved = await fetch(`${base}/jogadores/1234`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:perfil})});
    assert.equal(saved.status,200);
    const read = await (await fetch(`${base}/jogadores/1234`)).json();
    assert.equal(read.jogador.builds[0].nome,'Combo');
    assert.equal(read.jogador.pronome,'Ela');
    assert.equal(read.jogador.fotoPerfil,perfil.fotoPerfil);
    assert.equal(read.jogador.perfilConfigurado,true);
    assert.equal((await fetch(`${base}/jogadores/1234`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,fotoPerfil:'javascript:alert(1)'}})})).status,400);
    assert.deepEqual(read.jogador.paletaPagina,perfil.paletaPagina);
    assert.equal((await fetch(`${base}/jogadores/1234`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,paletaPagina:{...perfil.paletaPagina,texto:'invalido'}}})})).status,400);
    assert.deepEqual((await (await fetch(`${base}/personagens`)).json()).personagens,[]);
    assert.equal((await fetch(`${base}/personagens/__jogador_1234`)).status,404);
    assert.equal((await fetch(`${base}/jogadores/1234`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,personagens:[null]}})})).status,400);
    assert.equal((await (await fetch(`${base}/jogadores/1234`)).json()).jogador.nome,'Jogador teste');
    const dez=Array.from({length:10},(_,i)=>({id:String(1000+i),sistema:i%2?'espiral':'darkness'}));
    assert.equal((await fetch(base+'/jogadores/1234',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,personagens:dez}})})).status,200);
    assert.equal((await fetch(base+'/jogadores/1234',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({jogador:{...perfil,personagens:[...dez,{id:'extra',sistema:'espiral'}]}})})).status,400);
    assert.equal((await (await fetch(base+'/jogadores/1234')).json()).jogador.personagens.length,10);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
