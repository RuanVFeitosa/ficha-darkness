jest.mock('react-markdown', () => ({ __esModule:true, default:({children}) => <div>{children}</div> }));
jest.mock('remark-gfm', () => ({ __esModule:true, default:() => {} }));
jest.mock('../services/personagemApi', () => ({ buscarPersonagem:jest.fn(), buscarArvoresHabilidades:jest.fn(), salvarPersonagem:jest.fn() }));
jest.mock('../services/mesaApi', () => ({ listarCampanhasDaFicha:jest.fn().mockResolvedValue([]), registrarRolagem:jest.fn() }));
jest.mock('../components/jogador/PlayerPageLink', () => ({ __esModule:true, default:({children}) => <a href="?jogador=teste">{children}</a> }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Ficha, { estadoInicial } from './fichaPersonagem';
import { buscarPersonagem, buscarArvoresHabilidades, salvarPersonagem } from '../services/personagemApi';
import { criarBaseV1 } from '../data/absolutoV1';
import { listarCampanhasDaFicha } from '../services/mesaApi';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({},'', '/?sistema=darkness&ficha=teste-original');
  window.matchMedia=jest.fn(() => ({matches:false}));
  jest.spyOn(console,'log').mockImplementation(() => {});
  buscarArvoresHabilidades.mockResolvedValue(null);
  listarCampanhasDaFicha.mockResolvedValue([]);
  buscarPersonagem.mockResolvedValue({ ...estadoInicial, ...criarBaseV1({forca:1,fonitude:1,inteligencia:3,vontade:1,reflexos:1},{razao:2}), nome:'Lia', inventario:[], rituais:[] });
  salvarPersonagem.mockImplementation(async (id,p) => p);
});
afterEach(() => { jest.restoreAllMocks(); delete window.matchMedia; });

test('Mapa abre fora do layout da ficha e fecha com Escape restaurando a rolagem', async () => {
  const {container} = render(<Ficha/>);
  fireEvent.click(await screen.findByRole('button',{name:'Abrir menu da ficha'}));
  fireEvent.click(screen.getByRole('button',{name:'Mapa'}));
  const dialog = await screen.findByRole('dialog',{name:'Escolher campanha'});
  expect(container.contains(dialog)).toBe(false);
  expect(dialog.parentElement.parentElement).toBe(document.body);
  expect(document.body.style.overflow).toBe('hidden');
  expect(await screen.findByText('Esta ficha ainda não foi adicionada a nenhuma campanha.')).toBeInTheDocument();
  expect(listarCampanhasDaFicha).toHaveBeenCalledWith('teste-original');
  fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.queryByRole('dialog',{name:'Escolher campanha'})).not.toBeInTheDocument();
  expect(document.body.style.overflow).not.toBe('hidden');
});

test('dossiê preserva os textos existentes e salva edições dos três campos', async () => {
  buscarPersonagem.mockResolvedValue({...estadoInicial,...criarBaseV1(),nome:'Lia',inventario:[],rituais:[],descricao:'Olhos atentos.',anotacao:'Encontrar a chave.',historia:'Veio do norte.'});
  render(<Ficha/>);
  fireEvent.click(await screen.findByRole('button',{name:'PERSONAGEM',exact:true}));
  expect(screen.getByRole('heading',{name:'Dossiê do personagem'})).toBeInTheDocument();
  for (const [nome, original] of [['Descrição','Olhos atentos.'],['Anotações','Encontrar a chave.'],['História','Veio do norte.']]) {
    const campo = screen.getByRole('textbox',{name:nome});
    expect(campo).toHaveValue(original);
    fireEvent.change(campo,{target:{value:`${original} Novo registro.`}});
  }
  await waitFor(()=>expect(salvarPersonagem).toHaveBeenCalledWith('teste-original',expect.objectContaining({descricao:'Olhos atentos. Novo registro.',anotacao:'Encontrar a chave. Novo registro.',historia:'Veio do norte. Novo registro.'})),{timeout:3000});
});

