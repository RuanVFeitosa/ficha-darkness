import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import TabletopSceneEditor from './TabletopSceneEditor';
jest.mock('./SceneAnimationEditor',()=>({media,onChange})=><div><p>Animando {media.nome}</p><button type="button" onClick={()=>onChange({enabled:true,breathing:.01})}>Ativar movimento</button></div>);
const initial={id:'scene1',nome:'O guardião',pasta:'Ato II',descricao:'Uma figura no corredor.',imagensCena:[{id:'a',nome:'Guardião',url:'/a.webp'},{id:'b',nome:'Retrato',url:'/b.webp'}],mapasBatalha:[{id:'mapa',nome:'Sala',url:'/mapa.webp',larguraGrade:12,alturaGrade:8}],dificuldades:{ambiente:5,combateAmbiente:6,conflitos:7},visualizarTodos:true,larguraGrade:12,alturaGrade:8};
function mount(){const save=jest.fn(),upload=jest.fn();function Harness(){const [editando,setEditando]=useState(initial);return <TabletopSceneEditor editando={editando} setEditando={setEditando} arquivos={{cena:[],mapa:[],especial:[],audio:[]}} campanha={{membros:[]}} nomesPastasCenas={['Ato II']} selecionarArquivosCena={upload} alternarJogadorCena={jest.fn()} removerMidiaExistente={jest.fn()} removerArquivoPendente={jest.fn()} atualizarMapaExistente={jest.fn()} atualizarMapaPendente={jest.fn()} confirmarCena={e=>{e.preventDefault();save(editando);}} onClose={jest.fn()}/>;}render(<Harness/>);return {save,upload};}
test('abre com imagens e mantém configurações secundárias fora da primeira aba',()=>{
 mount();
 expect(screen.getByRole('dialog',{name:'Editar cena'})).toBeInTheDocument();
 expect(screen.getByRole('tab',{name:'Cena'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByLabelText('Nome da cena')).toHaveValue('O guardião');
 expect(screen.getByLabelText('Pasta')).not.toBeVisible();
 expect(screen.getByLabelText('Ambiente')).not.toBeVisible();
 expect(screen.getByText('Uma figura no corredor.')).not.toBeVisible();
 expect(screen.getAllByRole('button',{name:'Animar'})).toHaveLength(2);
});
test('trocar de abas preserva edição e salva todos os dados existentes',()=>{
 const {save}=mount();
 fireEvent.change(screen.getByLabelText('Nome da cena'),{target:{value:'A revelação'}});
 fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));
 expect(screen.getByLabelText('Pasta')).toBeVisible();
 fireEvent.change(screen.getByLabelText('Pasta'),{target:{value:'Final'}});
 fireEvent.click(screen.getByText('Dificuldades · Espiral',{exact:true}));
 fireEvent.change(screen.getByLabelText('Ambiente'),{target:{value:'8'}});
 fireEvent.click(screen.getByRole('tab',{name:'Mapas'}));
 expect(screen.getByText('Sala')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Salvar cena'}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({nome:'A revelação',pasta:'Final',dificuldades:{ambiente:8,combateAmbiente:6,conflitos:7},mapasBatalha:initial.mapasBatalha,imagensCena:initial.imagensCena}));
});
test('atalho Animar abre a imagem escolhida e altera só sua configuração',()=>{
 const {save}=mount();
 fireEvent.click(screen.getAllByRole('button',{name:'Animar'})[1]);
 expect(screen.getByRole('tab',{name:'Animação'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByLabelText('Imagem para animar')).toHaveValue('b');
 fireEvent.click(screen.getByRole('button',{name:'Ativar movimento'}));
 fireEvent.click(screen.getByRole('tab',{name:'Cena'}));
 fireEvent.click(screen.getByRole('button',{name:'Salvar cena'}));
 expect(save.mock.calls[0][0].imagensCena[0].animation).toBeUndefined();
 expect(save.mock.calls[0][0].imagensCena[1].animation.enabled).toBe(true);
});
