import React from 'react';
import {render,screen} from '@testing-library/react';
import AbsolutoSummary from './AbsolutoSummary';
test('resumo Absoluto exibe atributos, membros e recursos reais no layout do mestre',()=>{
 const {container}=render(<AbsolutoSummary ficha={{id:'1234',sistema:'darkness',nome:'Ana',foto:'/ana.png',dados:{nomeJogador:'Ruan',nivel:4,atributos:{forca:0,fonitude:2,inteligencia:3,reflexos:1,vontade:4},membros:{cabeca:{atual:0,max:100},torso:{atual:50,max:100}},sanidade:{atual:5,max:10},esperanca:{atual:0,max:20}}}}/>);
 expect(screen.queryByRole('img')).not.toBeInTheDocument();
 expect(screen.getByText('NV 4')).toBeInTheDocument();expect(screen.getByText('Ruan')).toBeInTheDocument();
 expect(screen.getByText('Cabeça')).toBeInTheDocument();expect(screen.getByText('0 / 100')).toBeInTheDocument();
 expect(screen.getByText('Braço direito')).toBeInTheDocument();expect(screen.getAllByText('— / —')).toHaveLength(4);
 expect(container.querySelector('.as-sanidade .as-trilho>span')).toHaveStyle({width:'50%'});
 expect(container.querySelector('.as-esperanca .as-trilho>span')).toHaveStyle({width:'0%'});
});
