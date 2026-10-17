import React from 'react';
import { fichaHref } from '../services/jogadorApi';
import '../CSS/AbsolutoSummary.css';
const atributos=[['forca','Força'],['fonitude','Fonitude'],['inteligencia','Inteligência'],['reflexos','Reflexos'],['vontade','Vontade']];
const membros=[['cabeca','Cabeça'],['torso','Torso'],['bracoDireito','Braço direito'],['bracoEsquerdo','Braço esquerdo'],['pernaDireita','Perna direita'],['pernaEsquerda','Perna esquerda']];
const valor = v => v && typeof v==='object' ? v.atual ?? v.valor ?? '—' : v ?? '—';
export function Recurso({nome,dados,classe}) {
 const atual=dados?.atual, max=dados?.max;
 const percentual=max>0 && Number.isFinite(Number(atual)) ? Math.min(100,Math.max(0,Number(atual)/Number(max)*100)) : 0;
 return <div className={`as-recurso as-${classe}`}><strong>{nome}</strong><span className="as-trilho"><span style={{width:`${percentual}%`}}/></span><span>{atual ?? '—'} / {max ?? '—'}</span></div>;
}
export default function AbsolutoSummary({ficha}) {
 const d=ficha.dados || {};
 return <div className="as-layout">
   <dl className="as-atributos">{atributos.map(([key,nome])=><div key={key}><dt>{nome}</dt><dd>{valor(d.atributos?.[key])}</dd></div>)}</dl>
   <div className="as-recursos"><div className="as-identidade"><h2>{ficha.nome}</h2><small>NV {d.nivel ?? '—'}</small>{d.nomeJogador && <small>{d.nomeJogador}</small>}<small>{ficha.detalhe || d.classe || 'Sistema Absoluto'}</small></div><h3>Integridade</h3><dl className="as-membros">{membros.map(([key,nome])=><div key={key}><dt>{nome}</dt><dd>{d.membros?.[key]?.atual ?? '—'} / {d.membros?.[key]?.max ?? '—'}</dd></div>)}</dl><Recurso nome="Sanidade" dados={d.sanidade} classe="sanidade"/><Recurso nome="Esperança" dados={d.esperanca} classe="esperanca"/><a className="as-abrir" href={fichaHref(ficha)}>Consultar arquivo ↗</a></div>
 </div>;
}
