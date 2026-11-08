import React, { useEffect, useState } from 'react';
import { ATRIBUTOS_ABSOLUTO, REGIOES } from '../../data/absolutoV1';
import { normalizeShieldSearch } from '../../data/masterShield';
import { readEspiralEncounters, espiralEncounterForTabletop, ESPIRAL_ENCOUNTERS_CHANGED } from '../../utils/espiralEncounters';
import EspiralEncounterViewer from '../espiral/EspiralEncounterViewer';
import NumberInput from '../ui/NumberInput';

function VitalAdjustment({ label, title, resource, onSave }) {
  const [amount, setAmount] = useState('');
  const current = Math.max(0, Number(resource.atual) || 0);
  const max = resource.max == null ? Math.max(current, 1) : Math.max(0, Number(resource.max) || 0);
  const delta = Math.max(0, Math.trunc(Number(amount) || 0));
  return <div className="shield-vital">
    <div className="shield-vital-heading"><span>{title || label}</span><b>{current} / {max}</b></div>
    <progress aria-label={`Estado de ${label}`} value={Math.min(current, max)} max={Math.max(1, max)} />
    <div className="shield-vital-adjustment">
      <button type="button" aria-label={`Subtrair de ${label}`} disabled={!delta || current <= 0} onClick={() => onSave(Math.max(0, current - delta))}>−</button>
      <NumberInput aria-label={`Valor para alterar ${label}`} min="0" placeholder="Valor" value={amount} onChange={event => setAmount(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} />
      <button type="button" aria-label={`Somar a ${label}`} disabled={!delta || current >= max} onClick={() => onSave(Math.min(max, current + delta))}>+</button>
    </div>
  </div>;
}

function EditNumber({ label, title, value, min = 0, max = 9999, onSave }) {
  return <label>{title || label}<input aria-label={label} key={value} type="number" min={min} max={max} defaultValue={value ?? 0} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} onBlur={event => {
    const next = Math.min(max, Math.max(min, Math.trunc(Number(event.target.value) || 0)));
    event.target.value = String(next); if (next !== Number(value ?? 0)) onSave(next);
  }} /></label>;
}

