import EspiralDice from './EspiralDice';
import React from 'react';
import { fichaHref } from '../../services/jogadorApi';
import { Recurso } from '../absoluto/AbsolutoSummary';

export default function EspiralSummary({ ficha, resumo }) {
  const d = ficha.dados || {};
  return <div className="as-layout as-layout-espiral">
    <dl className="as-atributos">{resumo.atributos.map(a => <div key={a.nome}><dt>{a.nome === 'razao' ? 'Razão' : a.nome}</dt><dd>{<EspiralDice value={a.valor}/>}</dd></div>)}</dl>
    <div className="as-recursos">
      <div className="as-identidade"><h2>{ficha.nome}</h2>{d.player && <small>{d.player}</small>}<small>{resumo.categoria}</small></div>
      {resumo.identidade && <div className="as-espiral-identidade">{resumo.identidade}</div>}
      {resumo.recursos.map((r, i) => <Recurso key={r.nome} nome={r.nome} dados={{atual:r.atual,max:r.max ?? (i > 0 ? 10 : undefined)}} classe={['integridade','sanidade','esperanca'][i]}/>)}
      <div className="as-espiral-pressao">{resumo.progresso}</div>
      <a className="as-abrir" href={fichaHref(ficha)}>Consultar arquivo ↗</a>
    </div>
  </div>;
}