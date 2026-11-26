import React, { useEffect, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiArrowLeft, mdiBookOpenOutline, mdiBriefcaseOutline, mdiDiceD20Outline, mdiFileDocumentOutline, mdiPlus, mdiShieldOutline, mdiSwordCross, mdiTriangleOutline } from '@mdi/js';
import { attributes, newOrdemSheet, normalizeOrdem, ordemId, readOrdemSheets, resources, rituals, rollOrdemDamage, rollOrdemTest, skills, writeOrdemSheets } from '../services/ordemSheet';
import '../styles/FichaOrdem.css';
import { compressProfileImage } from '../services/imageCompression';
import AnimatedTokenImage from '../components/tokens/AnimatedTokenImage';
import { AgathaPowers, Conditions, Powers } from '../components/ordem/SheetManagement';
import OrdemRooms from '../components/ordem/OrdemRooms';
import OrdemThemes, { OrdemPortraitTheme, ordemThemeStyle } from '../components/ordem/OrdemThemes';
import ElementSymbol from '../components/ordem/ElementSymbol';
import ParanormalFilters from '../components/ordem/ParanormalFilters';
import { ritualRolls } from '../services/ordemRitualDice';
import { readLocalCampaign, writeLocalCampaign } from '../services/localCampaignStorage';
import { buscarCampanhaPorCodigo, vincularFicha } from '../services/mesaApi';
import { campaignSystem } from '../utils/campaignSystem';

const sections = [
  ['Visão geral', mdiDiceD20Outline], ['Personalização', mdiTriangleOutline], ['Anotações', mdiFileDocumentOutline],
];
const overviewSections = [
  ['Combate', mdiSwordCross], ['Habilidades', mdiBookOpenOutline],
  ['Inventário', mdiBriefcaseOutline], ['Rituais', mdiTriangleOutline],
];
const grades = ['Destreinado', 'Treinado', 'Veterano', 'Expert'];
const signed = value => value < 0 ? String(value) : `+${value}`;

function NumberField({ label, caption, value, onChange, min = 0, max = 999 }) {
  return <label>{caption ?? label}<input aria-label={caption ? label : undefined} type="number" min={min} max={max} value={value} onChange={event => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) onChange(Math.max(min, Math.min(max, Math.trunc(value))));
  }} /></label>;
}

function TextField({ label, value, onChange, placeholder }) {
  return <label>{label}<input value={value} maxLength={100} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></label>;
}

const criticalResource = { pv: 'Morrendo', san: 'Enlouquecendo' };

function Resource({ code, name, value, onChange, editing, rounds = 0, onRoundsChange }) {
  const [resourceChange, setResourceChange] = useState(null);
  const condition = criticalResource[code];
  const showRounds = Boolean(condition && value.current === 0 && value.max > 0);
  function update(key, next) {
    const updated = { ...value, [key]: next };
    updated.current = Math.min(updated.current, updated.max);
    if (updated.current !== value.current) {
      const delta = updated.current - value.current;
      setResourceChange(previous => ({ delta, id: (previous?.id ?? 0) + 1 }));
    }
    onChange(updated);
  }

  return <section className="os-resource" data-resource={code}>
    {editing && <header><span>{name}</span><small>Temp. {value.temp}</small></header>}
    <div className="os-resource-line">
    <div className="os-meter" tabIndex={editing ? undefined : 0} role="group" aria-label={name}>
      <button type="button" aria-label={`Reduzir ${name}`} disabled={!value.current} onClick={() => update('current', value.current - 1)}>−</button>
      <output className="os-resource-number" aria-label={`${name}: ${value.current} de ${value.max}${value.temp ? `, ${value.temp} temporários` : ''}`}>
        <strong>{value.current}</strong><small> / {value.max}</small>
      </output>
      <button type="button" aria-label={`Aumentar ${name}`} disabled={value.current >= value.max} onClick={() => update('current', value.current + 1)}>+</button>
      {resourceChange && <span key={resourceChange.id} aria-hidden="true" className="os-resource-change"
        data-direction={resourceChange.delta > 0 ? 'gain' : 'loss'} onAnimationEnd={() => setResourceChange(null)}>
        {resourceChange.delta > 0 ? '+' : '−'}{Math.abs(resourceChange.delta)}
      </span>}
    </div>
    {condition && <div className="os-round-indicator" data-visible={showRounds} aria-hidden={!showRounds}>
      <div className="os-round-indicator-inner">
        <span>{condition}</span>
        <div className="os-round-dots" role="group" aria-label={`Turnos em ${condition}: ${rounds}/3`}>
          {[1, 2, 3].map(turn => (
            <button type="button" key={turn} aria-label={`${condition}: ${turn} de 3 turnos`}
              aria-pressed={turn <= rounds} disabled={!showRounds}
              onClick={() => onRoundsChange(turn === rounds ? turn - 1 : turn)} />
          ))}
        </div>
      </div>
    </div>}
    </div>
    {editing && <div className="os-resource-controls">
      <NumberField label={`Máx. ${code.toUpperCase()}`} value={value.max} onChange={next => update('max', next)} />
      <NumberField label={`Temp. ${code.toUpperCase()}`} value={value.temp} onChange={next => update('temp', next)} />
    </div>}
  </section>;
}

