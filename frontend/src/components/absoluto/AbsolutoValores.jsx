import NumberInput from '../ui/NumberInput';
import React from 'react';
import { ATRIBUTOS_ABSOLUTO, DOMINIOS, ESCALA_DOMINIO, EXITO_DOMINIO, limitar, quantidadeDados, recalcularBases } from '../../data/absolutoV1';

export function AbsolutoValores({ personagem, onChange, criacao = false }) {
  const mudarAtributo = (k, valor) => {
    const atributos = { ...personagem.atributos, [k]: limitar(valor, criacao ? 1 : 0, criacao ? 3 : 5) };
    onChange(criacao ? { ...personagem, atributos } : recalcularBases(personagem, atributos));
  };
  return <>
    <div className="abs-v1-grid atributos">{Object.entries(ATRIBUTOS_ABSOLUTO).map(([k, nome]) => <label key={k}>{nome}<NumberInput aria-label={nome} type="number" min={criacao ? 1 : 0} max={criacao ? 3 : 5} value={personagem.atributos[k]} onChange={e => mudarAtributo(k, e.target.value)} /></label>)}</div>
    <div className="abs-v1-grid dominios">{Object.entries(DOMINIOS).map(([k, d]) => <label key={k} title={d.descricao}><span>{d.nome}</span><small>{ATRIBUTOS_ABSOLUTO[d.atributo]}</small><NumberInput aria-label={`Domínio ${d.nome}`} type="number" min="0" max="5" value={personagem.dominios[k] || 0} onChange={e => onChange({ ...personagem, dominios: { ...personagem.dominios, [k]: limitar(e.target.value) } })} /><small>{ESCALA_DOMINIO[personagem.dominios[k] || 0]} · {quantidadeDados(personagem, k)}d6</small><small>Êxitos: {EXITO_DOMINIO[personagem.dominios[k] || 0]}</small></label>)}</div>
  </>;
}

