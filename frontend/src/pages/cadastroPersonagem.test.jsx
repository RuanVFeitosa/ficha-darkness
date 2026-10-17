import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CadastroPersonagem, { CriacaoEspiral } from './cadastroPersonagem';
jest.mock('./criarPersonagem',()=>()=> <div>Cadastro Darkness</div>);
test('cadastro oferece os dois sistemas',()=>{window.history.replaceState({},'', '/?criar=1');render(<CadastroPersonagem/>);expect(screen.getByRole('link',{name:/Escolher ESPIRAL/})).toHaveAttribute('href','?criar=1&sistema=espiral');expect(screen.getByRole('link',{name:/Escolher Darkness/})).toHaveAttribute('href','?criar=1&sistema=darkness');});
test('ESPIRAL exige identidade e orçamento correto antes de avançar',()=>{render(<CriacaoEspiral/>);fireEvent.click(screen.getByText('Continuar →'));expect(screen.getByRole('alert')).toHaveTextContent('Preencha');fireEvent.change(screen.getByLabelText('Nome do personagem'),{target:{value:'Ana'}});fireEvent.change(screen.getByLabelText('Nome do jogador'),{target:{value:'Ruan'}});fireEvent.click(screen.getByText('Continuar →'));expect(screen.getByRole('heading',{name:'Atributos'})).toBeInTheDocument();fireEvent.click(screen.getByText('Continuar →'));expect(screen.getByRole('alert')).toHaveTextContent('6 pontos');fireEvent.change(screen.getByLabelText('Pulso'),{target:{value:'4'}});fireEvent.change(screen.getByLabelText('Razão'),{target:{value:'4'}});fireEvent.click(screen.getByText('Continuar →'));expect(screen.getByRole('heading',{name:'Recursos'})).toBeInTheDocument();fireEvent.click(screen.getByText('Continuar →'));expect(screen.getByRole('alert')).toHaveTextContent('10 pontos');});

test('foto e código aparecem antes da revisão e o código exige quatro dígitos',()=>{
 render(<CriacaoEspiral/>);
 fireEvent.change(screen.getByLabelText('Nome do personagem'),{target:{value:'Ana'}});
 fireEvent.change(screen.getByLabelText('Nome do jogador'),{target:{value:'Ruan'}});
 fireEvent.click(screen.getByText('Continuar →'));
 fireEvent.change(screen.getByLabelText('Pulso'),{target:{value:'4'}});
 fireEvent.change(screen.getByLabelText('Razão'),{target:{value:'4'}});
 fireEvent.click(screen.getByText('Continuar →'));
 fireEvent.change(screen.getByLabelText('Armas'),{target:{value:'3'}});
 fireEvent.change(screen.getByLabelText('Pontaria'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Atletismo'),{target:{value:'1'}});
 fireEvent.click(screen.getByText('Continuar →'));
 fireEvent.click(screen.getByText('Continuar →'));
 expect(screen.getByLabelText('Foto de perfil (opcional)')).toHaveAttribute('type','file');
 fireEvent.click(screen.getByText('Continuar →'));
 expect(screen.getByRole('alert')).toHaveTextContent('4 a 8 dígitos');
 fireEvent.change(screen.getByLabelText(/Código da ficha/),{target:{value:'ab0123'}});
 expect(screen.getByLabelText(/Código da ficha/)).toHaveValue('0123');
 fireEvent.click(screen.getByText('Continuar →'));
 expect(screen.getByRole('heading',{name:'Revisão'})).toBeInTheDocument();
 expect(screen.getByText('0123')).toBeInTheDocument();
});
