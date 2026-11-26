import React, { useEffect, useMemo, useState } from 'react';
import book from '../../data/ordemRulebook.json';
import '../../styles/DarknessRulebook.css';
import '../../styles/OrdemRulebook.css';

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const chapters = book.chapters.map((chapter, index) => {
  const end = book.chapters[index + 1]?.page ?? Infinity;
  const pages = book.pages.filter(page => page.number >= chapter.page && page.number < end)
    .map(page => ({
      ...page,
      searchText: normalize([chapter.title, ...page.topics, page.content.replace(/-\s*\n\s*/g, '')].join(' ')),
    }));
  return { ...chapter, pages };
});

const pages = chapters.flatMap(chapter => chapter.pages);
const pageLabel = page => page.printedPage ? `Página ${page.printedPage}` : `PDF · página ${page.number}`;

export default function OrdemRulebook({ chapterTitle }) {
  const availableChapters = useMemo(() => chapterTitle ? chapters.filter(chapter => chapter.title.endsWith(chapterTitle)) : chapters, [chapterTitle]);
  const availablePages = useMemo(() => chapterTitle ? availableChapters.flatMap(chapter => chapter.pages) : pages, [availableChapters, chapterTitle]);
  const [query, setQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(() => (chapterTitle ? availablePages : chapters[1].pages).find(page => page.content)?.number);
  const [pdfUrl, setPdfUrl] = useState('');
  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const results = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return availableChapters.map(chapter => ({
      ...chapter,
      pages: chapter.pages.filter(page => terms.every(term => page.searchText.includes(term))),
    })).filter(chapter => chapter.pages.length);
  }, [availableChapters, query]);

  const matches = results.flatMap(chapter => chapter.pages);
  const page = matches.find(candidate => candidate.number === pageNumber) ?? matches[0];
  const chapter = results.find(candidate => candidate.pages.includes(page));
  const pageIndex = availablePages.indexOf(page);

  function navigate(index) {
    setQuery('');
    setPageNumber(availablePages[index].number);
  }

  return (
    <section className="rb-book ordem-book" aria-label="Livro de regras de Ordem Paranormal">
      <header className="rb-heading">
        <div><h2>{chapterTitle || 'Ordem Paranormal RPG'}</h2><p>Livro de regras v1.3 · {availablePages.length} páginas indexadas</p><a href="/?ordem=1">Abrir ficha de Ordem Paranormal</a></div>
        <label className="ordem-pdf">
          Selecionar PDF v1.3
          <input type="file" accept="application/pdf,.pdf" onChange={event => {
            const file = event.target.files[0];
            setPdfUrl(file ? URL.createObjectURL(file) : '');
          }} />
        </label>
      </header>
      <div className="rb-layout">
        <aside className="rb-sidebar">
          <label>Buscar em Ordem Paranormal
            <input type="search" placeholder="Ritual, item, regra ou ameaça…" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <p aria-live="polite">{matches.length} páginas</p>
          <nav aria-label="Sumário de Ordem Paranormal">
            {results.map(group => (
              <details key={group.page} open={Boolean(query.trim()) || group.page === chapter?.page}>
                <summary>{group.title}<small>{group.pages.length}</small></summary>
                {group.pages.map(entry => (
                  <button type="button" key={entry.number} aria-current={entry === page ? 'page' : undefined} onClick={() => setPageNumber(entry.number)}>
                    <span>{entry.topics.join(' · ') || pageLabel(entry)}</span>
                    {entry.topics.length > 0 && <small>{pageLabel(entry)}</small>}
                  </button>
                ))}
              </details>
            ))}
          </nav>
        </aside>
        <div className="rb-reader">
          {page ? (
            <article className="rb-article">
              <header>
                <span>{chapter.title}</span>
                <h3>{pageLabel(page)}</h3>
                {pdfUrl && <a href={`${pdfUrl}#page=${page.number}`} target="_blank" rel="noreferrer">Conferir esta página no PDF</a>}
              </header>
              {page.topics.length > 0 && <p>{page.topics.join(' · ')}</p>}
              {page.content
                ? <div className="ordem-page-text" key={page.number}>{page.content}</div>
                : <p>Esta página está disponível na edição diagramada do PDF.</p>}
              <footer className="rb-pagination">
                <button type="button" disabled={pageIndex === 0} onClick={() => navigate(pageIndex - 1)}>← Página anterior</button>
                <button type="button" disabled={pageIndex === availablePages.length - 1} onClick={() => navigate(pageIndex + 1)}>Próxima página →</button>
              </footer>
            </article>
          ) : (
            <div className="rb-empty">
              <h3>Nenhuma página encontrada.</h3>
              <button type="button" onClick={() => setQuery('')}>Limpar busca</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
