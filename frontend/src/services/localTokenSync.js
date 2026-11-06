// Token movement must not rewrite the entire local campaign (including maps and
// large images) in localStorage. IndexedDB also avoids its small string quota.
const DB='darkness-tabletop-token-state';
const STORE='tokens';
const PREFIX='darkness_token_sync:';
const EVENT='darkness:token-sync';
let database;
let channel;

const open = () => {
  if(!database) database=new Promise((resolve,reject) => {
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }).catch(error=>{database=null;throw error;});
  return database;
};
const bus = () => {
  if(!channel && typeof BroadcastChannel!=='undefined') channel=new BroadcastChannel(DB);
  return channel;
};
const keyFor = (campaignId,tokenId) => `${campaignId}:${tokenId}`;
const readFallback = key => JSON.parse(localStorage.getItem(PREFIX+key) || '{}');

export async function readLocalTokenStates(campaignId,tokens) {
  if(typeof indexedDB==='undefined') return tokens.map(token=>({...token,posicoes:{...token.posicoes,...readFallback(keyFor(campaignId,token.id))}}));
  const db=await open();
  return Promise.all(tokens.map(token=>new Promise((resolve,reject)=>{
    const request=db.transaction(STORE,'readonly').objectStore(STORE).get(keyFor(campaignId,token.id));
    request.onsuccess=()=>resolve({...token,posicoes:{...token.posicoes,...request.result}});
    request.onerror=()=>reject(request.error);
  })));
}

export async function writeLocalTokenState(campaignId,token,mapKey,patch) {
  const key=keyFor(campaignId,token.id);
  let posicoes;
  if(typeof indexedDB==='undefined') {
    const current=readFallback(key);
    posicoes={...current,[mapKey]:{...token.posicoes?.[mapKey],...current[mapKey],...patch}};
    localStorage.setItem(PREFIX+key,JSON.stringify(posicoes));
  } else {
    const db=await open();
    await new Promise((resolve,reject)=>{
      // Read/merge/write in one transaction prevents two tabs losing patches.
      const transaction=db.transaction(STORE,'readwrite');
      const store=transaction.objectStore(STORE);
      const request=store.get(key);
      request.onsuccess=()=>{
        const current=request.result || {};
        posicoes={...current,[mapKey]:{...token.posicoes?.[mapKey],...current[mapKey],...patch}};
        store.put(posicoes,key);
      };
      transaction.oncomplete=resolve;
      transaction.onabort=()=>reject(transaction.error || new Error('Não foi possível salvar o token local.'));
      transaction.onerror=()=>reject(transaction.error);
    });
  }
  const updated={...token,posicoes:{...token.posicoes,...posicoes}};
  const message={campaignId,token:{id:token.id,ficha_id:token.ficha_id},mapKey,patch};
  window.dispatchEvent(new CustomEvent(EVENT,{detail:message}));
  bus()?.postMessage(message);
  // Older browsers can use storage notifications. A full localStorage must not
  // turn a successful IndexedDB write into a synchronization failure.
  if(typeof indexedDB!=='undefined' && !bus()) {
    try {localStorage.setItem(PREFIX+'revision',JSON.stringify({campaignId,revision:Date.now()+Math.random()}));} catch {}
  }
  return updated;
}

export function listenLocalTokens(campaignId,onChange) {
  const receive=message=>{
    if(message?.campaignId===campaignId && message.token?.ficha_id?.startsWith('map3d:')) {
      onChange({table:'mapas3d_portas',mapId:message.token.ficha_id.slice(6),doorStates:message.patch});
      return;
    }
    if(message?.campaignId===campaignId) onChange({table:'tokens_mapa',eventType:'UPDATE',partial:true,new:{...message.token,posicoes:{[message.mapKey]:message.patch}}});
  };
  const local=event=>receive(event.detail);
  const remote=event=>receive(event.data);
  window.addEventListener(EVENT,local);
  const broadcast=bus();
  broadcast?.addEventListener('message',remote);
  return ()=>{window.removeEventListener(EVENT,local);broadcast?.removeEventListener('message',remote);};
}
