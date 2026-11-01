import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SpecialMechanics, { SpecialMechanicsDialog } from './SpecialMechanics';
import { applyMechanicAction, emptyMechanics } from '../../utils/specialMechanics';
import { salvarMecanicasCampanha, buscarCampanhaPorCodigo } from '../../services/mesaApi';
import { buscarPersonagem } from '../../services/personagemApi';
import { criarBaseV1 } from '../../data/absolutoV1';
jest.mock('../../services/mesaApi', () => ({ salvarMecanicasCampanha: jest.fn(), buscarCampanhaPorCodigo: jest.fn() }));
jest.mock('../../services/personagemApi', () => ({ buscarPersonagem: jest.fn() }));
const prepared = () => applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'towerDefense', id: 'td', config: { name: 'Defender o portão', waves: 1, enemies: 1 } });
const active = () => applyMechanicAction(prepared(), { type: 'start', id: 'td' });
function Host({ initial = prepared(), master = true, playerId = '', members = [] }) {
  const [state, setState] = useState(initial);
  return <SpecialMechanics campaign={{ id: 'camp', codigo: 'CAMP', membros: members, cenaAtiva: { dificuldades: { ambiente: 5 } }, mecanicasEspeciais: state }} master={master} playerId={playerId} onState={setState}/>;
}
beforeEach(() => { salvarMecanicasCampanha.mockImplementation(async (id, state) => state); buscarPersonagem.mockResolvedValue(criarBaseV1({ forca: 2, fonitude: 2, inteligencia: 3, vontade: 2, reflexos: 2 }, { razao: 3 })); });
afterEach(() => jest.restoreAllMocks());
test('mestre inicia e resolve uma onda usando o mesmo painel dos dois tabletops', async () => {
  render(<Host/>);
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar mecânica' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar próxima onda' }));
  const kill = await screen.findByRole('button', { name: 'Inimigo derrotado' });
  await waitFor(() => expect(kill).toBeEnabled());
  fireEvent.click(kill);
  const finish = screen.getByRole('button', { name: /Concluir onda/ });
  await waitFor(() => expect(finish).toBeEnabled());
  fireEvent.click(finish);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Iniciar próxima onda' })).not.toBeInTheDocument());
  expect(screen.getByText('Vitória')).toBeInTheDocument();
});
test('jogadores acompanham eventos ativos sem controles de mestre e não veem preparações', () => {
  const { rerender } = render(<SpecialMechanics campaign={{ mecanicasEspeciais: prepared() }} master={false}/>);
  expect(screen.queryByText('Defender o portão')).not.toBeInTheDocument();
  rerender(<SpecialMechanics campaign={{ mecanicasEspeciais: active() }} master={false}/>);
  expect(screen.getByText('Defender o portão')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Preparar|Pausar|onda|Construir|vitória/ })).not.toBeInTheDocument();
  expect(salvarMecanicasCampanha).not.toHaveBeenCalled();
});
test('falha no salvamento mantém o estado anterior e mostra o erro', async () => {
  salvarMecanicasCampanha.mockRejectedValue(new Error('Sem conexão'));
  render(<Host/>);
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar mecânica' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
  expect(screen.getByRole('button', { name: 'Iniciar mecânica' })).toBeEnabled();
});
test('painel lateral usa portal sem bloquear a página e fecha por Escape', () => {
  const close = jest.fn();
  const { container, unmount } = render(<SpecialMechanicsDialog campaign={{ mecanicasEspeciais: active() }} onClose={close}/>);
  const dialog = screen.getByRole('dialog', { name: 'Mecânicas especiais da campanha' });
  expect(container.contains(dialog)).toBe(false);
  expect(document.body.style.overflow).not.toBe('hidden');
  expect(dialog).not.toHaveAttribute('aria-modal', 'true');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(close).toHaveBeenCalled();
  unmount();
  expect(document.body.style.overflow).not.toBe('hidden');
});

