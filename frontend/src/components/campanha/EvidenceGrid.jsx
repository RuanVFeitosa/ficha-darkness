import React, { useLayoutEffect, useRef, useState } from 'react';

export default function EvidenceGrid({ documentos, selecionado, onSelect }) {
  const area = useRef(null);
  const [capacidade, setCapacidade] = useState({ colunas: 1, linhas: 1 });
  const [pagina, setPagina] = useState(1);
  useLayoutEffect(() => {
    const medir = () => {
      if (!area.current) return;
      const rect = area.current.getBoundingClientRect();
      const largura = rect.width || Math.max(180, window.innerWidth - 44);
      const altura = Math.max(160, window.innerHeight - rect.top - 92);
      const proxima = { colunas: Math.max(1, Math.floor((largura + 16) / 196)), linhas: Math.max(1, Math.floor((altura + 16) / 176)) };
      setCapacidade(atual => atual.colunas === proxima.colunas && atual.linhas === proxima.linhas ? atual : proxima);
    };
    medir();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    observer?.observe(area.current);
    window.addEventListener('resize', medir);
    // Opening the campaign filter also changes the vertical space available.
    const lista = area.current.parentElement;
    lista.addEventListener('toggle', medir, true);
    return () => { observer?.disconnect(); window.removeEventListener('resize', medir); lista.removeEventListener('toggle', medir, true); };
  }, []);
  const tamanho = capacidade.colunas * capacidade.linhas;
  const total = Math.max(1, Math.ceil(documentos.length / tamanho));
  const atual = Math.min(pagina, total);
  const inicio = (atual - 1) * tamanho;
  const paginas = Array.from({ length: total }, (_, i) => i + 1).filter(n => n === 1 || n === total || Math.abs(n - atual) <= 2);
  return <div className="pj-evidence-pages" ref={area}>
    <div className="pj-evidencias" style={{gridTemplateColumns:`repeat(${capacidade.colunas}, minmax(0, 1fr))`}}>
      {documentos.slice(inicio, inicio + tamanho).map(d => <button className="pj-evidencia" key={`${d.campanhaId}:${d.id}`} aria-pressed={selecionado?.id === d.id && selecionado?.campanhaId === d.campanhaId} onClick={() => onSelect(d)}>
        <span aria-hidden="true">{(d.mimeType || d.mime_type || '').includes('modern-pc') ? '▣' : (d.mimeType || d.mime_type || '').match(/audio|cassete/) ? '◎ ◎' : '▤'}</span><small>{d.campanhaNome}</small><strong>{d.nome}</strong><small>Examinar evidência ↗</small>
      </button>)}
    </div>
    {documentos.length > 0 && <div className="pj-evidence-pagination"><span role="status">{inicio + 1}–{Math.min(inicio + tamanho, documentos.length)} de {documentos.length} documentos · Página {atual} de {total}</span>
      {total > 1 && <nav aria-label="Páginas de evidências"><button disabled={atual === 1} onClick={() => setPagina(atual - 1)} aria-label="Página anterior">←</button>{paginas.map((n,i) => <React.Fragment key={n}>{i > 0 && n - paginas[i-1] > 1 && <span>…</span>}<button aria-label={`Página ${n}`} aria-current={n === atual ? 'page' : undefined} onClick={() => setPagina(n)}>{n}</button></React.Fragment>)}<button disabled={atual === total} onClick={() => setPagina(atual + 1)} aria-label="Próxima página">→</button></nav>}
    </div>}
  </div>;
}