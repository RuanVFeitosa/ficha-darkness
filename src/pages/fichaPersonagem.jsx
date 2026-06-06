// src/components/FichaPersonagem.jsx
import React, { useState, useEffect } from "react";
import "../CSS/FichaPersonagem.css";
import "../CSS/CondicoesProfile.css";

import { condicoes } from "../components/data/condicoes";
import profile from "../assets/IMG/perfil_template.jpg";
import corpoHumano from "../assets/IMG/corpo_humano.png";
import { descricoesHabilidades } from "../components/descricoesHabilidades";
import ModalDescricao from "../components/modal/modalDescricao";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import {
  mdiDiceD4,
  mdiDiceD6,
  mdiDiceD8,
  mdiDiceD10,
  mdiDiceD12,
  mdiDiceD20,
} from "@mdi/js";

// Chave para o localStorage
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

// Estado inicial padrão
export const estadoInicial = {
  nome: "",
  pronome: "",
  classe: "",
  especialidade: "",
  fotoPerfil: "",
  textoExtra: "",
  atributos: {
    forca: 0,
    fonitude: 0,
    inteligencia: 0,
    reflexos: 0,
    vontade: 0,
  },
  vida: { atual: 0, max: 0 },
  sanidade: { atual: 50, max: 100 },
  esperanca: { atual: 30, max: 100 },
  membros: {
    cabeca: { atual: 100, max: 100, ferido: false, grave: false },
    torso: { atual: 500, max: 500, ferido: false, grave: false },
    bracoDireito: { atual: 8, max: 500, ferido: false, grave: false },
    bracoEsquerdo: { atual: 8, max: 500, ferido: false, grave: false },
    pernaDireita: { atual: 12, max: 500, ferido: false, grave: false },
    pernaEsquerda: { atual: 12, max: 500, ferido: false, grave: false },
  },
  habilidadesCombate: {
    razao: 0,
    firmeza: 0,
    intuicao: 0,
    violencia: 0,
    percepcao: 0,
    carisma: 0,
    persistencia: 0,
    resistencia: 0,
  },

  habilidadesPassivas: {
    enganacao: 0,
    raciocinioLogico: 0,
    investigacao: 0,
    instinto: 0,
    sensibilidade: 0,
    instintoSobrevivencia: 0,
    coragem: 0,
    diplomacia: 0,
    disciplina: 0,
    autocontrole: 0,
    intimidacaoPassiva: 0,
    presenca: 0,
    memoria: 0,
    empatia: 0,
    lealdade: 0,
    fe: 0,

    vitalidade: 0,
    folego: 0,
    equilibrio: 0,
    velocidade: 0,
    precisao: 0,
    lutar: 0,
    resistenciaFisica: 0,
    primeirosSocorros: 0,
    furtividade: 0,

    conhecimentoMedico: 0,
    conhecimentoTecnico: 0,
    conhecimentoHistorico: 0,
    conhecimentoOculto: 0,
    tecnologia: 0,
    tatica: 0,

    percepcaoAuditiva: 0,
    percepcaoVisual: 0,
    percepcaoOlfativa: 0,

    crime: 0,
    manipulacao: 0,
    intimidacao: 0,
    seducao: 0,
    resistenciaMental: 0,
  },

  rituais: [
    { nome: "Ritual da Protecao", custo: "3 PE" },
    { nome: "Invocaçao Menor", custo: "5 PE" },
  ],
  inventario: [
    { nome: "Pistola (9mm)", detalhes: "12 balas" },
    { nome: "Kit Primeiros Socorros", detalhes: "3 usos" },
    { nome: "Lanterna", detalhes: "Bateria fraca" },
  ],
  descricao: "",
  condicoesAtivas: [],
};

