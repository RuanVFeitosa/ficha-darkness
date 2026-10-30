import NumberInput from '../ui/NumberInput';
import React, { useState } from 'react';
import { ATRIBUTOS_ABSOLUTO, DOMINIOS, evoluirV1, custoEvolucaoAtributo } from '../../data/absolutoV1';

export default function AbsolutoEvolucao({ personagem, onSave, grupo = 'dominios' }) {
  const [destinos, setDestinos] = useState({});
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const opcoes = grupo === 'atributos' ? ATRIBUTOS_ABSOLUTO : DOMINIOS;
  const aplicar = async chave => {
    setErro(''); setSalvando(true);
    try { await onSave(evoluirV1(personagem, grupo, chave, undefined, destinos[chave])); setDestinos({}); }
    catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  };
  return <>
    <p className="upgrade-evolution-note">{grupo === 'dominios' ? 'Cada nível de Domínio custa 10 pontos de evolução. Limite: 5.' : 'Custos acumulativos em EX: 1→2: 10; 2→3: 15; 3→4: 25; 4→5: 30. De 1 para 3: 25 EX. Limite: 5.'}</p>
    {erro && <p role="alert">{erro}</p>}
    <div className="upgrade-lista">{Object.entries(opcoes).map(([chave, definicao]) => {
      const valor = Number(personagem[grupo]?.[chave]) || 0;
      const nome = typeof definicao === 'string' ? definicao : definicao.nome;
      const destino = destinos[chave] || Math.min(5, valor + 1);
      const preco = grupo === 'dominios' ? (destino - valor) * 10 : custoEvolucaoAtributo(valor, destino);
      return <div key={chave} className="upgrade-item">
        <div className="upgrade-item-header"><span className="upgrade-item-nome">{nome}</span><div className="upgrade-item-info"><small className="upgrade-item-atual">Atual: {valor} / 5</small></div></div>
        <div className="upgrade-evolution-controls">
          <label className="upgrade-target-field"><span>Nível desejado</span><NumberInput aria-label={`Nível desejado de ${nome}`} type="number" min={valor + 1} max="5" disabled={valor >= 5 || salvando} value={destino} onChange={e => setDestinos({...destinos, [chave]:Number(e.target.value)})}/></label>
          <div className="upgrade-cost-field"><span>Custo total</span><strong>{valor >= 5 ? '—' : preco === null ? 'A definir' : <>{preco} <small>EX</small></>}</strong></div>
          <button type="button" className="upgrade-evolve-button" aria-label={`Aumentar ${nome}`} disabled={salvando || destino <= valor || destino > 5 || valor >= 5 || preco === null || Number(preco) > (Number(personagem.pontosEvolucao?.disponiveis) || 0)} onClick={() => aplicar(chave)}>{valor >= 5 ? 'Máximo' : 'Evoluir'}</button>
        </div>
      </div>;
    })}</div>
  </>;
}
