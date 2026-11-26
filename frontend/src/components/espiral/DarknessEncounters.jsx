import ProtocolLogo from '../ui/ProtocolLogo';
// @refresh reset
import { EncounterPortrait, EncounterAttributes, EncounterVitals, EncounterResources } from './EncounterDossier';
import { freshProtocolSheet, isProtocolSheet, protocolDefenses } from '../../data/protocoloDarkness';
import { adaptarParaDarkness } from '../../utils/adaptarParaDarkness';
import { useDarknessWeaponCatalog } from '../../utils/darknessWeaponCatalog';
import { useDarknessAbilityCatalog } from '../../utils/darknessAbilityCatalog';
import { darknessAbilityName } from '../../utils/darknessAbilityName';
import { compressProfileImage, prepareTokenImage } from '../../services/imageCompression';
import NumberInput from '../ui/NumberInput';
import EspiralDice, { EspiralDiceInput } from './EspiralDice';
import { espiralDie } from '../../utils/espiralDice';
import React, { useEffect, useRef, useState } from 'react';
import EspiralDamageResult from './EspiralDamageResult';
import { ATTRIBUTES, RESOURCES, GRADES, VERTENTES, integrityMax, parseDiceFormula } from '../../data/espiral';

import { APRIMORAMENTOS_HABILIDADES_ESPIRAL } from '../../data/habilidadesEspiral';
import { confirmarDialogo } from '../ui/DialogoGlobal';
import { grantEspiralCatalogEntry } from '../../utils/espiralCatalogGrant';
import { ESPIRAL_ENCOUNTERS_KEY, createDarknessEncounter, normalizeEspiralEncounter, readEspiralEncounters, writeEspiralEncounter, rollEspiralEncounter } from '../../utils/espiralEncounters';
import '../../styles/EspiralEncounters.css';
import '../../styles/DarknessEncounters.css';

const uid = () => crypto.randomUUID();
const die = sides => Math.floor(Math.random() * sides) + 1;

