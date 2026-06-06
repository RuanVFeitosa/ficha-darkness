import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountPlus,
  mdiArrowLeft,
  mdiCashPlus,
  mdiDeleteOutline,
  mdiOpenInNew,
  mdiPackageVariantClosedPlus,
  mdiRefresh,
  mdiStoreCogOutline,
} from "@mdi/js";
import "../CSS/DashboardMestre.css";
import {
  apagarPersonagem,
  buscarCatalogoLoja,
  criarPersonagem,
  listarPersonagens,
  salvarCatalogoLoja,
  salvarPersonagem,
} from "../services/personagemApi";
import { estadoInicial } from "./fichaPersonagem";
import {
  CATEGORIAS_LOJA,
  DEFAULT_CATALOGO_LOJA,
  normalizarItemLoja,
} from "../data/catalogoLoja";

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";

const fichaVazia = {
  nome: "",
  pronome: "Ele",
  classe: "",
  especialidade: "",
};

const itemInventarioVazio = {
  nome: "",
  detalhes: "",
};

const ritoVazio = {
  nome: "",
  custo: "",
};

const itemLojaVazio = {
  nome: "",
  categoria: "itens",
  preco: 0,
  detalhe: "",
  entrega: "",
};

const abasFicha = [
  { id: "perfil", nome: "Perfil" },
  { id: "ativos", nome: "Ativos" },
  { id: "passivos", nome: "Passivos" },
  { id: "ritos", nome: "Ritos" },
  { id: "inventario", nome: "Inventario" },
  { id: "corpo", nome: "Corpo" },
  { id: "descricao", nome: "Descricao" },
];

const ativosFicha = [
  { chave: "razao", nome: "Razao" },
  { chave: "firmeza", nome: "Firmeza" },
  { chave: "intuicao", nome: "Intuicao" },
  { chave: "violencia", nome: "Violencia" },
  { chave: "percepcao", nome: "Percepcao" },
  { chave: "carisma", nome: "Carisma" },
  { chave: "persistencia", nome: "Persistencia" },
  { chave: "resistencia", nome: "Resistencia" },
];

const passivosFicha = [
  { chave: "enganacao", nome: "Enganacao" },
  { chave: "raciocinioLogico", nome: "Raciocinio Logico" },
  { chave: "investigacao", nome: "Investigacao" },
  { chave: "instinto", nome: "Instinto" },
  { chave: "sensibilidade", nome: "Sensibilidade" },
  { chave: "instintoSobrevivencia", nome: "Instinto de Sobrevivencia" },
  { chave: "coragem", nome: "Coragem" },
  { chave: "diplomacia", nome: "Diplomacia" },
  { chave: "disciplina", nome: "Disciplina" },
  { chave: "autocontrole", nome: "Autocontrole" },
  { chave: "intimidacaoPassiva", nome: "Intimidacao Passiva" },
  { chave: "presenca", nome: "Presenca" },
  { chave: "memoria", nome: "Memoria" },
  { chave: "empatia", nome: "Empatia" },
  { chave: "lealdade", nome: "Lealdade" },
  { chave: "fe", nome: "Fe" },
  { chave: "vitalidade", nome: "Vitalidade" },
  { chave: "folego", nome: "Folego" },
  { chave: "equilibrio", nome: "Equilibrio" },
  { chave: "velocidade", nome: "Velocidade" },
  { chave: "precisao", nome: "Precisao" },
  { chave: "lutar", nome: "Lutar" },
  { chave: "resistenciaFisica", nome: "Resistencia Fisica" },
  { chave: "primeirosSocorros", nome: "Primeiros Socorros" },
  { chave: "furtividade", nome: "Furtividade" },
  { chave: "conhecimentoMedico", nome: "Conhecimento Medico" },
  { chave: "conhecimentoTecnico", nome: "Conhecimento Tecnico" },
  { chave: "conhecimentoHistorico", nome: "Conhecimento Historico" },
  { chave: "conhecimentoOculto", nome: "Conhecimento Oculto" },
  { chave: "tecnologia", nome: "Tecnologia" },
  { chave: "tatica", nome: "Tatica" },
  { chave: "percepcaoAuditiva", nome: "Percepcao Auditiva" },
  { chave: "percepcaoVisual", nome: "Percepcao Visual" },
  { chave: "percepcaoOlfativa", nome: "Percepcao Olfativa" },
  { chave: "crime", nome: "Crime" },
  { chave: "manipulacao", nome: "Manipulacao" },
  { chave: "intimidacao", nome: "Intimidacao" },
  { chave: "seducao", nome: "Seducao" },
  { chave: "resistenciaMental", nome: "Resistencia Mental" },
];

