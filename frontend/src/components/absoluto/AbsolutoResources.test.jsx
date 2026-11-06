import React,{useState} from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import AbsolutoResources,{ResourceSeal} from './AbsolutoResources';
import {criarBaseV1} from '../../data/absolutoV1';
test('selo permite editar valores, limita ao máximo e conserva os botões de ajuste',()=>{
 const onValue=jest.fn(),onMax=jest.fn(),onStep=jest.fn();
 render(<ResourceSeal name="Sanidade" kind="sanity" resource={{atual:12,max:14}} onValue={onValue} onMax={onMax} onStep={onStep}/>);
 const input=screen.getByLabelText('Sanidade atual');
 fireEvent.change(input,{target:{value:'99'}});fireEvent.blur(input);
 expect(onValue).toHaveBeenCalledWith(14);expect(input).toHaveValue(14);
 fireEvent.click(screen.getByRole('button',{name:'Diminuir Sanidade'}));expect(onStep).toHaveBeenCalledWith(-1);
 const max=screen.getByLabelText('Sanidade máxima');fireEvent.change(max,{target:{value:'20'}});fireEvent.blur(max);expect(onMax).toHaveBeenCalledWith(20);
});
test('seis selos de Medo disparam Ruptura sem alterar as regras',()=>{
 function Demo(){const [p,setP]=useState({...criarBaseV1(),medo:5});return <AbsolutoResources personagem={p} setPersonagem={setP} onSanity={()=>{}} onHope={()=>{}} onSanityStep={()=>{}} onHopeStep={()=>{}}/>;}
 render(<Demo/>);
 const group=screen.getByRole('group',{name:'Seis marcas de Medo'});
 expect(within(group).getAllByRole('button')).toHaveLength(6);
 fireEvent.click(screen.getByRole('button',{name:'Definir Medo em 6'}));
 expect(screen.getByLabelText('Medo atual')).toHaveValue(6);
 expect(screen.getByLabelText('Sanidade atual')).toHaveValue(9);
 expect(group.querySelectorAll('.is-filled')).toHaveLength(6);
 fireEvent.click(screen.getByRole('button',{name:'Definir Medo em 6'}));
 expect(screen.getByLabelText('Sanidade atual')).toHaveValue(9);
});

test('Medo IV trava Esperança com correntes e libera os controles ao baixar para III',()=>{
 const onHope=jest.fn(),onHopeStep=jest.fn();
 const props={setPersonagem:jest.fn(),onSanity:jest.fn(),onSanityStep:jest.fn(),onHope,onHopeStep};
 const p={...criarBaseV1(),medo:4};
 const {rerender,container}=render(<AbsolutoResources {...props} personagem={p}/>);
 expect(screen.getByText('A Esperança já não consegue superar o terror.')).toBeInTheDocument();
 expect(screen.getByLabelText('Esperança atual')).toBeDisabled();
 expect(screen.getByLabelText('Esperança máxima')).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Diminuir Esperança'}));
 fireEvent.click(screen.getByRole('button',{name:'Aumentar Esperança'}));
 expect(onHopeStep).not.toHaveBeenCalled();
 expect(container.querySelector('.abs-hope-chains')).toBeInTheDocument();
 rerender(<AbsolutoResources {...props} personagem={{...p,medo:3}}/>);
 expect(screen.getByLabelText('Esperança atual')).toBeEnabled();
 expect(container.querySelector('.abs-hope-chains')).not.toBeInTheDocument();
});
