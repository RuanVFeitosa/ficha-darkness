import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaginaJogador, { catalogoBuilds } from './PaginaJogador';
import { entrarJogador, carregarFicha } from '../services/jogadorApi';
import { salvarJogador } from '../services/personagemApi';
import { listarCampanhasDaFicha } from '../services/mesaApi';
import { prepararFotoPerfil } from '../utils/playerProfilePhoto';
import { confirmarDialogo } from '../components/ui/DialogoGlobal';
import { excluirFichaJogador } from '../services/excluirFichaJogador';
jest.mock('../services/excluirFichaJogador',()=>({excluirFichaJogador:jest.fn()}));
jest.mock('../components/ui/DialogoGlobal',()=>({...jest.requireActual('../components/ui/DialogoGlobal'),confirmarDialogo:jest.fn()}));
jest.mock('../utils/playerProfilePhoto', () => ({ prepararFotoPerfil: jest.fn() }));
jest.mock('../services/jogadorApi', () => ({ ...jest.requireActual('../services/jogadorApi'), entrarJogador: jest.fn(), carregarFicha: jest.fn() }));
jest.mock('../services/personagemApi', () => ({ salvarJogador: jest.fn() }));
jest.mock('../services/mesaApi', () => ({ listarCampanhasDaFicha: jest.fn() }));
jest.mock('../components/ui/ComputadorModerno',()=>()=> <div>PC interativo</div>);
jest.mock('../components/midia/ReprodutorCassete',()=>()=> <div>Fita interativa</div>);
beforeEach(()=>{
  jest.clearAllMocks();
  entrarJogador.mockResolvedValue({nome:'Ruan',tema:'escuro',personagens:[{id:'1234',sistema:'darkness'}],builds:[]});
  carregarFicha.mockResolvedValue({id:'1234',sistema:'darkness',nome:'Ana',foto:'/ana.png',dados:{}});
  listarCampanhasDaFicha.mockResolvedValue([{id:'c1',nome:'Campanha',documentosInvestigacao:[{id:'doc1',nome:'Computador',mimeType:'modern-pc',revelada:true},{id:'doc2',nome:'Segredo',revelada:false}]}]);
  salvarJogador.mockImplementation(async(codigo,p)=>p);
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
 fireEvent.click(screen.getByRole('button',{name:/04 Builds/}));
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
 fireEvent.click(screen.getByRole('button',{name:/04 Builds/}));
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
 expect(screen.getByRole('link',{name:/Escolher Absoluto/})).toHaveAttribute('href','?criar=1&sistema=darkness&jogadorOrigem=1234');
 expect(screen.getByRole('link',{name:/Escolher ESPIRAL/})).toHaveAttribute('href','?criar=1&sistema=espiral&jogadorOrigem=1234');
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