function EntryForm({ type, onAdd }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [skill, setSkill] = useState('Luta');
  return <form className="os-entry-form" onSubmit={event => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: ordemId(), name: name.trim(), detail: detail.trim(), quantity, skill });
    setName('');
    setDetail('');
    setQuantity(1);
  }}>
    <TextField label={type} value={name} onChange={setName} />
    <TextField label={type === 'Ataque' ? 'Dano' : 'Descrição'} value={detail} onChange={setDetail} placeholder={type === 'Ataque' ? 'Ex.: 2d6+3' : undefined} />
    {type === 'Item' && <NumberField label="Quantidade" value={quantity} min={1} onChange={setQuantity} />}
    {type === 'Ataque' && <label>Perícia<select value={skill} onChange={event => setSkill(event.target.value)}><option>Luta</option><option>Pontaria</option></select></label>}
    <button className="os-accent" disabled={!name.trim()}><Icon path={mdiPlus} size={0.7} /> Adicionar</button>
  </form>;
}

function Entries({ entries, type, onChange, rollSkill, showDamage }) {
  const isAttack = type === 'Ataque';
  const form = <EntryForm type={type} onAdd={entry => onChange([...entries, entry])} />;
  return <>
    {!isAttack && form}
    {entries.length === 0 && <p className="os-muted">{isAttack ? 'Nenhum ataque registrado.' : 'Nenhum registro adicionado.'}</p>}
    <div className={isAttack ? 'os-attack-cards' : 'os-entries'}>
      {entries.map(entry => <article key={entry.id}>
        <div className={isAttack ? 'os-attack-heading' : undefined}>
          {isAttack && <Icon path={mdiSwordCross} size={0.9} aria-hidden="true" />}
          <div><strong>{entry.name}</strong>{type === 'Item' && <span> × {entry.quantity}</span>}
          <p>{isAttack ? [entry.skill, entry.detail].filter(Boolean).join(' · ') : entry.detail}</p></div>
        </div>
        <div className="os-actions">
          {type === 'Ataque' && <>
            <button type="button" onClick={() => rollSkill(entry.skill, entry.name)}>Atacar</button>
            <button type="button" disabled={!entry.detail} onClick={() => showDamage(entry)}>Rolar dano</button>
          </>}
          <button type="button" aria-label={`Remover ${entry.name}`} onClick={() => onChange(entries.filter(item => item.id !== entry.id))}>Remover</button>
        </div>
      </article>)}
    </div>
    {isAttack && <details className="os-attack-form" open={entries.length === 0}>
      <summary>Adicionar ataque</summary>
      {form}
    </details>}
  </>;
}