test('recolher preserva o formulário e ampliar altera apenas a janela', () => {
  render(<SpecialMechanicsDialog campaign={{ id: 'camp', mecanicasEspeciais: active() }} master onClose={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button', { name: '+ Preparar mecânica' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome', exact: true }), { target: { value: 'Operação em preparação' } });
  fireEvent.click(screen.getByRole('button', { name: 'Recolher', exact: true }));
  expect(screen.queryByRole('textbox', { name: 'Nome', exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Restaurar', exact: true })).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar', exact: true }));
  expect(screen.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue('Operação em preparação');
  fireEvent.click(screen.getByRole('button', { name: 'Ampliar', exact: true }));
  expect(screen.getByRole('dialog')).toHaveClass('is-expanded');
  fireEvent.click(screen.getByRole('button', { name: 'Compactar', exact: true }));
  expect(screen.getByRole('dialog')).not.toHaveClass('is-expanded');
});

test('clicar fora e usar Tab não fecha nem prende o foco no painel', () => {
  const close = jest.fn();
  render(<><button>Mapa da sessão</button><SpecialMechanicsDialog campaign={{ mecanicasEspeciais: active() }} onClose={close}/></>);
  fireEvent.click(screen.getByRole('button', { name: 'Mapa da sessão' }));
  expect(close).not.toHaveBeenCalled();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  screen.getByRole('dialog').dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(false);
});

const revoltState = () => applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'revolt', id: 'revolt', config: { name: 'Revolta de Brasília' } });

