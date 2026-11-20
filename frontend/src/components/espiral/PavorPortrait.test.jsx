import React from 'react';
import { render, screen } from '@testing-library/react';
import PavorPortrait from './PavorPortrait';

test('aura aparece com o efeito e desaparece quando ele termina',()=>{
  const {container,rerender}=render(<PavorPortrait pavor={{active:false,sides:6}}/>);
  expect(container.querySelector('.pd-pavor-transition')).toHaveAttribute('data-active','false');
  expect(screen.queryByRole('group',{name:'Escala de Pavor'})).toBeNull();
  rerender(<PavorPortrait pavor={{active:true,sides:6}}/>);
  expect(screen.getByRole('img',{name:'Pavor ativo: d6'})).toBeInTheDocument();
  expect(container.querySelector('.pd-pavor-aura img')).toHaveAttribute('src','/simbolo-darkness.png');
  const opacity=Number(container.querySelector('.pd-pavor-aura').style.getPropertyValue('--pavor-opacity'));
  rerender(<PavorPortrait pavor={{active:true,sides:12}}/>);
  expect(screen.getByRole('img',{name:'Pavor ativo: d12'})).toBeInTheDocument();
  expect(Number(container.querySelector('.pd-pavor-aura').style.getPropertyValue('--pavor-opacity'))).toBeGreaterThan(opacity);
  expect(container.querySelector('.pd-pavor-aura svg')).toBeNull();
  rerender(<PavorPortrait pavor={{active:false,sides:6}}/>);
  expect(container.querySelector('.pd-pavor-transition')).toHaveAttribute('data-active','false');
  expect(screen.queryByRole('group',{name:'Escala de Pavor'})).toBeNull();
});

test('escala mostra todos os dados e destaca somente o atual',()=>{const {container}=render(<PavorPortrait pavor={{active:true,sides:8}}/>);expect(screen.getByRole('group',{name:'Escala de Pavor'})).toBeInTheDocument();for(const sides of [4,6,8,10,12])expect(screen.getByRole('img',{name:sides===8?'Pavor ativo: d8':`Pavor d${sides}`})).toBeInTheDocument();expect(container.querySelectorAll('.is-current')).toHaveLength(1);});
