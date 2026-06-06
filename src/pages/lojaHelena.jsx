import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiArrowLeft,
  mdiCart,
  mdiCheck,
  mdiCreationOutline,
  mdiShield,
  mdiSwordCross,
  mdiTag,
  mdiTools,
  mdiTrashCanOutline,
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
  { id: "todos", nome: "Todos", icon: mdiTag },
  { id: "armas", nome: "Armas", icon: mdiSwordCross },
  { id: "defesas", nome: "Defesas", icon: mdiShield },
  { id: "itens", nome: "Itens", icon: mdiTools },
  { id: "ritos", nome: "Ritos Absolutos", icon: mdiCreationOutline },
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
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [carrinho, setCarrinho] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const saldoKey = `lojaHelena_creditos_${fichaId}`;
  const saldo = Math.max(0, parseInt(personagem.lojaCreditos, 10) || 0);

  useEffect(() => {
    const catalogoSalvo = localStorage.getItem(CATALOGO_STORAGE_KEY);

    if (catalogoSalvo) {
      try {
        const catalogoLocal = JSON.parse(catalogoSalvo);

        if (Array.isArray(catalogoLocal)) {
          setCatalogo(catalogoLocal.map(normalizarItemLoja));
        }
      } catch (error) {
        console.warn("Nao foi possivel carregar o catalogo local.", error);
      }
    }

    buscarCatalogoLoja()
      .then((catalogoApi) => {
        if (catalogoApi.length > 0) {
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
    if (categoriaAtiva === "todos") {
      return catalogo;
    }

    return catalogo.filter((item) => item.categoria === categoriaAtiva);
  }, [categoriaAtiva, catalogo]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco, 0);
  const podeComprar = carrinho.length > 0 && totalCarrinho <= saldo;

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
      setMensagem("Creditos insuficientes para fechar essa compra.");
      return;
    }

    const novosRitos = carrinho
      .filter((item) => item.categoria === "ritos")
      .map((item) => ({ nome: item.nome, custo: item.entrega }));

    const novosItens = carrinho
      .filter((item) => item.categoria !== "ritos")
      .map((item) => ({ nome: item.nome, detalhes: item.entrega }));

    const personagemAtualizado = {
      ...personagem,
      lojaCreditos: saldo - totalCarrinho,
      rituais: [...(personagem.rituais || []), ...novosRitos],
      inventario: [...(personagem.inventario || []), ...novosItens],
    };

    setPersonagem(personagemAtualizado);
    setCarrinho([]);
    setMensagem("Compra concluida. Helena ja colocou tudo na sua ficha.");

    localStorage.setItem(storageKey, JSON.stringify(personagemAtualizado));
    localStorage.setItem(saldoKey, String(personagemAtualizado.lojaCreditos));
    salvarPersonagem(fichaId, personagemAtualizado).catch((error) => {
      console.warn("Backend indisponivel. Compra salva localmente.", error);
    });
  };

  return (
    <main className="loja-page">
      <section className="loja-hero">
        <img src="/loja-helena.png" alt="Armeira Helena" className="loja-hero-img" />
        <div className="loja-hero-overlay" />
        <button className="loja-voltar" onClick={voltarParaFicha} title="Voltar para ficha">
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>
        <div className="loja-hero-copy">
          <span className="loja-kicker">Arsenal particular</span>
          <h1>Loja da Helena</h1>
          <p>Armas, defesas, recursos de campo e Ritos Absolutos para quem sabe que preparo tambem e sobrevivencia.</p>
        </div>
      </section>

      <section className="loja-shell">
        <div className="loja-toolbar" aria-label="Categorias da loja">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className={`loja-categoria ${categoriaAtiva === categoria.id ? "ativa" : ""}`}
              onClick={() => setCategoriaAtiva(categoria.id)}
            >
              <Icon path={categoria.icon} size={0.8} />
              {categoria.nome}
            </button>
          ))}
        </div>

        <div className="loja-layout">
          <div className="loja-catalogo">
            {itensFiltrados.map((item) => (
              <article key={item.id} className="loja-item">
                <div>
                  <span className={`loja-item-tipo ${item.categoria}`}>{item.categoria}</span>
                  <h2>{item.nome}</h2>
                  <p>{item.detalhe}</p>
                </div>
                <div className="loja-item-footer">
                  <span className="loja-preco">{item.preco} cr</span>
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
                <span>Creditos</span>
                <strong>{saldo} cr</strong>
              </div>
              <Icon path={mdiCart} size={1.2} />
            </div>

            <div className="loja-carrinho-lista">
              {carrinho.length === 0 ? (
                <p className="loja-carrinho-vazio">Nenhum item separado.</p>
              ) : (
                carrinho.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="loja-carrinho-item">
                    <div>
                      <strong>{item.nome}</strong>
                      <span>{item.preco} cr</span>
                    </div>
                    <button onClick={() => removerDoCarrinho(index)} title="Remover">
                      <Icon path={mdiTrashCanOutline} size={0.7} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="loja-total">
              <span>Total</span>
              <strong>{totalCarrinho} cr</strong>
            </div>

            <button className="loja-finalizar" onClick={finalizarCompra} disabled={!podeComprar}>
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
