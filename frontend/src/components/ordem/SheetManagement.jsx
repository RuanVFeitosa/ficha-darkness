import React, { useState } from 'react';
import { classes, origins, paranormalPowers } from '../../services/ordemCreation';
import { normalizeOrdem, ordemId } from '../../services/ordemSheet';
import { powerCatalog, powerCategories } from '../../services/ordemPowerCatalog';
import ElementSymbol from './ElementSymbol';
import ParanormalFilters from './ParanormalFilters';

const tags = ['Origem', 'Classe', 'Paranormal', 'Proficiência', 'Personalizado'];
const conditions = [
  'Abalado', 'Agarrado', 'Alquebrado', 'Apavorado', 'Asfixiado', 'Atordoado', 'Caído', 'Cego', 'Confuso',
  'Debilitado', 'Desprevenido', 'Doente', 'Em Chamas', 'Enjoado', 'Enlouquecendo', 'Enredado', 'Envenenado',
  'Esmorecido', 'Exausto', 'Fascinado', 'Fatigado', 'Fraco', 'Frustrado', 'Imóvel', 'Inconsciente', 'Indefeso',
  'Lento', 'Machucado', 'Morrendo', 'Ofuscado', 'Paralisado', 'Pasmo', 'Perturbado', 'Petrificado',
  'Sangrando', 'Surdo', 'Surpreendido', 'Vulnerável',
];

function powerTag(power, sheet) {
  if (tags.includes(power.tag)) return power.tag;
  if (origins[sheet.origem]?.[1] === power.name) return 'Origem';
  if (power.name === 'Perícias de Perito' || classes[sheet.classe]?.abilities.some(([name]) => name === power.name)) return 'Classe';
  if (Object.hasOwn(paranormalPowers, power.name)) return 'Paranormal';
  return power.name === 'Proficiências' ? 'Proficiência' : 'Personalizado';
}

function TagOptions() {
  return tags.map(tag => <option key={tag}>{tag}</option>);
}

function powerElement(power) {
  const catalogEntry = powerCatalog.find(entry => entry.tag === 'Paranormal'
    && (power.catalogId ? power.catalogId === entry.catalogId : power.name === entry.name));
  if (!catalogEntry) return undefined;
  return catalogEntry.group === 'Gerais' ? power.detail?.match(/Elemento:\s*(\p{L}+)/u)?.[1] : catalogEntry.group;
}

const agathaCategories = ['Poderes paranormais', 'Origens'];

export function PowerLibrary({ sheet, onChange, categories = powerCategories }) {
  const initialCategory = categories.includes(sheet.classe) ? sheet.classe : categories[0];
  const [category, setCategory] = useState(initialCategory);
  const [group, setGroup] = useState('');
  const [query, setQuery] = useState('');
  const categoryEntries = powerCatalog.filter(entry => entry.category === category);
  const groups = [...new Set(categoryEntries.map(entry => entry.group))];
  const search = normalizeOrdem(query.trim());
  const visible = categoryEntries.filter(entry => (!group || group === entry.group)
    && normalizeOrdem(`${entry.name} ${entry.group}`).includes(search)
    && !sheet.abilities.some(power => power.catalogId === entry.catalogId
      || (!power.catalogId && power.name === entry.name && powerTag(power, sheet) === entry.tag)));

  return <div className="os-power-library">
    <nav className="os-nav" aria-label="Categorias do catálogo">
      {categories.map(name => <button type="button" key={name} aria-pressed={category === name} onClick={() => {
        setCategory(name);
        setGroup('');
      }}>{name}</button>)}
    </nav>
    <div className={category === 'Poderes paranormais' ? 'os-paranormal-toolbar' : 'os-power-filters'}>
      <label>Buscar no catálogo<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {category === 'Poderes paranormais' ? <ParanormalFilters options={groups} element={group} onElementChange={setGroup} />
        : <label>{category === 'Origens' ? 'Origem' : 'Grupo'}<select value={group} onChange={event => setGroup(event.target.value)}>
        <option value="">Todos</option>{groups.map(name => <option key={name}>{name}</option>)}
      </select></label>}
    </div>
    {!visible.length && <p className="os-muted">Nenhuma habilidade encontrada.</p>}
    {groups.map(name => {
      const entries = visible.filter(entry => entry.group === name)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
      if (!entries.length) return null;
      return <section key={name} className="os-power-group">
        <header><h4>{name}</h4><span aria-hidden="true">{entries.length}</span></header>
        <div className="os-owned-powers">
          {entries.map(entry => <details key={entry.catalogId} className="os-owned-power">
            <summary><ElementSymbol element={powerElement(entry)} /><strong>{entry.name}</strong></summary>
            <div className="os-owned-power-detail">
              {entry.nex && <small>NEX {entry.nex}%</small>}
              <p>{entry.detail}</p>
              <div className="os-actions">
                <button type="button" aria-label={`Adicionar ${entry.name}`}
                  onClick={() => onChange([...sheet.abilities, { ...entry, id: ordemId() }])}>+ Adicionar</button>
              </div>
            </div>
          </details>)}
        </div>
      </section>;
    })}
  </div>;
}

