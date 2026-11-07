import React,{useState} from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import SystemAbilitiesCatalog from './SystemAbilitiesCatalog';
const trees={aniquilador:{classe:'Aniquilador',titulo:'A aniquilação absoluta',beneficio:'Recebe +1 dado no dano.',absolutas:[{id:'focus',nome:'Concentração',descricao:'Prepare um ataque com vantagem.',custo:'10 PE'},{id:'impact',nome:'Impacto',descricao:'Intimide um alvo.',custo:'5 PE'}],aptidoes:[{id:'vigor',nome:'Vigor',descricao:'Resista à exaustão.',custo:'Passiva'}],especialidades:[{id:'trail',nome:'Lutador',passiva:'Apoie os pés no chão.',habilidades:[{id:'grapple',nome:'Agarrar',descricao:'Segure o oponente.',custo:'1 PE'}]}]},especialista:{classe:'Especialista',absolutas:[],aptidoes:[],especialidades:[]}};
function Harness({save=jest.fn(),remove=jest.fn(),saving=false}){
 const [activeClass,setClass]=useState('aniquilador'),[activeType,setType]=useState('absolutas'),[specialtyId,setSpecialty]=useState('trail'),[showForm,setShow]=useState(false),[form,setForm]=useState({nome:'',custo:'',descricao:''}),[editingId,setEditing]=useState(null),[editingData,setData]=useState(null);
 return <SystemAbilitiesCatalog trees={trees} activeClass={activeClass} activeType={activeType} specialtyId={specialtyId} onClassChange={setClass} onTypeChange={setType} onSpecialtyChange={setSpecialty} showForm={showForm} form={form} onToggleForm={()=>setShow(value=>!value)} onFormChange={setForm} onSaveNew={event=>{event.preventDefault();save(form);}} onCancelNew={()=>setShow(false)} editingId={editingId} editingData={editingData} onEdit={item=>{setEditing(item.id);setData(item);}} onEditChange={setData} onSaveEdit={()=>save(editingData)} onCancelEdit={()=>setEditing(null)} onDelete={remove} saving={saving}/>;
}
test('busca ignora acentos, filtra cartões e permite limpar sem perder a categoria',()=>{
 render(<Harness/>);
 fireEvent.change(screen.getByLabelText('Buscar habilidades'),{target:{value:'concentracao'}});
 expect(screen.getByRole('article',{name:'Concentração'})).toBeInTheDocument();
 expect(screen.queryByRole('article',{name:'Impacto'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Limpar busca de habilidades'}));
 expect(screen.getAllByRole('article')).toHaveLength(2);
});
test('categorias exibem aptidões e a trilha com seu benefício passivo',()=>{
 render(<Harness/>);
 fireEvent.click(screen.getByRole('button',{name:/Aptidões/}));
 expect(screen.getByRole('article',{name:'Vigor'})).toHaveTextContent('Passiva');
 fireEvent.click(screen.getByRole('button',{name:/Especialidades/}));
 expect(screen.getByLabelText('Trilha de especialidade')).toHaveValue('trail');
 fireEvent.click(screen.getByText('Benefício passivo da trilha'));
 expect(screen.getByText('Apoie os pés no chão.')).toBeVisible();
 expect(screen.getByRole('article',{name:'Agarrar'})).toBeInTheDocument();
});
test('edição preserva os campos, mostra custo no cartão e mantém exclusão explícita',()=>{
 const save=jest.fn(),remove=jest.fn();render(<Harness save={save} remove={remove}/>);
 expect(within(screen.getByRole('article',{name:'Concentração'})).getByText('10 PE')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Editar Concentração'}));
 fireEvent.change(screen.getByLabelText('Descrição da habilidade'),{target:{value:'Efeito do mestre.'}});
 fireEvent.change(screen.getByLabelText('Custo da habilidade'),{target:{value:'3 PE'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar alterações'}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({id:'focus',descricao:'Efeito do mestre.',custo:'3 PE'}));
 fireEvent.click(screen.getByRole('button',{name:'Cancelar',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Excluir Impacto'}));
 expect(remove).toHaveBeenCalledWith('impact');
});
test('formulário cria habilidade com contexto e campos completos',()=>{
 const save=jest.fn();render(<Harness save={save}/>);
 fireEvent.click(screen.getByRole('button',{name:'Nova habilidade',exact:true}));
 fireEvent.change(screen.getByLabelText('Nome da nova habilidade'),{target:{value:'Último recurso'}});
 fireEvent.change(screen.getByLabelText('Descrição da nova habilidade'),{target:{value:'Uma reação.'}});
 fireEvent.change(screen.getByLabelText('Custo da nova habilidade'),{target:{value:'2 PE'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar habilidade',exact:true}));
 expect(save).toHaveBeenCalledWith({nome:'Último recurso',descricao:'Uma reação.',custo:'2 PE'});
});
test('gravação em andamento bloqueia ações concorrentes',()=>{
 render(<Harness saving/>);
 expect(screen.getByRole('button',{name:'Nova habilidade',exact:true})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Editar Impacto'})).toBeDisabled();
 expect(screen.getByRole('button',{name:/Especialidades/})).toBeDisabled();
});
