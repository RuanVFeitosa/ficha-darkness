import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TelaInicial, { LOGIN_WELCOME_DURATION } from './telaInicial';
import { entrarJogador } from '../services/jogadorApi';
import { entrarMestre } from '../services/masterAccounts';
import { saudacaoJogador } from '../utils/saudacaoJogador';
jest.mock('../services/jogadorApi', () => ({ entrarJogador: jest.fn() }));
jest.mock('../services/masterAccounts', () => ({ entrarMestre: jest.fn() }));
const mockTocar = jest.fn();
jest.mock('../utils/useLoginSound', () => () => ({ tocar: mockTocar, ativo: true, alternar: jest.fn() }));

test('controle de música persiste a preferência e permite reativar', () => {
 render(<TelaInicial inicializar={false}/>);
 fireEvent.click(screen.getByRole('button', { name: 'Desativar música ambiente' }));
 expect(localStorage.getItem('darkness:login:musica')).toBe('off');
 expect(screen.getByRole('button', { name: 'Ativar música ambiente' })).toHaveAttribute('aria-pressed', 'false');
 fireEvent.click(screen.getByRole('button', { name: 'Ativar música ambiente' }));
 expect(localStorage.getItem('darkness:login:musica')).toBe('on');
});
beforeEach(() => { jest.useFakeTimers(); localStorage.clear(); sessionStorage.clear(); jest.clearAllMocks(); });
afterEach(() => { jest.useRealTimers(); });
test.each([['Ele','Bem-vindo'],['Ela','Bem-vinda'],['Elu','Bem-vinde'],['','Bem-vinde']])('saudação respeita %s', (pronome, texto) => {
 expect(saudacaoJogador(pronome,'Ana')).toBe(`${texto}, Ana`);
});
test('valida senha e mostra saudação antes de navegar ao perfil', async () => {
 const onNavigate = jest.fn(); entrarJogador.mockResolvedValue({nome:'Ana',pronome:'Ela',perfilConfigurado:true});
 render(<TelaInicial inicializar={false} onNavigate={onNavigate}/>);
 fireEvent.change(screen.getByLabelText('Senha do jogador'),{target:{value:'012345'}});
 expect(mockTocar).toHaveBeenCalledWith(false);
 await act(async () => { fireEvent.click(screen.getByRole('button',{name:'ENTRAR'})); });
 expect(entrarJogador).toHaveBeenCalledWith('012345');
 expect(screen.getByRole('status')).toHaveTextContent('Bem-vinda, Ana');
 expect(onNavigate).not.toHaveBeenCalled();
 act(()=>jest.advanceTimersByTime(LOGIN_WELCOME_DURATION));
 expect(onNavigate).toHaveBeenCalledWith('/?jogador=012345');
});
test('falha de acesso não anima sucesso nem redireciona', async () => {
 const onNavigate=jest.fn(); entrarJogador.mockRejectedValue(new Error('Senha inválida'));
 render(<TelaInicial inicializar={false} onNavigate={onNavigate}/>);
 fireEvent.change(screen.getByLabelText('Senha do jogador'),{target:{value:'1234'}});
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'ENTRAR'})));
 expect(screen.getByRole('alert')).toHaveTextContent('Senha inválida');
 act(()=>jest.advanceTimersByTime(LOGIN_WELCOME_DURATION));
 expect(onNavigate).not.toHaveBeenCalled();
});
test('mestre entra só com código e recebe a saudação do perfil', async()=>{
 const onNavigate=jest.fn(); render(<TelaInicial inicializar={false} onNavigate={onNavigate}/>);
 entrarMestre.mockResolvedValue({ nome: 'Ruan' });
 fireEvent.click(screen.getByRole('button',{name:'MESTRE'}));
 expect(screen.queryByLabelText('E-mail')).toBeNull();
 fireEvent.change(screen.getByLabelText('Código de mestre'),{target:{value:'0123456789012345'}});
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'ENTRAR'})));
 expect(screen.getByRole('status')).toHaveTextContent('Bem-vinde, Ruan');
 expect(entrarMestre).toHaveBeenCalledWith('0123456789012345');
 expect(onNavigate).not.toHaveBeenCalled();
 act(()=>jest.advanceTimersByTime(LOGIN_WELCOME_DURATION));
 expect(onNavigate).toHaveBeenCalledWith('/?mestre=1');
});
test('código errado do mestre não autoriza nem exibe boas-vindas', async()=>{
 entrarMestre.mockRejectedValue(new Error('Código de mestre inválido.'));
 render(<TelaInicial inicializar={false} onNavigate={jest.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'MESTRE'}));
 fireEvent.change(screen.getByLabelText('Código de mestre'),{target:{value:'000000000000'}});
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'ENTRAR'})));
 expect(screen.getByRole('alert')).toHaveTextContent('Código de mestre inválido.');
 expect(screen.queryByRole('status')).toBeNull();
});
test('o código do proprietário leva ao Dashboard Master', async () => {
 const onNavigate = jest.fn();
 entrarMestre.mockResolvedValue({ nome: 'Proprietário', papel: 'proprietario' });
 render(<TelaInicial inicializar={false} modoInicial="mestre" onNavigate={onNavigate} />);
 fireEvent.change(screen.getByLabelText('Código de mestre'), { target: { value: '12345678' } });
 await act(async () => fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' })));
 act(() => jest.advanceTimersByTime(LOGIN_WELCOME_DURATION));
 expect(onNavigate).toHaveBeenCalledWith('/?master=1');
});
test('teclado virtual aceita zeros iniciais, apaga e limita a oito dígitos',()=>{
 render(<TelaInicial inicializar={false}/>);fireEvent.click(screen.getByRole('button',{name:'Teclado numérico'}));
 fireEvent.click(screen.getByRole('button',{name:'0',exact:true}));fireEvent.click(screen.getByRole('button',{name:'1',exact:true}));
 expect(screen.getByLabelText('Senha do jogador')).toHaveValue('01');
 fireEvent.click(screen.getByRole('button',{name:'Apagar dígito'}));
 expect(mockTocar).toHaveBeenLastCalledWith(true);
 fireEvent.change(screen.getByLabelText('Senha do jogador'),{target:{value:'123456789'}});
 expect(screen.getByLabelText('Senha do jogador')).toHaveValue('12345678');
});
test('sair durante boas-vindas cancela navegação atrasada',async()=>{
 const onNavigate=jest.fn();entrarJogador.mockResolvedValue({nome:'Ana',pronome:'Ela',perfilConfigurado:true});
 const view=render(<TelaInicial inicializar={false} onNavigate={onNavigate}/>);
 fireEvent.change(screen.getByLabelText('Senha do jogador'),{target:{value:'1234'}});
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'ENTRAR'})));
 view.unmount();act(()=>jest.advanceTimersByTime(LOGIN_WELCOME_DURATION));
 expect(onNavigate).not.toHaveBeenCalled();
});

test('tema acompanha o papel e ignora a preferência antiga de fundo',()=>{
 localStorage.setItem('darkness:login:tema','claro');
 const view=render(<TelaInicial inicializar={false}/>);
 expect(view.container.querySelector('main')).toHaveClass('login-escuro');
 fireEvent.click(screen.getByRole('button',{name:'MESTRE',exact:true}));
 expect(view.container.querySelector('main')).toHaveClass('login-claro');
 fireEvent.click(screen.getByRole('button',{name:'JOGADOR',exact:true}));
 expect(view.container.querySelector('main')).toHaveClass('login-escuro');
});
