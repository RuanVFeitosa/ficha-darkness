import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import "../CSS/ArvoreHabilidades.css";
import {
  buscarArvoresHabilidades,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import {
  notificarPersonagemAtualizado,
  ouvirArvoresAtualizadas,
  ouvirPersonagemAtualizado,
} from "../services/syncEvents";
import { estadoInicial } from "./fichaPersonagem";
import {
  obterArvoreClasse,
  salvarArvoresCustom,
} from "../data/Classes/arvoresHabilidades";

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

const obterFichaIdDaUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return normalizarFichaId(params.get("ficha"));
};

const estadoHabilidadesInicial = {
  habilidadeAbsoluta: "",
  aptidoes: {},
  especialidade: "",
  habilidadesEspecialidade: {},
  especialidadeDefinida: false,
};

// eslint-disable-next-line no-unused-vars
const obterCustoHabilidade = (habilidade = {}) => {
  const textoCusto = String(habilidade.custo || "");
  const textoDescricao = String(habilidade.descricao || "");
  const texto = `${textoCusto} ${textoDescricao}`;

  if (/passiva|rea[cç][aã]o|especial|n[ií]vel/i.test(textoCusto)) {
    const custoComPe = texto.match(/(\d+)\s*(?:pe|pontos?)/i);
    return custoComPe ? Number(custoComPe[1]) : 0;
  }

  const custo = texto.match(/(\d+)\s*(?:pe|pontos?)/i);
  return custo ? Number(custo[1]) : 0;
};

const CUSTO_APTIDAO = 10;
const CUSTO_HABILIDADE_ESPECIALIDADE = 20;

const obterCustoAptidao = () => CUSTO_APTIDAO;
const obterCustoHabilidadeEspecialidade = () => CUSTO_HABILIDADE_ESPECIALIDADE;

