import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import "../CSS/UpgradeNivel.css";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { notificarPersonagemAtualizado } from "../services/syncEvents";
import { estadoInicial } from "./fichaPersonagem";
import {
  ATRIBUTOS_UPGRADE,
  TABELA_EVOLUCAO,
  obterCustosNivel,
} from "../data/evolucaoPersonagem";

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
  return normalizarFichaId(
    params.get("senha") || params.get("codigo") || params.get("ficha"),
  );
};

const montarUrlFicha = (personagem, fichaId, destino = "") => {
  const nomeUrl = normalizarFichaId(personagem?.nome || fichaId);
  const params = new URLSearchParams({
    ficha: nomeUrl,
    senha: fichaId,
  });

  return destino ? `${destino}&${params.toString()}` : `?${params.toString()}`;
};

const UpgradeNivel = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [trilha, setTrilha] = useState("atributos");
  const [distribuicao, setDistribuicao] = useState({});
  const [mensagem, setMensagem] = useState("");
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
  const passouDoNivel5 = nivelAtual > 5;

  const limitesUpgrade = {
    passivos: passouDoNivel5 ? 20 : 10,
    atributos: passouDoNivel5 ? 100 : 50,
  };

  // REMOVIDO: custos por trilha, agora usamos pontos disponíveis diretamente
  const custos =
    TABELA_EVOLUCAO.find((linha) => linha.nivel === nivelAtual) ||
    obterCustosNivel(nivelAtual);

  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );

  // Pontos disponíveis para gastar na trilha (todos os pontos disponíveis)
  const pontosDisponiveisNaTrilha = pontosEvolucaoDisponiveis;

  // REMOVIDO: custoPorMelhoria - agora cada ponto gasto é 1 ponto

  const pontosDistribuidos = useMemo(
    () =>
      Object.values(distribuicao).reduce(
        (total, valor) => total + Math.max(0, parseInt(valor, 10) || 0),
        0,
      ),
    [distribuicao],
  );

  const pontosRestantes = Math.max(
    0,
    pontosDisponiveisNaTrilha - pontosDistribuidos,
  );

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
        console.warn("Backend indisponivel. Upgrade usando localStorage.");
      });
  }, [fichaId, storageKey]);

  const voltarParaFicha = () => {
    window.location.href = montarUrlFicha(personagem, fichaId);
  };

  const abrirArvore = () => {
    window.location.href = montarUrlFicha(
      personagem,
      fichaId,
      "?habilidades=1",
    );
  };

  const alterarTrilha = (novaTrilha) => {
    setTrilha(novaTrilha);
    setDistribuicao({});
    setMensagem("");
  };

  const atualizarDistribuicao = (chave, valor) => {
    const numero = Math.max(0, parseInt(valor, 10) || 0);

    const valorAtual =
      trilha === "atributos"
        ? personagem.atributos?.[chave] || 0
        : personagem.habilidadesPassivas?.[chave] || 0;

    const limite =
      trilha === "atributos"
        ? limitesUpgrade.atributos
        : limitesUpgrade.passivos;

    const maximoPorLimite = Math.max(0, limite - valorAtual);

    const outrosPontos = Object.entries(distribuicao).reduce(
      (total, [itemChave, itemValor]) => {
        if (itemChave === chave) return total;
        return total + Math.max(0, parseInt(itemValor, 10) || 0);
      },
      0,
    );

    const maximoPorPontos = Math.max(
      0,
      pontosDisponiveisNaTrilha - outrosPontos,
    );

    const valorPermitido = Math.min(numero, maximoPorLimite, maximoPorPontos);

    if (numero > valorPermitido) {
      setMensagem(
        `Limite atingido. ${
          trilha === "atributos" ? "Atributos" : "Passivos"
        } podem ir até ${limite}.`,
      );
    } else {
      setMensagem("");
    }

    setDistribuicao((atual) => ({
      ...atual,
      [chave]: valorPermitido,
    }));
  };

  const [modal, setModal] = useState({
    aberto: false,
    tipo: "quantidade", // "quantidade" ou "confirmacao"
    titulo: "",
    mensagem: "",
    valor: 1,
    maximo: 0,
    onConfirm: null,
    onCancel: null,
    detalhes: [],
    cor: "gold",
  });

  // Abrir modal de quantidade
  const abrirModalQuantidade = (
    titulo,
    mensagem,
    valorInicial,
    maximo,
    onConfirm,
  ) => {
    setModal({
      aberto: true,
      tipo: "quantidade",
      titulo,
      mensagem,
      valor: valorInicial,
      maximo,
      onConfirm,
      onCancel: null,
      detalhes: [],
      cor: "gold",
    });
  };

  // Abrir modal de confirmação
  const abrirModalConfirmacao = (
    titulo,
    mensagem,
    detalhes,
    cor,
    onConfirm,
    onCancel,
  ) => {
    setModal({
      aberto: true,
      tipo: "confirmacao",
      titulo,
      mensagem,
      valor: 1,
      maximo: 0,
      onConfirm,
      onCancel: onCancel || (() => fecharModal()),
      detalhes: detalhes || [],
      cor: cor || "red",
    });
  };

  // Fechar modal
  const fecharModal = () => {
    setModal({
      aberto: false,
      tipo: "quantidade",
      titulo: "",
      mensagem: "",
      valor: 1,
      maximo: 0,
      onConfirm: null,
      onCancel: null,
      detalhes: [],
      cor: "gold",
    });
  };

  const [notificacao, setNotificacao] = useState({
    visivel: false,
    mensagem: "",
    tipo: "sucesso", // "sucesso", "erro", "info"
  });

  // Mostrar notificação
  const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
    setNotificacao({
      visivel: true,
      mensagem,
      tipo,
    });

    // Auto-esconder após 4 segundos
    setTimeout(() => {
      setNotificacao({
        visivel: false,
        mensagem: "",
        tipo: "sucesso",
      });
    }, 4000);
  };

  // Fechar notificação manualmente
  const fecharNotificacao = () => {
    setNotificacao({
      visivel: false,
      mensagem: "",
      tipo: "sucesso",
    });
  };

  // Atualizar quantidade no modal
  const atualizarQuantidadeModal = (valor) => {
    const numero = parseInt(valor, 10) || 0;
    const maximo = modal.maximo || 0;
    const valorFinal = Math.min(Math.max(0, numero), maximo);

    setModal((prev) => ({
      ...prev,
      quantidade: valorFinal,
    }));
  };

 // Remove pontos permanentemente de um atributo
