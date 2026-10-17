import { prepareTokenImage } from '../services/imageCompression';
import { externalizarImagens } from '../services/mediaStorage';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import FichaEspiral from './fichaEspiral';
import { buscarPersonagem } from '../services/personagemApi';
import DialogoGlobal from '../components/DialogoGlobal';
import { listarCampanhasDaFicha } from '../services/mesaApi';
import { freshSheet } from '../data/espiral';
jest.mock('../services/imageCompression', () => ({ ...jest.requireActual('../services/imageCompression'), prepareTokenImage: jest.fn() }));
jest.mock('../services/mediaStorage', () => ({ ...jest.requireActual('../services/mediaStorage'), externalizarImagens: jest.fn(value => Promise.resolve(value)) }));
jest.mock('../services/mesaApi', () => ({listarCampanhasDaFicha:jest.fn()}));

jest.mock('../services/personagemApi', () => ({ buscarPersonagem: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  jest.clearAllMocks();
});

test.each([[4, 'Sucesso com consequência'], [5, 'Sucesso'], [7, 'Sucesso excepcional']])('sobrevivência remove uma falha e mostra verde em %s / %s', async (difficulty, outcome) => {
  const sheet = freshSheet();
  sheet.integrity = 0;
  sheet.failures = 2;
  sheet.attributes.pulso = 5;
  sheet.resources['Propósito'] = 0;
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify(sheet));
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => { array[0] = difficulty - 1; return array; } } });
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: 'Rolar sobrevivência: Pulso + Propósito' }));
  const dialog = screen.getByRole('dialog', { name: 'Pulso + Propósito' });
  await waitFor(() => expect(dialog).toHaveClass('es-survival-success'));
  expect(within(dialog).getByRole('heading', { name: outcome, exact: true })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).failures).toBe(1);
});

test.each([[2, 'Falha'], [0, 'Falha grave']])('sobrevivência com dado %s soma uma falha e destaca %s', async (value, outcome) => {
  const sheet = freshSheet();
  sheet.integrity = 0;
  sheet.resources['Propósito'] = 0;
  sheet.failures = 0;
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify(sheet));
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => { array[0] = value; return array; } } });
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: 'Rolar sobrevivência: Pulso + Propósito' }));
  const dialog = screen.getByRole('dialog', { name: 'Pulso + Propósito' });
  await waitFor(() => expect(dialog).toHaveClass('es-survival-failed'));
  expect(within(dialog).getByRole('heading', { name: outcome, exact: true })).toBeInTheDocument();
  if (outcome === 'Falha grave') expect(dialog).toHaveClass('es-survival-rupture');
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).failures).toBe(1);
});

test('falhas de sobrevivência aparecem ao lado da Integridade somente quando zerada', () => {
  const sheet = freshSheet();
  sheet.integrity = 1;
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify(sheet));
  render(<FichaEspiral />);
  expect(screen.queryByRole('button', { name: 'Aumentar Falhas de sobrevivência' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Integridade' }));
  const increase = screen.getByRole('button', { name: 'Aumentar Falhas de sobrevivência' });
  fireEvent.click(increase);
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).failures).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Integridade' }));
  expect(screen.queryByRole('button', { name: 'Aumentar Falhas de sobrevivência' })).toBeNull();
});

test('Sanidade e Esperança mudam o estado visual na metade, abaixo e em zero', () => {
  render(<FichaEspiral />);
  for (const resource of ['Sanidade', 'Esperança']) {
    const marker = number => screen.getByRole('button', { name: `${resource} ${number}`, exact: true });
    const panel = marker(1).closest('.hero-vital');
    fireEvent.click(marker(6));
    expect(panel).toHaveAttribute('data-state', 'half');
    fireEvent.click(marker(4));
    expect(panel).toHaveAttribute('data-state', 'low');
    fireEvent.click(marker(1));
    expect(panel).toHaveAttribute('data-state', 'empty');
    fireEvent.click(marker(10));
    expect(panel).toHaveAttribute('data-state', 'stable');
  }
});

test('rolagem de dano do jogador mostra a lesão no resultado', async () => {
  const sheet = freshSheet();
  sheet.weapons = [{ id: 'test-weapon', name: 'Pistola de teste', damage: '1d6+10' }];
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify(sheet));
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => { array[0] = 0; return array; } } });
  render(<FichaEspiral />);
  expect(screen.queryByRole('button', { name: 'Rolar dano de Pistola de teste' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ver arma Pistola de teste 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Rolar dano de Pistola de teste' }));
  expect(await screen.findByRole('heading', { name: 'Lesão Crítica' })).toBeInTheDocument();
});

test('dano desconta apenas Impacto, registra gravidade por região e não cura ao remover', () => {
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: /Corpo & marcas/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Selecionar Braço esquerdo, saudável' }));
  fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '18' } });
  fireEvent.change(screen.getByLabelText('Proteção aplicada'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Redução por outros efeitos'), { target: { value: '2' } });
  fireEvent.click(screen.getByLabelText('Sangramento confirmado neste ferimento'));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano e registrar lesão' }));
  const saved = () => JSON.parse(localStorage.getItem('espiral:sheet:v1:principal'));
  expect(saved().integrity).toBe(22);
  expect(saved().injuries[0]).toMatchObject({ impact: 13, severity: 'Catastrófica', region: 'Braço esquerdo', bleeding: true });
  fireEvent.click(screen.getByRole('button', { name: 'Remover lesão em Braço esquerdo' }));
  expect(saved().integrity).toBe(22);
  expect(saved().injuries).toHaveLength(0);
});

