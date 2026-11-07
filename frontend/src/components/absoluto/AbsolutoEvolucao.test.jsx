import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AbsolutoEvolucao from './AbsolutoEvolucao';
import { criarBaseV1 } from '../../data/absolutoV1';

test('Domínios usam a lista original e descontam dez pontos por nível', async () => {
  const personagem = {...criarBaseV1(), pontosEvolucao:{disponiveis:20}};
  const salvar=jest.fn();
  const {container}=render(<AbsolutoEvolucao personagem={personagem} onSave={salvar}/>);
  expect(container.querySelector('.upgrade-lista')).toBeTruthy();
  expect(container.querySelector('.abs-v1')).toBeNull();
  expect(screen.queryByText('O livro da sobrevivência')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Aumentar Razão'}));
  await waitFor(()=>expect(salvar).toHaveBeenCalledTimes(1));
  expect(salvar.mock.calls[0][0].dominios.razao).toBe(1);
  expect(salvar.mock.calls[0][0].pontosEvolucao.disponiveis).toBe(10);
});

test('impede ultrapassar nível cinco ou gastar sem saldo', () => {
  const personagem={...criarBaseV1(),dominios:{razao:5},pontosEvolucao:{disponiveis:0}};
  render(<AbsolutoEvolucao personagem={personagem} onSave={jest.fn()}/>);
  expect(screen.getByRole('button',{name:'Aumentar Razão'}).disabled).toBe(true);
  expect(screen.getByRole('button',{name:'Aumentar Intuição'}).disabled).toBe(true);
});

test('soma os custos de todos os níveis de Atributo e impede preço manual', async () => {
  const personagem={...criarBaseV1(),pontosEvolucao:{disponiveis:80}};
  const salvar=jest.fn();
  render(<AbsolutoEvolucao grupo="atributos" personagem={personagem} onSave={salvar}/>);
  expect(screen.queryByLabelText('Custo por aumento')).toBeNull();
  fireEvent.change(screen.getByRole('spinbutton',{name:'Nível desejado de Força'}),{target:{value:'3'}});
  fireEvent.click(screen.getByRole('button',{name:'Aumentar Força'}));
  await waitFor(()=>expect(salvar).toHaveBeenCalledTimes(1));
  expect(salvar.mock.calls[0][0].atributos.forca).toBe(3);
  expect(salvar.mock.calls[0][0].pontosEvolucao.disponiveis).toBe(55);
});

test.each(['atributos','dominios'])('permite reduzir de cinco até zero e devolve pontos em %s',async grupo=>{
 const chave=grupo==='atributos'?'forca':'razao',nome=grupo==='atributos'?'Força':'Razão';
 const personagem={...criarBaseV1(),pontosEvolucao:{disponiveis:0}};
 personagem[grupo][chave]=5;
 const salvar=jest.fn();
 render(<AbsolutoEvolucao grupo={grupo} personagem={personagem} onSave={salvar}/>);
 fireEvent.change(screen.getByLabelText(`Nível desejado de ${nome}`),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:`Diminuir ${nome}`}));
 await waitFor(()=>expect(salvar).toHaveBeenCalledTimes(1));
 expect(salvar.mock.calls[0][0][grupo][chave]).toBe(0);
 expect(salvar.mock.calls[0][0].pontosEvolucao.disponiveis).toBe(grupo==='atributos'?90:50);
});

test.each(['atributos','dominios'])('permite comprar o primeiro nível zerado em %s',async grupo=>{
 const chave=grupo==='atributos'?'forca':'razao',nome=grupo==='atributos'?'Força':'Razão';
 const personagem={...criarBaseV1(),pontosEvolucao:{disponiveis:10}};personagem[grupo][chave]=0;
 const salvar=jest.fn();
 render(<AbsolutoEvolucao grupo={grupo} personagem={personagem} onSave={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:`Aumentar ${nome}`}));
 await waitFor(()=>expect(salvar).toHaveBeenCalledTimes(1));
 expect(salvar.mock.calls[0][0][grupo][chave]).toBe(1);
 expect(salvar.mock.calls[0][0].pontosEvolucao.disponiveis).toBe(0);
});
