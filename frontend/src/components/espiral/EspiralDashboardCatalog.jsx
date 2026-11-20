import { saveWeapon, useDarknessWeaponCatalog } from '../../utils/darknessWeaponCatalog';
import { darknessAbilityName } from '../../utils/darknessAbilityName';
import { consolidarOfensivasAdquiridas } from '../../data/ofensivasConsolidadas';
import { espiralDiceText } from '../../utils/espiralDice';
import { HABILIDADES_DARKNESS_ADAPTADAS, CLASSES_HABILIDADES_DARKNESS } from '../../data/habilidadesDarkness';
import React, { useMemo, useState } from 'react';
import { CATEGORIAS_ESPIRAL } from '../../data/catalogoEspiral';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from '../../data/habilidadesEspiral';
import { VERTENTE_HABILIDADES } from '../../data/espiral';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function EspiralDashboardCatalog({ kind, fichas = [], onGrant, darkness = false }) {
  const abilities = kind === 'abilities';
  const weaponCatalog = useDarknessWeaponCatalog();
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [weaponError, setWeaponError] = useState('');
  const saveEditedWeapon = event => {
    event.preventDefault();
    try { saveWeapon(editingWeapon); setEditingWeapon(null); setWeaponError(''); setNotice('Arma salva neste navegador. As próximas entregas usarão as informações atualizadas.'); }
    catch (error) { setWeaponError(error.message); }
  };
  const [category, setCategory] = useState(abilities ? 'Ofensiva' : 'armas');
  const [weaponGroup, setWeaponGroup] = useState('brancas');
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const [initialAmmo,setInitialAmmo] = useState({});
  const categories = abilities
    ? [...(darkness ? CLASSES_HABILIDADES_DARKNESS : Object.keys(HABILIDADES_ESPIRAL)).map(name => ({ id: name, nome: name })), { id: 'vertentes', nome: 'Vertentes' }]
    : CATEGORIAS_ESPIRAL;
  const entries = useMemo(() => {
    const source = !abilities ? weaponCatalog.filter(item => item.category === category && (category !== 'armas' || item.weaponGroup === weaponGroup))
      : category === 'vertentes' ? Object.entries(VERTENTE_HABILIDADES).map(([vertente, entry]) => ({ id: vertente, name: entry.nome, category: vertente, levels: entry.niveis, type: 'vertente' }))
        : darkness ? HABILIDADES_DARKNESS_ADAPTADAS.filter(entry => entry.category === category).map(entry => ({ ...entry, type: 'ability' })) : (HABILIDADES_ESPIRAL[category] || []).map(([name, action, detail]) => ({ id: `${category}:${name}`, name, action, detail, category, levels: APRIMORAMENTOS_HABILIDADES_ESPIRAL[name] || [detail], hope: CUSTOS_ESPERANCA_HABILIDADES[name] || [0, 0], type: 'ability' }));
    return source.filter(entry => normalize([entry.name, entry.detail, entry.category, ...(entry.levels || [])].join(' ')).includes(normalize(query.trim())));
  }, [abilities, category, weaponGroup, query, darkness, weaponCatalog]);
  const selectedFicha = fichas.find(ficha => ficha.fichaId === recipient);
  const grant = async (entry) => {
    if (!selectedFicha) return;
    try {
      const delivered = entry.type==='weapon' && entry.weaponGroup==='fogo' ? {...entry,ammo:Math.max(0,Math.min(9999,Math.floor(Number(initialAmmo[entry.id]) || 0)))} : entry;
      if (await onGrant(selectedFicha, delivered) !== false) setNotice(`${abilities ? darknessAbilityName(entry.name) : entry.name} concedido a ${selectedFicha.personagem?.name || 'personagem'}${delivered.ammo!==undefined ? ` com ${delivered.ammo} balas` : ''}.`);
      else setNotice('Não foi possível salvar. Atualize o Dashboard e tente novamente.');
    } catch {
      setNotice('Não foi possível salvar. Atualize o Dashboard e tente novamente.');
    }
  };
  return <section className="mestre-loja ed-catalog">
    <div className="ed-section-heading"><div><span className="ed-eyebrow">{abilities ? '05 / TRANSFORMAÇÃO' : '04 / SUPRIMENTOS DE CAMPO'}</span><h2>{abilities ? (darkness ? 'Habilidades Darkness' : 'Habilidades ESPIRAL') : (darkness ? 'Equipamentos de campo' : 'Acervo ESPIRAL')}</h2><p>{abilities ? 'Consulte ações, custos de Esperança e aprimoramentos de cada habilidade.' : 'Armas, proteções e equipamentos para preparar sua próxima sessão.'}</p></div></div>
    <nav className="mestre-ficha-tabs ed-catalog-tabs" aria-label={abilities ? 'Categorias de habilidades ESPIRAL' : 'Categorias do acervo ESPIRAL'}>{categories.map(entry => <button key={entry.id} type="button" className={category === entry.id ? 'ativa' : ''} aria-pressed={category === entry.id} onClick={() => { setCategory(entry.id); setQuery(''); }}>{entry.nome}</button>)}</nav>
    {!abilities && category === 'armas' && <nav className="mestre-ficha-tabs" aria-label="Tipos de armas ESPIRAL">{[['brancas', 'Armas brancas'], ['fogo', 'Armas de fogo']].map(([id, name]) => <button key={id} type="button" className={weaponGroup === id ? 'ativa' : ''} aria-pressed={weaponGroup === id} onClick={() => setWeaponGroup(id)}>{name}</button>)}</nav>}
    <div className="ed-catalog-tools"><label>Buscar no catálogo<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={abilities ? 'Nome ou efeito da habilidade' : 'Nome ou efeito do item'} /></label>{category !== 'vertentes' && <label>{darkness ? "Conceder a um personagem" : "Conceder a uma ficha local"}<select value={recipient} onChange={event => setRecipient(event.target.value)}><option value="">Selecione um personagem</option>{fichas.map(ficha => <option key={ficha.fichaId} value={ficha.fichaId}>{ficha.personagem?.name || 'Sem nome'} · {ficha.espiralId}</option>)}</select></label>}</div>
    <p className="ed-catalog-note">{category === 'vertentes' ? 'A habilidade de Vertente acompanha a Vertente do personagem.' : abilities ? 'Concessões do Mestre registram a habilidade no Nível I sem consumir pontos de evolução.' : 'Concessões do Mestre incorporam o item ao inventário da ficha selecionada.'}</p>
    {editingWeapon && <form className="dm-weapon-editor" onSubmit={saveEditedWeapon} aria-label="Editar arma Darkness">
      <h3>Editar arma Darkness</h3><p>Alterações salvas neste navegador. Armas já entregues mantêm os dados da entrega.</p>
      <label>Nome da arma<input required value={editingWeapon.name} onChange={event => setEditingWeapon({ ...editingWeapon, name: event.target.value })}/></label>
      <label>Dano da arma<input required placeholder="2d6" value={editingWeapon.damage} onChange={event => setEditingWeapon({ ...editingWeapon, damage: event.target.value })}/></label>
      <label>Tipo da arma<select value={editingWeapon.weaponGroup} onChange={event => setEditingWeapon({ ...editingWeapon, weaponGroup: event.target.value })}><option value="brancas">Arma branca</option><option value="fogo">Arma de fogo</option></select></label>
      <label>Descrição e propriedades<textarea rows={4} value={editingWeapon.detail} onChange={event => setEditingWeapon({ ...editingWeapon, detail: event.target.value })}/></label>
      {weaponError && <p role="alert">{weaponError}</p>}
      <div><button type="submit">Salvar arma</button><button type="button" onClick={() => { setEditingWeapon(null); setWeaponError(''); }}>Cancelar</button></div>
    </form>}
    {notice && <p className="ed-catalog-notice" role="status">{notice}</p>}
    <div className="ed-catalog-count">{entries.length} registros disponíveis</div>
    <div className="ed-catalog-grid">{entries.map(entry => {
      const owned = entry.type === 'ability' && consolidarOfensivasAdquiridas(selectedFicha?.personagem?.evolution?.abilities || []).some(item => item.id === entry.id);
      return <article className="ed-catalog-card" key={entry.id}>
        <span className="ed-eyebrow">{abilities ? `${entry.category}${entry.action ? ` · Ação ${entry.action}` : ''}` : categories.find(item => item.id === entry.category)?.nome}</span><h3>{abilities ? darknessAbilityName(entry.name) : entry.name}</h3>
        {!abilities && <><div className="ed-catalog-facts">{entry.damage && <span>Dano <b>{espiralDiceText(entry.damage)}</b></span>}{entry.value !== undefined && <span>Proteção <b>{entry.value}</b></span>}{entry.region && <span>Região <b>{entry.region}</b></span>}</div><p>{entry.detail}</p></>}
        {abilities && <>{entry.hope && <p className="ed-catalog-hope">Esperança: {entry.hope[0] ? `${entry.hope[0]} no Fracasso / ${entry.hope[1]} no Sucesso com Consequência` : 'sem custo'}</p>}<ol className="ed-catalog-levels">{entry.levels.map((level, index) => <li key={index}><b>Nível {['I', 'II', 'III'][index]}</b><p>{level}</p></li>)}</ol></>}
        {entry.type==='weapon' && entry.weaponGroup==='fogo' && <label>Balas na entrega<input type="number" min="0" max="9999" step="1" aria-label={`Balas na entrega de ${abilities ? darknessAbilityName(entry.name) : entry.name}`} value={initialAmmo[entry.id] ?? 0} onChange={event=>setInitialAmmo(current=>({...current,[entry.id]:event.target.value}))}/></label>}
        {darkness && entry.type === 'weapon' && <button type="button" onClick={() => { setEditingWeapon({ ...entry }); setWeaponError(''); }} aria-label={'Editar arma: ' + entry.name}>Editar arma</button>}
        {entry.type !== 'vertente' && <button type="button" className="ed-catalog-grant" disabled={!selectedFicha || owned} onClick={() => grant(entry)} aria-label={`${owned ? 'Já concedida' : 'Conceder'}: ${abilities ? darknessAbilityName(entry.name) : entry.name}`}>{owned ? 'Já adquirida' : abilities ? 'Conceder habilidade ↗' : 'Dar item ↗'}</button>}
      </article>;
    })}</div>
    {!entries.length && <div className="mestre-vazio"><p>Nenhum registro encontrado.</p><button type="button" onClick={() => setQuery('')}>Limpar busca</button></div>}
  </section>;
}
