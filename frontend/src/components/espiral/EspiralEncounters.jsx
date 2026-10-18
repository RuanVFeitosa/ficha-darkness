import EspiralDice, { EspiralDiceInput } from './EspiralDice';
import { espiralDie } from '../../utils/espiralDice';
import React, { useEffect, useRef, useState } from 'react';
import EspiralDamageResult from './EspiralDamageResult';
import { ATTRIBUTES, RESOURCES, GRADES, VERTENTES, integrityMax, parseDiceFormula } from '../../data/espiral';
import { CATALOGO_ESPIRAL } from '../../data/catalogoEspiral';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL } from '../../data/habilidadesEspiral';
import { confirmarDialogo } from '../ui/DialogoGlobal';
import { grantEspiralCatalogEntry } from '../../utils/espiralCatalogGrant';
import { ESPIRAL_ENCOUNTERS_KEY, createEspiralEncounter, normalizeEspiralEncounter, readEspiralEncounters, writeEspiralEncounter, rollEspiralEncounter } from '../../utils/espiralEncounters';
import '../../styles/EspiralEncounters.css';

const uid = () => crypto.randomUUID();
const die = sides => Math.floor(Math.random() * sides) + 1;
const abilities = Object.entries(HABILIDADES_ESPIRAL).flatMap(([category, entries]) => entries.map(([name]) => ({ id: `${category}:${name}`, name, category, type: 'ability' })));
const normalizedText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function EncounterEditor({ record, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(record));
  const [section, setSection] = useState('Ficha');
  const [notice, setNotice] = useState('');
  const [attribute, setAttribute] = useState('pulso');
  const [resource, setResource] = useState('Armas');
  const [difficulty, setDifficulty] = useState(4);
  const [result, setResult] = useState(null);
  const [catalogId, setCatalogId] = useState(CATALOGO_ESPIRAL[0].id);
  const [abilityId, setAbilityId] = useState(abilities[0].id);
  const [region, setRegion] = useState('Torso');
  const [severity, setSeverity] = useState('Moderada');
  const [injuryNote, setInjuryNote] = useState('');
  const closeRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    return () => previousFocus?.focus?.();
  }, []);
  const field = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const group = (key, name, value) => setDraft(current => ({ ...current, [key]: { ...current[key], [name]: value }, ...(key === 'attributes' && name === 'pulso' ? { integrity: Math.min(current.integrity, integrityMax(value)) } : {}) }));
  const maxIntegrity = integrityMax(draft.attributes.pulso);
  const addCatalogEntry = () => {
    const entry = CATALOGO_ESPIRAL.find(item => item.id === catalogId);
    setDraft(current => ({ ...current, ...grantEspiralCatalogEntry(current, entry, uid()) }));
    setNotice(`${entry.name} incluído. Salve a ficha para confirmar.`);
  };
  const addAbility = () => {
    const entry = abilities.find(item => item.id === abilityId);
    setDraft(current => ({ ...current, ...grantEspiralCatalogEntry(current, entry) }));
  };
  const rollDamage = weapon => {
    try {
      const parsed = parseDiceFormula(weapon.damage);
      if (!parsed) throw new Error('Informe um dano válido, como 1⬡6 ou 2◇8+2.');
      const values = Array.from({ length: parsed.amount }, () => die(parsed.sides));
      setResult({ label: `Dano · ${weapon.name}`, dice: values, pressure: [], best: values.reduce((total, value) => total + value, parsed.modifier || 0), outcome: 'Dano rolado', stress: '', sides: parsed.sides });
    } catch (error) { setNotice(error.message); }
  };
  const save = event => {
    event.preventDefault();
    if (onSave(normalizeEspiralEncounter(draft))) onClose();
    else setNotice('Não foi possível salvar a ficha. Os dados anteriores foram preservados.');
  };
  const close = async () => {
    if (JSON.stringify(draft) !== JSON.stringify(record) && !await confirmarDialogo('Descartar as alterações que ainda não foram salvas?', { titulo: 'Alterações na ficha ESPIRAL', confirmarTexto: 'Descartar' })) return;
    onClose();
  };
  const trapFocus = event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const elements = [...event.currentTarget.querySelectorAll('button:not(:disabled), input, select, textarea')];
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="ee-overlay"><form className="ee-sheet" role="dialog" aria-modal="true" aria-labelledby="ee-sheet-title" onSubmit={save} onKeyDown={trapFocus}>
    <header className="ee-sheet-header"><div><span className="ed-eyebrow">ESPIRAL / FICHA DE ENCONTRO</span><h2 id="ee-sheet-title">{draft.name || 'Novo encontro'}</h2><p>{draft.tipo === 'npc' ? 'NPC do Mestre' : 'Inimigo'} · Defesa {Number(draft.attributes.sentido) + 2} · Integridade máxima {maxIntegrity}</p></div><button ref={closeRef} type="button" onClick={close} aria-label="Fechar ficha de encontro">×</button></header>
    <nav className="ee-tabs" aria-label="Seções da ficha de encontro">{['Ficha', 'Equipamentos', 'Habilidades', 'Lesões'].map(name => <button type="button" key={name} aria-pressed={section === name} onClick={() => setSection(name)}>{name}</button>)}</nav>
    {notice && <p className="ee-notice" role="status">{notice}</p>}
    {section === 'Ficha' && <>
      <div className="ee-form-grid"><label>Nome<input required value={draft.name} onChange={event => field('name', event.target.value)} /></label><label>Tipo<select value={draft.tipo} onChange={event => field('tipo', event.target.value)}><option value="npc">NPC</option><option value="inimigo">Inimigo</option></select></label><label>Pasta<input value={draft.folder} onChange={event => field('folder', event.target.value)} placeholder="Ex.: Aliados, ameaças, capítulo 1" /></label><label>Função / ocupação<input value={draft.occupation} onChange={event => field('occupation', event.target.value)} /></label><label>Vertente<select value={draft.vertente} onChange={event => field('vertente', event.target.value)}>{Object.keys(VERTENTES).map(name => <option key={name}>{name}</option>)}</select></label><label>URL do retrato<input type="url" value={draft.profileImage} onChange={event => field('profileImage', event.target.value)} /></label></div>
      <h3>Atributos</h3><div className="ee-attributes">{Object.entries(ATTRIBUTES).map(([key, entry]) => <label key={key}>{entry.name}<select value={draft.attributes[key]} onChange={event => group('attributes', key, Number(event.target.value))}>{entry.stages.map((name, index) => <option key={name} value={index + 1}>{index + 1} · {name} · {espiralDie((index + 1) * 2 + 2)}</option>)}</select></label>)}</div>
      <h3>Estado atual</h3><div className="ee-attributes">{[['integrity', 'Integridade', maxIntegrity], ['sanity', 'Sanidade', 10], ['hope', 'Esperança', 10], ['pressure', 'Dados de Pressão', 20], ['failures', 'Fracassos', 3]].map(([key, label, max]) => <label key={key}>{label}<input type="number" min="0" max={max} value={draft[key]} onChange={event => field(key, Number(event.target.value))} /><small>Máximo: {max}</small></label>)}</div>
      <h3>Recursos</h3><div className="ee-resources">{RESOURCES.map(name => <label key={name}>{name}<select value={draft.resources[name]} onChange={event => group('resources', name, Number(event.target.value))}>{GRADES.map((grade, index) => <option key={grade} value={index}>Grau {index} · {grade}</option>)}</select></label>)}</div>
      <label>Descrição e história<textarea rows="3" value={draft.backgroundDescription} onChange={event => field('backgroundDescription', event.target.value)} /></label><label>Propósito<input value={draft.purpose} onChange={event => field('purpose', event.target.value)} /></label><label>Notas do Mestre<textarea rows="3" value={draft.notes} onChange={event => field('notes', event.target.value)} /></label>
    </>}
    {section === 'Equipamentos' && <><div className="ee-add"><label>Item do Acervo<select value={catalogId} onChange={event => setCatalogId(event.target.value)}>{CATALOGO_ESPIRAL.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button type="button" onClick={addCatalogEntry}>Adicionar item</button></div><h3>Armas e ataques</h3>{draft.weapons.map(weapon => <article className="ee-entry" key={weapon.id}><div><label>Nome de {weapon.name}<input value={weapon.name} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, name: event.target.value } : item))} /></label><label>Descrição de {weapon.name}<textarea value={weapon.detail || ''} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, detail: event.target.value } : item))} /></label><label>Dano de {weapon.name}<EspiralDiceInput aria-label={`Dano de ${weapon.name}`} value={weapon.damage} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, damage: event.target.value } : item))} /></label></div><button type="button" onClick={() => rollDamage(weapon)}>Rolar dano</button><button type="button" aria-label={`Remover arma ${weapon.name}`} onClick={() => field('weapons', draft.weapons.filter(item => item.id !== weapon.id))}>Remover</button></article>)}<button type="button" onClick={() => field('weapons', [...draft.weapons, { id: uid(), name: 'Ataque especial', damage: '1d6', detail: '' }])}>Adicionar ataque especial</button><h3>Proteções</h3>{draft.protections.length ? draft.protections.map(item => <article className="ee-entry" key={item.id}><div><b>{item.name} · Proteção {item.value}</b><p>{item.region} · {item.detail}</p></div><button type="button" aria-label={`Remover proteção ${item.name}`} onClick={() => field('protections', draft.protections.filter(entry => entry.id !== item.id))}>Remover</button></article>) : <p>Nenhuma proteção registrada.</p>}<h3>Equipamentos</h3>{draft.inventoryItems.map(item => <article className="ee-entry" key={item.id}><div><b>{item.name}</b><p>{item.detail}</p></div><button type="button" aria-label={`Remover item ${item.name}`} onClick={() => { field('inventoryItems', draft.inventoryItems.filter(entry => entry.id !== item.id)); field('inventory', String(draft.inventory || '').split('\n').filter(name => name !== item.name || draft.inventoryItems.some(entry => entry.id !== item.id && entry.name === name)).join('\n')); }}>Remover</button></article>)}<label>Inventário e itens adicionais<textarea rows="4" value={draft.inventory} onChange={event => field('inventory', event.target.value)} /></label></>}
    {section === 'Habilidades' && <><div className="ee-add"><label>Habilidade ESPIRAL<select value={abilityId} onChange={event => setAbilityId(event.target.value)}>{abilities.map(entry => <option key={entry.id} value={entry.id}>{entry.category} · {entry.name}</option>)}</select></label><button type="button" onClick={addAbility}>Adicionar habilidade</button></div>{(draft.evolution?.abilities || []).map(entry => <article className="ee-entry" key={entry.id}><div><b>{entry.name}</b><label>Nível de {entry.name}<select value={entry.level} onChange={event => group('evolution', 'abilities', draft.evolution.abilities.map(item => item.id === entry.id ? { ...item, level: Number(event.target.value) } : item))}>{[1, 2, 3].map(level => <option key={level}>{level}</option>)}</select></label><p>{APRIMORAMENTOS_HABILIDADES_ESPIRAL[entry.name]?.[entry.level - 1]}</p></div><button type="button" aria-label={`Remover habilidade ${entry.name}`} onClick={() => group('evolution', 'abilities', draft.evolution.abilities.filter(item => item.id !== entry.id))}>Remover</button></article>)}<label>Habilidades narrativas / especiais<textarea rows="5" value={draft.abilities} onChange={event => field('abilities', event.target.value)} /></label></>}
    {section === 'Lesões' && <><div className="ee-form-grid"><label>Região<select value={region} onChange={event => setRegion(event.target.value)}>{['Cabeça', 'Torso', 'Braço esquerdo', 'Braço direito', 'Perna esquerda', 'Perna direita'].map(name => <option key={name}>{name}</option>)}</select></label><label>Gravidade<select value={severity} onChange={event => setSeverity(event.target.value)}>{['Leve', 'Moderada', 'Grave', 'Crítica', 'Catastrófica / Fatal'].map(name => <option key={name}>{name}</option>)}</select></label><label>Nota da lesão<input value={injuryNote} onChange={event => setInjuryNote(event.target.value)} /></label></div><button type="button" onClick={() => { field('injuries', [...draft.injuries, { id: uid(), region, severity, note: injuryNote }]); setInjuryNote(''); }}>Registrar lesão</button>{draft.injuries.map(item => <article className="ee-entry" key={item.id}><div><b>{item.region} · {item.severity}</b><p>{item.note}</p></div><button type="button" aria-label={`Remover lesão ${item.region}`} onClick={() => field('injuries', draft.injuries.filter(entry => entry.id !== item.id))}>Remover</button></article>)}</>}
    <section className="ee-roll"><h3>Rolagem ESPIRAL</h3><div className="ee-form-grid"><label>Atributo da rolagem<select value={attribute} onChange={event => setAttribute(event.target.value)}>{Object.entries(ATTRIBUTES).map(([key, entry]) => <option key={key} value={key}>{entry.name}</option>)}</select></label><label>Recurso da rolagem<select value={resource} onChange={event => setResource(event.target.value)}>{RESOURCES.map(name => <option key={name}>{name}</option>)}</select></label><label>Dificuldade<input type="number" min="1" max="30" value={difficulty} onChange={event => setDifficulty(Number(event.target.value))} /></label></div><button type="button" onClick={() => setResult(rollEspiralEncounter(draft, attribute, resource, difficulty, die))}>Rolar teste</button>{result && <div className="ee-result" role="status"><b>{<EspiralDice value={result.label} />} · {result.outcome}</b><p>Dados: {result.dice.join(', ')}{result.pressure.length ? ` · Pressão: ${result.pressure.join(', ')}` : ''}</p><strong>{result.best}</strong>{result.outcome === 'Dano rolado' && <EspiralDamageResult damage={result.best} />}{result.stress && <span> · {result.stress}</span>}</div>}</section>
    <footer className="ee-sheet-footer"><span>Ficha local · NPCs e inimigos usam o mesmo modelo ESPIRAL.</span><button type="submit">Salvar ficha</button></footer>
  </form></div>;
}