test('dado clicável rola dados extras temporários sem alterar a categoria', async () => {
 let dieIndex=0;
 Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>{array[0]=[2,4][dieIndex++ % 2];return array;}}});
 const view=render(<FichaEspiral/>);
 expect(screen.queryByLabelText('Estágio de Pulso')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Adicionar dado temporário de Pulso'}));
 expect(screen.getByRole('button',{name:'Restaurar um dado de Pulso'})).toHaveTextContent('×2');
 fireEvent.click(screen.getByRole('button',{name:'Rolar somente Pulso'}));
 const dialog=screen.getByRole('dialog',{name:'Pulso · somente atributo'});
 expect(within(dialog).getByText('Pulso · somente atributo')).toBeInTheDocument();
 expect(within(dialog).getByText('ROLAGEM DE ATRIBUTO')).toBeInTheDocument();
 expect(await within(dialog).findByText('Maior dado')).toBeInTheDocument();
 expect(dialog.querySelector('strong')).toHaveTextContent('5');
 expect(within(dialog).queryByText('Rolagem de dano')).toBeNull();
 expect(within(dialog).queryByText('Dano total')).toBeNull();
 expect(screen.queryByRole('button',{name:'Restaurar um dado de Pulso'})).toBeNull();
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).attributes.pulso).toBe(2);
 view.unmount();
});

test('rolagem consome pressão e exibe o resultado', () => {
  Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: array => { array[0] = 0; return array; } } });
  render(<FichaEspiral />);
  fireEvent.change(screen.getByLabelText('Dados de Pressão', { exact: true }), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rolar Investigação' }));
  fireEvent.click(screen.getByRole('button', { name: /Rolar Sentido \+ Investigação/ }));
  expect(screen.getByRole('spinbutton', { name: 'Dados de Pressão' })).toHaveValue(0);
  expect(screen.getByRole('heading', { name: 'Falha grave' })).toBeInTheDocument();
  expect(screen.getByText('Crise')).toBeInTheDocument();
  jest.restoreAllMocks();
});

test('identidade e anotações podem ser editadas', () => {
  render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: /Editar identidade/ }));
  fireEvent.change(screen.getByLabelText('Nome do personagem'), { target: { value: 'Helena' } });
  expect(screen.getByRole('link', { name: /ESPIRAL Helena/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Anotações/ }));
  fireEvent.change(screen.getByLabelText('Seu motivo para continuar'), { target: { value: 'Encontrar respostas.' } });
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).purpose).toBe('Encontrar respostas.');
});

test('oferece tela inicial quando a ficha não veio do Darkness', () => {
  render(<FichaEspiral />);
  expect(screen.getByRole('button', { name: /Ir para tela inicial/ })).toBeInTheDocument();
  expect(screen.getByLabelText('Trocar foto')).toHaveAttribute('type', 'file');
});

test('identifica a ficha Darkness vinculada', () => {
  localStorage.setItem('espiral:sheet:v1:principal', JSON.stringify({
    version: 1,
    migratedFrom: 'darkness',
    migratedFromId: 'mara-01',
  }));
  render(<FichaEspiral />);
  expect(screen.getByRole('button', { name: /Abrir ficha Darkness/ })).toBeInTheDocument();
});

test('carrega a adaptação criada com o identificador anterior', () => {
  window.history.replaceState({}, '', '/?ficha=121212');
  localStorage.setItem('espiral:sheet:v1:darkness-121212', JSON.stringify({
    version: 1,
    name: 'L',
    migratedFrom: 'darkness',
    migratedFromId: '121212',
  }));
  render(<FichaEspiral />);
  expect(screen.getByRole('link', { name: /ESPIRAL L/ })).toBeInTheDocument();
});

