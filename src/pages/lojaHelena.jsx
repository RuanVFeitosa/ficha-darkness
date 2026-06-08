import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiArrowLeft,
  mdiCart,
  mdiCheck,
  mdiCreationOutline,
  mdiShield,
  mdiTools,
  mdiTrashCanOutline,
  mdiPistol,
  mdiKnifeMilitary,
  mdiCreation,
} from "@mdi/js";
import "../CSS/LojaHelena.css";
import {
  buscarCatalogoLoja,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import {
  DEFAULT_CATALOGO_LOJA,
  normalizarItemLoja,
} from "../data/catalogoLoja";
import { estadoInicial } from "./fichaPersonagem";

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";
const DEFAULT_FICHA_ID = "principal";

const categorias = [
  { id: "armas-fogo", nome: "Armas de Fogo", icon: mdiPistol },
  { id: "armas-corpo", nome: "Corpo a Corpo", icon: mdiKnifeMilitary },
  { id: "defesas", nome: "Defesas", icon: mdiShield },
  { id: "itens", nome: "Itens", icon: mdiTools },
  { id: "ritos", nome: "Ritos Absolutos", icon: mdiCreationOutline },
  { id: "poderes", nome: "Poderes Absolutos", icon: mdiCreation },
];

const normalizarFichaId = (valor) => {
  const fichaId = String(valor || DEFAULT_FICHA_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return fichaId || DEFAULT_FICHA_ID;
};

const obterFichaIdDaUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return normalizarFichaId(params.get("ficha"));
};

const LojaHelena = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [categoriaAtiva, setCategoriaAtiva] = useState("armas-fogo");
  const [nivelRitoAtivo, setNivelRitoAtivo] = useState("iniciante");
  const [carrinho, setCarrinho] = useState([]);
  const [mensagem, setMensagem] = useState("");

  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const saldoKey = `lojaHelena_creditos_${fichaId}`;

  const saldo = Math.max(0, parseInt(personagem.lojaCreditos, 10) || 0);
  const saldoMementos = Math.max(
    0,
    parseInt(personagem.ritosCreditos, 10) || 0,
  );

  const usandoRitos = categoriaAtiva === "ritos";
  const usandoPoderes = categoriaAtiva === "poderes";
  const usandoLojaAbsoluto = usandoRitos || usandoPoderes;

  useEffect(() => {
    const catalogoSalvo = localStorage.getItem(CATALOGO_STORAGE_KEY);

    if (catalogoSalvo) {
      try {
        const catalogoLocal = JSON.parse(catalogoSalvo);

        if (Array.isArray(catalogoLocal)) {
          const catalogoLocalNormalizado =
            catalogoLocal.map(normalizarItemLoja);
          const catalogoAtualizado = catalogoLocalNormalizado.some(
            (item) =>
              item.armaStatus ||
              item.nivelRito ||
              item.categoria === "poderes" ||
              item.categoria === "armas-fogo" ||
              item.categoria === "armas-corpo",
          );

          if (catalogoAtualizado) {
            setCatalogo(catalogoLocalNormalizado);
          } else {
            localStorage.removeItem(CATALOGO_STORAGE_KEY);
            setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
          }
        }
      } catch (error) {
        console.warn("Nao foi possivel carregar o catalogo local.", error);
      }
    }

    buscarCatalogoLoja()
      .then((catalogoApi) => {
        const apiAtualizada =
          Array.isArray(catalogoApi) &&
          catalogoApi.some(
            (item) =>
              item.armaStatus ||
              item.nivelRito ||
              item.categoria === "poderes" ||
              item.categoria === "armas-fogo" ||
              item.categoria === "armas-corpo",
          );

        if (catalogoApi.length > 0 && apiAtualizada) {
          const catalogoNormalizado = catalogoApi.map(normalizarItemLoja);
          setCatalogo(catalogoNormalizado);
          localStorage.setItem(
            CATALOGO_STORAGE_KEY,
            JSON.stringify(catalogoNormalizado),
          );
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Loja usando catalogo local.");
      });
  }, []);

  useEffect(() => {
    const saldoSalvo = localStorage.getItem(saldoKey);
    const creditosLocais = saldoSalvo
      ? Math.max(0, parseInt(saldoSalvo, 10) || 0)
      : null;

    const aplicarCompatibilidade = (personagemBase) => ({
      ...personagemBase,
      lojaCreditos: personagemBase.lojaCreditos ?? creditosLocais ?? 900,
      ritosCreditos: personagemBase.ritosCreditos ?? 15,
      poderesAbsolutos: personagemBase.poderesAbsolutos ?? [],
    });

    const dadosSalvos = localStorage.getItem(storageKey);

    if (dadosSalvos) {
      try {
        setPersonagem(aplicarCompatibilidade(JSON.parse(dadosSalvos)));
      } catch (error) {
        console.warn("Nao foi possivel carregar a ficha local.", error);
      }
    }

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi) {
          setPersonagem(aplicarCompatibilidade(personagemApi));
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Loja usando localStorage.");
      });
  }, [fichaId, saldoKey, storageKey]);

  const itensFiltrados = useMemo(() => {
    if (categoriaAtiva === "todos") return catalogo;

    if (categoriaAtiva === "ritos") {
      return catalogo.filter(
        (item) =>
          item.categoria === "ritos" && item.nivelRito === nivelRitoAtivo,
      );
    }

    return catalogo.filter((item) => item.categoria === categoriaAtiva);
  }, [categoriaAtiva, catalogo, nivelRitoAtivo]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco, 0);
  const saldoAtual = usandoLojaAbsoluto ? saldoMementos : saldo;
  const podeComprar = carrinho.length > 0 && totalCarrinho <= saldoAtual;

  const formatarPreco = (itemOuValor) => {
    const valor =
      typeof itemOuValor === "number" ? itemOuValor : itemOuValor.preco;

    return usandoLojaAbsoluto ? `${valor} Mementos` : `${valor} cr`;
  };

  const adicionarAoCarrinho = (item) => {
    setCarrinho((atual) => [...atual, item]);
    setMensagem(`${item.nome} separado no balcao.`);
  };

  const removerDoCarrinho = (index) => {
    setCarrinho((atual) => atual.filter((_, itemIndex) => itemIndex !== index));
  };

  const voltarParaFicha = () => {
    window.location.href = `?ficha=${encodeURIComponent(fichaId)}`;
  };

  const finalizarCompra = () => {
    if (!podeComprar) {
      setMensagem(
        usandoLojaAbsoluto
          ? "Mementos insuficientes para fechar essa compra."
          : "Creditos insuficientes para fechar essa compra.",
      );
      return;
    }

    const novosRitos = carrinho
      .filter((item) => item.categoria === "ritos")
      .map((item) => ({
        nome: item.nome,
        custo: item.entrega,
        descricao: item.detalhe,
        detalhe: item.detalhe,

        nivel: item.nivelRito || "iniciante",
        nivelRito: item.nivelRito || "iniciante",

        acao: item.acao || "",
        distancia: item.distancia || "",
        duracao: item.duracao || "",
        requisitos: item.requisitos || "",
        alvo: item.alvo || "",
        efeito: item.efeito || item.detalhe || "",
      }));

    const novosPoderes = carrinho
      .filter((item) => item.categoria === "poderes")
      .map((item) => ({
        nome: item.nome,
        descricao: item.detalhe,
        absolutismo: item.entrega,
      }));

    const novosItens = carrinho
      .filter(
        (item) => item.categoria !== "ritos" && item.categoria !== "poderes",
      )
      .map((item) => ({
        nome: item.nome,
        detalhes: item.entrega,
        armaStatus: item.armaStatus || null,
      }));

    const personagemAtualizado = {
      ...personagem,

      lojaCreditos: usandoLojaAbsoluto ? saldo : saldo - totalCarrinho,
      ritosCreditos: usandoLojaAbsoluto
        ? saldoMementos - totalCarrinho
        : saldoMementos,

      rituais: [...(personagem.rituais || []), ...novosRitos],
      poderesAbsolutos: [
        ...(personagem.poderesAbsolutos || []),
        ...novosPoderes,
      ],
      inventario: [...(personagem.inventario || []), ...novosItens],
    };

    setPersonagem(personagemAtualizado);
    setCarrinho([]);

    setMensagem(
      usandoLojaAbsoluto
        ? "Compra concluida. O Absoluto gravou a escolha na sua ficha."
        : "Compra concluida. Helena ja colocou tudo na sua ficha.",
    );

    localStorage.setItem(storageKey, JSON.stringify(personagemAtualizado));
    localStorage.setItem(saldoKey, String(personagemAtualizado.lojaCreditos));

    salvarPersonagem(fichaId, personagemAtualizado).catch((error) => {
      console.warn("Backend indisponivel. Compra salva localmente.", error);
    });
  };

  return (
    <main className="loja-page">
      <section
        className={`loja-hero ${usandoLojaAbsoluto ? "loja-hero-ritos" : ""}`}
      >
        <img
          src={usandoLojaAbsoluto ? "/SalaMarcos.png" : "/loja-helena.png"}
          alt="Loja"
          className="loja-hero-img"
        />

        <div className="loja-hero-overlay" />

        <button
          className="loja-voltar"
          onClick={voltarParaFicha}
          title="Voltar para ficha"
        >
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>

        <div className="loja-hero-copy">
          <span className="loja-kicker">
            {usandoRitos
              ? "Conhecimento proibido"
              : usandoPoderes
                ? "Dons do Absoluto"
                : "Arsenal particular"}
          </span>

          <h1>
            {usandoRitos
              ? "Ritos Absolutos"
              : usandoPoderes
                ? "Poderes Absolutos"
                : "Loja da Helena"}
          </h1>

          <p>
            {usandoRitos
              ? "Fragmentos do Absoluto esquecidos entre simbolos, sangue e sacrificios."
              : usandoPoderes
                ? "Poderes marcados por vontade, dor e uma verdade que não deveria existir."
                : "Armas, defesas, recursos de campo para quem sabe que preparo tambem e sobrevivencia."}
          </p>
        </div>
      </section>

      <section className="loja-shell">
        <div className="loja-toolbar" aria-label="Categorias da loja">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className={`loja-categoria ${
                categoriaAtiva === categoria.id ? "ativa" : ""
              }`}
              onClick={() => {
                setCategoriaAtiva(categoria.id);
                setCarrinho([]);
                setMensagem("");
              }}
            >
              <Icon path={categoria.icon} size={0.8} />
              {categoria.nome}
            </button>
          ))}
        </div>

        {usandoRitos && (
          <div className="ritos-subabas">
            <button
              className={nivelRitoAtivo === "iniciante" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("iniciante")}
            >
              I — Iniciante
            </button>

            <button
              className={nivelRitoAtivo === "intermediario" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("intermediario")}
            >
              II — Intermediário
            </button>

            <button
              className={nivelRitoAtivo === "avancado" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("avancado")}
            >
              III — Avançado
            </button>

            <button
              className={nivelRitoAtivo === "experiente" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("experiente")}
            >
              IV — Experiente
            </button>
          </div>
        )}

        <div className="loja-layout">
          <div className="loja-catalogo">
            {itensFiltrados.map((item) => (
              <article
                key={item.id}
                className={`loja-item ${item.armaStatus ? "loja-arma" : ""}`}
              >
                <div>
                  <span className={`loja-item-tipo ${item.categoria}`}>
                    {item.armaStatus?.tipo || item.categoria}
                  </span>

                  <h2>{item.nome}</h2>
                  <p>{item.detalhe}</p>

                  {item.armaStatus && (
                    <div className="arma-status-card">
                      <div className="arma-status-principais">
                        <div>
                          <span>DMG</span>
                          <strong>{item.armaStatus.dmg}</strong>
                        </div>

                        <div>
                          <span>ROF</span>
                          <strong>{item.armaStatus.rof}</strong>
                        </div>

                        <div>
                          <span>MAG</span>
                          <strong>{item.armaStatus.mag}</strong>
                        </div>
                      </div>

                      <div className="arma-status-modos">
                        <div>
                          <span>HIPFIRE</span>
                          <strong>{item.armaStatus.hipfire}</strong>
                        </div>

                        <div>
                          <span>PRECISION</span>
                          <strong>{item.armaStatus.precision}</strong>
                        </div>

                        <div>
                          <span>CONTROL</span>
                          <strong>{item.armaStatus.control}</strong>
                        </div>

                        <div>
                          <span>MOBILITY</span>
                          <strong>{item.armaStatus.mobility}</strong>
                        </div>
                      </div>

                      <div className="arma-status-extra">
                        <span>
                          Disparos: {item.armaStatus.disparosSemDesvantagem}
                        </span>
                        <span>Recarga: {item.armaStatus.recarga}</span>
                        <span>Crítico: {item.armaStatus.critico}</span>
                        <span>Cabeça: {item.armaStatus.danoCabeca}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="loja-item-footer">
                  <span className="loja-preco">{formatarPreco(item)}</span>

                  <button onClick={() => adicionarAoCarrinho(item)}>
                    <Icon path={mdiCart} size={0.75} />
                    Comprar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="loja-carrinho" aria-label="Carrinho">
            <div className="loja-carrinho-topo">
              <div>
                <span>{usandoLojaAbsoluto ? "Mementos" : "Creditos"}</span>
                <strong>
                  {usandoLojaAbsoluto
                    ? `${saldoMementos} Mementos`
                    : `${saldo} cr`}
                </strong>
              </div>

              <Icon path={mdiCart} size={1.2} />
            </div>

            <div className="loja-carrinho-lista">
              {carrinho.length === 0 ? (
                <p className="loja-carrinho-vazio">Nenhum item separado.</p>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="loja-carrinho-item"
                  >
                    <div>
                      <strong>{item.nome}</strong>
                      <span>{formatarPreco(item)}</span>
                    </div>

                    <button
                      onClick={() => removerDoCarrinho(index)}
                      title="Remover"
                    >
                      <Icon path={mdiTrashCanOutline} size={0.7} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="loja-total">
              <span>Total</span>
              <strong>{formatarPreco(totalCarrinho)}</strong>
            </div>

            <button
              className="loja-finalizar"
              onClick={finalizarCompra}
              disabled={!podeComprar}
            >
              <Icon path={mdiCheck} size={0.8} />
              Finalizar compra
            </button>

            {mensagem && <p className="loja-mensagem">{mensagem}</p>}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default LojaHelena;
