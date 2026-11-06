import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SpecialScene,{SpecialSceneMedia} from './SpecialScene';
import {normalizeCutscene,newCutsceneLayer} from '../../utils/cutscene';
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
