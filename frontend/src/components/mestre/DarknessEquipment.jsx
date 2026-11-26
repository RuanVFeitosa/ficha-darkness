import ProtocolLogo from '../ui/ProtocolLogo';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@mdi/react';
import { mdiSword, mdiShieldOutline, mdiBagPersonalOutline, mdiMagnify, mdiPencilOutline, mdiArrowRight, mdiClose, mdiPackageVariantClosed } from '@mdi/js';
import { CATEGORIAS_ESPIRAL } from '../../data/catalogoEspiral';
import { saveEquipment, useDarknessWeaponCatalog } from '../../utils/darknessWeaponCatalog';
import { espiralDiceText } from '../../utils/espiralDice';
import '../../styles/DarknessEquipment.css';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const sheetName = ficha => ficha.personagem?.name || ficha.personagem?.nome || 'Sem nome';
const sheetCode = ficha => ficha.espiralId || ficha.fichaId || '';
const categoryName = id => CATEGORIAS_ESPIRAL.find(category => category.id === id)?.nome || id;
const iconFor = item => item.type === 'weapon' ? mdiSword : item.type === 'protection' ? mdiShieldOutline : mdiBagPersonalOutline;

export function EquipmentDialog({ title, children, onClose, busy }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const keyboard = event => {
    if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = [...panel.current.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(node => !node.disabled);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first?.focus(); }
  };
  return createPortal(<div className="de-overlay" onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="de-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel} onKeyDown={keyboard}>
      <header><div><span className="de-kicker"><ProtocolLogo /> / ACERVO DO MESTRE</span><h2>{title}</h2></div><button type="button" className="de-icon-button" aria-label="Fechar" onClick={onClose} disabled={busy}><Icon path={mdiClose} size={1}/></button></header>{children}
    </section>
  </div>, document.body);
}

