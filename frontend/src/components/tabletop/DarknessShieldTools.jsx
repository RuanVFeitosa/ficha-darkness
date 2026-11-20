import ProtocolLogo from '../ui/ProtocolLogo';
import React, { useState } from 'react';
import { resolveProtocolRoll, applyPavor, PROTOCOL_DIFFICULTIES } from '../../data/protocoloDarkness';

export default function DarknessShieldTools() {
  const [dice, setDice] = useState('');
  const [pressure, setPressure] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [sides, setSides] = useState(6);
  const [pavor, setPavor] = useState('');
  const [pavorSides, setPavorSides] = useState(6);
  let result;
  let error;
  const parse = value => value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  if (dice.trim()) {
    try {
      result = resolveProtocolRoll(parse(dice), parse(pressure), sides, difficulty);
      if (pavor !== '') result = applyPavor(result, Number(pavor), pavorSides);
    } catch (cause) { error = cause.message; }
  }
  const faces = [4, 6, 8, 10, 12];
  return <section className="shield-darkness-tools" aria-label="Protocolo Darkness">
    <header><span><ProtocolLogo /> / RESOLUÇÃO</span><h3>Pressão, êxitos e Pavor</h3><p>Consulte resultados já rolados. Cada resultado 4 ou maior gera um êxito; a reserva comporta até 6 dados.</p></header>
    <div className="shield-input-row">
      <label>Dados de atributo<input placeholder="Ex.: 6, 4, 2" value={dice} onChange={e => setDice(e.target.value)}/></label>
      <label>Faces do atributo<select value={sides} onChange={e => setSides(Number(e.target.value))}>{faces.map(n => <option key={n} value={n}>d{n}</option>)}</select></label>
      <label>Pressão (d6)<input placeholder="Ex.: 1, 5" value={pressure} onChange={e => setPressure(e.target.value)}/></label>
    </div>
    <div className="shield-input-row">
      <label>Êxitos exigidos<select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}>{PROTOCOL_DIFFICULTIES.map((name, i) => <option key={name} value={i + 1}>{i + 1} · {name}</option>)}</select></label>
      <label>Resultado de Pavor<input type="number" min="1" max={pavorSides} placeholder="Opcional" value={pavor} onChange={e => setPavor(e.target.value)}/></label>
      <label>Dado de Pavor<select value={pavorSides} onChange={e => setPavorSides(Number(e.target.value))}>{faces.map(n => <option key={n} value={n}>d{n}</option>)}</select></label>
    </div>
    <output aria-live="polite" aria-label="Resultado do Protocolo">{error || (result ? `${result.outcome} · ${result.successes} êxitos / ${difficulty} exigidos · ${result.stress}${result.pavor?.ends ? ' · Pavor encerrado' : ''}` : 'Informe os dados para consultar o resultado.')}</output>
    <p>Pavor cancela dados inferiores ao seu resultado. Os resultados 1 nos dados de Pressão determinam Controle, Abalo, Crise ou Ruptura.</p>
  </section>;
}
