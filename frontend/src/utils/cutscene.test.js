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
 expect(project.duration).toBe(600);expect(project.layers[0].src).toBe('');
 expect(project.layers[0].end).toBeGreaterThan(project.layers[0].start);
 expect(()=>parseCutsceneProject('{"layers":[]}')).toThrow('compatível');
});
test('salva referências duráveis e recupera mídia local sem perder animação',async()=>{
 const project=normalizeCutscene({layers:[{src:'blob:preview',srcPersistida:'local-image://token',animation:{closedImage:'/eyes.png'}}]});
 const stored=persistCutsceneSources(project);
 expect(stored.layers[0].src).toBe('local-image://token');
 const resolved=await mapCutsceneSources(stored,async src=>src==='local-image://token'?'blob:restored':src);
 expect(resolved.layers[0]).toMatchObject({src:'blob:restored',srcPersistida:'local-image://token',animation:{closedImage:'/eyes.png'}});
 expect(persistCutsceneSources(resolved).layers[0].src).toBe('local-image://token');
});
