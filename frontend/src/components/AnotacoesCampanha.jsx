import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiChevronRight, mdiClose, mdiDeleteOutline, mdiFileDocumentOutline, mdiFolderOutline, mdiFolderPlusOutline, mdiLinkVariant, mdiMagnify, mdiOpenInNew, mdiPaperclip, mdiPencilOutline, mdiPlus, mdiUpload } from "@mdi/js";
import { criarPastaAnotacoes, enviarDocumentoAnotacao, excluirAnotacao, listarAnotacoes, listarPastasAnotacoes, renomearPastaAnotacoes, salvarAnotacao } from "../services/anotacoesApi";
import "../CSS/AnotacoesCampanha.css";

const novaNota = (pasta = "Notas") => ({ titulo: "Nova anotacao", pasta, conteudo: "# Nova anotacao\n\nComece a escrever sua narracao..." });

const urlVisualizacao = (url, tipo = "") => {
  if (!url) return "";
  try {
    const destino = new URL(url);
    if (!/^https?:$/.test(destino.protocol) && destino.protocol !== "blob:") return "";
    if (/docs\.google\.com$/i.test(destino.hostname)) {
      destino.pathname = destino.pathname.replace(/\/(edit|view)(\/.*)?$/, "/preview");
      return destino.toString();
    }
    if (/wordprocessingml|msword/i.test(tipo) || /\.docx?(?:$|[?#])/i.test(url)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return destino.toString();
  } catch { return ""; }
};

const AnotacoesCampanha = ({ campanhaId }) => {
  const [notas, setNotas] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [ativa, setAtiva] = useState(null);
  const [busca, setBusca] = useState("");
  const [modoLeitura, setModoLeitura] = useState(false);
  const [fechadas, setFechadas] = useState({});
  const [estado, setEstado] = useState("Carregando...");
  const [dialogo, setDialogo] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("anotacao");
  const arquivoRef = useRef(null);
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
    const pastaNormalizada = String(pasta || "Notas").trim() || "Notas";

    // A anotacao precisa ser a operacao principal. Antes, a criacao da pasta
    // acontecia primeiro e qualquer falha de permissao/tabela no Supabase
    // impedia completamente a criacao da nota no site publicado.
    if (ativa?.id) await salvarAnotacao(campanhaId, ativa);

    const criada = await salvarAnotacao(campanhaId, novaNota(pastaNormalizada));
    setNotas((atuais) => [criada, ...atuais.filter((item) => item.id !== criada.id)]);
    ignorarPrimeiro.current = true;
    setAtiva(criada);
    setModoLeitura(false);
    setAbaAtiva("anotacao");

    if (!pastas.some((item) => item.nome.toLowerCase() === pastaNormalizada.toLowerCase())) {
      try {
        const pastaCriada = await criarPastaAnotacoes(campanhaId, pastaNormalizada);
        setPastas((atuais) => atuais.some((item) => item.id === pastaCriada.id || item.nome.toLowerCase() === pastaCriada.nome.toLowerCase())
          ? atuais
          : [...atuais, pastaCriada]);
      } catch (erroPasta) {
        // A nota ja foi salva. Mantemos uma pasta virtual na interface para
        // que uma falha isolada na tabela de pastas nao bloqueie o editor.
        console.warn("Anotacao criada, mas a pasta nao pôde ser persistida.", erroPasta);
        setPastas((atuais) => atuais.some((item) => item.nome.toLowerCase() === pastaNormalizada.toLowerCase())
          ? atuais
          : [...atuais, { id: `virtual-${pastaNormalizada}`, nome: pastaNormalizada }]);
      }
    }
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
    ignorarPrimeiro.current = true; setAtiva(nota); setEstado(""); setAbaAtiva("anotacao");
  };
  const anexarUrl = () => setDialogo({ tipo: "documento", titulo: "Vincular documento", valor: ativa?.documento_url || "", nome: ativa?.documento_nome || "" });
  const confirmarDocumento = () => {
    const url = urlVisualizacao(dialogo.valor);
    if (!url) { setEstado("Informe uma URL valida (http ou https)"); return; }
    let nome = dialogo.nome.trim();
    if (!nome) { try { nome = new URL(dialogo.valor).hostname; } catch { nome = "Documento externo"; } }
    editar({ documento_url: dialogo.valor.trim(), documento_nome: nome, documento_tipo: "url" });
    setDialogo(null); setAbaAtiva("documento");
  };
  const enviarArquivo = async (event) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    setEstado("Enviando documento...");
    try {
      const documento = await enviarDocumentoAnotacao(campanhaId, arquivo);
      editar({ documento_url: documento.url, documento_nome: documento.nome, documento_tipo: documento.tipo });
      setAbaAtiva("documento"); setEstado(documento.temporario ? "Disponivel nesta sessao" : "Documento anexado");
    } catch (erro) { setEstado(erro.message || "Nao foi possivel enviar o documento."); }
  };
  const removerDocumento = () => {
    editar({ documento_url: null, documento_nome: null, documento_tipo: null });
    setAbaAtiva("anotacao");
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
        <header><div className="anotacoes-caminho"><Icon path={mdiFolderOutline} size={.62} /><input aria-label="Pasta da anotacao" value={ativa.pasta} onChange={(e) => editar({ pasta: e.target.value })} /></div><div><span className="anotacoes-estado">{estado}</span><button onClick={anexarUrl} title="Vincular URL"><Icon path={mdiLinkVariant} size={.7} /></button><button onClick={() => arquivoRef.current?.click()} title="Enviar PDF, DOC ou DOCX"><Icon path={mdiUpload} size={.7} /></button><input ref={arquivoRef} className="anotacoes-arquivo-input" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={enviarArquivo} /><button className={abaAtiva === "anotacao" && !modoLeitura ? "ativo" : ""} onClick={() => { setModoLeitura(false); setAbaAtiva("anotacao"); }} title="Editar"><Icon path={mdiPencilOutline} size={.7} /></button><button className={abaAtiva === "anotacao" && modoLeitura ? "ativo" : ""} onClick={() => { setModoLeitura(true); setAbaAtiva("anotacao"); }} title="Modo leitura"><Icon path={mdiFileDocumentOutline} size={.7} /></button><button className="perigo" onClick={remover} title="Excluir"><Icon path={mdiDeleteOutline} size={.7} /></button></div></header>
        <nav className="anotacoes-abas" aria-label="Conteudo da anotacao"><button className={abaAtiva === "anotacao" ? "ativo" : ""} onClick={() => setAbaAtiva("anotacao")}><Icon path={mdiFileDocumentOutline} size={.62} />Anotação</button>{ativa.documento_url && <button className={abaAtiva === "documento" ? "ativo" : ""} onClick={() => setAbaAtiva("documento")} title={ativa.documento_nome || "Documento vinculado"}><Icon path={mdiPaperclip} size={.62} /><span>{ativa.documento_nome || "Documento"}</span></button>}</nav>
        {abaAtiva === "documento" && ativa.documento_url ? <section className="anotacoes-conteudo-documento" aria-label={`Documento ${ativa.documento_nome || "anexado"}`}><header><div><span>{ativa.documento_tipo === "url" ? "Link vinculado" : "Arquivo vinculado"}</span><strong>{ativa.documento_nome || "Documento"}</strong></div><a href={ativa.documento_url} target="_blank" rel="noreferrer" title="Abrir em nova guia"><Icon path={mdiOpenInNew} size={.72} /></a><button className="perigo" onClick={removerDocumento} title="Desvincular documento"><Icon path={mdiClose} size={.72} /></button></header><iframe src={urlVisualizacao(ativa.documento_url, ativa.documento_tipo)} title={ativa.documento_nome || "Documento da anotacao"} /></section> : <section className="anotacoes-conteudo-nota"><input className="anotacoes-titulo" value={ativa.titulo} onChange={(e) => editar({ titulo: e.target.value })} aria-label="Titulo da anotacao" />{modoLeitura ? <article className="anotacoes-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{ativa.conteudo}</ReactMarkdown></article> : <textarea className="anotacoes-texto" value={ativa.conteudo} onChange={(e) => editar({ conteudo: e.target.value })} spellCheck="true" />}</section>}
        <footer><span>{palavras} palavras</span><span>{ativa.conteudo?.length || 0} caracteres</span><span>Markdown</span></footer>
      </> : <div className="anotacoes-vazio"><Icon path={mdiFileDocumentOutline} size={1.7} /><strong>Seu arquivo de narracao esta vazio</strong><p>Crie notas para lugares, personagens, pistas e sessoes.</p><button onClick={criar}><Icon path={mdiPlus} size={.7} />Criar primeira anotacao</button></div>}
    </main>
    {dialogo && <div className="anotacoes-dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && setDialogo(null)}><form className="anotacoes-dialogo" onSubmit={(e) => { e.preventDefault(); dialogo.tipo === "documento" ? confirmarDocumento() : confirmarDialogo(e); }}><header><span>{dialogo.tipo === "documento" ? "Referencia de leitura" : "Organizacao do arquivo"}</span><strong>{dialogo.titulo}</strong></header>{dialogo.tipo === "documento" ? <><label>URL do documento<input autoFocus type="url" value={dialogo.valor} onChange={(e) => setDialogo((atual) => ({ ...atual, valor: e.target.value }))} placeholder="https://docs.google.com/... ou https://.../arquivo.pdf" /></label><label>Nome para exibir (opcional)<input value={dialogo.nome} onChange={(e) => setDialogo((atual) => ({ ...atual, nome: e.target.value }))} placeholder="Ex.: Narracao do Ato II" /></label><p className="anotacoes-dialogo-ajuda">No Google Docs, use um link com acesso liberado para quem possui o link.</p></> : <><label>{dialogo.tipo === "nota" ? "Pasta da anotacao" : "Nome da pasta"}<input autoFocus value={dialogo.valor} onChange={(e) => setDialogo((atual) => ({ ...atual, valor: e.target.value }))} placeholder={dialogo.tipo === "nota" ? "Ex.: Ato II / Locais" : "Ex.: Personagens importantes"} /></label>{dialogo.tipo === "nota" && pastas.length > 0 && <div className="anotacoes-pastas-sugestoes">{pastas.map((pasta) => <button type="button" key={pasta.id} onClick={() => setDialogo((atual) => ({ ...atual, valor: pasta.nome }))}><Icon path={mdiFolderOutline} size={.58} />{pasta.nome}</button>)}</div>}</>}<footer><button type="button" onClick={() => setDialogo(null)}>Cancelar</button><button type="submit" disabled={!dialogo.valor.trim()}>{dialogo.tipo === "documento" ? "Vincular" : dialogo.tipo === "renomear" ? "Salvar nome" : "Criar"}</button></footer></form></div>}
  </section>;
};

export default AnotacoesCampanha;