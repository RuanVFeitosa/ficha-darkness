import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaginaJogador, { catalogoBuilds } from './PaginaJogador';
import { entrarJogador, carregarFicha } from '../services/jogadorApi';
import { salvarJogador } from '../services/personagemApi';
import { buscarCampanhaPorCodigo, listarCampanhasDaFicha } from '../services/mesaApi';

test('lista campanhas vinculadas e abre os detalhes pelo perfil', async () => {
  const onNavigate = jest.fn();
  buscarCampanhaPorCodigo.mockResolvedValue({
    id: 'c1', codigo: 'MESA13', nome: 'Campanha', membros: [{ id: 'm1', ficha_id: '1234', nome: 'Ana' }],
  });
  render(<PaginaJogador codigo="1234" onNavigate={onNavigate} />);
  fireEvent.click(await screen.findByRole('button', { name: /Campanhas/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Acessar campanha' }));
  expect(await screen.findByRole('link', { name: 'Entrar no Tabletop' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Áreas do jogador' })).toBeInTheDocument();
  expect(onNavigate).not.toHaveBeenCalled();
});

test('entra por código sem ficha e salva a campanha no perfil', async () => {
  entrarJogador.mockResolvedValue({ nome: 'Ruan', tema: 'escuro', personagens: [], builds: [] });
  buscarCampanhaPorCodigo.mockResolvedValue({ id: 'new', codigo: 'NOIT43', nome: 'Noite', sistema: 'ordem' });
  const onNavigate = jest.fn();
  render(<PaginaJogador codigo="1234" onNavigate={onNavigate} />);
  fireEvent.click(await screen.findByRole('button', { name: /Campanhas/ }));
  const join = screen.getByRole('button', { name: 'Entrar na campanha' });
  await waitFor(() => expect(join).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Código da campanha'), { target: { value: 'noit43' } });
  fireEvent.click(join);
  expect(await screen.findByRole('heading', { name: 'Personagens da campanha' })).toBeInTheDocument();
  expect(onNavigate).not.toHaveBeenCalled();
  expect(salvarJogador).toHaveBeenCalledWith('1234', expect.objectContaining({ campanhas: ['NOIT43'] }));
});

test('bloqueia o sétimo código sem impedir o acesso às campanhas já salvas', async () => {
  const campanhas = ['MESA01', 'MESA02', 'MESA03', 'MESA04', 'MESA05', 'MESA06'];
  entrarJogador.mockResolvedValue({ nome: 'Ruan', tema: 'escuro', personagens: [], builds: [], campanhas });
  buscarCampanhaPorCodigo.mockImplementation(async codigo => ({ id: codigo, codigo, nome: codigo }));
  render(<PaginaJogador codigo="1234" />);
  fireEvent.click(await screen.findByRole('button', { name: /Campanhas/ }));
  expect(await screen.findAllByRole('button', { name: 'Acessar campanha' })).toHaveLength(6);
  fireEvent.change(screen.getByLabelText('Código da campanha'), { target: { value: 'MESA07' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na campanha' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Você já está em 6 campanhas.');
  expect(salvarJogador).not.toHaveBeenCalled();
});
import { prepararFotoPerfil } from '../utils/playerProfilePhoto';
import { confirmarDialogo } from '../components/ui/DialogoGlobal';
import { excluirFichaJogador } from '../services/excluirFichaJogador';
import { writeOrdemSheets } from '../services/ordemSheet';
jest.mock('../services/excluirFichaJogador',()=>({excluirFichaJogador:jest.fn()}));
jest.mock('../components/ui/DialogoGlobal',()=>({...jest.requireActual('../components/ui/DialogoGlobal'),confirmarDialogo:jest.fn()}));
jest.mock('../utils/playerProfilePhoto', () => ({ prepararFotoPerfil: jest.fn() }));
jest.mock('../services/jogadorApi', () => ({ ...jest.requireActual('../services/jogadorApi'), entrarJogador: jest.fn(), carregarFicha: jest.fn() }));
jest.mock('../services/personagemApi', () => ({ salvarJogador: jest.fn() }));
jest.mock('../services/mesaApi', () => ({ listarCampanhasDaFicha: jest.fn(), buscarCampanhaPorCodigo: jest.fn(), resolverCapaCampanha: async campaign => campaign }));
jest.mock('../components/ui/ComputadorModerno',()=>()=> <div>PC interativo</div>);
jest.mock('../components/midia/ReprodutorCassete',()=>()=> <div>Fita interativa</div>);
beforeEach(()=>{
  localStorage.clear();
  jest.clearAllMocks();
  entrarJogador.mockResolvedValue({nome:'Ruan',tema:'escuro',personagens:[{id:'1234',sistema:'darkness'}],builds:[]});
  carregarFicha.mockImplementation(async ref => ({...ref,nome:'Ana',foto:'/ana.png',dados:{}}));
  listarCampanhasDaFicha.mockResolvedValue([{id:'c1',codigo:'MESA13',nome:'Campanha',documentosInvestigacao:[{id:'doc1',nome:'Computador',mimeType:'modern-pc',revelada:true},{id:'doc2',nome:'Segredo',revelada:false}]}]);
  salvarJogador.mockImplementation(async(codigo,p)=>p);
});
test('um mestre entra em outra mesa com seu personagem e papel de jogador', async () => {
  const onNavigate = jest.fn();
  buscarCampanhaPorCodigo.mockResolvedValue({ codigo: 'TEST12', sistema: 'absoluto', tabletop_tipo: '3d' });
  render(<PaginaJogador codigo="1234" mestreId="mestre-teste" onNavigate={onNavigate} />);
  fireEvent.change(await screen.findByLabelText('Código da campanha'), { target: { value: 'TEST12' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar como jogador' }));
  await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('/?campanha=TEST12&papel=jogador&sistema=absoluto&vinculo=1234&origem=mestre'));
});
test('mostra apenas agentes de Ordem vinculados ao perfil', async () => {
  writeOrdemSheets([{ id: 'agente-1', nome: 'Riley', jogadorOrigem: '1234', classe: 'Especialista', nex: 15,
    attributes: { AGI: 2 }, resources: { pv: { current: 12, max: 15 } } },
    { id: 'agente-2', nome: 'Agente avulso' },
    { id: 'agente-3', nome: 'Outro agente', jogadorOrigem: '5678' }]);
  render(<PaginaJogador codigo="1234"/>);
  expect(await screen.findByRole('link', { name: 'Abrir ficha de Riley' })).toHaveAttribute(
    'href', '?ordem=1&agente=agente-1&jogadorOrigem=1234',
  );
  expect(await screen.findByRole('link', { name: 'Abrir ficha de Ana' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Abrir ficha de Agente avulso' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Abrir ficha de Outro agente' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver resumo de Riley' }));
  expect(screen.getByRole('dialog', { name: 'Riley' })).toHaveTextContent('NEX 15%');
  expect(salvarJogador).not.toHaveBeenCalled();
});
test('dossiê abre resumo no toque e mantém o acesso à ficha',async()=>{
 render(<PaginaJogador codigo="1234"/>);
 const reveal=await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 expect(reveal).toHaveAttribute('href','?sistema=darkness&ficha=1234');
 expect(screen.getByRole('region',{name:'Resumo da ficha de Ana'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Consultar arquivo ↗'})).toHaveAttribute('href','?sistema=darkness&ficha=1234');
});
test('investigação só oferece documentos revelados e abre o computador',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 fireEvent.click(screen.getByRole('button',{name:/Investigação/}));
 fireEvent.click(await screen.findByRole('button',{name:/Computador/}));
 expect(screen.getByText('PC interativo')).toBeInTheDocument();expect(screen.queryByText('Segredo')).not.toBeInTheDocument();
});
test('build combina habilidades e é salva no perfil sem modificar a ficha',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 fireEvent.click(screen.getByRole('button',{name:/Builds/}));
 fireEvent.click(screen.getAllByRole('button',{name:/^Adicionar .* à build$/})[0]);
 fireEvent.change(screen.getByLabelText('Nome da build'),{target:{value:'Meu combo'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar build'}));
 await waitFor(()=>expect(salvarJogador).toHaveBeenCalledWith('1234',expect.objectContaining({builds:[expect.objectContaining({nome:'Meu combo',habilidades:expect.any(Array)})]})));
});
test('catálogo inclui especialidades Darkness e habilidades ESPIRAL',()=>{
 const catalogo=catalogoBuilds();
 expect(catalogo.some(h=>h.nome==='Ataque Furtivo')).toBe(true);
 expect(catalogo.some(h=>h.nome==='Golpe Calculado'&&h.sistema==='espiral')).toBe(true);
 expect(new Set(catalogo.map(h=>h.id)).size).toBe(catalogo.length);
});

 test('build salva uma arma junto de uma habilidade sem conceder itens à ficha',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 fireEvent.click(screen.getByRole('button',{name:/Builds/}));
 fireEvent.click(screen.getAllByRole('button',{name:/^Adicionar .* à build$/})[0]);
 fireEvent.click(screen.getByRole('button',{name:'Armas e equipamentos'}));
 fireEvent.click(screen.getByRole('button',{name:'Adicionar Pistola Sable 9mm à build'}));
 fireEvent.change(screen.getByLabelText('Nome da build'),{target:{value:'Combo armado'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar build'}));
 await waitFor(()=>expect(salvarJogador).toHaveBeenCalledWith('1234',expect.objectContaining({builds:[expect.objectContaining({nome:'Combo armado',habilidades:expect.arrayContaining(['darkness:item:pistola-sable'])})]})));
 fireEvent.click(await screen.findByRole('button',{name:'Resgatar / editar'}));
 expect(screen.getByRole('button',{name:'Remover Pistola Sable 9mm da build'})).toHaveAttribute('aria-pressed','true');
});

test('adicionar personagem abre sistemas à direita e fecha sem sair da página',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 const button=screen.getByRole('button',{name:'+ Adicionar personagem'});
 expect(button).toHaveAttribute('aria-expanded','false');
 fireEvent.click(button);
 expect(button).toHaveAttribute('aria-expanded','true');
 const panel=screen.getByRole('complementary',{name:'Adicionar personagem'});
 expect(panel).toBeInTheDocument();
 expect(screen.queryByRole('link',{name:/Escolher Absoluto/})).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:/Criar personagem/ })).toHaveAttribute('href','?criar=1&sistema=espiral&jogadorOrigem=1234');
 fireEvent.keyDown(panel,{key:'Escape'});
 expect(screen.queryByRole('complementary',{name:'Adicionar personagem'})).toBeNull();
 expect(button).toHaveFocus();
});
test('painel mantém vínculo de uma ficha existente',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 fireEvent.click(screen.getByRole('button',{name:'+ Adicionar personagem'}));
 fireEvent.click(screen.getByText('Já tenho uma ficha · vincular ao perfil'));
 fireEvent.change(screen.getByLabelText('Código do personagem'),{target:{value:'5678'}});
 fireEvent.click(screen.getByRole('button',{name:'Vincular ao perfil'}));
 await waitFor(()=>expect(salvarJogador).toHaveBeenCalledWith('1234',expect.objectContaining({personagens:expect.arrayContaining([{id:'5678',sistema:'darkness'}])})));
});

test('templates demonstram dez personagens em três páginas sem salvar no perfil',async()=>{
 render(<PaginaJogador codigo="1234"/>);await screen.findByRole('link',{name:'Abrir ficha de Ana'});
 fireEvent.click(screen.getByRole('button',{name:'Testar com 10 templates'}));
 expect(screen.getByRole('heading',{name:'Templates de teste'})).toBeInTheDocument();
 expect(screen.getAllByRole('button',{name:'Ver template ↗'})).toHaveLength(4);
 fireEvent.click(screen.getByRole('button',{name:'Página 3 de personagens'}));
 expect(screen.getAllByRole('button',{name:'Ver template ↗'})).toHaveLength(2);
 expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
 expect(salvarJogador).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Voltar aos meus personagens'}));
 expect(screen.getByRole('link',{name:'Abrir ficha de Ana'})).toBeInTheDocument();
});
test('perfil com dez personagens bloqueia adicionar outro',async()=>{
 entrarJogador.mockResolvedValue({nome:'Ruan',tema:'escuro',personagens:Array.from({length:10},(_,i)=>({id:String(i),sistema:'darkness'})),builds:[]});
 render(<PaginaJogador codigo="1234"/>);
 expect(await screen.findByRole('button',{name:'Limite de 10 personagens atingido'})).toBeDisabled();
});

test('cadastro salva nome, pronome e foto sem pedir configuração novamente', async () => {
 const onNavigate = jest.fn();
 prepararFotoPerfil.mockResolvedValue('data:image/png;base64,foto');
 const view = render(<PaginaJogador codigo="novo" onNavigate={onNavigate}/>);
 fireEvent.change(screen.getByLabelText('Nome do jogador'), { target: { value: ' Ana ' } });
 fireEvent.change(screen.getByLabelText('Pronome do jogador'), { target: { value: 'Ela' } });
 fireEvent.change(screen.getByLabelText('Senha do Jogador'), { target: { value: '012345' } });
 fireEvent.change(screen.getByLabelText(/Foto de perfil/), { target: { files: [new File(['foto'], 'foto.png', { type: 'image/png' })] } });
 expect(await screen.findByAltText('Prévia da foto de perfil')).toHaveAttribute('src', 'data:image/png;base64,foto');
 fireEvent.click(screen.getByRole('button', { name: 'Criar / acessar perfil' }));
 await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('/?jogador=012345'));
 expect(salvarJogador).toHaveBeenCalledWith('012345', expect.objectContaining({ nome: 'Ana', pronome: 'Ela', fotoPerfil: 'data:image/png;base64,foto', perfilConfigurado: true }));
 const salvo = salvarJogador.mock.calls[0][1];
 entrarJogador.mockResolvedValue(salvo);
 view.rerender(<PaginaJogador codigo="012345"/>);
 await screen.findByRole('button', { name: 'Editar perfil de Ana' });
 expect(screen.queryByRole('dialog', { name: 'Como você quer aparecer?' })).not.toBeInTheDocument();
});

test('cadastro sem foto também conclui a configuração e preserva os dados se salvar falhar', async () => {
 const onNavigate = jest.fn();
 salvarJogador.mockRejectedValueOnce(new Error('Falha ao salvar'));
 render(<PaginaJogador codigo="novo" onNavigate={onNavigate}/>);
 fireEvent.change(screen.getByLabelText('Nome do jogador'), { target: { value: 'Ana' } });
 fireEvent.change(screen.getByLabelText('Senha do Jogador'), { target: { value: '012345' } });
 fireEvent.click(screen.getByRole('button', { name: 'Criar / acessar perfil' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar');
 expect(onNavigate).not.toHaveBeenCalled();
 expect(screen.getByLabelText('Nome do jogador')).toHaveValue('Ana');
 fireEvent.click(screen.getByRole('button', { name: 'Criar / acessar perfil' }));
 await waitFor(() => expect(onNavigate).toHaveBeenCalled());
 expect(salvarJogador).toHaveBeenLastCalledWith('012345', expect.objectContaining({ fotoPerfil: '', perfilConfigurado: true }));
});

test('perfil configurado sem foto não abre a configuração automaticamente', async () => {
 entrarJogador.mockResolvedValue({ nome: 'Ana', perfilConfigurado: true, personagens: [], builds: [] });
 render(<PaginaJogador codigo="1234"/>);
 await screen.findByRole('button', { name: 'Editar perfil de Ana' });
 expect(screen.queryByRole('dialog', { name: 'Como você quer aparecer?' })).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Editar perfil de Ana' }));
 expect(screen.getByRole('dialog', { name: 'Como você quer aparecer?' })).toBeInTheDocument();
});

test('exclusão exige confirmação e remove a ficha da lista',async()=>{
 confirmarDialogo.mockResolvedValue(true);
 excluirFichaJogador.mockResolvedValue({nome:'Ruan',tema:'escuro',personagens:[],builds:[]});
 render(<PaginaJogador codigo="1234"/>);
 fireEvent.click(await screen.findByRole('button',{name:'Excluir ficha de Ana'}));
 await waitFor(()=>expect(excluirFichaJogador).toHaveBeenCalledWith('1234',expect.any(Object),expect.objectContaining({id:'1234',sistema:'darkness'})));
 expect(confirmarDialogo).toHaveBeenCalledWith(expect.stringContaining('Ana'),expect.objectContaining({confirmarTexto:'Excluir ficha'}));
 await waitFor(()=>expect(screen.queryByRole('link',{name:'Abrir ficha de Ana'})).not.toBeInTheDocument());
 expect(screen.getByText('0 / 10 personagens')).toBeInTheDocument();
});
test('cancelar exclusão mantém a ficha e não chama o serviço',async()=>{
 confirmarDialogo.mockResolvedValue(false);
 render(<PaginaJogador codigo="1234"/>);
 fireEvent.click(await screen.findByRole('button',{name:'Excluir ficha de Ana'}));
 await waitFor(()=>expect(confirmarDialogo).toHaveBeenCalled());
 expect(excluirFichaJogador).not.toHaveBeenCalled();
 expect(screen.getByRole('link',{name:'Abrir ficha de Ana'})).toBeInTheDocument();
});
