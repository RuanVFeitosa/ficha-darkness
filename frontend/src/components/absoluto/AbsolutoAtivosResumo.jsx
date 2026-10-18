import React from 'react';
import {nomesPassivas, ativosParaPassiva, dadosAtivos} from '../../data/absolutoAtivos';

const atributos = {inteligencia:'Inteligência', vontade:'Vontade', reflexos:'Reflexos', forca:'Força', fonitude:'Fortitude'};
export default function AbsolutoAtivosResumo({personagem}) {
  return <section className="mestre-modal-bloco full ad-dossier-ativos">
    <span>Ativos</span>
    <p className="ad-ativos-intro">Expanda os bônus para consultar as passivas vinculadas.</p>
    <div className="ad-ativos-grid">{Object.entries(dadosAtivos).map(([chave,ativo])=>{
      const atributo = chave === 'resistencia' ? 'fonitude' : ativo.atributo;
      const valor = parseInt(personagem.atributos?.[atributo],10) || 0;
      const modificador = valor >= 50 ? 5 : Math.max(0,Math.floor(valor/10));
      const base = Number(personagem.habilidadesCombate?.[chave]) || 0;
      const temporario = Number(personagem.habilidadesTemporarias?.[chave]) || 0;
      const dados = Math.max(1,modificador + base + temporario);
      const bonus = Object.entries(ativosParaPassiva).filter(([,vinculo])=>vinculo===chave).map(([passiva])=>({nome:nomesPassivas[passiva],valor:(Number(personagem.habilidadesPassivas?.[passiva]) || 0)+(Number(personagem.habilidadesTemporarias?.[passiva]) || 0)})).filter(p=>p.valor!==0);
      return <article className="ad-ativo-resumo" key={chave}>
        <header><div><small>{atributos[atributo]}</small><h3>{ativo.nome}</h3></div><strong aria-label={`${ativo.nome}: ${dados} dados`}>{dados}<small>D</small></strong></header>
        <p className="ad-ativo-formula">Atributo {modificador} · Ativo {base}{temporario !== 0 && ` · Temporário ${temporario > 0 ? '+' : ''}${temporario}`}</p>
        {bonus.length ? <details className="ad-ativo-bonus"><summary aria-label={`Bônus de ${ativo.nome}`}>{bonus.length} {bonus.length === 1 ? 'bônus disponível' : 'bônus disponíveis'}</summary><ul>{bonus.map(p=><li key={p.nome}><span>{p.nome}</span><b>{p.valor>0?'+':''}{p.valor}</b></li>)}</ul></details> : <p className="ad-ativo-sem-bonus">Sem bônus de passiva disponível.</p>}
      </article>;
    })}</div>
  </section>;
}
