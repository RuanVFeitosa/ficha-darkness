import React from 'react';
import Icon from '@mdi/react';
import { mdiDiceD6 } from '@mdi/js';
import { ATRIBUTOS_ABSOLUTO, DOMINIOS, ESCALA_DOMINIO, EXITO_DOMINIO, limitar, quantidadeDados } from '../../data/absolutoV1';

export default function AbsolutoDominio({ personagem, chave, onRoll, vantagem = 0, esforco = false, contraFonte = false }) {
  const d = DOMINIOS[chave];
  const nivel = limitar(personagem.dominios?.[chave]);
  return <div className="ativo-item">
    <button type="button" className="ativo-rolar-btn" onClick={() => onRoll(chave)} title={`Rolar ${d.nome}`} aria-label={`Rolar ${d.nome}`}><Icon path={mdiDiceD6} size={0.9} /></button>
    <div className="ativo-info" title={d.descricao}><span className="ativo-atributo">{ATRIBUTOS_ABSOLUTO[d.atributo]}</span><span className="ativo-separador">|</span><span className="ativo-nome">{d.nome}</span><small className="ativo-origem">{ESCALA_DOMINIO[nivel]} · Êxitos: {EXITO_DOMINIO[nivel]}</small></div>
    <div className="ativo-acoes"><span className="ativo-valor" title="Quantidade de d6 determinada pelo Atributo e pelas circunstâncias">{quantidadeDados(personagem, chave, vantagem, esforco ? 1 : 0, contraFonte)}D</span></div>
  </div>;
}
