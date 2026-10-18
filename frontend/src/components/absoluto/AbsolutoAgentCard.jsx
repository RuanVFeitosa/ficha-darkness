import React, {useState} from 'react';
const membros=[['cabeca','Cabeça'],['torso','Torso'],['bracoDireito','Braço direito'],['bracoEsquerdo','Braço esquerdo'],['pernaDireita','Perna direita'],['pernaEsquerda','Perna esquerda']];
const atributos=[['forca','Força'],['fonitude','Fortitude'],['inteligencia','Inteligência'],['reflexos','Reflexos'],['vontade','Vontade']];
function Meter({nome,atual,max,tipo}){const pct=max>0?Math.max(0,Math.min(100,(Number(atual)||0)/max*100)):0;return <div className={`ad-meter ad-${tipo}`}><div><span>{nome}</span><b>{atual ?? '—'} <small>/ {max ?? '—'}</small></b></div><div className="ad-meter-track"><i style={{width:`${pct}%`}}/></div></div>;}
export default function AbsolutoAgentCard({ficha,tipo='jogador',onAbrir}){
 const p=ficha.personagem || ficha;
 const storageKey=`darkness:card-background:${tipo}:${ficha.fichaId || p.id || p.nome}`;
 const padrao={x:50,y:50,zoom:100,fit:'cover',area:'resumo',escurecer:45};
 const [ajuste,setAjuste]=useState(()=>{try{return {...padrao,...JSON.parse(localStorage.getItem(storageKey) || '{}')};}catch{return padrao;}});
 const [editando,setEditando]=useState(false);
 const [erro,setErro]=useState('');
 const alterar=(campo,valor)=>setAjuste(a=>({...a,[campo]:valor}));
 const salvar=()=>{try{localStorage.setItem(storageKey,JSON.stringify(ajuste));setErro('');setEditando(false);}catch{setErro('Não foi possível salvar o ajuste neste navegador.');}};
 const abrir=()=>onAbrir(ficha,tipo);
 return <div className="ad-agent-wrapper"><article className={`ad-agent${p.fotoPerfil ? ' ad-agent-com-foto' : ''}${ajuste.area==='inteiro' ? ' ad-agent-fundo-inteiro' : ''}`} role="button" tabIndex={0} aria-label={`Abrir ficha de ${p.nome || 'personagem'}`} onClick={abrir} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir();}}}>
  {p.fotoPerfil && <div className="ad-agent-cover"><img src={p.fotoPerfil} alt="" loading="lazy" style={{objectFit:ajuste.fit,objectPosition:`${ajuste.x}% ${ajuste.y}%`,transform:`scale(${ajuste.zoom/100})`,transformOrigin:`${ajuste.x}% ${ajuste.y}%`}}/><div style={{position:'absolute',inset:0,background:`rgba(0,0,0,${ajuste.escurecer/100})`}}/></div>}
  <header className="ad-agent-identity">{p.fotoPerfil?<img src={p.fotoPerfil} alt="" loading="lazy"/>:<div className="ad-agent-placeholder" aria-hidden="true">{p.nome?.slice(0,1)||'?'}</div>}<div><span className="ad-eyebrow">{tipo==='jogador'?'PERSONAGEM':tipo==='npc'?'NPC':'INIMIGO'} · NV {p.nivel || 1}</span><h3>{p.nome || 'Sem nome'}</h3><p>{p.classe || 'Classe não informada'}</p>{p.nomeJogador && <small>Jogador · {p.nomeJogador}</small>}</div><span className="ad-agent-open" aria-hidden="true">↗</span></header>
  <dl className="ad-agent-attributes">{atributos.map(([key,nome])=><div key={key}><dt>{nome}</dt><dd>{p.atributos?.[key]?.atual ?? p.atributos?.[key]?.valor ?? p.atributos?.[key] ?? '—'}</dd></div>)}</dl>
  <section className="ad-agent-vitals" aria-label="Recursos do personagem"><h4>Integridade corporal</h4><div className="ad-agent-limbs">{membros.map(([key,nome])=><Meter key={key} nome={nome} atual={p.membros?.[key]?.atual} max={p.membros?.[key]?.max} tipo="integridade"/>)}</div><div className="ad-agent-mental"><Meter nome="Sanidade" atual={p.sanidade?.atual} max={p.sanidade?.max} tipo="sanidade"/>{tipo==='jogador' && <Meter nome="Esperança" atual={p.esperanca?.atual} max={p.esperanca?.max} tipo="esperanca"/>}</div></section>
  <footer><span>Consultar dossiê ↗</span>{p.fotoPerfil && <button type="button" className="ad-ajustar-foto" aria-expanded={editando} onClick={e=>{e.stopPropagation();setEditando(v=>!v);}}>Ajustar foto</button>}</footer>
 </article>{editando && <section className="ad-foto-editor" aria-label={`Ajustar foto de ${p.nome || 'personagem'}`}>
  <p>Ajuste o fundo com prévia no resumo. As preferências ficam salvas neste navegador.</p>
  <label>Área da foto<select value={ajuste.area} onChange={e=>alterar('area',e.target.value)}><option value="resumo">Nome e atributos</option><option value="inteiro">Card inteiro</option></select></label>
  <label>Enquadramento<select value={ajuste.fit} onChange={e=>alterar('fit',e.target.value)}><option value="cover">Preencher área</option><option value="contain">Mostrar foto inteira</option></select></label>
  {[['x','Posição horizontal',0,100,'%'],['y','Posição vertical',0,100,'%'],['zoom','Zoom',100,250,'%'],['escurecer','Escurecimento',0,85,'%']].map(([campo,nome,min,max,unidade])=><label key={campo}>{nome} · {ajuste[campo]}{unidade}<input type="range" aria-label={nome} min={min} max={max} value={ajuste[campo]} onChange={e=>alterar(campo,Number(e.target.value))}/></label>)}
  <div><button type="button" onClick={()=>setAjuste({...padrao})}>Restaurar padrão</button><button type="button" onClick={salvar}>Salvar ajuste</button></div>{erro && <p role="alert">{erro}</p>}
 </section>}</div>;
}
