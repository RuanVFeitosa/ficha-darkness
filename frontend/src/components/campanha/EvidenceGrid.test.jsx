import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EvidenceGrid from './EvidenceGrid';

const documentos = Array.from({length:12},(_,i)=>({id:String(i),campanhaId:'c',campanhaNome:'Campanha',nome:`Documento ${i+1}`}));
beforeEach(()=>{jest.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({width:400,top:300});Object.defineProperty(window,'innerHeight',{value:768,writable:true,configurable:true});});
afterEach(()=>jest.restoreAllMocks());
test('distribui evidências em páginas, navega sem sair e abre o documento correto',()=>{
 const onSelect=jest.fn();
 render(<EvidenceGrid documentos={documentos} onSelect={onSelect}/>);
 expect(screen.getByText(/1–4 de 12 documentos/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/Documento 5 /})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Página 2'}));
 expect(screen.getByText(/5–8 de 12 documentos/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Documento 5 /}));
 expect(onSelect).toHaveBeenCalledWith(documentos[4]);
 fireEvent.click(screen.getByRole('button',{name:'Próxima página'}));
 expect(screen.getByRole('button',{name:'Próxima página'})).toBeDisabled();
});
test('ajusta a quantidade à altura da janela e limita a página quando documentos são removidos',()=>{
 const {rerender}=render(<EvidenceGrid documentos={documentos} onSelect={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Página 3'}));
 window.innerHeight=592;fireEvent(window,new Event('resize'));
 expect(screen.getByText(/5–6 de 12 documentos/)).toBeInTheDocument();
 rerender(<EvidenceGrid documentos={documentos.slice(0,1)} onSelect={()=>{}}/>);
 expect(screen.getByText(/1–1 de 1 documentos/)).toBeInTheDocument();
 expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});