import React from 'react';
import { render, screen } from '@testing-library/react';
import IntegrityHeartbeat, { integrityCondition } from './IntegrityHeartbeat';

test.each([[100,'stable'],[51,'stable'],[50,'hurt'],[26,'hurt'],[25,'critical'],[0,'critical']])('Integridade %s/100 corresponde a %s', (value, state) => {
  expect(integrityCondition(value,100).key).toBe(state);
});
test('estado acompanha alterações e também é identificado por texto',()=>{
  const {rerender}=render(<IntegrityHeartbeat current={40} maximum={45}/>);
  expect(screen.getByRole('img',{name:'Monitor cardíaco — Estável'})).toBeInTheDocument();
  rerender(<IntegrityHeartbeat current={10} maximum={45}/>);
  expect(screen.getByText('Crítico')).toBeInTheDocument();
  expect(screen.getByRole('meter',{name:'Integridade'})).toHaveAttribute('aria-valuenow','10');
  expect(screen.getByRole('meter',{name:'Integridade'})).toHaveAttribute('aria-valuemax','45');
  expect(screen.queryByRole('spinbutton')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});