const normalizedText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function EncounterEditor({ record, onSave, onClose }) {
  const catalog = useDarknessWeaponCatalog();
  const abilities = useDarknessAbilityCatalog();
  const [draft, setDraft] = useState(() => isProtocolSheet(record) ? structuredClone(record) : { ...structuredClone(record), ruleset: freshProtocolSheet().ruleset, encounterOrigin: structuredClone(record) });
  const [section, setSection] = useState('Ficha');
  const [notice, setNotice] = useState('');
  const [attribute, setAttribute] = useState('pulso');
  const [resource, setResource] = useState('Armas');
  const [difficulty, setDifficulty] = useState(1);
  const [result, setResult] = useState(null);
  const [catalogId, setCatalogId] = useState(catalog[0].id);
  const [abilityId, setAbilityId] = useState(abilities[0]?.id || '');
  const [region, setRegion] = useState('Torso');
  const [severity, setSeverity] = useState('Moderada');
  const [injuryNote, setInjuryNote] = useState('');
  const closeRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const importImage = async (event, key) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setNotice('Preparando imagem…');
    try {
      const image = await (key === 'profileImage' ? compressProfileImage(file) : prepareTokenImage(file));
      if (image) {
        setDraft(current => ({ ...current, [key]: image }));
        setNotice('Imagem preparada. Salve a ficha para confirmar.');
      } else setNotice('');
    } catch (error) { setNotice(error.message || 'Não foi possível preparar a imagem.'); }
    finally { setUploading(false); }
  };
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    return () => previousFocus?.focus?.();
  }, []);
  const field = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const group = (key, name, value) => setDraft(current => ({ ...current, [key]: { ...current[key], [name]: value }, ...(key === 'attributes' && name === 'pulso' ? { integrity: Math.min(current.integrity, integrityMax(value)) } : {}) }));
  const maxIntegrity = integrityMax(draft.attributes.pulso);
  const defenses = protocolDefenses(draft.attributes);
  const addCatalogEntry = () => {
    const entry = catalog.find(item => item.id === catalogId);
    setDraft(current => ({ ...current, ...grantEspiralCatalogEntry(current, entry, uid()) }));
    setNotice(`${darknessAbilityName(entry.name)} incluído. Salve a ficha para confirmar.`);
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
    if (uploading) return;
    if (onSave(normalizeEspiralEncounter(draft))) onClose();
    else setNotice('Não foi possível salvar a ficha. Os dados anteriores foram preservados.');
  };
  const close = async () => {
    if (JSON.stringify(draft) !== JSON.stringify(record) && !await confirmarDialogo('Descartar as alterações que ainda não foram salvas?', { titulo: 'Alterações na ficha Darkness', confirmarTexto: 'Descartar' })) return;
    onClose();
  };
  const trapFocus = event => {
    if (event.target.closest('[role=dialog]') !== event.currentTarget) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const elements = [...event.currentTarget.querySelectorAll('button:not(:disabled), input, select, textarea')];
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="ee-overlay"><form className="ee-sheet dn-visual-sheet" role="dialog" aria-modal="true" aria-labelledby="ee-sheet-title" onSubmit={save} onKeyDown={trapFocus}>
    <header className="ee-sheet-header"><div><span className="ed-eyebrow"><ProtocolLogo /> / FICHA DE ENCONTRO</span><h2 id="ee-sheet-title">{draft.name || 'Novo encontro'}</h2><p>{draft.tipo === 'npc' ? 'NPC do Mestre' : 'Inimigo'} · Defesa {defenses.base} · Esquiva {defenses.dodge} · Bloqueio {defenses.block} · Integridade máxima {maxIntegrity}</p></div><button ref={closeRef} type="button" onClick={close} aria-label="Fechar ficha de encontro">×</button></header>
    <nav className="ee-tabs" aria-label="Seções da ficha de encontro">{['Ficha', 'Equipamentos', 'Habilidades', 'Lesões'].map(name => <button type="button" key={name} aria-pressed={section === name} onClick={() => setSection(name)}>{name}</button>)}</nav>
    {notice && <p className="ee-notice" role="status">{notice}</p>}
    <div className="ee-sheet-content">
    {section === 'Ficha' && <>
      <EncounterPortrait draft={draft} defenses={defenses} maximum={maxIntegrity}/>
      <details className="dn-media-settings"><summary>Personalizar retrato e token</summary>
      <section className="ee-identity" aria-label="Aparência do encontro">
        {[['profileImage', 'Foto de perfil', 'Retrato para identificar o personagem na ficha e no arquivo.'], ['tabletopTokenImage', 'Token 3D', 'Imagem de corpo inteiro para o tabletop 3D. Prefira PNG com fundo transparente.']].map(([key, title, description]) => <div className="ee-media" key={key}>
          <div className={`ee-media-preview ${key === 'tabletopTokenImage' ? 'ee-token-preview' : ''}`}>
            {draft[key] ? <img src={draft[key]} alt={`${title} de ${draft.name}`} /> : <span aria-hidden="true">{key === 'profileImage' ? (draft.name || '?').slice(0, 1) : '♟'}</span>}
          </div>
          <div className="ee-media-controls"><h3>{title}</h3><p>{description}</p>
            <label className="ee-upload">{draft[key] ? `Trocar ${title.toLowerCase()}` : `Adicionar ${title.toLowerCase()}`}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={`Enviar ${title.toLowerCase()}`} disabled={uploading} onChange={event => importImage(event, key)} /></label>
            {draft[key] && <button type="button" disabled={uploading} onClick={() => field(key, '')}>Remover {title.toLowerCase()}</button>}
          </div>
        </div>)}
      </section>
      </details>
      <h3 className="dn-section-title"><span>01</span> Identidade e papel na história</h3>
      <details className="dn-media-settings"><summary>Links de imagem</summary><label>URL do token 3D<input type="text" placeholder="https://…" value={draft.tabletopTokenImage || ''} onChange={event => field('tabletopTokenImage', event.target.value)} /></label></details>
      <div className="ee-form-grid"><label>Nome<input required value={draft.name} onChange={event => field('name', event.target.value)} /></label><label>Tipo<select value={draft.tipo} onChange={event => field('tipo', event.target.value)}><option value="npc">NPC</option><option value="inimigo">Inimigo</option></select></label><label>Pasta<input value={draft.folder} onChange={event => field('folder', event.target.value)} placeholder="Ex.: Aliados, ameaças, capítulo 1" /></label><label>Função / ocupação<input value={draft.occupation} onChange={event => field('occupation', event.target.value)} /></label><label>Vertente<select value={draft.vertente} onChange={event => field('vertente', event.target.value)}>{Object.keys(VERTENTES).map(name => <option key={name}>{name}</option>)}</select></label><details className="dn-media-settings"><summary>Link do retrato</summary><label>URL do retrato<input type="text" placeholder="https://…" value={draft.profileImage} onChange={event => field('profileImage', event.target.value)} /></label></details></div>
      <h3 className="dn-section-title"><span>02</span> Atributos</h3><EncounterAttributes attributes={draft.attributes} onChange={(key, value) => group('attributes', key, value)}/>
      <h3 className="dn-section-title"><span>03</span> Estado e resistência</h3><EncounterVitals draft={draft} maximum={maxIntegrity} onChange={field}/>
      <h3 className="dn-section-title"><span>04</span> Recursos e competências</h3><EncounterResources resources={draft.resources} onChange={(name, value) => group('resources', name, value)}/>
      <h3 className="dn-section-title"><span>05</span> História e anotações</h3>
      <label>Descrição e história<textarea rows="3" value={draft.backgroundDescription} onChange={event => field('backgroundDescription', event.target.value)} /></label><label>Propósito<input value={draft.purpose} onChange={event => field('purpose', event.target.value)} /></label><label>Notas do Mestre<textarea rows="3" value={draft.notes} onChange={event => field('notes', event.target.value)} /></label>
    </>}
    {section === 'Equipamentos' && <><div className="ee-add"><label>Item do Acervo<select value={catalogId} onChange={event => setCatalogId(event.target.value)}>{catalog.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button type="button" onClick={addCatalogEntry}>Adicionar item</button></div><h3>Armas e ataques</h3>{draft.weapons.map(weapon => <article className="ee-entry" key={weapon.id}><div><label>Nome de {weapon.name}<input value={weapon.name} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, name: event.target.value } : item))} /></label><label>Descrição de {weapon.name}<textarea value={weapon.detail || ''} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, detail: event.target.value } : item))} /></label><label>Dano de {weapon.name}<EspiralDiceInput aria-label={`Dano de ${weapon.name}`} value={weapon.damage} onChange={event => field('weapons', draft.weapons.map(item => item.id === weapon.id ? { ...item, damage: event.target.value } : item))} /></label></div><button type="button" onClick={() => rollDamage(weapon)}>Rolar dano</button><button type="button" aria-label={`Remover arma ${weapon.name}`} onClick={() => field('weapons', draft.weapons.filter(item => item.id !== weapon.id))}>Remover</button></article>)}<button type="button" onClick={() => field('weapons', [...draft.weapons, { id: uid(), name: 'Ataque especial', damage: '1d6', detail: '' }])}>Adicionar ataque especial</button><h3>Proteções</h3>{draft.protections.length ? draft.protections.map(item => <article className="ee-entry" key={item.id}><div><b>{item.name} · Proteção {item.value}</b><p>{item.region} · {item.detail}</p></div><button type="button" aria-label={`Remover proteção ${item.name}`} onClick={() => field('protections', draft.protections.filter(entry => entry.id !== item.id))}>Remover</button></article>) : <p>Nenhuma proteção registrada.</p>}<h3>Equipamentos</h3>{draft.inventoryItems.map(item => <article className="ee-entry" key={item.id}><div><b>{item.name}</b><p>{item.detail}</p></div><button type="button" aria-label={`Remover item ${item.name}`} onClick={() => { field('inventoryItems', draft.inventoryItems.filter(entry => entry.id !== item.id)); field('inventory', String(draft.inventory || '').split('\n').filter(name => name !== item.name || draft.inventoryItems.some(entry => entry.id !== item.id && entry.name === name)).join('\n')); }}>Remover</button></article>)}<label>Inventário e itens adicionais<textarea rows="4" value={draft.inventory} onChange={event => field('inventory', event.target.value)} /></label></>}
    {section === 'Habilidades' && <><div className="ee-add"><label>Habilidade Darkness<select value={abilityId} onChange={event => setAbilityId(event.target.value)}>{abilities.map(entry => <option key={entry.id} value={entry.id}>{entry.category} · {darknessAbilityName(entry.name)}</option>)}</select></label><button type="button" onClick={addAbility}>Adicionar habilidade</button></div>{(draft.evolution?.abilities || []).map(entry => <article className="ee-entry" key={entry.id}><div><b>{darknessAbilityName(entry.name)}</b><label>Nível de {darknessAbilityName(entry.name)}<select value={entry.level} onChange={event => group('evolution', 'abilities', draft.evolution.abilities.map(item => item.id === entry.id ? { ...item, level: Number(event.target.value) } : item))}>{[1, 2, 3].map(level => <option key={level}>{level}</option>)}</select></label><p>{(entry.levels || APRIMORAMENTOS_HABILIDADES_ESPIRAL[entry.name])?.[entry.level - 1]}</p></div><button type="button" aria-label={`Remover habilidade ${darknessAbilityName(entry.name)}`} onClick={() => group('evolution', 'abilities', draft.evolution.abilities.filter(item => item.id !== entry.id))}>Remover</button></article>)}<label>Habilidades narrativas / especiais<textarea rows="5" value={draft.abilities} onChange={event => field('abilities', event.target.value)} /></label></>}
    {section === 'Lesões' && <><div className="ee-form-grid"><label>Região<select value={region} onChange={event => setRegion(event.target.value)}>{['Cabeça', 'Torso', 'Braço esquerdo', 'Braço direito', 'Perna esquerda', 'Perna direita'].map(name => <option key={name}>{name}</option>)}</select></label><label>Gravidade<select value={severity} onChange={event => setSeverity(event.target.value)}>{['Leve', 'Moderada', 'Grave', 'Crítica', 'Catastrófica / Fatal'].map(name => <option key={name}>{name}</option>)}</select></label><label>Nota da lesão<input value={injuryNote} onChange={event => setInjuryNote(event.target.value)} /></label></div><button type="button" onClick={() => { field('injuries', [...draft.injuries, { id: uid(), region, severity, note: injuryNote }]); setInjuryNote(''); }}>Registrar lesão</button>{draft.injuries.map(item => <article className="ee-entry" key={item.id}><div><b>{item.region} · {item.severity}</b><p>{item.note}</p></div><button type="button" aria-label={`Remover lesão ${item.region}`} onClick={() => field('injuries', draft.injuries.filter(entry => entry.id !== item.id))}>Remover</button></article>)}</>}
    <section className="ee-roll"><h3>Rolagem Darkness</h3><div className="ee-form-grid"><label>Atributo da rolagem<select value={attribute} onChange={event => setAttribute(event.target.value)}>{Object.entries(ATTRIBUTES).map(([key, entry]) => <option key={key} value={key}>{entry.name}</option>)}</select></label><label>Recurso da rolagem<select value={resource} onChange={event => setResource(event.target.value)}>{RESOURCES.map(name => <option key={name}>{name}</option>)}</select></label><label>Dificuldade<NumberInput type="number" min="1" max="5" value={difficulty} onChange={event => setDifficulty(Number(event.target.value))} /></label></div><button type="button" onClick={() => (() => { try { setResult(rollEspiralEncounter(draft, attribute, resource, difficulty, die)); } catch (error) { setNotice(error.message); } })()}>Rolar teste</button>{result && <div className="ee-result" role="status"><b>{<EspiralDice value={result.label} />} · {result.outcome}</b><p>Dados: {result.dice.join(', ')}{result.pressure.length ? ` · Pressão: ${result.pressure.join(', ')}` : ''}</p><strong>{result.best}{result.ruleset ? ' êxitos' : ''}</strong>{result.outcome === 'Dano rolado' && <EspiralDamageResult damage={result.best} />}{result.stress && <span> · {result.stress}</span>}</div>}</section>
    </div><footer className="ee-sheet-footer"><span>Ficha local · NPCs e inimigos usam o mesmo modelo Darkness.</span><button type="submit" disabled={uploading}>{uploading ? 'Preparando imagem…' : 'Salvar ficha'}</button></footer>
  </form></div>;
}

