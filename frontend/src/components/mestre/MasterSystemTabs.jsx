import React from 'react';
import '../../styles/MasterSystemTabs.css';

export const masterSystems = [
  { id: 'absoluto', nome: 'Darkness', logo: '/logo-protocolo-darkness.png', href: '/?mestre=1' },
  { id: 'ordem', nome: 'Ordem Paranormal', logo: '/logo-ordem-paranormal.png', href: '/?mestre=1&sistema=ordem' },

];

export default function MasterSystemTabs({ sistema, onChange }) {

  return <nav className="master-system-tabs" aria-label="Sistemas de RPG">
    {masterSystems.map(({ id, nome, logo, href }) => {
      const label = logo ? <img src={logo} alt={nome} draggable={false} /> : nome;
      return onChange
        ? <button key={id} type="button" data-system={id} aria-pressed={sistema === id} onClick={() => onChange(id)}>{label}</button>
        : <a key={id} data-system={id} aria-current={sistema === id ? 'page' : undefined} href={href}>{label}</a>;
    })}
  </nav>;
}
