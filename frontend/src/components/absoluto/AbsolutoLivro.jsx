import { normalizarConteudoAbsoluto } from '../../utils/absolutoModificadores';
import React, { useEffect, useState } from 'react';
import { REGRAS_ABSOLUTO } from '../../data/absolutoRegras';

const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function AbsolutoLivro() {
  const [busca, setBusca] = useState('');
  const [integral, setIntegral] = useState(false);
  const [paginas, setPaginas] = useState([]);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!integral) return;
    let ativo = true;
    import('../../data/absolutoLivro.json').then(m => { if (ativo) setPaginas(normalizarConteudoAbsoluto(m.default)); }).catch(() => { if (ativo) setErro('Não foi possível abrir o livro. Tente novamente.'); });
    return () => { ativo = false; };
  }, [integral]);
  const termo = normalizar(busca);
  const resultados = (integral ? paginas : REGRAS_ABSOLUTO).filter(p => normalizar(`${p.titulo || p.capitulo} ${p.texto}`).includes(termo));
  return <section className="abs-v1-livro" aria-label="Livro de regras Absoluto 1.0">
    <header><span className="abs-v1-kicker">PROTOCOLO ABSOLUTO / 1.0</span><h2>O livro da sobrevivência</h2><p>Regras organizadas para jogar e consulta ao conteúdo do manuscrito por página.</p></header>
    <label>Buscar regras, habilidades, ritos ou criaturas<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: Ruptura, Médico, Lâmina Profana…" /></label>
    <div className="abs-v1-actions"><button type="button" aria-pressed={!integral} onClick={() => setIntegral(false)}>Guia da versão 1.0</button><button type="button" aria-pressed={integral} onClick={() => setIntegral(true)}>Consultar livro completo</button></div>
    {integral && <p className="abs-v1-note">Fonte: Protocolo Absoluto v1.0. Bônus e penalidades foram adaptados para +1/−1 dado, com limite de oito dados. O restante conserva o texto do manuscrito. Entradas de classes, armas, ritos e criaturas precisam respeitar a escala atual antes de serem aplicadas. Páginas compostas apenas por imagens não têm texto pesquisável.</p>}
    {erro && <p role="alert">{erro}</p>}
    {integral && !paginas.length && !erro && <p role="status">Abrindo o livro…</p>}
    <p aria-live="polite">{resultados.length} {integral ? 'páginas' : 'tópicos'} encontrados</p>
    {resultados.map(p => <details key={p.titulo || p.pagina}><summary>{p.titulo || `${p.capitulo} · página ${p.pagina}`}<small>{p.paginas && `Páginas ${p.paginas}`}</small></summary><p>{p.texto}</p></details>)}
    {!resultados.length && (!integral || paginas.length > 0) && <p>Nenhum resultado. Tente outro nome ou consulte o livro completo.</p>}
  </section>;
}
