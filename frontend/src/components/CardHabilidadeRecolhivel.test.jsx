jest.mock('react-markdown',()=>({__esModule:true,default:({children})=><div>{children}</div>}));
jest.mock('remark-gfm',()=>({__esModule:true,default:()=>{}}));
import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import Card from './CardHabilidadeRecolhivel';
test('arquétipo mostra descrição dentro do card e permite recolher e expandir',()=>{
 render(<Card habilidade={{nome:'Habilidade principal',descricao:'Descrição completa da habilidade.'}} classeExtra="arquetipo" tipo="Arquétipo"/>);
 const button=screen.getByRole('button',{name:/Habilidade principal/});
 expect(button).toHaveAttribute('aria-expanded','true');
 const body=document.getElementById(button.getAttribute('aria-controls'));
 expect(body).toHaveTextContent('Descrição completa da habilidade.');
 expect(body.closest('article')).toHaveClass('habilidade-expandivel');
 fireEvent.click(button);expect(body).toHaveAttribute('aria-hidden','true');
 fireEvent.click(button);expect(body).toHaveAttribute('aria-hidden','false');
});
test('edição de habilidade criada aguarda a aprovação e bloqueia pedido duplicado',()=>{const onEditar=jest.fn();const {rerender}=render(<Card habilidade={{nome:'Criada',descricao:'Atual',status:'aprovada'}} classeExtra="criada" onEditar={onEditar}/>);fireEvent.click(screen.getByRole('button',{name:'Editar',exact:true}));expect(onEditar).toHaveBeenCalledTimes(1);rerender(<Card habilidade={{nome:'Criada',descricao:'Atual',status:'aprovada',edicaoPendente:{nome:'Proposta'}}} classeExtra="criada" onEditar={onEditar}/>);expect(screen.getByRole('button',{name:'Editar',exact:true})).toBeDisabled();expect(screen.getByText(/Edição aguardando aprovação/)).toBeInTheDocument();});