function RosterCard({ record, system, onSave, onChoose, chosen, renderInitiative, onRemove, onAddToMap, mapReady }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const [addingMap, setAddingMap] = useState(false);
  const enemy = { ...record.dados, ...record };
  const npc = enemy.tipo === 'npc', name = enemy.nome || enemy.name || (npc ? 'NPC' : 'Inimigo');
  const regions = Object.entries(enemy.membros || {}).filter(([, value]) => value && typeof value === 'object');
  const hurt = regions.filter(([, value]) => Number(value.atual) < Number(value.max));
  const update = async patch => {
    setBusy(true); setError(''); setSaved(false);
    try { await onSave({ ...record, ...patch }); setSaved(true); }
    catch (e) { setError(e.message || 'Não foi possível salvar. Tente novamente.'); }
    finally { setBusy(false); }
  };
  const actions = [...(Array.isArray(enemy.ataques) ? enemy.ataques : []), ...(Array.isArray(enemy.habilidades) ? enemy.habilidades : [])];
  const validDefense = Number.isInteger(Number(enemy.defesa)) && Number(enemy.defesa) >= 1 && Number(enemy.defesa) <= 5;
  // Prop opcional: se o intermediário não a encaminhar, o callback ainda habilita a ação.
  // O próprio callback da Mesa verifica se o modo mapa está ativo.
  const canAddMap = Boolean(onAddToMap && mapReady !== false && !busy);
  const handleAddToMap = async () => {
    if (!canAddMap || addingMap) return;
    setAddingMap(true); setError('');
    try { await onAddToMap(record); }
    catch (e) { setError(e.message || 'Não foi possível adicionar ao mapa.'); }
    finally { setAddingMap(false); }
  };
  return <article className={`shield-roster-card ${chosen ? 'is-combat-source' : ''}`} aria-label={name}>
    <details>
      <summary
        draggable={canAddMap}
        onDragStart={event => {
          if (!canAddMap) { event.preventDefault(); return; }
          event.dataTransfer.effectAllowed = 'copy';
          // `||` cobre "" / 0 / null / undefined → cai para o id
          event.dataTransfer.setData(
            'application/x-darkness-inimigo',
            String(enemy.inimigo_ref || enemy.id),
          );
        }}
        title={canAddMap ? 'Arraste para o mapa ou use "+ Mapa" para posicionar no centro' : undefined}
      >
        <span className="shield-roster-avatar">
          {enemy.fotoPerfil || enemy.profileImage
            ? <img src={enemy.fotoPerfil || enemy.profileImage} alt="" draggable="false" />
            : name.slice(0, 2)}
        </span>
        <span className="shield-roster-identity">
          <strong>{name}</strong>
          <small>Nível {enemy.nivel ?? 1} · {enemy.classe || enemy.occupation || (npc ? 'NPC' : 'Inimigo')}</small>
        </span>
        {renderInitiative && <span className="shield-roster-initiative-values" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>{renderInitiative(record)}</span>}
      </summary>
      <div className="shield-roster-editor">
        {chosen && <p className="shield-combat-source">Define a dificuldade de combate</p>}
        {(enemy.sistema || system) === 'espiral' ? <fieldset disabled={busy || !onSave}><EspiralEncounterViewer record={record} onChange={value => update(value)} /></fieldset> : <>
          <div className="shield-sheet-columns">
            <div className="shield-sheet-left" aria-label={`Recursos e atributos de ${name}`}>
              <fieldset disabled={busy || !onSave} className="shield-sheet-state"><legend className="shield-sr-only">Recursos de {name}</legend>
                <div className="shield-sheet-resource-bars">{['sanidade', 'esperanca'].filter(key => enemy[key] && typeof enemy[key] === 'object').map(key => <VitalAdjustment key={key} label={`${key === 'sanidade' ? 'Sanidade' : 'Esperança'} de ${name}`} title={key === 'sanidade' ? 'Sanidade' : 'Esperança'} resource={enemy[key]} onSave={atual => update({ [key]: { ...enemy[key], atual } })} />)}</div>
              </fieldset>
              {enemy.atributos && <section className="shield-sheet-attributes"><h4>Atributos</h4><dl className="shield-roster-attributes">{Object.entries(enemy.atributos).map(([key, value]) => <div key={key}><dt>{ATRIBUTOS_ABSOLUTO[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl></section>}

            </div>
            <fieldset disabled={busy || !onSave} className="shield-sheet-right"><legend className="shield-sr-only">Defesa e integridade de {name}</legend>
              <div className="shield-sheet-defense">
                <EditNumber label={`Defesa de ${name}`} title="Defesa" value={enemy.defesa} min={1} max={5} onSave={defesa => update({ defesa })} />
              </div>
              {regions.length > 0 && <section className="shield-sheet-regions" aria-label={`Integridade de ${name}`}><h4>Integridade dos membros</h4><div className="shield-sheet-regions-grid">{regions.map(([key, value]) => <VitalAdjustment key={key} label={`${REGIOES[key]?.nome || key} de ${name}`} title={REGIOES[key]?.nome || key} resource={value} onSave={atual => update({ membros: { ...enemy.membros, [key]: { ...value, atual } } })} />)}</div></section>}
            </fieldset>
          </div>
          <details><summary>Ataques e habilidades · {actions.length}</summary>{actions.length ? actions.map((action, index) => <div className="shield-roster-action" key={action.id || index}><strong>{typeof action === 'string' ? action : action.nome || action.titulo || 'Ação'}</strong>{typeof action !== 'string' && <p>{action.descricao || action.efeito || action.dano || 'Sem descrição.'}</p>}</div>) : <p>Nenhuma ação cadastrada.</p>}</details>
          <details><summary>Notas de condução</summary><fieldset disabled={busy || !onSave}><textarea key={enemy.anotacoesMestre || ''} aria-label={`Notas de ${name}`} defaultValue={enemy.anotacoesMestre || ''} rows="2" placeholder="Intenção, pistas, tática…" onBlur={event => { if (event.target.value !== (enemy.anotacoesMestre || '')) update({ anotacoesMestre: event.target.value }); }} /></fieldset></details>
        </>}
        {onChoose && system === 'absoluto' && <button type="button" disabled={busy || chosen || !validDefense} onClick={async () => { setBusy(true); setError(''); try { await onChoose({ combateInimigoId: String(enemy.id) }); } catch (e) { setError(e.message || 'Não foi possível selecionar.'); } finally { setBusy(false); } }}>{chosen ? 'Defesa selecionada' : 'Usar Defesa no combate'}</button>}
        {busy && <small role="status">Salvando…</small>}{saved && !busy && <small role="status">Alterações salvas.</small>}
      </div>
    </details>
    {onAddToMap && (
      <button
        type="button"
        className="shield-roster-add-map"
        disabled={!canAddMap || addingMap}
        onClick={handleAddToMap}
        title={mapReady === false ? 'Ative o modo mapa para posicionar este participante' : 'Posiciona este participante no centro do mapa 2D'}
      >
        {addingMap ? 'Posicionando…' : '+ Mapa 2D'}
      </button>
    )}
    <div className="shield-roster-status"><span>{hurt.length ? `${hurt.length} região(ões) ferida(s)` : regions.length ? 'Integridade preservada' : 'Sem integridade cadastrada'}</span>{enemy.sanidade && <span>Sanidade {enemy.sanidade.atual ?? 0}/{enemy.sanidade.max ?? '—'}</span>}{chosen && <b>DT do combate</b>}</div>
    {onRemove && <button type="button" className="shield-roster-remove" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onRemove(record); } catch (e) { setError(e.message || 'Não foi possível remover da mesa.'); } finally { setBusy(false); } }}>Remover da mesa</button>}
    {error && <p role="alert">{error}</p>}
  </article>;
}

export default function ShieldRoster({ enemies = [], system, onSave, onAdd, onChoose, chosenId, renderInitiative, onRemove, onAddToMap, mapReady }) {
  const [filter, setFilter] = useState('todos'), [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState([]), [libraryQuery, setLibraryQuery] = useState(''), [libraryFilter, setLibraryFilter] = useState('todos'), [adding, setAdding] = useState(''), [addError, setAddError] = useState('');
  useEffect(() => {
    const refresh = () => {
      try {
        const records = system === 'espiral' ? readEspiralEncounters(localStorage).map(espiralEncounterForTabletop) : [...JSON.parse(localStorage.getItem('darkness_inimigos') || '[]').map(item => ({ ...item, tipo: 'inimigo' })), ...JSON.parse(localStorage.getItem('darkness_npcs') || '[]').map(item => ({ ...item, tipo: 'npc' }))];
        setCatalog(records);
      } catch { setCatalog([]); }
    };
    refresh(); window.addEventListener('storage', refresh); window.addEventListener(ESPIRAL_ENCOUNTERS_CHANGED, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(ESPIRAL_ENCOUNTERS_CHANGED, refresh); };
  }, [system]);
  const available = catalog.filter(record => !enemies.some(enemy => String(enemy.inimigo_ref || enemy.id) === String(record.id || record.fichaId)));
  const isNpc = enemy => (enemy.tipo || enemy.dados?.tipo) === 'npc';
  const visible = enemies.filter(enemy => (filter === 'todos' || (filter === 'npcs' ? isNpc(enemy) : !isNpc(enemy))) && normalizeShieldSearch(enemy.nome || enemy.dados?.nome || enemy.name).includes(normalizeShieldSearch(query)));
  return <section className="shield-roster" aria-label="Inimigos e NPCs"><header><div><span>PARTICIPANTES DA CAMPANHA</span><h3>Inimigos e NPCs</h3></div><b>{enemies.length}</b></header>
    <div className="shield-roster-toolbar"><nav className="shield-roster-filters" aria-label="Filtrar participantes">{[['todos', 'Todos', enemies.length], ['inimigos', 'Inimigos', enemies.filter(e => !isNpc(e)).length], ['npcs', 'NPCs', enemies.filter(isNpc).length]].map(([id, label, count]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} · {count}</button>)}</nav>
      <input type="search" aria-label="Buscar inimigo ou NPC" placeholder="Buscar por nome…" value={query} onChange={event => setQuery(event.target.value)} /></div>

    <div className="shield-roster-list">{visible.map(enemy => <RosterCard key={enemy.id} record={enemy} onRemove={onRemove} renderInitiative={renderInitiative} system={system} onSave={onSave} onChoose={onChoose} chosen={chosenId != null && String(chosenId) === String(enemy.id)} onAddToMap={onAddToMap} mapReady={mapReady} />)}{!visible.length && <p>{enemies.length ? 'Nenhum participante corresponde à busca.' : 'Nenhum inimigo ou NPC vinculado. Adicione participantes à campanha para administrá-los aqui.'}</p>}</div>
    {onAdd && <details className="shield-roster-add shield-library"><summary><span>+ Adicionar participantes</span><small>{available.length} disponíveis</small></summary>
      <div className="shield-library-toolbar"><input type="search" aria-label="Buscar na biblioteca" placeholder="Buscar personagem…" value={libraryQuery} onChange={e => setLibraryQuery(e.target.value)} /><nav aria-label="Filtrar biblioteca">{[['todos', 'Todos'], ['inimigos', 'Inimigos'], ['npcs', 'NPCs']].map(([id, label]) => <button type="button" key={id} aria-pressed={libraryFilter === id} onClick={() => setLibraryFilter(id)}>{label}</button>)}</nav></div>
      <div className="shield-library-grid">{available.filter(record => (libraryFilter === 'todos' || (libraryFilter === 'npcs' ? isNpc(record) : !isNpc(record))) && normalizeShieldSearch(record.nome || record.name).includes(normalizeShieldSearch(libraryQuery))).map(record => {
        const id = String(record.id || record.fichaId), name = record.nome || record.name || 'Sem nome', photo = record.fotoPerfil || record.profileImage;
        return <article className="shield-library-card" key={id} data-kind={isNpc(record) ? 'npc' : 'inimigo'}><span className="shield-library-photo">{photo ? <img src={photo} alt="" /> : name.slice(0, 2)}</span><div><small>{isNpc(record) ? 'NPC' : 'Inimigo'} · NV {record.nivel || record.level || 1}</small><strong>{name}</strong><span>{record.classe || record.occupation || ''}</span></div><button type="button" disabled={Boolean(adding)} aria-label={'Adicionar ' + name + ' à mesa'} onClick={async () => { if (adding) return; setAdding(id); setAddError(''); try { await onAdd(record); } catch (e) { setAddError(e.message || 'Não foi possível adicionar.'); } finally { setAdding(''); } }}>{adding === id ? '…' : '+ Adicionar'}</button></article>;
      })}</div>
      {!available.length ? <p>Todos os participantes da biblioteca já estão na mesa, ou a biblioteca está vazia.</p> : !available.some(record => (libraryFilter === 'todos' || (libraryFilter === 'npcs' ? isNpc(record) : !isNpc(record))) && normalizeShieldSearch(record.nome || record.name).includes(normalizeShieldSearch(libraryQuery))) && <p>Nenhum personagem encontrado. Tente outro nome ou filtro.</p>}
      {addError && <p role="alert">{addError}</p>}
    </details>}
  </section>;
}