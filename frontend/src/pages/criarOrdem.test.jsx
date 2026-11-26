import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CriarOrdem from './criarOrdem';
import { createAgent, creationState, initialRituals, origins } from '../services/ordemCreation';
import { readOrdemSheets } from '../services/ordemSheet';

beforeEach(() => localStorage.clear());

test('cria a ficha direto da origem com os benefícios já definidos', () => {
  const onCreated = jest.fn();
  render(<CriarOrdem onCreated={onCreated} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reduzir Agilidade' }));
  expect(screen.getByRole('button', { name: 'Reduzir Força' })).toBeDisabled();
  for (const attribute of ['Força', 'Força', 'Vigor', 'Vigor', 'Presença']) {
    fireEvent.click(screen.getByRole('button', { name: `Aumentar ${attribute}` }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('button', { name: /Combatente/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.change(screen.getByLabelText('Buscar origens'), { target: { value: 'militar' } });
  fireEvent.click(screen.getByRole('button', { name: 'Militar' }));
  expect(screen.getByRole('heading', { name: 'Para Bellum' })).toBeInTheDocument();
  expect(screen.queryByText('Identidade e treinamento')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Criar ficha' }));
  const [saved] = readOrdemSheets();
  expect(onCreated).toHaveBeenCalledWith(saved.id);
  expect(saved).toMatchObject({
    nome: '', classe: 'Combatente', origem: 'Militar',
    resources: { pv: { current: 23, max: 23 }, san: { max: 12 }, pe: { max: 4 } },
    skills: { Pontaria: { rank: 5 }, Tática: { rank: 5 } },
  });
  expect(Object.keys(saved.skills)).toEqual(['Pontaria', 'Tática']);
  expect(saved.abilities.map(ability => ability.name)).toEqual(['Para Bellum', 'Ataque Especial', 'Proficiências']);
});

test('prévia contabiliza poder inicial do Cultista e o treinamento duplicado do Ocultista', () => {
  const draft = {
    origem: 'Cultista Arrependido', classe: 'Ocultista', attributes: { AGI: 1, FOR: 1, INT: 3, PRE: 2, VIG: 2 },
    power: 'Aprender Ritual', originSkills: [], originDetail: '', expert: [], combatSkills: [],
    freeSkills: [], rituals: [], element: '', nome: 'Teste', jogador: '', concept: '',
  };
  expect(Object.keys(origins)).toHaveLength(26);
  expect(initialRituals.filter(ritual => ritual.name.startsWith('Amaldiçoar Arma'))).toHaveLength(4);
  expect(creationState(draft)).toMatchObject({ ritualCount: 4, freeCount: 7, resources: { pv: 14, pe: 6, san: 10 } });
  expect(() => createAgent(draft)).toThrow();
});