const ArvoreHabilidades = () => {
  const [carregandoFicha, setCarregandoFicha] = useState(true);
  const [fichaId] = useState(() => obterFichaIdDaUrl());
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState("");
  const [aptidaoAberta, setAptidaoAberta] = useState(null);
  const [habilidadeAberta, setHabilidadeAberta] = useState(null);
  const [arrastando, setArrastando] = useState(false);
  const [inicioArrasto, setInicioArrasto] = useState({ x: 0, y: 0 });
  const [posicaoMapa, setPosicaoMapa] = useState({ x: -300, y: -120 });

  const mapaRef = useRef(null);
  const animacaoRef = useRef(null);
  const posicaoMapaRef = useRef(posicaoMapa);
  const inicioArrastoRef = useRef(inicioArrasto);

  const [abaArvore, setAbaArvore] = useState("absolutas");

  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const arvoreBase =
    obterArvoreClasse(personagem.classeId || personagem.classe) || {};

  const arvore = {
    classe: "",
    titulo: "",
    beneficio: "",
    absolutas: [],
    bases: [],
    aptidoes: [],
    especialidades: [],
    ...arvoreBase,
  };

  const habilidadesClasse = {
    ...estadoHabilidadesInicial,
    ...(personagem.habilidadesClasse || {}),
  };

  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );

  const especialidadeSelecionada = (arvore.especialidades || []).find(
    (especialidade) => especialidade.id === habilidadesClasse.especialidade,
  );

  const precisaEscolherEspecialidade =
    (arvore.especialidades || []).length > 0 && !especialidadeSelecionada;

  useEffect(() => {
    let cancelado = false;

    const carregarFicha = async () => {
      setCarregandoFicha(true);

      let personagemCarregado = null;

      const dadosSalvos = localStorage.getItem(storageKey);

      if (dadosSalvos) {
        try {
          personagemCarregado = JSON.parse(dadosSalvos);
        } catch (error) {
          console.warn("Nao foi possivel carregar a ficha local.", error);
        }
      }

      try {
        const [personagemApi, arvoresApi] = await Promise.all([
          buscarPersonagem(fichaId),
          buscarArvoresHabilidades().catch((error) => {
            console.warn(
              "Nao foi possivel carregar arvores de habilidades.",
              error,
            );
            return null;
          }),
        ]);

        if (personagemApi) {
          personagemCarregado = personagemApi;
        }

        if (arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
        }
      } catch (error) {
        console.warn("Backend indisponivel. Arvore usando localStorage.");
      }

      const personagemFinal = personagemCarregado || estadoInicial;

      personagemFinal.habilidadesClasse = {
        ...estadoHabilidadesInicial,
        ...(personagemFinal.habilidadesClasse || {}),
      };

      if (!cancelado) {
        setPersonagem(personagemFinal);
        setCarregandoFicha(false);
      }
    };

    carregarFicha();

    return () => {
      cancelado = true;
    };
  }, [fichaId, storageKey]);

  useEffect(() => {
    let cancelado = false;

    const recarregarPersonagem = async ({ fichaId: fichaAtualizada } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaId) return;

      try {
        const personagemApi = await buscarPersonagem(fichaId);
        if (!cancelado && personagemApi) {
          personagemApi.habilidadesClasse = {
            ...estadoHabilidadesInicial,
            ...(personagemApi.habilidadesClasse || {}),
          };
          setPersonagem(personagemApi);
        }
      } catch (error) {
        const dadosSalvos = localStorage.getItem(storageKey);
        if (!cancelado && dadosSalvos) {
          try {
            const personagemLocal = JSON.parse(dadosSalvos);
            personagemLocal.habilidadesClasse = {
              ...estadoHabilidadesInicial,
              ...(personagemLocal.habilidadesClasse || {}),
            };
            setPersonagem(personagemLocal);
          } catch {
            console.warn("Nao foi possivel sincronizar a arvore local.");
          }
        }
      }
    };

    const recarregarArvores = async ({ arvores } = {}) => {
      if (arvores && Object.keys(arvores).length > 0) {
        salvarArvoresCustom(arvores);
        setPersonagem((atual) => ({ ...atual }));
        return;
      }

      try {
        const arvoresApi = await buscarArvoresHabilidades();
        if (!cancelado && arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setPersonagem((atual) => ({ ...atual }));
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar arvores.", error);
      }
    };

    const pararPersonagem = ouvirPersonagemAtualizado(recarregarPersonagem);
    const pararArvores = ouvirArvoresAtualizadas(recarregarArvores);
    const intervalo = setInterval(() => {
      recarregarPersonagem();
      recarregarArvores();
    }, 12000);

    return () => {
      cancelado = true;
      pararPersonagem();
      pararArvores();
      clearInterval(intervalo);
    };
  }, [fichaId, storageKey]);

  const salvarAtualizacao = (atualizacao, extras = {}) => {
    const atualizado = {
      ...personagem,
      ...extras,
      habilidadesClasse: {
        ...habilidadesClasse,
        ...atualizacao,
      },
    };

    setPersonagem(atualizado);
    setMensagem("Escolhas salvas na ficha.");

    try {
      localStorage.setItem(storageKey, JSON.stringify(atualizado));
      notificarPersonagemAtualizado(fichaId, atualizado);
    } catch (error) {
      console.warn("Nao foi possivel salvar a arvore localmente.", error);
    }

    salvarPersonagem(fichaId, atualizado).then((personagemSalvo) => {
      notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
    }).catch((error) => {
      console.warn("Backend indisponivel. Arvore salva localmente.", error);
    });
  };

  const voltarParaFicha = () => {
    window.location.href = `?ficha=${encodeURIComponent(fichaId)}`;
  };

  const criarPontosEvolucaoAtualizados = (novoSaldo) => ({
    ...(personagem.pontosEvolucao || {}),
    disponiveis: Math.max(0, novoSaldo),
  });

  const alternarAptidao = (aptidao) => {
    const custo = obterCustoAptidao();
    const aptidaoId = aptidao.id;
    const jaComprada = Boolean(habilidadesClasse.aptidoes?.[aptidaoId]);

    if (!jaComprada && pontosEvolucaoDisponiveis < custo) {
      setMensagem("Pontos de evolucao insuficientes para esta habilidade.");
      return;
    }

    salvarAtualizacao(
      {
        aptidoes: {
          ...habilidadesClasse.aptidoes,
          [aptidaoId]: !jaComprada,
        },
      },
      {
        pontosEvolucao: criarPontosEvolucaoAtualizados(
          jaComprada
            ? pontosEvolucaoDisponiveis + custo
            : pontosEvolucaoDisponiveis - custo,
        ),
      },
    );
  };

  const fecharAptidao = () => {
    setAptidaoAberta(null);
  };

  const fecharHabilidade = () => {
    setHabilidadeAberta(null);
  };

  const impedirArrastoAoTocarNoNo = (event) => {
    event.stopPropagation();
  };

  const selecionarEspecialidadeInicial = (especialidade) => {
    const habilidadesPermitidas = (especialidade.habilidades || []).map(
      (habilidade) => habilidade.id,
    );

    const habilidadesFiltradas = Object.fromEntries(
      Object.entries(habilidadesClasse.habilidadesEspecialidade || {}).filter(
        ([habilidadeId]) => habilidadesPermitidas.includes(habilidadeId),
      ),
    );

    salvarAtualizacao(
      {
        especialidade: especialidade.id,
        especialidadeDefinida: true,
        habilidadesEspecialidade: habilidadesFiltradas,
      },
      {
        especialidade: especialidade.nome,
      },
    );

    setAbaArvore("especialidade");
  };

  const encontrarHabilidadeNaArvore = (habilidadeId) => {
    for (const especialidade of arvore.especialidades || []) {
      const habilidades = especialidade.habilidades || [];
      const index = habilidades.findIndex(
        (habilidade) => habilidade.id === habilidadeId,
      );

      if (index !== -1) {
        return {
          especialidade,
          habilidades,
          index,
        };
      }
    }

    return null;
  };

  const podeComprarHabilidade = (habilidade) => {
    const dados = encontrarHabilidadeNaArvore(habilidade.id);

    if (!dados) return true;

    const { habilidades, index } = dados;

    if (index === 0) return true;

    const habilidadeAnterior = habilidades[index - 1];

    return Boolean(
      habilidadesClasse.habilidadesEspecialidade?.[habilidadeAnterior.id],
    );
  };

  const podeVenderHabilidade = (habilidade) => {
    const dados = encontrarHabilidadeNaArvore(habilidade.id);

    if (!dados) return true;

    const { habilidades, index } = dados;
    const habilidadeDepois = habilidades[index + 1];

    if (!habilidadeDepois) return true;

    return !habilidadesClasse.habilidadesEspecialidade?.[habilidadeDepois.id];
  };

  const alternarHabilidadeEspecialidade = (habilidade) => {
    const custo = obterCustoHabilidadeEspecialidade();
    const habilidadeId = habilidade.id;

    const jaComprada = Boolean(
      habilidadesClasse.habilidadesEspecialidade?.[habilidadeId],
    );

    if (!jaComprada && pontosEvolucaoDisponiveis < custo) {
      setMensagem("Pontos de evolucao insuficientes para esta habilidade.");
      return;
    }

    if (jaComprada && !podeVenderHabilidade(habilidade)) {
      setMensagem(
        "Você precisa vender as habilidades posteriores deste ramo antes de remover esta.",
      );
      return;
    }

    if (!jaComprada && !podeComprarHabilidade(habilidade)) {
      setMensagem(
        "Você precisa comprar a habilidade anterior deste ramo primeiro.",
      );
      return;
    }

    if (!jaComprada && pontosEvolucaoDisponiveis < custo) {
      setMensagem("Pontos de evolucao insuficientes para esta habilidade.");
      return;
    }

    salvarAtualizacao(
      {
        habilidadesEspecialidade: {
          ...habilidadesClasse.habilidadesEspecialidade,
          [habilidadeId]: !jaComprada,
        },
      },
      {
        pontosEvolucao: criarPontosEvolucaoAtualizados(
          jaComprada
            ? pontosEvolucaoDisponiveis + custo
            : pontosEvolucaoDisponiveis - custo,
        ),
      },
    );
  };

  const confirmarHabilidadeAberta = () => {
    if (!habilidadeAberta) return;

    alternarHabilidadeEspecialidade(habilidadeAberta);
  };

  const selecionarHabilidadeAbsoluta = (habilidade) => {
    salvarAtualizacao(
      {
        habilidadeAbsoluta: habilidade.id,
      },
      {
        habilidadeAbsolutaEscolhida: {
          id: habilidade.id,
          nome: habilidade.nome,
          custo: habilidade.custo || "",
          descricao: habilidade.descricao,
        },
      },
    );
  };
  const somarCustosComprados = (compradas = {}, itens = [], obterCusto) =>
    Object.entries(compradas).reduce((total, [itemId, comprado]) => {
      if (!comprado) return total;

      const item = itens.find((habilidade) => habilidade.id === itemId);
      return total + obterCusto(item || {});
    }, 0);

  const obterHabilidadesEspecialidade = () =>
    (arvore.especialidades || []).flatMap(
      (especialidade) => especialidade.habilidades || [],
    );

  const removerHabilidadesEspecialidade = () => {
    const totalDevolver = somarCustosComprados(
      habilidadesClasse.habilidadesEspecialidade,
      obterHabilidadesEspecialidade(),
      obterCustoHabilidadeEspecialidade,
    );

    salvarAtualizacao(
      {
        habilidadesEspecialidade: {},
      },
      {
        pontosEvolucao: criarPontosEvolucaoAtualizados(
          pontosEvolucaoDisponiveis + totalDevolver,
        ),
      },
    );
  };

  const removerAptidoes = () => {
    const totalDevolver = somarCustosComprados(
      habilidadesClasse.aptidoes,
      arvore.aptidoes || [],
      obterCustoAptidao,
    );

    salvarAtualizacao(
      {
        aptidoes: {},
      },
      {
        pontosEvolucao: criarPontosEvolucaoAtualizados(
          pontosEvolucaoDisponiveis + totalDevolver,
        ),
      },
    );
  };

  const removerTudoTrilha = () => {
    const totalHabilidades = somarCustosComprados(
      habilidadesClasse.habilidadesEspecialidade,
      obterHabilidadesEspecialidade(),
      obterCustoHabilidadeEspecialidade,
    );

    const totalAptidoes = somarCustosComprados(
      habilidadesClasse.aptidoes,
      arvore.aptidoes || [],
      obterCustoAptidao,
    );

    salvarAtualizacao(
      {
        aptidoes: {},
        habilidadesEspecialidade: {},
        especialidade: "",
        especialidadeDefinida: false,
      },
      {
        pontosEvolucao: criarPontosEvolucaoAtualizados(
          pontosEvolucaoDisponiveis + totalHabilidades + totalAptidoes,
        ),
        especialidade: "",
      },
    );
  };

  const removerHabilidadeAbsoluta = () => {
    salvarAtualizacao(
      {
        habilidadeAbsoluta: "",
      },
      {
        habilidadeAbsolutaEscolhida: null,
      },
    );
  };

  const aplicarTransformMapa = (x, y) => {
    if (!mapaRef.current) return;

    mapaRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const iniciarArrastoMapa = (event) => {
    if (event.target.closest("button")) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    setArrastando(true);

    inicioArrastoRef.current = {
      x: event.clientX - posicaoMapaRef.current.x,
      y: event.clientY - posicaoMapaRef.current.y,
    };
  };

  const moverMapa = (event) => {
    if (!arrastando) return;

    const novaPosicao = {
      x: event.clientX - inicioArrastoRef.current.x,
      y: event.clientY - inicioArrastoRef.current.y,
    };

    posicaoMapaRef.current = novaPosicao;

    if (animacaoRef.current) return;

    animacaoRef.current = requestAnimationFrame(() => {
      aplicarTransformMapa(novaPosicao.x, novaPosicao.y);
      animacaoRef.current = null;
    });
  };

  const pararArrastoMapa = () => {
    setArrastando(false);
    setPosicaoMapa(posicaoMapaRef.current);
  };

  const MAPA_LARGURA = 2600;
  const MAPA_ALTURA = 1600;
  const ROOT = { x: 1300, y: 1250 };

  const obterPontoHabilidade = (
    branchIndex,
    nodeIndex,
    totalBranches,
    totalHabilidades,
  ) => {
    const aberturaTotal = 165;

    const baseAngle =
      totalBranches === 1
        ? 270
        : 188 + (branchIndex * aberturaTotal) / (totalBranches - 1);

    // MAIS ESPAÇO ENTRE NÓS
    const angle = baseAngle + (nodeIndex - totalHabilidades / 2) * 4;

    // AUMENTA DISTÂNCIA ENTRE CADA HABILIDADE
    const radius = 200 + nodeIndex * 190;

    const rad = (angle * Math.PI) / 180;

    return {
      x: ROOT.x + Math.cos(rad) * radius,
      y: ROOT.y + Math.sin(rad) * radius,
    };
  };

  const obterPontoAptidao = (index, total) => {
    const colunas = 8;
    const coluna = index % colunas;
    const linha = Math.floor(index / colunas);

    const inicioX = ROOT.x - 740;
    const inicioY = ROOT.y - 850;

    const espacamentoX = 320;
    const espacamentoY = 230;

    return {
      x: inicioX + coluna * espacamentoX + (linha % 2) * 90,
      y: inicioY + linha * espacamentoY,
    };
  };

  const obterHabilidadesPorIndice = (indice) => {
    return (arvore.especialidades || [])
      .map((especialidade, branchIndex) => {
        const habilidades = especialidade.habilidades || [];
        if (!habilidades[indice]) return null;

        return {
          especialidade,
          habilidade: habilidades[indice],
          ponto: obterPontoHabilidade(
            branchIndex,
            indice,
            arvore.especialidades.length,
            habilidades.length,
          ),
        };
      })
      .filter(Boolean);
  };

  if (carregandoFicha) {
    return (
      <main className="arvore-page">
        <section className="arvore-em-breve">
          <h2>Carregando árvore...</h2>
          <p>Buscando as escolhas do personagem.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="arvore-page">
      <section className="arvore-hero">
        <button className="arvore-voltar" onClick={voltarParaFicha}>
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>

        <span>{personagem.classe || arvore.classe}</span>
        <h1>{arvore.titulo}</h1>
        <p>{arvore.beneficio}</p>

        <strong className="arvore-pontos">
          Pontos disponiveis: {pontosEvolucaoDisponiveis}
        </strong>
      </section>

      <nav className="arvore-abas">
        <button
          type="button"
          className={abaArvore === "absolutas" ? "ativa" : ""}
          onClick={() => setAbaArvore("absolutas")}
        >
          Habilidades Absolutas
        </button>

        <button
          type="button"
          className={abaArvore === "especialidade" ? "ativa" : ""}
          onClick={() => setAbaArvore("especialidade")}
        >
          Trilha de Especialidade
        </button>
      </nav>

      {(arvore.absolutas || []).length === 0 ? (
        <section className="arvore-em-breve">
          <h2>{arvore.classe}</h2>
          <p>
            A arvore desta classe ja esta preparada no sistema, mas as
            habilidades ainda precisam ser cadastradas.
          </p>
        </section>
      ) : (
        <section className="arvore-shell">
          {abaArvore === "absolutas" && (
            <div className="arvore-secao arvore-skilltree">
              {habilidadesClasse.habilidadeAbsoluta ? (
                <section className="absoluta-selecionada-card">
                  {(() => {
                    const habilidadeEscolhida = (arvore.absolutas || []).find(
                      (habilidade) =>
                        habilidade.id === habilidadesClasse.habilidadeAbsoluta,
                    );

                    if (!habilidadeEscolhida) return null;

                    return (
                      <>
                        <span>Habilidade Absoluta Escolhida</span>
                        <h2>{habilidadeEscolhida.nome}</h2>

                        {habilidadeEscolhida.custo && (
                          <strong>{habilidadeEscolhida.custo}</strong>
                        )}

                        <p>{habilidadeEscolhida.descricao}</p>

                        <button
                          type="button"
                          onClick={() =>
                            salvarAtualizacao({ habilidadeAbsoluta: "" })
                          }
                        >
                          Trocar Habilidade
                        </button>
                      </>
                    );
                  })()}
                </section>
              ) : (
                <div className="skilltree-viewport">
                  <div className="absolutas-tree-area">
                    <div className="skilltree-info-fixa">
                      <button
                        type="button"
                        className="absoluta-voltar-btn"
                        onClick={voltarParaFicha}
                      >
                        <Icon path={mdiArrowLeft} size={0.9} />
                        Voltar para Ficha
                      </button>
                    </div>

                    <svg className="absolutas-lines" viewBox="0 0 1600 900">
                      {(arvore.absolutas || []).map((habilidade, index) => {
                        const total = arvore.absolutas.length;

                        const root = {
                          x: 800,
                          y: 700,
                        };

                        const angle =
                          205 + (index * 130) / Math.max(total - 1, 1);

                        const radius = 430;

                        const rad = (angle * Math.PI) / 180;

                        const point = {
                          x: root.x + Math.cos(rad) * radius,
                          y: root.y + Math.sin(rad) * radius,
                        };

                        return (
                          <path
                            key={`absoluta-line-${habilidade.id}`}
                            d={`M ${root.x} ${root.y} Q ${
                              (root.x + point.x) / 2
                            } ${
                              (root.y + point.y) / 2 - 100
                            } ${point.x} ${point.y}`}
                            className="skilltree-path"
                          />
                        );
                      })}
                    </svg>

                    <button type="button" className="absolutas-root">
                      <strong>{arvore.classe || personagem.classe}</strong>
                    </button>

                    {(arvore.absolutas || []).map((habilidade, index) => {
                      const total = arvore.absolutas.length;

                      const root = {
                        x: 800,
                        y: 700,
                      };

                      const angle =
                        205 + (index * 130) / Math.max(total - 1, 1);

                      const radius = 430;

                      const rad = (angle * Math.PI) / 180;

                      const point = {
                        x: root.x + Math.cos(rad) * radius,
                        y: root.y + Math.sin(rad) * radius,
                      };

                      return (
                        <button
                          key={habilidade.id}
                          type="button"
                          className="skilltree-node absoluta-node"
                          style={{
                            left: `${point.x}px`,
                            top: `${point.y}px`,
                          }}
                          onClick={() =>
                            salvarAtualizacao({
                              habilidadeAbsoluta: habilidade.id,
                            })
                          }
                          onPointerDown={impedirArrastoAoTocarNoNo}
                        >
                          <strong>{habilidade.nome}</strong>

                          <div className="skilltree-tooltip">
                            <h4>{habilidade.nome}</h4>
                            <p>{habilidade.descricao}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {abaArvore === "especialidade" && (
            <div className="arvore-secao arvore-skilltree">
              <div
                className={`skilltree-viewport ${arrastando ? "arrastando" : ""}`}
                onPointerDown={iniciarArrastoMapa}
                onPointerMove={moverMapa}
                onPointerUp={pararArrastoMapa}
                onPointerCancel={pararArrastoMapa}
                onPointerLeave={pararArrastoMapa}
              >
                <strong className="trilha-pontos">
                  Pontos disponiveis: {pontosEvolucaoDisponiveis}
                </strong>
                <div className="trilha-acoes-flutuantes">
                  <button
                    type="button"
                    onClick={removerHabilidadesEspecialidade}
                  >
                    Remover Habilidades
                  </button>

                  <button type="button" onClick={removerAptidoes}>
                    Remover Aptidões
                  </button>

                  <button
                    type="button"
                    className="perigo"
                    onClick={removerTudoTrilha}
                  >
                    Remover Tudo
                  </button>
                </div>
                <div
                  ref={mapaRef}
                  className="skilltree-area"
                  style={{
                    transform: `translate3d(${posicaoMapa.x}px, ${posicaoMapa.y}px, 0)`,
                  }}
                >

                  <svg
                    className="skilltree-lines"
                    viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
                  >
                    {(arvore.especialidades || []).map(
                      (especialidade, branchIndex) => {
                        const habilidades = especialidade.habilidades || [];
                        const totalBranches = arvore.especialidades.length;

                        return habilidades.map((habilidade, index) => {
                          const atual = obterPontoHabilidade(
                            branchIndex,
                            index,
                            totalBranches,
                            habilidades.length,
                          );

                          const anterior =
                            index === 0
                              ? ROOT
                              : obterPontoHabilidade(
                                  branchIndex,
                                  index - 1,
                                  totalBranches,
                                  habilidades.length,
                                );

                          return (
                            <path
                              key={`ramo-${especialidade.id}-${habilidade.id}`}
                              d={`M ${anterior.x} ${anterior.y} Q ${(anterior.x + atual.x) / 2} ${
                                (anterior.y + atual.y) / 2 - 70
                              } ${atual.x} ${atual.y}`}
                              className="skilltree-path"
                            />
                          );
                        });
                      },
                    )}

                    {(arvore.aptidoes || []).map((aptidao, index) => {
                      const pontoAptidao = obterPontoAptidao(
                        index,
                        arvore.aptidoes.length,
                      );
                      const nivelLigacao = index % 5;
                      const habilidadesAlvo =
                        obterHabilidadesPorIndice(nivelLigacao);

                      return habilidadesAlvo.map(({ habilidade, ponto }) => (
                        <path
                          key={`teia-${aptidao.id}-${habilidade.id}`}
                          d={`M ${pontoAptidao.x} ${pontoAptidao.y} Q ${
                            (pontoAptidao.x + ponto.x) / 2
                          } ${(pontoAptidao.y + ponto.y) / 2 - 90} ${ponto.x} ${ponto.y}`}
                          className="skilltree-web-path"
                        />
                      ));
                    })}
                  </svg>

                  <button type="button" className="skilltree-root">
                    <strong>{arvore.classe || personagem.classe}</strong>
                  </button>
                  {(arvore.especialidades || []).map(
                    (especialidade, branchIndex) => {
                      const habilidades = especialidade.habilidades || [];
                      const totalBranches = arvore.especialidades.length;

                      return habilidades.map((habilidade, index) => {
                        const point = obterPontoHabilidade(
                          branchIndex,
                          index,
                          totalBranches,
                          habilidades.length,
                        );

                        const comprada = Boolean(
                          habilidadesClasse.habilidadesEspecialidade?.[
                            habilidade.id
                          ],
                        );

                        return (
                          <button
                            key={habilidade.id}
                            type="button"
                            className={`skilltree-node ${
                              comprada ? "comprada" : ""
                            } ${
                              !comprada && !podeComprarHabilidade(habilidade)
                                ? "bloqueada"
                                : ""
                            }`}
                            style={{
                              left: `${point.x}px`,
                              top: `${point.y}px`,
                            }}
                            onClick={() => setHabilidadeAberta(habilidade)}
                            onPointerDown={impedirArrastoAoTocarNoNo}
                          >
                            <strong>{habilidade.nome}</strong>

                            <div className="skilltree-tooltip">
                              <h4>{habilidade.nome}</h4>
                              <p>{habilidade.descricao}</p>
                            </div>
                          </button>
                        );
                      });
                    },
                  )}
                  {(arvore.aptidoes || []).map((aptidao, index) => {
                    const point = obterPontoAptidao(
                      index,
                      arvore.aptidoes.length,
                    );

                    const comprada = Boolean(
                      habilidadesClasse.aptidoes?.[aptidao.id],
                    );

                    return (
                      <button
                        key={aptidao.id}
                        type="button"
                        className={`skilltree-node skilltree-aptidao-node ${
                          comprada ? "comprada" : ""
                        }`}
                        style={{
                          left: `${point.x}px`,
                          top: `${point.y}px`,
                        }}
                        onClick={() => setAptidaoAberta(aptidao)}
                        onPointerDown={impedirArrastoAoTocarNoNo}
                      >
                        <strong>{aptidao.nome}</strong>

                        <div className="skilltree-tooltip">
                          <h4>{aptidao.nome}</h4>
                          <p>{aptidao.descricao}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="arvore-acoes-flutuantes">
        {habilidadesClasse.habilidadeAbsoluta && abaArvore === "absolutas" && (
          <button
            type="button"
            className="arvore-voltar-upgrade"
            onClick={() => {
              window.location.href = `?ficha=${encodeURIComponent(fichaId)}`;
            }}
          >
            VOLTAR PARA FICHA
          </button>
        )}

        {mensagem && <p className="arvore-mensagem">{mensagem}</p>}
      </div>
      {aptidaoAberta && (
        <div className="aptidao-modal-backdrop" onClick={fecharAptidao}>
          <section
            className="aptidao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aptidao-modal-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="arvore-no-tipo">
              Custo: {obterCustoAptidao()} pontos ||{" "}
              {aptidaoAberta.custo || "Sem custo"}
            </span>
            <h2 id="aptidao-modal-titulo">{aptidaoAberta.nome}</h2>
            <p>{aptidaoAberta.descricao}</p>

            <div className="aptidao-modal-acoes">
              <button type="button" onClick={fecharAptidao}>
                Fechar
              </button>

              <button
                type="button"
                className="primario"
                onClick={() => alternarAptidao(aptidaoAberta)}
              >
                {habilidadesClasse.aptidoes?.[aptidaoAberta.id]
                  ? "Remover aptidao"
                  : "Pegar aptidao"}
              </button>
            </div>
          </section>
        </div>
      )}
      {habilidadeAberta && (
        <div
          className="aptidao-modal-backdrop habilidade-modal-backdrop"
          onClick={fecharHabilidade}
        >
          <section
            className="aptidao-modal habilidade-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habilidade-modal-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="arvore-no-tipo">
              Custo: {obterCustoHabilidadeEspecialidade()} pontos
              {habilidadeAberta.custo ? ` || ${habilidadeAberta.custo}` : ""}
            </span>

            <h2 id="habilidade-modal-titulo">{habilidadeAberta.nome}</h2>
            <p>{habilidadeAberta.descricao}</p>

            <div className="aptidao-modal-acoes habilidade-modal-acoes">
              <button type="button" onClick={fecharHabilidade}>
                Voltar
              </button>

              <button
                type="button"
                className="primario"
                onClick={confirmarHabilidadeAberta}
              >
                {habilidadesClasse.habilidadesEspecialidade?.[
                  habilidadeAberta.id
                ]
                  ? "Remover habilidade"
                  : "Adquirir habilidade"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default ArvoreHabilidades;
