import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SessionClockControls from './SessionClockControls';

test('mestre ajusta horário, velocidade e pausa', () => {
  const onChange=jest.fn();
  render(<SessionClockControls clock={{enabled:true,running:true,rate:10}} minutes={1050} mestre onChange={onChange}/>);
  expect(screen.getByText('17:30')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Horário da cena'),{target:{value:'22:45'}});
  expect(onChange).toHaveBeenLastCalledWith({minutes:1365});
  fireEvent.change(screen.getByLabelText('Velocidade do tempo'),{target:{value:'60'}});
  expect(onChange).toHaveBeenLastCalledWith({rate:60});
  fireEvent.click(screen.getByRole('button',{name:'Pausar tempo'}));
  expect(onChange).toHaveBeenLastCalledWith({running:false});
});

test('jogadores acompanham o horário sem poder alterar o ciclo', () => {
  render(<SessionClockControls clock={{enabled:true,running:true}} minutes={540} mestre={false} onChange={jest.fn()}/>);
  expect(screen.getByLabelText('Horário da cena')).toBeDisabled();
  expect(screen.getByLabelText('Velocidade do tempo')).toBeDisabled();
  expect(screen.getByRole('button',{name:'Pausar tempo'})).toBeDisabled();
});