export default function DarknessEncounters({ legacyRecords = [], storageKey = ESPIRAL_ENCOUNTERS_KEY }) {
  const [records, setRecords] = useState([]);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('todos');
  const [folder, setFolder] = useState('todas');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    const refresh = event => {
      if (event?.key && event.key !== storageKey) return;
      try { setRecords(readEspiralEncounters(localStorage, storageKey)); } catch (error) { setNotice(error.message || 'Não foi possível abrir os encontros Darkness.'); }
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [storageKey]);
  const save = record => {
    try { setRecords(writeEspiralEncounter(localStorage, record, storageKey)); setNotice('Ficha Darkness salva.'); return true; }
    catch { setNotice('Não foi possível salvar os encontros Darkness. Os dados anteriores foram preservados.'); return false; }
  };
  const duplicate = record => save({ ...structuredClone(record), id: uid(), name: `${record.name} (Cópia)` });
  const remove = async record => {
    if (!await confirmarDialogo(`Excluir a ficha de ${record.name}?`, { titulo: 'Excluir encontro Darkness', confirmarTexto: 'Excluir' })) return;
    try {
      const next = readEspiralEncounters(localStorage, storageKey).filter(item => item.id !== record.id);
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, records: next }));
      setRecords(next); setNotice('Ficha de encontro excluída.');
      window.dispatchEvent(new Event('espiral:encounters-changed'));
    } catch { setNotice('Não foi possível excluir a ficha.'); }
  };
  const folders = [...new Set(records.map(item => item.folder).filter(Boolean))].sort();
  const visible = records.filter(item => (filter === 'todos' || item.tipo === filter) && (folder === 'todas' || (folder === 'sem-pasta' ? !item.folder : item.folder === folder)) && normalizedText(`${item.name} ${item.occupation} ${item.folder}`).includes(normalizedText(query)));
  return <section className="ee-page darkness-encounters"><div className="ed-section-heading"><div><span className="ed-eyebrow">03 / ARQUIVO DARKNESS</span><h2>Aliados, rostos e ameaças.</h2><p>Uma ficha para NPCs e inimigos: atributos, recursos, lesões e ações Darkness.</p></div><div className="ee-create"><button type="button" onClick={() => setEditing(createDarknessEncounter('npc', uid()))}>Criar NPC</button><button type="button" onClick={() => setEditing(createDarknessEncounter('inimigo', uid()))}>Criar inimigo</button></div></div>
    <div className="dn-overview"><div><span>NPCs</span><strong>{records.filter(record => record.tipo === 'npc').length}</strong></div><div><span>Inimigos</span><strong>{records.filter(record => record.tipo === 'inimigo').length}</strong></div><div><span>Sistema</span><strong><ProtocolLogo /></strong></div></div>
    <div className="ee-toolbar"><nav className="ee-tabs" aria-label="Tipos de encontros">{[['todos', 'Todos'], ['npc', 'NPCs'], ['inimigo', 'Inimigos']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} <small>{records.filter(item => value === 'todos' || item.tipo === value).length}</small></button>)}</nav><label>Buscar encontros<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome, função ou pasta" /></label><label>Pasta dos encontros<select value={folder} onChange={event => setFolder(event.target.value)}><option value="todas">Todas as pastas</option><option value="sem-pasta">Sem pasta</option>{folders.map(name => <option key={name}>{name}</option>)}</select></label></div>
    {notice && <p className="ee-notice" role="status">{notice}</p>}
    <div className="ee-grid">{visible.map(record => <article className="ee-card" key={record.id}><button type="button" className="ee-card-open" aria-label={`Abrir ficha de ${record.name}`} onClick={() => setEditing(record)}><div className="ee-portrait">{record.profileImage ? <img src={record.profileImage} alt="" /> : <span>{record.name.slice(0, 1)}</span>}<b>{record.tipo === 'npc' ? 'NPC' : 'INIMIGO'}</b></div><div className="ee-card-body"><span className="ed-eyebrow">{record.folder || 'SEM PASTA'} / {record.vertente}</span><h3>{record.name}</h3><p>{record.occupation || 'Função não informada'}</p><dl>{Object.entries(ATTRIBUTES).map(([key, entry]) => <div key={key}><dt>{entry.name}</dt><dd>{espiralDie(record.attributes[key] * 2 + 2)}</dd></div>)}</dl><div className="ee-card-state"><span>Integridade <b>{record.integrity} / {integrityMax(record.attributes.pulso)}</b></span><progress aria-label={`Integridade de ${record.name}`} value={record.integrity} max={integrityMax(record.attributes.pulso)} /><span>Sanidade {record.sanity}/10 · Esperança {record.hope}/10</span><small>Defesa {isProtocolSheet(record) ? protocolDefenses(record.attributes).base : record.attributes.sentido + 2} · Pressão {record.pressure} · {record.injuries.length} lesões</small></div></div></button><footer><button type="button" onClick={() => duplicate(record)} aria-label={`Duplicar ${record.name}`}>Duplicar</button><button type="button" onClick={() => remove(record)} aria-label={`Excluir ${record.name}`}>Excluir</button></footer></article>)}</div>
    {!visible.length && <div className="ee-empty"><h3>{records.length ? 'Nenhum encontro encontrado.' : 'Todo encontro começa com alguém.'}</h3><p>{records.length ? 'Ajuste a busca ou os filtros para encontrar a ficha.' : 'Crie um NPC ou inimigo para o arquivo Darkness. As fichas são salvas neste dispositivo.'}</p></div>}
    {legacyRecords.length > 0 && <details className="dn-archive"><summary>Arquivo anterior · {legacyRecords.length} registros preservados</summary><p>Crie uma cópia Darkness para revisar os dados. As fichas originais permanecem intactas.</p><div>{legacyRecords.map((record, index) => {
      const source = record.personagem || record;
      const sourceId = record.fichaId || record.id || source.id || String(index);
      const copied = records.some(item => item.legacySourceId === sourceId);
      return <article key={sourceId}><div><strong>{source.nome || source.name || 'Sem nome'}</strong><small>{source.tipo === 'npc' ? 'NPC' : 'Inimigo'} · Absoluto</small></div><button type="button" disabled={copied} onClick={() => setEditing({ ...adaptarParaDarkness(source, 'absoluto', sourceId), id: uid(), tipo: source.tipo === 'npc' ? 'npc' : 'inimigo', folder: source.pasta || '', legacySourceId: sourceId })}>{copied ? 'Adaptado' : 'Adaptar para Darkness'}</button></article>;
    })}</div></details>}
    {editing && <EncounterEditor key={editing.id} record={editing} onSave={save} onClose={() => setEditing(null)} />}
  </section>;
}
