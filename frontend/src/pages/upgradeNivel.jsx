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

  const pontosPorTrilha = {
    passivos: 10,
    atributos: 10,
  };

  const custos =
    TABELA_EVOLUCAO.find((linha) => linha.nivel === nivelAtual) ||
    obterCustosNivel(nivelAtual);
  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );

  const pontosDisponiveisNaTrilha =
    trilha === "habilidades"
      ? pontosEvolucaoDisponiveis
      : pontosPorTrilha[trilha] || 0;

  const custoPorMelhoria =
    trilha === "passivos"
      ? custos.passivos
      : trilha === "atributos"
        ? custos.atributos
        : custos.habilidades;

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
    window.location.href = montarUrlFicha(personagem, fichaId, "?habilidades=1");
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
        } podem ir atÃ© ${limite}.`,
      );
    } else {
      setMensagem("");
    }

    setDistribuicao((atual) => ({
      ...atual,
      [chave]: valorPermitido,
    }));
  };

  const aplicarUpgrade = async () => {
    if (trilha === "habilidades") {
      abrirArvore();
      return;
    }

    if (pontosEvolucaoDisponiveis <= 0) {
      setMensagem("Voce nao tem pontos de evolucao disponiveis.");
      return;
    }

    if (custoPorMelhoria > pontosEvolucaoDisponiveis) {
      setMensagem("Voce nao possui PE suficiente para esta trilha.");

      return;
    }

    if (pontosDistribuidos > pontosEvolucaoDisponiveis) {
      setMensagem("Voce esta gastando mais pontos do que possui.");
      return;
    }

    const atualizado = structuredClone(personagem);

    atualizado.pontosEvolucao = {
      ...(atualizado.pontosEvolucao || {}),
      disponiveis: pontosEvolucaoDisponiveis - custoPorMelhoria,
    };

    atualizado.historicoUpgrades = [
      ...(atualizado.historicoUpgrades || []),
      {
        nivel: nivelAtual,
        trilha,
        pontos: distribuicao,
        custo: custoPorMelhoria,
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
    setMensagem("Upgrade aplicado. Pontos de evolucao atualizados.");

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
      <section className="upgrade-hero">
        <button className="upgrade-voltar" onClick={voltarParaFicha}>
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>
        <span>Evolucao de personagem</span>
        <h1>Upgrade de Nivel</h1>
        <p>
          O mestre deposita niveis na ficha. Cada upgrade consome 1 nivel
          disponivel e libera os pontos da trilha escolhida.
        </p>
      </section>

      <section className="upgrade-status">
        <div>
          <span>Nivel atual</span>
          <strong>NV{nivelAtual}</strong>
        </div>
        <div>
          <span>Proximo upgrade</span>
          <strong>
            {custos.acumulado} pts ganhos no NV{nivelAtual}
          </strong>
        </div>
        <div>
          <span>Pontos disponiveis</span>
          <strong>{pontosEvolucaoDisponiveis}</strong>
        </div>
      </section>

      <section className="upgrade-tabela">
        <h2>Evolucao de personagem</h2>
        <div className="upgrade-tabela-grid">
          <span />
          <strong>Passivos</strong>
          <strong>Atributos</strong>
          <strong>Habilidades</strong>
          <strong>Pontos acumulado</strong>
          {TABELA_EVOLUCAO.map((linha) => (
            <React.Fragment key={linha.nivel}>
              <strong>NV{linha.nivel}</strong>
              <span>{linha.passivos}</span>
              <span>{linha.atributos}</span>
              <span>{linha.habilidades}</span>
              <span>{linha.acumulado}</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="upgrade-shell">
        <div className="upgrade-trilhas">
          {["passivos", "atributos", "habilidades"].map((item) => (
            <button
              key={item}
              type="button"
              className={trilha === item ? "ativa" : ""}
              onClick={() => alterarTrilha(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="upgrade-pontos">
          <span>
            {trilha === "habilidades"
              ? "Saldo para habilidades"
              : "Pontos da trilha"}
          </span>
          <strong>
            {trilha === "habilidades"
              ? `${pontosEvolucaoDisponiveis} pontos disponiveis`
              : `${pontosRestantes} restantes de ${pontosDisponiveisNaTrilha} pontos - Custo: ${custoPorMelhoria} pontos`}
          </strong>
        </div>

        {trilha === "atributos" && (
          <div className="upgrade-lista">
            {ATRIBUTOS_UPGRADE.map((atributo) => (
              <label key={atributo.chave}>
                <span className="upgrade-item-nome">{atributo.nome}</span>

                <small className="upgrade-item-atual">
                  Atual: {personagem.atributos?.[atributo.chave] || 0}
                </small>
                <input
                  type="number"
                  min="0"
                  value={distribuicao[atributo.chave] || 0}
                  onChange={(event) =>
                    atualizarDistribuicao(atributo.chave, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        )}

        {trilha === "passivos" && (
          <div className="upgrade-lista">
            {opcoesPassivas.map((passiva) => (
              <label key={passiva.chave}>
                <span className="upgrade-item-nome">{passiva.nome}</span>

                <small className="upgrade-item-atual">
                  Atual: {personagem.habilidadesPassivas?.[passiva.chave] || 0}
                </small>
                <input
                  type="number"
                  min="0"
                  value={distribuicao[passiva.chave] || 0}
                  onChange={(event) =>
                    atualizarDistribuicao(passiva.chave, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        )}

        {trilha === "habilidades" && (
          <div className="upgrade-habilidades-info">
            <h2>Habilidades Absolutas</h2>
            <p>
              Na arvore, aptidoes custam 10 pontos e habilidades de
              especialidade custam 20 pontos. A arvore usa o saldo de pontos
              disponiveis desta ficha:{" "}
              <strong>{pontosEvolucaoDisponiveis} pontos</strong>.
            </p>
            <button type="button" onClick={abrirArvore}>
              Abrir arvore de habilidades
            </button>
          </div>
        )}

        {mensagem && <p className="upgrade-mensagem">{mensagem}</p>}

        {trilha !== "habilidades" && (
          <button
            type="button"
            className="upgrade-confirmar"
            onClick={aplicarUpgrade}
            disabled={pontosEvolucaoDisponiveis <= 0}
          >
            Confirmar upgrade
          </button>
        )}
      </section>
    </main>
  );
};

export default UpgradeNivel;
