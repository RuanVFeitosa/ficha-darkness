import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import "../CSS/UpgradeNivel.css";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
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
  return normalizarFichaId(params.get("ficha"));
};

const UpgradeNivel = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [trilha, setTrilha] = useState("atributos");
  const [distribuicao, setDistribuicao] = useState({});
  const [mensagem, setMensagem] = useState("");
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
  const custos = obterCustosNivel(nivelAtual);
  const pontosEvolucaoDisponiveis = Math.max(
    0,
    parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0,
  );
  const custoPorMelhoria = custos[trilha] || 0;
  const pontosGastos = useMemo(
    () =>
      Object.values(distribuicao).reduce(
        (total, valor) => total + Math.max(0, parseInt(valor, 10) || 0),
        0,
      ) * custoPorMelhoria,
    [custoPorMelhoria, distribuicao],
  );
  const pontosRestantes = Math.max(0, pontosEvolucaoDisponiveis - pontosGastos);

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
    window.location.href = `?ficha=${encodeURIComponent(fichaId)}`;
  };

  const abrirArvore = () => {
    window.location.href = `?habilidades=1&ficha=${encodeURIComponent(fichaId)}`;
  };

  const alterarTrilha = (novaTrilha) => {
    setTrilha(novaTrilha);
    setDistribuicao({});
    setMensagem("");
  };

  const atualizarDistribuicao = (chave, valor) => {
    const numero = Math.max(0, parseInt(valor, 10) || 0);
    setDistribuicao((atual) => ({
      ...atual,
      [chave]: numero,
    }));
  };

  const aplicarUpgrade = () => {
    if (trilha === "habilidades") {
      abrirArvore();
      return;
    }

    if (pontosEvolucaoDisponiveis <= 0) {
      setMensagem("Voce nao tem pontos de evolucao disponiveis.");
      return;
    }

    if (pontosGastos <= 0) {
      setMensagem("Distribua pelo menos 1 ponto antes de confirmar.");
      return;
    }

    if (pontosGastos > pontosEvolucaoDisponiveis) {
      setMensagem("Voce esta gastando mais pontos do que possui.");
      return;
    }

    const atualizado = {
      ...personagem,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis: pontosEvolucaoDisponiveis - pontosGastos,
      },
      historicoUpgrades: [
        ...(personagem.historicoUpgrades || []),
        {
          nivel: nivelAtual,
          trilha,
          pontos: distribuicao,
          custo: pontosGastos,
          criadoEm: new Date().toISOString(),
        },
      ],
    };

    if (trilha === "atributos") {
      atualizado.atributos = { ...(personagem.atributos || {}) };
      Object.entries(distribuicao).forEach(([chave, valor]) => {
        atualizado.atributos[chave] = Math.min(
          nivelAtual > 5 ? 100 : 50,
          (parseInt(atualizado.atributos[chave], 10) || 0) + valor,
        );
      });
    }

    if (trilha === "passivos") {
      atualizado.habilidadesPassivas = {
        ...(personagem.habilidadesPassivas || {}),
      };
      Object.entries(distribuicao).forEach(([chave, valor]) => {
        atualizado.habilidadesPassivas[chave] = Math.min(
          nivelAtual > 5 ? 20 : 10,
          (parseInt(atualizado.habilidadesPassivas[chave], 10) || 0) + valor,
        );
      });
    }

    setPersonagem(atualizado);
    setDistribuicao({});
    setMensagem("Upgrade aplicado. Pontos de evolucao atualizados.");

    try {
      localStorage.setItem(storageKey, JSON.stringify(atualizado));
    } catch (error) {
      console.warn("Nao foi possivel salvar upgrade localmente.", error);
    }

    salvarPersonagem(fichaId, atualizado).catch((error) => {
      console.warn("Backend indisponivel. Upgrade salvo localmente.", error);
    });
  };

  const opcoesPassivas = Object.keys(personagem.habilidadesPassivas || {}).map(
    (chave) => ({ chave, nome: chave }),
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
          <strong>{custos.acumulado} pts ganhos no NV{nivelAtual}</strong>
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
          <span>Pontos da trilha</span>
          <strong>
            {pontosRestantes} restantes - custo {custoPorMelhoria} por ponto
          </strong>
        </div>

        {trilha === "atributos" && (
          <div className="upgrade-lista">
            {ATRIBUTOS_UPGRADE.map((atributo) => (
              <label key={atributo.chave}>
                <span>
                  {atributo.nome}
                  <small>Atual: {personagem.atributos?.[atributo.chave] || 0}</small>
                </span>
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
                <span>
                  {passiva.nome}
                  <small>
                    Atual: {personagem.habilidadesPassivas?.[passiva.chave] || 0}
                  </small>
                </span>
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
              As habilidades e aptidoes usam o proprio preco em PE como custo.
              Abra a arvore para adquirir cada uma usando seus pontos de
              evolucao disponiveis.
            </p>
            <button type="button" onClick={abrirArvore}>
              Abrir arvore de habilidades
            </button>
          </div>
        )}

        {mensagem && <p className="upgrade-mensagem">{mensagem}</p>}

       
      </section>
    </main>
  );
};

export default UpgradeNivel;
