import React from 'react';
const membros=[['cabeca','Cabeça'],['torso','Torso'],['bracoDireito','Braço direito'],['bracoEsquerdo','Braço esquerdo'],['pernaDireita','Perna direita'],['pernaEsquerda','Perna esquerda']];
const atributos=[['forca','Força'],['fonitude','Fortitude'],['inteligencia','Inteligência'],['reflexos','Reflexos'],['vontade','Vontade']];
function Meter({nome,atual,max,tipo}){const pct=max>0?Math.max(0,Math.min(100,(Number(atual)||0)/max*100)):0;return <div className={`ad-meter ad-${tipo}`}><div><span>{nome}</span><b>{atual ?? '—'} <small>/ {max ?? '—'}</small></b></div><div className="ad-meter-track"><i style={{width:`${pct}%`}}/></div></div>;}
export default function AbsolutoAgentCard({ficha,tipo='jogador',onAbrir}){
 const p=ficha.personagem || ficha;
 const abrir=()=>onAbrir(ficha,tipo);
 return <article className="ad-agent" role="button" tabIndex={0} aria-label={`Abrir ficha de ${p.nome || 'personagem'}`} onClick={abrir} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir();}}}>
  <header className="ad-agent-identity">{p.fotoPerfil?<img src={p.fotoPerfil} alt="" loading="lazy"/>:<div className="ad-agent-placeholder" aria-hidden="true">{p.nome?.slice(0,1)||'?'}</div>}<div><span className="ad-eyebrow">{tipo==='jogador'?'PERSONAGEM':tipo==='npc'?'NPC':'INIMIGO'} · NV {p.nivel || 1}</span><h3>{p.nome || 'Sem nome'}</h3><p>{p.classe || 'Classe não informada'}</p>{p.nomeJogador && <small>Jogador · {p.nomeJogador}</small>}</div><span className="ad-agent-open" aria-hidden="true">↗</span></header>
  <dl className="ad-agent-attributes">{atributos.map(([key,nome])=><div key={key}><dt>{nome}</dt><dd>{p.atributos?.[key]?.atual ?? p.atributos?.[key]?.valor ?? p.atributos?.[key] ?? '—'}</dd></div>)}</dl>
  <section className="ad-agent-vitals" aria-label="Recursos do personagem"><h4>Integridade corporal</h4><div className="ad-agent-limbs">{membros.map(([key,nome])=><Meter key={key} nome={nome} atual={p.membros?.[key]?.atual} max={p.membros?.[key]?.max} tipo="integridade"/>)}</div><div className="ad-agent-mental"><Meter nome="Sanidade" atual={p.sanidade?.atual} max={p.sanidade?.max} tipo="sanidade"/>{tipo==='jogador' && <Meter nome="Esperança" atual={p.esperanca?.atual} max={p.esperanca?.max} tipo="esperanca"/>}</div></section>
  <footer>Consultar dossiê <span aria-hidden="true">↗</span></footer>
 </article>;
}