import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ProtocolRollResult from './ProtocolRollResult';

beforeEach(()=>jest.useFakeTimers());
afterEach(()=>{jest.clearAllTimers();jest.useRealTimers();});

test('distingue bônus rolado e penalidade retirada sem gerar resultados adicionais',()=>{
  const result={type:'test',label:'Pulso + Armas',dice:[6,3],sides:8,pressure:[],successes:1,outcome:'Sucesso',bonusDice:1};
  const {container,rerender}=render(<ProtocolRollResult result={result} rolling={false} onClose={()=>{}}/>);
  expect(container.querySelectorAll('.pd-roll-die.bonus')).toHaveLength(1);
  expect(screen.getByText('Bônus')).toBeInTheDocument();
  rerender(<ProtocolRollResult result={{...result,bonusDice:0,penaltyDice:2}} rolling={false} onClose={()=>{}}/>);
  expect(container.querySelectorAll('.pd-penalty-removed')).toHaveLength(2);
  expect(container.querySelectorAll('.pd-roll-die')).toHaveLength(2);
  expect(screen.getByText('Penalidade · dados retirados')).toBeInTheDocument();
});

test('identifica dados de Pressão durante a animação e preserva seus êxitos e anulação',()=>{
  const result={type:'resource',label:'Pulso + Armas',dice:[6],sides:8,pressure:[4,2],extra:[5],extraSides:6,successes:3,outcome:'Sucesso',pavor:{value:3,sides:6,cancelled:[false,false,true,false]}};
  const {container,rerender}=render(<ProtocolRollResult result={result} rolling onClose={()=>{}}/>);
  expect(container.querySelectorAll('.pd-roll-die.pressure')).toHaveLength(2);
  expect(screen.getAllByText('Pressão')).toHaveLength(2);
  rerender(<ProtocolRollResult result={result} rolling={false} onClose={()=>{}}/>);
  expect(container.querySelectorAll('.pressure.hit')).toHaveLength(1);
  expect(container.querySelectorAll('.pressure.cancelled')).toHaveLength(1);
  act(()=>jest.advanceTimersByTime(1550));
  expect(container.querySelectorAll('.pd-roll-die.pressure')).toHaveLength(1);
  expect(container.querySelectorAll('.pd-roll-die.dread')).toHaveLength(1);
});

test('destaca falha apesar de um dado gerar êxito, somente após a animação',()=>{
  const result={type:'resource',label:'Pulso + Investigação',dice:[1,1,7],sides:8,pressure:[],successes:1,difficulty:2,outcome:'Falha'};
  const {container,rerender}=render(<ProtocolRollResult result={result} rolling onClose={()=>{}}/>);
  expect(container.querySelector('.pd-roll-failed')).toBeNull();
  rerender(<ProtocolRollResult result={result} rolling={false} onClose={()=>{}}/>);
  expect(container.querySelector('.pd-roll-failed')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Falha');
  expect(screen.getByText('Necessários: 2 êxito(s)')).toBeInTheDocument();
  expect(container.querySelectorAll('.pd-roll-die.hit')).toHaveLength(1);
});

test('mostra os anulados antes de removê-los e preserva empates com Pavor',()=>{
  const result={type:'resource',label:'Pulso + Armas',dice:[5,6,9],sides:10,pressure:[],successes:2,outcome:'Sucesso',pavor:{value:6,sides:6,cancelled:[true,false,false]}};
  const {container,rerender}=render(<ProtocolRollResult result={result} rolling onClose={()=>{}}/>);
  act(()=>jest.advanceTimersByTime(2000));
  expect(container.querySelectorAll('.pd-roll-die')).toHaveLength(4);
  rerender(<ProtocolRollResult result={result} rolling={false} onClose={()=>{}}/>);
  expect(screen.getByText('Anulado')).toBeInTheDocument();
  act(()=>jest.advanceTimersByTime(1100));
  expect(container.querySelector('.cancelled')).toHaveClass('is-dissolving');
  act(()=>jest.advanceTimersByTime(450));
  expect(screen.queryByText('Anulado')).toBeNull();
  expect(container.querySelectorAll('.pd-roll-die')).toHaveLength(3);
  expect(screen.getByLabelText('d10: 6')).toBeInTheDocument();
  expect(screen.getByText('Pavor')).toBeInTheDocument();
});
