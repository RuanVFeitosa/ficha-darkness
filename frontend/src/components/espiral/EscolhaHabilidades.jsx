import React, { useState } from 'react';
import { HABILIDADES_ESPIRAL } from '../../data/habilidadesEspiral';

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function EscolhaHabilidades({ value, onChange, unlimited = false }) {
  const [category, setCategory] = useState('Ofensiva');
  const [search, setSearch] = useState('');
  const full = !unlimited && value.length >= 2;
  const entries = Object.entries(HABILIDADES_ESPIRAL).flatMap(([group, abilities]) =>
    abilities.map(([name, action, detail]) => ({ id: `${group}:${name}`, category: group, name, action, detail }))
  ).filter(ability => search.trim()
    ? normalize(`${ability.name} ${ability.detail} ${ability.category}`).includes(normalize(search.trim()))
    : ability.category === category);

  function toggle(ability) {
    if (value.some(item => item.id === ability.id)) onChange(value.filter(item => item.id !== ability.id));
    else if (!full) onChange([...value, { id: ability.id, name: ability.name, category: ability.category, level: 1 }]);
  }

  return <section className="ec-abilities" aria-label="Habilidades iniciais">
    <div className="ec-ability-summary">
      <div className="ec-ability-summary-heading"><strong>Seu repertório inicial</strong><span role="status">{value.length} / 2 escolhidas</span></div>
      <p>{full ? 'Tudo pronto. Para trocar uma habilidade, remova uma das escolhas abaixo.' : 'Combine habilidades de qualquer categoria. As duas escolhas são gratuitas e começam no nível I.'}</p>
      <div className="ec-ability-slots">{value.map(ability => <button type="button" key={ability.id} onClick={() => toggle(ability)} aria-label={`Remover ${ability.name}`}><span><small>{ability.category}</small><strong>{ability.name}</strong></span><span aria-hidden="true">×</span></button>)}{Array.from({ length: Math.max(0, 2 - value.length) }, (_, i) => <div className="ec-ability-empty" key={i}><span aria-hidden="true">+</span>Escolha uma habilidade</div>)}</div>
    </div>
    <label className="ec-ability-search">Buscar habilidade<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, efeito ou categoria…" /></label>
    <div className="ec-ability-categories" role="group" aria-label="Categorias de habilidades">{Object.keys(HABILIDADES_ESPIRAL).map(group => <button type="button" key={group} aria-pressed={!search.trim() && category === group} onClick={() => { setCategory(group); setSearch(''); }}>{group}<span>{value.filter(ability => ability.category === group).length || '—'}</span></button>)}</div>
    <div className="ec-ability-results"><h3>{search.trim() ? 'Resultados da busca' : category}</h3><span>{entries.length} habilidades</span></div>
    <div className="ec-ability-grid">{entries.map(ability => {
      const selected = value.some(item => item.id === ability.id);
      return <label className="ec-ability-option" key={ability.id}>
        <input type="checkbox" aria-label={ability.name} checked={selected} disabled={!selected && full} onChange={() => toggle(ability)} />
        <span className="ec-ability-copy"><strong>{ability.name}</strong><small>{search.trim() ? `${ability.category} · ` : ''}Ação {ability.action} · Nível I</small><span>{ability.detail}</span><b>{selected ? 'Selecionada' : 'Selecionar habilidade'}</b></span>
      </label>;
    })}</div>
    {!entries.length && <p className="ec-ability-no-results">Nenhuma habilidade encontrada. Tente outro nome ou efeito.</p>}
  </section>;
}
