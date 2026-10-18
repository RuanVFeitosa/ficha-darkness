import { espiralDiceText } from '../../utils/espiralDice';
import React, { useMemo, useState } from 'react';
import { CATALOGO_ESPIRAL, CATEGORIAS_ESPIRAL } from '../../data/catalogoEspiral';
import { HABILIDADES_ESPIRAL, APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES } from '../../data/habilidadesEspiral';
import { VERTENTE_HABILIDADES } from '../../data/espiral';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function EspiralDashboardCatalog({ kind, fichas = [], onGrant }) {
  const abilities = kind === 'abilities';
  const [category, setCategory] = useState(abilities ? 'Ofensiva' : 'armas');
  const [weaponGroup, setWeaponGroup] = useState('brancas');
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const categories = abilities
    ? [...Object.keys(HABILIDADES_ESPIRAL).map(name => ({ id: name, nome: name })), { id: 'vertentes', nome: 'Vertentes' }]
    : CATEGORIAS_ESPIRAL;
  const entries = useMemo(() => {
    const source = !abilities ? CATALOGO_ESPIRAL.filter(item => item.category === category && (category !== 'armas' || item.weaponGroup === weaponGroup))
      : category === 'vertentes' ? Object.entries(VERTENTE_HABILIDADES).map(([vertente, entry]) => ({ id: vertente, name: entry.nome, category: vertente, levels: entry.niveis, type: 'vertente' }))
        : (HABILIDADES_ESPIRAL[category] || []).map(([name, action, detail]) => ({ id: `${category}:${name}`, name, action, detail, category, levels: APRIMORAMENTOS_HABILIDADES_ESPIRAL[name] || [detail], hope: CUSTOS_ESPERANCA_HABILIDADES[name] || [0, 0], type: 'ability' }));
    return source.filter(entry => normalize([entry.name, entry.detail, entry.category, ...(entry.levels || [])].join(' ')).includes(normalize(query.trim())));
  }, [abilities, category, weaponGroup, query]);
  const selectedFicha = fichas.find(ficha => ficha.fichaId === recipient);
  const grant = (entry) => {
    if (!selectedFicha) return;
    try {
      if (onGrant(selectedFicha, entry) !== false) setNotice(`${entry.name} concedido a ${selectedFicha.personagem?.name || 'personagem'}.`);
      else setNotice('Não foi possível salvar. Atualize o Dashboard e tente novamente.');
    } catch {
      setNotice('Não foi possível salvar. Atualize o Dashboard e tente novamente.');
    }
  };
  return <section className="mestre-loja ed-catalog">
    <div className="ed-section-heading"><div><span className="ed-eyebrow">{abilities ? '05 / TRANSFORMAÇÃO' : '04 / SUPRIMENTOS DE CAMPO'}</span><h2>{abilities ? 'Habilidades ESPIRAL' : 'Acervo ESPIRAL'}</h2><p>{abilities ? 'Consulte ações, custos de Esperança e aprimoramentos de cada habilidade.' : 'Armas, proteções e equipamentos do terminal de suprimentos ESPIRAL.'}</p></div></div>
    <nav className="mestre-ficha-tabs ed-catalog-tabs" aria-label={abilities ? 'Categorias de habilidades ESPIRAL' : 'Categorias do acervo ESPIRAL'}>{categories.map(entry => <button key={entry.id} type="button" className={category === entry.id ? 'ativa' : ''} aria-pressed={category === entry.id} onClick={() => { setCategory(entry.id); setQuery(''); }}>{entry.nome}</button>)}</nav>
    {!abilities && category === 'armas' && <nav className="mestre-ficha-tabs" aria-label="Tipos de armas ESPIRAL">{[['brancas', 'Armas brancas'], ['fogo', 'Armas de fogo']].map(([id, name]) => <button key={id} type="button" className={weaponGroup === id ? 'ativa' : ''} aria-pressed={weaponGroup === id} onClick={() => setWeaponGroup(id)}>{name}</button>)}</nav>}
    <div className="ed-catalog-tools"><label>Buscar no catálogo<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={abilities ? 'Nome ou efeito da habilidade' : 'Nome ou efeito do item'} /></label>{category !== 'vertentes' && <label>Conceder a uma ficha local<select value={recipient} onChange={event => setRecipient(event.target.value)}><option value="">Selecione um personagem</option>{fichas.map(ficha => <option key={ficha.fichaId} value={ficha.fichaId}>{ficha.personagem?.name || 'Sem nome'} · {ficha.espiralId}</option>)}</select></label>}</div>
    <p className="ed-catalog-note">{category === 'vertentes' ? 'A habilidade de Vertente acompanha a Vertente do personagem.' : abilities ? 'Concessões do Mestre registram a habilidade no Nível I sem consumir pontos de evolução.' : 'Concessões do Mestre incorporam o item ao inventário da ficha selecionada.'}</p>
    {notice && <p className="ed-catalog-notice" role="status">{notice}</p>}
    <div className="ed-catalog-count">{entries.length} registros disponíveis</div>
    <div className="ed-catalog-grid">{entries.map(entry => {
      const owned = entry.type === 'ability' && (selectedFicha?.personagem?.evolution?.abilities || []).some(item => item.id === entry.id);
      return <article className="ed-catalog-card" key={entry.id}>
        <span className="ed-eyebrow">{abilities ? `${entry.category}${entry.action ? ` · Ação ${entry.action}` : ''}` : categories.find(item => item.id === entry.category)?.nome}</span><h3>{entry.name}</h3>
        {!abilities && <><div className="ed-catalog-facts">{entry.damage && <span>Dano <b>{espiralDiceText(entry.damage)}</b></span>}{entry.value !== undefined && <span>Proteção <b>{entry.value}</b></span>}{entry.region && <span>Região <b>{entry.region}</b></span>}</div><p>{entry.detail}</p></>}
        {abilities && <>{entry.hope && <p className="ed-catalog-hope">Esperança: {entry.hope[0] ? `${entry.hope[0]} no Fracasso / ${entry.hope[1]} no Sucesso com Consequência` : 'sem custo'}</p>}<ol className="ed-catalog-levels">{entry.levels.map((level, index) => <li key={index}><b>Nível {['I', 'II', 'III'][index]}</b><p>{level}</p></li>)}</ol></>}
        {entry.type !== 'vertente' && <button type="button" className="ed-catalog-grant" disabled={!selectedFicha || owned} onClick={() => grant(entry)} aria-label={`${owned ? 'Já concedida' : 'Conceder'}: ${entry.name}`}>{owned ? 'Já adquirida' : abilities ? 'Conceder habilidade ↗' : 'Dar item ↗'}</button>}
      </article>;
    })}</div>
    {!entries.length && <div className="mestre-vazio"><p>Nenhum registro encontrado.</p><button type="button" onClick={() => setQuery('')}>Limpar busca</button></div>}
  </section>;
}
