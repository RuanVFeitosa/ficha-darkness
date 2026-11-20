import React,{useState} from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CharacterStory from './CharacterStory';
import {importStoryPdf} from '../../services/storyPdf';
import {externalizarImagens} from '../../services/mediaStorage';
jest.mock('../../services/storyPdf',()=>({importStoryPdf:jest.fn()}));
jest.mock('../../services/mediaStorage',()=>({externalizarImagens:jest.fn(value=>Promise.resolve(value))}));
beforeEach(()=>externalizarImagens.mockImplementation(value=>Promise.resolve(value)));
function Story({initial={name:'Ana',backgroundHistory:'História anterior.'}}){const [sheet,setSheet]=useState(initial);return <><CharacterStory sheet={sheet} setSheet={setSheet}/><div data-testid="sheet">{JSON.stringify(sheet)}</div></>;}

test('preserva história anterior, permite criar páginas e recuperar uma página removida',()=>{
 render(<Story/>);
 expect(screen.getByLabelText('Texto da história · página 1')).toHaveValue('História anterior.');
 fireEvent.click(screen.getByText('+ Página'));
 fireEvent.change(screen.getByLabelText('Título da página'),{target:{value:'Depois do horror'}});
 fireEvent.change(screen.getByLabelText('Texto da história · página 2'),{target:{value:'Uma nova vida.'}});
 const saved=JSON.parse(screen.getByTestId('sheet').textContent);
 expect(saved.backgroundPages).toHaveLength(2);
 expect(saved.backgroundPages[0].text).toBe('História anterior.');
 fireEvent.click(screen.getByText('Remover página'));
 fireEvent.click(screen.getByText('Desfazer exclusão'));
 expect(screen.getByLabelText('Texto da história · página 2')).toHaveValue('Uma nova vida.');
});

test('PDF é separado em páginas e importado sem substituir a história existente',async()=>{
 importStoryPdf.mockResolvedValue([{id:'pdf1',kind:'pdf',title:'Arquivo 1',source:'historia.pdf',sourcePage:1,image:'/page1.webp',text:'Primeira página'},{id:'pdf2',kind:'pdf',title:'Arquivo 2',source:'historia.pdf',sourcePage:2,image:'/page2.webp',text:''}]);
 render(<Story/>);
 fireEvent.change(screen.getByLabelText('Importar PDF da história'),{target:{files:[new File(['pdf'],'historia.pdf',{type:'application/pdf'})]}});
 await waitFor(()=>expect(screen.getByAltText('Página 1 de historia.pdf')).toBeInTheDocument());
 expect(JSON.parse(screen.getByTestId('sheet').textContent).backgroundPages).toHaveLength(3);
 fireEvent.click(screen.getByText('Editar texto'));
 expect(screen.getByLabelText('Texto da história · página 2')).toHaveValue('Primeira página');
 fireEvent.click(screen.getByRole('button',{name:'Próxima página da história'}));
 expect(screen.getByAltText('Página 2 de historia.pdf')).toBeInTheDocument();
});

test('erro na importação preserva as páginas atuais',async()=>{
 importStoryPdf.mockRejectedValueOnce(new Error('PDF inválido.'));
 render(<Story/>);
 fireEvent.change(screen.getByLabelText('Importar PDF da história'),{target:{files:[new File(['bad'],'erro.pdf',{type:'application/pdf'})]}});
 expect(await screen.findByText('PDF inválido.')).toBeInTheDocument();
 expect(screen.getByLabelText('Texto da história · página 1')).toHaveValue('História anterior.');
});
