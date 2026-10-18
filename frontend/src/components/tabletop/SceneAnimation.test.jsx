import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SceneAnimationEditor from './SceneAnimationEditor';
import AnimatedScene from './AnimatedScene';
jest.mock('../tokens/TokenAnimationPreview',()=>props=><div data-testid="scene-preview" data-fit={props.fit} data-enabled={String(props.animation.enabled)} data-closed={props.animation.closedImage} data-src={props.image}/>);
jest.mock('../tokens/TokenAnimationStudio',()=>({readAnimationImage:jest.fn()}));
test('cada mídia guarda sua configuração e pode voltar à cena estática',()=>{
 const save=jest.fn();
 function Harness(){const [media,setMedia]=useState({id:'boss',url:'/boss.webp'});return <SceneAnimationEditor media={media} onChange={animation=>{save(animation);setMedia({...media,animation});}}/>;}
 render(<Harness/>);
 expect(screen.getByLabelText('Animar personagem ou boss nesta imagem')).not.toBeChecked();
 fireEvent.click(screen.getByText('Boss',{exact:true}));
 expect(save).toHaveBeenLastCalledWith(expect.objectContaining({enabled:true,breathing:.012,sway:.006}));
 fireEvent.change(screen.getByLabelText('Respiração'),{target:{value:'.02'}});
 expect(save).toHaveBeenLastCalledWith(expect.objectContaining({breathing:.02}));
 fireEvent.click(screen.getByLabelText('Animar personagem ou boss nesta imagem'));
 expect(save).toHaveBeenLastCalledWith(expect.objectContaining({enabled:false}));
});
test('cena animada usa a imagem atual e a configuração de piscada, sem recorte de transparência',()=>{
 render(<AnimatedScene media={{id:'boss',url:'/boss.webp',animation:{enabled:true,image:'/old.webp',closedImage:'/closed.webp'}}} alt="O chefe"/>);
 expect(screen.getByRole('img',{name:'O chefe'})).toBeInTheDocument();
 expect(screen.getByTestId('scene-preview')).toHaveAttribute('data-src','/boss.webp');
 expect(screen.getByTestId('scene-preview')).toHaveAttribute('data-fit','cover');
 expect(screen.getByTestId('scene-preview')).toHaveAttribute('data-closed','/closed.webp');
});
test('animação desativada não cria camada sobre a imagem estática',()=>{
 const {container}=render(<AnimatedScene media={{url:'/boss.webp',animation:{enabled:false}}}/>);
 expect(container).toBeEmptyDOMElement();
});
