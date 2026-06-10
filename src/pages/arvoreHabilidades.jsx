import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import "../CSS/ArvoreHabilidades.css";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { estadoInicial } from "./fichaPersonagem";
import { obterArvoreClasse } from "../data/Classes/arvoresHabilidades";

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

const obterCustoHabilidade = (habilidade = {}, tipo = "aptidao") => {
  if (tipo === "especialidade") {
    return 20;
  }
  return 10;
};

const ArvoreHabilidades = () => {
  const [carregandoFicha, setCarregandoFicha] = useState(true);
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState("");
  const [aptidaoAberta, setAptidaoAberta] = useState(null);
  const [modalEspecialidadeAberto, setModalEspecialidadeAberto] =
    useState(false);
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
    if (carregandoFicha) return;

    const especialidadeJaDefinida =
      Boolean(habilidadesClasse.especialidadeDefinida) ||
      Boolean(habilidadesClasse.especialidade);

    setModalEspecialidadeAberto(
      (arvore.especialidades || []).length > 0 && !especialidadeJaDefinida,
    );
  }, [
    carregandoFicha,
    arvore.especialidades.length,
    habilidadesClasse.especialidade,
    habilidadesClasse.especialidadeDefinida,
  ]);

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
        const personagemApi = await buscarPersonagem(fichaId);

        if (personagemApi) {
          personagemCarregado = personagemApi;
        }
      } catch (error) {
        console.warn("Backend indisponivel. Arvore usando localStorage.");
      }

      if (!cancelado) {
        setPersonagem(personagemCarregado || estadoInicial);
        setCarregandoFicha(false);
      }
    };

    carregarFicha();

    return () => {
      cancelado = true;
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
    } catch (error) {
      console.warn("Nao foi possivel salvar a arvore localmente.", error);
    }

    salvarPersonagem(fichaId, atualizado).catch((error) => {
      console.warn("Backend indisponivel. Arvore salva localmente.", error);
    });
  };

  const voltarParaFicha = () => {
    window.location.href = `?ficha=${encodeURIComponent(fichaId)}`;
  };

  const alternarAptidao = (aptidao) => {
    const custo = obterCustoHabilidade(aptidao, "aptidao");
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
        pontosEvolucao: {
          ...(personagem.pontosEvolucao || {}),
          disponiveis: jaComprada
            ? pontosEvolucaoDisponiveis + custo
            : pontosEvolucaoDisponiveis - custo,
        },
      },
    );
  };

  const fecharAptidao = () => {
    setAptidaoAberta(null);
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

    setModalEspecialidadeAberto(false);
    setAbaArvore("especialidade");
  };

  const alternarHabilidadeEspecialidade = (habilidade) => {
    const custo = obterCustoHabilidade(habilidade, "especialidade");
    const habilidadeId = habilidade.id;
    const jaComprada = Boolean(
      habilidadesClasse.habilidadesEspecialidade?.[habilidadeId],
    );

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
        pontosEvolucao: {
          ...(personagem.pontosEvolucao || {}),
          disponiveis: jaComprada
            ? pontosEvolucaoDisponiveis + custo
            : pontosEvolucaoDisponiveis - custo,
        },
      },
    );
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
          Pontos de evolucao: {pontosEvolucaoDisponiveis}
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
          className={abaArvore === "aptidoes" ? "ativa" : ""}
          onClick={() => setAbaArvore("aptidoes")}
        >
          Aptidões
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
            <div className="arvore-secao arvore-obrigatoria">
              <div className="arvore-secao-titulo">
                <span>Inicio</span>
                <h2>Escolha uma Habilidade Absoluta</h2>
              </div>

              <div className="arvore-grade absolutas-grade">
                {(arvore.absolutas || []).map((habilidade) => {
                  const selecionada =
                    habilidadesClasse.habilidadeAbsoluta === habilidade.id;

                  return (
                    <button
                      key={habilidade.id}
                      type="button"
                      className={`arvore-no ${
                        selecionada ? "selecionado" : ""
                      }`}
                      onClick={() =>
                        salvarAtualizacao({ habilidadeAbsoluta: habilidade.id })
                      }
                    >
                      <span className="arvore-no-tipo">Absoluta</span>
                      <strong>{habilidade.nome}</strong>
                      <p>{habilidade.descricao}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {abaArvore === "aptidoes" && (
            <div className="arvore-secao">
              <div className="arvore-secao-titulo">
                <span>Pontos livres</span>
                <h2>Aptidões</h2>
              </div>

              <div className="arvore-grade aptidoes-grade">
                {(arvore.aptidoes || []).map((aptidao) => {
                  const comprada = Boolean(
                    habilidadesClasse.aptidoes?.[aptidao.id],
                  );

                  return (
                    <button
                      key={aptidao.id}
                      type="button"
                      className={`arvore-no aptidao-no ${
                        comprada ? "selecionado" : ""
                      }`}
                      onClick={() => setAptidaoAberta(aptidao)}
                    >
                      <span className="arvore-no-tipo">{aptidao.custo}</span>
                      <strong>{aptidao.nome}</strong>
                      <p>{comprada ? "Adquirida" : "Ver detalhes"}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {abaArvore === "especialidade" && (
            <div
              className={`arvore-secao ${
                precisaEscolherEspecialidade
                  ? "arvore-especialidade-obrigatoria"
                  : ""
              }`}
            >
              <div className="arvore-secao-titulo">
                <span>Especialidade</span>

                <h2>
                  {precisaEscolherEspecialidade
                    ? "Escolha sua especialidade para liberar a trilha"
                    : "Trilha de especialidade"}
                </h2>

                <p>
                  {precisaEscolherEspecialidade
                    ? "A especialidade define quais habilidades avançadas ficarão disponíveis para compra."
                    : "Sua especialidade define as habilidades exclusivas que você pode adquirir nesta trilha."}
                </p>
              </div>

              {!especialidadeSelecionada && (
                <div className="especialidade-bloqueada">
                  <strong>Nenhuma especialidade escolhida.</strong>
                  <p>
                    Escolha uma especialidade no modal inicial para revelar a
                    passiva inicial e as habilidades disponíveis para compra.
                  </p>
                </div>
              )}

              {especialidadeSelecionada && (
                <>
                  <article className="especialidade-passiva">
                    <span>Passiva inicial</span>
                    <strong>{especialidadeSelecionada.nome}</strong>
                    <p>{especialidadeSelecionada.passiva}</p>
                  </article>

                  <div className="arvore-linha-especialidade">
                    {(especialidadeSelecionada?.habilidades || []).map(
                      (habilidade) => {
                        const comprada = Boolean(
                          habilidadesClasse.habilidadesEspecialidade?.[
                            habilidade.id
                          ],
                        );

                        return (
                          <button
                            key={habilidade.id}
                            type="button"
                            className={`arvore-no especialidade-no ${
                              comprada ? "selecionado" : ""
                            }`}
                            onClick={() =>
                              alternarHabilidadeEspecialidade(habilidade)
                            }
                          >
                            <span className="arvore-no-tipo">
                              Nivel {habilidade.nivel}
                            </span>
                            <strong>{habilidade.nome}</strong>
                            <p>{habilidade.descricao}</p>
                          </button>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {mensagem && <p className="arvore-mensagem">{mensagem}</p>}

      {modalEspecialidadeAberto && (
        <div className="especialidade-modal-backdrop">
          <section className="especialidade-modal">
            <span>Escolha obrigatória</span>

            <h2>Escolha sua Especialidade</h2>

            <p>
              Essa escolha define quais habilidades de especialidade ficarão
              disponíveis para compra. Depois de escolhida, as outras trilhas
              serão removidas da árvore.
            </p>

            <div className="especialidade-modal-lista">
              {(arvore.especialidades || []).map((especialidade) => (
                <button
                  key={especialidade.id}
                  type="button"
                  className="especialidade-modal-card"
                  onClick={() => selecionarEspecialidadeInicial(especialidade)}
                >
                  <strong>{especialidade.nome}</strong>
                  <p>{especialidade.passiva}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

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
              10 Pontos de Evolução || {aptidaoAberta.custo}
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
    </main>
  );
};

export default ArvoreHabilidades;
