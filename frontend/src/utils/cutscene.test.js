import {cutsceneLayerFrame,moveCutsceneClip,newCutsceneLayer,normalizeCutscene,parseCutsceneProject,mapCutsceneSources,persistCutsceneSources} from './cutscene';

test('anima posição, escala e fades usando o tempo do clipe',()=>{
 const layer=newCutsceneLayer('image',10,{src:'/scene.png',start:2,end:8,from:{x:0,y:50,scale:1},to:{x:100,y:50,scale:2},fadeIn:1,fadeOut:1,easing:'linear'});
 expect(cutsceneLayerFrame(layer,1)).toBeNull();
 expect(cutsceneLayerFrame(layer,2.5).opacity).toBe(.5);
 expect(cutsceneLayerFrame(layer,5)).toMatchObject({x:50,scale:1.5,opacity:1});
 expect(cutsceneLayerFrame(layer,7.5).opacity).toBe(.5);
 expect(cutsceneLayerFrame({...layer,hidden:true},5)).toBeNull();
});
test('mover clipe mantém duração e respeita os limites da sequência',()=>{
 const layer=newCutsceneLayer('text',10,{start:2,end:5});
 expect(moveCutsceneClip(layer,-20,10)).toMatchObject({start:0,end:3});
 expect(moveCutsceneClip(layer,20,10)).toMatchObject({start:7,end:10});
});
test('legenda digitada acompanha o cursor, incluindo ao voltar no tempo',()=>{
 const layer=newCutsceneLayer('text',10,{text:'Uma mensagem importante',typewriter:true});
 expect(cutsceneLayerFrame(layer,.1).text).toBe('Um');
 expect(cutsceneLayerFrame(layer,1).text).toBe(layer.text);
 expect(cutsceneLayerFrame(layer,0).text).toBe('');
});
test('normaliza importações, restringe duração e rejeita fontes executáveis',()=>{
 const project=normalizeCutscene({duration:999,layers:[{src:'javascript:alert(1)',start:999,end:-5,from:{x:Infinity}}]});
 expect(project.duration).toBe(999);expect(project.layers[0].src).toBe('');
 expect(project.layers[0].end).toBeGreaterThan(project.layers[0].start);
 expect(()=>parseCutsceneProject('{"layers":[]}')).toThrow('compatível');
});

test('long projects retain every layer and timestamp when exported and reopened',()=>{
 const project=normalizeCutscene({duration:7200,layers:Array.from({length:125},(_,index)=>({id:String(index),type:'text',start:index*40,end:index*40+20,text:'Plano'}))});
 const reopened=parseCutsceneProject(JSON.stringify(persistCutsceneSources(project)));
 expect(reopened.duration).toBe(7200);
 expect(reopened.layers).toHaveLength(125);
 expect(reopened.layers[124]).toMatchObject({start:4960,end:4980});
});
test('salva referências duráveis e recupera mídia local sem perder animação',async()=>{
 const project=normalizeCutscene({layers:[{src:'blob:preview',srcPersistida:'local-image://token',animation:{closedImage:'/eyes.png'}}]});
 const stored=persistCutsceneSources(project);
 expect(stored.layers[0].src).toBe('local-image://token');
 const resolved=await mapCutsceneSources(stored,async src=>src==='local-image://token'?'blob:restored':src);
 expect(resolved.layers[0]).toMatchObject({src:'blob:restored',srcPersistida:'local-image://token',animation:{closedImage:'/eyes.png'}});
 expect(persistCutsceneSources(resolved).layers[0].src).toBe('local-image://token');
});

test('3D clips preserve cuts, speed and durable model, texture and token sources on reopening',async()=>{
 const recording={frames:[{time:0,position:[0,1,3],target:[0,1,0],fov:42},{time:4,position:[2,1,3],target:[0,1,0],fov:42}]};
 const project=normalizeCutscene({duration:10,layers:[{id:'map',type:'map3d',start:1,end:3,sourceIn:1,playbackRate:1.5,recording3D:recording,map3D:{id:'church',assets:[{asset:{fileUrl:'blob:model',fileUrlPersistida:'local-image://model',dependencies:{texture:'blob:texture'},dependenciesPersistidas:{texture:'local-image://texture'}}}],tokens:[{image:'blob:token',imagePersistida:'local-image://token',position:[0,0,0]}]}}]});
 const stored=persistCutsceneSources(project);
 expect(stored.layers[0].map3D.assets[0].asset.fileUrl).toBe('local-image://model');
 const resolved=await mapCutsceneSources(stored,async src=>src.replace('local-image://','blob:restored-'));
 expect(resolved.layers[0]).toMatchObject({type:'map3d',sourceIn:1,playbackRate:1.5,recording3D:recording,map3D:{assets:[{asset:{fileUrl:'blob:restored-model',dependencies:{texture:'blob:restored-texture'}}}],tokens:[{image:'blob:restored-token'}]}});
 expect(persistCutsceneSources(resolved).layers[0].map3D.assets[0].asset.dependencies.texture).toBe('local-image://texture');
 expect(parseCutsceneProject(JSON.stringify(stored)).layers[0]).toMatchObject({type:'map3d',sourceIn:1,recording3D:recording});
});

test('3D token animation restores blink images and retains edited settings on saving again',async()=>{
 const project={layers:[{map3D:{assets:[],tokens:[{id:'hero',image:'local-image://hero',animation:{enabled:true,image:'local-image://hero',closedImage:'local-image://eyes',breathing:.01,region:{x:.3,y:.1,width:.2,height:.1}}}]}}]};
 const resolved=await mapCutsceneSources(project,async src=>src.replace('local-image://','blob:'));
 const token=resolved.layers[0].map3D.tokens[0];
 expect(token.animation).toMatchObject({image:'blob:hero',closedImage:'blob:eyes'});
 token.animation.breathing=.025;
 expect(persistCutsceneSources(resolved).layers[0].map3D.tokens[0].animation).toMatchObject({image:'local-image://hero',closedImage:'local-image://eyes',breathing:.025,region:{x:.3,y:.1,width:.2,height:.1}});
});