export default function DarknessEquipment({ fichas = [], onGrant, readOnly = false }) {
  const catalog = useDarknessWeaponCatalog();
  const [category, setCategory] = useState('todos');
  const [group, setGroup] = useState('todos');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [ammo, setAmmo] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const entries = catalog.filter(entry => (category === 'todos' || entry.category === category) && (category !== 'armas' || group === 'todos' || entry.weaponGroup === group) && normalize(`${entry.name} ${entry.detail} ${categoryName(entry.category)}`).includes(normalize(query.trim())));
  const recipients = fichas.filter(ficha => normalize(`${sheetName(ficha)} ${sheetCode(ficha)} ${ficha.personagem?.player || ''}`).includes(normalize(recipientQuery.trim())));
  const selected = fichas.find(ficha => ficha.fichaId === recipient);
  const close = () => { if (!inFlight.current) { setDelivery(null); setEditing(null); setError(''); } };
  const save = event => {
    event.preventDefault();
    try { saveEquipment(editing); setNotice(`${editing.name.trim()}: alterações salvas neste navegador.`); setEditing(null); setError(''); }
    catch (failure) { setError(failure.message); }
  };
  const deliver = async event => {
    event.preventDefault();
    if (!selected || !delivery || inFlight.current) return;
    const amount = Number(quantity), bullets = Number(ammo);
    if (delivery.type === 'item' && (!Number.isInteger(amount) || amount < 1 || amount > 99)) { setError('Escolha uma quantidade entre 1 e 99.'); return; }
    if (delivery.weaponGroup === 'fogo' && (!Number.isInteger(bullets) || bullets < 0 || bullets > 9999)) { setError('Informe de 0 a 9999 balas.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try {
      const entry = { ...delivery, ...(delivery.type === 'item' ? { quantity: amount } : {}), ...(delivery.weaponGroup === 'fogo' ? { ammo: bullets } : {}) };
      if (await onGrant(selected, entry) === false) throw new Error('Não foi possível salvar a entrega. Tente novamente.');
      setNotice(`${delivery.type === 'item' ? `${amount} × ` : ''}${delivery.name} entregue a ${sheetName(selected)}.`);
      setDelivery(null);
    } catch (failure) { setError(failure.message || 'Não foi possível salvar a entrega. Tente novamente.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="de-equipment" aria-label="Equipamentos Darkness">
    <header className="de-heading"><div><span className="de-kicker">04 / LOGÍSTICA DA SESSÃO</span><h2>Prepare o próximo capítulo.</h2><p>{readOnly ? 'Consulte os equipamentos de Darkness.' : 'Encontre, personalize e entregue os equipamentos da sua mesa.'}</p></div><div className="de-total"><Icon path={mdiPackageVariantClosed} size={1.3}/><strong>{catalog.length}</strong><span>equipamentos<br/>no acervo</span></div></header>
    <div className="de-workspace"><aside className="de-sidebar"><span className="de-kicker">EXPLORAR ACERVO</span><nav aria-label="Categorias de equipamentos">{[{ id: 'todos', nome: 'Todos os equipamentos' }, ...CATEGORIAS_ESPIRAL].map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setGroup('todos'); }}><span>{item.nome}</span><small>{item.id === 'todos' ? catalog.length : catalog.filter(entry => entry.category === item.id).length}</small></button>)}</nav>{!readOnly && <div className="de-sidebar-note"><Icon path={mdiPencilOutline} size={.8}/><p>Seu acervo, suas regras.<br/><span>Edite qualquer equipamento antes de entregá-lo.</span></p></div>}</aside>
      <div className="de-main"><div className="de-toolbar"><label className="de-search"><Icon path={mdiMagnify} size={1}/><input type="search" aria-label="Buscar equipamentos" placeholder="Buscar nome, descrição ou categoria…" value={query} onChange={event => setQuery(event.target.value)}/></label><span>{entries.length} {entries.length === 1 ? 'resultado' : 'resultados'}</span></div>
        {category === 'armas' && <nav className="de-groups" aria-label="Tipos de armas">{[['todos', 'Todas as armas'], ['brancas', 'Armas brancas'], ['fogo', 'Armas de fogo']].map(([id, label]) => <button type="button" key={id} aria-pressed={group === id} onClick={() => setGroup(id)}>{label}</button>)}</nav>}
        {notice && <p className="de-notice" role="status">✓ {notice}</p>}
        <div className="de-cards">{entries.map(entry => <article className="de-card" key={entry.id}><div className="de-card-top"><span className="de-item-icon"><Icon path={iconFor(entry)} size={1.2}/></span><span>{categoryName(entry.category)}</span>{!readOnly && <button className="de-icon-button" type="button" aria-label={`Editar equipamento: ${entry.name}`} onClick={() => { setEditing({ ...entry }); setError(''); }}><Icon path={mdiPencilOutline} size={.85}/></button>}</div><h3>{entry.name}</h3><div className="de-facts">{entry.type === 'weapon' && <><span>DANO <b>{espiralDiceText(entry.damage)}</b></span><span>TIPO <b>{entry.weaponGroup === 'fogo' ? 'Arma de fogo' : 'Arma branca'}</b></span></>}{entry.type === 'protection' && <><span>PROTEÇÃO <b>{entry.value}</b></span><span>REGIÃO <b>{entry.region || 'Não informada'}</b></span></>}{entry.type === 'item' && <span>USO <b>Equipamento de campo</b></span>}</div><p className="de-description">{entry.detail || 'Sem descrição. Personalize este equipamento para a sua mesa.'}</p>{!readOnly && <footer><button type="button" className="de-edit" onClick={() => { setEditing({ ...entry }); setError(''); }}>Editar informações</button><button type="button" className="de-primary" onClick={() => { setDelivery({ ...entry }); setAmmo('0'); setQuantity('1'); setRecipientQuery(''); setError(''); }}>Entregar <Icon path={mdiArrowRight} size={.8}/></button></footer>}</article>)}</div>
        {!entries.length && <div className="de-empty"><Icon path={mdiMagnify} size={2}/><h3>Nenhum equipamento encontrado.</h3><p>Tente outro nome ou explore as outras categorias.</p><button type="button" onClick={() => { setQuery(''); setCategory('todos'); setGroup('todos'); }}>Limpar filtros</button></div>}
      </div>
    </div>
    {editing && <EquipmentDialog title="Editar equipamento" onClose={close}><form onSubmit={save} className="de-form"><div className="de-context"><Icon path={iconFor(editing)} size={1}/><span>{categoryName(editing.category)}</span></div><label>Nome do equipamento<input required value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })}/></label>
      {editing.type === 'weapon' && <div className="de-form-row"><label>Dano<input required value={editing.damage} placeholder="2d6 ou 1d8+2" onChange={event => setEditing({ ...editing, damage: event.target.value })}/></label><label>Tipo de arma<select value={editing.weaponGroup} onChange={event => setEditing({ ...editing, weaponGroup: event.target.value })}><option value="brancas">Arma branca</option><option value="fogo">Arma de fogo</option></select></label></div>}
      {editing.type === 'protection' && <div className="de-form-row"><label>Valor de proteção<input type="number" required min="0" step="1" value={editing.value} onChange={event => setEditing({ ...editing, value: event.target.value })}/></label><label>Regiões protegidas<input value={editing.region} onChange={event => setEditing({ ...editing, region: event.target.value })}/></label></div>}
      <label>Descrição e propriedades<textarea rows={6} value={editing.detail} onChange={event => setEditing({ ...editing, detail: event.target.value })}/></label><p className="de-help">Salvo neste navegador e aplicado às próximas entregas e à loja local. Equipamentos já entregues mantêm suas informações.</p>{error && <p role="alert" className="de-error">{error}</p>}<footer className="de-dialog-actions"><button type="button" onClick={close}>Cancelar</button><button type="submit" className="de-primary">Salvar alterações</button></footer></form></EquipmentDialog>}
    {delivery && <EquipmentDialog title="Entregar equipamento" onClose={close} busy={busy}><form onSubmit={deliver} className="de-form"><div className="de-delivery-item"><Icon path={iconFor(delivery)} size={1.5}/><div><small>{categoryName(delivery.category)}</small><h3>{delivery.name}</h3><p>{delivery.damage ? espiralDiceText(delivery.damage) : delivery.type === 'protection' ? `Proteção ${delivery.value} · ${delivery.region}` : delivery.detail}</p></div></div><label>Buscar personagem<input type="search" value={recipientQuery} onChange={event => setRecipientQuery(event.target.value)} placeholder="Nome, jogador ou código da ficha" disabled={busy}/></label><div className="de-recipients" role="group" aria-label="Destinatário da entrega">{recipients.map(ficha => <button type="button" key={ficha.fichaId} aria-pressed={recipient === ficha.fichaId} disabled={busy} onClick={() => setRecipient(ficha.fichaId)}><span className="de-avatar">{sheetName(ficha).slice(0, 1)}</span><span><strong>{sheetName(ficha)}</strong><small>{ficha.personagem?.player || 'Jogador não informado'} · {sheetCode(ficha)}</small></span><span className="de-check">{recipient === ficha.fichaId ? '✓' : '○'}</span></button>)}{!recipients.length && <p>{fichas.length ? 'Nenhum personagem corresponde à busca.' : 'Nenhuma ficha disponível para entrega.'}</p>}</div>
      {delivery.type === 'item' && <label>Quantidade<input type="number" min="1" max="99" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)} disabled={busy}/></label>}{delivery.weaponGroup === 'fogo' && <label>Balas na entrega<input type="number" min="0" max="9999" step="1" required value={ammo} onChange={event => setAmmo(event.target.value)} disabled={busy}/></label>}
      <div className="de-confirmation">{selected ? <><small>DESTINATÁRIO SELECIONADO</small><strong>{sheetName(selected)} <span>· {sheetCode(selected)}</span></strong><p>O equipamento será adicionado ao inventário desta ficha.</p></> : <p>Selecione o personagem que receberá este equipamento.</p>}</div>{error && <p className="de-error" role="alert">{error}</p>}<footer className="de-dialog-actions"><button type="button" onClick={close} disabled={busy}>Cancelar</button><button type="submit" className="de-primary" disabled={!selected || busy}>{busy ? 'Entregando…' : 'Confirmar entrega'}</button></footer></form></EquipmentDialog>}
  </section>;
}