export function AgathaPowers(props) {
  return <PowerLibrary {...props} categories={agathaCategories} />;
}

export function Powers({ sheet, onChange, onOpenCatalog }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [tag, setTag] = useState('Personalizado');
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const selected = sheet.abilities.find(power => power.id === selectedId);
  return <>
    <section className="os-power-column" aria-label="Habilidades adquiridas">
    <div className="os-work-heading"><div><h2>Poderes e habilidades</h2><p>{sheet.abilities.length} na ficha</p></div>
      <button type="button" onClick={onOpenCatalog}>Consultar catálogo</button>
    </div>
    <details className="os-power-custom"><summary>Adicionar poder personalizado</summary>
    <form className="os-entry-form" onSubmit={event => {
      event.preventDefault();
      if (!name.trim()) return;
      onChange([...sheet.abilities, { id: ordemId(), name: name.trim(), detail: detail.trim(), tag }]);
      setName('');
      setDetail('');
      setFilter('');
    }}>
      <label>Poder<input maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>Descrição<input maxLength={500} value={detail} onChange={event => setDetail(event.target.value)} /></label>
      <label>Tag<select value={tag} onChange={event => setTag(event.target.value)}><TagOptions /></select></label>
      <button type="submit" disabled={!name.trim()}>Adicionar poder</button>
    </form>
    </details>
    <label>Filtrar por tag<select value={filter} onChange={event => {
      setFilter(event.target.value);
      setSelectedId(null);
    }}><option value="">Todas</option><TagOptions /></select></label>
    <div className="os-sheet-power-browser" data-open={Boolean(selected)}>
    <div>
    {tags.filter(group => !filter || group === filter).map(group => {
      const entries = sheet.abilities.filter(power => powerTag(power, sheet) === group)
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
      if (!entries.length) return null;
      return <section key={group} className="os-power-group">
        <header><h4>{group}</h4><span aria-hidden="true">{entries.length}</span></header>
        <div className="os-sheet-power-cards">
        {entries.map(power => <button key={power.id} type="button"
          aria-pressed={power.id === selectedId} onClick={() => setSelectedId(power.id === selectedId ? null : power.id)}>
          <ElementSymbol element={powerElement(power)} /><strong>{power.name}</strong>
        </button>)}
      </div></section>;
    })}
    {!sheet.abilities.some(power => !filter || powerTag(power, sheet) === filter) && <p className="os-muted">Nenhum poder nesta seleção.</p>}
    </div>
    {selected && <article className="os-sheet-power-preview" aria-label={`Detalhes de ${selected.name}`}>
      <div className="os-work-heading">
        <h3>{selected.name}</h3>
        <button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedId(null)}>×</button>
      </div>
      {selected.detail && <p>{selected.detail}</p>}
      <div className="os-actions">
        <select aria-label={`Tag de ${selected.name}`} value={powerTag(selected, sheet)} onChange={event => {
          const tag = event.target.value;
          if (filter && filter !== tag) setFilter(tag);
          onChange(sheet.abilities.map(item => item.id === selected.id ? { ...item, tag } : item));
        }}><TagOptions /></select>
        <button type="button" aria-label={`Remover ${selected.name}`} onClick={() => {
          setSelectedId(null);
          onChange(sheet.abilities.filter(item => item.id !== selected.id));
        }}>Remover</button>
      </div>
    </article>}
    </div>
    </section>
  </>;
}

export function Conditions({ manager, notes, onChange, onNotesChange }) {
  const [selected, setSelected] = useState('');
  const { active = [], rounds = {} } = manager ?? {};
  const options = conditions.filter(name => !active.includes(name));

  return <section className="os-panel os-condition-manager" aria-label="Gerenciador de condições">
    <h2>Condições e efeitos</h2>
    <form className="os-entry-form" onSubmit={event => {
      event.preventDefault();
      if (!options.includes(selected)) return;
      onChange({ active: [...active, selected], rounds });
      setSelected('');
    }}>
      <label>Condição<select value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Selecionar condição</option>
        {options.map(name => <option key={name}>{name}</option>)}
      </select></label>
      <button type="submit" disabled={!options.includes(selected)}>Adicionar</button>
    </form>
    {active.length > 0 && <ul className="os-condition-list">
      {active.map(name => <li key={name}><span>{name}</span><button type="button" aria-label={`Encerrar ${name}`}
        onClick={() => onChange({ active: active.filter(item => item !== name), rounds })}>Encerrar</button></li>)}
    </ul>}
    <button type="button" disabled={!Object.values(rounds).some(Boolean)} onClick={() => onChange({ active, rounds: {} })}>Zerar para nova cena</button>
    <label>Notas de condições<textarea rows={2} value={notes ?? ''} onChange={event => onNotesChange(event.target.value)} /></label>
  </section>;
}
