import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import Editor from './AbilityPageEditor';
import Reader from './AbilityDocument';
jest.mock('react-markdown',()=>({__esModule:true,default:({children})=><div>{children}</div>}));
jest.mock('remark-gfm',()=>({__esModule:true,default:()=>{}}));
function Studio(){const [value,setValue]=useState({nome:'Teste',descricao:''});return <Editor value={value} onChange={setValue}/>;}
test('edita páginas independentes e insere tabelas sem perder o conteúdo',()=>{
 render(<Studio/>);
 fireEvent.change(screen.getByLabelText('Conteúdo da página'),{target:{value:'Primeiro efeito'}});
 fireEvent.click(screen.getByRole('button',{name:'+ Nova página'}));
 expect(screen.getByLabelText('Conteúdo da página')).toHaveValue('');
 fireEvent.click(screen.getByRole('button',{name:'+ Tabela'}));
 expect(screen.getByLabelText('Conteúdo da página').value).toContain('| Resultado | Efeito |');
 fireEvent.click(screen.getByRole('button',{name:'1. Página 1'}));
 expect(screen.getByLabelText('Conteúdo da página')).toHaveValue('Primeiro efeito');
});
test('leitor permite consultar todas as páginas',()=>{
 render(<Reader habilidade={{paginas:[{titulo:'Efeito',conteudo:'Conteúdo inicial'},{titulo:'Limites',conteudo:'Conteúdo final'}]}}/>);
 expect(screen.getByText('Conteúdo inicial')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'→'}));
 expect(screen.getByText('Conteúdo final')).toBeInTheDocument();
 expect(screen.queryByText('Conteúdo inicial')).not.toBeInTheDocument();
});
test('expande a tabela pelo botão de coluna e de linha',()=>{
 render(<Studio/>);
 fireEvent.click(screen.getByRole('button',{name:'+ Tabela'}));
 fireEvent.click(screen.getByRole('button',{name:'+ Coluna'}));
 expect(screen.getByLabelText('Conteúdo da página').value).toContain('| Resultado | Efeito | Nova coluna |');
 fireEvent.click(screen.getByRole('button',{name:'+ Linha'}));
 expect(screen.getByLabelText('Conteúdo da página').value).toContain('|  |  |  |');
});

test('barra formata seleção, desfaz e refaz sem perder a página',()=>{
 render(<Studio/>);
 const area=screen.getByLabelText('Conteúdo da página');
 fireEvent.change(area,{target:{value:'Efeito da habilidade'}});
 area.setSelectionRange(0,6);
 fireEvent.click(screen.getByRole('button',{name:'Negrito'}));
 expect(area).toHaveValue('**Efeito** da habilidade');
 fireEvent.click(screen.getByRole('button',{name:'Desfazer',exact:true}));
 expect(area).toHaveValue('Efeito da habilidade');
 fireEvent.click(screen.getByRole('button',{name:'Refazer',exact:true}));
 expect(area).toHaveValue('**Efeito** da habilidade');
});

test('salva fonte e alinhamento na página e mantém aparência ao alternar páginas',()=>{
 render(<Studio/>);
 fireEvent.change(screen.getByLabelText('Fonte da página'),{target:{value:'serif'}});
 fireEvent.change(screen.getByLabelText('Alinhamento da página'),{target:{value:'center'}});
 fireEvent.change(screen.getByLabelText('Tamanho da fonte'),{target:{value:'18'}});
 expect(screen.getByLabelText('Conteúdo da página')).toHaveStyle({fontSize:'18px',textAlign:'center'});
 fireEvent.click(screen.getByRole('button',{name:'+ Nova página'}));
 expect(screen.getByLabelText('Fonte da página')).toHaveValue('mono');
 fireEvent.click(screen.getByRole('button',{name:'1. Página 1'}));
 expect(screen.getByLabelText('Fonte da página')).toHaveValue('serif');
 expect(screen.getByLabelText('Tamanho da fonte')).toHaveValue(18);
});
