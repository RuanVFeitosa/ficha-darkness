import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EquipmentDialog } from './DarknessEquipment';
import { loadRulebook, saveRulebook, searchRulebook } from '../../services/darknessRulebook';
import '../../styles/DarknessRulebook.css';

export default function DarknessRulebook({ readOnly = false } = {}) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [backup, setBackup] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    loadRulebook().then(value => {
      if (active) { setBook(value); setSelectedId(value.sections[0]?.id || ''); }
    }).catch(failure => { if (active) setError(failure.message || 'Não foi possível carregar o livro.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadAttempt]);
  const sections = useMemo(() => book?.sections || [], [book]);
  const filtered = useMemo(() => searchRulebook(sections, query), [sections, query]);
  const chapters = useMemo(() => [...new Set(sections.map(section => section.chapter))], [sections]);
  const visibleChapters = useMemo(() => [...new Set(filtered.map(section => section.chapter))], [filtered]);
  const selected = filtered.find(section => section.id === selectedId) || filtered[0];
  const headings = useMemo(() => [...(selected?.content || '').matchAll(/^#{2,3} (.+)$/gm)].map(match => ({ title: match[1], id: `rule-heading-${match.index}` })), [selected]);
  const pageReference = section => section.sourceEndPage > section.sourcePage ? `pp. ${section.sourcePage}–${section.sourceEndPage}` : `p. ${section.sourcePage}`;
  const index = selected ? sections.findIndex(section => section.id === selected.id) : -1;
  const navigate = id => { setSelectedId(id); document.getElementById('rulebook-reader')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); };
  const persist = async (next, message) => {
    setBusy(true); setError('');
    try { const saved = await saveRulebook(next); setBook(saved); setNotice(message); return true; }
    catch (failure) { setError(failure.message || 'Não foi possível salvar. Seu texto continua aberto.'); return false; }
    finally { setBusy(false); }
  };
  const submit = async event => {
    event.preventDefault();
    if (busy || !draft) return;
    const value = { ...draft, title: draft.title.trim(), chapter: draft.chapter.trim(), content: draft.content.trim() };
    const next = sections.some(section => section.id === value.id) ? sections.map(section => section.id === value.id ? value : section) : [...sections, value];
    if (await persist({ ...book, sections: next }, 'Seção salva neste navegador.')) { setDraft(null); setQuery(''); setSelectedId(value.id); }
  };
  const remove = async () => {
    if (busy || !deleting) return;
    if (await persist({ ...book, sections: sections.filter(section => section.id !== deleting.id) }, 'Seção removida. Você pode desfazer a exclusão.')) {
      setBackup({ section: deleting, index: sections.findIndex(section => section.id === deleting.id) }); setDeleting(null);
    }
  };
  const undo = async () => {
    const restored = [...sections]; restored.splice(backup.index, 0, backup.section);
    if (await persist({ ...book, sections: restored }, 'Seção restaurada.')) { setSelectedId(backup.section.id); setBackup(null); }
  };
  const exportBook = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'darkness-livro-de-regras.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (loading) return <p role="status">Abrindo o livro de regras…</p>;
  if (!book) return <section className="rb-book"><p role="alert">{error}</p><button type="button" onClick={() => setLoadAttempt(value => value + 1)}>Tentar novamente</button></section>;
  return <section className="rb-book" aria-label="Livro de regras Darkness">
    <header className="rb-heading"><div><span className="de-kicker">DARKNESS / BIBLIOTECA DA MESA</span><h2>Livro de regras</h2><p>O protocolo da sua mesa. Capítulos, referências e regras em uma leitura contínua.</p></div><div className="rb-actions"><button type="button" onClick={exportBook}>Exportar cópia</button>{!readOnly && <button type="button" className="rb-primary" onClick={() => { setError(''); setDraft({ id: `rule-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, title: '', chapter: selected?.chapter || chapters[0] || 'Regras da mesa', content: '' }); }}>+ Novo subcapítulo</button>}</div></header>
    <div className="rb-meta"><span>{sections.length} subcapítulos · {chapters.length} capítulos</span><span>Texto importado do PDF · {book.sourcePages} páginas</span><span>Edições salvas neste navegador</span></div>
    {notice && <div className="rb-notice" role="status">{notice}{backup && <button type="button" disabled={busy} onClick={undo}>Desfazer exclusão</button>}</div>}
    {error && !draft && !deleting && <p className="rb-error" role="alert">{error}</p>}
    <div className="rb-layout"><aside className="rb-sidebar"><label>Buscar no livro<input type="search" aria-label="Buscar no livro de regras" placeholder="Termo, regra ou capítulo…" value={query} onChange={event => setQuery(event.target.value)}/></label><span className="rb-count">{filtered.length} {query ? 'resultados' : 'subcapítulos no sumário'}</span><nav aria-label="Sumário do livro de regras">{visibleChapters.map(chapter => <details key={chapter} open={Boolean(query) || selected?.chapter === chapter}><summary>{chapter}<small>{filtered.filter(section => section.chapter === chapter).length}</small></summary>{filtered.filter(section => section.chapter === chapter).map(section => <button type="button" key={section.id} aria-current={selected?.id === section.id ? 'page' : undefined} onClick={() => navigate(section.id)}><span>{section.title}</span><small>{section.sourcePage ? pageReference(section) : 'Mesa'}</small></button>)}</details>)}</nav></aside>
      <div className="rb-reader" id="rulebook-reader">{selected ? <><div className="rb-reader-tools"><span>{selected.chapter}</span><div role="group" aria-label="Tamanho do texto"><button type="button" aria-label="Diminuir tamanho do texto" disabled={fontSize <= 16} onClick={() => setFontSize(value => value - 1)}>A−</button><button type="button" aria-label="Aumentar tamanho do texto" disabled={fontSize >= 24} onClick={() => setFontSize(value => value + 1)}>A+</button></div></div><article className="rb-article" style={{ '--rb-font-size': `${fontSize}px` }}><header><span className="de-kicker">{selected.sourcePage ? `REFERÊNCIA / ${pageReference(selected).toUpperCase()} DO PDF` : 'REGRA DA MESA'}</span><h1>{selected.title}</h1>{!readOnly && <div className="rb-actions"><button type="button" onClick={() => { setError(''); setDraft({ ...selected }); }}>Editar subcapítulo</button><button type="button" onClick={() => { setError(''); setDeleting(selected); }}>Remover subcapítulo</button></div>}</header><nav className="rb-on-this-page" aria-label="Neste subcapítulo">{headings.length > 1 && <details><summary>Neste subcapítulo · {headings.length} tópicos</summary><ol>{headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol></details>}</nav><div className="rb-prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h2: ({node, children}) => <h2 id={`rule-heading-${node.position.start.offset}`}>{children}</h2>, h3: ({node, children}) => <h3 id={`rule-heading-${node.position.start.offset}`}>{children}</h3>, table: ({node, children}) => <div className="rb-table-wrap" role="region" aria-label="Tabela de regras" tabIndex={0}><table>{children}</table></div> }}>{selected.content}</ReactMarkdown></div><footer className="rb-pagination"><button type="button" disabled={index <= 0} onClick={() => { setQuery(''); navigate(sections[index - 1].id); }}>← Subcapítulo anterior</button><span>{index + 1} / {sections.length}</span><button type="button" disabled={index === sections.length - 1} onClick={() => { setQuery(''); navigate(sections[index + 1].id); }}>Próximo subcapítulo →</button></footer></article></> : <div className="rb-empty"><h3>{query ? 'Nenhuma regra encontrada.' : 'Seu livro está em branco.'}</h3><p>{query ? 'Experimente outra palavra ou limpe a busca.' : 'Adicione uma seção para começar a escrever as regras da sua mesa.'}</p>{query && <button type="button" onClick={() => setQuery('')}>Limpar busca</button>}</div>}</div>
    </div>
    {draft && <EquipmentDialog title="Editar seção do livro" onClose={() => { if (!busy) setDraft(null); }} busy={busy}><form className="de-form rb-editor" onSubmit={submit}><label>Título da seção<input required disabled={busy} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })}/></label><label>Capítulo<input required list="rb-chapters" disabled={busy} value={draft.chapter} onChange={event => setDraft({ ...draft, chapter: event.target.value })}/><datalist id="rb-chapters">{chapters.map(chapter => <option key={chapter} value={chapter}/>)}</datalist></label><label>Conteúdo da seção<textarea rows={16} required disabled={busy} value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })}/></label><p className="de-help">Use ## para tópicos, **texto** para negrito, - para listas e | para as colunas das tabelas. O texto será exibido com a diagramação do site.</p>{error && <p role="alert">{error}</p>}<footer className="de-dialog-actions"><button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancelar</button><button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar seção'}</button></footer></form></EquipmentDialog>}
    {deleting && <EquipmentDialog title="Remover seção do livro" onClose={() => { if (!busy) setDeleting(null); }} busy={busy}><div className="de-form"><p>Remover “{deleting.title}” do livro da mesa?</p><p className="de-help">O PDF original permanece intacto. Você poderá desfazer esta exclusão.</p>{error && <p role="alert">{error}</p>}<footer className="de-dialog-actions"><button type="button" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button><button type="button" disabled={busy} onClick={remove}>{busy ? 'Removendo…' : 'Confirmar remoção'}</button></footer></div></EquipmentDialog>}
  </section>;
}
