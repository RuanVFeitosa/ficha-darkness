import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RevoltPlayerHUD from './RevoltPlayerHUD';
import { applyMechanicAction, emptyMechanics } from '../../utils/specialMechanics';
import { salvarMecanicasCampanha } from '../../services/mesaApi';
jest.mock('../../services/mesaApi', () => ({ salvarMecanicasCampanha: jest.fn(), buscarCampanhaPorCodigo: jest.fn() }));
function setup() {
  let state = applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'revolt', id: 'r', config: { name: 'Operação', fronts: { popular: { players: ['lia'], difficulty: 2, sheet: { nome: 'Organização Popular', atributos: { vontade: 4 }, dominios: { influencia: 3 } } } } } });
  return applyMechanicAction(state, { id: 'r', type: 'start' });
}
function Host({ id = 'lia', initial = setup() }) {
  const [state, setState] = useState(initial);
  return <RevoltPlayerHUD campaign={{ id: 'demo', codigo: 'DARK26', membros: [{ ficha_id: 'lia', nome: 'Lia' }], mecanicasEspeciais: state }} playerId={id} onState={setState} onOpen={jest.fn()}/>;
}
beforeEach(() => salvarMecanicasCampanha.mockImplementation(async (id, state) => state));
afterEach(() => jest.restoreAllMocks());
test('ações aparecem diretamente no tabletop sem abrir o painel', () => {
  render(<Host/>);
  expect(screen.getByRole('region', { name: 'Ações da sua frente' })).toBeInTheDocument();
  for (const action of ['Avançar', 'Reorganizar', 'Apoiar']) expect(screen.getByRole('button', { name: new RegExp(`^${action}`) })).toBeEnabled();
  expect(screen.getByText('Organização Popular')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('escolher a ação rola a ficha do grupo e mantém efeitos pendentes até o fechamento', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(.99);
  render(<Host/>);
  fireEvent.click(screen.getByRole('button', { name: /^Avançar/ }));
  expect(await screen.findByText('Influência · 5 êxito(s) / DT 2')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Avançar/ })).not.toBeInTheDocument();
  const state = salvarMecanicasCampanha.mock.calls[0][1];
  expect(state.events[0].revolt.plans.popular.groupTest).toMatchObject({ source: 'group', groupName: 'Organização Popular', dados: [6,6,6,6,6] });
  expect(state.events[0].revolt.fronts.popular.position).toBe(0);
  expect(state.events[0].revolt.results.popular).toBeUndefined();
});
test('Apoiar pede um alvo antes de rolar', async () => {
  render(<Host/>);
  fireEvent.click(screen.getByRole('button', { name: /^Apoiar/ }));
  expect(salvarMecanicasCampanha).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Apoiar Comunicações · rolar' }));
  await waitFor(() => expect(salvarMecanicasCampanha).toHaveBeenCalled());
  expect(salvarMecanicasCampanha.mock.calls[0][1].events[0].revolt.plans.popular).toMatchObject({ type: 'support', target: 'communications', groupTest: { source: 'group' } });
});
test('frente sem designação e operação pausada não oferecem ações', () => {
  const { unmount } = render(<Host id="outro"/>);
  expect(screen.getByText(/Aguarde o mestre designar/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Avançar/ })).not.toBeInTheDocument();
  unmount();
  const paused = applyMechanicAction(setup(), { id: 'r', type: 'pause' });
  render(<Host initial={paused}/>);
  expect(screen.getByText('Operação pausada pelo mestre.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Avançar/ })).not.toBeInTheDocument();
});
