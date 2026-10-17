import { entrarJogador, carregarFicha, documentoVisivel } from './jogadorApi';
import { buscarJogador, salvarJogador, buscarPersonagem } from './personagemApi';
jest.mock('./personagemApi', () => ({ buscarJogador: jest.fn(), salvarJogador: jest.fn(), buscarPersonagem: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); salvarJogador.mockImplementation(async (codigo,p) => p); });
test('migra o código legado incluindo fichas dos dois sistemas sem agrupar pelo nome', async () => {
  buscarJogador.mockResolvedValue(null); buscarPersonagem.mockResolvedValue({nome:'Ana'});
  localStorage.setItem('espiral:sheet:v1:0123', JSON.stringify({version:1,attributes:{pulso:2},name:'Bia'}));
  const p = await entrarJogador('0123');
  expect(p.personagens).toEqual([{id:'0123',sistema:'darkness'},{id:'0123',sistema:'espiral'}]);
  expect(sessionStorage.getItem('darkness:jogador')).toBe('0123');
});
test('código desconhecido não cria um perfil ao tentar entrar', async () => {
  buscarJogador.mockResolvedValue(null); buscarPersonagem.mockResolvedValue(null);
  await expect(entrarJogador('9999')).rejects.toThrow('Código não encontrado');
  expect(salvarJogador).not.toHaveBeenCalled();
});
test('erro ao salvar perfil não registra uma sessão', async () => {
  buscarJogador.mockResolvedValue(null); buscarPersonagem.mockResolvedValue({nome:'Ana'}); salvarJogador.mockRejectedValueOnce(new Error('offline'));
  await expect(entrarJogador('1234')).rejects.toThrow('offline');
  expect(sessionStorage.getItem('darkness:jogador')).toBeNull();
});
test('perfil existente mantém seus vínculos', async () => {
  const p={nome:'Ruan',personagens:[{id:'outro',sistema:'darkness'}],builds:[]}; buscarJogador.mockResolvedValue(p);
  expect(await entrarJogador('1234')).toEqual(p); expect(buscarPersonagem).not.toHaveBeenCalled();
});
test('investigação esconde documentos não revelados e respeita destinatários', () => {
  expect(documentoVisivel({revelada:false,visualizarTodos:true},['1'])).toBe(false);
  expect(documentoVisivel({visualizarTodos:false,jogadoresVisiveis:['2']},['1'])).toBe(false);
  expect(documentoVisivel({visualizarTodos:false,jogadoresVisiveis:['espiral:1']},['espiral:1'])).toBe(true);
  expect(documentoVisivel({visualizar_todos:false,jogadores_visiveis:['2']},['1'])).toBe(false);
});
test('registro de perfil não é tratado como personagem', async () => {
  buscarPersonagem.mockResolvedValue({tipo:'perfil-jogador'});
  await expect(carregarFicha({id:'1234',sistema:'darkness'})).rejects.toThrow('Personagem não encontrado');
});

test('vínculo pendente é preservado se o backend falhar e reenviado no próximo acesso', async () => {
  const { vincularAoJogadorAtivo } = require('./jogadorApi');
  sessionStorage.setItem('darkness:jogador','1234');
  buscarJogador.mockRejectedValueOnce(new Error('offline'));
  await expect(vincularAoJogadorAtivo('5678','darkness')).resolves.toBeUndefined();
  expect(JSON.parse(localStorage.getItem('darkness:jogador:pendentes:1234'))).toEqual([{id:'5678',sistema:'darkness'}]);
  buscarJogador.mockResolvedValue({nome:'Ruan',tema:'escuro',personagens:[],builds:[]});
  const perfil = await entrarJogador('1234');
  expect(perfil.personagens).toEqual([{id:'5678',sistema:'darkness'}]);
  expect(localStorage.getItem('darkness:jogador:pendentes:1234')).toBeNull();
});

test('recupera o nome do jogador de um perfil antigo sem usar o nome do personagem', async()=>{
 buscarJogador.mockResolvedValue({nome:'Jogador',tema:'escuro',personagens:[{id:'1234',sistema:'darkness'}],builds:[]});
 buscarPersonagem.mockResolvedValue({nome:'Helena',nomeJogador:'Ruan'});
 const perfil=await entrarJogador('1234');
 expect(perfil.nome).toBe('Ruan');
 expect(salvarJogador).toHaveBeenCalledWith('1234',expect.objectContaining({nome:'Ruan'}));
});

test('pré-validação bloqueia um novo personagem quando há dez vínculos',async()=>{
 const {verificarVagaPersonagem}=require('./jogadorApi');sessionStorage.setItem('darkness:jogador','1234');
 buscarJogador.mockResolvedValue({personagens:Array.from({length:10},(_,i)=>({id:String(i),sistema:'espiral'}))});
 await expect(verificarVagaPersonagem('novo','espiral')).rejects.toThrow('10 personagens');
 await expect(verificarVagaPersonagem('0','espiral')).resolves.toBeUndefined();
});
