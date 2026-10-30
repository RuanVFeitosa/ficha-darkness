import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AmbientMusicControls from './AmbientMusicControls';
import useLoginAmbient, { useAmbientPlayback } from '../../utils/useLoginAmbient';

function Harness({ pagina = 'Login' }) {
  useAmbientPlayback();
  const { ativo } = useLoginAmbient();
  return <><p>{pagina}</p><span data-testid="estado">{String(ativo)}</span><AmbientMusicControls /></>;
}
function contexto() {
  const param = () => ({ value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), setTargetAtTime: jest.fn() });
  return { currentTime: 0, destination: {},
    createGain: jest.fn(() => ({ connect: jest.fn(), gain: param() })),
    createBiquadFilter: jest.fn(() => ({ connect: jest.fn(), frequency: param() })),
    createOscillator: jest.fn(() => ({ connect: jest.fn(), start: jest.fn(), frequency: param(), detune: param() })),
    resume: jest.fn(() => Promise.resolve()), suspend: jest.fn(() => Promise.resolve()), close: jest.fn(() => Promise.resolve()),
  };
}
beforeEach(() => localStorage.clear());
afterEach(() => { delete window.AudioContext; });

test('navegar mantém o áudio e trocar atmosfera substitui a trilha; volume não reinicia', () => {
  const contexts = [];
  window.AudioContext = jest.fn(() => { const c = contexto(); contexts.push(c); return c; });
  const view = render(<Harness />);
  fireEvent.pointerDown(window);
  expect(window.AudioContext).toHaveBeenCalledTimes(1);
  view.rerender(<Harness pagina="Dashboard" />);
  expect(contexts[0].close).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Volume · 35%'), { target: { value: '60' } });
  expect(window.AudioContext).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem('darkness:ambiente:volume')).toBe('60');
  fireEvent.change(screen.getByLabelText('Atmosfera'), { target: { value: 'abismo' } });
  expect(contexts[0].close).toHaveBeenCalledTimes(1);
  expect(window.AudioContext).toHaveBeenCalledTimes(2);
  expect(localStorage.getItem('darkness:ambiente:trilha')).toBe('abismo');
  fireEvent.click(screen.getByRole('button', { name: 'Pausar música', hidden: true }));
  expect(screen.getByTestId('estado')).toHaveTextContent('false');
  expect(contexts[1].close).toHaveBeenCalledTimes(1);
  view.unmount();
});

test('recupera preferências salvas ao abrir o painel', () => {
  localStorage.setItem('darkness:ambiente:trilha', 'santuario');
  localStorage.setItem('darkness:login:musica', 'off');
  render(<Harness />);
  expect(screen.getByLabelText('Atmosfera')).toHaveValue('santuario');
  expect(screen.getByTestId('estado')).toHaveTextContent('false');
  act(() => window.dispatchEvent(new Event('pointerdown')));
});
