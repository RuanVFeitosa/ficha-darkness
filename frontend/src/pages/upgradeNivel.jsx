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
import { obterMarcosProgressao } from "../data/progressaoAvancada";
import { marcarPassivosAtualizados, mesclarPassivosPorRevisao } from "../utils/personagemMerge";
import {
  ehHabilidadeProgressaoAvancada,
  listarHabilidadesCriadasJogador,
} from "../utils/habilidadesProgressao";

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

const NOMES_MEMBROS = {
  cabeca: "Cabeça",
  torso: "Torso",
  bracoDireito: "Braço Direito",
  bracoEsquerdo: "Braço Esquerdo",
  pernaDireita: "Perna Direita",
  pernaEsquerda: "Perna Esquerda",
};

const LIMITE_MEMBROS = {
  cabeca: 100,
  torso: 500,
  bracoDireito: 500,
  bracoEsquerdo: 500,
  pernaDireita: 500,
  pernaEsquerda: 500,
};

const UpgradeNivel = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [trilha, setTrilha] = useState("atributos");
  const [distribuicao, setDistribuicao] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [novaHabilidade, setNovaHabilidade] = useState({
    tipo: "habilidade",
    nome: "",
    descricao: "",
    custo: 10,
    recurso: "evolucao",
  });
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
  const passouDoNivel5 = nivelAtual > 5;
  const marcosProgressao = useMemo(() => obterMarcosProgressao(personagem), [personagem]);
  const habilidadesCriadasJogador = listarHabilidadesCriadasJogador(personagem);

  const limitesUpgrade = {
    passivos: passouDoNivel5 ? 20 : 10,
    atributos: passouDoNivel5 ? 100 : 50,
  };

  // ============================================================
  // PONTOS DE INTEGRIDADE
  // ============================================================
  // Garantir que pontosIntegridade existe no personagem
  if (!personagem.pontosIntegridade) {
    personagem.pontosIntegridade = { gastos: 0 };
  }

  const totalIntegridadeRecebida = Math.max(0, (nivelAtual - 1) * 150);
  const gastosIntegridade = personagem.pontosIntegridade?.gastos || 0;
  const disponiveisIntegridade = Math.max(0, totalIntegridadeRecebida - gastosIntegridade);

  const integridadeAlocada = useMemo(() => {
    let total = 0;
    Object.keys(LIMITE_MEMBROS).forEach((chave) => {
      const key = `membro-${chave}`;
      total += parseInt(distribuicao[key] || 0, 10);
    });
    return total;
  }, [distribuicao]);

  const restantesIntegridade = Math.max(0, disponiveisIntegridade - integridadeAlocada);

  // ============================================================
  // PONTOS DE EVOLUÇÃO (já existentes)
  // ============================================================
  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );

  const pontosDistribuidos = useMemo(
    () =>
      Object.entries(distribuicao)
        .filter(([key]) => !key.startsWith("membro-"))
        .reduce((total, [, valor]) => total + Math.max(0, parseInt(valor, 10) || 0), 0),
    [distribuicao],
  );

  const pontosRestantes = Math.max(
    0,
    pontosEvolucaoDisponiveis - pontosDistribuidos,
  );

  const saldoRecursoHabilidade = {
    evolucao: pontosEvolucaoDisponiveis,
    esperanca: Math.max(0, parseInt(personagem.esperanca?.max, 10) || 0),
    sanidade: Math.max(0, parseInt(personagem.sanidade?.max, 10) || 0),
  };

  const enviarHabilidadeParaAnalise = async () => {
    const nome = novaHabilidade.nome.trim();
    const descricao = novaHabilidade.descricao.trim();
    const custo = Math.max(10, Math.min(50, parseInt(novaHabilidade.custo, 10) || 10));
    const tipo = novaHabilidade.tipo;
    const recurso = tipo === "habilidade" ? novaHabilidade.recurso : "sanidade";

    if (!nome || !descricao) {
      mostrarNotificacao("Informe o nome e a descrição da habilidade.", "erro");
      return;
    }
    if (saldoRecursoHabilidade[recurso] < custo) {
      mostrarNotificacao("Você não possui saldo suficiente para este custo.", "erro");
      return;
    }

    const atualizado = structuredClone(personagem);
    const habilidade = {
      id: crypto.randomUUID(),
      tipo,
      nome,
      descricao,
      custo,
      recurso,
      recursoAtualAntes:
        recurso === "evolucao" ? null : parseInt(personagem[recurso]?.atual, 10) || 0,
      status: "pendente",
      criadaEm: new Date().toISOString(),
    };
    atualizado.habilidadesCriadas = [
      ...(atualizado.habilidadesCriadas || []),
      habilidade,
    ];
    if (recurso === "evolucao") {
      atualizado.pontosEvolucao = {
        ...(atualizado.pontosEvolucao || {}),
        disponiveis: saldoRecursoHabilidade.evolucao - custo,
      };
    } else {
      const novoMaximo = saldoRecursoHabilidade[recurso] - custo;
      atualizado[recurso] = {
        ...(atualizado[recurso] || {}),
        max: novoMaximo,
        atual: Math.min(parseInt(atualizado[recurso]?.atual, 10) || 0, novoMaximo),
      };
    }

    setPersonagem(atualizado);
    setNovaHabilidade({ tipo, nome: "", descricao: "", custo: 10, recurso: tipo === "habilidade" ? "evolucao" : "sanidade" });
    localStorage.setItem(storageKey, JSON.stringify(atualizado));
    notificarPersonagemAtualizado(fichaId, atualizado);
    try {
      const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
      notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
    } catch (error) {
      console.warn("Backend indisponível. Habilidade salva localmente.", error);
    }
    mostrarNotificacao(`${tipo === "rito" ? "Rito" : tipo === "poderAbsoluto" ? "Poder absoluto" : "Habilidade"} enviado para análise do mestre.`, "sucesso");
  };

  // ============================================================
  // CARREGAR FICHA
  // ============================================================
  useEffect(() => {
    const dadosSalvos = localStorage.getItem(storageKey);
    if (dadosSalvos) {
      try {
        const parsed = JSON.parse(dadosSalvos);
        if (!parsed.pontosIntegridade) {
          parsed.pontosIntegridade = { gastos: 0 };
        }
        setPersonagem(parsed);
      } catch (error) {
        console.warn("Nao foi possivel carregar a ficha local.", error);
      }
    }

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi) {
          if (!personagemApi.pontosIntegridade) {
            personagemApi.pontosIntegridade = { gastos: 0 };
          }
          setPersonagem((atual) => mesclarPassivosPorRevisao(personagemApi, atual));
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

  const selecionarMarco = async (nivel, opcao) => {
    if (nivelAtual < nivel) return;
    const atualizado = structuredClone(personagem);
    atualizado.progressaoAvancada = {
      ...(atualizado.progressaoAvancada || {}),
      [nivel]: { ...opcao, nivel, tipo: marcosProgressao[nivel].tipo, escolhidoEm: new Date().toISOString() },
    };
    atualizado.habilidadesCriadas = (atualizado.habilidadesCriadas || []).filter(
      (item) => !ehHabilidadeProgressaoAvancada(item),
    );
    setPersonagem(atualizado);
    localStorage.setItem(storageKey, JSON.stringify(atualizado));
    notificarPersonagemAtualizado(fichaId, atualizado);
    try {
      const salvo = await salvarPersonagem(fichaId, atualizado);
      notificarPersonagemAtualizado(fichaId, salvo || atualizado);
      mostrarNotificacao(`${opcao.nome} foi incorporado à progressão.`, "sucesso");
    } catch (error) {
      console.warn("Backend indisponível. Marco salvo localmente.", error);
      mostrarNotificacao(`${opcao.nome} foi salvo localmente.`, "sucesso");
    }
  };

  const atualizarDistribuicao = (chave, valor) => {
    const numero = Math.max(0, parseInt(valor, 10) || 0);

    if (chave.startsWith("membro-")) {
      const membroChave = chave.replace("membro-", "");
      const limite = LIMITE_MEMBROS[membroChave] || 500;
      const valorAtual = personagem.membros?.[membroChave]?.max || (membroChave === "cabeca" ? 100 : 500);
      const maximoPorLimite = Math.max(0, limite - valorAtual);
      const maximoPorPontos = Math.max(0, disponiveisIntegridade - (integridadeAlocada - (distribuicao[chave] || 0)));

      const valorPermitido = Math.min(numero, maximoPorLimite, maximoPorPontos);

      if (numero > valorPermitido) {
        setMensagem(`Limite atingido. ${NOMES_MEMBROS[membroChave]} pode ir até ${limite}.`);
      } else {
        setMensagem("");
      }

      setDistribuicao((atual) => ({
        ...atual,
        [chave]: valorPermitido,
      }));
      return;
    }

    // Atributos/passivos
    const valorAtual =
      trilha === "atributos"
        ? personagem.atributos?.[chave] || 0
        : personagem.habilidadesPassivas?.[chave] || 0;

    const limite =
      trilha === "atributos"
        ? limitesUpgrade.atributos
        : limitesUpgrade.passivos;

    const maximoPorLimite = Math.max(0, limite - valorAtual);

    const outrosPontos = Object.entries(distribuicao)
      .filter(([itemChave]) => !itemChave.startsWith("membro-"))
      .reduce((total, [itemChave, itemValor]) => {
        if (itemChave === chave) return total;
        return total + Math.max(0, parseInt(itemValor, 10) || 0);
      }, 0);

    const maximoPorPontos = Math.max(0, pontosEvolucaoDisponiveis - outrosPontos);

    const valorPermitido = Math.min(numero, maximoPorLimite, maximoPorPontos);

    if (numero > valorPermitido) {
      setMensagem(
        `Limite atingido. ${trilha === "atributos" ? "Atributos" : "Passivos"} podem ir até ${limite}.`,
      );
    } else {
      setMensagem("");
    }

    setDistribuicao((atual) => ({
      ...atual,
      [chave]: valorPermitido,
    }));
  };

  // ============================================================
  // MODAL e NOTIFICAÇÃO
  // ============================================================
  const [modal, setModal] = useState({
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

  const abrirModalQuantidade = (titulo, mensagem, valorInicial, maximo, onConfirm) => {
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

  const abrirModalConfirmacao = (titulo, mensagem, detalhes, cor, onConfirm, onCancel) => {
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
    tipo: "sucesso",
  });

  const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
    setNotificacao({ visivel: true, mensagem, tipo });
    setTimeout(() => {
      setNotificacao({ visivel: false, mensagem: "", tipo: "sucesso" });
    }, 4000);
  };

  const fecharNotificacao = () => {
    setNotificacao({ visivel: false, mensagem: "", tipo: "sucesso" });
  };

  // ============================================================
  // REMOVER PONTOS (Atributos, Passivos, Integridade)
  // ============================================================
  const removerPontosAtributo = async (chaveAtributo) => {
    if (trilha !== "atributos") return;
    const valorAtual = personagem.atributos?.[chaveAtributo] || 0;
    if (valorAtual <= 0) {
      mostrarNotificacao(`Este atributo não possui pontos para remover.`, "erro");
      return;
    }
    const maximoRemover = valorAtual;

    abrirModalQuantidade(
      `Remover pontos de ${chaveAtributo}`,
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
              const nova = { ...atual };
              if (nova[chaveAtributo]) {
                const novos = Math.max(0, nova[chaveAtributo] - pontosRemover);
                if (novos === 0) delete nova[chaveAtributo];
                else nova[chaveAtributo] = novos;
              }
              return nova;
            });
            setPersonagem(atualizado);
            mostrarNotificacao(`✅ ${pontosRemover} ponto(s) removido(s). ${pontosADevolver} ponto(s) devolvidos.`, "sucesso");
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

  const removerPontosPassivo = async (chavePassivo) => {
    if (trilha !== "passivos") return;
    const valorAtual = personagem.habilidadesPassivas?.[chavePassivo] || 0;
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
            Object.assign(atualizado, marcarPassivosAtualizados(atualizado));
            const pontosADevolver = pontosRemover;
            atualizado.pontosEvolucao = {
              ...(atualizado.pontosEvolucao || {}),
              disponiveis: (atualizado.pontosEvolucao?.disponiveis || 0) + pontosADevolver,
            };
            setDistribuicao((atual) => {
              const nova = { ...atual };
              if (nova[chavePassivo]) {
                const novos = Math.max(0, nova[chavePassivo] - pontosRemover);
                if (novos === 0) delete nova[chavePassivo];
                else nova[chavePassivo] = novos;
              }
              return nova;
            });
            setPersonagem(atualizado);
            mostrarNotificacao(`✅ ${pontosRemover} ponto(s) removido(s). ${pontosADevolver} ponto(s) devolvidos.`, "sucesso");
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

  const removerPontosIntegridade = async (membroChave) => {
    const base = membroChave === "cabeca" ? 100 : 500;
    const valorAtual = personagem.membros?.[membroChave]?.max || base;
    if (valorAtual <= base) {
      mostrarNotificacao("Este membro já está no valor base.", "erro");
      return;
    }
    const maximoRemover = valorAtual - base;
    abrirModalQuantidade(
      `Remover integridade de ${NOMES_MEMBROS[membroChave]}`,
      `Valor atual: ${valorAtual} (base: ${base})`,
      1,
      maximoRemover,
      (pontosRemover) => {
        if (pontosRemover <= 0 || pontosRemover > maximoRemover) {
          mostrarNotificacao(`Valor inválido. Máximo: ${maximoRemover}`, "erro");
          return;
        }
        abrirModalConfirmacao(
          "⚠️ Confirmar Remoção",
          `Remover ${pontosRemover} ponto(s) de integridade de "${NOMES_MEMBROS[membroChave]}"?`,
          [
            `Valor atual: ${valorAtual} → ${valorAtual - pontosRemover}`,
            `Os pontos serão devolvidos ao saldo.`,
          ],
          "red",
          async () => {
            const atualizado = structuredClone(personagem);
            const novoMax = Math.max(base, valorAtual - pontosRemover);
            atualizado.membros[membroChave].max = novoMax;
            if (atualizado.membros[membroChave].atual > novoMax) {
              atualizado.membros[membroChave].atual = novoMax;
            }
            // Reduzir gastos
            atualizado.pontosIntegridade.gastos = Math.max(0, gastosIntegridade - pontosRemover);
            setDistribuicao((atual) => {
              const key = `membro-${membroChave}`;
              const nova = { ...atual };
              if (nova[key]) {
                const novos = Math.max(0, nova[key] - pontosRemover);
                if (novos === 0) delete nova[key];
                else nova[key] = novos;
              }
              return nova;
            });
            setPersonagem(atualizado);
            mostrarNotificacao(`✅ ${pontosRemover} ponto(s) removido(s) de integridade.`, "sucesso");
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

  // ============================================================
  // APLICAR UPGRADE
  // ============================================================
  const aplicarUpgrade = async () => {
    if (trilha === "habilidades") {
      abrirArvore();
      return;
    }

    // --- INTEGRIDADE ---
    if (trilha === "integridade") {
      if (integridadeAlocada === 0) {
        mostrarNotificacao("Distribua pelo menos 1 ponto de integridade.", "info");
        return;
      }
      if (restantesIntegridade < 0) {
        mostrarNotificacao("Você está gastando mais pontos de integridade do que possui.", "erro");
        return;
      }

      const atualizado = structuredClone(personagem);
      // Aplica os aumentos nos membros
      Object.keys(LIMITE_MEMBROS).forEach((chave) => {
        const key = `membro-${chave}`;
        const aumento = parseInt(distribuicao[key] || 0, 10);
        if (aumento > 0) {
          const valorAtual = atualizado.membros?.[chave]?.max || (chave === "cabeca" ? 100 : 500);
          const novoMax = Math.min(LIMITE_MEMBROS[chave], valorAtual + aumento);
          if (!atualizado.membros) atualizado.membros = {};
          if (!atualizado.membros[chave]) atualizado.membros[chave] = { atual: 0, max: novoMax, defesa: 0, ferido: false, grave: false };
          else atualizado.membros[chave].max = novoMax;
          if (atualizado.membros[chave].atual > novoMax) {
            atualizado.membros[chave].atual = novoMax;
          }
        }
      });

      // Incrementa gastos com a quantidade alocada
      atualizado.pontosIntegridade = {
        ...(atualizado.pontosIntegridade || {}),
        gastos: (atualizado.pontosIntegridade?.gastos || 0) + integridadeAlocada,
      };

      // Histórico
      if (!atualizado.historicoIntegridade) atualizado.historicoIntegridade = [];
      atualizado.historicoIntegridade.push({
        nivel: nivelAtual,
        pontosGastos: integridadeAlocada,
        distribuicao: { ...distribuicao },
        data: new Date().toISOString(),
      });

      setPersonagem(atualizado);
      setDistribuicao({});
      mostrarNotificacao(`✅ ${integridadeAlocada} ponto(s) de integridade distribuídos.`, "sucesso");
      localStorage.setItem(storageKey, JSON.stringify(atualizado));
      notificarPersonagemAtualizado(fichaId, atualizado);
      try {
        const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
        notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
      } catch (error) {
        console.warn("Backend indisponivel. Upgrade de integridade salvo localmente.", error);
      }
      return;
    }

    // --- ATRIBUTOS / PASSIVOS ---
    if (pontosEvolucaoDisponiveis <= 0) {
      mostrarNotificacao("Você não tem pontos de evolução disponíveis.", "erro");
      return;
    }
    if (pontosDistribuidos > pontosEvolucaoDisponiveis) {
      mostrarNotificacao("Você está gastando mais pontos do que possui.", "erro");
      return;
    }
    if (pontosDistribuidos === 0) {
      mostrarNotificacao("Distribua pelo menos 1 ponto para aplicar o upgrade.", "info");
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
      atualizado.atributos = { ...(atualizado.atributos || {}) };
      Object.entries(distribuicao).forEach(([chave, valor]) => {
        const atual = parseInt(atualizado.atributos[chave], 10) || 0;
        const aumento = parseInt(valor, 10) || 0;
        atualizado.atributos[chave] = Math.min(limitesUpgrade.atributos, atual + aumento);
      });
    }

    if (trilha === "passivos") {
      atualizado.habilidadesPassivas = { ...(atualizado.habilidadesPassivas || {}) };
      Object.entries(distribuicao).forEach(([chave, valor]) => {
        const atual = parseInt(atualizado.habilidadesPassivas[chave], 10) || 0;
        const aumento = parseInt(valor, 10) || 0;
        atualizado.habilidadesPassivas[chave] = Math.min(limitesUpgrade.passivos, atual + aumento);
      });
      Object.assign(atualizado, marcarPassivosAtualizados(atualizado));
    }

    setPersonagem(atualizado);
    setDistribuicao({});
    mostrarNotificacao(`✅ Upgrade aplicado! ${pontosDistribuidos} ponto(s) distribuídos em ${trilha}.`, "sucesso");
    localStorage.setItem(storageKey, JSON.stringify(atualizado));
    notificarPersonagemAtualizado(fichaId, atualizado);
    try {
      const personagemSalvo = await salvarPersonagem(fichaId, atualizado);
      notificarPersonagemAtualizado(fichaId, personagemSalvo || atualizado);
    } catch (error) {
      console.warn("Backend indisponivel. Upgrade salvo localmente.", error);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
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
      {/* HERO */}
      <section className="upgrade-hero">
        <button className="upgrade-voltar" onClick={voltarParaFicha}>
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>
        <span>Evolução de personagem</span>
        <h1>Upgrade de Nível</h1>
        <p>
          Distribua seus pontos de evolução livremente entre Integridade, Atributos e Passivos.
          Cada ponto gasto aumenta permanentemente o valor escolhido.
        </p>
      </section>

      {/* STATUS */}
      <section className="upgrade-status">
        <div>
          <span>Nível atual</span>
          <strong>NV{nivelAtual}</strong>
        </div>
        <div>
          <span>Pontos de evolução</span>
          <strong>{pontosEvolucaoDisponiveis}</strong>
        </div>
        <div>
          <span>Pontos de Integridade</span>
          <strong>{disponiveisIntegridade}</strong>
        </div>
      </section>

      {/* LAYOUT */}
      <section className="upgrade-layout">
        {/* TABELA */}
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
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#b0b0b0' }}>
            Total de Integridade recebido: <strong>{totalIntegridadeRecebida}</strong> ({(nivelAtual-1)} níveis × 150)
            <br />
            Gastos acumulados: <strong>{gastosIntegridade}</strong>
          </div>
        </section>

        {/* SHELL */}
        <section className="upgrade-shell">
          {/* Trilhas */}
          <div className="upgrade-trilhas">
            {["passivos", "atributos", "habilidades", "integridade", "marcos"].map((item) => (
              <button
                key={item}
                type="button"
                className={trilha === item ? "ativa" : ""}
                onClick={() => alterarTrilha(item)}
              >
                {item === "integridade" ? "Integridade" : item === "marcos" ? "Marcos NV5+" : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {/* Pontos restantes */}
          <div className="upgrade-pontos">
            <span>
              {trilha === "marcos"
                ? "Progressão avançada"
                : trilha === "habilidades"
                ? "Saldo para habilidades"
                : trilha === "integridade"
                ? `Integridade disponível: ${disponiveisIntegridade}`
                : `Distribuindo pontos em ${trilha}`}
            </span>
            <strong>
              {trilha === "marcos"
                ? `${Object.entries(marcosProgressao).filter(([nivel, marco]) => marco.opcoes.some((opcao) => opcao.id === personagem.progressaoAvancada?.[nivel]?.id)).length} de 6 marcos escolhidos`
                : trilha === "habilidades"
                ? `${pontosEvolucaoDisponiveis} pontos disponíveis`
                : trilha === "integridade"
                ? `${restantesIntegridade} pontos restantes`
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
                            <span className="upgrade-item-alocado">+{pontosAlocados}</span>
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
                              const novoValor = (distribuicao[atributo.chave] || 0) + 1;
                              atualizarDistribuicao(atributo.chave, novoValor);
                            } else {
                              mostrarNotificacao("Sem pontos restantes para distribuir.", "info");
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
                            atualizarDistribuicao(atributo.chave, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            const novoValor = Math.max(0, (distribuicao[atributo.chave] || 0) - 1);
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
                        title={podeRemover ? "Remover pontos permanentemente" : "Sem pontos para remover"}
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
                const valorAtual = personagem.habilidadesPassivas?.[passiva.chave] || 0;
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
                            <span className="upgrade-item-alocado">+{pontosAlocados}</span>
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
                              const novoValor = (distribuicao[passiva.chave] || 0) + 1;
                              atualizarDistribuicao(passiva.chave, novoValor);
                            } else {
                              mostrarNotificacao("Sem pontos restantes para distribuir.", "info");
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
                            atualizarDistribuicao(passiva.chave, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            const novoValor = Math.max(0, (distribuicao[passiva.chave] || 0) - 1);
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
                        title={podeRemover ? "Remover pontos permanentemente" : "Sem pontos para remover"}
                      >
                        <span className="remover-icon">×</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MARCOS NV5+ */}
          {trilha === "marcos" && (
            <div className="upgrade-marcos">
              <div className="upgrade-marcos-intro">
                <span>ASCENSÃO</span>
                <h2>Marcos de evolução</h2>
                <p>
                  A partir do nível 5, cada avanço muda a forma como o personagem atua.
                  Escolha um legado por nível; escolhas anteriores podem ser substituídas aqui.
                </p>
              </div>

              {Object.entries(marcosProgressao).map(([nivel, marco]) => {
                const numeroNivel = Number(nivel);
                const bloqueado = nivelAtual < numeroNivel;
                const escolhaSalva = personagem.progressaoAvancada?.[nivel];
                const escolhaAtual = marco.opcoes.some((opcao) => opcao.id === escolhaSalva?.id)
                  ? escolhaSalva
                  : null;

                return (
                  <article
                    key={nivel}
                    className={`upgrade-marco ${bloqueado ? "bloqueado" : ""} ${escolhaAtual ? "concluido" : ""}`}
                  >
                    <header className="upgrade-marco-header">
                      <div className="upgrade-marco-nivel">NV {nivel}</div>
                      <div>
                        <span>{marco.tipo}</span>
                        <h3>{marco.titulo}</h3>
                      </div>
                      <b>{bloqueado ? `Disponível no NV ${nivel}` : escolhaAtual ? "Escolhido" : "Disponível"}</b>
                    </header>

                    <div className="upgrade-marco-opcoes">
                      {marco.opcoes.map((opcao) => {
                        const selecionada = escolhaAtual?.id === opcao.id;
                        return (
                          <button
                            key={opcao.id}
                            type="button"
                            className={selecionada ? "selecionada" : ""}
                            disabled={bloqueado}
                            onClick={() => selecionarMarco(numeroNivel, opcao)}
                          >
                            <span className="upgrade-marco-seletor">{selecionada ? "✓" : "+"}</span>
                            <strong>{opcao.nome}</strong>
                            <small>{opcao.descricao}</small>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* HABILIDADES */}
          {trilha === "habilidades" && (
            <div className="upgrade-habilidades-info">
              <div className="upgrade-habilidades-topo">
                <div>
                  <h2>Criação de Habilidades</h2>
                  <p>Defina o custo entre 10 e 50. A habilidade ficará pendente até a aprovação do mestre.</p>
                </div>
                <button type="button" onClick={abrirArvore}>Árvore de habilidades</button>
              </div>
              <div className="criador-habilidade-form">
                <div className="recursos-habilidade-resumo">
                  <div><span>Pontos de Evolução</span><strong>{pontosEvolucaoDisponiveis}</strong></div>
                  <div><span>Esperança</span><strong>{personagem.esperanca?.atual || 0} <small>/ {personagem.esperanca?.max || 0}</small></strong></div>
                  <div><span>Sanidade</span><strong>{personagem.sanidade?.atual || 0} <small>/ {personagem.sanidade?.max || 0}</small></strong></div>
                </div>
                <label>Tipo<select value={novaHabilidade.tipo} onChange={(e) => setNovaHabilidade((atual) => ({ ...atual, tipo: e.target.value, recurso: e.target.value === "habilidade" ? atual.recurso : "sanidade" }))}><option value="habilidade">Habilidade</option><option value="rito">Rito</option><option value="poderAbsoluto">Poder Absoluto</option></select></label>
                <label>Nome<input value={novaHabilidade.nome} maxLength="80" onChange={(e) => setNovaHabilidade((atual) => ({ ...atual, nome: e.target.value }))} placeholder="Ex.: Manto da Ruína" /></label>
                <label className="criador-descricao">Descrição<textarea value={novaHabilidade.descricao} maxLength="800" onChange={(e) => setNovaHabilidade((atual) => ({ ...atual, descricao: e.target.value }))} placeholder="Explique o efeito, limites e condições da habilidade." /></label>
                <label>Custo<select value={novaHabilidade.custo} onChange={(e) => setNovaHabilidade((atual) => ({ ...atual, custo: parseInt(e.target.value, 10) }))}><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="40">40</option><option value="50">50</option></select></label>
                {novaHabilidade.tipo === "habilidade" ? <label>Gastar de<select value={novaHabilidade.recurso} onChange={(e) => setNovaHabilidade((atual) => ({ ...atual, recurso: e.target.value }))}><option value="evolucao">Pontos de Evolução ({saldoRecursoHabilidade.evolucao})</option><option value="esperanca">Esperança máxima ({saldoRecursoHabilidade.esperanca})</option><option value="sanidade">Sanidade máxima ({saldoRecursoHabilidade.sanidade})</option></select></label> : <label>Recurso obrigatório<input value={`Sanidade máxima (${saldoRecursoHabilidade.sanidade})`} readOnly /></label>}
                <button type="button" className="upgrade-confirmar" onClick={enviarHabilidadeParaAnalise}>Enviar para análise ({novaHabilidade.custo})</button>
              </div>
              <div className="habilidades-enviadas">
                <h3>Suas solicitações</h3>
                {habilidadesCriadasJogador.length ? (
                  habilidadesCriadasJogador.map((habilidade) => (
                    <article key={habilidade.id} className={`habilidade-enviada ${habilidade.status || "pendente"}`}>
                      <div>
                        <strong>{habilidade.nome}</strong>
                        <span>
                          {habilidade.tipo === "rito" ? "Rito" : habilidade.tipo === "poderAbsoluto" ? "Poder Absoluto" : "Habilidade"} · {habilidade.custo} {habilidade.recurso === "evolucao" ? "Pontos de Evolução" : habilidade.recurso}
                        </span>
                        <p>{habilidade.descricao}</p>
                      </div>
                      <b>{habilidade.status || "pendente"}</b>
                    </article>
                  ))
                ) : (
                  <p>Nenhuma solicitação enviada.</p>
                )}
              </div>
            </div>
          )}

          {/* INTEGRIDADE */}
          {trilha === "integridade" && (
            <div className="upgrade-lista">
              {Object.keys(LIMITE_MEMBROS).map((chave) => {
                const key = `membro-${chave}`;
                const valorAtual = personagem.membros?.[chave]?.max || (chave === "cabeca" ? 100 : 500);
                const limite = LIMITE_MEMBROS[chave];
                const pontosAlocados = distribuicao[key] || 0;
                const podeAumentar = restantesIntegridade > 0 && valorAtual < limite;
                const podeRemover = valorAtual > (chave === "cabeca" ? 100 : 500);

                return (
                  <div key={chave} className="upgrade-item">
                    <div className="upgrade-item-header">
                      <span className="upgrade-item-nome">{NOMES_MEMBROS[chave]}</span>
                      <div className="upgrade-item-info">
                        <small className="upgrade-item-atual">
                          Atual: {valorAtual}
                          {pontosAlocados > 0 && (
                            <span className="upgrade-item-alocado">+{pontosAlocados}</span>
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
                            if (podeAumentar) {
                              const novoValor = (distribuicao[key] || 0) + 1;
                              atualizarDistribuicao(key, novoValor);
                            } else {
                              mostrarNotificacao("Limite ou pontos insuficientes.", "info");
                            }
                          }}
                          disabled={!podeAumentar}
                        >
                          +
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={pontosAlocados}
                          onChange={(event) =>
                            atualizarDistribuicao(key, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="upgrade-input-btn"
                          onClick={() => {
                            const novoValor = Math.max(0, (distribuicao[key] || 0) - 1);
                            atualizarDistribuicao(key, novoValor);
                          }}
                          disabled={pontosAlocados <= 0}
                        >
                          -
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`upgrade-remover ${podeRemover ? "" : "disabled"}`}
                        onClick={() => removerPontosIntegridade(chave)}
                        disabled={!podeRemover}
                        title={podeRemover ? "Remover pontos de integridade" : "Sem pontos extras para remover"}
                      >
                        <span className="remover-icon">×</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão confirmar upgrade */}
          {trilha !== "habilidades" && trilha !== "marcos" && (
            <button
              type="button"
              className="upgrade-confirmar"
              onClick={aplicarUpgrade}
              disabled={
                (trilha === "integridade" && integridadeAlocada === 0) ||
                (trilha !== "integridade" && (pontosEvolucaoDisponiveis <= 0 || pontosDistribuidos === 0))
              }
            >
              {trilha === "integridade"
                ? `Aplicar integridade (${integridadeAlocada} pontos)`
                : `Confirmar upgrade (${pontosDistribuidos} pontos)`}
            </button>
          )}
        </section>
      </section>

      {/* MODAL */}
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
                        setModal((prev) => ({ ...prev, valor: valorFinal }));
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

      {/* NOTIFICAÇÃO */}
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
