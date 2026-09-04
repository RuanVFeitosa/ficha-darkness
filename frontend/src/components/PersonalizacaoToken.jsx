import React from "react";
import { coresBordaToken, estiloBordaToken } from "../utils/tokenAppearance";
import "../CSS/PersonalizacaoToken.css";

export default function PersonalizacaoToken({ personagem, aoAlterar }) {
  const cores = coresBordaToken(personagem.coresToken);
  const atualizar = (proximas) => aoAlterar(coresBordaToken(proximas));
  return (
    <section className="customizacao-token">
      <h4>Token do Tabletop</h4>
      <p>Escolha até quatro cores para a borda. Com mais de uma cor, a borda forma um degradê.</p>
      <div className="customizacao-token-preview" style={estiloBordaToken(cores)} aria-label="Prévia do token">
        {personagem.fotoPerfil ? <img src={personagem.fotoPerfil} alt="" /> : <span>{personagem.nome?.slice(0, 2) || "TK"}</span>}
      </div>
      <div className="customizacao-grid">
        {cores.map((cor, indice) => (
          <div key={indice} className="customizacao-cor-item">
            <label htmlFor={`token-cor-${indice}`}>Cor {indice + 1}</label>
            <input id={`token-cor-${indice}`} type="color" value={cor} onChange={(event) => atualizar(cores.map((atual, i) => i === indice ? event.target.value : atual))} />
            <button type="button" aria-label={`Remover cor ${indice + 1}`} onClick={() => atualizar(cores.filter((_, i) => i !== indice))}>Remover</button>
          </div>
        ))}
      </div>
      <div className="customizacao-token-acoes">
        <button type="button" disabled={cores.length >= 4} onClick={() => atualizar([...cores, ["#d2b467", "#c94f4f", "#538ecc", "#9370db"][cores.length]])}>Adicionar cor ({cores.length}/4)</button>
        <button type="button" disabled={!cores.length} onClick={() => atualizar([])}>Usar borda padrão da mesa</button>
      </div>
    </section>
  );
}
