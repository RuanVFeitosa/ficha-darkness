import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import Card from './AbsolutoAgentCard';
test('dossiê mostra identidade, atributos e recursos preservando valores zero e abre por teclado',()=>{
 const onAbrir=jest.fn();const ficha={fichaId:'1234',personagem:{nome:'Ana',nomeJogador:'Bia',nivel:5,classe:'Médica',fotoPerfil:'/ana.png',atributos:{forca:0,fonitude:20},membros:{cabeca:{atual:0,max:100}},sanidade:{atual:0,max:50},esperanca:{atual:30,max:40}}};
 const {container}=render(<Card ficha={ficha} onAbrir={onAbrir}/>);
 expect(screen.getByText('Ana')).toBeInTheDocument();expect(screen.getByText('Jogador · Bia')).toBeInTheDocument();expect(screen.getByText('Cabeça')).toBeInTheDocument();
 expect(container.querySelector('.ad-integridade .ad-meter-track>i')).toHaveStyle({width:'0%'});
 expect(container.querySelector('.ad-sanidade .ad-meter-track>i')).toHaveStyle({width:'0%'});
 expect(container.querySelector('.ad-esperanca .ad-meter-track>i')).toHaveStyle({width:'75%'});
 fireEvent.keyDown(screen.getByRole('button',{name:'Abrir ficha de Ana'}),{key:'Enter'});expect(onAbrir).toHaveBeenCalledWith(ficha,'jogador');
});