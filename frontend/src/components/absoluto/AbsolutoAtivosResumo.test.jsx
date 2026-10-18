import React from 'react';
import {render,screen,within} from '@testing-library/react';
import AbsolutoAtivosResumo from './AbsolutoAtivosResumo';

test('mostra dados dos Ativos e bônus vinculados sem somar passivas aos dados',()=>{
  render(<AbsolutoAtivosResumo personagem={{atributos:{inteligencia:30,fonitude:20},habilidadesCombate:{razao:2},habilidadesTemporarias:{razao:1,investigacao:2},habilidadesPassivas:{investigacao:5,conhecimentoMedico:3,coragem:0}}}/>);
  const razao=screen.getByRole('heading',{name:'Razão'}).closest('article');
  expect(within(razao).getByLabelText('Razão: 6 dados')).toBeInTheDocument();
  expect(within(razao).getByText('Investigação')).toBeInTheDocument();
  expect(within(razao).getByText('+7')).toBeInTheDocument();
  expect(within(razao).getByText('Conhecimento Médico')).toBeInTheDocument();
  expect(screen.getByLabelText('Resistência: 2 dados')).toBeInTheDocument();
  expect(screen.queryByText('Coragem')).not.toBeInTheDocument();
});

test('ficha sem valores mantém os oito Ativos com mínimo de um dado',()=>{
  render(<AbsolutoAtivosResumo personagem={{}}/>);
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect(screen.getAllByText('Sem bônus de passiva disponível.')).toHaveLength(8);
  expect(screen.getByLabelText('Razão: 1 dados')).toBeInTheDocument();
});