const membrosFicha = [
  { chave: "cabeca", nome: "Cabeca" },
  { chave: "torso", nome: "Torso" },
  { chave: "bracoDireito", nome: "Braco direito" },
  { chave: "bracoEsquerdo", nome: "Braco esquerdo" },
  { chave: "pernaDireita", nome: "Perna direita" },
  { chave: "pernaEsquerda", nome: "Perna esquerda" },
];

const normalizarFichaId = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const listarFichasLocais = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${STORAGE_KEY}_`))
    .map((key) => {
      const fichaId = key.replace(`${STORAGE_KEY}_`, "");
      try {
        return {
          fichaId,
          personagem: JSON.parse(localStorage.getItem(key)),
          updatedAt: null,
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.fichaId.localeCompare(b.fichaId));

const salvarFichaLocal = (fichaId, personagem) => {
  localStorage.setItem(`${STORAGE_KEY}_${fichaId}`, JSON.stringify(personagem));
};

const DashboardMestre = () => {
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState("");
  const [personagem, setPersonagem] = useState(null);
  const [novaFicha, setNovaFicha] = useState(fichaVazia);
  const [itemInventario, setItemInventario] = useState(itemInventarioVazio);
  const [novoRito, setNovoRito] = useState(ritoVazio);
  const [creditosDelta, setCreditosDelta] = useState(100);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [novoItemLoja, setNovoItemLoja] = useState(itemLojaVazio);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("todos");
  const [abaFicha, setAbaFicha] = useState("perfil");
  const [aba, setAba] = useState("fichas");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const fichaAtual = useMemo(
    () => fichas.find((ficha) => ficha.fichaId === fichaSelecionada),
    [fichaSelecionada, fichas],
  );

  const categoriasFiltroLoja = useMemo(
    () => [{ id: "todos", nome: "Todos" }, ...CATEGORIAS_LOJA],
    [],
  );

  const catalogoFiltrado = useMemo(() => {
    if (categoriaLojaAtiva === "todos") {
      return catalogo;
    }

    return catalogo.filter((item) => item.categoria === categoriaLojaAtiva);
  }, [catalogo, categoriaLojaAtiva]);

  const carregarTudo = async () => {
    setCarregando(true);
    setMensagem("");

    try {
      const [fichasApi, catalogoApi] = await Promise.all([
        listarPersonagens(),
        buscarCatalogoLoja(),
      ]);

      const fichasNormalizadas = fichasApi.map((ficha) => ({
        ...ficha,
        personagem: {
          ...estadoInicial,
          ...(ficha.personagem || {}),
          lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
        },
      }));
      const catalogoNormalizado =
        catalogoApi.length > 0
          ? catalogoApi.map(normalizarItemLoja)
          : DEFAULT_CATALOGO_LOJA;

      setFichas(fichasNormalizadas);
      setCatalogo(catalogoNormalizado);
      localStorage.setItem(CATALOGO_STORAGE_KEY, JSON.stringify(catalogoNormalizado));

      if (fichasNormalizadas.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasNormalizadas[0].fichaId);
        setPersonagem(fichasNormalizadas[0].personagem);
      }
    } catch (error) {
      const fichasLocais = listarFichasLocais();
      const catalogoLocal = localStorage.getItem(CATALOGO_STORAGE_KEY);

      setFichas(fichasLocais);
      if (fichasLocais.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasLocais[0].fichaId);
        setPersonagem({
          ...estadoInicial,
          ...fichasLocais[0].personagem,
          lojaCreditos: fichasLocais[0].personagem?.lojaCreditos ?? 900,
        });
      }

      if (catalogoLocal) {
        try {
          setCatalogo(JSON.parse(catalogoLocal).map(normalizarItemLoja));
        } catch (parseError) {
          setCatalogo(DEFAULT_CATALOGO_LOJA);
        }
      }

      setMensagem("Backend indisponivel. Mostrando dados locais deste navegador.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fichaAtual) {
      setPersonagem({
        ...estadoInicial,
        ...fichaAtual.personagem,
        lojaCreditos: fichaAtual.personagem?.lojaCreditos ?? 900,
      });
    }
  }, [fichaAtual]);

  const atualizarPersonagem = (campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarGrupoFicha = (grupo, chave, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [grupo]: {
        ...(atual?.[grupo] || {}),
        [chave]: parseInt(valor, 10) || 0,
      },
    }));
  };

  const atualizarMembro = (membro, campo, valor) => {
    setPersonagem((atual) => {
      const membroAtual = atual?.membros?.[membro] || {
        atual: 0,
        max: 0,
        ferido: false,
        grave: false,
      };
      const atualizado = {
        ...membroAtual,
        [campo]: Math.max(0, parseInt(valor, 10) || 0),
      };
      const proporcao = atualizado.max > 0 ? atualizado.atual / atualizado.max : 0;

      return {
        ...atual,
        membros: {
          ...(atual?.membros || {}),
          [membro]: {
            ...atualizado,
            ferido: atualizado.atual < atualizado.max && proporcao < 0.5,
            grave: proporcao <= 0.1,
          },
        },
      };
    });
  };

  const atualizarItemInventario = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      inventario: (atual.inventario || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [campo]: valor } : item,
      ),
    }));
  };

  const atualizarRito = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      rituais: (atual.rituais || []).map((rito, ritoIndex) =>
        ritoIndex === index ? { ...rito, [campo]: valor } : rito,
      ),
    }));
  };

  const salvarFichaSelecionada = async (personagemAtualizado = personagem) => {
    if (!fichaSelecionada || !personagemAtualizado) return;

    salvarFichaLocal(fichaSelecionada, personagemAtualizado);
    setFichas((atuais) =>
      atuais.map((ficha) =>
        ficha.fichaId === fichaSelecionada
          ? { ...ficha, personagem: personagemAtualizado }
          : ficha,
      ),
    );

    try {
      await salvarPersonagem(fichaSelecionada, personagemAtualizado);
      setMensagem("Ficha salva.");
    } catch (error) {
      setMensagem("Ficha salva localmente. Backend indisponivel.");
    }
  };

  const criarNovaFicha = async (event) => {
    event.preventDefault();

    if (!novaFicha.nome.trim()) {
      setMensagem("Informe um nome para criar a ficha.");
      return;
    }

    const personagemCriado = {
      ...estadoInicial,
      ...novaFicha,
      nome: novaFicha.nome.trim(),
      classe: novaFicha.classe.trim(),
      especialidade: novaFicha.especialidade.trim(),
      lojaCreditos: 900,
      rituais: [],
      inventario: [],
    };

    try {
      const { fichaId, personagem: salvo } = await criarPersonagem(personagemCriado);
      salvarFichaLocal(fichaId, salvo);
      await carregarTudo();
      setFichaSelecionada(fichaId);
      setPersonagem(salvo);
      setNovaFicha(fichaVazia);
      setMensagem(`Ficha ${fichaId} criada.`);
    } catch (error) {
      const fichaId = normalizarFichaId(novaFicha.nome);
      salvarFichaLocal(fichaId, personagemCriado);
      setFichas((atuais) => [...atuais, { fichaId, personagem: personagemCriado }]);
      setFichaSelecionada(fichaId);
      setPersonagem(personagemCriado);
      setNovaFicha(fichaVazia);
      setMensagem("Ficha criada localmente. Backend indisponivel.");
    }
  };

  const apagarFichaSelecionada = async () => {
    if (!fichaSelecionada) return;

    const confirmado = window.confirm(`Apagar a ficha ${fichaSelecionada}?`);
    if (!confirmado) return;

    localStorage.removeItem(`${STORAGE_KEY}_${fichaSelecionada}`);

    try {
      await apagarPersonagem(fichaSelecionada);
    } catch (error) {
      setMensagem("Ficha removida localmente. Backend indisponivel.");
    }

    const restantes = fichas.filter((ficha) => ficha.fichaId !== fichaSelecionada);
    setFichas(restantes);
    setFichaSelecionada(restantes[0]?.fichaId || "");
    setPersonagem(restantes[0]?.personagem || null);
  };

  const adicionarCreditos = () => {
    const delta = parseInt(creditosDelta, 10) || 0;
    const atualizado = {
      ...personagem,
      lojaCreditos: Math.max(0, (parseInt(personagem.lojaCreditos, 10) || 0) + delta),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const adicionarItemInventario = (event) => {
    event.preventDefault();

    if (!itemInventario.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const atualizado = {
      ...personagem,
      inventario: [
        ...(personagem.inventario || []),
        {
          nome: itemInventario.nome.trim(),
          detalhes: itemInventario.detalhes.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setItemInventario(itemInventarioVazio);
    salvarFichaSelecionada(atualizado);
  };

  const removerItemInventario = (index) => {
    const atualizado = {
      ...personagem,
      inventario: (personagem.inventario || []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const adicionarRito = (event) => {
    event.preventDefault();

    if (!novoRito.nome.trim()) {
      setMensagem("Informe o nome do Rito.");
      return;
    }

    const atualizado = {
      ...personagem,
      rituais: [
        ...(personagem.rituais || []),
        {
          nome: novoRito.nome.trim(),
          custo: novoRito.custo.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setNovoRito(ritoVazio);
    salvarFichaSelecionada(atualizado);
  };

  const removerRito = (index) => {
    const atualizado = {
      ...personagem,
      rituais: (personagem.rituais || []).filter(
        (_, ritoIndex) => ritoIndex !== index,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const salvarCatalogo = async (catalogoAtualizado) => {
    const normalizado = catalogoAtualizado.map(normalizarItemLoja);
    setCatalogo(normalizado);
    localStorage.setItem(CATALOGO_STORAGE_KEY, JSON.stringify(normalizado));

    try {
      await salvarCatalogoLoja(normalizado);
      setMensagem("Catalogo da loja salvo.");
    } catch (error) {
      setMensagem("Catalogo salvo localmente. Backend indisponivel.");
    }
  };

  const adicionarItemLoja = (event) => {
    event.preventDefault();

    if (!novoItemLoja.nome.trim()) {
      setMensagem("Informe o nome do item da loja.");
      return;
    }

    salvarCatalogo([...catalogo, normalizarItemLoja(novoItemLoja, catalogo.length)]);
    setNovoItemLoja(itemLojaVazio);
  };

  const removerItemLoja = (id) => {
    salvarCatalogo(catalogo.filter((item) => item.id !== id));
  };

  return (
    <main className="mestre-page">
      <header className="mestre-header">
        <button className="mestre-voltar" onClick={() => { window.location.href = "/"; }}>
          <Icon path={mdiArrowLeft} size={0.9} />
          Inicio
        </button>
        <div>
          <span>Controle do narrador</span>
          <h1>Dashboard do Mestre</h1>
        </div>
        <button className="mestre-refresh" onClick={carregarTudo} disabled={carregando}>
          <Icon path={mdiRefresh} size={0.9} />
          {carregando ? "Carregando" : "Atualizar"}
        </button>
      </header>

      {mensagem && <p className="mestre-mensagem">{mensagem}</p>}

      <nav className="mestre-tabs" aria-label="Areas do dashboard">
        <button className={aba === "fichas" ? "ativa" : ""} onClick={() => setAba("fichas")}>
          Fichas
        </button>
        <button className={aba === "loja" ? "ativa" : ""} onClick={() => setAba("loja")}>
          Loja
        </button>
      </nav>

      {aba === "fichas" && (
        <section className="mestre-grid">
          <aside className="mestre-lista">
            <form className="mestre-criar" onSubmit={criarNovaFicha}>
              <h2>Adicionar ficha</h2>
              <input
                value={novaFicha.nome}
                onChange={(event) =>
                  setNovaFicha((atual) => ({ ...atual, nome: event.target.value }))
                }
                placeholder="Nome"
              />
              <div className="mestre-duplo">
                <input
                  value={novaFicha.classe}
                  onChange={(event) =>
                    setNovaFicha((atual) => ({ ...atual, classe: event.target.value }))
                  }
                  placeholder="Classe"
                />
                <input
                  value={novaFicha.pronome}
                  onChange={(event) =>
                    setNovaFicha((atual) => ({ ...atual, pronome: event.target.value }))
                  }
                  placeholder="Pronome"
                />
              </div>
              <input
                value={novaFicha.especialidade}
                onChange={(event) =>
                  setNovaFicha((atual) => ({
                    ...atual,
                    especialidade: event.target.value,
                  }))
                }
                placeholder="Especialidade"
              />
              <button type="submit">
                <Icon path={mdiAccountPlus} size={0.85} />
                Criar ficha
              </button>
            </form>

            <div className="mestre-fichas">
              {fichas.map((ficha) => (
                <button
                  key={ficha.fichaId}
                  className={fichaSelecionada === ficha.fichaId ? "ativa" : ""}
                  onClick={() => setFichaSelecionada(ficha.fichaId)}
                >
                  <strong>{ficha.personagem?.nome || ficha.fichaId}</strong>
                  <span>{ficha.fichaId}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="mestre-editor">
            {personagem ? (
              <>
                <div className="mestre-editor-topo">
                  <div>
                    <span>Ficha selecionada</span>
                    <h2>{personagem.nome || fichaSelecionada}</h2>
                    <p>{fichaSelecionada}</p>
                  </div>
                  <div className="mestre-acoes-ficha">
                    <button onClick={() => { window.location.href = `/?ficha=${encodeURIComponent(fichaSelecionada)}`; }}>
                      <Icon path={mdiOpenInNew} size={0.8} />
                      Abrir
                    </button>
                    <button className="perigo" onClick={apagarFichaSelecionada}>
                      <Icon path={mdiDeleteOutline} size={0.8} />
                      Apagar
                    </button>
                  </div>
                </div>

                <nav className="mestre-ficha-tabs" aria-label="Areas da ficha">
                  {abasFicha.map((abaItem) => (
                    <button
                      key={abaItem.id}
                      className={abaFicha === abaItem.id ? "ativa" : ""}
                      onClick={() => setAbaFicha(abaItem.id)}
                    >
                      {abaItem.nome}
                    </button>
                  ))}
                </nav>

                {abaFicha === "perfil" && (
                  <div className="mestre-ficha-secao">
                    <div className="mestre-form-grid">
                      <label>
                        Nome
                        <input
                          value={personagem.nome || ""}
                          onChange={(event) =>
                            atualizarPersonagem("nome", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Pronome
                        <input
                          value={personagem.pronome || ""}
                          onChange={(event) =>
                            atualizarPersonagem("pronome", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Classe
                        <input
                          value={personagem.classe || ""}
                          onChange={(event) =>
                            atualizarPersonagem("classe", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Especialidade
                        <input
                          value={personagem.especialidade || ""}
                          onChange={(event) =>
                            atualizarPersonagem("especialidade", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Sanidade atual
                        <input
                          type="number"
                          value={personagem.sanidade?.atual || 0}
                          onChange={(event) =>
                            setPersonagem((atual) => ({
                              ...atual,
                              sanidade: {
                                ...(atual.sanidade || {}),
                                atual: parseInt(event.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Sanidade maxima
                        <input
                          type="number"
                          value={personagem.sanidade?.max || 0}
                          onChange={(event) =>
                            setPersonagem((atual) => ({
                              ...atual,
                              sanidade: {
                                ...(atual.sanidade || {}),
                                max: parseInt(event.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Esperanca atual
                        <input
                          type="number"
                          value={personagem.esperanca?.atual || 0}
                          onChange={(event) =>
                            setPersonagem((atual) => ({
                              ...atual,
                              esperanca: {
                                ...(atual.esperanca || {}),
                                atual: parseInt(event.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Esperanca maxima
                        <input
                          type="number"
                          value={personagem.esperanca?.max || 0}
                          onChange={(event) =>
                            setPersonagem((atual) => ({
                              ...atual,
                              esperanca: {
                                ...(atual.esperanca || {}),
                                max: parseInt(event.target.value, 10) || 0,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>

                    <section className="mestre-creditos">
                      <div>
                        <span>Creditos da loja</span>
                        <strong>{personagem.lojaCreditos || 0} cr</strong>
                      </div>
                      <input
                        type="number"
                        value={creditosDelta}
                        onChange={(event) => setCreditosDelta(event.target.value)}
                      />
                      <button onClick={adicionarCreditos}>
                        <Icon path={mdiCashPlus} size={0.85} />
                        Aplicar
                      </button>
                    </section>
                  </div>
                )}

                {abaFicha === "ativos" && (
                  <div className="mestre-ficha-secao">
                    <h3>Atributos</h3>
                    <div className="mestre-valores-grid compacto">
                      {Object.entries(personagem.atributos || {}).map(([chave, valor]) => (
                        <label key={chave}>
                          {chave}
                          <input
                            type="number"
                            value={valor}
                            onChange={(event) =>
                              atualizarGrupoFicha("atributos", chave, event.target.value)
                            }
                          />
                        </label>
                      ))}
                    </div>

                    <h3>Ativos</h3>
                    <div className="mestre-valores-grid compacto">
                      {ativosFicha.map((ativo) => (
                        <label key={ativo.chave}>
                          {ativo.nome}
                          <input
                            type="number"
                            value={personagem.habilidadesCombate?.[ativo.chave] || 0}
                            onChange={(event) =>
                              atualizarGrupoFicha(
                                "habilidadesCombate",
                                ativo.chave,
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {abaFicha === "passivos" && (
                  <div className="mestre-ficha-secao">
                    <div className="mestre-valores-grid">
                      {passivosFicha.map((passivo) => (
                        <label key={passivo.chave}>
                          {passivo.nome}
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={personagem.habilidadesPassivas?.[passivo.chave] || 0}
                            onChange={(event) =>
                              atualizarGrupoFicha(
                                "habilidadesPassivas",
                                passivo.chave,
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {abaFicha === "ritos" && (
                  <div className="mestre-ficha-secao">
                    <form className="mestre-inventario-form" onSubmit={adicionarRito}>
                      <h3>Adicionar Rito</h3>
                      <input
                        value={novoRito.nome}
                        onChange={(event) =>
                          setNovoRito((atual) => ({
                            ...atual,
                            nome: event.target.value,
                          }))
                        }
                        placeholder="Nome do Rito"
                      />
                      <input
                        value={novoRito.custo}
                        onChange={(event) =>
                          setNovoRito((atual) => ({
                            ...atual,
                            custo: event.target.value,
                          }))
                        }
                        placeholder="Custo"
                      />
                      <button type="submit">
                        <Icon path={mdiPackageVariantClosedPlus} size={0.85} />
                        Adicionar
                      </button>
                    </form>

                    <div className="mestre-edit-lista">
                      {(personagem.rituais || []).map((rito, index) => (
                        <div key={`${rito.nome}-${index}`}>
                          <input
                            value={rito.nome || ""}
                            onChange={(event) =>
                              atualizarRito(index, "nome", event.target.value)
                            }
                            placeholder="Nome"
                          />
                          <input
                            value={rito.custo || ""}
                            onChange={(event) =>
                              atualizarRito(index, "custo", event.target.value)
                            }
                            placeholder="Custo"
                          />
                          <button onClick={() => removerRito(index)}>
                            <Icon path={mdiDeleteOutline} size={0.75} />
                          </button>
                        </div>
                      ))}
                      {(personagem.rituais || []).length === 0 && (
                        <p className="mestre-lista-vazia">Nenhum Rito cadastrado.</p>
                      )}
                    </div>
                  </div>
                )}

                {abaFicha === "inventario" && (
                  <div className="mestre-ficha-secao">
                    <form className="mestre-inventario-form" onSubmit={adicionarItemInventario}>
                      <h3>Adicionar item no inventario</h3>
                      <input
                        value={itemInventario.nome}
                        onChange={(event) =>
                          setItemInventario((atual) => ({
                            ...atual,
                            nome: event.target.value,
                          }))
                        }
                        placeholder="Item"
                      />
                      <input
                        value={itemInventario.detalhes}
                        onChange={(event) =>
                          setItemInventario((atual) => ({
                            ...atual,
                            detalhes: event.target.value,
                          }))
                        }
                        placeholder="Detalhes"
                      />
                      <button type="submit">
                        <Icon path={mdiPackageVariantClosedPlus} size={0.85} />
                        Adicionar
                      </button>
                    </form>

                    <div className="mestre-edit-lista">
                      {(personagem.inventario || []).map((item, index) => (
                        <div key={`${item.nome}-${index}`}>
                          <input
                            value={item.nome || ""}
                            onChange={(event) =>
                              atualizarItemInventario(index, "nome", event.target.value)
                            }
                            placeholder="Item"
                          />
                          <input
                            value={item.detalhes || ""}
                            onChange={(event) =>
                              atualizarItemInventario(
                                index,
                                "detalhes",
                                event.target.value,
                              )
                            }
                            placeholder="Detalhes"
                          />
                          <button onClick={() => removerItemInventario(index)}>
                            <Icon path={mdiDeleteOutline} size={0.75} />
                          </button>
                        </div>
                      ))}
                      {(personagem.inventario || []).length === 0 && (
                        <p className="mestre-lista-vazia">Inventario vazio.</p>
                      )}
                    </div>
                  </div>
                )}

                {abaFicha === "corpo" && (
                  <div className="mestre-ficha-secao">
                    <div className="mestre-corpo-grid">
                      {membrosFicha.map((membro) => {
                        const dados = personagem.membros?.[membro.chave] || {
                          atual: 0,
                          max: 0,
                          ferido: false,
                          grave: false,
                        };

                        return (
                          <div
                            key={membro.chave}
                            className={`mestre-membro ${dados.grave ? "grave" : dados.ferido ? "ferido" : ""}`}
                          >
                            <strong>{membro.nome}</strong>
                            <label>
                              Atual
                              <input
                                type="number"
                                min="0"
                                value={dados.atual}
                                onChange={(event) =>
                                  atualizarMembro(
                                    membro.chave,
                                    "atual",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                            <label>
                              Maximo
                              <input
                                type="number"
                                min="0"
                                value={dados.max}
                                onChange={(event) =>
                                  atualizarMembro(
                                    membro.chave,
                                    "max",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {abaFicha === "descricao" && (
                  <div className="mestre-ficha-secao">
                    <label>
                      Descricao do personagem
                      <textarea
                        className="mestre-descricao"
                        value={personagem.descricao || ""}
                        onChange={(event) =>
                          atualizarPersonagem("descricao", event.target.value)
                        }
                      />
                    </label>
                  </div>
                )}

                <button className="mestre-salvar" onClick={() => salvarFichaSelecionada()}>
                  Salvar edicoes da ficha
                </button>
              </>
            ) : (
              <div className="mestre-vazio">Nenhuma ficha selecionada.</div>
            )}
          </section>
        </section>
      )}

      {aba === "loja" && (
        <section className="mestre-loja">
          <form className="mestre-loja-form" onSubmit={adicionarItemLoja}>
            <h2>
              <Icon path={mdiStoreCogOutline} size={0.95} />
              Adicionar item na loja
            </h2>
            <div className="mestre-form-grid">
              <label>
                Nome
                <input
                  value={novoItemLoja.nome}
                  onChange={(event) =>
                    setNovoItemLoja((atual) => ({
                      ...atual,
                      nome: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Categoria
                <select
                  value={novoItemLoja.categoria}
                  onChange={(event) =>
                    setNovoItemLoja((atual) => ({
                      ...atual,
                      categoria: event.target.value,
                    }))
                  }
                >
                  {CATEGORIAS_LOJA.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Preco
                <input
                  type="number"
                  min="0"
                  value={novoItemLoja.preco}
                  onChange={(event) =>
                    setNovoItemLoja((atual) => ({
                      ...atual,
                      preco: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Entrega
                <input
                  value={novoItemLoja.entrega}
                  onChange={(event) =>
                    setNovoItemLoja((atual) => ({
                      ...atual,
                      entrega: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label>
              Detalhe
              <textarea
                value={novoItemLoja.detalhe}
                onChange={(event) =>
                  setNovoItemLoja((atual) => ({
                    ...atual,
                    detalhe: event.target.value,
                  }))
                }
              />
            </label>
            <button type="submit">Adicionar ao catalogo</button>
          </form>

          <div className="mestre-catalogo-area">
            <div className="mestre-categorias-loja" aria-label="Categorias do catalogo">
              {categoriasFiltroLoja.map((categoria) => {
                const quantidade =
                  categoria.id === "todos"
                    ? catalogo.length
                    : catalogo.filter((item) => item.categoria === categoria.id).length;

                return (
                  <button
                    key={categoria.id}
                    className={categoriaLojaAtiva === categoria.id ? "ativa" : ""}
                    onClick={() => setCategoriaLojaAtiva(categoria.id)}
                  >
                    <span>{categoria.nome}</span>
                    <strong>{quantidade}</strong>
                  </button>
                );
              })}
            </div>

            <div className="mestre-catalogo">
              {catalogoFiltrado.map((item) => (
                <article key={item.id}>
                  <div>
                    <span>{item.categoria}</span>
                    <h3>{item.nome}</h3>
                    <p>{item.detalhe}</p>
                    <small>{item.entrega}</small>
                  </div>
                  <strong>{item.preco} cr</strong>
                  <button onClick={() => removerItemLoja(item.id)}>
                    <Icon path={mdiDeleteOutline} size={0.8} />
                  </button>
                </article>
              ))}

              {catalogoFiltrado.length === 0 && (
                <div className="mestre-catalogo-vazio">
                  Nenhum item nesta categoria.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default DashboardMestre;
