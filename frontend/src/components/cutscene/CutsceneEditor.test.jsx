import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CutsceneEditor from './CutsceneEditor';
jest.mock('./CutsceneMap3D',()=>{
 const React=require('react');
 return function MockMap({scene,poseRef,cameraView,cameraSpeed,focusToken,shoulderSide,onSelectToken}) {
  React.useEffect(()=>{if(poseRef)poseRef.current={position:[1,2,3],target:[0,1,0],fov:42};},[poseRef]);
  return <div data-testid="camera-editor-map" data-view={cameraView} data-speed={cameraSpeed} data-focus={focusToken?.id || ''} data-shoulder={shoulderSide} data-tokens={JSON.stringify(scene.tokens || [])}>Mapa 3D: {scene.name}{onSelectToken&&(scene.tokens || []).map(token=><button key={token.id} onClick={()=>onSelectToken(token.id)}>Selecionar {token.name} no palco</button>)}</div>;
 };
});
beforeEach(()=>localStorage.clear());

test('records beyond the old recording limit and extends the timeline beyond ten minutes',async()=>{
 const apply=jest.fn();
 render(<CutsceneEditor maps3D={[{id:'long',nome:'Mapa longo',assets:[]}]} assets={[{id:'enemy',name:'Ameaça',url:'/enemy.png',type:'token'}]} onApply={apply}/>);
 fireEvent.click(screen.getByRole('button',{name:'Abrir mapa no palco'}));
 await screen.findByText('Mapa 3D: Mapa longo');
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Ameaça à cena'}));
 fireEvent.change(screen.getByLabelText('Altura do token (m)'),{target:{value:'.3'}});
 fireEvent.change(screen.getByLabelText('Posição X do token'),{target:{value:'2'}});
 let now=0;const clock=jest.spyOn(performance,'now').mockImplementation(()=>now);
 fireEvent.click(screen.getByRole('button',{name:'● Gravar câmera 3D'}));
 now=1800000;fireEvent.click(screen.getByRole('button',{name:'Encerrar e adicionar à timeline'}));
 expect(screen.getByLabelText('Duração (s)')).toHaveValue(1800);
 expect(screen.getByLabelText('Duração (s)')).not.toHaveAttribute('max');
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 expect(apply.mock.calls[0][0].duration).toBe(1800);
 expect(apply.mock.calls[0][0].layers[0].recording3D.frames.at(-1).time).toBe(1800);
 expect(apply.mock.calls[0][0].layers[0].map3D.tokens).toEqual([expect.objectContaining({image:'/enemy.png',position:[2,2,3],height:.3})]);
 clock.mockRestore();
});

