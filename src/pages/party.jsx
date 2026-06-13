import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountGroup,
  mdiArrowLeft,
  mdiDiceMultiple,
  mdiNoteTextOutline,
  mdiPackageVariantClosed,
  mdiSend,
} from "@mdi/js";
import "../CSS/Party.css";
import profile from "../assets/IMG/OAbsoluto.png";
import {
  atualizarStatusParty,
  buscarParty,
  buscarPersonagem,
  criarParty,
  entrarParty,
  enviarNotaParty,
  enviarRolagemParty,
  transferirItemParty,
  
} from "../services/personagemApi";
import { estadoInicial } from "./fichaPersonagem";

const STORAGE_KEY = "fichaRPG_personagem";
const DEFAULT_FICHA_ID = "principal";

const normalizarFichaId = (valor) => {
  const fichaId = String(valor || DEFAULT_FICHA_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return fichaId || DEFAULT_FICHA_ID;
};

const getParams = () => new URLSearchParams(window.location.search);

const obterFichaIdDaUrl = () => normalizarFichaId(getParams().get("ficha"));

const obterPartyCodeDaUrl = () =>
  String(getParams().get("party") || "")
    .trim()
    .toUpperCase();

const rolarFormula = (formula) => {
  const texto = String(formula || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");
  const match = texto.match(/^(\d*)d(\d+)([+-]\d+)?$/);

  if (!match) {
    throw new Error("Use formulas como d20, 2d6 ou 1d12+4.");
  }

  const quantidade = Math.min(40, Math.max(1, Number(match[1]) || 1));
  const faces = Math.min(1000, Math.max(2, Number(match[2]) || 20));
  const bonus = Number(match[3] || 0);
  const dados = Array.from(
    { length: quantidade },
    () => Math.floor(Math.random() * faces) + 1,
  );

  return {
    formula: texto,
    dados,
    bonus,
    total: dados.reduce((soma, dado) => soma + dado, 0) + bonus,
  };
};

const BarraStatus = ({ label, recurso, classe }) => {
  const atual = Number(recurso?.atual) || 0;
  const max = Number(recurso?.max) || 0;
  const porcentagem =
    max > 0 ? Math.min(100, Math.max(0, (atual / max) * 100)) : 0;

  return (
    <div className={`party-status-bar ${classe || ""}`}>
      <div>
        <span>{label}</span>
        <strong>
          {atual} / {max}
        </strong>
      </div>
      <i style={{ width: `${porcentagem}%` }} />
    </div>
  );
};

const Party = () => {
  const [fichaId] = useState(() => obterFichaIdDaUrl());
  const obterPartySalva = (fichaId) =>
    localStorage.getItem(`party_${fichaId}`) || "";

  const [partyCode, setPartyCode] = useState(() => {
    const url = obterPartyCodeDaUrl();

    if (url) return url;

    return obterPartySalva(obterFichaIdDaUrl());
  });

  const [codigoEntrada, setCodigoEntrada] = useState(() => {
    const url = obterPartyCodeDaUrl();

    if (url) return url;

    return obterPartySalva(obterFichaIdDaUrl());
  });
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [party, setParty] = useState(null);
  const [nota, setNota] = useState("");
  const [formula, setFormula] = useState("d20");
  const [itemIndex, setItemIndex] = useState("");
  const [destinoItem, setDestinoItem] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  const storageKey = `${STORAGE_KEY}_${fichaId}`;

  const jogadores = useMemo(() => Object.values(party?.players || {}), [party]);

  const outrosJogadores = jogadores.filter(
    (jogador) => jogador.fichaId !== fichaId,
  );

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      setCarregando(true);

      const local = localStorage.getItem(storageKey);

      if (local) {
        try {
          setPersonagem(JSON.parse(local));
        } catch (error) {
          console.warn("Nao foi possivel carregar ficha local.", error);
        }
      }

      try {
        const api = await buscarPersonagem(fichaId);
        if (!cancelado && api) {
          setPersonagem(api);
          localStorage.setItem(storageKey, JSON.stringify(api));
        }
      } catch (error) {
        console.warn("Backend indisponivel para carregar ficha.", error);
      }

      if (!cancelado) setCarregando(false);
    };

    carregar();

    return () => {
      cancelado = true;
    };
  }, [fichaId, storageKey]);

  useEffect(() => {
    if (!partyCode) return undefined;

    let cancelado = false;

    const sincronizar = async () => {
      try {
        const partyAtualizada = await buscarParty(partyCode);
        if (!cancelado) setParty(partyAtualizada);
      } catch (error) {
        if (!cancelado) setMensagem(error.message);
      }
    };

    sincronizar();
    const interval = setInterval(sincronizar, 7000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [partyCode]);

  useEffect(() => {
    if (!partyCode || !personagem?.nome) return undefined;

    const atualizar = () => {
      atualizarStatusParty(partyCode, fichaId, personagem)
        .then(setParty)
        .catch((error) =>
          console.warn("Nao foi possivel atualizar party.", error),
        );
    };

    atualizar();
    const interval = setInterval(atualizar, 15000);

    return () => clearInterval(interval);
  }, [partyCode, fichaId, personagem]);

  const voltarFicha = () => {
    if (partyCode) {
      localStorage.setItem(`party_${fichaId}`, partyCode);
    }

    window.location.href = `/?ficha=${encodeURIComponent(fichaId)}`;
  };

  const abrirParty = (code) => {
    const normalizado = String(code || "")
      .trim()
      .toUpperCase();
    localStorage.setItem(`party_${fichaId}`, normalizado);
    setPartyCode(normalizado);
    setCodigoEntrada(normalizado);
    window.history.replaceState(
      {},
      "",
      `?party=${encodeURIComponent(normalizado)}&ficha=${encodeURIComponent(fichaId)}`,
    );
  };

  const executarAcaoParty = async (acao) => {
    try {
      setMensagem("");
      return await acao();
    } catch (error) {
      const texto = String(error?.message || error || "");
      const rotaNaoEncontrada = texto
        .toLowerCase()
        .includes("rota nao encontrada");

      setMensagem(
        rotaNaoEncontrada
          ? "O backend aberto ainda esta antigo e nao reconhece Party. Feche o terminal do backend e rode npm run dev novamente."
          : texto || "Nao foi possivel atualizar a party.",
      );

      return null;
    }
  };

  const criarNovaParty = async () => {
    const novaParty = await executarAcaoParty(() =>
      criarParty(fichaId, personagem),
    );
    if (!novaParty) return;

    setParty(novaParty);
    abrirParty(novaParty.code);
  };

  const entrarEmParty = async () => {
    const code = codigoEntrada.trim().toUpperCase();
    if (!code) {
      setMensagem("Informe o codigo da party.");
      return;
    }

    const partyAtualizada = await executarAcaoParty(() =>
      entrarParty(code, fichaId, personagem),
    );
    if (!partyAtualizada) return;

    setParty(partyAtualizada);
    abrirParty(partyAtualizada.code);
  };

  const enviarNota = async () => {
    if (!nota.trim()) return;

    const texto = nota.trim();
    const notaOtimista = {
      id: `local-${Date.now()}`,
      fichaId,
      autor: personagem.nome || fichaId,
      texto,
      createdAt: new Date().toISOString(),
    };

    setParty((atual) => ({
      ...(atual || {}),
      notes: [notaOtimista, ...((atual?.notes) || [])],
    }));
    setNota("");

    const partyAtualizada = await executarAcaoParty(() =>
      enviarNotaParty(partyCode, fichaId, texto),
    );
    if (!partyAtualizada) return;

    setParty(partyAtualizada);
  };

  const rolarDados = async () => {
    try {
      const roll = rolarFormula(formula);
      const rolagemOtimista = {
        id: `local-${Date.now()}`,
        fichaId,
        autor: personagem.nome || fichaId,
        ...roll,
        createdAt: new Date().toISOString(),
      };

      setParty((atual) => ({
        ...(atual || {}),
        rolls: [rolagemOtimista, ...((atual?.rolls) || [])],
      }));

      const partyAtualizada = await executarAcaoParty(() =>
        enviarRolagemParty(partyCode, fichaId, roll),
      );
      if (!partyAtualizada) return;

      setParty(partyAtualizada);
      setMensagem("");
    } catch (error) {
      setMensagem(error.message);
    }
  };

  const enviarItem = async () => {
    if (!destinoItem || itemIndex === "") {
      setMensagem("Escolha o item e o jogador de destino.");
      return;
    }

    const index = Number(itemIndex);
    const inventarioAntes = Array.isArray(personagem.inventario)
      ? [...personagem.inventario]
      : [];
    const item = inventarioAntes[index];
    const destino = jogadores.find((jogador) => jogador.fichaId === destinoItem);

    if (!item) {
      setMensagem("Item nao encontrado no inventario.");
      return;
    }

    setPersonagem((atual) => ({
      ...atual,
      inventario: (atual.inventario || []).filter((_, i) => i !== index),
    }));
    setParty((atual) => ({
      ...(atual || {}),
      itemTransfers: [
        {
          id: `local-${Date.now()}`,
          fromFichaId: fichaId,
          toFichaId: destinoItem,
          from: personagem.nome || fichaId,
          to: destino?.nome || destinoItem,
          item,
          createdAt: new Date().toISOString(),
        },
        ...((atual?.itemTransfers) || []),
      ],
    }));
    setItemIndex("");
    setDestinoItem("");

    const partyAtualizada = await executarAcaoParty(() =>
      transferirItemParty(partyCode, fichaId, destinoItem, index),
    );
    if (!partyAtualizada) {
      setPersonagem((atual) => ({
        ...atual,
        inventario: inventarioAntes,
      }));
      return;
    }

    setParty(partyAtualizada);
  };

  if (carregando) {
    return (
      <main className="party-page">
        <section className="party-empty">
          <h1>Carregando party...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="party-page">
      <header className="party-hero">
        <button type="button" onClick={voltarFicha}>
          <Icon path={mdiArrowLeft} size={0.9} />
          Ficha
        </button>
        <span>Multiplayer</span>
        <h1>Party</h1>
        <p>
          Veja status, envie anotações, compartilhe itens e acompanhe rolagens.
        </p>
        {partyCode && <strong>Codigo: {partyCode}</strong>}
      </header>

      {!partyCode ? (
        <section className="party-lobby">
          <article>
            <Icon path={mdiAccountGroup} size={1.4} />
            <h2>Criar party</h2>
            <p>Cria uma sala para outros jogadores entrarem pelo codigo.</p>
            <button type="button" onClick={criarNovaParty}>
              Criar party
            </button>
          </article>

          <article>
            <Icon path={mdiSend} size={1.4} />
            <h2>Entrar em party</h2>
            <input
              value={codigoEntrada}
              onChange={(event) => setCodigoEntrada(event.target.value)}
              placeholder="CODIGO"
            />
            <button type="button" onClick={entrarEmParty}>
              Entrar
            </button>
          </article>
        </section>
      ) : (
        <section className="party-grid">
          <div className="party-jogadores">
            {jogadores.map((jogador) => (
              <article key={jogador.fichaId} className="party-player-card">
                <img src={jogador.fotoPerfil || profile} alt="" />
                <div className="party-player-info">
                  <span>NV{jogador.nivel}</span>
                  <h2>{jogador.nome}</h2>
                  <p>{jogador.classe || "Sem classe"}</p>
                </div>
                <BarraStatus
                  label="Sanidade"
                  recurso={jogador.sanidade}
                  classe="sanidade"
                />
                <BarraStatus
                  label="Esperança"
                  recurso={jogador.esperanca}
                  classe="esperanca"
                />
              </article>
            ))}
          </div>

          <aside className="party-painel">
            <section className="party-box">
              <h2>
                <Icon path={mdiNoteTextOutline} size={0.9} />
                Anotações
              </h2>
              <textarea
                value={nota}
                onChange={(event) => setNota(event.target.value)}
                placeholder="Escreva uma anotação para a party..."
              />
              <button type="button" onClick={enviarNota}>
                Enviar anotação
              </button>
              <div className="party-feed">
                {(party?.notes || []).map((item) => (
                  <article key={item.id}>
                    <strong>{item.autor}</strong>
                    <p>{item.texto}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="party-box">
              <h2>
                <Icon path={mdiDiceMultiple} size={0.9} />
                Rolagens
              </h2>
              <div className="party-inline-form">
                <input
                  value={formula}
                  onChange={(event) => setFormula(event.target.value)}
                  placeholder="d20"
                />
                <button type="button" onClick={rolarDados}>
                  Rolar
                </button>
              </div>
              <div className="party-feed">
                {(party?.rolls || []).map((roll) => (
                  <article key={roll.id}>
                    <strong>{roll.autor}</strong>
                    <p>
                      {roll.formula}: {roll.dados?.join(", ")}
                      {roll.bonus
                        ? ` ${roll.bonus > 0 ? "+" : ""}${roll.bonus}`
                        : ""}{" "}
                      = <b>{roll.total}</b>
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="party-box">
              <h2>
                <Icon path={mdiPackageVariantClosed} size={0.9} />
                Enviar item
              </h2>
              <select
                value={itemIndex}
                onChange={(event) => setItemIndex(event.target.value)}
              >
                <option value="">Escolha um item</option>
                {(personagem.inventario || []).map((item, index) => (
                  <option key={`${item.nome}-${index}`} value={index}>
                    {item.nome}
                  </option>
                ))}
              </select>
              <select
                value={destinoItem}
                onChange={(event) => setDestinoItem(event.target.value)}
              >
                <option value="">Enviar para...</option>
                {outrosJogadores.map((jogador) => (
                  <option key={jogador.fichaId} value={jogador.fichaId}>
                    {jogador.nome}
                  </option>
                ))}
              </select>
              <button type="button" onClick={enviarItem}>
                Enviar item
              </button>
              <div className="party-feed">
                {(party?.itemTransfers || []).map((transferencia) => (
                  <article key={transferencia.id}>
                    <strong>
                      {transferencia.from || "Origem"} →{" "}
                      {transferencia.to || "Destino"}{" "}
                    </strong>
                    <p>{transferencia.item?.nome || "Item"}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      )}

      {mensagem && <p className="party-mensagem">{mensagem}</p>}
    </main>
  );
};

export default Party;
