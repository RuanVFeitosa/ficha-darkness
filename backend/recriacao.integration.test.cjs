const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
test('recriação aguarda mestre, protege a ficha atual e aplica somente alterações aprovadas',async()=>{
 process.env.DATA_DIR=await fs.mkdtemp(path.join(os.tmpdir(),'darkness-recriacao-'));
 process.env.SUPABASE_URL='';process.env.SUPABASE_SERVICE_ROLE_KEY='';process.env.MESTRE_PASSWORD='teste-mestre';
 const {handleRequest}=require('./server');const server=http.createServer(handleRequest);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/personagens`;
 const post=async(url,body,method='POST')=>{const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,...await response.json()};};
 try{
  for(const system of ['darkness','espiral']){
   const id=system==='espiral'?'espiral_1234':'1234';
   const original=system==='espiral'?{version:1,nome:'Lia',name:'Lia',attributes:{pulso:2,razao:2,sentido:2,voz:2},resources:{Armas:2},integrity:30,evolution:{points:7},inventoryItems:[{name:'Faca'}]}:{nome:'Lia',versaoRegras:'1.0',atributos:{forca:2,fonitude:2,inteligencia:2,vontade:2,reflexos:2},dominios:{razao:2},inventario:[{nome:'Faca'}],pontosEvolucao:{disponiveis:7}};
   await post('/'+id,original,'PUT');
   const proposal={...original,[system==='espiral'?'name':'nome']:'Lia revisada',inventario:[],evolution:{points:0}};
   const pending=await post('/'+id+'/recriacao',{base:original,proposta:proposal});
   assert.equal(pending.status,200);assert.equal(pending.personagem.nome,'Lia');
   const request=pending.personagem.recriacaoPendente;
   assert.deepEqual(Object.keys(request.alteracoes),[system==='espiral'?'name':'nome']);
   assert.equal((await post('/'+id+'/recriacao',{base:original,proposta:proposal})).status,409);
   const autosave=await post('/'+id,original,'PUT');assert.equal(autosave.personagem.recriacaoPendente.id,request.id);
   assert.equal((await post('/'+id+'/recriacao',{acao:'aprovar',solicitacaoId:request.id})).status,403);
   const approved=await post('/'+id+'/recriacao',{acao:'aprovar',solicitacaoId:request.id,senhaMestre:'teste-mestre'});
   assert.equal(approved.status,200);assert.equal(approved.personagem.nome,'Lia revisada');assert.equal(approved.personagem.recriacaoPendente,null);
   assert.equal(approved.personagem.revisaoRecriacao,1);
   assert.deepEqual(approved.personagem[system==='espiral'?'evolution':'pontosEvolucao'],original[system==='espiral'?'evolution':'pontosEvolucao']);
   assert.equal((await post('/'+id,original,'PUT')).personagem.nome,'Lia revisada');
   assert.equal((await post('/'+id+'/recriacao',{acao:'aprovar',solicitacaoId:request.id,senhaMestre:'teste-mestre'})).status,409);
   const next=approved.personagem;
   const second=await post('/'+id+'/recriacao',{base:next,proposta:{...next,[system==='espiral'?'name':'nome']:'Recusar'}});
   const refused=await post('/'+id+'/recriacao',{acao:'recusar',solicitacaoId:second.personagem.recriacaoPendente.id,senhaMestre:'teste-mestre'});
   assert.equal(refused.personagem.nome,'Lia revisada');assert.equal(refused.personagem.historicoRecriacao.at(-1).decisao,'recusar');
   const third=await post('/'+id+'/recriacao',{base:refused.personagem,proposta:{...refused.personagem,[system==='espiral'?'name':'nome']:'Terceira proposta'}});
   await post('/'+id,{...refused.personagem,[system==='espiral'?'name':'nome']:'Mudou durante a sessão'},'PUT');
   assert.equal((await post('/'+id+'/recriacao',{acao:'aprovar',solicitacaoId:third.personagem.recriacaoPendente.id,senhaMestre:'teste-mestre'})).status,409);
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});