const FichaPersonagem = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [abaAtiva, setAbaAtiva] = useState("combate");
  const [ultimoSave, setUltimoSave] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const storageKey = `${STORAGE_KEY}_${fichaId}`;

  // ESTADO PARA O MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalDescricao, setModalDescricao] = useState("");

  // FUNÇÃO PARA ABRIR MODAL
  const abrirModal = (titulo, chaveHabilidade) => {
    setModalTitulo(titulo);
    setModalDescricao(
      descricoesHabilidades[chaveHabilidade] || "Descrição não disponível.",
    );
    setModalAberto(true);
  };

  // FUNÇÃO PARA FECHAR MODAL
  const fecharModal = () => {
    setModalAberto(false);
  };

  // CARREGAR DADOS AO INICIAR
  useEffect(() => {
    localStorage.setItem(ULTIMA_FICHA_KEY, fichaId);

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi) {
          setPersonagem(personagemApi);
          console.log("Dados carregados do backend");
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Tentando carregar localStorage.");
      })
      .finally(() => {
        setCarregado(true);
      });

    const dadosSalvos = localStorage.getItem(storageKey);
    if (dadosSalvos) {
      try {
        const personagemSalvo = JSON.parse(dadosSalvos);
        setPersonagem(personagemSalvo);
        console.log("✅ Dados carregados do salvamento anterior");
      } catch (error) {
        console.error("❌ Erro ao carregar dados salvos:", error);
      }
    }
  }, [fichaId, storageKey]);

  // SALVAR DADOS AUTOMATICAMENTE QUANDO MUDAR
  useEffect(() => {
    if (!carregado) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(personagem));
    setUltimoSave(new Date().toLocaleTimeString());

    salvarPersonagem(fichaId, personagem).catch((error) => {
      console.warn("Backend indisponivel. Dados mantidos no localStorage.", error);
    });
  }, [personagem, carregado, fichaId, storageKey]);

  // FUNÇÕES DE ATUALIZAÇÃO
  const atualizarAtributo = (atributo, valor) => {
    setPersonagem((prev) => ({
      ...prev,
      atributos: {
        ...prev.atributos,
        [atributo]: parseInt(valor) || 0,
      },
    }));
  };

  const atualizarSanidade = (novaSanidade) => {
    setPersonagem((prev) => ({
      ...prev,
      sanidade: {
        ...prev.sanidade,
        atual: Math.max(
          0,
          Math.min(prev.sanidade.max, parseInt(novaSanidade) || 0),
        ),
      },
    }));
  };

  const atualizarEsperanca = (novaEsperanca) => {
    setPersonagem((prev) => ({
      ...prev,
      esperanca: {
        ...prev.esperanca,
        atual: Math.max(
          0,
          Math.min(prev.esperanca.max, parseInt(novaEsperanca) || 0),
        ),
      },
    }));
  };

  const atualizarVidaMembro = (membro, novoValor) => {
    setPersonagem((prev) => {
      const max = prev.membros[membro].max;
      const atual = Math.max(0, Math.min(max, parseInt(novoValor) || 0));
      const porcentagemVida = max > 0 ? atual / max : 0;

      return {
        ...prev,
        membros: {
          ...prev.membros,
          [membro]: {
            ...prev.membros[membro],
            atual,
            ferido: atual < max && porcentagemVida < 0.5,
            grave: porcentagemVida <= 0.1,
          },
        },
      };
    });
  };
  const atualizarHabilidadeCombate = (habilidade, valor) => {
    setPersonagem((prev) => ({
      ...prev,
      habilidadesCombate: {
        ...prev.habilidadesCombate,
        [habilidade]: parseInt(valor) || 0,
      },
    }));
  };

  const atualizarHabilidadePassiva = (habilidade, valor) => {
    setPersonagem((prev) => ({
      ...prev,
      habilidadesPassivas: {
        ...prev.habilidadesPassivas,
        [habilidade]: Math.max(0, Math.min(100, parseInt(valor) || 0)),
      },
    }));
  };

  const atualizarDescricao = (novaDescricao) => {
    setPersonagem((prev) => ({
      ...prev,
      descricao: novaDescricao,
    }));
  };

  // Calcular vida total baseada nos membros
  const vidaTotal = {
    atual: Object.values(personagem.membros).reduce(
      (acc, m) => acc + m.atual,
      0,
    ),
    max: Object.values(personagem.membros).reduce((acc, m) => acc + m.max, 0),
  };

  // Componente para cada habilidade passiva
  const calcularModificadorAtivo = (valor) => {
    const numero = parseInt(valor) || 0;

    if (numero >= 50) return 5;
    if (numero >= 40) return 4;
    if (numero >= 30) return 3;
    if (numero >= 20) return 2;
    if (numero >= 10) return 1;

    return 0;
  };

  const Ativo = ({ nome, chave, atributoBase }) => {
    const valor = calcularModificadorAtivo(personagem.atributos[atributoBase]);

    return (
      <div className="ativo-item">
        <span
          className="ativo-nome clickable"
          onClick={() => abrirModal(nome, chave)}
          title="Clique para ver descrição"
        >
          {nome}
        </span>

        <span className="ativo-valor">{valor > 0 ? `+${valor}` : "0"}</span>
      </div>
    );
  };

  const HabilidadePassiva = ({ nome, chave }) => {
    const valor = personagem.habilidadesPassivas[chave] || 0;

    return (
      <div className="habilidade-passiva-item">
        <span
          className="passiva-nome clickable"
          onClick={() => abrirModal(nome, chave)}
          title="Clique para ver descrição"
        >
          {nome}
        </span>
        <div className="passiva-controles">
          <input
            type="number"
            value={valor}
            onChange={(e) => atualizarHabilidadePassiva(chave, e.target.value)}
            className="passiva-valor"
            min="0"
            max="100"
          />
          <div className="passiva-botoes">
            <button
              onClick={() =>
                atualizarHabilidadePassiva(chave, Math.max(0, valor - 1))
              }
            >
              -
            </button>
            <button
              onClick={() =>
                atualizarHabilidadePassiva(chave, Math.min(100, valor + 1))
              }
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const conflitosCondicoes = {
    congelado: ["em-chamas", "hipertermia"],
    "em-chamas": ["congelado"],
    hipertermia: ["congelado"],

    marcado: ["exposto"],
    exposto: ["marcado"],

    cego: ["cegueira-temporaria"],
    "cegueira-temporaria": ["cego"],

    surdo: ["silenciado"],
    silenciado: ["surdo"],

    paralisado: ["acorrentado", "restrito"],
    acorrentado: ["paralisado"],
    restrito: ["paralisado"],

    inconsciente: ["atordoado", "confuso", "desorientado", "sob-pressao"],
    atordoado: ["inconsciente"],
    confuso: ["inconsciente"],
    desorientado: ["inconsciente"],
    "sob-pressao": ["inconsciente"],

    "estado-critico": ["surto-adrenalina"],
    "surto-adrenalina": ["estado-critico"],
  };

  // Conteúdo das abas
  const conteudoAbas = {
    combate: (
      <div className="conteudo-aba">
        <h4>ATIVOS</h4>

        <div className="lista-ativos">
          <Ativo nome="Razão" chave="razao" atributoBase="inteligencia" />

          <Ativo nome="Intuição" chave="intuicao" atributoBase="inteligencia" />

          <Ativo nome="Percepção" chave="percepcao" atributoBase="vontade" />

          <Ativo nome="Firmeza" chave="firmeza" atributoBase="reflexos" />

          <Ativo nome="Violência" chave="violencia" atributoBase="forca" />

          <Ativo nome="Carisma" chave="carisma" atributoBase="vontade" />

          <Ativo
            nome="Persistência"
            chave="persistencia"
            atributoBase="vontade"
          />

          <Ativo
            nome="Resistência"
            chave="resistencia"
            atributoBase="fonitude"
          />
        </div>
      </div>
    ),

    passivas: (
      <div className="conteudo-aba passiva-aba">
        <div className="categorias-passivas">
          {/* MENTAIS & SOCIAIS */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">MENTAIS & SOCIAIS</h5>

            <div className="lista-passivas">
              <HabilidadePassiva nome="Enganação" chave="enganacao" />
              <HabilidadePassiva
                nome="Raciocínio Lógico"
                chave="raciocinioLogico"
              />
              <HabilidadePassiva nome="Investigação" chave="investigacao" />
              <HabilidadePassiva nome="Instinto" chave="instinto" />
              <HabilidadePassiva nome="Sensibilidade" chave="sensibilidade" />
              <HabilidadePassiva
                nome="Instinto de Sobrevivência"
                chave="instintoSobrevivencia"
              />
              <HabilidadePassiva nome="Coragem" chave="coragem" />
              <HabilidadePassiva nome="Diplomacia" chave="diplomacia" />
              <HabilidadePassiva nome="Disciplina" chave="disciplina" />
              <HabilidadePassiva nome="Autocontrole" chave="autocontrole" />
              <HabilidadePassiva
                nome="Intimidação Passiva"
                chave="intimidacaoPassiva"
              />
              <HabilidadePassiva nome="Presença" chave="presenca" />
              <HabilidadePassiva nome="Memória" chave="memoria" />
              <HabilidadePassiva nome="Empatia" chave="empatia" />
              <HabilidadePassiva nome="Lealdade" chave="lealdade" />
              <HabilidadePassiva nome="Fé" chave="fe" />
            </div>
          </div>

          {/* FÍSICAS */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">FÍSICAS</h5>

            <div className="lista-passivas">
              <HabilidadePassiva nome="Vitalidade" chave="vitalidade" />
              <HabilidadePassiva nome="Fôlego" chave="folego" />
              <HabilidadePassiva nome="Equilíbrio" chave="equilibrio" />
              <HabilidadePassiva nome="Velocidade" chave="velocidade" />
              <HabilidadePassiva nome="Precisão" chave="precisao" />
              <HabilidadePassiva nome="Lutar" chave="lutar" />
              <HabilidadePassiva
                nome="Resistência Física"
                chave="resistenciaFisica"
              />
              <HabilidadePassiva nome="Furtividade" chave="furtividade" />
            </div>
          </div>

          {/* CONHECIMENTOS */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">CONHECIMENTOS</h5>

            <div className="lista-passivas">
              <HabilidadePassiva
                nome="Conhecimento Médico"
                chave="conhecimentoMedico"
              />
              <HabilidadePassiva
                nome="Primeiros Socorros"
                chave="primeirosSocorros"
              />
              <HabilidadePassiva
                nome="Conhecimento Técnico"
                chave="conhecimentoTecnico"
              />
              <HabilidadePassiva
                nome="Conhecimento Histórico"
                chave="conhecimentoHistorico"
              />
              <HabilidadePassiva
                nome="Conhecimento Oculto"
                chave="conhecimentoOculto"
              />
              <HabilidadePassiva nome="Tecnologia" chave="tecnologia" />
              <HabilidadePassiva nome="Tática" chave="tatica" />
            </div>
          </div>

          {/* PERCEPÇÕES */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">PERCEPÇÕES</h5>

            <div className="lista-passivas">
              <HabilidadePassiva
                nome="Percepção Auditiva"
                chave="percepcaoAuditiva"
              />
              <HabilidadePassiva
                nome="Percepção Visual"
                chave="percepcaoVisual"
              />
              <HabilidadePassiva
                nome="Percepção Olfativa"
                chave="percepcaoOlfativa"
              />
            </div>
          </div>

          {/* SOBREVIVÊNCIA & CRIME */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">SOBREVIVÊNCIA & CRIME</h5>

            <div className="lista-passivas">
              <HabilidadePassiva nome="Crime" chave="crime" />
              <HabilidadePassiva nome="Manipulação" chave="manipulacao" />
              <HabilidadePassiva nome="Intimidação" chave="intimidacao" />
              <HabilidadePassiva nome="Sedução" chave="seducao" />
              <HabilidadePassiva
                nome="Resistência Mental"
                chave="resistenciaMental"
              />
            </div>
          </div>
        </div>
      </div>
    ),

    rituais: (
      <div className="conteudo-aba">
        <h4>RITUAIS CONHECIDOS</h4>
        <div className="lista-rituais">
          {personagem.rituais.map((ritual, index) => (
            <div key={index} className="ritual-item">
              <span>{ritual.nome}</span>
              <span className="custo-ritual">{ritual.custo}</span>
            </div>
          ))}
        </div>
      </div>
    ),

    inventario: (
      <div className="conteudo-aba">
        <h4>INVENTÁRIO</h4>
        <div className="lista-inventario">
          {personagem.inventario.map((item, index) => (
            <div key={index} className="item-inventario">
              <span>{item.nome}</span>
              <span>{item.detalhes}</span>
            </div>
          ))}
        </div>
      </div>
    ),

    corpo: (
      <div className="conteudo-aba corpo-aba">
        <div className="sistema-membros-sidebar">
          <div className="corpo-container-sidebar">
            <div className="controles-membros-sidebar">
              <p className="integridade">Intergridade</p>

              <MembroControle
                nome="CABEÇA"
                membro={personagem.membros.cabeca}
                onChange={(valor) => atualizarVidaMembro("cabeca", valor)}
                classNameInput="cabeca-input"
              />
              <MembroControle
                nome="TORSO"
                membro={personagem.membros.torso}
                onChange={(valor) => atualizarVidaMembro("torso", valor)}
                classNameInput="torso-input"
              />
              <MembroControle
                nome="BRAÇO DIREITO"
                membro={personagem.membros.bracoDireito}
                onChange={(valor) => atualizarVidaMembro("bracoDireito", valor)}
                classNameInput="bracoDireito-input"
              />
              <MembroControle
                nome="BRAÇO ESQUERDO"
                membro={personagem.membros.bracoEsquerdo}
                onChange={(valor) =>
                  atualizarVidaMembro("bracoEsquerdo", valor)
                }
                classNameInput="bracoEsquerdo-input"
              />
              <MembroControle
                nome="PERNA DIREITA"
                membro={personagem.membros.pernaDireita}
                onChange={(valor) => atualizarVidaMembro("pernaDireita", valor)}
                classNameInput="pernaDireita-input"
              />
              <MembroControle
                nome="PERNA ESQUERDA"
                membro={personagem.membros.pernaEsquerda}
                onChange={(valor) =>
                  atualizarVidaMembro("pernaEsquerda", valor)
                }
                classNameInput="pernaEsquerda-input"
              />
            </div>
          </div>

          <div className="vida-total-sidebar">
            <div className="vida-total-info">
              <span className="vida-total-label">VIDA TOTAL:</span>
              <span className="vida-total-valor">
                {vidaTotal.atual} / {vidaTotal.max}
              </span>
            </div>
          </div>
          <div className="condicoes-container">
            <p className="condicoes-titulo">CONDIÇÕES</p>

            <div className="lista-condicoes">
              {condicoes.map((condicao, index) => (
                <button
                  key={index}
                  className={` condicao-chip ${personagem.condicoesAtivas?.includes(condicao.classe) ? "ativa" : ""}
                  ${condicao.classe}`}
                  onClick={() => {
                    setModalTitulo(condicao.nome);
                    setModalDescricao(condicao.descricao);

                    setPersonagem((prev) => {
                      const atuais = prev.condicoesAtivas || [];
                      const jaTem = atuais.includes(condicao.classe);

                      if (jaTem) {
                        return {
                          ...prev,
                          condicoesAtivas: atuais.filter(
                            (classe) => classe !== condicao.classe,
                          ),
                        };
                      }

                      const conflitos =
                        conflitosCondicoes[condicao.classe] || [];

                      const novasCondicoes = atuais.filter(
                        (classe) => !conflitos.includes(classe),
                      );

                      return {
                        ...prev,
                        condicoesAtivas: [...novasCondicoes, condicao.classe],
                      };
                    });

                    setModalAberto(true);
                  }}
                >
                  {condicao.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    descricao: (
      <div className="conteudo-aba">
        <h4>DESCRIÇÃO & ANOTAÇÕES</h4>
        <textarea
          className="textarea-descricao"
          placeholder="Descreva seu personagem, anotações importantes, história..."
          rows="8"
          value={personagem.descricao}
          onChange={(e) => atualizarDescricao(e.target.value)}
        />
      </div>
    ),

    condicoes: (
      <div className="conteudo-aba">
        <h4>CONDIÇÕES</h4>

        <div className="lista-condicoes">
          {condicoes.map((condicao, index) => (
            <button
              key={index}
              className="condicao-chip"
              onClick={() => {
                setModalTitulo(condicao.nome);
                setModalDescricao(condicao.descricao);

                setPersonagem((prev) => {
                  const atuais = prev.condicoesAtivas || [];

                  const jaTem = atuais.includes(condicao.classe);

                  return {
                    ...prev,

                    condicoesAtivas: jaTem
                      ? atuais.filter((classe) => classe !== condicao.classe)
                      : [...atuais, condicao.classe],
                  };
                });

                setModalAberto(true);
              }}
            >
              {condicao.nome}
            </button>
          ))}
        </div>
      </div>
    ),
  };
  const primeiraCondicaoAtiva = personagem.condicoesAtivas?.[0] || "";

  return (
    <div className="ficha-container">
      {/* Container Principal: Perfil + Atributos + Sidebar */}
      <div className="main-content">
        {/* ... (seu conteúdo existente permanece igual) ... */}
        <div className="profile-section">
          <div className="profile-container">
            {/* Sanidade */}
            <div className="sanidade-section">
              <div className="sanidade-container">
                <div className="sanidade-inputs">
                  <div className="identidade-personagem">
                    {/* Nome do Personagem */}
                    <input
                      type="text"
                      placeholder="NOME DO PERSONAGEM"
                      value={personagem.nome}
                      onChange={(e) =>
                        setPersonagem((prev) => ({
                          ...prev,
                          nome: e.target.value,
                        }))
                      }
                      maxLength={30}
                      className="nome-personagem"
                    />
                    <div className="dados-personagem">
                      <input
                        type="text"
                        placeholder="CLASSE"
                        value={personagem.classe || ""}
                        onChange={(e) =>
                          setPersonagem((prev) => ({
                            ...prev,
                            classe: e.target.value,
                          }))
                        }
                        className="dado-personagem"
                        maxLength={30}
                      />
                      <input
                        type="text"
                        placeholder="PRONOME"
                        value={personagem.pronome || ""}
                        onChange={(e) =>
                          setPersonagem((prev) => ({
                            ...prev,
                            pronome: e.target.value,
                          }))
                        }
                        className="dado-personagem"
                        maxLength={10}
                      />
                      <input
                        type="text"
                        placeholder="ESPECIALIDADE"
                        value={personagem.especialidade || ""}
                        onChange={(e) =>
                          setPersonagem((prev) => ({
                            ...prev,
                            especialidade: e.target.value,
                          }))
                        }
                        className="dado-personagem"
                        maxLength={40}
                      />
                    </div>
                  </div>
                  <div className={`profile-wrapper ${primeiraCondicaoAtiva}`}>
                    <img
                      src={personagem.fotoPerfil || profile}
                      alt="Perfil"
                      className="profile"
                    />

                    <div className="profile-overlay"></div>
                  </div>
                  <div className="sanidade-completa">
                    <p className="sanidade-titulo">Sanidade</p>
                    <input
                      type="number"
                      value={personagem.sanidade.atual}
                      onChange={(e) => atualizarSanidade(e.target.value)}
                      className="sanidade-atual"
                      min="0"
                      max={personagem.sanidade.max}
                    />
                    <span className="sanidade-separador">/</span>
                    <input
                      type="number"
                      value={personagem.sanidade.max}
                      onChange={(e) =>
                        setPersonagem((prev) => ({
                          ...prev,
                          sanidade: {
                            ...prev.sanidade,
                            max: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="sanidade-max"
                      min="0"
                    />
                  </div>
                </div>

                {/* Esperança */}
                <div className="esperanca-section">
                  <div className="esperanca-container">
                    <div className="esperanca-inputs">
                      <p className="esperanca-titulo"> Esperança </p>
                      <input
                        type="number"
                        value={personagem.esperanca.atual}
                        onChange={(e) => atualizarEsperanca(e.target.value)}
                        className="esperanca-atual"
                        min="0"
                        max={personagem.esperanca.max}
                      />
                      <span className="esperanca-separador">/</span>
                      <input
                        type="number"
                        value={personagem.esperanca.max}
                        onChange={(e) =>
                          setPersonagem((prev) => ({
                            ...prev,
                            esperanca: {
                              ...prev.esperanca,
                              max: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="esperanca-max"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna do Centro: Atributos em Linha */}
            <div className="atributoCompleto">
              <div className="atributos-coluna">
                <div className="atributos-linha">
                  <Atributo
                    nome="FORÇA"
                    valor={personagem.atributos.forca}
                    onChange={(valor) => atualizarAtributo("forca", valor)}
                  />
                  <Atributo
                    nome="FORTITUDE"
                    valor={personagem.atributos.fonitude}
                    onChange={(valor) => atualizarAtributo("fonitude", valor)}
                  />
                  <Atributo
                    nome="INTELIGÊNCIA"
                    valor={personagem.atributos.inteligencia}
                    onChange={(valor) =>
                      atualizarAtributo("inteligencia", valor)
                    }
                  />
                  <Atributo
                    nome="REFLEXOS"
                    valor={personagem.atributos.reflexos}
                    onChange={(valor) => atualizarAtributo("reflexos", valor)}
                  />
                  <Atributo
                    nome="VONTADE"
                    valor={personagem.atributos.vontade}
                    onChange={(valor) => atualizarAtributo("vontade", valor)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Sidebar com Abas */}
        <div className="sidebar-container">
          <div className="sidebar-abas">
            <button
              className={`aba-btn ${abaAtiva === "combate" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("combate")}
            >
              Ativas
            </button>
            <button
              className={`aba-btn ${abaAtiva === "passivas" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("passivas")}
            >
              PASSIVA
            </button>
            <button
              className={`aba-btn ${abaAtiva === "rituais" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("rituais")}
            >
              RITUAIS
            </button>
            <button
              className={`aba-btn ${abaAtiva === "inventario" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("inventario")}
            >
              INVENTARIO
            </button>
            <button
              className={`aba-btn ${abaAtiva === "corpo" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("corpo")}
            >
              CORPO
            </button>
            <button
              className={`aba-btn ${abaAtiva === "descricao" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("descricao")}
            >
              DESCRICÃO
            </button>
          </div>

          <div className="sidebar-conteudo">{conteudoAbas[abaAtiva]}</div>
        </div>
      </div>
    </div>
  );
};

// Componente de Atributo
const calcularDadoAtributo = (valor) => {
  const numero = parseInt(valor) || 0;

  if (numero >= 50) return mdiDiceD20;
  if (numero >= 40) return mdiDiceD12;
  if (numero >= 30) return mdiDiceD10;
  if (numero >= 20) return mdiDiceD8;
  if (numero >= 10) return mdiDiceD6;

  return mdiDiceD4;
};

const Atributo = ({ nome, valor, onChange }) => {
  const dado = calcularDadoAtributo(valor);

  return (
    <div className="atributoCompleto">
      <div className="atributo-dado">
        <Icon path={dado} size={2} />
      </div>{" "}
      <div className="atributo-item">
        <span className="atributo-nome">{nome}</span>
        <div className="atributo-controles">
          <input
            type="number"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="atributo-valor"
          />
          <div className="atributo-botoes">
            <button onClick={() => onChange(valor - 1)}>-</button>
            <button onClick={() => onChange(valor + 1)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Barra de Recurso
const BarraRecurso = ({ nome, atual, max, onChange, cor }) => {
  return (
    <div className="barra-recurso">
      <span className="recurso-nome">{nome}</span>
      <div className="recurso-controles">
        <input
          type="number"
          value={atual}
          onChange={(e) => onChange?.(parseInt(e.target.value), max)}
          className="recurso-atual"
        />
        <span>/</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onChange?.(atual, parseInt(e.target.value))}
          className="recurso-max"
        />
      </div>
    </div>
  );
};

// COMPONENTE MembroControle
const MembroControle = ({ nome, membro, onChange, classNameInput }) => {
  const estadoVida = membro.grave ? "grave" : membro.ferido ? "ferido" : "";

  return (
    <div className={`membro-controle ${estadoVida}`}>
      <span className="membro-nome">{nome}</span>

      <div className="membro-inputs">
        <input
          type="number"
          value={membro.atual}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={`membro-atual ${classNameInput}`}
          min="0"
          max={membro.max}
        />

        <span>/</span>

        <input
          type="number"
          value={membro.max}
          className="membro-max"
          min="0"
        />
      </div>

      <div className="membro-botoes">
        <button onClick={() => onChange(membro.atual - 1)}>-</button>
        <button onClick={() => onChange(membro.atual + 1)}>+</button>
      </div>
    </div>
  );
};

export default FichaPersonagem;
