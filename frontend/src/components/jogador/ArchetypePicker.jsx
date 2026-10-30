import React from 'react';

export default function ArchetypePicker({ arquetipos, selecionado, onSelect }) {
  const escolhido = arquetipos.find(a => a.id === selecionado);
  return <div className="arquetipo-selecao">
    <div className="arquetipo-mini-lista" role="group" aria-label="Escolha um arquétipo">
      {arquetipos.map((a,i) => <button key={a.id} type="button" className={`arquetipo-mini ${a.id === selecionado ? 'ativo' : ''}`} aria-pressed={a.id === selecionado} aria-controls="arquetipo-detalhes" onClick={() => onSelect(a)}>
        <span className="arquetipo-mini-numero">{String(i+1).padStart(2,'0')}</span><strong>{a.nome}</strong><small>{a.descricao}</small>
      </button>)}
    </div>
    <section id="arquetipo-detalhes" className="arquetipo-detalhes" aria-label="Detalhes do arquétipo" aria-live="polite">
      {escolhido ? <div key={escolhido.id} className="arquetipo-detalhes-conteudo">
        <span className="arquetipo-detalhe-kicker">A VERDADE ESCOLHIDA</span><h3>{escolhido.nome}</h3><p>{escolhido.descricao}</p>
        <div className="arquetipo-detalhe-bloco"><h4>Vantagens</h4><ul>{escolhido.vantagens.map(v => <li key={v}>{v}</li>)}</ul></div>
        <div className="arquetipo-detalhe-bloco"><h4>Desvantagem</h4><p>{escolhido.desvantagem}</p></div>
        <div className="arquetipo-detalhe-bloco habilidade"><h4>Habilidade principal</h4><p>{escolhido.habilidadePrincipal}</p></div>
        <span className="arquetipo-detalhe-selecionado">✦ Arquétipo selecionado</span>
      </div> : <div className="arquetipo-detalhes-vazio"><span aria-hidden="true">✦</span><h3>Toda alma tem uma verdade.</h3><p>Escolha um arquétipo ao lado para revelar suas vantagens, desvantagem e habilidade.</p></div>}
    </section>
  </div>;
}