test('vincula automaticamente uma ficha Darkness ao abrir pelo código', async () => {
  window.history.replaceState({}, '', '/?ficha=121212');
  buscarPersonagem.mockResolvedValue({
    nome: 'L', fichaId: '121212',
    atributos: { forca: 30, fonitude: 20, inteligencia: 10, reflexos: 10, vontade: 10 },
    inventario: [],
  });
  render(<React.StrictMode><DialogoGlobal /><FichaEspiral /></React.StrictMode>);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  fireEvent.change(screen.getByRole('dialog').querySelector('select'), { target: { value: 'forca' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await waitFor(() => expect(screen.getByRole('link', { name: /ESPIRAL L/ })).toBeInTheDocument());
  expect(screen.getByRole('button', { name: /Abrir ficha Darkness/ })).toBeInTheDocument();
});

test('graus temporários acumulam no recurso e expiram após as rolagens', async () => {
  render(<><DialogoGlobal /><FichaEspiral /></>);

  fireEvent.click(screen.getByRole('button', { name: 'Adicionar grau temporário a Armas' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  fireEvent.change(within(screen.getByRole('dialog')).getByRole('textbox'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar grau' }));

  await waitFor(() => expect(screen.getByText(/\+1 TEMP\. · 1 teste/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Rolar Armas' }));
  fireEvent.click(screen.getByRole('button', { name: /Rolar Sentido \+ Armas/ }));

  await waitFor(() => expect(screen.queryByText(/\+1 TEMP\./)).not.toBeInTheDocument());
});

test('personaliza e preserva as cores da ficha', () => {
  const view = render(<FichaEspiral />);
  fireEvent.click(screen.getByRole('button', { name: /Personalização/ }));
  fireEvent.change(screen.getByLabelText('Cor primária'), { target: { value: '#ff0000' } });

  expect(view.container.querySelector('.espiral-app')).toHaveStyle({ '--es-accent': '#ff0000' });
  expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).temaFicha.primaria).toBe('#ff0000');
});
test('bloqueia entrada no tabletop sem corpo inteiro mesmo com foto de perfil', () => {
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify({...freshSheet(),profileImage:'https://example.com/portrait.png'}));
 render(<FichaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'Entrar no tabletop'}));
 const dialog=screen.getByRole('dialog',{name:'Entrar no tabletop'});
 expect(within(dialog).getByRole('alert')).toHaveTextContent('Falta a imagem de corpo inteiro');
 expect(listarCampanhasDaFicha).not.toHaveBeenCalled();
 fireEvent.click(within(dialog).getByRole('button',{name:'Adicionar imagem de corpo inteiro'}));
 expect(screen.getByLabelText('Background do personagem')).toBeInTheDocument();
});

test('oferece campanhas 3D vinculadas quando a ficha possui imagem de corpo inteiro', async () => {
 localStorage.setItem('espiral:sheet:v1:principal',JSON.stringify({...freshSheet(),tabletopTokenImage:'https://example.com/body.png'}));
 listarCampanhasDaFicha.mockResolvedValue([{id:'c1',codigo:'ABCD',nome:'Investigação',tabletop_tipo:'3d'},{id:'c2',codigo:'EFGH',nome:'Mesa antiga',tabletop_tipo:'2d'}]);
 render(<FichaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:'Entrar no tabletop'}));
 expect(await screen.findByRole('button',{name:'Investigação'})).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Mesa antiga'})).not.toBeInTheDocument();
 expect(screen.getByText('A imagem de corpo inteiro da sua ficha será usada como token.')).toBeInTheDocument();
 expect(listarCampanhasDaFicha).toHaveBeenCalledWith('espiral:principal');
});
test('ficha integrada ao tabletop usa o personagem solicitado e salva alterações', () => {
 localStorage.setItem('espiral:sheet:v1:ana',JSON.stringify({...freshSheet(),name:'Ana'}));
 const updated=jest.fn();
 const title=document.title;
 render(<FichaEspiral sheetId="ana" embedded onSheetChange={updated}/>);
 expect(screen.getByRole('link',{name:/ESPIRAL Ana/})).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Entrar no tabletop'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/Ir para tela inicial/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Diminuir Integridade'}));
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:ana')).integrity).toBe(freshSheet().integrity-1);
 expect(updated).toHaveBeenLastCalledWith('ana',expect.objectContaining({name:'Ana',integrity:freshSheet().integrity-1}));
 expect(document.title).toBe(title);
});
test('corpo inteiro permanece acessível ao alternar identidade e Background e salva sem acesso remoto', async () => {
 prepareTokenImage.mockResolvedValue('data:image/webp;base64,dGVzdA==');
 externalizarImagens.mockRejectedValueOnce(new Error('Entre na sua conta para enviar arquivos ao R2.'));
 render(<FichaEspiral/>);
 fireEvent.click(screen.getByRole('button',{name:/Editar identidade/}));
 fireEvent.click(screen.getByRole('button',{name:/Background/}));
 fireEvent.click(screen.getByRole('button',{name:/Fechar edição/}));
 const input=screen.getByLabelText('Enviar imagem de corpo inteiro');
 expect(screen.getAllByLabelText('Enviar imagem de corpo inteiro')).toHaveLength(1);
 const click=jest.spyOn(input,'click');
 fireEvent.click(screen.getByRole('button',{name:'Adicionar imagem de corpo inteiro'}));
 expect(click).toHaveBeenCalledTimes(1);
 const file=new File(['body'],'body.png',{type:'image/png'});
 fireEvent.change(input,{target:{files:[file]}});
 await waitFor(()=>expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).tabletopTokenImage).toBe('data:image/webp;base64,dGVzdA=='));
 expect(screen.getByAltText('Corpo inteiro de personagem')).toHaveAttribute('src','data:image/webp;base64,dGVzdA==');
 expect(screen.getByText(/Imagem salva neste dispositivo/)).toBeInTheDocument();
 click.mockRestore();
});
