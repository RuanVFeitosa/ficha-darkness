let records,channels,api;
const microtask=callback=>Promise.resolve().then(callback);

beforeEach(()=>{
  jest.resetModules();localStorage.clear();records=new Map();channels=[];
  global.indexedDB={open:()=>{
    const request={result:{transaction:()=>{
      const transaction={objectStore:()=>({
        get:key=>{const read={};microtask(()=>{read.result=records.get(key);read.onsuccess();});return read;},
        put:(value,key)=>{records.set(key,JSON.parse(JSON.stringify(value)));microtask(()=>transaction.oncomplete());},
      })};
      return transaction;
    }}};
    microtask(()=>request.onsuccess());return request;
  }};
  global.BroadcastChannel=class extends EventTarget {
    constructor(){super();channels.push(this);}
    postMessage(data){channels.filter(peer=>peer!==this).forEach(peer=>peer.dispatchEvent(new MessageEvent('message',{data})));}
  };
  api=require('./localTokenSync');
});
afterEach(()=>{delete global.indexedDB;delete global.BroadcastChannel;jest.restoreAllMocks();});

test('salva e comunica movimentos mesmo com a cota do localStorage esgotada',async()=>{
  jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Quota exceeded','QuotaExceededError');});
  const receive=jest.fn(),stop=api.listenLocalTokens('c1',receive);
  const token={id:'t1',posicoes:{mapa2d:{x:20,y:30}}};
  await api.writeLocalTokenState('c1',token,'__estado:tabletop3d:map',{x:2,z:3,elevation:4,scale:0.8});
  const [saved]=await api.readLocalTokenStates('c1',[token]);
  expect(saved.posicoes['__estado:tabletop3d:map']).toMatchObject({x:2,z:3,elevation:4,scale:0.8});
  expect(saved.posicoes.mapa2d).toEqual({x:20,y:30});
  expect(receive).toHaveBeenCalledWith(expect.objectContaining({table:'tokens_mapa',partial:true,new:expect.objectContaining({id:'t1',posicoes:{'__estado:tabletop3d:map':{x:2,z:3,elevation:4,scale:0.8}}})}));
  stop();
});

test('outra aba recebe a posição imediatamente e a leitura preserva atualizações 2D',async()=>{
  let peer;jest.isolateModules(()=>{peer=require('./localTokenSync');});
  const receive=jest.fn(),stop=peer.listenLocalTokens('c1',receive);
  const token={id:'t1',posicoes:{mapa2d:{x:1,y:1}}};
  await api.writeLocalTokenState('c1',token,'__estado:tabletop3d:map',{x:5,z:6});
  expect(receive.mock.calls.some(([event])=>event.new.posicoes['__estado:tabletop3d:map'].x===5)).toBe(true);
  const [saved]=await peer.readLocalTokenStates('c1',[{...token,posicoes:{mapa2d:{x:90,y:90}}}]);
  expect(saved.posicoes.mapa2d).toEqual({x:90,y:90});
  expect((await peer.readLocalTokenStates('other',[token]))[0].posicoes['__estado:tabletop3d:map']).toBeUndefined();
  stop();
});

test('mescla ajustes e movimentos sem copiar novamente a campanha inteira',async()=>{
  const token={id:'t1'};
  await api.writeLocalTokenState('c1',token,'map',{image:'body.png',scale:0.8});
  await api.writeLocalTokenState('c1',token,'map',{x:5,z:6});
  const [saved]=await api.readLocalTokenStates('c1',[token]);
  expect(saved.posicoes.map).toEqual({image:'body.png',scale:0.8,x:5,z:6});
  expect(localStorage.getItem('darkness_mesa_demo')).toBeNull();
});