test('atributos rolam diretamente sem Domínio e Última Tentativa repete o atributo', async () => {
  jest.spyOn(Math,'random').mockReturnValue(.99);
  render(<Ficha/>);
  for (const nome of ['FORÇA','FORTITUDE','INTELIGÊNCIA','REFLEXOS','VONTADE']) {
    expect(await screen.findByRole('button',{name:`Rolar ${nome}`})).toBeEnabled();
  }
  fireEvent.click(screen.getByRole('button',{name:'Rolar INTELIGÊNCIA'}));
  expect(screen.getByRole('dialog',{name:'Rolagem: Inteligência'})).toBeInTheDocument();
  expect(screen.getByText('Teste de Atributo')).toBeInTheDocument();
  expect(screen.getByText('3d6 · Êxitos em 6 · DT 1')).toBeInTheDocument();
  expect(document.body.querySelectorAll('.modal-rolagem .dado-rolagem')).toHaveLength(3);
  const repetir = await screen.findByRole('button',{name:'Última Tentativa · 2 Esperança'},{timeout:2500});
  fireEvent.click(repetir);
  await waitFor(()=>expect(salvarPersonagem).toHaveBeenCalledWith('teste-original',expect.objectContaining({esperanca:expect.objectContaining({atual:5})})),{timeout:3000});
  expect(screen.getByText('Teste de Atributo')).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:'Última Tentativa · 2 Esperança'})).toBeDisabled(),{timeout:2500});
});

test('ficha antiga abre em 1.0 sem botão e salva automaticamente com o original preservado', async () => {
  const antiga = {...estadoInicial, nome:'Lia antiga', atributos:{forca:30,fonitude:20,inteligencia:40,vontade:20,reflexos:10}, habilidadesCombate:{firmeza:3}, inventario:[], rituais:[]};
  buscarPersonagem.mockResolvedValue(antiga);
  render(<Ficha/>);
  await screen.findByRole('button',{name:'Rolar Razão'});
  expect(screen.queryByRole('button',{name:/adapta.*1\.0/i})).not.toBeInTheDocument();
  await waitFor(() => expect(salvarPersonagem).toHaveBeenCalledWith('teste-original', expect.objectContaining({versaoRegras:'1.0', legadoAbsoluto:antiga})), {timeout:3000});
});

test('a ficha 1.0 mantém colunas, linhas e modal originais e incorpora Medo e os nove Domínios', async () => {
  jest.spyOn(Math,'random').mockReturnValue(.5);
  const {container}=render(<Ficha/>);
  await screen.findByRole('button',{name:'Rolar Razão'});
  expect(container.querySelector('.abs-header-overview > .profile-section')).toBeInTheDocument();
  expect(container.querySelector('.main-content > .profile-section')).not.toBeInTheDocument();
  expect(container.querySelector('.main-content > .sidebar-container')).toBeInTheDocument();
  expect(container.querySelectorAll('.lista-ativos .ativo-item')).toHaveLength(9);
  expect(container.querySelector('.abs-v1-heading')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Medo atual')).toHaveValue(0);
  fireEvent.click(screen.getByRole('button',{name:'Rolar Razão'}));
  await waitFor(() => expect(document.body.querySelector('.modal-rolagem')).toBeInTheDocument());
  expect(document.body.querySelectorAll('.modal-rolagem .dado-rolagem')).toHaveLength(3);
  expect(document.body.querySelectorAll('.modal-rolagem .dado-rolagem.rolando')).toHaveLength(3);
  expect(screen.queryByText('Êxitos / DT 1')).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Êxitos / DT 1')).toBeInTheDocument(), {timeout:2500});
  expect(document.body.querySelectorAll('.modal-rolagem .dado-rolagem.rolando')).toHaveLength(0);
  expect(screen.queryByText(/Passiva: \+/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Fechar',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'CORPO',exact:true}));
  expect(container.querySelectorAll('.abs-body-region')).toHaveLength(8);
  expect(container.querySelectorAll('.controles-membros-sidebar .membro-controle')).toHaveLength(0);
  expect(screen.getByRole('button',{name:/Pescoço:.*Estável/})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/Abdômen:.*Estável/})).toBeInTheDocument();
});

test('sidebar abre pelo menu e recolhe por Escape ou clique fora', async () => {
  const {container}=render(<Ficha/>);
  const trigger=await screen.findByRole('button',{name:'Abrir menu da ficha'});
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog',{name:'Menu da ficha'})).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded','true');
  fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.queryByRole('dialog',{name:'Menu da ficha'})).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.click(container.querySelector('.ficha-drawer-backdrop'));
  expect(screen.queryByRole('dialog',{name:'Menu da ficha'})).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded','false');
});


