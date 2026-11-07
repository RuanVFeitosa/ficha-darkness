import React,{useState} from 'react';
import Icon from '@mdi/react';
import {mdiMagnify,mdiPlus,mdiPencilOutline,mdiDeleteOutline,mdiArrowRight} from '@mdi/js';
import '../../styles/SystemAbilitiesCatalog.css';

const categories=[
 {id:'absolutas',name:'Habilidades absolutas',short:'Absoluta',number:'01',description:'Os poderes que definem a classe.'},
 {id:'aptidoes',name:'Aptidões',short:'Aptidão',number:'02',description:'Talentos, técnicas e recursos passivos.'},
 {id:'especialidade',name:'Especialidades',short:'Especialidade',number:'03',description:'Trilhas e habilidades de especialização.'},
];
const normalize=value=>String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const treeCount=tree=>(tree.absolutas?.length || 0)+(tree.aptidoes?.length || 0)+(tree.especialidades || []).reduce((count,item)=>count+(item.habilidades?.length || 0),0);
function AbilityFields({value,onChange,creating=false,disabled=false}){
 const suffix=creating?'da nova habilidade':'da habilidade';
 return <div className="sa-fields">
  <label>Nome<input aria-label={`Nome ${suffix}`} value={value?.nome || ''} required disabled={disabled} onChange={event=>onChange({...value,nome:event.target.value})} placeholder="Nome da habilidade"/></label>
  <label>Custo<input aria-label={`Custo ${suffix}`} value={value?.custo || ''} disabled={disabled} onChange={event=>onChange({...value,custo:event.target.value})} placeholder="Ex.: 2 PE, Passiva, Reação…"/></label>
  <label className="sa-field-description">Descrição<textarea aria-label={`Descrição ${suffix}`} value={value?.descricao || ''} rows={7} disabled={disabled} onChange={event=>onChange({...value,descricao:event.target.value})} placeholder="Descreva o efeito, as condições e os limites."/></label>
 </div>;
}
export default function SystemAbilitiesCatalog({trees,activeClass,activeType,specialtyId,onClassChange,onTypeChange,onSpecialtyChange,
 showForm,form,creatingEditId,onToggleForm,onFormChange,onSaveNew,onCancelNew,
 editingId,editingData,onEdit,onEditChange,onSaveEdit,onCancelEdit,onDelete,saving=false}) {
 const [search,setSearch]=useState('');
 const tree=trees[activeClass] || {},specialties=tree.especialidades || [],specialty=specialties.find(item=>item.id===specialtyId);
 const category=categories.find(item=>item.id===activeType) || categories[0];
 const items=activeType==='especialidade'?specialty?.habilidades || []:tree[activeType] || [];
 const filtered=items.filter(item=>normalize(`${item.nome} ${item.descricao} ${item.custo}`).includes(normalize(search)) || item.id===editingId);
 const categoryCount=id=>id==='especialidade'?specialties.reduce((count,item)=>count+(item.habilidades?.length || 0),0):(tree[id]?.length || 0);
 return <section className="system-abilities" aria-label="Habilidades do sistema">
  <header className="sa-heading"><div><span className="sa-kicker">PROTOCOLOS / DARKNESS</span><h2>Arquivo de habilidades</h2><p>Consulte as regras de cada classe e personalize os efeitos da sua mesa.</p></div><button type="button" className="sa-primary" disabled={saving} aria-expanded={showForm} onClick={onToggleForm}><Icon path={mdiPlus} size={.8}/>{showForm?'Fechar formulário':'Nova habilidade'}</button></header>
  <div className="sa-class-label"><span>ESCOLHA A CLASSE</span><small>{Object.keys(trees).length} classes no arquivo</small></div>
  <nav className="sa-classes" aria-label="Classes de habilidades">{Object.entries(trees).map(([id,item],index)=><button type="button" key={id} disabled={saving} aria-pressed={activeClass===id} onClick={()=>onClassChange(id)}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.classe || id}</strong><small>{treeCount(item)} habilidades</small></button>)}</nav>
  <div className="sa-class-summary"><div><span className="sa-kicker">{tree.classe || 'Classe selecionada'}</span><h3>{tree.titulo || 'Regras da classe'}</h3></div>{tree.beneficio&&<div className="sa-class-benefit"><span>BENEFÍCIO DA CLASSE</span><p>{tree.beneficio}</p></div>}</div>
  <nav className="sa-categories" aria-label="Categorias de habilidades">{categories.map(item=><button type="button" key={item.id} disabled={saving} aria-pressed={activeType===item.id} onClick={()=>onTypeChange(item.id)}><span className="sa-category-number">{item.number}</span><div><strong>{item.name}</strong><small>{item.description}</small></div><b>{String(categoryCount(item.id)).padStart(2,'0')}</b></button>)}</nav>
  {activeType==='especialidade'&&<section className="sa-specialty"><div><label>Trilha de especialidade<select aria-label="Trilha de especialidade" value={specialtyId} onChange={event=>onSpecialtyChange(event.target.value)} disabled={saving || !specialties.length}>{!specialties.length&&<option value="">Nenhuma especialidade cadastrada</option>}{specialties.map(item=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>{specialty?.descricao&&<p>{specialty.descricao}</p>}</div>{specialty?.passiva&&<details><summary>Benefício passivo da trilha</summary><p>{specialty.passiva}</p></details>}</section>}
  {showForm&&<form className="sa-new-form" onSubmit={onSaveNew} aria-label="Criar habilidade"><header><div><span className="sa-kicker">EDIÇÃO DO ARQUIVO</span><h3>{creatingEditId?'Editar habilidade':'Nova habilidade'}</h3></div><small>As alterações são compartilhadas com as fichas.</small></header><div className="sa-form-context"><label>Classe<select aria-label="Classe da nova habilidade" value={activeClass} onChange={event=>onClassChange(event.target.value)} disabled={saving}>{Object.entries(trees).map(([id,item])=><option value={id} key={id}>{item.classe || id}</option>)}</select></label><label>Categoria<select aria-label="Categoria da nova habilidade" value={activeType} onChange={event=>onTypeChange(event.target.value)} disabled={saving}>{categories.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{activeType==='especialidade'&&<label>Especialidade<select aria-label="Especialidade da nova habilidade" required value={specialtyId} onChange={event=>onSpecialtyChange(event.target.value)} disabled={saving}><option value="">Selecione uma especialidade</option>{specialties.map(item=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>}</div><AbilityFields value={form} onChange={onFormChange} creating disabled={saving}/><footer><span>A confirmação aparece após a gravação no servidor.</span><button type="button" disabled={saving} onClick={onCancelNew}>Cancelar</button><button type="submit" className="sa-primary" disabled={saving}>{saving?'Salvando…':creatingEditId?'Salvar alteração':'Criar habilidade'}</button></footer></form>}
  <div className="sa-toolbar"><div><h3>{activeType==='especialidade'?(specialty?.nome || 'Especialidades'):category.name}</h3><span aria-live="polite">{search?`${filtered.length} de ${items.length}`:items.length} {items.length===1?'habilidade':'habilidades'}</span></div><label className="sa-search"><Icon path={mdiMagnify} size={.85}/><input type="search" aria-label="Buscar habilidades" placeholder="Buscar nome, efeito ou custo…" value={search} onChange={event=>setSearch(event.target.value)}/>{search&&<button type="button" aria-label="Limpar busca de habilidades" onClick={()=>setSearch('')}>×</button>}</label></div>
  <div className="sa-card-grid">{filtered.map((item,index)=>{
   const editing=editingId===item.id;
   return <article className={`sa-card ${editing?'is-editing':''}`} key={item.id} aria-label={item.nome}>
    <div className="sa-card-top"><span className="sa-card-index">{String(index+1).padStart(2,'0')} <i/> {category.short}</span>{item.editadoPeloMestre&&<span className="sa-custom">Personalizada</span>}<button type="button" className="sa-delete" disabled={saving} title="Excluir habilidade" aria-label={`Excluir ${item.nome}`} onClick={()=>onDelete(item.id)}><Icon path={mdiDeleteOutline} size={.8}/></button></div>
    {editing?<><h4>Editar habilidade</h4><AbilityFields value={editingData} onChange={onEditChange} disabled={saving}/><footer className="sa-card-edit-actions"><button type="button" onClick={onCancelEdit} disabled={saving}>Cancelar</button><button type="button" onClick={onSaveEdit} className="sa-primary" disabled={saving}>{saving?'Salvando…':'Salvar alterações'}</button></footer></>:<><h4>{item.nome}</h4><p className="sa-description">{item.descricao || 'Esta habilidade ainda não possui descrição.'}</p><footer><div className="sa-cost"><span>CUSTO</span><strong>{item.custo || 'Não informado'}</strong></div><button type="button" disabled={saving} onClick={()=>onEdit(item)} aria-label={`Editar ${item.nome}`}><Icon path={mdiPencilOutline} size={.75}/>Editar<Icon path={mdiArrowRight} size={.7}/></button></footer></>}
   </article>;
  })}</div>
  {!filtered.length&&<div className="sa-empty"><span>ARQUIVO DA CLASSE</span><h3>{search?'Nenhuma habilidade encontrada.':'Este capítulo ainda está em branco.'}</h3><p>{search?'Tente outro nome, efeito ou custo para localizar a habilidade.':'Adicione uma habilidade a esta categoria para começar.'}</p><button type="button" onClick={()=>search?setSearch(''):onToggleForm()}>{search?'Limpar busca':'Adicionar habilidade'}</button></div>}
  <div className="sa-bottom-note"><span>REGRAS DA MESA</span><p>As personalizações do mestre são preservadas. Abra uma habilidade para editar nome, custo e descrição.</p></div>
 </section>;
}
