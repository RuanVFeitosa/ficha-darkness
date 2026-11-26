import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FichaOrdem from './fichaOrdem';
import { compressProfileImage } from '../services/imageCompression';
import { newOrdemSheet, readOrdemSheets, rituals, rollOrdemDamage, rollOrdemTest, writeOrdemSheets } from '../services/ordemSheet';
import { buscarCampanhaPorCodigo, vincularFicha } from '../services/mesaApi';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});
jest.mock('../services/imageCompression', () => ({ compressProfileImage: jest.fn() }));
jest.mock('../services/mesaApi', () => ({ buscarCampanhaPorCodigo: jest.fn(), vincularFicha: jest.fn() }));

test('a mesa abre somente o agente solicitado e oculta a navegação externa da ficha', () => {
  writeOrdemSheets([{ ...newOrdemSheet(), id: 'lia', nome: 'Lia' }, { ...newOrdemSheet(), id: 'rui', nome: 'Rui' }]);
  window.history.replaceState({}, '', '/?ordem=1&agente=rui&embed=mesa');
  const { rerender } = render(<FichaOrdem />);
  expect(screen.getByRole('heading', { name: 'Rui' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Selecionar agente')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Modo de edição' })).toBeInTheDocument();

  window.history.replaceState({}, '', '/?ordem=1&agente=ausente&embed=mesa');
  rerender(<FichaOrdem />);
  expect(screen.getByRole('heading', { name: 'Ficha indisponível neste navegador' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Lia' })).not.toBeInTheDocument();
});

test('vincula o agente pelo código informado e exibe falhas de vínculo na ficha', async () => {
  const agent = { ...newOrdemSheet(), nome: 'Lia' };
  writeOrdemSheets([agent]);
  buscarCampanhaPorCodigo.mockResolvedValue({ id: 'mesa-ordem', sistema: 'ordem' });
  vincularFicha.mockRejectedValueOnce(new Error('Falha ao salvar vínculo.'));
  render(<FichaOrdem />);
  fireEvent.change(screen.getByLabelText('Código da campanha'), { target: { value: ' test35 ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tabletop 2D' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar vínculo.');
  expect(buscarCampanhaPorCodigo).toHaveBeenCalledWith('TEST35');
  expect(vincularFicha).toHaveBeenCalledWith('mesa-ordem', `ordem:${agent.id}`, { nome: 'Lia' });
});

test('salva o tema da Ordem e restaura o visual padrão', () => {
  const { unmount } = render(<FichaOrdem />);
  fireEvent.click(screen.getByRole('button', { name: 'Personalização' }));
  fireEvent.click(screen.getByRole('button', { name: 'Energia', exact: true }));
  expect(readOrdemSheets()[0].theme.id).toBe('elemento-energia');
  fireEvent.click(screen.getByRole('button', { name: 'Temas LGBTQIA+' }));
  fireEvent.click(screen.getByRole('button', { name: 'Transgênero' }));
  expect(readOrdemSheets()[0].theme.id).toBe('trans');
  fireEvent.change(screen.getByLabelText('Faixa 1'), { target: { value: '#8844aa' } });
  expect(readOrdemSheets()[0].theme).toMatchObject({ id: 'custom' });
  unmount();

  render(<FichaOrdem />);
  fireEvent.click(screen.getByRole('button', { name: 'Personalização' }));
  expect(screen.getByLabelText('Faixa 1')).toHaveValue('#8844aa');
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }));
  expect(readOrdemSheets()[0].theme.id).toBeNull();
});

test('pega armas na Ivete e escolhe uma trilha ao avançar na Sala de Transcendência', () => {
  const agent = newOrdemSheet();
  writeOrdemSheets([{ ...agent, classe: 'Combatente' }]);
  render(<FichaOrdem />);
  fireEvent.click(screen.getByRole('button', { name: 'Loja da Ivete' }));
  fireEvent.change(screen.getByLabelText('Buscar equipamento'), { target: { value: 'pistola' } });
  fireEvent.click(screen.getByRole('button', { name: 'Pistola', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Pegar Pistola', exact: true }));
  expect(readOrdemSheets()[0].inventory).toEqual([expect.objectContaining({ name: 'Pistola', quantity: 1 })]);
  expect(readOrdemSheets()[0].attacks).toEqual([expect.objectContaining({ name: 'Pistola', detail: '1d12', skill: 'Pontaria' })]);
  fireEvent.click(screen.getByRole('button', { name: /Todas as salas/ }));
  fireEvent.click(screen.getByRole('button', { name: /Sala de Transcendência/ }));
  expect(screen.queryByLabelText('Trilha de classe')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Avançar para 10%' }));
  fireEvent.change(screen.getByLabelText('Trilha de classe'), { target: { value: 'Aniquilador' } });
  expect(readOrdemSheets()[0]).toMatchObject({ nex: 10, limitePe: 2, trilha: 'Aniquilador' });
  expect(readOrdemSheets()[0].abilities).toEqual([expect.objectContaining({ name: 'A Favorita' })]);
});

test('agrupa poderes por tag e guarda turnos entre ocorrências na mesma cena', () => {
  const { unmount } = render(<FichaOrdem />);
  fireEvent.click(screen.getByRole('button', { name: 'Sala da Agatha' }));
  fireEvent.click(screen.getByRole('button', { name: 'Poderes Paranormais', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Energia', exact: true }));
  expect(screen.queryByText('Anatomia Insana', { exact: true })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Buscar no catálogo'), { target: { value: 'afortunado' } });
  fireEvent.click(screen.getByText('Afortunado', { exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar Afortunado' }));
  expect(screen.queryByRole('button', { name: 'Adicionar Afortunado' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Voltar à ficha/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Habilidades' }));
  expect(within(screen.getByRole('region', { name: 'Habilidades adquiridas' })).getByText('Afortunado')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Adicionar poder personalizado'));
  fireEvent.change(screen.getByLabelText('Poder'), { target: { value: 'Poder de teste' } });
  fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'Classe' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar poder' }));
  expect(screen.getByRole('heading', { name: 'Classe' })).toBeInTheDocument();

  const manager = within(screen.getByRole('region', { name: 'Gerenciador de condições' }));
  fireEvent.change(manager.getByLabelText('Condição'), { target: { value: 'Morrendo' } });
  fireEvent.click(manager.getByRole('button', { name: 'Adicionar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Modo de edição' }));
  fireEvent.change(screen.getByLabelText('Máx. PV'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Máx. SAN'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Morrendo: 1 de 3 turnos' }));
  expect(screen.getByRole('group', { name: 'Turnos em Enlouquecendo: 0/3' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Pontos de vida' }));
  expect(screen.queryByRole('group', { name: /Turnos em Morrendo/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reduzir Pontos de vida' }));
  fireEvent.click(manager.getByRole('button', { name: 'Encerrar Morrendo' }));
  unmount();
  render(<FichaOrdem />);
  expect(screen.getByRole('group', { name: 'Turnos em Morrendo: 1/3' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zerar para nova cena' }));
  expect(screen.getByRole('group', { name: 'Turnos em Morrendo: 0/3' })).toBeInTheDocument();
});

test('salva o retrato de um agente novo e recupera a imagem ao reabrir a ficha', async () => {
  compressProfileImage.mockResolvedValueOnce('data:image/png;base64,AA==');
  const { unmount } = render(<FichaOrdem />);
  fireEvent.change(screen.getByLabelText('Arquivo do retrato'), {
    target: { files: [new File(['imagem'], 'retrato.png', { type: 'image/png' })] },
  });
  expect(await screen.findByRole('img', { name: 'Retrato de Novo agente' })).toBeInTheDocument();
  expect(readOrdemSheets()).toHaveLength(1);
  unmount();
  render(<FichaOrdem />);
  expect(await screen.findByRole('img', { name: 'Retrato de Novo agente' })).toHaveAttribute('src', 'data:image/png;base64,AA==');
});

test('aplica o maior dado no teste normal e o menor para atributo zero', () => {
  const results = () => {
    const values = [0.2, 0.65];
    return () => values.shift();
  };
  expect(rollOrdemTest(2, 0, 5, results())).toMatchObject({ dice: [5, 14], chosen: 14, total: 19 });
  expect(rollOrdemTest(0, 0, 5, results())).toMatchObject({ dice: [5, 14], chosen: 5, total: 10 });
  expect(rollOrdemTest(2, -2, 0, () => 0.5).dice).toHaveLength(4);
  expect(rollOrdemDamage('2d6+3', () => 0.5)).toMatchObject({ dice: [4, 4], total: 11 });
});

test('mantém agentes independentes e restaura um ritual selecionado do catálogo', () => {
  expect(rituals.length).toBeGreaterThan(75);
  const { unmount } = render(<FichaOrdem />);
  fireEvent.change(screen.getByLabelText('Equip.'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Outros'), { target: { value: '3' } });
  expect(screen.getByLabelText('Defesa total')).toHaveTextContent('16');
  expect(screen.getByLabelText('Bloqueio')).toHaveTextContent('—');
  fireEvent.change(screen.getByLabelText('Treinamento em Fortitude'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Treinamento em Reflexos'), { target: { value: '5' } });
  expect(screen.getByLabelText('Bloqueio')).toHaveTextContent('5');
  expect(screen.getByLabelText('Esquiva')).toHaveTextContent('21');
  expect(screen.getByRole('region', { name: 'Perícias', exact: true })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Rituais' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Nome do agente')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Treinamento em Acrobacia'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Extra em Acrobacia'), { target: { value: '2' } });
  expect(screen.getByLabelText('Bônus total de Acrobacia')).toHaveTextContent('(7)');
  expect(readOrdemSheets()[0].skills.Acrobacia).toEqual({ rank: 5, extra: 2 });
  fireEvent.click(screen.getByRole('button', { name: 'Modo de edição' }));
  fireEvent.change(screen.getByLabelText('Nome do agente'), { target: { value: 'Lia' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rituais', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Consultar catálogo' }));
  fireEvent.change(screen.getByLabelText('Buscar ritual'), { target: { value: 'cicatrizacao' } });
  fireEvent.click(screen.getByRole('button', { name: 'Morte', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Círculo II', exact: true }));
  expect(screen.queryByText('Cicatrização', { exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Círculo I', exact: true }));
  expect(screen.queryByRole('article', { name: 'Detalhes de Cicatrização' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Cicatrização', { exact: true }));
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Rolar Cicatrização · Discente · 5d8+5 · Cura' }));
    expect(screen.getByLabelText('Resultado da rolagem')).toHaveTextContent('10');
  } finally {
    random.mockRestore();
  }
  const ritualCard = within(screen.getByRole('article', { name: 'Detalhes de Cicatrização' }));
  expect(ritualCard.getByText('Execução:')).toBeInTheDocument();
  expect(ritualCard.getByText('Discente (+2 PE):')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à ficha' }));
  fireEvent.click(screen.getByRole('button', { name: /Voltar à ficha/ }));
  expect(screen.getByRole('link', { name: 'Nova ficha' })).toHaveAttribute('href', '/?ordem=1&criar=1');
  writeOrdemSheets([...readOrdemSheets(), newOrdemSheet()]);
  unmount();

  render(<FichaOrdem />);
  expect(screen.getByLabelText('Defesa total')).toHaveTextContent('16');
  expect(screen.getByRole('heading', { name: 'Lia' })).toBeInTheDocument();
  expect(within(screen.getByLabelText('Selecionar agente')).getAllByRole('option')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Rituais', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Sangue', exact: true }));
  expect(screen.queryByText('Cicatrização', { exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(screen.getByText('Cicatrização', { exact: true })).toBeInTheDocument();
});
