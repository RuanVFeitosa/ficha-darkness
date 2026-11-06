import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AbsolutoMedo from './AbsolutoMedo';
import { criarBaseV1 } from '../../data/absolutoV1';

function Ficha() {
  const [p,setP]=useState({...criarBaseV1(),medo:5});
  return <><output aria-label="Sanidade">{p.sanidade.atual}</output><AbsolutoMedo personagem={p} setPersonagem={setP}/></>;
}
test('a barra permite alcançar VI e permanecer nele sem bloqueio por cena', () => {
  render(<Ficha/>);
  fireEvent.click(screen.getByRole('button',{name:'Aumentar Medo'}));
  expect(screen.getByLabelText('Medo atual')).toHaveValue(6);
  expect(screen.getByLabelText('Sanidade')).toHaveTextContent('9');
  fireEvent.click(screen.getByText('Aterrorizado', {selector:'summary > span'}));
  fireEvent.click(screen.getByRole('button',{name:'+3 Medo'}));
  expect(screen.getByLabelText('Medo atual')).toHaveValue(6);
  expect(screen.getByLabelText('Sanidade')).toHaveTextContent('9');
  fireEvent.click(screen.getByRole('button',{name:'Nova cena'}));
  expect(screen.getByLabelText('Medo atual')).toHaveValue(0);
  fireEvent.click(screen.getByRole('button',{name:'Aumentar Medo'}));
  expect(screen.getByLabelText('Medo atual')).toHaveValue(1);
  expect(screen.getByLabelText('Sanidade')).toHaveTextContent('9');
  fireEvent.click(screen.getByRole('button',{name:'Definir Medo em 6'}));
  expect(screen.getByLabelText('Medo atual')).toHaveValue(6);
  expect(screen.getByLabelText('Sanidade')).toHaveTextContent('4');
});


test('o painel fecha por Escape e por clique fora sem mudar o Medo', () => {
  const {container}=render(<Ficha/>);
  const detalhes=container.querySelector('.medo-regras');
  fireEvent.click(container.querySelector('.medo-regras > summary'));
  expect(detalhes.open).toBe(true);
  fireEvent.keyDown(screen.getByRole('region',{name:'Efeitos e ações de Medo'}),{key:'Escape'});
  expect(detalhes.open).toBe(false);
  fireEvent.click(container.querySelector('.medo-regras > summary'));
  fireEvent.pointerDown(document.body);
  expect(detalhes.open).toBe(false);
  expect(screen.getByLabelText('Medo atual')).toHaveValue(5);
});
