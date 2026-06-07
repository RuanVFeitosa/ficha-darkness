import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import "../CSS/ArvoreHabilidades.css";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { estadoInicial } from "./fichaPersonagem";
import { obterArvoreClasse } from "../data/arvoresHabilidades";

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
};

const obterCustoHabilidade = (habilidade = {}) => {
  const custo = String(habilidade.custo || "");

  if (/passiva/i.test(custo)) {
    return 0;
  }

  const encontrado = custo.match(/\d+/);
  return encontrado ? parseInt(encontrado[0], 10) : 1;
};

const ArvoreHabilidades = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState("");
  const [aptidaoAberta, setAptidaoAberta] = useState(null);
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const arvore = obterArvoreClasse(personagem);
  const habilidadesClasse = {
    ...estadoHabilidadesInicial,
    ...(personagem.habilidadesClasse || {}),
  };
  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );
  const especialidadeSelecionada =
    arvore.especialidades.find(
      (especialidade) => especialidade.id === habilidadesClasse.especialidade,
    ) || arvore.especialidades[0];

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(storageKey);

    if (dadosSalvos) {
      try {
        setPersonagem(JSON.parse(dadosSalvos));
      } catch (error) {
        console.warn("Nao foi possivel carregar a ficha local.", error);
      }
    }

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi) {
          setPersonagem(personagemApi);
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Arvore usando localStorage.");
      });
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
    const custo = obterCustoHabilidade(aptidao);
    const aptidaoId = aptidao.id;
    const jaComprada = Boolean(habilidadesClasse.aptidoes?.[aptidaoId]);

    if (!jaComprada && pontosEvolucaoDisponiveis < custo) {
      setMensagem("Pontos de evolucao insuficientes para esta habilidade.");
      return;
    }

    salvarAtualizacao({
      aptidoes: {
        ...habilidadesClasse.aptidoes,
        [aptidaoId]: !jaComprada,
      },
    }, {
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis: jaComprada
          ? pontosEvolucaoDisponiveis + custo
          : pontosEvolucaoDisponiveis - custo,
      },
    });
  };

  const fecharAptidao = () => {
    setAptidaoAberta(null);
  };

  const selecionarEspecialidade = (especialidade) => {
    salvarAtualizacao(
      { especialidade: especialidade.id },
      { especialidade: especialidade.nome },
    );
  };

  const alternarHabilidadeEspecialidade = (habilidade) => {
    const custo = obterCustoHabilidade(habilidade);
    const habilidadeId = habilidade.id;
    const jaComprada = Boolean(
      habilidadesClasse.habilidadesEspecialidade?.[habilidadeId],
    );

    if (!jaComprada && pontosEvolucaoDisponiveis < custo) {
      setMensagem("Pontos de evolucao insuficientes para esta habilidade.");
      return;
    }

    salvarAtualizacao({
      habilidadesEspecialidade: {
        ...habilidadesClasse.habilidadesEspecialidade,
        [habilidadeId]: !jaComprada,
      },
    }, {
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis: jaComprada
          ? pontosEvolucaoDisponiveis + custo
          : pontosEvolucaoDisponiveis - custo,
      },
    });
  };

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

      {arvore.absolutas.length === 0 ? (
        <section className="arvore-em-breve">
          <h2>{arvore.classe}</h2>
          <p>
            A arvore desta classe ja esta preparada no sistema, mas as
            habilidades ainda precisam ser cadastradas.
          </p>
        </section>
      ) : (
        <section className="arvore-shell">
          <div className="arvore-secao arvore-obrigatoria">
            <div className="arvore-secao-titulo">
              <span>Inicio</span>
              <h2>Escolha uma Habilidade Absoluta</h2>
            </div>

            <div className="arvore-grade absolutas-grade">
              {arvore.absolutas.map((habilidade) => {
                const selecionada =
                  habilidadesClasse.habilidadeAbsoluta === habilidade.id;

                return (
                  <button
                    key={habilidade.id}
                    type="button"
                    className={`arvore-no ${selecionada ? "selecionado" : ""}`}
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

          <div className="arvore-secao">
            <div className="arvore-secao-titulo">
              <span>Classe</span>
              <h2>Tracos iniciais</h2>
            </div>

            <div className="arvore-grade base-grade">
              {arvore.bases.map((habilidade) => (
                <article key={habilidade.id} className="arvore-no fixo">
                  <span className="arvore-no-tipo">Classe</span>
                  <strong>{habilidade.nome}</strong>
                  <p>{habilidade.descricao}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="arvore-secao">
            <div className="arvore-secao-titulo">
              <span>Pontos livres</span>
              <h2>Aptidoes</h2>
            </div>

            <div className="arvore-grade aptidoes-grade">
              {arvore.aptidoes.map((aptidao) => {
                const comprada = Boolean(habilidadesClasse.aptidoes?.[aptidao.id]);

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

          <div className="arvore-secao">
            <div className="arvore-secao-titulo">
              <span>Especialidade</span>
              <h2>Escolha seu caminho</h2>
            </div>

            <div className="especialidades-seletor">
              {arvore.especialidades.map((especialidade) => {
                const ativa = especialidadeSelecionada?.id === especialidade.id;

                return (
                  <button
                    key={especialidade.id}
                    type="button"
                    className={`especialidade-chip ${ativa ? "ativa" : ""}`}
                    onClick={() => selecionarEspecialidade(especialidade)}
                  >
                    {especialidade.nome}
                  </button>
                );
              })}
            </div>

            {especialidadeSelecionada && (
              <>
                <article className="especialidade-passiva">
                  <span>Passiva inicial</span>
                  <strong>{especialidadeSelecionada.nome}</strong>
                  <p>{especialidadeSelecionada.passiva}</p>
                </article>

                <div className="arvore-linha-especialidade">
                  {especialidadeSelecionada.habilidades.map((habilidade) => {
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
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {mensagem && <p className="arvore-mensagem">{mensagem}</p>}

      {aptidaoAberta && (
        <div className="aptidao-modal-backdrop" onClick={fecharAptidao}>
          <section
            className="aptidao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aptidao-modal-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{aptidaoAberta.custo}</span>
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
