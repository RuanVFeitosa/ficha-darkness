import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdaptacaoDarkness from './AdaptacaoDarkness';
import { freshSheet } from '../../data/espiral';
import { salvarFichaEspiral } from '../../services/espiralApi';
jest.mock('../../services/espiralApi', () => ({ salvarFichaEspiral: jest.fn() }));
beforeEach(() => { global.crypto = { randomUUID: () => 'adaptacao-teste' }; localStorage.clear(); jest.clearAllMocks(); });
test('salva em outro código e abre a ficha Darkness sem sobrescrever a origem', async () => {
  salvarFichaEspiral.mockResolvedValue({ ok: true });
  const onComplete = jest.fn();
  localStorage.setItem('espiral:sheet:v1:jorge', 'original');
  render(<AdaptacaoDarkness original={{ ...freshSheet(), name: 'Jorge' }} sistema="espiral" fichaId="jorge" onClose={jest.fn()} onComplete={onComplete}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' }));
  await waitFor(() => expect(onComplete).toHaveBeenCalled());
  const id = onComplete.mock.calls[0][0];
  expect(id).toMatch(/^darkness-/);
  expect(localStorage.getItem('espiral:sheet:v1:jorge')).toBe('original');
  expect(JSON.parse(localStorage.getItem(`espiral:sheet:v1:${id}`)).ruleset).toBe('protocolo-darkness-v1');
});
test('erro de gravação não abre outra ficha', async () => {
  salvarFichaEspiral.mockRejectedValue(new Error('Falha de conexão'));
  const onComplete = jest.fn();
  render(<AdaptacaoDarkness original={{ ...freshSheet(), name: 'Jorge' }} sistema="espiral" fichaId="jorge" onClose={jest.fn()} onComplete={onComplete}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Falha de conexão'));
  expect(onComplete).not.toHaveBeenCalled();
});


test('redistribui estágios sem criar pontos e salva os atributos escolhidos', async () => {
  salvarFichaEspiral.mockResolvedValue({ ok: true });
  const original = { nome: 'Ellie', atributos: { forca: 3, fonitude: 3, inteligencia: 3, reflexos: 2, vontade: 2 } };
  render(<AdaptacaoDarkness original={original} sistema="absoluto" fichaId="ellie" onClose={jest.fn()} onComplete={jest.fn()}/>);
  expect(screen.getByRole('button', { name: 'Aumentar Razão' })).toBeDisabled();
  expect(screen.getByLabelText('Dado de Pulso: d8')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Pulso' }));
  expect(screen.getByLabelText('Dado de Pulso: d6')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Razão' }));
  expect(screen.getByLabelText('Dado de Razão: d10')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Aumentar Razão' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Aumentar Voz' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' }));
  await waitFor(() => expect(salvarFichaEspiral).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ attributes: { pulso: 2, razao: 4, sentido: 2, voz: 2 } })));
});

test('limita o mínimo e restaura a distribuição inicial', () => {
  render(<AdaptacaoDarkness original={{ nome: 'Ellie', atributos: { forca: 0, inteligencia: 3 } }} sistema="absoluto" fichaId="ellie" onClose={jest.fn()} onComplete={jest.fn()}/>);
  expect(screen.getByRole('button', { name: 'Diminuir Pulso' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Razão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Pulso' }));
  expect(screen.getByLabelText('Dado de Pulso: d6')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar conversão' }));
  expect(screen.getByLabelText('Dado de Pulso: d4')).toBeInTheDocument();
  expect(screen.getByLabelText('Dado de Razão: d8')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Restaurar conversão' })).toBeDisabled();
});


test('cota local esgotada não impede abrir a adaptação confirmada no servidor', async () => {
  salvarFichaEspiral.mockResolvedValue({ ok: true });
  const onComplete = jest.fn();
  const fail = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); });
  try {
    render(<AdaptacaoDarkness original={{ ...freshSheet(), name: 'Ellie' }} sistema="espiral" fichaId="ellie" onClose={jest.fn()} onComplete={onComplete}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('darkness-adaptacao-teste'));
    expect(salvarFichaEspiral).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  } finally { fail.mockRestore(); }
});


test('redistribui Recursos separadamente, limita o grau e salva a distribuição revisada', async () => {
  salvarFichaEspiral.mockResolvedValue({ ok: true });
  const original = { nome: 'Ellie', especialidade: 'Médica', dominios: { razao: 5 }, atributos: { forca: 3, inteligencia: 3 } };
  render(<AdaptacaoDarkness original={original} sistema="absoluto" fichaId="ellie" onClose={jest.fn()} onComplete={jest.fn()}/>);
  expect(screen.getByRole('button', { name: 'Aumentar Recurso Tecnologia' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Diminuir Recurso Tecnologia' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Recurso Medicina' }));
  expect(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Aumentar Pulso' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Recurso Tecnologia' }));
  expect(screen.getByRole('button', { name: 'Aumentar Recurso Tecnologia' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Criar e abrir ficha Darkness' }));
  await waitFor(() => expect(salvarFichaEspiral).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ resources: expect.objectContaining({ Medicina: 2, Tecnologia: 1 }) })));
});
