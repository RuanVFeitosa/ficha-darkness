import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import SpecialScene,{SpecialSceneMedia} from './SpecialScene';
import {normalizeCutscene,newCutsceneLayer} from '../../utils/cutscene';

test('master chooses a battle map or static image directly from the special scene',async()=>{
 const scene={id:'intro',nome:'Abertura',cenaEspecial:{midiaUrl:'/intro.png'}},targetScene=scene;
 const map={id:'church:map',label:'Igreja · Mapa',scene:targetScene,mapLink:{id:'map',mapa3dId:'church-map'}};
 const image={id:'church:image',label:'Igreja · Entrada',scene:targetScene,imageLink:{id:'image',url:'/church.png'}};
 const navigate=jest.fn().mockResolvedValue(true);
 render(<SpecialScene scene={scene} destinations={{maps:[map],images:[image]}} onNavigate={navigate}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ir para o mapa de batalha'}));
 await waitFor(()=>expect(navigate).toHaveBeenCalledWith(map));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Ir para a cena estática'})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:'Ir para a cena estática'}));
 await waitFor(()=>expect(navigate).toHaveBeenCalledWith(image));
});
test('players do not see scene navigation and failed navigation stays reviewable',async()=>{
 const scene={id:'intro',nome:'Abertura',cenaEspecial:{midiaUrl:'/intro.png'}};
 const {rerender}=render(<SpecialScene scene={scene}/>);
 expect(screen.queryByRole('navigation',{name:'Destinos após a cutscene'})).not.toBeInTheDocument();
 rerender(<SpecialScene scene={scene} onNavigate={jest.fn().mockResolvedValue(false)} destinations={{maps:[{id:'map',label:'Mapa',scene}],images:[]}}/>);
 expect(screen.getByRole('button',{name:'Ir para a cena estática'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Ir para o mapa de batalha'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível trocar a cena');
});

test('destinations from another scene are never offered as a fallback',()=>{
 const scene={id:'intro',nome:'Abertura',cenaEspecial:{midiaUrl:'/intro.png'}};
 render(<SpecialScene scene={scene} onNavigate={jest.fn()} destinations={{maps:[],images:[{id:'other',label:'Foto de outra cena',scene:{id:'other'}}]}}/>);
 expect(screen.getByRole('button',{name:'Ir para a cena estática'})).toBeDisabled();
 expect(screen.queryByText('Foto de outra cena')).not.toBeInTheDocument();
});

test('only the master has playback controls in the special scene',()=>{
 const scene={id:'intro',nome:'Abertura',cenaEspecial:{midiaUrl:'cutscene:intro',cutscene:normalizeCutscene({layers:[newCutsceneLayer('image',20,{src:'/opening.png',name:'Cenário',fadeIn:0})]})}};
 const {rerender}=render(<SpecialScene scene={scene}/>);
 expect(screen.getByAltText('Cenário')).toBeInTheDocument();
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 expect(screen.queryByRole('slider')).not.toBeInTheDocument();
 expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
 rerender(<SpecialScene scene={scene} onClose={()=>{}}/>);
 expect(screen.getByRole('button',{name:'Pausar'})).toBeInTheDocument();
 expect(screen.getByLabelText('Posição da reprodução')).toBeInTheDocument();
});
test('GIF substitui vídeo antigo e usa imagem com o arquivo original',()=>{
 const {container}=render(<SpecialSceneMedia name="Revelação" special={{tipoMidia:'video',midiaUrl:'/revelacao.gif'}}/>);
 expect(screen.getByAltText('Revelação')).toHaveAttribute('src','/revelacao.gif');
 expect(container.querySelector('video')).toBeNull();
});
test('vídeo continua com reprodução e opções de loop preservadas',()=>{
 const {container}=render(<SpecialSceneMedia name="Abertura" special={{tipoMidia:'video',midiaUrl:'blob:video',loop:false}}/>);
 expect(container.querySelector('video')).toHaveAttribute('autoplay');
 expect(container.querySelector('video')).not.toHaveAttribute('loop');
});
test('o mestre pode encerrar a apresentação e título oculto é respeitado',()=>{
 const close=jest.fn();
 render(<SpecialScene scene={{nome:'Abertura',cenaEspecial:{midiaUrl:'/intro.gif',exibirTitulo:false}}} onClose={close}/>);
 expect(screen.getByRole('region',{name:'Cena especial: Abertura'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Encerrar cena especial'}));
 expect(close).toHaveBeenCalledTimes(1);
 expect(screen.queryByText('Abertura')).not.toBeInTheDocument();
});
test('uma cena especial com projeto abre o player em vez de tentar carregar um arquivo',()=>{
 const project=normalizeCutscene({layers:[newCutsceneLayer('image',20,{src:'/opening.png',name:'Cenário'})]});
 const {container}=render(<SpecialSceneMedia name="Abertura" special={{tipoMidia:'cutscene',midiaUrl:'cutscene:project',cutscene:project}}/>);
 expect(screen.getByRole('button',{name:'Pausar'})).toBeInTheDocument();
 expect(screen.getByAltText('Cenário')).toHaveAttribute('src','/opening.png');
 expect(container.querySelector('img[src="cutscene:project"]')).toBeNull();
});
