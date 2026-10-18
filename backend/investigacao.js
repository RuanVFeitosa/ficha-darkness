const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash, randomUUID, timingSafeEqual} = require('node:crypto');
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const text = (value, max) => String(value ?? '').trim().slice(0, max);
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a,b) => { const x=Buffer.from(String(a || '')),y=Buffer.from(String(b || ''));return x.length===y.length && timingSafeEqual(x,y); };
const types = ['pessoa','lugar','pista','acontecimento'];
const blank = () => ({version:0,cards:[],links:[],members:[]});
const image = value => {
 const url=text(value,450000);
 if(url && !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url) && !/^https?:\/\//i.test(url))fail('Imagem inválida.');
 return url;
};
const publicBoard = (board, master, actor) => {
 const cards=board.cards.filter(c=>master || !c.hidden),ids=new Set(cards.map(c=>c.id));
 return {version:board.version,cards:cards.map(c=>({...c,canEdit:master || c.author===actor})),links:board.links.filter(l=>ids.has(l.from)&&ids.has(l.to)).map(l=>({...l,canEdit:master || l.author===actor}))};
};
function createInvestigation({dataDir, readProfile, remote, masterPassword}) {
 const locks=new Map();
 const load=async id=>{
  if(remote) {const rows=await remote(`murais_investigacao?id=eq.${id}&select=conteudo`);return rows[0]?.conteudo || blank();}
  try{return JSON.parse(await fs.readFile(path.join(dataDir,'investigacao',id+'.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return blank();throw e;}
 };
 const save=async(id,board)=>{
  if(remote){
   const first=board.version===1;
   const rows=await remote(first?'murais_investigacao?on_conflict=id':`murais_investigacao?id=eq.${id}&revisao=eq.${board.version-1}`,{method:first?'POST':'PATCH',headers:{Prefer:first?'resolution=ignore-duplicates,return=representation':'return=representation'},body:JSON.stringify({id,conteudo:board,revisao:board.version,atualizado_em:new Date().toISOString()})});
   if(!rows?.length)fail('O mural mudou. Atualize antes de salvar novamente.',409);
   return;
  }
  const dir=path.join(dataDir,'investigacao');await fs.mkdir(dir,{recursive:true});const target=path.join(dir,id+'.json'),tmp=target+'.tmp';await fs.writeFile(tmp,JSON.stringify(board));await fs.rename(tmp,target);
 };
 return async(scope,key,body)=>{
  if(!['pessoal','campanha'].includes(scope) || !/^[a-zA-Z0-9_-]{1,100}$/.test(key))fail('Mural inválido.');
  const master=scope==='campanha' && equal(body.masterPassword,masterPassword);
  const code=String(body.playerCode || '');let profile=null;
  if(!master){if(!/^\d{4,8}$/.test(code))fail('Entre no perfil do jogador para acessar o mural.',403);profile=await readProfile(code);if(!profile)fail('Perfil não encontrado.',403);}
  if(scope==='pessoal' && code!==key)fail('Mural pessoal indisponível.',403);
  const id=hash(scope+':'+key),previous=locks.get(id)||Promise.resolve();
  let release;const lock=new Promise(r=>{release=r;});const queued=previous.catch(()=>{}).then(()=>lock);locks.set(id,queued);await previous.catch(()=>{});
  try {
   const board=await load(id);
   if(scope==='campanha' && !master){
    const ids=(profile.personagens||[]).map(p=>p.sistema==='espiral'?'espiral:'+p.id:p.id);
    const members=remote ? await remote(`membros_campanha?campanha_id=eq.${encodeURIComponent(key)}&select=ficha_id`) : board.members;
    if(!members.some(m=>ids.includes(typeof m==='string'?m:String(m.ficha_id))))fail('Seu personagem não está vinculado a este mural. Peça ao mestre para abrir o mural da campanha.',403);
   }
   const actor=master?'mestre':hash(code);
   if(body.action==='load'){
    if(master && !remote && Array.isArray(body.members)){board.members=body.members.filter(v=>typeof v==='string').slice(0,200);await save(id,board);}
    return publicBoard(board,master,actor);
   }
   if(!Number.isInteger(body.version) || body.version!==board.version)fail('O mural mudou. Atualize antes de salvar novamente.',409);
   const getCard=cardId=>{const c=board.cards.find(c=>c.id===cardId && (master || !c.hidden));if(!c)fail('Cartão não encontrado.',404);return c;};
   if(body.action==='saveCard'){
    const input=body.card||{};const existing=input.id?getCard(input.id):null;
    if(existing && !master && existing.author!==actor)fail('Você só pode editar seus próprios cartões.',403);
    if(!existing && board.cards.length>=150)fail('O mural permite até 150 cartões.');
    const title=text(input.title,100);if(!title)fail('Dê um título ao cartão.');
    const card={id:existing?.id || randomUUID(),title,kind:types.includes(input.kind)?input.kind:'pista',description:text(input.description,5000),image:image(input.image),x:existing?.x ?? 40+(board.cards.length%5)*260,y:existing?.y ?? Math.min(1600,40+Math.floor(board.cards.length/5)*230),hidden:master?Boolean(input.hidden):false,author:existing?.author || actor,authorName:existing?.authorName || (master?'Mestre':text(profile.nome,80))};
    board.cards=existing?board.cards.map(c=>c.id===card.id?card:c):[...board.cards,card];
   } else if(body.action==='moveCard'){
    const card=getCard(body.id);if(!Number.isFinite(body.x)||!Number.isFinite(body.y))fail('Posição inválida.');card.x=Math.max(0,Math.min(2200,Math.round(body.x)));card.y=Math.max(0,Math.min(1600,Math.round(body.y)));
   } else if(body.action==='deleteCard'){
    const card=getCard(body.id);if(!master && card.author!==actor)fail('Você só pode excluir seus próprios cartões.',403);
    board.cards=board.cards.filter(c=>c.id!==card.id);board.links=board.links.filter(l=>l.from!==card.id&&l.to!==card.id);
   } else if(body.action==='reveal'){
    if(!master)fail('Somente o mestre pode revelar pistas.',403);getCard(body.id).hidden=Boolean(body.hidden);
   } else if(body.action==='saveLink'){
    const from=getCard(body.from),to=getCard(body.to);if(from.id===to.id)fail('Escolha dois cartões diferentes.');
    const label=text(body.label,100);if(!label)fail('Descreva a conexão.');if(board.links.length>=300)fail('Limite de 300 conexões atingido.');
    board.links.push({id:randomUUID(),from:from.id,to:to.id,label,author:actor});
   } else if(body.action==='deleteLink'){
    const link=publicBoard(board,master,actor).links.find(l=>l.id===body.id);if(!link)fail('Conexão não encontrada.',404);if(!master&&link.author!==actor)fail('Você só pode remover suas próprias conexões.',403);board.links=board.links.filter(l=>l.id!==link.id);
   } else fail('Ação inválida.');
   board.version++;await save(id,board);return publicBoard(board,master,actor);
  }finally{release();if(locks.get(id)===queued)locks.delete(id);}
 };
}
module.exports={createInvestigation,publicBoard};
