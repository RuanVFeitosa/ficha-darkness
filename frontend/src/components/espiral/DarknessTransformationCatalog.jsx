import { useDarknessAbilityCatalog } from '../../utils/darknessAbilityCatalog';
import React, { useMemo, useState } from 'react';
import { darknessAbilityName } from '../../utils/darknessAbilityName';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from '../../data/habilidadesEspiral';
import { HABILIDADES_DARKNESS_ADAPTADAS } from '../../data/habilidadesDarkness';

const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const metadata = new Map(HABILIDADES_DARKNESS_ADAPTADAS.map(entry => [entry.name, entry]));
const entries = Object.entries(HABILIDADES_ESPIRAL).flatMap(([category, items]) => items.map((ability, index) => {
  const meta = metadata.get(ability[0]);
  return { id: `${category}:${ability[0]}`, name: ability[0], title: darknessAbilityName(ability[0]), action: ability[1], detail: ability[2], rules: meta?.rules, category, ability, index, limit: meta?.limit };
}));
const pageSize = 12;

export default function DarknessTransformationCatalog({ owned = [], points, busy, onAcquire, onUpgrade }) {
  const editedCatalog = useDarknessAbilityCatalog();
  const catalogEntries = useMemo(() => entries.filter(entry => editedCatalog.some(item => item.id === entry.id)).map(entry => {
    const edited = editedCatalog.find(item => item.id === entry.id);
    return edited?.customized ? { ...entry, ...edited, title: darknessAbilityName(edited.name) } : entry;
  }), [editedCatalog]);
  const [category, setCategory] = useState('Ofensiva');
  const [query, setQuery] = useState('');
  const [ownership, setOwnership] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [level, setLevel] = useState(1);
  const ownedMap = useMemo(() => new Map(owned.map(item => [item.id, item])), [owned]);
  const filtered = useMemo(() => catalogEntries.filter(entry =>
    (!category || entry.category === category) &&
    (!ownership || (ownership === 'owned' ? ownedMap.has(entry.id) : !ownedMap.has(entry.id))) &&
    (!query.trim() || normalize(`${entry.title} ${entry.detail} ${entry.category}`).includes(normalize(query.trim())))
  ), [category, ownership, query, ownedMap, catalogEntries]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const pageNumbers = Array.from(new Set([0, pages - 1, ...Array.from({ length: 5 }, (_, index) => currentPage - 2 + index)]))
    .filter(value => value >= 0 && value < pages).sort((a, b) => a - b);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const selected = catalogEntries.find(entry => entry.id === selectedId);
  const acquired = selected && ownedMap.get(selected.id);
  const details = selected ? acquired?.levels || selected.levels || APRIMORAMENTOS_HABILIDADES_ESPIRAL[selected.name] || [selected.detail] : [];
  const costs = selected ? acquired?.hope || selected.hope || CUSTOS_ESPERANCA_HABILIDADES[selected.name] || [0, 0] : [0, 0];
  const rawEffect = details[level - 1] || 'Sem aprimoramento registrado para este nível.';
  const effect = level > 1 && rawEffect.startsWith(details[0]) ? rawEffect.slice(details[0].length).trim() : rawEffect.split(' Reservas de teste')[0];
  const rules = selected?.rules;
  function select(entry) { setSelectedId(entry.id); setLevel(ownedMap.get(entry.id)?.level || 1); }
  function clear() { setCategory(''); setQuery(''); setOwnership(''); setPage(0); }

  return <section className="dt-catalog" aria-label="Catálogo de habilidades Darkness">
    <div className="dt-category-bar" role="group" aria-label="Classes de habilidades">
      {['', ...Object.keys(HABILIDADES_ESPIRAL)].map(group => <button type="button" key={group} aria-pressed={category === group} onClick={() => { setCategory(group); setPage(0); }}>
        <span>{group || 'Todas'}</span><small>{group ? HABILIDADES_ESPIRAL[group].length : entries.length}</small>
      </button>)}
    </div>
    <div className="dt-filters">
      <label className="dt-search"><span>Buscar no repertório</span><input type="search" placeholder="Nome ou efeito da habilidade…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <label><span>Repertório</span><select value={ownership} onChange={event => { setOwnership(event.target.value); setPage(0); }}><option value="">Todas as habilidades</option><option value="available">Não adquiridas</option><option value="owned">Adquiridas</option></select></label>
    </div>
    <div className="dt-workspace">
      <section className="dt-results" aria-label="Resultados de habilidades">
        <div className="dt-results-heading"><span>{filtered.length} possibilidades</span><button type="button" onClick={clear}>Limpar filtros ↗</button></div>
        <div className="dt-entry-list">
          {visible.map(entry => <button type="button" key={entry.id} className={`dt-entry ${selectedId === entry.id ? 'selected' : ''}`} aria-pressed={selectedId === entry.id} aria-label={`${String(entry.index + 1).padStart(2, '0')} ${entry.title}`} onClick={() => select(entry)}>
            <span className="dt-entry-index">{String(entries.indexOf(entry) + 1).padStart(3, '0')}</span>
            <span className="dt-entry-copy"><small>{entry.category}</small><strong>{entry.title}</strong><span>{`Ação ${entry.action}`}</span></span>
            <span className={`dt-entry-state ${ownedMap.has(entry.id) ? 'owned' : ''}`}>{ownedMap.has(entry.id) ? `NÍVEL ${ownedMap.get(entry.id).level}` : '↗'}</span>
          </button>)}
          {!visible.length && <div className="dt-no-results"><strong>Nenhum registro encontrado.</strong><p>Tente outro termo ou remova um dos filtros.</p><button type="button" onClick={clear}>Ver todas as habilidades</button></div>}
        </div>
        <nav className="dt-pagination" aria-label="Páginas de habilidades">
          <span className="dt-page-summary" aria-live="polite">{filtered.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filtered.length)} de ${filtered.length}` : '0 resultados'}</span>
          <div className="dt-page-buttons">
            <button type="button" aria-label="← Anterior" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>←</button>
            {pageNumbers.map((value, index) => <React.Fragment key={value}>
              {index > 0 && value > pageNumbers[index - 1] + 1 && <span className="dt-page-gap" aria-hidden="true">…</span>}
              <button type="button" aria-label={`Página ${value + 1}`} aria-current={currentPage === value ? 'page' : undefined} onClick={() => setPage(value)}>{value + 1}</button>
            </React.Fragment>)}
            <button type="button" aria-label="Próxima →" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>→</button>
          </div>
        </nav>
      </section>
      <aside className="dt-detail" aria-label="Detalhes da habilidade">
        {selected ? <>
          <div className="dt-detail-top"><span>{selected.category}</span><span>{acquired ? 'INCORPORADA' : 'DISPONÍVEL'}</span></div>
          <h2>{selected.title}</h2>
          <p className="dt-provenance">Habilidade Darkness</p>
          <div className="dt-facts"><div><span>Ação</span><strong>{selected.action}</strong></div><div><span>Aquisição</span><strong>3 pontos</strong></div><div><span>Uso</span><strong>{selected.limit === 'constante' ? 'Passiva' : selected.limit ? `1 / ${selected.limit}` : 'Conforme o efeito'}</strong></div></div>
          <div className="dt-level-tabs" role="group" aria-label="Níveis da habilidade">{[1, 2, 3].map(value => <button type="button" key={value} aria-pressed={level === value} onClick={() => setLevel(value)}>Nível {['I', 'II', 'III'][value - 1]}{acquired?.level === value && <small>Atual</small>}</button>)}</div>
          <div className="dt-effect"><span>EFEITO / NÍVEL {['I', 'II', 'III'][level - 1]}</span>{level > 1 && rawEffect.startsWith(details[0]) && <small>Mantém o efeito do nível I e acrescenta:</small>}<p>{effect}</p></div>
          {rules && <details className="dt-rules"><summary>Regras de uso e limites</summary><p>{rules}</p></details>}
          <div className="dt-hope"><span>Custo de Esperança</span><strong>{costs[0] ? `${costs[0]} no fracasso · ${costs[1]} no sucesso com consequência` : 'Sem custo de Esperança'}</strong></div>
          <div className="dt-purchase"><div><span>{acquired ? `Adquirida · nível ${acquired.level}` : 'Incorporar ao repertório'}</span><strong>{acquired?.level >= 3 ? 'Domínio completo' : '3 pontos de evolução'}</strong></div>
            <button type="button" disabled={busy || points < 3 || acquired?.level >= 3} onClick={() => acquired ? onUpgrade(acquired.id) : onAcquire(selected.ability, selected.category)}>{acquired ? acquired.level >= 3 ? 'Nível máximo' : `Aprimorar para o Nível ${acquired.level + 1} · 3 pontos` : 'Adquirir · 3 pontos'} <span aria-hidden="true">↗</span></button>
            {points < 3 && acquired?.level !== 3 && <small>Saldo insuficiente. Você precisa de {3 - points} ponto{3 - points === 1 ? '' : 's'} para este avanço.</small>}
          </div>
        </> : <div className="dt-detail-empty"><div className="dt-sigil" aria-hidden="true">✦</div><span>O PRÓXIMO PASSO É SEU</span><h2>O que você vai<br/>se tornar?</h2><p>Selecione uma habilidade para examinar seu efeito, comparar os três níveis e incorporá-la à sua história.</p><div><b>01</b> Explore o repertório<br/><b>02</b> Conheça as consequências<br/><b>03</b> Transforme a experiência</div></div>}
      </aside>
    </div>
    {owned.length > 0 && <section className="dt-owned"><div><span>REPERTÓRIO ATUAL</span><h3>{owned.length} habilidades incorporadas</h3></div><div className="dt-owned-grid">{owned.map(item => <button type="button" key={item.id} onClick={() => { const entry = entries.find(e => e.id === item.id); if (entry) select(entry); }}><small>{item.category} / Nível {item.level}</small><strong>{darknessAbilityName(item.name)}</strong><span>Consultar ↗</span></button>)}</div></section>}
  </section>;
}
