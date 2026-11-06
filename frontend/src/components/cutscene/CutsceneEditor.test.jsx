import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CutsceneEditor from './CutsceneEditor';
beforeEach(()=>localStorage.clear());

test('cria legenda, edita movimento, desfaz/refaz e aplica a sequência completa',async()=>{
 const apply=jest.fn();render(<CutsceneEditor onApply={apply}/>);
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 fireEvent.change(screen.getByLabelText('Texto da legenda'),{target:{value:'A porta se abre.'}});
 fireEvent.click(screen.getByRole('button',{name:'Posição final'}));
 fireEvent.change(screen.getByLabelText('Posição X'),{target:{value:'75'}});
 fireEvent.click(screen.getByRole('button',{name:'Desfazer'}));
 expect(screen.getByLabelText('Posição X')).toHaveValue(50);
 fireEvent.click(screen.getByRole('button',{name:'Refazer'}));
 expect(screen.getByLabelText('Posição X')).toHaveValue(75);
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 expect(apply.mock.calls[0][0].layers[0]).toMatchObject({type:'text',text:'A porta se abre.',to:{x:75},start:0,end:20});
});
test('biblioteca inclui o token animado e preserva a animação',async()=>{
 localStorage.setItem('tabletop_token_animations_v1',JSON.stringify([{id:'hero',name:'Victoria',image:'/hero.png',animation:{enabled:true,closedImage:'/blink.png'}}]));
 const apply=jest.fn();render(<CutsceneEditor onApply={apply}/>);
 fireEvent.change(screen.getByLabelText('Biblioteca da campanha'),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:'Adicionar da biblioteca'}));
 expect(screen.getByAltText('Victoria')).toHaveAttribute('src','/hero.png');
 fireEvent.click(screen.getByRole('button',{name:'Aplicar à cena'}));
 await waitFor(()=>expect(apply).toHaveBeenCalled());
 expect(apply.mock.calls[0][0].layers[0]).toMatchObject({type:'token',animation:{closedImage:'/blink.png'}});
});
test('recupera rascunho após sair do editor',()=>{
 const view=render(<CutsceneEditor draftKey="draft:test"/>);
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 fireEvent.change(screen.getByLabelText('Texto da legenda'),{target:{value:'Rascunho preservado'}});
 view.unmount();render(<CutsceneEditor draftKey="draft:test"/>);
 fireEvent.click(screen.getByRole('button',{name:'Selecionar clipe Legenda'}));
 expect(screen.getByLabelText('Texto da legenda')).toHaveValue('Rascunho preservado');
});
test('arquivo importado vira camada sem converter a imagem animada',async()=>{
 const upload=jest.fn(async()=>({src:'blob:gif',srcPersistida:'local-image://gif'}));
 render(<CutsceneEditor onUpload={upload}/>);
 const file=new File(['GIF89a'],'intro.gif',{type:'image/gif'});
 fireEvent.change(screen.getByLabelText('Adicionar imagem à cutscene'),{target:{files:[file]}});
 await waitFor(()=>expect(screen.getByAltText('intro')).toHaveAttribute('src','blob:gif'));
 expect(upload).toHaveBeenCalledWith(file,'especial');
});

test('estúdio independente mantém edição, categorias, zoom e altura da linha do tempo',()=>{
 render(<CutsceneEditor standalone navigation={<a href="/?mestre=1">Voltar</a>}/>);
 expect(screen.getByRole('navigation',{name:'Ferramentas do estúdio'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Mídia'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Texto',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'＋ Texto / legenda'}));
 expect(screen.getByLabelText('Texto da legenda')).toBeVisible();
 fireEvent.change(screen.getByLabelText('Nome da cutscene'),{target:{value:'Cena em tela inteira'}});
 expect(screen.getByLabelText('Nome da cutscene')).toHaveValue('Cena em tela inteira');
 fireEvent.change(screen.getByLabelText('Zoom da linha do tempo'),{target:{value:'2'}});
 expect(screen.getByLabelText('Zoom da linha do tempo')).toHaveValue('2');
 const separator=screen.getByRole('separator',{name:'Altura da linha do tempo'});
 fireEvent.keyDown(separator,{key:'ArrowUp'});
 expect(separator).toHaveAttribute('aria-valuenow','37');
 fireEvent.click(screen.getByRole('button',{name:'Projeto',exact:true}));
 expect(screen.getByLabelText('Duração (s)')).toBeVisible();
});
