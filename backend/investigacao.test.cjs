const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createInvestigation}=require('./investigacao');
const profiles={'1234':{nome:'Ana',personagens:[{id:'ana',sistema:'darkness'}]},'5678':{nome:'Bia',personagens:[{id:'bia',sistema:'espiral'}]},'9999':{nome:'Fora',personagens:[]}};
async function fixture(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'darkness-investigacao-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return {dir,api:createInvestigation({dataDir:dir,readProfile:async code=>profiles[code],masterPassword:'mestre-teste'})};}

test('mural pessoal é privado, persiste e não aparece na lista de personagens',async t=>{
 const {api,dir}=await fixture(t);
 const auth={playerCode:'1234'};
 const saved=await api('pessoal','1234',{...auth,version:0,action:'saveCard',card:{title:'Suspeito',kind:'pessoa',description:'Testemunha',hidden:true}});
 assert.equal(saved.cards[0].hidden,false);assert.equal(saved.cards[0].canEdit,true);
 assert.equal((await api('pessoal','1234',{...auth,action:'load'})).cards[0].title,'Suspeito');
 await assert.rejects(()=>api('pessoal','1234',{playerCode:'5678',action:'load'}),e=>e.status===403);
 assert.deepEqual((await fs.readdir(dir)),['investigacao']);
});

test('oculta pistas e suas conexões no servidor, revela e valida vínculo e autoria',async t=>{
 const {api}=await fixture(t),master={masterPassword:'mestre-teste'};
 let b=await api('campanha','c1',{...master,action:'load',members:['ana','espiral:bia']});
 b=await api('campanha','c1',{...master,version:b.version,action:'saveCard',card:{title:'Pista pública'}});const publicId=b.cards[0].id;
 b=await api('campanha','c1',{...master,version:b.version,action:'saveCard',card:{title:'Assassino secreto',hidden:true}});const hiddenId=b.cards[1].id;
 b=await api('campanha','c1',{...master,version:b.version,action:'saveLink',from:publicId,to:hiddenId,label:'culpado'});
 const player=await api('campanha','c1',{playerCode:'1234',action:'load'});
 assert.equal(player.cards.length,1);assert.equal(player.links.length,0);assert.equal(JSON.stringify(player).includes('Assassino'),false);
 await assert.rejects(()=>api('campanha','c1',{playerCode:'9999',action:'load'}),e=>e.status===403);
 await assert.rejects(()=>api('campanha','c1',{playerCode:'1234',version:b.version,action:'saveCard',card:{id:publicId,title:'Apagar segredo'}}),e=>e.status===403);
 await assert.rejects(()=>api('campanha','c1',{playerCode:'1234',version:b.version,action:'reveal',id:hiddenId,hidden:false}),e=>e.status===403);
 b=await api('campanha','c1',{...master,version:b.version,action:'reveal',id:hiddenId,hidden:false});
 const revealed=await api('campanha','c1',{playerCode:'5678',action:'load'});assert.equal(revealed.cards.length,2);assert.equal(revealed.links[0].label,'culpado');
 b=await api('campanha','c1',{playerCode:'1234',version:b.version,action:'saveCard',card:{title:'Teoria de Ana'}});const ownId=b.cards[2].id;
 await assert.rejects(()=>api('campanha','c1',{playerCode:'5678',version:b.version,action:'deleteCard',id:ownId}),e=>e.status===403);
 b=await api('campanha','c1',{playerCode:'1234',version:b.version,action:'deleteCard',id:ownId});assert.equal(b.cards.length,2);
});

test('evita sobrescrita concorrente e recusa imagens e posições inválidas',async t=>{
 const {api}=await fixture(t);const base={playerCode:'1234',version:0,action:'saveCard'};
 const result=await Promise.allSettled([api('pessoal','1234',{...base,card:{title:'A'}}),api('pessoal','1234',{...base,card:{title:'B'}})]);
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.find(r=>r.status==='rejected').reason.status,409);
 const board=await api('pessoal','1234',{playerCode:'1234',action:'load'});
 await assert.rejects(()=>api('pessoal','1234',{...base,version:board.version,card:{title:'X',image:'javascript:alert(1)'}}),/Imagem inválida/);
 const moved=await api('pessoal','1234',{playerCode:'1234',version:board.version,action:'moveCard',id:board.cards[0].id,x:10000,y:-200});assert.equal(moved.cards[0].x,2200);assert.equal(moved.cards[0].y,0);
});

test('API HTTP salva e consulta mural com autenticação de perfil',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'darkness-investigacao-http-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 process.env.DATA_DIR=dir;process.env.SUPABASE_URL='';process.env.SUPABASE_SERVICE_ROLE_KEY='';
 const http=require('node:http'),{handleRequest}=require('./server');const server=http.createServer(handleRequest);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 await fs.writeFile(path.join(dir,'__jogador_1234.json'),JSON.stringify(profiles['1234']));
 const request=payload=>fetch(base+'/investigacao/pessoal/1234',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal((await request({action:'load'})).status,403);
 const response=await request({playerCode:'1234',version:0,action:'saveCard',card:{title:'Evidência HTTP'}});assert.equal(response.status,200);assert.equal((await response.json()).board.cards[0].title,'Evidência HTTP');
 assert.deepEqual((await (await fetch(base+'/personagens')).json()).personagens,[]);
});

test('persistência remota valida membro e usa revisão condicional sem revelar segredos',async()=>{
 let row=null;const calls=[];
 const remote=async(resource,options={})=>{
  calls.push({resource,method:options.method||'GET'});
  if(resource.startsWith('membros_campanha'))return [{ficha_id:'ana'}];
  if(!options.method)return row?[{conteudo:structuredClone(row.conteudo)}]:[];
  const incoming=JSON.parse(options.body);
  if(options.method==='POST'){if(row)return [];row=incoming;return [row];}
  const expected=Number(resource.match(/revisao=eq\.(\d+)/)[1]);
  if(row.revisao!==expected)return [];row=incoming;return [row];
 };
 const api=createInvestigation({remote,readProfile:async code=>profiles[code],masterPassword:'mestre-teste'});
 let board=await api('campanha','c1',{masterPassword:'mestre-teste',action:'load'});
 board=await api('campanha','c1',{masterPassword:'mestre-teste',action:'saveCard',version:board.version,card:{title:'Segredo remoto',hidden:true}});
 assert.equal((await api('campanha','c1',{playerCode:'1234',action:'load'})).cards.length,0);
 await api('campanha','c1',{masterPassword:'mestre-teste',action:'reveal',version:board.version,id:board.cards[0].id,hidden:false});
 assert.equal((await api('campanha','c1',{playerCode:'1234',action:'load'})).cards[0].title,'Segredo remoto');
 assert(calls.some(c=>c.method==='PATCH' && c.resource.endsWith('revisao=eq.1')));
});