const participantMembers = [{ ficha_id: 'lia', nome: 'Lia' }, { ficha_id: 'joao', nome: 'João' }];
function assignedState(mode) {
  let state = applyMechanicAction(emptyMechanics(), { type: 'create', kind: 'revolt', id: 'revolt', config: { name: 'Revolta designada', fronts: { popular: { players: ['lia'], difficulty: 2 }, communications: { players: ['joao'] } } } });
  state = applyMechanicAction(state, { id: 'revolt', type: 'start' });
  if (mode) {
    for (const front of ['popular', 'communications', 'supplies']) state = applyMechanicAction(state, { type: 'revoltPlan', id: 'revolt', front, plan: front === 'popular' ? { type: 'advance', mode } : { type: 'regroup' } });
    state = applyMechanicAction(state, { id: 'revolt', type: 'revoltLock' });
  }
  return state;
}
test('jogador designado escolhe a ação da própria frente sem controles de mestre', async () => {
  render(<Host initial={assignedState()} master={false} playerId="lia" members={participantMembers}/>);
  expect(screen.getByRole('button', { name: 'Escolher e rolar · Popular' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Registrar escolha de Comunicações' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Travar escolhas e resolver rodada' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Escolher e rolar · Popular' }));
  await waitFor(() => expect(salvarMecanicasCampanha).toHaveBeenCalled());
  expect(salvarMecanicasCampanha.mock.calls[0][1].events[0].revolt.plans.popular.actorId).toBe('lia');
});
test('mestre acompanha frente designada sem inserir dado ou resultado pelo jogador', () => {
  render(<Host initial={assignedState('lead')} members={participantMembers}/>);
  expect(screen.queryByRole('button', { name: 'Rolar 1d6 · Popular' })).not.toBeInTheDocument();
  expect(screen.queryByRole('spinbutton', { name: 'Dado do jogador · Popular' })).not.toBeInTheDocument();
  expect(screen.getByText('Aguardando a rolagem de um jogador designado a esta frente.')).toBeInTheDocument();
});
test('jogador faz teste com a ficha pronta do grupo e DT 2, embora a cena esteja em 5', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(.99);
  render(<Host initial={assignedState('personal')} master={false} playerId="lia" members={participantMembers}/>);
  const roll = screen.getByRole('button', { name: 'Rolar teste de ABSOLUTO · Popular' });
  await waitFor(() => expect(roll).toBeEnabled());
  fireEvent.click(roll);
  expect(await screen.findByText('DT 2 da Revolta · 2 êxito(s) · Sucesso')).toBeInTheDocument();
  expect(buscarPersonagem).not.toHaveBeenCalled();
  const saved = salvarMecanicasCampanha.mock.calls[0][1];
  expect(saved.events[0].revolt.fronts.popular.position).toBe(1);
});
test('conflito entre janelas reaplica a ação sem rolar o dado uma segunda vez', async () => {
  const state = assignedState('lead');
  const fresh = applyMechanicAction(state, { id: 'revolt', type: 'revoltRename', fronts: { supplies: { team: 'Atualizado por outra janela' } } });
  buscarCampanhaPorCodigo.mockResolvedValue({ mecanicasEspeciais: fresh });
  salvarMecanicasCampanha.mockRejectedValueOnce(Object.assign(new Error('conflito'), { code: 'MECHANIC_CONFLICT' }));
  const random = jest.spyOn(Math, 'random').mockReturnValue(.5);
  render(<Host initial={state} master={false} playerId="lia" members={participantMembers}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Rolar ficha do grupo · Popular' }));
  await waitFor(() => expect(salvarMecanicasCampanha).toHaveBeenCalledTimes(2));
  expect(random).toHaveBeenCalledTimes(3);
  const saved = salvarMecanicasCampanha.mock.calls[1][1];
  expect(saved.events[0].revolt.results.popular.test.dados).toEqual([4,4,4]);
  expect(saved.events[0].revolt.fronts.supplies.team).toBe('Atualizado por outra janela');
});
test('mestre designa fichas pelo formulário de preparação', async () => {
  render(<Host members={participantMembers}/>);
  fireEvent.click(screen.getByRole('button', { name: '+ Preparar mecânica' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Modelo' }), { target: { value: 'revolt' } });
  const group = within(screen.getByRole('group', { name: 'Popular', exact: true }));
  fireEvent.click(group.getByRole('checkbox', { name: 'Lia', exact: true }));
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Configurar frente' })).getByRole('button', { name: /Comunicações/ }));
  expect(within(screen.getByRole('group', { name: 'Comunicações', exact: true })).getByRole('checkbox', { name: /Lia/ })).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome', exact: true }), { target: { value: 'Revolta com jogadores' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar preparação' }));
  await waitFor(() => expect(salvarMecanicasCampanha).toHaveBeenCalled());
  expect(salvarMecanicasCampanha.mock.calls[0][1].events[1].revolt.fronts.popular.players).toEqual(['lia']);
});

test('Revolta registra três escolhas antes de permitir os dados e mostra os resultados compartilhados', async () => {
  render(<Host initial={revoltState()}/>);
  expect(screen.getByRole('region', { name: 'Mecânicas especiais' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Declarar vitória' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar mecânica' }));
  const lock = await screen.findByRole('button', { name: 'Travar escolhas e resolver rodada' });
  expect(lock).toBeDisabled();
  for (const name of ['Popular', 'Comunicações', 'Suprimentos']) {
    const choice = await screen.findByRole('button', { name: `Registrar escolha de ${name}` });
    await waitFor(() => expect(choice).toBeEnabled());
    fireEvent.click(choice);
    await screen.findByRole('button', { name: `Alterar escolha de ${name}` });
  }
  await waitFor(() => expect(lock).toBeEnabled());
  fireEvent.click(lock);
  const input = await screen.findByRole('spinbutton', { name: 'Dado do jogador · Popular' });
  fireEvent.change(input, { target: { value: '4' } });
  const register = screen.getByRole('button', { name: 'Registrar dado · Popular' });
  await waitFor(() => expect(register).toBeEnabled());
  fireEvent.click(register);
  expect(await within(screen.getByRole('article', { name: 'Frente Popular' })).findByText(/4 no d6 \+1 organização = 5: conquistou sem desgaste/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Encerrar rodada 1' })).toBeDisabled();
});

test('jogadores veem o quadro da Revolta sem poder escolher, rolar pelo mestre ou editar', () => {
  const activeRevolt = applyMechanicAction(revoltState(), { type: 'start', id: 'revolt' });
  render(<Host initial={activeRevolt} master={false}/>);
  for (const name of ['Popular', 'Comunicações', 'Suprimentos']) expect(screen.getByRole('article', { name: `Frente ${name}` })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Registrar|Travar|Rolar 1d6/ })).not.toBeInTheDocument();
  expect(screen.queryByText('Designar jogadores, DTs e locais')).not.toBeInTheDocument();
});

test('preparação da Revolta oferece grupos e os doze locais sem campos de Tower Defense', async () => {
  render(<Host/>);
  fireEvent.click(screen.getByRole('button', { name: '+ Preparar mecânica' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Modelo' }), { target: { value: 'revolt' } });
  expect(screen.getByRole('textbox', { name: 'Grupo / integrantes de Popular' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Percurso', exact: true }));
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Configurar frente' })).getByRole('button', { name: /Comunicações/ }));
  expect(screen.getByRole('textbox', { name: 'Comunicações · posição 2' })).toHaveValue('Central de transmissão');
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Configurar frente' })).getByRole('button', { name: /Suprimentos/ }));
  expect(screen.getByRole('textbox', { name: 'Suprimentos · posição 4' })).toHaveValue('Acesso de serviço');
  expect(screen.queryByRole('spinbutton', { name: 'Integridade da base' })).not.toBeInTheDocument();
});

test('trocar seções e frentes preserva as alterações da ficha do grupo', async () => {
  render(<Host members={participantMembers}/>);
  fireEvent.click(screen.getByRole('button', { name: '+ Preparar mecânica' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Modelo' }), { target: { value: 'revolt' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ficha do grupo', exact: true }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Força · Popular' }), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Domínios', exact: true }));
  const picker = within(screen.getByRole('navigation', { name: 'Configurar frente' }));
  fireEvent.click(picker.getByRole('button', { name: /Comunicações/ }));
  fireEvent.click(picker.getByRole('button', { name: /Popular/ }));
  expect(screen.getByRole('spinbutton', { name: 'Força · Popular' })).toHaveValue(4);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar preparação' }));
  await waitFor(() => expect(salvarMecanicasCampanha).toHaveBeenCalled());
  expect(salvarMecanicasCampanha.mock.calls[0][1].events[1].revolt.fronts.popular.sheet.atributos.forca).toBe(4);
});

test('benefício troca para um alvo elegível se a frente selecionada chegar à sede durante a resolução', async () => {
  let state = applyMechanicAction(revoltState(), { type: 'start', id: 'revolt' });
  state.events[0].revolt.fronts.popular.position = 3;
  state.events[0].revolt.fronts.communications.position = 1;
  for (const front of ['popular', 'communications', 'supplies']) state = applyMechanicAction(state, { type: 'revoltPlan', id: 'revolt', front, plan: front === 'supplies' ? { type: 'regroup' } : { type: 'advance', mode: 'personal' } });
  state = applyMechanicAction(state, { type: 'revoltLock', id: 'revolt' });
  state = applyMechanicAction(state, { type: 'revoltResolve', id: 'revolt', front: 'communications', success: true });
  const onState = jest.fn();
  const { rerender } = render(<SpecialMechanics campaign={{ id: 'camp', mecanicasEspeciais: state }} master onState={onState}/>);
  expect(screen.getByRole('combobox', { name: 'Destino do benefício de Comunicações' })).toHaveValue('popular');
  state = applyMechanicAction(state, { type: 'revoltResolve', id: 'revolt', front: 'popular', success: true });
  rerender(<SpecialMechanics campaign={{ id: 'camp', mecanicasEspeciais: state }} master onState={onState}/>);
  expect(screen.getByRole('combobox', { name: 'Destino do benefício de Comunicações' })).toHaveValue('supplies');
  fireEvent.click(screen.getByRole('button', { name: 'Entregar benefício de Comunicações' }));
  await waitFor(() => expect(onState).toHaveBeenCalled());
  expect(onState.mock.calls[0][0].events[0].revolt.fronts.supplies.bonus).toBe(1);
});