const removerPontosAtributo = async (chaveAtributo) => {
  if (trilha !== "atributos") return;

  const valorAtual = personagem.atributos?.[chaveAtributo] || 0;
  const pontosAlocados = distribuicao[chaveAtributo] || 0;

  if (valorAtual <= 0) {
    mostrarNotificacao(`Este atributo não possui pontos para remover.`, "erro");
    return;
  }

  const maximoRemover = valorAtual;

  abrirModalQuantidade(
    `Remover pontos de ${chaveAtributo}`,
    `Valor atual: ${valorAtual}`,
    1,              // ← valor inicial
    maximoRemover,  // ← máximo
    (pontosRemover) => {
      if (pontosRemover <= 0 || pontosRemover > maximoRemover) {
        mostrarNotificacao(`Valor inválido. Máximo permitido: ${maximoRemover}`, "erro");
        return;
      }

      abrirModalConfirmacao(
        "⚠️ Confirmar Remoção",
        `Remover ${pontosRemover} ponto(s) de "${chaveAtributo}"?`,
        [
          `Valor atual: ${valorAtual} → ${valorAtual - pontosRemover}`,
          `Todos os pontos serão devolvidos ao saldo.`,
        ],
        "red",
        async () => {
          const atualizado = structuredClone(personagem);

          atualizado.atributos = {
            ...(atualizado.atributos || {}),
            [chaveAtributo]: Math.max(0, valorAtual - pontosRemover),
          };

          const pontosADevolver = pontosRemover;

          atualizado.pontosEvolucao = {
            ...(atualizado.pontosEvolucao || {}),
            disponiveis: (atualizado.pontosEvolucao?.disponiveis || 0) + pontosADevolver,
          };

          setDistribuicao((atual) => {
            const novaDistribuicao = { ...atual };
            if (novaDistribuicao[chaveAtributo]) {
              const pontosAlocadosAtuais = novaDistribuicao[chaveAtributo] || 0;
              const novosPontosAlocados = Math.max(0, pontosAlocadosAtuais - pontosRemover);
              if (novosPontosAlocados === 0) {
                delete novaDistribuicao[chaveAtributo];
              } else {
                novaDistribuicao[chaveAtributo] = novosPontosAlocados;
              }
            }
            return novaDistribuicao;
          });

          setPersonagem(atualizado);
          mostrarNotificacao(
            `✅ ${pontosRemover} ponto(s) removido(s) de "${chaveAtributo}". ${pontosADevolver} ponto(s) devolvidos ao saldo.`,
            "sucesso"
          );

          localStorage.setItem(storageKey, JSON.stringify(atualizado));
          notificarPersonagemAtualizado(fichaId, atualizado);

          try {
            const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
            notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
          } catch (error) {
            console.warn("Backend indisponivel. Remoção salva localmente.", error);
          }
        }
      );
    }
  );
};

