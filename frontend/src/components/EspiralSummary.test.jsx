import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterDossier from './CharacterDossier';

test('resumo Espiral usa layout compacto sem retrato duplicado e preserva dados e recursos', () => {
  const { container } = render(<CharacterDossier aberto={false} onToggle={() => {}} ficha={{id:'1234',sistema:'espiral',nome:'Ana',foto:'/ana.png',dados:{attributes:{pulso:5,razao:2,sentido:2,voz:2},integrity:25,sanity:0,hope:6,pressure:2}}}/>);
  const summary = screen.getByRole('region', { name:'Resumo da ficha de Ana' });
  expect(summary).toHaveClass('pj-resumo-editorial');
  expect(summary.querySelector('img')).toBeNull();
  expect(screen.getByRole('img', { name:'Ana' })).toHaveAttribute('src','/ana.png');
  expect(screen.getByRole('img', {name:'Dado de 12 faces'})).toBeInTheDocument();
  expect(screen.getByText('Razão')).toBeInTheDocument();
  expect(screen.getByText('25 / 50')).toBeInTheDocument();
  expect(screen.getByText('0 / 10')).toBeInTheDocument();
  expect(screen.getByText('2 dados de pressão')).toBeInTheDocument();
  expect(container.querySelector('.pj-resumo-recursos>div:nth-child(1) .pj-recurso-trilho>span')).toHaveStyle({width:'50%'});
  expect(container.querySelector('.pj-resumo-recursos>div:nth-child(2) .pj-recurso-trilho>span')).toHaveStyle({width:'0%'});
  expect(container.querySelector('.pj-resumo-recursos>div:nth-child(3) .pj-recurso-trilho>span')).toHaveStyle({width:'60%'});
});