test('uso pela ficha debita Esperança e salva o efeito condicionado sem alterar a compra', async()=>{
 buscarPersonagem.mockResolvedValue({...estadoInicial,...criarBaseV1({forca:2,fonitude:2,inteligencia:2,vontade:2,reflexos:2},{}),nome:'Lia',classeId:'aniquilador',habilidadesClasse:{aptidoes:{'golpe-sem-misericordia':true}},inventario:[],rituais:[]});
 render(<Ficha/>);
 await screen.findByRole('button',{name:'Rolar Razão'});
 fireEvent.click(screen.getByRole('button',{name:'HABILIDADES',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Aptidões',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Usar Golpe Sem Misericordia'}));
 await waitFor(()=>expect(screen.getByText(/Resolver alvo, condições/)).toBeInTheDocument());
 await waitFor(()=>expect(salvarPersonagem).toHaveBeenCalledWith('teste-original',expect.objectContaining({esperanca:expect.objectContaining({atual:5}),efeitosHabilidadesAtivos:expect.arrayContaining([expect.objectContaining({nome:'Golpe Sem Misericordia',custo:3,pendente:true})])})),{timeout:3000});
 expect(screen.getByRole('button',{name:'Desativar Golpe Sem Misericordia'})).toBeEnabled();
});

test.each([[2,[],true,false],[0,['rito-teste'],false,true],[2,['rito-teste'],true,true],[0,[],false,false]])('Medo %s e Ritos %j controlam rachaduras e negativo separadamente',async(medo,ritosAtivos,rachaduras,negativo)=>{
 buscarPersonagem.mockResolvedValue({...estadoInicial,...criarBaseV1(),nome:'Lia',inventario:[],rituais:[],medo,ritosAtivos});
 const {container}=render(<Ficha/>);
 await screen.findByRole('button',{name:'Rolar Razão'});
 expect(Boolean(document.body.querySelector('.rito-cracks-background'))).toBe(rachaduras);
 expect(Boolean(container.querySelector('.rito-cracks-portrait'))).toBe(rachaduras);
 expect(Boolean(container.querySelector('.profile-wrapper.rito-ativo-perfil'))).toBe(negativo);
});

test('Condições ficam na camada da foto e não envolvem o símbolo do Absoluto',async()=>{
 const p=criarBaseV1();
 buscarPersonagem.mockResolvedValue({...estadoInicial,...p,nome:'Lia',inventario:[],rituais:[],sanidade:{...p.sanidade,atual:0},condicoesAtivas:['envenenado','em-chamas']});
 const {container}=render(<Ficha/>);
 await screen.findByRole('button',{name:'Rolar Razão'});
 const camada=container.querySelector('.portrait-condition');
 expect(camada).toHaveClass('envenenado','em-chamas');
 expect(camada.querySelector('.profile')).toBeInTheDocument();
 expect(camada.querySelector('.profile-overlay')).toBeInTheDocument();
 expect(camada.querySelector('.abs-sanity-zero-symbol')).toBeNull();
 expect(container.querySelector('.abs-sanity-zero-symbol').parentElement).toHaveClass('profile-wrapper');
 expect(container.querySelector('.profile-wrapper')).not.toHaveClass('envenenado','em-chamas');
});

test.each(['cabeca','torso'])('Estado Crítico é ativado e salvo automaticamente com %s zerado na versão 1.0',async(chave)=>{
 const p=criarBaseV1();
 buscarPersonagem.mockResolvedValue({...estadoInicial,...p,nome:'Lia',inventario:[],rituais:[],membros:{...p.membros,[chave]:{...p.membros[chave],atual:0,grave:false}},condicoesAtivas:['envenenado','surto-adrenalina']});
 const {container}=render(<Ficha/>);
 await screen.findByRole('button',{name:'Rolar Razão'});
 await waitFor(()=>expect(container.querySelector('.portrait-condition')).toHaveClass('estado-critico'));
 expect(container.querySelector('.portrait-condition')).toHaveClass('envenenado');
 expect(container.querySelector('.portrait-condition')).not.toHaveClass('surto-adrenalina');
 await waitFor(()=>expect(salvarPersonagem).toHaveBeenCalledWith('teste-original',expect.objectContaining({condicoesAtivas:expect.arrayContaining(['estado-critico','envenenado'])})),{timeout:3000});
});
