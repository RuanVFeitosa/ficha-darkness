import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EspiralEncounterViewer from './EspiralEncounterViewer';
import { createEspiralEncounter } from '../../utils/espiralEncounters';

test('mostra dados Espiral, ataques e lesões sem inventar integridade por membro', () => {
  const record = { ...createEspiralEncounter('npc','guard'), name: 'Guarda', profileImage: '/portrait.png', injuries: [{ id:'injury', region:'Torso', severity:'Moderada', note:'Queda' }] };
  render(<EspiralEncounterViewer record={record} onChange={jest.fn()} />);
  expect(screen.getByRole('heading', { name:'Guarda' })).toBeInTheDocument();
  expect(screen.getByLabelText('Integridade')).toHaveValue(35);
  expect(screen.getByText('Pulso')).toBeInTheDocument();
  expect(screen.getByText('Razão')).toBeInTheDocument();
  expect(screen.getByText('Desarmado')).toBeInTheDocument();
  expect(screen.getByText('Torso · Moderada')).toBeInTheDocument();
  expect(screen.queryByText('Integridade dos membros')).not.toBeInTheDocument();
});

test('atualiza o estado Espiral e os campos de compatibilidade preservando o vínculo', () => {
  const onChange = jest.fn();
  const record = { ...createEspiralEncounter('inimigo','linked'), inimigo_ref:'espiral:original' };
  render(<EspiralEncounterViewer record={record} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Sanidade'), { target:{ value:'6' } });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id:'linked', inimigo_ref:'espiral:original', sanity:6, sanidade:{atual:6,max:10} }));
  fireEvent.change(screen.getByLabelText('Integridade'), { target:{ value:'999' } });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ integrity:35, integridade:{atual:35,max:35} }));
});

test('armas ficam expostas e recursos sem pontos não aparecem', () => {
  const record = { ...createEspiralEncounter('npc', 'guard'), resources:{Armas:2, Pontaria:0}, weapons:[{id:'a',name:'Pistola',damage:'1d6'},{id:'b',name:'Faca',damage:'1d4'}] };
  render(<EspiralEncounterViewer record={record} onChange={jest.fn()} />);
  expect(screen.getByText('Pistola').closest('details')).toBeNull();
  expect(screen.getByText('Faca')).toBeVisible();
  expect(screen.getByText('Armas')).toBeVisible();
  expect(screen.queryByText('Pontaria')).not.toBeInTheDocument();
});

test('seleciona membro, registra e remove uma lesão preservando as demais', () => {
  Object.defineProperty(global, 'crypto', { configurable:true, value:{randomUUID:() => 'new-injury'} });
  const initial = { ...createEspiralEncounter('npc','guard'), injuries:[{id:'old',region:'Torso',severity:'Moderada'}] };
  function Viewer() {
    const [record, setRecord] = React.useState(initial);
    return <EspiralEncounterViewer record={record} onChange={setRecord} />;
  }
  render(<Viewer />);
  fireEvent.click(screen.getByRole('button', {name:'Braço direito Sem lesões'}));
  fireEvent.change(screen.getByLabelText('Gravidade'), {target:{value:'Grave'}});
  fireEvent.change(screen.getByLabelText('Nota da lesão'), {target:{value:'Corte'}});
  fireEvent.click(screen.getByRole('button', {name:'Registrar lesão'}));
  expect(screen.getByText('Braço direito · Grave')).toBeVisible();
  expect(screen.getByText('Corte')).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name:'Remover lesão Braço direito Grave'}));
  expect(screen.queryByText('Braço direito · Grave')).not.toBeInTheDocument();
  expect(screen.getByText('Torso · Moderada')).toBeVisible();
});