export default function EspiralEncounters() {
  const [records, setRecords] = useState([]);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('todos');
  const [folder, setFolder] = useState('todas');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    const refresh = event => {
      if (event?.key && event.key !== ESPIRAL_ENCOUNTERS_KEY) return;
      try { setRecords(readEspiralEncounters(localStorage)); } catch (error) { setNotice(error.message || 'Não foi possível abrir os encontros ESPIRAL.'); }
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  const save = record => {
    try { setRecords(writeEspiralEncounter(localStorage, record)); setNotice('Ficha ESPIRAL salva.'); return true; }
    catch { setNotice('Não foi possível salvar os encontros ESPIRAL. Os dados anteriores foram preservados.'); return false; }
  };
  const duplicate = record => save({ ...structuredClone(record), id: uid(), name: `${record.name} (Cópia)` });
  const remove = async record => {
    if (!await confirmarDialogo(`Excluir a ficha de ${record.name}?`, { titulo: 'Excluir encontro ESPIRAL', confirmarTexto: 'Excluir' })) return;
    try {
      const next = readEspiralEncounters(localStorage).filter(item => item.id !== record.id);
      localStorage.setItem(ESPIRAL_ENCOUNTERS_KEY, JSON.stringify({ version: 1, records: next }));
      setRecords(next); setNotice('Ficha de encontro excluída.');
    } catch { setNotice('Não foi possível excluir a ficha.'); }
  };
  const folders = [...new Set(records.map(item => item.folder).filter(Boolean))].sort();
  const visible = records.filter(item => (filter === 'todos' || item.tipo === filter) && (folder === 'todas' || (folder === 'sem-pasta' ? !item.folder : item.folder === folder)) && normalizedText(`${item.name} ${item.occupation} ${item.folder}`).includes(normalizedText(query)));
  return <section className="ee-page"><div className="ed-section-heading"><div><span className="ed-eyebrow">03 / ENCONTROS ESPIRAL</span><h2>Aliados, rostos e ameaças.</h2><p>Uma ficha para NPCs e inimigos: atributos, recursos, lesões e ações ESPIRAL.</p></div><div className="ee-create"><button type="button" onClick={() => setEditing(createEspiralEncounter('npc', uid()))}>Criar NPC</button><button type="button" onClick={() => setEditing(createEspiralEncounter('inimigo', uid()))}>Criar inimigo</button></div></div>
    <div className="ee-toolbar"><nav className="ee-tabs" aria-label="Tipos de encontros">{[['todos', 'Todos'], ['npc', 'NPCs'], ['inimigo', 'Inimigos']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} <small>{records.filter(item => value === 'todos' || item.tipo === value).length}</small></button>)}</nav><label>Buscar encontros<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome, função ou pasta" /></label><label>Pasta dos encontros<select value={folder} onChange={event => setFolder(event.target.value)}><option value="todas">Todas as pastas</option><option value="sem-pasta">Sem pasta</option>{folders.map(name => <option key={name}>{name}</option>)}</select></label></div>
    {notice && <p className="ee-notice" role="status">{notice}</p>}
    <div className="ee-grid">{visible.map(record => <article className="ee-card" key={record.id}><button type="button" className="ee-card-open" aria-label={`Abrir ficha de ${record.name}`} onClick={() => setEditing(record)}><div className="ee-portrait">{record.profileImage ? <img src={record.profileImage} alt="" /> : <span>{record.name.slice(0, 1)}</span>}<b>{record.tipo === 'npc' ? 'NPC' : 'INIMIGO'}</b></div><div className="ee-card-body"><span className="ed-eyebrow">{record.folder || 'SEM PASTA'} / {record.vertente}</span><h3>{record.name}</h3><p>{record.occupation || 'Função não informada'}</p><dl>{Object.entries(ATTRIBUTES).map(([key, entry]) => <div key={key}><dt>{entry.name}</dt><dd>{espiralDie(record.attributes[key] * 2 + 2)}</dd></div>)}</dl><div className="ee-card-state"><span>Integridade <b>{record.integrity} / {integrityMax(record.attributes.pulso)}</b></span><progress aria-label={`Integridade de ${record.name}`} value={record.integrity} max={integrityMax(record.attributes.pulso)} /><span>Sanidade {record.sanity}/10 · Esperança {record.hope}/10</span><small>Defesa {record.attributes.sentido + 2} · Pressão {record.pressure} · {record.injuries.length} lesões</small></div></div></button><footer><button type="button" onClick={() => duplicate(record)} aria-label={`Duplicar ${record.name}`}>Duplicar</button><button type="button" onClick={() => remove(record)} aria-label={`Excluir ${record.name}`}>Excluir</button></footer></article>)}</div>
    {!visible.length && <div className="ee-empty"><h3>{records.length ? 'Nenhum encontro encontrado.' : 'Todo encontro começa com alguém.'}</h3><p>{records.length ? 'Ajuste a busca ou os filtros para encontrar a ficha.' : 'Crie um NPC ou inimigo para o arquivo ESPIRAL. As fichas são salvas neste dispositivo.'}</p></div>}
    {editing && <EncounterEditor key={editing.id} record={editing} onSave={save} onClose={() => setEditing(null)} />}
  </section>;
}