test('adding a token during montage uses the recorded camera position at the cursor',async()=>{
 const apply=jest.fn();
 localStorage.setItem('tabletop_token_animations_v1',JSON.stringify([{id:'enemy-animation',name:'Ameaça animada',image:'/enemy.png',animation:{enabled:true,closedImage:'/eyes.png',breathing:.02,sway:.01,speed:1.1}}]));
 const recording3D={frames:[{time:0,position:[2,3,4],target:[0,1,0],fov:42},{time:4,position:[6,3,4],target:[0,1,0],fov:42}]};
 render(<CutsceneEditor initialValue={{duration:10,layers:[{id:'map',type:'map3d',start:0,end:4,recording3D,map3D:{id:'church',name:'Igreja',assets:[],tokens:[]}}]}} assets={[{id:'enemy',name:'Ameaça',url:'/enemy.png',type:'token'}]} onApply={apply}/>);
 await screen.findByTestId('camera-editor-map');
 fireEvent.change(screen.getByLabelText('Posição na linha do tempo'),{target:{value:'2'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Ameaça à cena'}));
 fireEvent.change(screen.getByLabelText('Animação salva do token'),{target:{value:'enemy-animation'}});
 fireEvent.change(screen.getByLabelText('Velocidade da animação'),{target:{value:'1.5'}});
 fireEvent.change(screen.getByLabelText('Respiração do token'),{target:{value:'.025'}});
 expect(JSON.parse(screen.getByTestId('camera-editor-map').getAttribute('data-tokens'))[0].position).toEqual([4,3,4]);
 fireEvent.change(screen.getByLabelText('Altura do token (m)'),{target:{value:'.2'}});
 fireEvent.click(screen.getByRole('button',{name:'− Diminuir token'}));
 fireEvent.change(screen.getByLabelText('Posição X do token'),{target:{value:'7.5'}});
 fireEvent.change(screen.getByLabelText('Altura Y do token'),{target:{value:'.2'}});
 fireEvent.change(screen.getByLabelText('Posição Z do token'),{target:{value:'-4'}});
 fireEvent.click(screen.getByRole('button',{name:'Aumentar posição z do token'}));
 expect(JSON.parse(screen.getByTestId('camera-editor-map').getAttribute('data-tokens'))[0].position).toEqual([7.5,.2,-3.9]);
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 const project=apply.mock.calls[0][0];
 expect(project.layers).toHaveLength(1);
 expect(project.layers[0].map3D.tokens[0]).toMatchObject({image:'/enemy.png',position:[7.5,.2,-3.9]});
 expect(project.layers[0].map3D.tokens[0].height).toBeCloseTo(.16);
 expect(project.layers[0].map3D.tokens[0].scale).toBeCloseTo(.35*.16/.65);
 expect(project.layers[0].map3D.tokens[0].animation).toMatchObject({enabled:true,closedImage:'/eyes.png',breathing:.025,speed:1.5});
});

test('clicking an existing 3D token opens animation controls and saves the enabled state',async()=>{
 const apply=jest.fn(),recording3D={frames:[{time:0,position:[0,1,3],target:[0,1,0],fov:42},{time:4,position:[2,1,3],target:[0,1,0],fov:42}]};
 render(<CutsceneEditor initialValue={{duration:5,layers:[{id:'church',type:'map3d',start:0,end:5,recording3D,map3D:{id:'church',name:'Igreja',assets:[],tokens:[{id:'threat',name:'Ameaça',image:'/enemy.png',position:[0,0,0],animation:{enabled:true,speed:1.5}}]}}]}} onApply={apply}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Selecionar Ameaça no palco'}));
 expect(screen.getByLabelText('Animar token')).toBeChecked();
 fireEvent.click(screen.getByLabelText('Animar token'));
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 expect(apply.mock.calls[0][0].layers[0].map3D.tokens[0].animation).toMatchObject({enabled:false,speed:1.5});
});

test('studio exposes tabletop views, target framing, shoulder switching and fine camera speed',async()=>{
 const campaign={tokens:[{id:'threat',nome:'Ameaça',posicoes:{'__estado:tabletop3d:church':{x:2,z:3,image:'/threat.png'}}}]};
 render(<CutsceneEditor maps3D={[{id:'church',nome:'Igreja',assets:[]}]} campaign={campaign}/>);
 fireEvent.click(screen.getByRole('button',{name:'Abrir mapa no palco'}));
 const map=await screen.findByTestId('camera-editor-map');
 fireEvent.change(screen.getByLabelText('Modo de câmera'),{target:{value:'firstPerson'}});
 fireEvent.change(screen.getByLabelText('Alvo da câmera'),{target:{value:'threat'}});
 fireEvent.change(screen.getByLabelText('Velocidade da câmera'),{target:{value:'.01'}});
 expect(map).toHaveAttribute('data-view','firstPerson');
 expect(map).toHaveAttribute('data-focus','threat');
 expect(map).toHaveAttribute('data-speed','0.01');
 fireEvent.click(screen.getByRole('button',{name:'Ombro direito · V'}));
 expect(map).toHaveAttribute('data-shoulder','-1');
 expect(screen.getByRole('button',{name:'Reenquadrar alvo'})).toBeEnabled();
});

test('records inside the studio, trims, splits, changes speed and saves editable 3D clips',async()=>{
 const apply=jest.fn();
 render(<CutsceneEditor maps3D={[{id:'church',nome:'Igreja',assets:[]}]} onApply={apply}/>);
 fireEvent.click(screen.getByRole('button',{name:'Abrir mapa no palco'}));
 expect(await screen.findByText('Mapa 3D: Igreja')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Atmosfera'),{target:{value:'chuva'}});
 fireEvent.change(screen.getByLabelText('Velocidade da câmera'),{target:{value:'2.5'}});
 fireEvent.change(screen.getByLabelText('Intensidade do balanço'),{target:{value:'1.5'}});
 fireEvent.change(screen.getByLabelText('Ritmo do balanço'),{target:{value:'1.25'}});
 fireEvent.change(screen.getByLabelText('Inclinação lateral em graus'),{target:{value:'12'}});
 let now=0;const clock=jest.spyOn(performance,'now').mockImplementation(()=>now);
 fireEvent.click(screen.getByRole('button',{name:'● Gravar câmera 3D'}));
 now=4000;fireEvent.click(screen.getByRole('button',{name:'Encerrar e adicionar à timeline'}));
 expect(screen.getByLabelText('Fim na gravação (s)')).toHaveValue(4);
 expect(screen.getByLabelText('Atmosfera')).toHaveValue('chuva');
 fireEvent.change(screen.getByLabelText('Início na gravação (s)'),{target:{value:'1'}});
 expect(screen.getByLabelText('Saída (s)')).toHaveValue(3);
 fireEvent.change(screen.getByLabelText('Posição na linha do tempo'),{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:'Dividir no cursor'}));
 expect(screen.getByLabelText('Início na gravação (s)')).toHaveValue(2);
 fireEvent.change(screen.getByLabelText('Velocidade do percurso'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Intensidade do balanço'),{target:{value:'.5'}});
 fireEvent.change(screen.getByLabelText('Chuva'),{target:{value:'.4'}});
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 const layers=apply.mock.calls[0][0].layers;
 expect(layers).toHaveLength(2);
 expect(layers[0]).toMatchObject({type:'map3d',start:0,end:1,sourceIn:1,map3D:{id:'church'}});
 expect(layers[0].map3D.weather).toMatchObject({rain:.82,preset:'chuva'});
 expect(layers[0]).toMatchObject({navigationSpeed3D:2.5,cameraMotion3D:{intensity:1.5,speed:1.25,roll:12}});
 expect(layers[1]).toMatchObject({type:'map3d',start:1,end:2,sourceIn:2,playbackRate:2});
 expect(layers[1].cameraMotion3D).toMatchObject({intensity:.5,speed:1.25,roll:12});
 expect(layers[1].map3D.weather).toMatchObject({rain:.4,preset:'custom'});
 expect(layers[1].recording3D.frames.at(-1).time).toBe(4);
 clock.mockRestore();
});

test('cria legenda, edita movimento, desfaz/refaz e aplica a sequência completa',async()=>{
 const apply=jest.fn();render(<CutsceneEditor onApply={apply}/>);
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 fireEvent.change(screen.getByLabelText('Texto da legenda'),{target:{value:'A porta se abre.'}});
 fireEvent.click(screen.getByRole('button',{name:'Posição final'}));
 fireEvent.change(screen.getByLabelText('Posição X'),{target:{value:'75'}});
 fireEvent.click(screen.getByRole('button',{name:'Desfazer'}));
 expect(screen.getByLabelText('Posição X')).toHaveValue(50);
 fireEvent.click(screen.getByRole('button',{name:'Refazer'}));
 expect(screen.getByLabelText('Posição X')).toHaveValue(75);
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 expect(apply.mock.calls[0][0].layers[0]).toMatchObject({type:'text',text:'A porta se abre.',to:{x:75},start:0,end:20});
});
test('biblioteca inclui o token animado e preserva a animação',async()=>{
 localStorage.setItem('tabletop_token_animations_v1',JSON.stringify([{id:'hero',name:'Victoria',image:'/hero.png',animation:{enabled:true,closedImage:'/blink.png'}}]));
 const apply=jest.fn();render(<CutsceneEditor onApply={apply}/>);
 fireEvent.change(screen.getByLabelText('Biblioteca da campanha'),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar da biblioteca'}));
 expect(screen.getByAltText('Victoria')).toHaveAttribute('src','/hero.png');
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalled());
 expect(apply.mock.calls[0][0].layers[0]).toMatchObject({type:'token',animation:{closedImage:'/blink.png'}});
});
test('recupera rascunho após sair do editor',()=>{
 const view=render(<CutsceneEditor draftKey="draft:test"/>);
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 fireEvent.change(screen.getByLabelText('Texto da legenda'),{target:{value:'Rascunho preservado'}});
 view.unmount();render(<CutsceneEditor draftKey="draft:test"/>);
 fireEvent.click(screen.getByRole('button',{name:'Selecionar clipe Legenda'}));
 expect(screen.getByLabelText('Texto da legenda')).toHaveValue('Rascunho preservado');
});
test('arquivo importado vira camada sem converter a imagem animada',async()=>{
 const upload=jest.fn(async()=>({src:'blob:gif',srcPersistida:'local-image://gif'}));
 render(<CutsceneEditor onUpload={upload}/>);
 const file=new File(['GIF89a'],'intro.gif',{type:'image/gif'});
 fireEvent.change(screen.getByLabelText('Adicionar imagem à cutscene'),{target:{files:[file]}});
 await waitFor(()=>expect(screen.getByAltText('intro')).toHaveAttribute('src','blob:gif'));
 expect(upload).toHaveBeenCalledWith(file,'especial');
});

test('estúdio independente mantém edição, categorias, zoom e altura da linha do tempo',()=>{
 render(<CutsceneEditor standalone navigation={<a href="/?mestre=1">Voltar</a>}/>);
 expect(screen.getByRole('navigation',{name:'Ferramentas do estúdio'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Mídia'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Texto',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 expect(screen.getByLabelText('Texto da legenda')).toBeVisible();
 fireEvent.change(screen.getByLabelText('Nome da cutscene'),{target:{value:'Cena em tela inteira'}});
 expect(screen.getByLabelText('Nome da cutscene')).toHaveValue('Cena em tela inteira');
 fireEvent.change(screen.getByLabelText('Zoom da linha do tempo'),{target:{value:'2'}});
 expect(screen.getByLabelText('Zoom da linha do tempo')).toHaveValue('2');
 const separator=screen.getByRole('separator',{name:'Altura da linha do tempo'});
 fireEvent.keyDown(separator,{key:'ArrowUp'});
 expect(separator).toHaveAttribute('aria-valuenow','37');
 fireEvent.click(screen.getByRole('button',{name:'Projeto',exact:true}));
 expect(screen.getByLabelText('Duração (s)')).toBeVisible();
});
