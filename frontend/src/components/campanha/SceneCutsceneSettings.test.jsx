import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SceneCutsceneSettings from './SceneCutsceneSettings';
const project={version:1,name:'A chegada',duration:12,layers:[{id:'token',type:'token',src:'/hero.png'}]};
const campaign={codigo:'TEST12',cenas:[{id:'source',nome:'A chegada',cenaEspecial:{cutscene:project}}]};
function Harness({initial={id:'target',nome:'Cena da sessão'},onChange=jest.fn()}){
 const [scene,setScene]=useState(initial);
 return <SceneCutsceneSettings scene={scene} campaign={campaign} onChange={next=>{setScene(next);onChange(next);}}/>;
}
test('escolhe projeto existente sem mudar a identidade da cena e permite remover a cópia',()=>{
 const change=jest.fn();render(<Harness onChange={change}/>);
 fireEvent.change(screen.getByLabelText('Cutscene desta cena'),{target:{value:'source'}});
 expect(change).toHaveBeenLastCalledWith(expect.objectContaining({id:'target',nome:'Cena da sessão',cenaEspecial:expect.objectContaining({ativo:true,tipoMidia:'cutscene',cutsceneSourceId:'source',cutscene:project})}));
 expect(screen.getByText('12s · 1 camadas')).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Editar cutscene no estúdio ↗'})).toHaveAttribute('href',expect.stringContaining('cena=target'));
 fireEvent.click(screen.getByRole('button',{name:'Remover cutscene desta cena'}));
 expect(change).toHaveBeenLastCalledWith(expect.objectContaining({cenaEspecial:null}));
 expect(screen.getByLabelText('Cutscene desta cena')).toHaveValue('');
});
test('desativa a apresentação mantendo o projeto para editar depois',()=>{
 const change=jest.fn();render(<Harness initial={{id:'target',cenaEspecial:{ativo:true,tipoMidia:'cutscene',cutscene:project}}} onChange={change}/>);
 fireEvent.click(screen.getByLabelText('Disponibilizar cutscene nos tabletops'));
 expect(change).toHaveBeenLastCalledWith(expect.objectContaining({cenaEspecial:expect.objectContaining({ativo:false,cutscene:project})}));
});
test('orienta criar no estúdio quando a campanha ainda não tem projetos',()=>{
 render(<SceneCutsceneSettings scene={{}} campaign={{codigo:'NEW12',cenas:[]}} onChange={jest.fn()}/>);
 expect(screen.getByText(/Nenhum projeto salvo nesta campanha/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Criar cutscene no estúdio ↗'})).toHaveAttribute('href','/?cutscene=1&campanha=NEW12&retorno=campaign');
});