function Rituals({ known, onChange, dt, rollSkill, onRoll, catalog = false, onOpenCatalog }) {
  const [query, setQuery] = useState('');
  const [element, setElement] = useState('');
  const [circle, setCircle] = useState(null);
  const [expanded, setExpanded] = useState({});
  const visible = rituals.filter(ritual => (catalog !== known.includes(ritual.name))
    && (!element || ritual.element.toUpperCase() === element.toUpperCase()) && (!circle || ritual.circle === circle)
    && normalizeOrdem(ritual.name).includes(normalizeOrdem(query.trim())));

  return <>
    <div className="os-work-heading"><div><h2>Rituais</h2><p>{known.length} na ficha</p></div><div className="os-ritual-dt"><strong>{dt}</strong><small>DT de ritual</small></div><button type="button" onClick={() => rollSkill('Ocultismo')}>Ocultismo</button></div>
    {!catalog && <button type="button" className="os-accent os-catalog" onClick={onOpenCatalog}>Consultar catálogo</button>}
    <div className="os-paranormal-toolbar">
      <label>Buscar ritual<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <ParanormalFilters element={element} onElementChange={setElement} circle={circle} onCircleChange={setCircle} />
    </div>
    {visible.length === 0 && <p className="os-muted">{known.length || catalog ? 'Nenhum ritual corresponde aos filtros.' : 'Abra o catálogo para adicionar os rituais do agente.'}</p>}
    <div className="os-rituals">
      {visible.map(ritual => {
        const learned = known.includes(ritual.name);
        const open = Boolean(expanded[ritual.name]);
        const versions = ['Normal', ...ritual.variants.map(variant => variant.label)];
        return <div className="os-ritual-item" key={ritual.name} data-element={ritual.element} data-expanded={open}
          style={{ '--ritual-texture': `url("/ordem-texturas/${ritual.element.toLowerCase()}.jpg")` }}>
          <button className="os-ritual-toggle" type="button" aria-expanded={open}
            onClick={() => setExpanded(current => ({ ...current, [ritual.name]: !current[ritual.name] }))}>
            <ElementSymbol element={ritual.element} />
            <span className="os-ritual-heading">
              <span className="os-ritual-name"><small>{['I', 'II', 'III', 'IV'][ritual.circle - 1]}</small><strong>{ritual.name}</strong></span>
              <small className="os-ritual-meta">{ritual.element}{catalog && learned ? ' · Na ficha' : ''}</small>
            </span>
          </button>
          {(!catalog || open) && <div className="os-ritual-variants">
            {versions.flatMap(label => {
              const [name, cost] = label.split(/\s*\(/);
              const rolls = ritualRolls(ritual.name, ['normal', 'discente', 'verdadeiro'].indexOf(name.toLowerCase()));
              if (!rolls.length) return versions.length > 1 ? [<span key={label}><b>{cost?.replace(/\)$/, '')}</b><small>{name}</small></span>] : [];
              return rolls.map(({ expression, effect }) => (
                <button key={`${label}:${expression}:${effect}`} type="button"
                  aria-label={`Rolar ${ritual.name} · ${name} · ${expression}${effect ? ` · ${effect}` : ''}`}
                  onClick={() => onRoll(ritual.name, name, expression, effect)}>
                  <b>{expression}</b><small>{name}</small>{effect && <small>{effect}</small>}
                </button>
              ));
            })}
          </div>}
          {open && <div className="os-ritual-expanded">
            <article className="os-ritual-card" aria-label={`Detalhes de ${ritual.name}`}>
                  {ritual.fields.length > 0 && <dl>
                    {ritual.fields.map(({ label, value }, index) => (
                      <div key={index}><dt>{label}:</dt><dd>{value}</dd></div>
                    ))}
                  </dl>}
              {ritual.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {ritual.variants.map(({ label, paragraphs }, index) => (
                <section key={index}>
                  <p><strong>{label}:</strong> {paragraphs[0]}</p>
                  {paragraphs.slice(1).map((paragraph, position) => <p key={position}>{paragraph}</p>)}
                </section>
              ))}
            </article>
            <button type="button" onClick={() => onChange(learned ? known.filter(name => name !== ritual.name) : [...known, ritual.name])}>{learned ? 'Remover da ficha' : 'Adicionar à ficha'}</button>
          </div>}
        </div>;
      })}
    </div>
  </>;
}

export default function FichaOrdem(props) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') !== 'mesa') return <OrdemSheet {...props} />;

  const id = params.get('agente');
  let sheets = [];
  try { sheets = readOrdemSheets(); } catch {}
  if (!id || !sheets.some(sheet => sheet.id === id)) {
    return <main className="ordem-sheet os-tabletop-sheet"><div className="os-shell">
      <h1>Ficha indisponível neste navegador</h1>
      <p>Abra a mesa no navegador onde você salvou este agente ou selecione outra ficha vinculada.</p>
    </div></main>;
  }
  return <OrdemSheet key={id} embeddedId={id} initialSheets={sheets} />;
}

