import EspiralDice from '../components/EspiralDice';
import React, { useState } from 'react';
import { CATEGORIAS_LOJA } from '../data/catalogoLoja';
import { CATEGORIAS_ESPIRAL } from '../data/catalogoEspiral';
import { APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from '../data/habilidadesEspiral';
import '../CSS/BuildCatalog.css';
const secoes = [{id:'absolutas',nome:'Habilidades absolutas'},{id:'aptidoes',nome:'Aptidões'},{id:'especialidades',nome:'Especialidades'}];
const normalizar = v=>String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function Tabs({label,opcoes,valor,onChange}) {
  return <nav className="bc-tabs" aria-label={label}>{opcoes.map(o=><button type="button" key={o.id} aria-pressed={valor===o.id} onClick={()=>onChange(o.id)}>{o.nome}</button>)}</nav>;
}
function ArmaAbsoluta({dados}) {
  return <div className="bc-arma"><dl className="bc-estatisticas">{[['DMG',dados.dmg],['ROF',dados.rof],['MAG',dados.mag]].filter(([,v])=>v!==undefined).map(([label,v])=><div key={label}><dt>{label}</dt><dd>{v}</dd></div>)}</dl><dl className="bc-modos">{['hipfire','precision','control','mobility'].filter(k=>dados[k]).map(k=><div key={k}><dt>{k}</dt><dd>{dados[k]}</dd></div>)}</dl><div className="bc-tags">{[['Disparos',dados.disparosSemDesvantagem],['Recarga',dados.recarga],['Crítico',dados.critico],['Cabeça',dados.danoCabeca]].filter(([,v])=>v!==undefined).map(([k,v])=><span key={k}>{k}: {v}</span>)}</div></div>;
}
export default function BuildCatalog({ sistema, entries, selected, onToggle, busca, setBusca }) {
  const espiral=sistema==='espiral';
  const [tipo,setTipo]=useState('habilidade'), [categoria,setCategoria]=useState(''), [classe,setClasse]=useState(''), [arma,setArma]=useState('fogo');
  const fonte=entries.filter(e=>e.sistema===sistema && e.tipo===tipo);
  const classes=[...new Map(fonte.filter(e=>e.classeId).map(e=>[e.classeId,{id:e.classeId,nome:e.grupo}])).values()];
  const classeAtual=classe || classes[0]?.id;
  const categorias=tipo==='item' ? (espiral ? CATEGORIAS_ESPIRAL : CATEGORIAS_LOJA) : espiral ? [...new Set(fonte.map(e=>e.categoria))].map(c=>({id:c,nome:c==='vertentes' ? 'Vertentes' : c})) : secoes;
  const atual=categorias.some(c=>c.id===categoria) ? categoria : categorias[0]?.id;
  const resultados=fonte.filter(e=>(espiral || tipo==='item' || e.classeId===classeAtual) && e.categoria===atual && !(espiral && tipo==='item' && atual==='armas' && e.weaponGroup!==arma) && normalizar(`${e.nome} ${e.descricao} ${e.grupo} ${(e.niveis || []).join(' ')}`).includes(normalizar(busca)));
  return <section className={`build-catalog ${espiral ? 'bc-espiral' : 'bc-absoluto'}`} aria-label={`Catálogo de builds ${espiral ? 'ESPIRAL' : 'Sistema Absoluto'}`}>
    <Tabs label="Tipo de seleção da build" opcoes={[{id:'habilidade',nome:'Habilidades'},{id:'item',nome:'Armas e equipamentos'}]} valor={tipo} onChange={v=>{setTipo(v);setCategoria('');setBusca('');}}/>
    {!espiral && tipo==='habilidade' && <Tabs label="Classes do Sistema Absoluto" opcoes={classes} valor={classeAtual} onChange={setClasse}/>}
    <Tabs label="Categorias do catálogo" opcoes={categorias} valor={atual} onChange={setCategoria}/>
    {espiral && tipo==='item' && atual==='armas' && <Tabs label="Tipos de armas ESPIRAL" opcoes={[{id:'brancas',nome:'Armas brancas'},{id:'fogo',nome:'Armas de fogo'}]} valor={arma} onChange={setArma}/>}
    <label className="bc-busca">Buscar no catálogo<input type="search" placeholder={tipo==='item' ? 'Nome ou efeito do item' : 'Nome ou efeito da habilidade'} value={busca} onChange={e=>setBusca(e.target.value)}/></label>
    <p className="bc-nota">Selecione para planejar sua build. A aquisição continua pela ficha do personagem.</p><p className="bc-contagem" aria-live="polite">{resultados.length} registros disponíveis</p>
    <div className="bc-grid">{resultados.map(e=>{
      const niveis=e.niveis || APRIMORAMENTOS_HABILIDADES_ESPIRAL[e.nome] || [e.descricao];
      const custo=CUSTOS_ESPERANCA_HABILIDADES[e.nome] || [0,0];
      const selecionado=selected.includes(e.id);
      return <article key={e.id} className={`bc-card ${tipo==='item' ? 'bc-card-item' : 'bc-card-habilidade'}`}>
        <small className="bc-categoria">{tipo==='item' ? e.armaStatus?.tipo || categorias.find(c=>c.id===e.categoria)?.nome : espiral ? `${e.grupo}${e.acao ? ` · Ação ${e.acao}` : ''}` : secoes.find(c=>c.id===e.categoria)?.nome}</small><h3>{e.nome}</h3>
        {espiral && tipo==='habilidade' ? <><p className="bc-esperanca">{e.categoria==='vertentes' ? 'Habilidade de Vertente' : custo[0] ? `Esperança: ${custo[0]} no Fracasso / ${custo[1]} no Sucesso com Consequência` : 'Esperança: sem custo'}</p><ol className="bc-niveis">{niveis.map((n,i)=><li key={i}><b>Nível {['I','II','III'][i] || i+1}</b><p>{n}</p></li>)}</ol></> : <>
          {espiral && tipo==='item' && <div className="bc-fatos">{e.damage && <span>Dano<strong>{<EspiralDice value={e.damage}/>}</strong></span>}{e.value!==undefined && <span>Proteção<strong>{e.value}</strong></span>}{e.region && <span>Região<strong>{e.region}</strong></span>}</div>}
          <p className="bc-descricao">{e.descricao}</p>{!espiral && e.armaStatus && <ArmaAbsoluta dados={e.armaStatus}/>}{e.custo && <small>Custo de uso: {e.custo}</small>}
        </>}
        <footer>{!espiral && e.preco!==undefined && <strong>{e.preco} cr</strong>}<button type="button" aria-pressed={selecionado} aria-label={`${selecionado ? 'Remover' : 'Adicionar'} ${e.nome} ${selecionado ? 'da' : 'à'} build`} onClick={()=>onToggle(e.id)}>{selecionado ? '− Remover' : '+ Combinar'}</button></footer>
      </article>;
    })}</div>{!resultados.length && <p>Nenhum registro encontrado nesta categoria.</p>}
  </section>;
}