// Remove pontos permanentemente de um passivo
const removerPontosPassivo = async (chavePassivo) => {
  if (trilha !== "passivos") return;

  const valorAtual = personagem.habilidadesPassivas?.[chavePassivo] || 0;
  const pontosAlocados = distribuicao[chavePassivo] || 0;

  if (valorAtual <= 0) {
    mostrarNotificacao(`Este passivo não possui pontos para remover.`, "erro");
    return;
  }

  const maximoRemover = valorAtual;

  abrirModalQuantidade(
    `Remover pontos de ${chavePassivo}`,
    `Valor atual: ${valorAtual}`,
    1,
    maximoRemover,
    (pontosRemover) => {
      if (pontosRemover <= 0 || pontosRemover > maximoRemover) {
        mostrarNotificacao(`Valor inválido. Máximo permitido: ${maximoRemover}`, "erro");
        return;
      }

      abrirModalConfirmacao(
        "⚠️ Confirmar Remoção",
        `Remover ${pontosRemover} ponto(s) de "${chavePassivo}"?`,
        [
          `Valor atual: ${valorAtual} → ${valorAtual - pontosRemover}`,
          `Todos os pontos serão devolvidos ao saldo.`,
        ],
        "red",
        async () => {
          const atualizado = structuredClone(personagem);

          atualizado.habilidadesPassivas = {
            ...(atualizado.habilidadesPassivas || {}),
            [chavePassivo]: Math.max(0, valorAtual - pontosRemover),
          };

          const pontosADevolver = pontosRemover;

          atualizado.pontosEvolucao = {
            ...(atualizado.pontosEvolucao || {}),
            disponiveis: (atualizado.pontosEvolucao?.disponiveis || 0) + pontosADevolver,
          };

          setDistribuicao((atual) => {
            const novaDistribuicao = { ...atual };
            if (novaDistribuicao[chavePassivo]) {
              const pontosAlocadosAtuais = novaDistribuicao[chavePassivo] || 0;
              const novosPontosAlocados = Math.max(0, pontosAlocadosAtuais - pontosRemover);
              if (novosPontosAlocados === 0) {
                delete novaDistribuicao[chavePassivo];
              } else {
                novaDistribuicao[chavePassivo] = novosPontosAlocados;
              }
            }
            return novaDistribuicao;
          });

          setPersonagem(atualizado);
          mostrarNotificacao(
            `✅ ${pontosRemover} ponto(s) removido(s) de "${chavePassivo}". ${pontosADevolver} ponto(s) devolvidos ao saldo.`,
            "sucesso"
          );

          localStorage.setItem(storageKey, JSON.stringify(atualizado));
          notificarPersonagemAtualizado(fichaId, atualizado);

          try {
            const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
            notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
          } catch (error) {
            console.warn("Backend indisponivel. Remoção salva localmente.", error);
          }
        }
      );
    }
  );
};

  const aplicarUpgrade = async () => {
    if (trilha === "habilidades") {
      abrirArvore();
      return;
    }

    if (pontosEvolucaoDisponiveis <= 0) {
      mostrarNotificacao(
        "Você não tem pontos de evolução disponíveis.",
        "erro",
      );
      return;
    }

    if (pontosDistribuidos > pontosEvolucaoDisponiveis) {
      mostrarNotificacao(
        "Você está gastando mais pontos do que possui.",
        "erro",
      );
      return;
    }

    if (pontosDistribuidos === 0) {
      mostrarNotificacao(
        "Distribua pelo menos 1 ponto para aplicar o upgrade.",
        "info",
      );
      return;
    }

    const atualizado = structuredClone(personagem);

    atualizado.pontosEvolucao = {
      ...(atualizado.pontosEvolucao || {}),
      disponiveis: pontosEvolucaoDisponiveis - pontosDistribuidos,
    };

    atualizado.historicoUpgrades = [
      ...(atualizado.historicoUpgrades || []),
      {
        nivel: nivelAtual,
        trilha,
        pontos: distribuicao,
        pontosGastos: pontosDistribuidos,
        criadoEm: new Date().toISOString(),
      },
    ];

    if (trilha === "atributos") {
      atualizado.atributos = {
        ...(atualizado.atributos || {}),
      };

      Object.entries(distribuicao).forEach(([chave, valor]) => {
        const atual = parseInt(atualizado.atributos[chave], 10) || 0;
        const aumento = parseInt(valor, 10) || 0;

        atualizado.atributos[chave] = Math.min(
          limitesUpgrade.atributos,
          atual + aumento,
        );
      });
    }

    if (trilha === "passivos") {
      atualizado.habilidadesPassivas = {
        ...(atualizado.habilidadesPassivas || {}),
      };

      Object.entries(distribuicao).forEach(([chave, valor]) => {
        const atual = parseInt(atualizado.habilidadesPassivas[chave], 10) || 0;
        const aumento = parseInt(valor, 10) || 0;

        atualizado.habilidadesPassivas[chave] = Math.min(
          limitesUpgrade.passivos,
          atual + aumento,
        );
      });
    }

    setPersonagem(atualizado);
    setDistribuicao({});

    // 🔥 NOTIFICAÇÃO DE SUCESSO
    mostrarNotificacao(
      `✅ Upgrade aplicado! ${pontosDistribuidos} ponto(s) distribuídos em ${trilha}.`,
      "sucesso",
    );

    localStorage.setItem(storageKey, JSON.stringify(atualizado));
    notificarPersonagemAtualizado(fichaId, atualizado);

    try {
      const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
      notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
    } catch (error) {
      console.warn("Backend indisponivel. Upgrade salvo localmente.", error);
    }
  };

  const NOMES_PASSIVAS = {
    enganacao: "Enganação",
    raciocinioLogico: "Raciocínio Lógico",
    investigacao: "Investigação",
    instinto: "Instinto",
    sensibilidade: "Sensibilidade",
    instintoSobrevivencia: "Instinto de Sobrevivência",
    coragem: "Coragem",
    diplomacia: "Diplomacia",
    disciplina: "Disciplina",
    autocontrole: "Autocontrole",
    intimidacaoPassiva: "Intimidação Passiva",
    presenca: "Presença",
    memoria: "Memória",
    empatia: "Empatia",
    lealdade: "Lealdade",
    fe: "Fé",
    vitalidade: "Vitalidade",
    folego: "Fôlego",
    equilibrio: "Equilíbrio",
    velocidade: "Velocidade",
    precisao: "Precisão",
    lutar: "Lutar",
    resistenciaFisica: "Resistência Física",
    primeirosSocorros: "Primeiros Socorros",
    furtividade: "Furtividade",
    conhecimentoMedico: "Conhecimento Médico",
    conhecimentoTecnico: "Conhecimento Técnico",
    conhecimentoHistorico: "Conhecimento Histórico",
    conhecimentoOculto: "Conhecimento Oculto",
    tecnologia: "Tecnologia",
    tatica: "Tática",
    percepcaoAuditiva: "Percepção Auditiva",
    percepcaoVisual: "Percepção Visual",
    percepcaoOlfativa: "Percepção Olfativa",
    crime: "Crime",
    manipulacao: "Manipulação",
    intimidacao: "Intimidação",
    seducao: "Sedução",
    resistenciaMental: "Resistência Mental",
  };

  const opcoesPassivas = Object.keys(personagem.habilidadesPassivas || {}).map(
    (chave) => ({
      chave,
      nome: NOMES_PASSIVAS[chave] || chave,
    }),
  );

  return (
    <main className="upgrade-page">
      {/* ===== HERO ===== */}
      <section className="upgrade-hero">
        <button className="upgrade-voltar" onClick={voltarParaFicha}>
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>
        <span>Evolução de personagem</span>
        <h1>Upgrade de Nível</h1>
        <p>
          Distribua seus pontos de evolução livremente entre atributos e
          passivos. Cada ponto gasto aumenta permanentemente o valor escolhido.
        </p>
      </section>

      {/* ===== STATUS ===== */}
      <section className="upgrade-status">
        <div>
          <span>Nível atual</span>
          <strong>NV{nivelAtual}</strong>
        </div>
        <div>
          <span>Pontos disponíveis</span>
          <strong>{pontosEvolucaoDisponiveis}</strong>
        </div>
        <div>
          <span>Pontos restantes</span>
          <strong>{pontosRestantes}</strong>
        </div>
      </section>

      {/* ===== LAYOUT DUAS COLUNAS ===== */}
      <section className="upgrade-layout">
        {/* ----- COLUNA ESQUERDA: TABELA SIMPLIFICADA ----- */}
        <section className="upgrade-tabela">
          <h2>Evolução por Nível</h2>
          <div className="upgrade-tabela-grid">
            <strong>Nível</strong>
            <strong>Pontos</strong>
            {TABELA_EVOLUCAO.map((linha) => (
              <React.Fragment key={linha.nivel}>
                <span>NV{linha.nivel}</span>
                <span>{linha.acumulado}</span>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ----- COLUNA DIREITA: UPGRADES ----- */}
        <section className="upgrade-shell">
          {/* Trilhas */}
          <div className="upgrade-trilhas">
            {["passivos", "atributos", "habilidades"].map((item) => (
              <button
                key={item}
                type="button"
                className={trilha === item ? "ativa" : ""}
                onClick={() => alterarTrilha(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {/* Pontos restantes na trilha */}
          <div className="upgrade-pontos">
            <span>
              {trilha === "habilidades"
                ? "Saldo para habilidades"
                : `Distribuindo pontos em ${trilha}`}
            </span>
            <strong>
              {trilha === "habilidades"
                ? `${pontosEvolucaoDisponiveis} pontos disponíveis`
                : `${pontosRestantes} pontos restantes de ${pontosEvolucaoDisponiveis}`}
            </strong>
          </div>

          {/* ATRIBUTOS */}
          {trilha === "atributos" && (
            <div className="upgrade-lista">
              {ATRIBUTOS_UPGRADE.map((atributo) => {
                const valorAtual = personagem.atributos?.[atributo.chave] || 0;
                const pontosAlocados = distribuicao[atributo.chave] || 0;
                const podeRemover = valorAtual > 0;

                return (
                  <div key={atributo.chave} className="upgrade-item">
                    <div className="upgrade-item-header">
                      <span className="upgrade-item-nome">{atributo.nome}</span>
                      <div className="upgrade-item-info">
                        <small className="upgrade-item-atual">
                          Atual: {valorAtual}
                          {pontosAlocados > 0 && (
                            <span className="upgrade-item-alocado">
                              +{pontosAlocados}
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                    <div className="upgrade-item-controles">
                      <div className="upgrade-input-group">
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            if (pontosRestantes > 0) {
                              const novoValor =
                                (distribuicao[atributo.chave] || 0) + 1;
                              atualizarDistribuicao(atributo.chave, novoValor);
                            } else {
                              mostrarNotificacao(
                                "Sem pontos restantes para distribuir.",
                                "info",
                              );
                            }
                          }}
                          disabled={pontosRestantes <= 0}
                        >
                          +
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={pontosAlocados}
                          onChange={(event) =>
                            atualizarDistribuicao(
                              atributo.chave,
                              event.target.value,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            const novoValor = Math.max(
                              0,
                              (distribuicao[atributo.chave] || 0) - 1,
                            );
                            atualizarDistribuicao(atributo.chave, novoValor);
                          }}
                          disabled={pontosAlocados <= 0}
                        >
                          -
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`upgrade-remover ${podeRemover ? "" : "disabled"}`}
                        onClick={() => removerPontosAtributo(atributo.chave)}
                        disabled={!podeRemover}
                        title={
                          podeRemover
                            ? "Remover pontos permanentemente"
                            : "Sem pontos para remover"
                        }
                      >
                        <span className="remover-icon">×</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PASSIVOS */}
          {trilha === "passivos" && (
            <div className="upgrade-lista">
              {opcoesPassivas.map((passiva) => {
                const valorAtual =
                  personagem.habilidadesPassivas?.[passiva.chave] || 0;
                const pontosAlocados = distribuicao[passiva.chave] || 0;
                const podeRemover = valorAtual > 0;

                return (
                  <div key={passiva.chave} className="upgrade-item">
                    <div className="upgrade-item-header">
                      <span className="upgrade-item-nome">{passiva.nome}</span>
                      <div className="upgrade-item-info">
                        <small className="upgrade-item-atual">
                          Atual: {valorAtual}
                          {pontosAlocados > 0 && (
                            <span className="upgrade-item-alocado">
                              +{pontosAlocados}
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                    <div className="upgrade-item-controles">
                      <div className="upgrade-input-group">
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            if (pontosRestantes > 0) {
                              const novoValor =
                                (distribuicao[passiva.chave] || 0) + 1;
                              atualizarDistribuicao(passiva.chave, novoValor);
                            } else {
                              mostrarNotificacao(
                                "Sem pontos restantes para distribuir.",
                                "info",
                              );
                            }
                          }}
                          disabled={pontosRestantes <= 0}
                        >
                          +
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={pontosAlocados}
                          onChange={(event) =>
                            atualizarDistribuicao(
                              passiva.chave,
                              event.target.value,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            const novoValor = Math.max(
                              0,
                              (distribuicao[passiva.chave] || 0) - 1,
                            );
                            atualizarDistribuicao(passiva.chave, novoValor);
                          }}
                          disabled={pontosAlocados <= 0}
                        >
                          -
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`upgrade-remover ${podeRemover ? "" : "disabled"}`}
                        onClick={() => removerPontosPassivo(passiva.chave)}
                        disabled={!podeRemover}
                        title={
                          podeRemover
                            ? "Remover pontos permanentemente"
                            : "Sem pontos para remover"
                        }
                      >
                        <span className="remover-icon">×</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* HABILIDADES */}
          {trilha === "habilidades" && (
            <div className="upgrade-habilidades-info">
              <h2>Habilidades Absolutas</h2>
              <p>
                Na árvore, aptidões custam 5 pontos e habilidades de
                especialidade custam 10 pontos. A árvore usa o saldo de pontos
                disponíveis desta ficha:{" "}
                <strong>{pontosEvolucaoDisponiveis} pontos</strong>.
              </p>
              <button type="button" onClick={abrirArvore}>
                Abrir árvore de habilidades
              </button>
            </div>
          )}

          {/* Botão confirmar upgrade */}
          {trilha !== "habilidades" && (
            <button
              type="button"
              className="upgrade-confirmar"
              onClick={aplicarUpgrade}
              disabled={
                pontosEvolucaoDisponiveis <= 0 || pontosDistribuidos === 0
              }
            >
              Confirmar upgrade ({pontosDistribuidos} pontos)
            </button>
          )}
        </section>
      </section>

      {/* ===== MODAL PERSONALIZADO ===== */}
      {modal.aberto && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (modal.onCancel) modal.onCancel();
            fecharModal();
          }}
        >
          <div
            className={`modal-content ${modal.cor}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{modal.titulo}</h3>
              <button
                className="modal-fechar"
                onClick={() => {
                  if (modal.onCancel) modal.onCancel();
                  fecharModal();
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-mensagem">{modal.mensagem}</p>

              {modal.detalhes && modal.detalhes.length > 0 && (
                <div className="modal-detalhes">
                  {modal.detalhes.map((linha, index) => (
                    <p key={index}>{linha}</p>
                  ))}
                </div>
              )}

              {modal.tipo === "quantidade" && (
                <div className="modal-input-group">
                  <label>
                    Quantidade de pontos:
                    <input
                      type="number"
                      min="1"
                      max={modal.maximo}
                      value={modal.valor}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value, 10) || 1;
                        const maximo = modal.maximo || 1;
                        const valorFinal = Math.min(Math.max(1, valor), maximo);
                        setModal((prev) => ({
                          ...prev,
                          valor: valorFinal,
                        }));
                      }}
                      className="modal-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (modal.onConfirm) modal.onConfirm(modal.valor);
                        }
                      }}
                      autoFocus
                    />
                  </label>
                  <small className="modal-hint">
                    Máximo permitido: {modal.maximo} ponto(s)
                  </small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancelar"
                onClick={() => {
                  if (modal.onCancel) modal.onCancel();
                  fecharModal();
                }}
              >
                {modal.tipo === "confirmacao" ? "Voltar" : "Cancelar"}
              </button>
              <button
                className={`modal-btn modal-btn-confirmar ${modal.cor}`}
                onClick={() => {
                  if (modal.onConfirm) {
                    if (modal.tipo === "quantidade") {
                      modal.onConfirm(modal.valor);
                    } else {
                      modal.onConfirm();
                    }
                  }
                }}
              >
                {modal.tipo === "confirmacao" ? "Confirmar" : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIFICAÇÃO TOAST ===== */}
      {notificacao.visivel && (
        <div className={`notificacao notificacao-${notificacao.tipo}`}>
          <div className="notificacao-conteudo">
            <span className="notificacao-icone">
              {notificacao.tipo === "sucesso" && "✅"}
              {notificacao.tipo === "erro" && "❌"}
              {notificacao.tipo === "info" && "ℹ️"}
            </span>
            <span className="notificacao-mensagem">{notificacao.mensagem}</span>
          </div>
          <button className="notificacao-fechar" onClick={fecharNotificacao}>
            ✕
          </button>
          <div className="notificacao-barra-progresso" />
        </div>
      )}
    </main>
  );
};

export default UpgradeNivel;
