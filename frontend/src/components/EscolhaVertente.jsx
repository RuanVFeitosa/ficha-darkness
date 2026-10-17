import React from 'react';
import { VERTENTES } from '../data/espiral';

const vertentes = [
  { name: 'Vigilante', image: 'vigilante', meaning: 'Atenção e prontidão. Você observa os sinais, antecipa o perigo e reage quando os outros ainda estão tentando entender o que aconteceu.' },
  { name: 'Agressiva', image: 'agressiva', meaning: 'Iniciativa e pressão. Você enfrenta o perigo de frente, toma a iniciativa e abre caminho com ações decisivas.' },
  { name: 'Resiliente', image: 'resiliente', meaning: 'Resistência e recuperação. Você suporta os impactos, atravessa as dificuldades e encontra forças para continuar de pé.' },
  { name: 'Metódica', image: 'metodica', meaning: 'Análise e preparação. Você transforma observação em estratégia e encontra segurança no planejamento antes de agir.' },
  { name: 'Adaptável', image: 'adaptavel', meaning: 'Flexibilidade e improviso. Você encontra alternativas, usa o que tem à mão e muda de caminho quando a situação exige.' },
  { name: 'Influente', image: 'influente', meaning: 'Presença e percepção social. Você compreende as pessoas, reconhece suas motivações e usa suas conexões para transformar uma situação.' },
  { name: 'Obstinada', image: 'obstinada', meaning: 'Determinação e persistência. Você se recusa a ceder e avança além dos próprios limites quando seu propósito está em jogo.' },
];

export default function EscolhaVertente({ value, onChange }) {
  const index = Math.max(0, vertentes.findIndex(v => v.name === value));
  const current = vertentes[index];
  const [ability, description] = VERTENTES[current.name];
  const move = direction => onChange(vertentes[(index + direction + vertentes.length) % vertentes.length].name);
  return <section className="ec-vertente-selector" aria-label="Escolha sua vertente">
    <div className="ec-vertente-scene">
      <img key={current.image} className="ec-vertente-art" src={`/espiral/vertentes/${current.image}.png`} alt="" aria-hidden="true" />
      <div className="ec-vertente-details" aria-live="polite" aria-atomic="true">
        <small>VERTENTE / {String(index + 1).padStart(2, '0')} DE 07</small>
        <h3>{current.name}</h3>
        <div className="ec-vertente-meaning"><small>O QUE REPRESENTA</small><p>{current.meaning}</p></div>
        <div className="ec-vertente-ability"><small>HABILIDADE INICIAL / NÍVEL 1</small><h4>{ability}</h4><p>{description}</p></div>
      </div>
    </div>
    <nav className="ec-vertente-nav" aria-label="Navegar pelas vertentes"><button type="button" onClick={() => move(-1)}>← Anterior</button><span>{index + 1} / 7</span><button type="button" onClick={() => move(1)}>Próxima →</button></nav>
    <div className="ec-vertente-options" role="group" aria-label="Selecionar vertente">{vertentes.map(v => <button key={v.name} type="button" aria-pressed={value === v.name} onClick={() => onChange(v.name)}>{v.name}</button>)}</div>
    <p className="ec-vertente-selected">Vertente escolhida: <strong>{current.name}</strong></p>
  </section>;
}
