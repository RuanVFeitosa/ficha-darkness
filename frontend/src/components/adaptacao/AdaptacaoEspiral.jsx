import React, {useState} from 'react';
import {ATTRIBUTES, RESOURCES, GRADES, VERTENTES, integrityMax} from '../../data/espiral';
import {convertDarknessToEspiral, stageFromDarknessAttribute, adaptationResourceSources} from '../../utils/darknessToEspiral';
import {nomesPassivas} from '../../data/absolutoAtivos';
import '../../styles/AdaptacaoEspiral.css';

const graus=['0','I','II','III','IV'];
const fontes=adaptationResourceSources;
const nomeAntigo={...nomesPassivas,combate:'Combate',armasDeFogo:'Armas de fogo',rastreamento:'Rastreamento',hacking:'Hacking',pilotagem:'Pilotagem',direcao:'Direção',resiliencia:'Resiliência',persistencia:'Persistência'};

export default function AdaptacaoEspiral({personagem,fichaId,onClose,onConcluir,verificarExistente=true}) {
 const [etapa,setEtapa]=useState(0);
 const [atributos,setAtributos]=useState(()=>convertDarknessToEspiral(personagem).attributes);
 const [fontePulso,setFontePulso]=useState('maior');
 const [recursos,setRecursos]=useState(()=>({...convertDarknessToEspiral(personagem).resources,'Controle Mental':'','Propósito':''}));
 const [vertente,setVertente]=useState('');
 const [legado,setLegado]=useState('');
 const [proposito,setProposito]=useState('');
 const [erro,setErro]=useState('');
 const [substituir,setSubstituir]=useState(false);
 const existente=verificarExistente && (localStorage.getItem(`espiral:sheet:v1:${fichaId}`) || localStorage.getItem(`espiral:sheet:v1:darkness-${fichaId}`));
 const [sanidade,setSanidade]=useState('10');
 const [esperanca,setEsperanca]=useState('10');
 const antigos=personagem.atributos || {};
 const referencia=chave=>Object.entries({Passiva:personagem.habilidadesPassivas,Ativo:personagem.habilidadesCombate,'Perícia':personagem.pericias}).filter(([,grupo])=>grupo?.[chave] !== undefined).map(([tipo,grupo])=>`${tipo} ${grupo[chave]}`).join(' · ') || 'não registrado';
 const maxPassiva=recurso=>Math.max(0,...fontes[recurso].map(chave=>Number(personagem.habilidadesPassivas?.[chave]) || 0));
 const completo=etapa===0 ? Object.values(atributos).every(v=>v!=='') : etapa===1 ? RESOURCES.slice(0,12).every(r=>recursos[r]!=='') : etapa===2 ? recursos['Controle Mental']!=='' && recursos['Propósito']!=='' : !!vertente;
 const concluir=()=>{
  if(!completo || (existente && !substituir))return;
  try {
   const base=convertDarknessToEspiral({...personagem,fichaId});
   const attributes=Object.fromEntries(Object.entries(atributos).map(([k,v])=>[k,Number(v)]));
   const sheet={...base,attributes,resources:Object.fromEntries(Object.entries(recursos).map(([k,v])=>[k,Number(v)])),vertente,abilities:legado,purpose:proposito,integrity:integrityMax(attributes.pulso),sanity:Number(sanidade),hope:Number(esperanca),player:personagem.nomeJogador || personagem.jogador || '',adaptationVersion:2,notes:['ADAPTAÇÃO ABSOLUTO → ESPIRAL','Atributos e Recursos preenchidos pela tabela e revisados pelo jogador; Resistências, Vertente e legado escolhidos na adaptação.',personagem.anotacao,personagem.historia].filter(Boolean).join('\n\n')};
   onConcluir(sheet);
  } catch {setErro('Não foi possível salvar. Tente novamente antes de sair.');}
 };
 const escolherRecurso=r=><label key={r} className="ae-choice"><strong>{r}</strong><small>{r==='Controle Mental' && `Vontade: ${antigos.vontade ?? '—'} · `}{fontes[r].map(k=>`${nomeAntigo[k] || k}: ${referencia(k)}`).join(' / ')}</small><small>Maior passiva registrada: {maxPassiva(r)} · use como referência.</small><select aria-label={`Grau de ${r}`} value={recursos[r]} onChange={e=>setRecursos(prev=>({...prev,[r]:e.target.value}))}><option value="">Escolha o grau</option>{GRADES.map((g,i)=><option key={g} value={i}>{graus[i]} — {g}</option>)}</select></label>;
 return <div className="ae-overlay"><section className="ae-dialog" role="dialog" aria-modal="true" aria-label="Adaptação ao Espiral" onKeyDown={e=>{if(e.key==='Escape')onClose();}}>
  <header className="ae-header"><div><small>ABSOLUTO → ESPIRAL / {personagem.nome}</small><h2>Adaptação ao Espiral</h2></div><button type="button" onClick={onClose} aria-label="Fechar adaptação">×</button></header>
  <p>Atributos e Recursos já vêm preenchidos pela tabela. Revise os valores e escolha Resistências, Vertente e legado. Sua ficha Absoluto será preservada.</p>
  <nav aria-label="Etapas da adaptação">{['Atributos','Recursos','Resistências','Vertente e legado'].map((nome,i)=><button type="button" key={nome} aria-current={etapa===i?'step':undefined} disabled={i>etapa} onClick={()=>setEtapa(i)}>{i+1} · {nome}</button>)}</nav>
  {etapa===0 && <section><h3>01 / Atributos</h3><p>0–9 → △4 · 10–19 → ⬡6 · 20–29 → ◇8 · 30–39 → ⬟10 · 40+ → ⬢12</p><label className="ae-choice">Referência para Pulso<select aria-label="Referência para Pulso" value={fontePulso} onChange={e=>{const fonte=e.target.value;setFontePulso(fonte);const valor=fonte==='maior'?Math.max(Number(antigos.forca)||0,Number(antigos.fonitude)||0):antigos[fonte];setAtributos(prev=>({...prev,pulso:stageFromDarknessAttribute(valor)}));}}><option value="maior">Maior entre Força e Fortitude</option><option value="forca">Força</option><option value="fonitude">Fortitude</option></select></label><p role="status">Integridade calculada por Pulso: <strong>{integrityMax(Number(atributos.pulso))}</strong></p><div className="ae-grid">{Object.entries(ATTRIBUTES).map(([k,a])=><label className="ae-choice" key={k}><strong>{a.name}</strong><small>{k==='pulso'?`Força ${antigos.forca ?? '—'} / Fortitude ${antigos.fonitude ?? '—'}. Escolha o que representa seu físico, sem exigir média.`:k==='razao'?`Inteligência ${antigos.inteligencia ?? '—'}. Principal referência para Razão.`:k==='sentido'?`Reflexos ${antigos.reflexos ?? '—'}. Sentido é determinado por Reflexos.`:`Vontade ${antigos.vontade ?? '—'}. Voz é determinada por Vontade.`}</small><select aria-label={`Estágio de ${a.name}`} value={atributos[k]} onChange={e=>setAtributos(prev=>({...prev,[k]:e.target.value}))}><option value="">Escolha o estágio</option>{['△4','⬡6','◇8','⬟10','⬢12'].map((d,i)=><option key={d} value={i+1}>{d} · {a.stages[i]}</option>)}</select></label>)}</div></section>}
  {etapa===1 && <section><h3>02 / Recursos</h3><p>Os Recursos foram preenchidos com o maior valor antigo correspondente, sem somar competências. Revise os graus conforme a história.</p><p>0 — Sem preparo: 0 · I — Familiar: +5 · II — Treinado: +10 · III — Experiente: +15 · IV — Dominado: +20</p><div className="ae-grid">{RESOURCES.slice(0,12).map(escolherRecurso)}</div></section>}
  {etapa===2 && <section><h3>03 / Resistências</h3><p>Escolha de 0 a IV. Veteranos podem começar acima dos limites normais de criação quando isso for coerente com sua história.</p><div className="ae-grid">{RESOURCES.slice(12).map(escolherRecurso)}</div><label className="ae-choice">Motivações e Propósito<textarea value={proposito} onChange={e=>setProposito(e.target.value)} placeholder="O que mantém o personagem seguindo em frente?"/></label><p>Sanidade e Esperança da nova ficha (0–10). Ajuste conforme sua história.</p><div className="ae-grid"><label>Sanidade<input type="number" min="0" max="10" value={sanidade} onChange={e=>setSanidade(e.target.value)}/></label><label>Esperança<input type="number" min="0" max="10" value={esperanca} onChange={e=>setEsperanca(e.target.value)}/></label></div></section>}
  {etapa===3 && <section><h3>04 / Vertente e habilidades de legado</h3><p>A classe antiga ({personagem.classe || 'não informada'}) não determina sua Vertente. Escolha pela maneira como o personagem agia.</p><label className="ae-choice">Vertente<select aria-label="Vertente da adaptação" value={vertente} onChange={e=>setVertente(e.target.value)}><option value="">Escolha a Vertente</option>{Object.entries(VERTENTES).map(([nome,descricao])=><option key={nome} value={nome}>{nome} — {Array.isArray(descricao)?descricao[0]:descricao}</option>)}</select></label><p>Mantenha apenas habilidades que o personagem realmente possuía. Preserve o efeito principal e reescreva os bônus: +1 ou +2 antigo → +1 dado; +3 ou mais → +2 dados.</p><details><summary>Consultar habilidades antigas</summary><pre>{convertDarknessToEspiral(personagem).abilities || 'Nenhuma marca, rito ou poder registrado.'}</pre><pre>{JSON.stringify({habilidades:personagem.habilidades,habilidadesClasse:personagem.habilidadesClasse,aptidoes:personagem.aptidoes,especialismos:personagem.especialismos},null,2)}</pre></details><label className="ae-choice">Habilidades de legado<textarea value={legado} onChange={e=>setLegado(e.target.value)} placeholder="Nome da habilidade, efeito principal e bônus adaptado. Deixe vazio se não houver legado." rows={6}/></label><div className="ae-review"><strong>Revisão</strong><p>{Object.entries(atributos).map(([k,v])=>`${ATTRIBUTES[k].name}: d${Number(v)*2+2}`).join(' · ')}</p><p>{Object.entries(recursos).map(([k,v])=>`${k}: ${graus[Number(v)]}`).join(' · ')}</p><p>Vertente: {vertente || 'a escolher'} · Integridade: {integrityMax(Number(atributos.pulso))}</p></div>{existente && <label className="ae-replace"><input type="checkbox" checked={substituir} onChange={e=>setSubstituir(e.target.checked)}/>Já existe uma ficha Espiral com este código. Quero substituir essa adaptação pelos novos dados.</label>}</section>}
  {erro && <p role="alert">{erro}</p>}
  <footer><span>Etapa {etapa+1} de 4</span><div>{etapa>0 && <button type="button" onClick={()=>setEtapa(etapa-1)}>Voltar</button>}{etapa<3?<button type="button" disabled={!completo || (etapa===2 && [sanidade,esperanca].some(v=>v==='' || Number(v)<0 || Number(v)>10))} onClick={()=>setEtapa(etapa+1)}>Continuar →</button>:<button type="button" disabled={!completo || (!!existente && !substituir)} onClick={concluir}>Salvar e abrir Espiral ↗</button>}</div></footer>
 </section></div>;
}
