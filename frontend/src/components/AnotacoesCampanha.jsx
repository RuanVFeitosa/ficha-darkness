import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiChevronRight, mdiDeleteOutline, mdiFileDocumentOutline, mdiFolderOutline, mdiFolderPlusOutline, mdiMagnify, mdiPencilOutline, mdiPlus } from "@mdi/js";
import { criarPastaAnotacoes, excluirAnotacao, listarAnotacoes, listarPastasAnotacoes, renomearPastaAnotacoes, salvarAnotacao } from "../services/anotacoesApi";
import "../CSS/AnotacoesCampanha.css";

const novaNota = (pasta = "Notas") => ({ titulo: "Nova anotacao", pasta, conteudo: "# Nova anotacao\n\nComece a escrever sua narracao..." });

const AnotacoesCampanha = ({ campanhaId }) => {
  const [notas, setNotas] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [ativa, setAtiva] = useState(null);
  const [busca, setBusca] = useState("");
  const [modoLeitura, setModoLeitura] = useState(false);
  const [fechadas, setFechadas] = useState({});
  const [estado, setEstado] = useState("Carregando...");
  const [dialogo, setDialogo] = useState(null);
  const ignorarPrimeiro = useRef(true);

  useEffect(() => {
    let montado = true;
    setEstado("Carregando...");
    Promise.all([listarAnotacoes(campanhaId), listarPastasAnotacoes(campanhaId)]).then(([itens, salvas]) => {
      if (!montado) return;
      const nomes = new Set(salvas.map((item) => item.nome));
      const virtuais = [...new Set(itens.map((item) => item.pasta || "Notas"))].filter((nome) => !nomes.has(nome)).map((nome) => ({ id: `virtual-${nome}`, nome }));
      setNotas(itens); setPastas([...salvas, ...virtuais]); setAtiva(itens[0] || null); setEstado(""); ignorarPrimeiro.current = true;
    }).catch((erro) => setEstado(erro.message || "Nao foi possivel carregar as anotacoes."));
    return () => { montado = false; };
  }, [campanhaId]);

  useEffect(() => {
    if (!ativa) return;
    if (ignorarPrimeiro.current) { ignorarPrimeiro.current = false; return; }
    setEstado("Salvando...");
    const timer = setTimeout(async () => {
      try {
        const salva = await salvarAnotacao(campanhaId, ativa);
        setAtiva(salva); setNotas((atuais) => atuais.map((item) => item.id === ativa.id ? salva : item)); setEstado("Salvo");
      } catch (erro) { setEstado(erro.message || "Erro ao salvar"); }
    }, 650);
    return () => clearTimeout(timer);
  }, [ativa, campanhaId]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const filtradas = notas.filter((nota) => !termo || `${nota.titulo} ${nota.pasta} ${nota.conteudo}`.toLocaleLowerCase("pt-BR").includes(termo));
    const resultado = pastas.reduce((acc, pasta) => ({ ...acc, [pasta.nome]: [] }), {});
    filtradas.forEach((nota) => { const pasta = nota.pasta || "Notas"; (resultado[pasta] ||= []).push(nota); });
    return Object.entries(resultado).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [notas, pastas, busca]);

  const criar = () => setDialogo({ tipo: "nota", titulo: "Nova anotacao", valor: ativa?.pasta || grupos[0]?.[0] || "Notas" });
  const confirmarCriacaoNota = async (pasta) => {
    if (ativa?.id) await salvarAnotacao(campanhaId, ativa);
    if (!pastas.some((item) => item.nome.toLowerCase() === pasta.toLowerCase())) {
      const pastaCriada = await criarPastaAnotacoes(campanhaId, pasta); setPastas((atuais) => [...atuais, pastaCriada]);
    }
    const criada = await salvarAnotacao(campanhaId, novaNota(pasta));
    setNotas((atuais) => [criada, ...atuais]); ignorarPrimeiro.current = true; setAtiva(criada); setModoLeitura(false);
  };
  const criarPasta = () => setDialogo({ tipo: "pasta", titulo: "Nova pasta", valor: "" });
  const renomearPasta = (nomeAtual) => setDialogo({ tipo: "renomear", titulo: "Renomear pasta", valor: nomeAtual, nomeAtual });
  const confirmarRenomeacao = async (nomeAtual, novoNome) => {
    try {
      let pasta = pastas.find((item) => item.nome === nomeAtual);
      if (!pasta || String(pasta.id).startsWith("virtual-")) pasta = await criarPastaAnotacoes(campanhaId, nomeAtual);
      const atualizada = await renomearPastaAnotacoes(campanhaId, pasta, novoNome);
      setPastas((atuais) => atuais.map((item) => item.nome === nomeAtual ? atualizada : item));
      setNotas((atuais) => atuais.map((nota) => nota.pasta === nomeAtual ? { ...nota, pasta: novoNome } : nota));
      if (ativa?.pasta === nomeAtual) { ignorarPrimeiro.current = true; setAtiva((nota) => ({ ...nota, pasta: novoNome })); }
    } catch (erro) { setEstado(erro.message || "Nao foi possivel renomear a pasta."); }
  };
  const confirmarDialogo = async (event) => {
    event.preventDefault();
    const valor = dialogo.valor.trim();
    if (!valor) return;
    setEstado("Salvando...");
    try {
      if (dialogo.tipo === "pasta") {
        const pasta = await criarPastaAnotacoes(campanhaId, valor);
        setPastas((atuais) => atuais.some((item) => item.id === pasta.id) ? atuais : [...atuais, pasta]);
      } else if (dialogo.tipo === "renomear") await confirmarRenomeacao(dialogo.nomeAtual, valor);
      else await confirmarCriacaoNota(valor);
      setDialogo(null); setEstado("Salvo");
    } catch (erro) { setEstado(erro.message || "Nao foi possivel concluir a acao."); }
  };
  const remover = async () => {
    if (!ativa || !window.confirm(`Excluir a anotacao "${ativa.titulo}"?`)) return;
    await excluirAnotacao(campanhaId, ativa.id);
    const restantes = notas.filter((item) => item.id !== ativa.id); setNotas(restantes); ignorarPrimeiro.current = true; setAtiva(restantes[0] || null);
  };
  const editar = (mudanca) => { setAtiva((nota) => ({ ...nota, ...mudanca })); setNotas((atuais) => atuais.map((item) => item.id === ativa.id ? { ...item, ...mudanca } : item)); };
  const selecionar = async (nota) => {
    if (ativa?.id && ativa.id !== nota.id) {
      setEstado("Salvando...");
      try {
        const salva = await salvarAnotacao(campanhaId, ativa);
        setNotas((atuais) => atuais.map((item) => item.id === salva.id ? salva : item));
      } catch (erro) { setEstado(erro.message || "Erro ao salvar"); return; }
    }
    ignorarPrimeiro.current = true; setAtiva(nota); setEstado("");
  };
  const palavras = ativa?.conteudo?.trim() ? ativa.conteudo.trim().split(/\s+/).length : 0;

  return <section className="anotacoes-vault">
    <aside className="anotacoes-arquivos">
      <header><strong>Arquivos da campanha</strong><div><button onClick={criarPasta} title="Nova pasta"><Icon path={mdiFolderPlusOutline} size={.78} /></button><button onClick={criar} title="Nova anotacao"><Icon path={mdiPlus} size={.78} /></button></div></header>
      <label className="anotacoes-busca"><Icon path={mdiMagnify} size={.72} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar anotacoes" /></label>
      <div className="anotacoes-arvore">{grupos.map(([pasta, itens]) => <section key={pasta}><div className="anotacoes-pasta-linha"><button className="anotacoes-pasta" onClick={() => setFechadas((atual) => ({ ...atual, [pasta]: !atual[pasta] }))}><Icon path={fechadas[pasta] ? mdiChevronRight : mdiChevronDown} size={.62} /><Icon path={mdiFolderOutline} size={.7} /><span>{pasta}</span><b>{itens.length}</b></button><button onClick={() => renomearPasta(pasta)} title="Renomear pasta"><Icon path={mdiPencilOutline} size={.58} /></button></div>{!fechadas[pasta] && itens.map((nota) => <button key={nota.id} className={`anotacoes-arquivo ${ativa?.id === nota.id ? "ativo" : ""}`} onClick={() => selecionar(nota)}><Icon path={mdiFileDocumentOutline} size={.68} /><span>{nota.titulo}</span></button>)}</section>)}</div>
    </aside>
    <main className="anotacoes-editor">
      {ativa ? <>
        <header><div className="anotacoes-caminho"><Icon path={mdiFolderOutline} size={.62} /><input aria-label="Pasta da anotacao" value={ativa.pasta} onChange={(e) => editar({ pasta: e.target.value })} /></div><div><span className="anotacoes-estado">{estado}</span><button className={!modoLeitura ? "ativo" : ""} onClick={() => setModoLeitura(false)} title="Editar"><Icon path={mdiPencilOutline} size={.7} /></button><button className={modoLeitura ? "ativo" : ""} onClick={() => setModoLeitura(true)} title="Modo leitura"><Icon path={mdiFileDocumentOutline} size={.7} /></button><button className="perigo" onClick={remover} title="Excluir"><Icon path={mdiDeleteOutline} size={.7} /></button></div></header>
        <input className="anotacoes-titulo" value={ativa.titulo} onChange={(e) => editar({ titulo: e.target.value })} aria-label="Titulo da anotacao" />
        {modoLeitura ? <article className="anotacoes-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{ativa.conteudo}</ReactMarkdown></article> : <textarea className="anotacoes-texto" value={ativa.conteudo} onChange={(e) => editar({ conteudo: e.target.value })} spellCheck="true" />}
        <footer><span>{palavras} palavras</span><span>{ativa.conteudo?.length || 0} caracteres</span><span>Markdown</span></footer>
      </> : <div className="anotacoes-vazio"><Icon path={mdiFileDocumentOutline} size={1.7} /><strong>Seu arquivo de narracao esta vazio</strong><p>Crie notas para lugares, personagens, pistas e sessoes.</p><button onClick={criar}><Icon path={mdiPlus} size={.7} />Criar primeira anotacao</button></div>}
    </main>
    {dialogo && <div className="anotacoes-dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && setDialogo(null)}><form className="anotacoes-dialogo" onSubmit={confirmarDialogo}><header><span>Organizacao do arquivo</span><strong>{dialogo.titulo}</strong></header><label>{dialogo.tipo === "nota" ? "Pasta da anotacao" : "Nome da pasta"}<input autoFocus value={dialogo.valor} onChange={(e) => setDialogo((atual) => ({ ...atual, valor: e.target.value }))} placeholder={dialogo.tipo === "nota" ? "Ex.: Ato II / Locais" : "Ex.: Personagens importantes"} /></label>{dialogo.tipo === "nota" && pastas.length > 0 && <div className="anotacoes-pastas-sugestoes">{pastas.map((pasta) => <button type="button" key={pasta.id} onClick={() => setDialogo((atual) => ({ ...atual, valor: pasta.nome }))}><Icon path={mdiFolderOutline} size={.58} />{pasta.nome}</button>)}</div>}<footer><button type="button" onClick={() => setDialogo(null)}>Cancelar</button><button type="submit" disabled={!dialogo.valor.trim()}>{dialogo.tipo === "renomear" ? "Salvar nome" : "Criar"}</button></footer></form></div>}
  </section>;
};

export default AnotacoesCampanha;