function OrdemSheet({ backHref = '/', jogadorOrigem, embeddedId, initialSheets }) {
  const [joiningCampaign, setJoiningCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [sheets, setSheets] = useState(() => {
    if (initialSheets) return initialSheets;
    let saved = [];
    try { saved = readOrdemSheets(); } catch {}
    if (saved.some(sheet => !jogadorOrigem || sheet.jogadorOrigem === jogadorOrigem)) return saved;
    const draft = newOrdemSheet();
    return [...saved, jogadorOrigem ? { ...draft, jogadorOrigem } : draft];
  });
  const availableSheets = jogadorOrigem ? sheets.filter(sheet => sheet.jogadorOrigem === jogadorOrigem) : sheets;
  const [activeId, setActiveId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('agente');
    return embeddedId ?? availableSheets.find(sheet => sheet.id === requested)?.id ?? availableSheets[0].id;
  });
  const [section, setSection] = useState('Visão geral');
  const [overviewSection, setOverviewSection] = useState('Rituais');
  const [roomsEntry, setRoomsEntry] = useState(null);
  const [roomsReturn, setRoomsReturn] = useState('Visão geral');
  const isOverview = section === 'Visão geral';
  const visibleSection = isOverview ? overviewSection : section;
  const [editing, setEditing] = useState(false);
  const sheetsRef = useRef(sheets);
  const portraitInput = useRef(null);
  const activePortraitId = useRef(activeId);
  const [storedPortrait, setStoredPortrait] = useState(null);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [portraitError, setPortraitError] = useState('');
  const [trainedOnly, setTrainedOnly] = useState(false);
  const [combatSkillQuery, setCombatSkillQuery] = useState('');
  const [diceBonus, setDiceBonus] = useState(0);
  const [testBonus, setTestBonus] = useState(0);
  const inCombat = visibleSection === 'Combate';
  const activeDiceBonus = inCombat ? diceBonus : 0;
  const activeTestBonus = inCombat ? testBonus : 0;
  const [roll, setRoll] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const sheet = sheets.find(item => item.id === activeId);
  const portrait = storedPortrait?.id === activeId ? storedPortrait.image : sheet.portrait;

  useEffect(() => {
    let active = true;
    readLocalCampaign(`ordem:retrato:${activeId}`).then(image => {
      if (active && typeof image === 'string') {
        setStoredPortrait(current => current?.id === activeId ? current : { id: activeId, image });
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [activeId]);
  const defenseEquipment = sheet.defenseEquipment ?? 0;
  const defense = 10 + sheet.attributes.AGI + defenseEquipment + sheet.defenseBonus;
  const fortitude = sheet.skills.Fortitude;
  const reflexes = sheet.skills.Reflexos;
  const block = fortitude?.rank ? fortitude.rank + fortitude.extra : null;
  const dodge = reflexes?.rank ? defense + reflexes.rank + reflexes.extra : null;
  const title = sheet.nome.trim() || 'Novo agente';

  async function joinCampaign(event) {
    event.preventDefault();
    if (joiningCampaign) return;
    const code = String(new FormData(event.currentTarget).get('campanha') || '').trim().toUpperCase();
    if (!code) return;
    const memberId = `ordem:${activeId}`;
    setJoiningCampaign(true);
    setCampaignError('');
    try {
      const campaign = await buscarCampanhaPorCodigo(code);
      if (!campaign) throw new Error('Campanha não encontrada. Confira o código.');
      if (campaignSystem(campaign) !== 'ordem') throw new Error('Este código pertence a uma campanha de outro sistema.');
      const stored = readOrdemSheets();
      if (!stored.some(item => item.id === activeId)) writeOrdemSheets([...stored, sheet]);
      await vincularFicha(campaign.id, memberId, { nome: title });
      const params = new URLSearchParams({ campanha: code, sistema: 'ordem', papel: 'jogador', vinculo: memberId });
      window.location.assign(`/?${params}`);
    } catch (error) {
      setCampaignError(error.message || 'Não foi possível vincular a ficha à campanha.');
      setJoiningCampaign(false);
    }
  }

  function save(next) {
    sheetsRef.current = next;
    setSheets(next);
    try {
      writeOrdemSheets(next);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

  function update(key, value) {
    patchSheet({ [key]: value });
  }

  function patchSheet(changes) {
    let current = sheetsRef.current;
    if (embeddedId) {
      try {
        current = readOrdemSheets();
        if (!current.some(item => item.id === activeId)) throw new Error();
      } catch {
        setSaveError(true);
        return;
      }
    }
    save(current.map(item => item.id === activeId ? { ...item, ...changes } : item));
  }

  function openRooms(room, catalog) {
    setRoomsReturn(section);
    setRoomsEntry(room ? { room, catalog } : null);
    setSection('Salas da Ordem');
  }

  async function persistPortrait(image) {
    if (!readOrdemSheets().some(item => item.id === activeId)) writeOrdemSheets(sheetsRef.current);
    await writeLocalCampaign(`ordem:retrato:${activeId}`, image);
    if (activePortraitId.current === activeId) setStoredPortrait({ id: activeId, image });
  }

  async function changePortrait(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setPortraitBusy(true);
    setPortraitError('');
    try {
      const image = await compressProfileImage(file);
      if (image) await persistPortrait(image);
    } catch {
      setPortraitError('Não foi possível carregar ou salvar o retrato neste navegador.');
    } finally {
      setPortraitBusy(false);
    }
  }

  function selectAgent(id) {
    activePortraitId.current = id;
    setStoredPortrait(null);
    setActiveId(id);
    setRoll(null);
    setDiceBonus(0);
    setTestBonus(0);
    setCombatSkillQuery('');
    setTrainedOnly(false);
    setSection('Visão geral');
    setOverviewSection('Rituais');
    setEditing(false);
    setPortraitError('');
  }

  function rollSkill(name, title = name) {
    const attribute = skills.find(([skill]) => skill === name)[1];
    const { rank = 0, extra = 0 } = sheet.skills[name] || {};
    setRoll({ title, ...rollOrdemTest(sheet.attributes[attribute], activeDiceBonus, rank + extra + activeTestBonus) });
  }

  function showDamage(entry) {
    const result = rollOrdemDamage(entry.detail);
    setRoll(result ? { title: `Dano · ${entry.name}`, ...result } : { title: 'Formato de dano inválido', error: 'Use uma expressão como 2d6+3.' });
  }

  function rollRitual(name, version, expression, effect) {
    const [formula, multiplier] = expression.split('×');
    const result = rollOrdemDamage(formula);
    if (!result) return;
    const title = [name, version, effect].filter(Boolean).join(' · ');
    setRoll({ ...result, title, multiplier, total: result.total * Number(multiplier || 1) });
  }

  const skillSearch = normalizeOrdem(inCombat ? combatSkillQuery.trim() : '');
  const visibleSkills = skills.filter(([name]) => (!trainedOnly || sheet.skills[name]?.rank)
    && normalizeOrdem(name).includes(skillSearch));

  const saveNotice = saveError && <p className="os-error" role="alert">O navegador não salvou as alterações. <button type="button" onClick={() => save(sheets)}>Tentar novamente</button></p>;
  const rollNotice = roll && <div className="os-roll" role="status">
    <strong>{roll.title}</strong>
    {roll.error ? <span>{roll.error}</span> : <>
      <span>Dados {roll.dice.join(', ')}{roll.chosen !== undefined && ` · ${roll.lowest ? 'Menor' : 'Maior'} ${roll.chosen}`} · Bônus {signed(roll.bonus)}{roll.multiplier && ` · ×${roll.multiplier}`}</span>
      <output aria-label="Resultado da rolagem">{roll.total}</output>
    </>}
    <button type="button" aria-label="Fechar resultado" onClick={() => setRoll(null)}>×</button>
  </div>;

  if (visibleSection === 'Salas da Ordem') return <main className="ordem-sheet os-rooms-screen">
    <div className="os-rooms-toolbar">
      <button type="button" onClick={() => setSection(roomsReturn)}>← Voltar à ficha</button>
      {saveNotice}
      {rollNotice}
    </div>
    <OrdemRooms entry={roomsEntry} sheet={sheet} onPatch={patchSheet}
      renderPowers={() => <AgathaPowers sheet={sheet} onChange={value => update('abilities', value)} />}
      renderRituals={() => <div className="os-ritual-panel"><Rituals catalog known={sheet.rituals}
        onChange={value => update('rituals', value)} rollSkill={rollSkill} onRoll={rollRitual}
        dt={10 + sheet.limitePe + sheet.attributes.PRE + (sheet.ritualDtPeBonus ?? 0)} /></div>} />
  </main>;

  const playerCode = sessionStorage.getItem('darkness:jogador');
  const playerHref = backHref !== '/' ? backHref : playerCode ? `/?jogador=${encodeURIComponent(playerCode)}` : '/';

  return <main className={`ordem-sheet os-character-sheet${embeddedId ? ' os-tabletop-sheet' : ''}`} style={ordemThemeStyle(sheet.theme)}>
    <div className="os-shell">
      <header className="os-dossier-header">
        <span className="os-dossier-emblem"><img src="/ordem-ordo-realitas.png" alt="Ordo Realitas" /></span>
        <div className="os-dossier-identity">
          <p className="os-dossier-label">Dossiê pessoal</p>
          <h1>{title}</h1>
          {[sheet.origem, sheet.classe, sheet.trilha, sheet.afinidade].some(Boolean) &&
            <p>{[sheet.origem, sheet.classe, sheet.trilha, sheet.afinidade].filter(Boolean).join(' · ')}</p>}
          {sheet.jogador?.trim() && <small>Interpretado por {sheet.jogador}</small>}
        </div>
        <div className="os-dossier-tools">
        <nav className="os-dossier-rooms" aria-label="Atalhos para as salas">
          <button type="button" onClick={() => openRooms('ivete')}><Icon path={mdiBriefcaseOutline} size={0.95} />Loja da Ivete</button>
          <button type="button" onClick={() => openRooms('agatha')}><Icon path={mdiBookOpenOutline} size={0.95} />Sala da Agatha</button>
          <button type="button" onClick={() => openRooms('transcendencia')}><Icon path={mdiTriangleOutline} size={0.95} />Transcendência</button>
        </nav>
        <div className="os-actions os-dossier-controls">
          {!embeddedId && <>
          <a className="os-dossier-link" href={playerHref}><Icon path={mdiArrowLeft} size={0.75} /> {playerHref === '/' ? 'Entrar como jogador' : 'Página do jogador'}</a>
          <form className="os-actions" onSubmit={joinCampaign}>
            <input name="campanha" defaultValue={new URLSearchParams(window.location.search).get("mesa") || ""} aria-label="Código da campanha" placeholder="Código da campanha" required disabled={joiningCampaign} onChange={() => setCampaignError('')} />
            <button type="submit" disabled={joiningCampaign}><Icon path={mdiDiceD20Outline} size={0.75} />{joiningCampaign ? 'Vinculando…' : 'Tabletop 2D'}</button>
            {campaignError && <p className="os-error" role="alert">{campaignError}</p>}
          </form>
          <select aria-label="Selecionar agente" value={activeId} onChange={event => selectAgent(event.target.value)}>
            {availableSheets.map((item, index) => <option key={item.id} value={item.id}>{item.nome.trim() || `Agente ${index + 1}`}</option>)}
          </select>
          <a className="os-new-agent" href={`/?ordem=1&criar=1${jogadorOrigem ? `&jogadorOrigem=${encodeURIComponent(jogadorOrigem)}` : ''}`}><Icon path={mdiPlus} size={0.7} /> Nova ficha</a>
          </>}
          <button type="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>Modo de edição</button>
        </div>
        </div>
      </header>
      {saveNotice}
      {rollNotice}
      <div className="os-grid">
        <aside className="os-sidebar" aria-label="Dados do agente">
          <section className="os-panel os-identity">
            <div className="os-portrait-resources" data-editing={editing}>
              <div className="os-seal" role="group" aria-label="Atributos">
                <OrdemPortraitTheme theme={sheet.theme} />
                <img className="os-seal-art" src="/ordem-simbolo-retrato.png" alt="" />
                <button type="button" className="os-portrait" disabled={portraitBusy} onClick={() => portraitInput.current?.click()} aria-label="Trocar foto de perfil" title="Trocar foto de perfil">
                  {portrait ? <AnimatedTokenImage key={portrait} className="os-portrait-image" src={portrait} animation={sheet.profileTokenAnimation} alt={`Retrato de ${title}`} />
                    : <span aria-hidden="true">{sheet.nome.trim().slice(0, 2).toUpperCase() || 'OP'}</span>}
                </button>
                {Object.entries(attributes).map(([key, name]) => (
                  <button key={key} type="button" className="os-attribute-badge" data-attribute={key} aria-label={`Rolar ${name}`} title={name}
                    onClick={() => setRoll({ title: name, ...rollOrdemTest(sheet.attributes[key], activeDiceBonus, activeTestBonus) })}>
                    <strong>{sheet.attributes[key]}</strong><small>{key}</small>
                  </button>
                ))}
              </div>
              <div className="os-resource-orbit" role="group" aria-label="Recursos">
                {Object.entries(resources).map(([code, name]) => {
                  const condition = criticalResource[code];
                  const manager = sheet.conditionManager;
                  return <Resource key={`${activeId}:${code}`} code={code} name={name} value={sheet.resources[code]} editing={editing}
                    onChange={value => update('resources', { ...sheet.resources, [code]: value })}
                    rounds={manager?.rounds?.[condition]}
                    onRoundsChange={count => update('conditionManager', { ...manager, rounds: { ...manager?.rounds, [condition]: count } })} />;
                })}
              </div>
            </div>
            <input ref={portraitInput} aria-label="Arquivo do retrato" type="file" accept="image/*" onChange={changePortrait} hidden />
            {portraitBusy && <p role="status">Processando retrato…</p>}
            {portraitError && <p role="alert">{portraitError}</p>}
            <div className="os-identity-meta"><span>NEX <strong>{sheet.nex}%</strong></span><span>Limite de PE <strong>{sheet.limitePe}</strong></span></div>
            {editing && <div className="os-fields">
              {[['nome', 'Nome do agente'], ['jogador', 'Jogador'], ['origem', 'Origem'], ['trilha', 'Trilha']].map(([key, label]) => <TextField key={key} label={label} value={sheet[key]} onChange={value => update(key, value)} />)}
              <label>Classe<select value={sheet.classe} onChange={event => update('classe', event.target.value)}><option value="">Selecionar</option>{['Combatente', 'Especialista', 'Ocultista', 'Mundano'].map(value => <option key={value}>{value}</option>)}</select></label>
              <label>Afinidade<select value={sheet.afinidade} onChange={event => update('afinidade', event.target.value)}><option value="">Sem afinidade</option>{['Sangue', 'Morte', 'Conhecimento', 'Energia'].map(value => <option key={value}>{value}</option>)}</select></label>
              <NumberField label="NEX (%)" max={99} value={sheet.nex} onChange={value => update('nex', value)} />
              <NumberField label="Limite de PE" max={99} value={sheet.limitePe} onChange={value => update('limitePe', value)} />
              {portrait && <label><span>Animar retrato</span><input type="checkbox" checked={sheet.profileTokenAnimation?.enabled !== false}
                onChange={event => update('profileTokenAnimation', { enabled: event.target.checked })} /></label>}
              {portrait && <button type="button" disabled={portraitBusy} onClick={() => {
                setPortraitError('');
                persistPortrait('').catch(() => setPortraitError('Não foi possível remover o retrato.'));
              }}>Remover retrato</button>}
            </div>}
          </section>
          {editing && <section className="os-panel" aria-label="Editar atributos">
            <h2>Editar atributos</h2>
            <div className="os-attributes">
              {Object.entries(attributes).map(([key, name]) => (
                <NumberField key={key} label={name} max={99} value={sheet.attributes[key]} onChange={value => update('attributes', { ...sheet.attributes, [key]: value })} />
              ))}
            </div>
          </section>}
          <section className="os-panel">
            <div className="os-defense-panel" role="group" aria-label="Defesa e reações">
            <div className="os-defense">
              <div className="os-defense-shield"><Icon path={mdiShieldOutline} size={2.75} /><output aria-label="Defesa total">{defense}</output></div>
              <div>
                <h2>Defesa</h2>
                <div className="os-defense-formula">
                  <span title={`Agilidade: ${sheet.attributes.AGI}`}>10 + AGI +</span>
                  <NumberField label="Equip." min={-99} value={defenseEquipment} onChange={value => update('defenseEquipment', value)} />
                  <span aria-hidden="true">+</span>
                  <NumberField label="Outros" min={-99} value={sheet.defenseBonus} onChange={value => update('defenseBonus', value)} />
                </div>
              </div>
            </div>
            <div className="os-reactions">
              <div className="os-reaction os-block" title="Redução de dano contra um ataque corpo a corpo. Exige treino em Fortitude.">
                <span>Bloqueio</span><output aria-label="Bloqueio">{block ?? '—'}</output><small>{block === null ? 'Requer Fortitude' : 'RD · Fortitude'}</small>
              </div>
              <div className="os-reaction os-dodge" title="Defesa contra o ataque ao esquivar. Exige treino em Reflexos.">
                <span>Esquiva</span><output aria-label="Esquiva">{dodge ?? '—'}</output><small>{dodge === null ? 'Requer Reflexos' : 'Defesa + Reflexos'}</small>
              </div>
            </div>
            </div>
            <div className="os-combat-facts">
              {editing ? <NumberField label="Deslocamento (m)" value={sheet.displacement} onChange={value => update('displacement', value)} />
                : <span>Deslocamento <strong>{sheet.displacement} m</strong></span>}
            </div>
          </section>
          <Conditions key={activeId} manager={sheet.conditionManager} notes={sheet.conditions}
            onChange={value => update('conditionManager', value)} onNotesChange={value => update('conditions', value)} />
        </aside>
        <div className="os-workspace">
          <nav className="os-nav os-main-nav" aria-label="Áreas da ficha">
            {sections.map(([name, icon]) => <button type="button" key={name} aria-pressed={section === name} onClick={() => setSection(name)}><Icon path={icon} size={0.7} />{name}</button>)}
          </nav>
          <div className="os-workbench" data-overview={isOverview}>
            {isOverview && <section className="os-panel os-pericias" aria-label="Perícias">
              <div className="os-work-heading">
                <div><h2>Perícias</h2><p>{Object.values(sheet.skills).filter(skill => skill.rank).length} treinadas</p></div>
              </div>
              <div className="os-skill-filter">
                <div className="os-nav" aria-label="Filtrar perícias">
                  <button type="button" aria-pressed={!trainedOnly} onClick={() => setTrainedOnly(false)}>Todas</button>
                  <button type="button" aria-pressed={trainedOnly} onClick={() => setTrainedOnly(true)}>Só treinadas</button>
                </div>
              </div>
              <div className="os-skills" role="region" aria-label="Lista de perícias">
                {visibleSkills.map(([name, attribute]) => {
                  const { rank = 0, extra = 0 } = sheet.skills[name] || {};
                  const updateSkill = change => update('skills', { ...sheet.skills, [name]: { rank, extra, ...change } });
                  return <div className="os-skill" key={name} data-trained={rank > 0}>
                    <button type="button" aria-label={`Rolar ${name}`} title={`${sheet.attributes[attribute] || 2}d20${!sheet.attributes[attribute] ? ' (menor)' : ''}`} onClick={() => rollSkill(name)}><Icon path={mdiDiceD20Outline} size={0.72} /><strong>{name}</strong></button>
                    <span>({attribute})</span>
                    <output aria-label={`Bônus total de ${name}`}>({rank + extra})</output>
                    <label><span>Treino</span><select aria-label={`Treinamento em ${name}`} title={grades[rank / 5]} value={rank} onChange={event => updateSkill({ rank: Number(event.target.value) })}>
                      {grades.map((grade, index) => <option key={grade} value={index * 5} aria-label={`${grade} · +${index * 5}`}>{index * 5}</option>)}
                    </select></label>
                    <NumberField label={`Extra em ${name}`} caption="Extra" value={extra} min={-99} max={99} onChange={value => updateSkill({ extra: value })} />
                  </div>;
                })}
                {!visibleSkills.length && <p className="os-muted">Nenhuma perícia corresponde aos filtros.</p>}
              </div>
            </section>}
          <div className="os-overview-pane">
          {isOverview && <nav className="os-nav os-overview-nav" aria-label="Subabas da visão geral">
            {overviewSections.map(([name, icon]) => (
              <button type="button" key={name} aria-pressed={overviewSection === name} onClick={() => setOverviewSection(name)}>
                <Icon path={icon} size={0.7} />{name}
              </button>
            ))}
          </nav>}
          <section className={`os-panel os-content${visibleSection === 'Rituais' ? ' os-ritual-panel' : ''}`} aria-label={visibleSection === 'Rituais' ? 'Rituais do agente' : visibleSection}>
            {visibleSection === 'Personalização' && <OrdemThemes theme={sheet.theme} onChange={value => update('theme', value)} />}
            {visibleSection === 'Combate' && <>
              <div className="os-work-heading"><h2>Combate</h2><button type="button" onClick={() => rollSkill('Iniciativa')}><Icon path={mdiDiceD20Outline} size={0.75} />Rolar iniciativa</button></div>
              <fieldset className="os-combat-test-bonuses">
                <legend>Modificadores de teste</legend>
                <NumberField label="Dados extras" value={diceBonus} min={-20} max={20} onChange={setDiceBonus} />
                <NumberField label="Bônus no teste" value={testBonus} min={-99} max={99} onChange={setTestBonus} />
              </fieldset>
              <label>Buscar perícia<input type="search" value={combatSkillQuery} onChange={event => setCombatSkillQuery(event.target.value)} /></label>
              <h3 className="os-attack-title">Ataques</h3>
              <Entries type="Ataque" entries={sheet.attacks} onChange={value => update('attacks', value)} rollSkill={rollSkill} showDamage={showDamage} />
            </>}
            {visibleSection === 'Rituais' && <Rituals key={activeId} known={sheet.rituals} onChange={value => update('rituals', value)} onOpenCatalog={() => openRooms('agatha', 'Rituais')} rollSkill={rollSkill} onRoll={rollRitual} dt={10 + sheet.limitePe + sheet.attributes.PRE + (sheet.ritualDtPeBonus ?? 0)} />}
            {visibleSection === 'Inventário' && <><div className="os-work-heading"><h2>Inventário</h2><button type="button" onClick={() => openRooms('ivete')}>Visitar Ivete</button></div><Entries type="Item" entries={sheet.inventory} onChange={value => update('inventory', value)} /></>}
            {visibleSection === 'Anotações' && <>
              <h2>Anotações</h2>
              <div className="os-notes">
                <label>Pistas e histórico<textarea rows={5} value={sheet.notes} onChange={event => update('notes', event.target.value)} /></label>
              </div>
            </>}
            {visibleSection === 'Habilidades' && <Powers key={activeId} sheet={sheet} onChange={value => update('abilities', value)} onOpenCatalog={() => openRooms()} />}
          </section>
          </div>
          </div>
        </div>
      </div>
      <footer className="os-footer"><Icon path={mdiBookOpenOutline} size={0.75} /> Ordem Paranormal RPG · Livro de regras v1.3</footer>
    </div>
  </main>;
}
