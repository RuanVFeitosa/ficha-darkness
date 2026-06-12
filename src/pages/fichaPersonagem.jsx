// src/components/FichaPersonagem.jsx
import React, { useState, useEffect } from "react";
import "../CSS/FichaPersonagem.css";
import "../CSS/CondicoesProfile.css";

import { condicoes } from "../components/data/condicoes";
import { receitasCriacao } from "../components/data/receitasCriacao";
import profile from "../assets/IMG/OAbsoluto.png";
import corpoHumano from "../assets/IMG/corpo_humano.png";
import { descricoesHabilidades } from "../components/descricoesHabilidades";
import ModalDescricao from "../components/modal/modalDescricao";
import { buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import {
  mdiShieldCrownOutline,
  mdiStorefrontOutline,
  mdiDiceD4,
  mdiDiceD6,
  mdiDiceD8,
  mdiDiceD10,
  mdiDiceD12,
  mdiDiceD20,
  mdiShieldOutline,
} from "@mdi/js";
import {
  listarHabilidadesSelecionadas,
  obterArvoreClasse,
} from "../data/Classes/arvoresHabilidades";

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

const salvarLocalSeguro = (chave, valor) => {
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch (error) {
    console.warn("Nao foi possivel salvar no localStorage.", error);
    return false;
  }
};

const lerLocalSeguro = (chave) => {
  try {
    return localStorage.getItem(chave);
  } catch (error) {
    console.warn("Nao foi possivel ler o localStorage.", error);
    return null;
  }
};

const salvarPersonagemLocalSeguro = (chave, personagem) => {
  if (salvarLocalSeguro(chave, JSON.stringify(personagem))) {
    return;
  }

  const personagemSemFoto = {
    ...personagem,
    fotoPerfil: "",
  };

  if (!salvarLocalSeguro(chave, JSON.stringify(personagemSemFoto))) {
    try {
      localStorage.removeItem(chave);
    } catch (error) {
      console.warn("Nao foi possivel limpar o salvamento local.", error);
    }
  }
};

const TEMA_PADRAO_FICHA = {
  primaria: "#ffffff",
  secundaria: "#000000",
  texto: "#ffffff",
  fundo: "#000000",
  borda: "#ffffff",
};

const MALETA_DE_CAMPO = {
  nome: "Maleta de Campo",
  tipo: "Item de Classe",
  icone: "🩺",
  detalhes: "Equipamento Médico",
  descricao:
    "A Maleta de Campo é o coração operacional de todo agente em missão. Mais do que um simples recipiente, ela representa preparo, sobrevivência e adaptação diante do desconhecido.",
  compartimentos: {
    medicinal: [],
    combate: [],
    geral: [],
  },
  aprimoramentosAtivos: [],
  personalizado: false,
};

// Estado inicial padrão
export const estadoInicial = {
  nome: "",
  pronome: "",
  classe: "",
  especialidade: "",
  fotoPerfil: "",
  textoExtra: "",

  lojaCreditos: 0,
  ritosCreditos: 0,
  nivel: 1,
  pontosEvolucao: {
    disponiveis: 0,
    acumulados: 0,
  },
  pontosHabilidades: {
    disponiveis: 0,
  },
  defesaGeral: 0,
  bloqueio: 0,
  esquiva: 0,
  protecao: "",
  resistencias: "",
  proficiencias: "",
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
    cabeca: {
      atual: 100,
      max: 100,
      defesa: 0,
      ferido: false,
      grave: false,
    },

    torso: {
      atual: 500,
      max: 500,
      defesa: 0,
      ferido: false,
      grave: false,
    },

    bracoDireito: {
      atual: 8,
      max: 500,
      defesa: 0,
      ferido: false,
      grave: false,
    },

    bracoEsquerdo: {
      atual: 8,
      max: 500,
      defesa: 0,
      ferido: false,
      grave: false,
    },

    pernaDireita: {
      atual: 12,
      max: 500,
      defesa: 0,
      ferido: false,
      grave: false,
    },

    pernaEsquerda: {
      atual: 12,
      max: 500,
      defesa: 0,
      ferido: false,
      grave: false,
    },
  },

  classeEspecialidade: {
    arquetipo: "",
    classeEscolhida: "",
    especializacao: "",
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
  habilidadesClasse: {
    habilidadeAbsoluta: "",
    aptidoes: {},
    especialidade: "",
    especialidadeDefinida: false,
    habilidadesEspecialidade: {},
  },
  inventario: [
    { nome: "Pistola (9mm)", detalhes: "12 balas" },

    { nome: "Kit Primeiros Socorros", detalhes: "3 usos" },
    { nome: "Lanterna", detalhes: "Bateria fraca" },
  ],
  anotacao: "",
  historia: "",
  condicoesAtivas: [],
  ritosAtivos: [],
  habilidadesTemporarias: {},
  materiaisCriacao: {
    alcool: 0,
    trapos: 0,
    recipiente: 0,
    explosivos: 0,
    fita: 0,
    laminas: 0,
    pregos: 0,
    madeira: 0,
    cano: 0,
    faca: 0,
  },
  temaFicha: {
    ...TEMA_PADRAO_FICHA,
  },
  maletaCampo: {
    aprimoramentosAtivos: [],
    medicinal: [],
    combate: [],
    geral: [],
  },
};

const ItemRecolhivel = ({ item, tipo, acaoExtra }) => {
  const armaStatus = item.armaStatus;

  return (
    <details className={`item-recolhivel item-${tipo}`}>
      <summary>
        <span>{item.nome}</span>
        {item.usos && (
          <p>
            <strong>Usos:</strong> {item.usos}
          </p>
        )}
        <small>{item.detalhes || item.custo || item.tipo || tipo}</small>
      </summary>

      <div className="item-recolhivel-conteudo">
        {item.descricao && <p>{item.descricao}</p>}
        {item.detalhe && <p>{item.detalhe}</p>}
        {item.detalhes && <p>{item.detalhes}</p>}
        {item.absolutismo && (
          <p>
            <b>Absolutismo:</b> {item.absolutismo}
          </p>
        )}
        {item.durabilidade && (
          <p>
            <b>Durabilidade:</b> {item.durabilidade}
          </p>
        )}
        {item.custo && (
          <p>
            <b>Custo:</b> {item.custo}
          </p>
        )}

        {armaStatus && (
          <div className="item-status-grid">
            <span>
              <b>DMG:</b> {armaStatus.dmg}
            </span>
            <span>
              <b>ROF:</b> {armaStatus.rof}
            </span>
            <span>
              <b>MAG:</b> {armaStatus.mag}
            </span>
            <span>
              <b>Crítico:</b> {armaStatus.critico}
            </span>
            <span>
              <b>Hipfire:</b> {armaStatus.hipfire}
            </span>
            <span>
              <b>Precision:</b> {armaStatus.precision}
            </span>
            <span>
              <b>Control:</b> {armaStatus.control}
            </span>
            <span>
              <b>Mobility:</b> {armaStatus.mobility}
            </span>
          </div>
        )}

        {acaoExtra}
      </div>
    </details>
  );
};

const descricoesAtivos = {
  razao:
    "INTELIGÊNCIA | Razão\n\nMede a capacidade analítica da personagem. Uma PJ com Razão elevada é boa em coleta de informações e investigação.",

  intuicao:
    "INTELIGÊNCIA | Intuição\n\nMede a empatia e o instinto do personagem. Um PJ com Intuição elevada é bom em perceber intenções.",

  percepcao:
    "VONTADE | Percepção\n\nMede o estado de alerta do personagem. Uma PJ com Percepção elevada é boa em avaliar o ambiente e perceber o que os outros ignoram.",

  firmeza:
    "REFLEXOS | Firmeza\n\nMede o controle do personagem sob pressão. Uma PJ com Firmeza elevada é boa em furtividade, furto e outras situações que exigem decisões rápidas sob estresse.",

  violencia:
    "FORÇA | Violência\n\nMede a força bruta, habilidade de combate e ferocidade do personagem. Um PJ com Violência elevada se sobressai em infligir dano aos outros.",

  carisma:
    "VONTADE | Carisma\n\nMede o charme, a liderança e o talento retórico do personagem. Uma PJ com Carisma elevado facilmente persuade e manipula os outros.",

  persistencia:
    "VONTADE | Resiliência\n\nMede o esforço mental para aguentar situações de intenso desequilíbrio mental. Quanto maior a Resiliência, maior a resistência a danos mentais.",

  resistencia:
    "FORTITUDE | Resistência\n\nMede sua capacidade de aguentar venenos, sangramento e outros efeitos físicos. Quanto maior a Resistência, mais difícil sofrer penalidades.",
};

const FichaPersonagem = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [abaAtiva, setAbaAtiva] = useState("combate");
  const [ultimoSave, setUltimoSave] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const [subAbaInventario, setSubAbaInventario] = useState("mochila");
  const [abaCriacao, setAbaCriacao] = useState("armas");
  const [mensagemCraft, setMensagemCraft] = useState("");
  const [modalRolagem, setModalRolagem] = useState(null);
  const [rolandoDados, setRolandoDados] = useState(false);
  const [itemVisualizado, setItemVisualizado] = useState(null);
  const [itemVisualizadoIndex, setItemVisualizadoIndex] = useState(null);
  const [ritoVisualizado, setRitoVisualizado] = useState(null);
  const [ritoDesativando, setRitoDesativando] = useState(false);
  const [sanidadeSaindo, setSanidadeSaindo] = useState(false);
  const [esperancaSaindo, setEsperancaSaindo] = useState(false);
  const [ultimoEstadoSanidade, setUltimoEstadoSanidade] = useState("");
  const [ultimoEstadoEsperanca, setUltimoEstadoEsperanca] = useState("");
  const [ritoAtivo, setRitoAtivo] = useState(false);
  const [customizacaoAberta, setCustomizacaoAberta] = useState(false);
  const [subAbaMaleta, setSubAbaMaleta] = useState("medicinal");

  // ESTADO PARA O MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalDescricao, setModalDescricao] = useState("");

  const [subAbaHabilidade, setSubAbaHabilidade] = useState("arquetipo");

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

  const classeAtual = personagem.classeId || personagem.classe || "";

  const ehMedicoDeCampo =
    classeAtual.toLowerCase().includes("medico") ||
    classeAtual.toLowerCase().includes("médico");

  const temMaletaDeCampo = (personagem.inventario || []).some(
    (item) => item.nome === "Maleta de Campo",
  );

  // CARREGAR DADOS AO INICIAR
  useEffect(() => {
    let ativo = true;
    let personagemCarregado = null;

    setCarregado(false);
    salvarLocalSeguro(ULTIMA_FICHA_KEY, fichaId);

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi && String(personagemApi.nome || "").trim()) {
          const classeAtual =
            personagemApi.classeId || personagemApi.classe || "";

          const jaTemMaleta = (personagemApi.inventario || []).some(
            (item) => item.nome === "Maleta de Campo",
          );

          if (classeAtual.toLowerCase().includes("medico") && !jaTemMaleta) {
            personagemApi.inventario = [
              ...(personagemApi.inventario || []),
              {
                ...MALETA_DE_CAMPO,
              },
            ];
          }

          personagemCarregado = personagemApi;

          console.log("Dados carregados do backend");
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Tentando carregar localStorage.");
      })
      .finally(() => {
        if (!personagemCarregado) {
          const dadosSalvos = lerLocalSeguro(storageKey);

          if (dadosSalvos) {
            try {
              personagemCarregado = JSON.parse(dadosSalvos);
              console.log("Dados carregados do salvamento anterior");
            } catch (error) {
              console.error("Erro ao carregar dados salvos:", error);
            }
          }
        }

        if (ativo && personagemCarregado) {
          setPersonagem(personagemCarregado);
        }

        if (!ativo) {
          return;
        }

        setCarregado(true);
      });

    return () => {
      ativo = false;
    };
  }, [fichaId, storageKey]);

  // SALVAR DADOS AUTOMATICAMENTE QUANDO MUDAR
  useEffect(() => {
    if (!carregado) {
      return;
    }

    if (fichaId !== DEFAULT_FICHA_ID && !String(personagem.nome || "").trim()) {
      return;
    }

    salvarPersonagemLocalSeguro(storageKey, personagem);
    setUltimoSave(new Date().toLocaleTimeString());

    salvarPersonagem(fichaId, personagem).catch((error) => {
      console.warn(
        "Backend indisponivel. Dados mantidos no localStorage.",
        error,
      );
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

  // ESTADO CRÍTICO AUTOMÁTICO
  // Cabeça e Torso são regiões vitais. Se qualquer uma entrar em Grave,
  // a condição Estado Crítico é ativada automaticamente.
  // Quando as duas deixam de estar em Grave, Estado Crítico é removido.
  useEffect(() => {
    if (!carregado) return;

    const cabecaGrave = Boolean(personagem.membros?.cabeca?.grave);
    const torsoGrave = Boolean(personagem.membros?.torso?.grave);
    const deveTerEstadoCritico = cabecaGrave || torsoGrave;

    const condicoesAtuais = personagem.condicoesAtivas || [];
    const jaTemEstadoCritico = condicoesAtuais.includes("estado-critico");

    if (deveTerEstadoCritico && !jaTemEstadoCritico) {
      setPersonagem((prev) => ({
        ...prev,
        condicoesAtivas: [
          ...(prev.condicoesAtivas || []).filter(
            (condicao) => condicao !== "surto-adrenalina",
          ),
          "estado-critico",
        ],
      }));

      return;
    }

    if (!deveTerEstadoCritico && jaTemEstadoCritico) {
      setPersonagem((prev) => ({
        ...prev,
        condicoesAtivas: (prev.condicoesAtivas || []).filter(
          (condicao) => condicao !== "estado-critico",
        ),
      }));
    }
  }, [
    carregado,
    personagem.membros?.cabeca?.grave,
    personagem.membros?.torso?.grave,
    personagem.condicoesAtivas,
  ]);

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

  const atualizarMaxMembro = (membro, novoValor) => {
    setPersonagem((prev) => {
      const max = Math.max(1, parseInt(novoValor) || 1);
      const atual = Math.min(prev.membros[membro].atual, max);
      const porcentagemVida = max > 0 ? atual / max : 0;

      return {
        ...prev,
        membros: {
          ...prev.membros,
          [membro]: {
            ...prev.membros[membro],
            max,
            atual,
            ferido: atual < max && porcentagemVida < 0.5,
            grave: porcentagemVida <= 0.1,
          },
        },
      };
    });
  };

  const aplicarDanoMembro = (membro, dano) => {
    setPersonagem((prev) => {
      const dadosMembro = prev.membros[membro];

      const defesa = parseInt(dadosMembro.defesa) || 0;

      const danoFinal = Math.max(0, dano - defesa);

      const novaVida = Math.max(0, dadosMembro.atual - danoFinal);

      const porcentagemVida =
        dadosMembro.max > 0 ? novaVida / dadosMembro.max : 0;

      return {
        ...prev,

        membros: {
          ...prev.membros,

          [membro]: {
            ...dadosMembro,

            atual: novaVida,

            ferido: novaVida < dadosMembro.max && porcentagemVida < 0.5,

            grave: porcentagemVida <= 0.1,
          },
        },
      };
    });
  };

  const atualizarDefesaMembro = (membro, valor) => {
    setPersonagem((prev) => ({
      ...prev,
      membros: {
        ...prev.membros,
        [membro]: {
          ...prev.membros[membro],
          defesa: Math.max(0, parseInt(valor) || 0),
        },
      },
    }));
  };

  const atualizarMaterialCriacao = (material, valor) => {
    setPersonagem((prev) => ({
      ...prev,

      materiaisCriacao: {
        ...prev.materiaisCriacao,
        [material]: Math.max(0, parseInt(valor) || 0),
      },
    }));
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

  const abrirLoja = () => {
    window.location.href = `?loja=1&ficha=${encodeURIComponent(fichaId)}`;
  };

  const abrirUpgradeNivel = () => {
    window.location.href = `?upgrade=1&ficha=${encodeURIComponent(fichaId)}`;
  };

  const abrirArvoreHabilidades = () => {
    window.location.href = `?habilidades=1&ficha=${encodeURIComponent(fichaId)}`;
  };

  const abrirDashboardMestre = () => {
    window.location.href = "?mestre=1";
  };

  const venderItem = (index) => {
    setPersonagem((prev) => ({
      ...prev,
      inventario: prev.inventario.filter((_, i) => i !== index),
      lojaCreditos: prev.lojaCreditos + 50,
    }));
  };
  const normalizarIngrediente = (nome) => {
    return String(nome)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\d+x\s*/g, "")
      .trim();
  };

  const mapaIngredientes = {
    alcool: "alcool",
    trapos: "trapos",
    recipiente: "recipiente",
    explosivos: "explosivos",
    explosivo: "explosivos",
    fita: "fita",
    "fita adesiva": "fita",
    lamina: "laminas",
    laminas: "laminas",
    pregos: "pregos",
    "pedaco de madeira": "madeira",
    madeira: "madeira",
    "pedaco de cano": "cano",
    "cano quebrado": "cano",
    cano: "cano",
    faca: "faca",
  };

  const obterQuantidadeIngrediente = (nome) => {
    const encontrado = String(nome).match(/(\d+)x/i);
    return encontrado ? parseInt(encontrado[1], 10) : 1;
  };

  const rolarDado = (faces) => {
    return Math.floor(Math.random() * faces) + 1;
  };

  const interpretarDano = (danoTexto) => {
    const texto = String(danoTexto || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const match = texto.match(/(\d+)d(\d+)([+-]\d+)?/);

    if (!match) {
      return null;
    }

    return {
      quantidade: parseInt(match[1], 10),
      faces: parseInt(match[2], 10),
      bonus: parseInt(match[3] || 0, 10),
    };
  };

  const rolarDanoArma = (dmg, dadosExtras = 0) => {
    const dano = interpretarDano(dmg);

    if (!dano) {
      return {
        total: 0,
        rolagens: [],
        texto: "Dano inválido",
      };
    }

    const quantidadeFinal = dano.quantidade + dadosExtras;

    const rolagens = Array.from({ length: quantidadeFinal }, () =>
      rolarDado(dano.faces),
    );

    const total =
      rolagens.reduce((soma, valor) => soma + valor, 0) + dano.bonus;

    return {
      total,
      rolagens,
      texto: `${quantidadeFinal}d${dano.faces}${dano.bonus ? `+${dano.bonus}` : ""}`,
    };
  };

  const obterDadoAtributo = (valor) => {
    const numero = parseInt(valor) || 0;

    if (numero >= 50) return 20;
    if (numero >= 40) return 12;
    if (numero >= 30) return 10;
    if (numero >= 20) return 8;
    if (numero >= 10) return 6;

    return 4;
  };

  const obterModificadorAtributo = (valor) => {
    const numero = parseInt(valor) || 0;

    if (numero >= 50) return 5;
    if (numero >= 40) return 4;
    if (numero >= 30) return 3;
    if (numero >= 20) return 2;
    if (numero >= 10) return 1;

    return 1;
  };

  const obterBonusPassiva = (chave) => {
    return (
      (personagem.habilidadesPassivas?.[chave] || 0) +
      (personagem.habilidadesTemporarias?.[chave] || 0)
    );
  };

  const rolarTeste = ({ atributo, ativo, passiva = 0 }) => {
    const valorAtributo = parseInt(atributo, 10) || 0;
    const bonusAtivo = parseInt(ativo, 10) || 0;
    const bonusPassiva = parseInt(passiva, 10) || 0;

    const quantidadeDados = obterModificadorAtributo(valorAtributo);
    const faces = obterDadoAtributo(valorAtributo);

    const rolagens = Array.from({ length: quantidadeDados }, () =>
      rolarDado(faces),
    );

    const maiorResultado = Math.max(...rolagens);
    const total = maiorResultado + bonusAtivo + bonusPassiva;

    return {
      quantidadeDados,
      faces,
      rolagens,
      maiorResultado,
      bonusAtivo,
      bonusPassiva,
      total,
    };
  };

  const rolarAtaqueArma = (item, modo = "normal") => {
    const arma = item.armaStatus;

    if (!arma) {
      setMensagemCraft("Este item não possui dados de arma.");
      return;
    }

    const atributoBase = personagem.atributos.reflexos;
    const bonusPassiva = obterBonusPassiva("precisao");

    const ativos = {
      normal: personagem.habilidadesPassivas?.precisao || 0,

      violencia:
        calcularModificadorAtivo(personagem.atributos?.forca) +
        (personagem.habilidadesCombate?.violencia || 0),

      percepcao:
        calcularModificadorAtivo(personagem.atributos?.vontade) +
        (personagem.habilidadesCombate?.percepcao || 0),

      persistencia:
        calcularModificadorAtivo(personagem.atributos?.vontade) +
        (personagem.habilidadesCombate?.persistencia || 0),

      firmeza:
        calcularModificadorAtivo(personagem.atributos?.reflexos) +
        (personagem.habilidadesCombate?.firmeza || 0),
    };

    const teste = rolarTeste({
      atributo: atributoBase,
      ativo: ativos[modo],
      passiva: bonusPassiva,
    });

    setRitoDesativando(true);

    setTimeout(() => {
      setRitoAtivo(false);
      setRitoDesativando(false);
    }, 450);

    const dano = rolarDanoArma(arma.dmg, modo === "violencia" ? 1 : 0);

    const efeitos = {
      normal: "Ataque de arma com Precisão.",
      violencia: "Violência: +1 dado de dano.",
      percepcao: "Percepção: alcance aumentado.",
      persistencia: "Persistência: remove penalidades.",
      firmeza: "Firmeza: pode atacar mais de um alvo.",
    };

    setRolandoDados(true);

    setModalRolagem({
      titulo: item.nome,
      modo: efeitos[modo],
      formula: `${teste.quantidadeDados}d${teste.faces} + ${teste.bonusAtivo} + ${teste.bonusPassiva}`,
      dados: teste.rolagens,
      faces: teste.faces,
      maiorResultado: teste.maiorResultado,
      bonusAtivo: teste.bonusAtivo,
      bonusPassiva: teste.bonusPassiva,
      total: teste.total,
      dano,
    });

    setTimeout(() => {
      setRolandoDados(false);
    }, 1200);
  };

  const obterRitoId = (rito, index) => {
    return rito.id || `${rito.nome}-${index}`;
  };

  const ritosAtivos = personagem.ritosAtivos || [];

  const temRitoAtivo = ritosAtivos.length > 0;

  const alternarRitoAtivo = (rito, index) => {
    const ritoId = obterRitoId(rito, index);

    const estaAtivo = (personagem.ritosAtivos || []).includes(ritoId);

    if (estaAtivo) {
      setRitoDesativando(true);

      setTimeout(() => {
        setPersonagem((prev) => ({
          ...prev,
          ritosAtivos: (prev.ritosAtivos || []).filter((id) => id !== ritoId),
        }));

        setRitoDesativando(false);
      }, 450);

      return;
    }

    setPersonagem((prev) => ({
      ...prev,
      ritosAtivos: [...(prev.ritosAtivos || []), ritoId],
    }));
  };

  useEffect(() => {
    if (!temRitoAtivo) return;

    const intervaloSanidade = setInterval(() => {
      setPersonagem((prev) => ({
        ...prev,

        sanidade: {
          ...prev.sanidade,

          atual: Math.max(0, (prev.sanidade?.atual || 0) - 1),
        },
      }));
    }, 60000); // 1 minuto

    return () => clearInterval(intervaloSanidade);
  }, [temRitoAtivo, setPersonagem]);

  const reduzirDurabilidadeItem = (indexAlvo) => {
    let nomeItemQuebrou = null;

    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const item = novoInventario[indexAlvo];

      if (!item || !item.durabilidade || item.durabilidade === "—") {
        return prev;
      }

      const durabilidadeTexto = String(item.durabilidade).trim();

      // Formato numérico: 10/10, 20/20, 30/30...
      if (durabilidadeTexto.includes("/")) {
        const [atualTexto, maxTexto] = durabilidadeTexto.split("/");
        const atual = parseInt(atualTexto, 10) || 0;
        const max = parseInt(maxTexto, 10) || atual;

        const novaDurabilidade = Math.max(0, atual - 1);

        if (novaDurabilidade <= 0) {
          nomeItemQuebrou = item.nome;
          novoInventario.splice(indexAlvo, 1);
        } else {
          const itemAtualizado = {
            ...item,
            durabilidade: `${novaDurabilidade}/${max}`,
          };

          novoInventario[indexAlvo] = itemAtualizado;

          setItemVisualizado((atualItem) =>
            atualItem?.index === indexAlvo
              ? { ...itemAtualizado, index: indexAlvo }
              : atualItem,
          );
        }

        return {
          ...prev,
          inventario: novoInventario,
        };
      }

      // Formato por marcadores: O O O O O
      const partes = durabilidadeTexto.split(" ");
      const indiceParaMarcar = partes.findIndex((parte) => parte !== "X");

      if (indiceParaMarcar === -1) {
        return prev;
      }

      partes[indiceParaMarcar] = "X";

      const acabou = partes.every((parte) => parte === "X");

      if (acabou) {
        nomeItemQuebrou = item.nome;
        novoInventario.splice(indexAlvo, 1);
      } else {
        const itemAtualizado = {
          ...item,
          durabilidade: partes.join(" "),
        };

        novoInventario[indexAlvo] = itemAtualizado;

        setItemVisualizado((atualItem) =>
          atualItem?.index === indexAlvo
            ? { ...itemAtualizado, index: indexAlvo }
            : atualItem,
        );
      }

      return {
        ...prev,
        inventario: novoInventario,
      };
    });

    if (nomeItemQuebrou) {
      setMensagemCraft(`⚠️ ${nomeItemQuebrou} quebrou e foi removido.`);
      setItemVisualizado(null);
      setTimeout(() => setMensagemCraft(""), 3000);
    }
  };

  const [itemPersonalizado, setItemPersonalizado] = useState({
    nome: "",
    icone: "🎒",
    tipo: "Item Personalizado",
    durabilidade: "—",
    usos: "",
    efeito: "",
    dano: "",
    descricao: "",
    rolagemTipo: "dano",
  });

  const reduzirUsoItem = (indexAlvo) => {
    let nomeItemAcabou = null;

    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const item = novoInventario[indexAlvo];

      if (!item || !item.usos) return prev;

      const partes = item.usos.split(" ");
      const indiceParaMarcar = partes.findIndex((parte) => parte !== "X");

      if (indiceParaMarcar === -1) return prev;

      partes[indiceParaMarcar] = "X";

      const acabou = partes.every((parte) => parte === "X");

      if (acabou) {
        nomeItemAcabou = item.nome;
        novoInventario.splice(indexAlvo, 1);
      } else {
        const itemAtualizado = {
          ...item,
          usos: partes.join(" "),
        };

        novoInventario[indexAlvo] = itemAtualizado;

        setItemVisualizado((atual) =>
          atual?.index === indexAlvo
            ? { ...itemAtualizado, index: indexAlvo }
            : atual,
        );
      }

      return {
        ...prev,
        inventario: novoInventario,
      };
    });

    if (nomeItemAcabou) {
      setMensagemCraft(`⚠️ ${nomeItemAcabou} acabou e foi removido.`);
      setItemVisualizado(null);
      setTimeout(() => setMensagemCraft(""), 3000);
    }
  };

  const itemVaiQuebrar = (item) => {
    if (!item?.durabilidade || item.durabilidade === "—") return false;

    const texto = String(item.durabilidade).trim();

    if (texto.includes("/")) {
      const [atualTexto] = texto.split("/");
      const atual = parseInt(atualTexto, 10) || 0;

      return atual <= 1;
    }

    const partes = texto.split(" ");
    const partesNaoQuebradas = partes.filter((parte) => parte !== "X");

    return partesNaoQuebradas.length <= 1;
  };

  const rolarItem = (item) => {
    const formula =
      item?.rolagem?.formula ||
      item?.dano?.match(/(\d+)d(\d+)([+-]\d+)?/i)?.[0] ||
      item?.efeito?.match(/(\d+)d(\d+)([+-]\d+)?/i)?.[0];

    if (!formula) {
      setMensagemCraft("Este item não possui rolagem.");
      return;
    }

    const tipoRolagem =
      item?.rolagem?.tipo ||
      (item?.tipo?.toLowerCase().includes("cura") ||
      item?.efeito?.toLowerCase().includes("recupera")
        ? "cura"
        : "dano");

    const quebrouComEssaRolagem =
      tipoRolagem === "dano" &&
      item?.durabilidade &&
      item?.durabilidade !== "—" &&
      itemVaiQuebrar(item);

    if (tipoRolagem === "cura" && item?.usos) {
      reduzirUsoItem(item.index);
    }

    const resultado = rolarDanoArma(formula);

    setRolandoDados(true);

    setModalRolagem({
      tipo: tipoRolagem,
      titulo: item.nome,
      modo: tipoRolagem === "cura" ? "Rolagem de Cura" : "Rolagem de Dano",
      formula: resultado.texto,
      dados: resultado.rolagens,
      faces: interpretarDano(formula)?.faces || 6,
      maiorResultado: Math.max(...resultado.rolagens),
      bonusAtivo: 0,
      bonusPassiva: 0,
      total: resultado.total,
      dano: resultado,
      itemQuebrou: quebrouComEssaRolagem,
    });

    if (
      tipoRolagem === "dano" &&
      item?.durabilidade &&
      item?.durabilidade !== "—"
    ) {
      reduzirDurabilidadeItem(item.index);
    }

    setTimeout(() => setRolandoDados(false), 1200);
  };

  const fecharModalRolagem = () => {
    if (modalRolagem?.itemQuebrou) {
      setItemVisualizado(null);
    }

    setModalRolagem(null);
  };

  const criarItemPersonalizado = (event) => {
    event.preventDefault();

    if (!itemPersonalizado.nome.trim()) {
      setMensagemCraft("Informe o nome do item.");
      return;
    }

    const novoItem = {
      nome: itemPersonalizado.nome.trim(),
      icone: itemPersonalizado.icone || "🎒",
      tipo: itemPersonalizado.tipo || "Item Personalizado",
      durabilidade: itemPersonalizado.durabilidade || "—",
      usos: itemPersonalizado.usos || "",
      efeito: itemPersonalizado.efeito || "",
      dano: itemPersonalizado.dano || "",
      descricao: itemPersonalizado.descricao || "",
      personalizado: true,
      rolagem: itemPersonalizado.dano
        ? {
            tipo: itemPersonalizado.rolagemTipo,
            formula: itemPersonalizado.dano,
          }
        : null,
    };

    setPersonagem((prev) => ({
      ...prev,
      inventario: [...(prev.inventario || []), novoItem],
    }));

    setItemPersonalizado({
      nome: "",
      icone: "🎒",
      tipo: "Item Personalizado",
      durabilidade: "—",
      usos: "",
      efeito: "",
      dano: "",
      descricao: "",
      rolagemTipo: "dano",
    });

    setMensagemCraft(`${novoItem.nome} criado e adicionado ao inventário.`);
    setTimeout(() => setMensagemCraft(""), 3000);
  };

  const criarItem = (receita) => {
    const materiaisAtuais = personagem.materiaisCriacao || {};

    const ingredientes = receita.ingredientes || [];

    const temIngredientes = ingredientes.every((ingrediente) => {
      const nomeIngrediente =
        typeof ingrediente === "string" ? ingrediente : ingrediente.nome;

      const chaveNormalizada = normalizarIngrediente(nomeIngrediente);
      const chaveMaterial = mapaIngredientes[chaveNormalizada];
      const quantidadeNecessaria = obterQuantidadeIngrediente(nomeIngrediente);

      if (!chaveMaterial) return false;

      return (materiaisAtuais[chaveMaterial] || 0) >= quantidadeNecessaria;
    });

    if (!temIngredientes) {
      alert("Materiais insuficientes para criar este item.");
      return;
    }

    const materiaisAtualizados = { ...materiaisAtuais };

    ingredientes.forEach((ingrediente) => {
      const nomeIngrediente =
        typeof ingrediente === "string" ? ingrediente : ingrediente.nome;

      const chaveNormalizada = normalizarIngrediente(nomeIngrediente);
      const chaveMaterial = mapaIngredientes[chaveNormalizada];
      const quantidadeNecessaria = obterQuantidadeIngrediente(nomeIngrediente);

      if (chaveMaterial) {
        materiaisAtualizados[chaveMaterial] = Math.max(
          0,
          (materiaisAtualizados[chaveMaterial] || 0) - quantidadeNecessaria,
        );
      }
    });

    setPersonagem((prev) => ({
      ...prev,

      materiaisCriacao: materiaisAtualizados,

      inventario: [
        ...(prev.inventario || []),
        {
          ...receita,
          detalhes: receita.efeito || receita.dano || receita.tipo || "Item",
          criado: true,
        },
      ],
    }));

    setMensagemCraft(`${receita.nome} criado com sucesso.`);

    setTimeout(() => {
      setMensagemCraft("");
    }, 3000);
  };

  const atualizarTemaFicha = (campo, valor) => {
    setPersonagem((prev) => ({
      ...prev,
      temaFicha: {
        ...(prev.temaFicha || estadoInicial.temaFicha),
        [campo]: valor,
      },
    }));
  };

  const restaurarTemaPadrao = () => {
    setPersonagem((prev) => ({
      ...prev,
      temaFicha: {
        ...TEMA_PADRAO_FICHA,
      },
    }));
  };

  const restaurarCorPadrao = (campo) => {
    setPersonagem((prev) => ({
      ...prev,
      temaFicha: {
        ...(prev.temaFicha || TEMA_PADRAO_FICHA),
        [campo]: TEMA_PADRAO_FICHA[campo],
      },
    }));
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
    const atributoValor = personagem.atributos[atributoBase];
    const bonusAtributo = calcularModificadorAtivo(atributoValor);

    const bonusAtivo =
      (personagem.habilidadesCombate?.[chave] || 0) + bonusAtributo;

    const nomesAtributos = {
      inteligencia: "Inteligência",
      vontade: "Vontade",
      reflexos: "Reflexos",
      forca: "Força",
      fonitude: "Fortitude",
    };

    const rolarAtivo = () => {
      const resultado = rolarTeste({
        atributo: atributoValor,
        ativo: bonusAtivo,
        passiva: 0,
      });

      setRolandoDados(true);

      setModalRolagem({
        titulo: `${nomesAtributos[atributoBase]} | ${nome}`,
        modo: "Teste de Ativo",
        formula: `${resultado.quantidadeDados}d${resultado.faces} + ${resultado.bonusAtivo}`,
        dados: resultado.rolagens,
        faces: resultado.faces,
        maiorResultado: resultado.maiorResultado,
        bonusAtivo: resultado.bonusAtivo,
        bonusPassiva: 0,
        total: resultado.total,
        dano: null,
      });

      setTimeout(() => {
        setRolandoDados(false);
      }, 1200);
    };

    return (
      <div className="ativo-item">
        <button
          type="button"
          className="ativo-rolar-btn"
          onClick={rolarAtivo}
          title="Rolar teste"
        >
          <Icon path={mdiDiceD20} size={0.9} />
        </button>
        <div
          className="ativo-info clickable"
          onClick={() => {
            setModalTitulo(nome);
            setModalDescricao(
              descricoesAtivos[chave] || "Descrição não disponível.",
            );
            setModalAberto(true);
          }}
        >
          <span className="ativo-atributo">{nomesAtributos[atributoBase]}</span>
          <span className="ativo-separador">|</span>
          <span className="ativo-nome">{nome}</span>
        </div>

        <div className="ativo-acoes">
          <span className="ativo-valor">
            {bonusAtivo > 0 ? `+${bonusAtivo}` : "0"}
          </span>{" "}
        </div>
      </div>
    );
  };
  const HabilidadePassiva = ({ nome, chave }) => {
    const valorBase = personagem.habilidadesPassivas[chave] || 0;

    const valorTemporario = personagem.habilidadesTemporarias?.[chave] || 0;

    return (
      <div className="habilidade-passiva-item">
        <span
          className="passiva-nome clickable"
          onClick={() => abrirModal(nome, chave)}
          title="Clique para ver descrição"
        >
          {nome}
        </span>

        <div className="passiva-linha">
          {/* VALOR BASE */}
          <div className="passiva-valor-base">({valorBase})</div>

          <span className="passiva-separador">|</span>

          {/* CONTROLES TEMPORÁRIOS */}
          <div className="passiva-temp-controles">
            <button
              className="passiva-temp-btn"
              onClick={() => {
                setPersonagem((prev) => ({
                  ...prev,

                  habilidadesTemporarias: {
                    ...prev.habilidadesTemporarias,

                    [chave]: valorTemporario - 1,
                  },
                }));
              }}
            >
              -
            </button>

            <input
              type="number"
              value={valorTemporario}
              onChange={(e) => {
                const novoValor = parseInt(e.target.value) || 0;

                setPersonagem((prev) => ({
                  ...prev,

                  habilidadesTemporarias: {
                    ...prev.habilidadesTemporarias,

                    [chave]: novoValor,
                  },
                }));
              }}
              className="passiva-valor-temporario"
            />

            <button
              className="passiva-temp-btn"
              onClick={() => {
                setPersonagem((prev) => ({
                  ...prev,

                  habilidadesTemporarias: {
                    ...prev.habilidadesTemporarias,

                    [chave]: valorTemporario + 1,
                  },
                }));
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const conflitosCondicoes = {
    /* TEMPERATURA */
    congelado: ["em-chamas", "hipertermia"],
    "em-chamas": ["congelado"],
    hipertermia: ["congelado"],

    /* VISÃO */
    cego: ["cegueira-temporaria"],
    "cegueira-temporaria": ["cego"],

    /* STATUS OPOSTOS */
    "estado-critico": ["surto-adrenalina"],
    "surto-adrenalina": ["estado-critico"],

    /* EXPOSIÇÃO */
    marcado: ["furtivo"],
    furtivo: ["marcado"],
  };

  const arvoreClasse =
    obterArvoreClasse(personagem.classeId || personagem.classe) || {};

  if (!personagem.habilidadesClasse) {
    personagem.habilidadesClasse = {
      habilidadeAbsoluta: "",
      aptidoes: {},
      especialidade: "",
      especialidadeDefinida: false,
      habilidadesEspecialidade: {},
    };
  }

  const habilidadesSelecionadas = listarHabilidadesSelecionadas(personagem);
  const arquetipoDetalhes =
    personagem.classeEspecialidade?.arquetipoDetalhes || null;

  const arquetipoNome =
    personagem.classeEspecialidade?.arquetipo || personagem.arquetipo || "";

  const arquetipoItens = arquetipoDetalhes
    ? [
        {
          id: `${arquetipoDetalhes.id}-habilidade-principal`,
          nome: "Habilidade Principal",
          descricao: arquetipoDetalhes.habilidadePrincipal,
          tipo: "Arquétipo",
        },
        {
          id: `${arquetipoDetalhes.id}-vantagens`,
          nome: "Vantagens",
          descricao: (arquetipoDetalhes.vantagens || []).join("\n"),
          tipo: "Arquétipo",
        },
        {
          id: `${arquetipoDetalhes.id}-desvantagem`,
          nome: "Desvantagem",
          descricao: arquetipoDetalhes.desvantagem,
          tipo: "Arquétipo",
        },
      ]
    : [];

  const habilidadesAbsolutas = habilidadesSelecionadas.filter(
    (habilidade) => habilidade.grupo === "Habilidade Absoluta",
  );

  const aptidoesSelecionadas = habilidadesSelecionadas.filter(
    (habilidade) => habilidade.grupo === "Aptidão",
  );

  const habilidadesEspecialismo = habilidadesSelecionadas.filter(
    (habilidade) => habilidade.grupo === "Especialismo",
  );

  const calcularValorAtivo = (atributo, ativo) => {
    const modAtributo = calcularModificadorAtivo(
      personagem.atributos?.[atributo] || 0,
    );

    const valorAtivo =
      (parseInt(personagem.habilidadesCombate?.[ativo], 10) || 0) +
      (parseInt(personagem.habilidadesTemporarias?.[ativo], 10) || 0);

    return modAtributo + valorAtivo;
  };

  const valorPassiva = (passiva) => {
    return (
      (parseInt(personagem.habilidadesPassivas?.[passiva], 10) || 0) +
      (parseInt(personagem.habilidadesTemporarias?.[passiva], 10) || 0)
    );
  };

  const defesaBase =
    10 + calcularModificadorAtivo(personagem.atributos?.reflexos || 0);

  const bloqueio =
    defesaBase +
    calcularValorAtivo("forca", "violencia") +
    valorPassiva("vitalidade");

  const esquiva =
    defesaBase +
    calcularValorAtivo("reflexos", "firmeza") +
    valorPassiva("velocidade");

  const CardHabilidadeRecolhivel = ({
    habilidade,
    tipo = "APTIDÃO",
    classeExtra = "",
  }) => {
    const [aberto, setAberto] = useState(false);

    const descricao =
      habilidade.descricao ||
      habilidade.habilidadePrincipal ||
      habilidade.detalhes ||
      "Descrição não disponível.";

    return (
      <article
        className={`habilidade-expandivel ${classeExtra} ${aberto ? "aberto" : ""}`}
      >
        <button
          type="button"
          className="habilidade-expandivel-topo"
          onClick={() => setAberto((prev) => !prev)}
        >
          <div>
            <span>{tipo}</span>
            <h3>{habilidade.nome}</h3>
          </div>

          {habilidade.custo && <strong>{habilidade.custo}</strong>}
        </button>

        <div className="habilidade-expandivel-corpo">
          <p>{descricao}</p>
        </div>
      </article>
    );
  };

  // Conteúdo das abas
  const conteudoAbas = {
    combate: (
      <div className="conteudo-aba">
        <h4>ATIVOS</h4>

        <div className="ativos-layout">
          <div className="lista-ativos">
            <Ativo nome="Razão" chave="razao" atributoBase="inteligencia" />
            <Ativo
              nome="Intuição"
              chave="intuicao"
              atributoBase="inteligencia"
            />
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

          <aside className="defesa-painel">
            <div className="defesa-linha-principal">
              <div className="defesa-topo">
                <div className="defesa-box defesa-base-box">
                  <h3 className="defesa-titulo">Defesa Base</h3>

                  <div className="escudo-defesa">
                    <input inputMode="numeric" value={defesaBase} />
                  </div>
                </div>

                <div className="defesa-info">
                  <div className="defesa-formula"></div>
                </div>
              </div>

              <div className="defesa-valores">
                <label>
                  <span>BLOQUEIO</span>
                  <input type="text" value={bloqueio} readOnly />
                </label>

                <label>
                  <span>ESQUIVA</span>
                  <input type="text" value={esquiva} />
                </label>
              </div>
            </div>

            <div className="defesa-campos">
              <label>
                <span>PROTEÇÃO</span>
                <input
                  value={personagem.protecao || ""}
                  onChange={(e) =>
                    setPersonagem((prev) => ({
                      ...prev,
                      protecao: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>RESISTÊNCIAS</span>
                <input
                  value={personagem.resistencias || ""}
                  onChange={(e) =>
                    setPersonagem((prev) => ({
                      ...prev,
                      resistencias: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>PROFICIÊNCIAS</span>
                <input
                  value={personagem.proficiencias || ""}
                  onChange={(e) =>
                    setPersonagem((prev) => ({
                      ...prev,
                      proficiencias: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="defesa-membros">
              {[
                ["cabeca", "Cabeça"],
                ["torso", "Torso"],
                ["bracoDireito", "Braço D."],
                ["bracoEsquerdo", "Braço E."],
                ["pernaDireita", "Perna D."],
                ["pernaEsquerda", "Perna E."],
              ].map(([chave, nome]) => (
                <label key={chave} className="defesa-membro-item">
                  <div className="mini-escudo-defesa">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={personagem.membros?.[chave]?.defesa || 0}
                      onChange={(e) =>
                        atualizarDefesaMembro(chave, e.target.value)
                      }
                    />
                  </div>

                  <span>{nome}</span>
                </label>
              ))}
            </div>
          </aside>
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
              <HabilidadePassiva nome="Manipulação" chave="manipulacao" />
              <HabilidadePassiva nome="Intimidação" chave="intimidacao" />

              <HabilidadePassiva nome="Sedução" chave="seducao" />
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
              <HabilidadePassiva nome="Furtividade" chave="furtividade" />
              <HabilidadePassiva
                nome="Instinto de Sobrevivência"
                chave="instintoSobrevivencia"
              />

              <HabilidadePassiva
                nome="Resistência Mental"
                chave="resistenciaMental"
              />
            </div>
          </div>
        </div>
      </div>
    ),

    habilidades: (
      <div className="conteudo-aba habilidades-resumo-aba">
        <div className="habilidades-resumo-topo">
          <span>Arvore da classe</span>
          <h4>{arvoreClasse.titulo}</h4>
          <p>{arvoreClasse.beneficio}</p>
        </div>

        <section className="grupo-habilidades-ficha">
          <div className="subabas-habilidades-ficha">
            <button
              className={subAbaHabilidade === "arquetipo" ? "ativa" : ""}
              onClick={() => setSubAbaHabilidade("arquetipo")}
            >
              Arquétipo
            </button>
            <button
              className={subAbaHabilidade === "aptidoes" ? "ativa" : ""}
              onClick={() => setSubAbaHabilidade("aptidoes")}
            >
              Aptidões
            </button>

            <button
              className={subAbaHabilidade === "especialismo" ? "ativa" : ""}
              onClick={() => setSubAbaHabilidade("especialismo")}
            >
              Especialismo
            </button>

            <button
              className={subAbaHabilidade === "absoluta" ? "ativa" : ""}
              onClick={() => setSubAbaHabilidade("absoluta")}
            >
              Absoluta
            </button>
          </div>

          {subAbaHabilidade === "arquetipo" && (
            <section className="grupo-habilidades-ficha habilidades-grid-cards">
              {arquetipoItens.length > 0 ? (
                arquetipoItens.map((item) => (
                  <CardHabilidadeRecolhivel
                    key={item.id}
                    habilidade={item}
                    tipo={item.tipo}
                    classeExtra="arquetipo"
                  />
                ))
              ) : (
                <p className="habilidade-vazia">Nenhum arquétipo escolhido.</p>
              )}
            </section>
          )}

          {subAbaHabilidade === "aptidoes" && (
            <section className="grupo-habilidades-ficha habilidades-grid-cards">
              {aptidoesSelecionadas.length > 0 ? (
                aptidoesSelecionadas.map((habilidade) => (
                  <CardHabilidadeRecolhivel
                    key={habilidade.id}
                    habilidade={habilidade}
                    tipo="APTIDÃO"
                  />
                ))
              ) : (
                <p className="habilidade-vazia">Nenhuma aptidão adquirida.</p>
              )}
            </section>
          )}

          {subAbaHabilidade === "especialismo" && (
            <section className="grupo-habilidades-ficha habilidades-grid-cards">
              {habilidadesEspecialismo.length > 0 ? (
                habilidadesEspecialismo.map((habilidade) => (
                  <CardHabilidadeRecolhivel
                    key={habilidade.id}
                    habilidade={habilidade}
                    tipo="ESPECIALISMO"
                    classeExtra="especialismo"
                  />
                ))
              ) : (
                <p className="habilidade-vazia">
                  Nenhuma habilidade de especialismo adquirida.
                </p>
              )}
            </section>
          )}

          {subAbaHabilidade === "absoluta" && (
            <section className="grupo-habilidades-ficha">
              {habilidadesAbsolutas.length > 0 ? (
                habilidadesAbsolutas.map((habilidade) => (
                  <div key={habilidade.id} className="habilidade-absoluta-card">
                    <span>HABILIDADE ABSOLUTA</span>

                    <h1>{habilidade.nome}</h1>

                    {habilidade.custo && (
                      <div className="custo-absoluta">{habilidade.custo}</div>
                    )}

                    <p>{habilidade.descricao}</p>
                  </div>
                ))
              ) : (
                <p className="habilidade-vazia">
                  Nenhuma habilidade absoluta adquirida.
                </p>
              )}
            </section>
          )}
        </section>
      </div>
    ),

    rituais: (
      <div className="conteudo-aba rituais-aba">
        <div className="rituais-topo">
          <span>Biblioteca Oculta</span>
          <h4>RITUAIS CONHECIDOS</h4>
        </div>

        <div className="lista-rituais rituais-cards">
          {personagem.rituais.map((ritual, index) => (
            <article
              key={index}
              className={`ritual-card ${
                ritosAtivos.includes(obterRitoId(ritual, index)) ? "ativo" : ""
              } nivel-${ritual.nivelRito || ritual.nivel || "iniciante"}`}
              onClick={() => setRitoVisualizado({ ...ritual, index })}
            >
              <div className="ritual-card-icone">{ritual.icone || "☉"}</div>

              <div className="ritual-card-info">
                <strong>{ritual.nome}</strong>

                <small>
                  {ritual.nivelRito || ritual.nivel
                    ? `Nível ${ritual.nivelRito || ritual.nivel}`
                    : "Ritual Obscuro"}
                </small>

                <span>{ritual.custo || "0 PE"}</span>
              </div>

              <button
                className="btn-ativar-rito"
                onClick={(e) => {
                  e.stopPropagation();
                  alternarRitoAtivo(ritual, index);
                }}
              >
                {ritosAtivos.includes(obterRitoId(ritual, index))
                  ? "Desativar"
                  : "Ativar"}
              </button>
            </article>
          ))}
          {ritoVisualizado && (
            <div
              className="rito-visualizer-overlay"
              onClick={() => setRitoVisualizado(null)}
            >
              <div
                className="rito-visualizer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rito-visualizer-topo">
                  <div className="rito-visualizer-icone">
                    {ritoVisualizado.icone || "☉"}
                  </div>

                  <div className="rito-visualizer-info-topo">
                    <span>
                      {ritoVisualizado.nivelRito || ritoVisualizado.nivel
                        ? `Nível ${ritoVisualizado.nivelRito || ritoVisualizado.nivel}`
                        : "Ritual Obscuro"}
                    </span>

                    <h2>{ritoVisualizado.nome}</h2>

                    <small>{ritoVisualizado.custo || "0 PE"}</small>
                  </div>

                  <button
                    className="rito-visualizer-fechar"
                    onClick={() => setRitoVisualizado(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="rito-visualizer-grid">
                  {ritoVisualizado.acao && (
                    <div>
                      <span>Ação</span>
                      <strong>{ritoVisualizado.acao}</strong>
                    </div>
                  )}

                  {ritoVisualizado.alvo && (
                    <div>
                      <span>Alvo</span>
                      <strong>{ritoVisualizado.alvo}</strong>
                    </div>
                  )}

                  {ritoVisualizado.duracao && (
                    <div>
                      <span>Duração</span>
                      <strong>{ritoVisualizado.duracao}</strong>
                    </div>
                  )}

                  {ritoVisualizado.distancia && (
                    <div>
                      <span>Distância</span>
                      <strong>{ritoVisualizado.distancia}</strong>
                    </div>
                  )}
                </div>

                {ritoVisualizado.requisitos && (
                  <div className="rito-visualizer-bloco">
                    <span>Requisitos</span>
                    <p>{ritoVisualizado.requisitos}</p>
                  </div>
                )}

                {ritoVisualizado.efeito && (
                  <div className="rito-visualizer-bloco">
                    <span>Efeito</span>
                    <p>{ritoVisualizado.efeito}</p>
                  </div>
                )}

                {ritoVisualizado.descricao && (
                  <div className="rito-visualizer-bloco">
                    <span>Descrição</span>
                    <p>{ritoVisualizado.descricao}</p>
                  </div>
                )}
              </div>
              <div className="rito-visualizer-acoes">
                <button
                  className={
                    ritosAtivos.includes(
                      obterRitoId(ritoVisualizado, ritoVisualizado.index),
                    )
                      ? "btn-rito-ativo"
                      : ""
                  }
                  onClick={() =>
                    alternarRitoAtivo(ritoVisualizado, ritoVisualizado.index)
                  }
                >
                  {ritosAtivos.includes(
                    obterRitoId(ritoVisualizado, ritoVisualizado.index),
                  )
                    ? "Desativar Rito"
                    : "Ativar Rito"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    ),

    inventario: (
      <div className="conteudo-aba inventario-aba">
        <div className="inventario-subabas">
          <button
            className={subAbaInventario === "mochila" ? "ativa" : ""}
            onClick={() => setSubAbaInventario("mochila")}
          >
            Mochila
          </button>

          <button
            className={subAbaInventario === "criacao" ? "ativa" : ""}
            onClick={() => setSubAbaInventario("criacao")}
          >
            Criação
          </button>
          <button
            className={subAbaInventario === "personalizado" ? "ativa" : ""}
            onClick={() => setSubAbaInventario("personalizado")}
          >
            Personalizado
          </button>
          {ehMedicoDeCampo && (
            <button
              className={subAbaInventario === "maleta" ? "ativa" : ""}
              onClick={() => setSubAbaInventario("maleta")}
            >
              Maleta de Campo
            </button>
          )}
        </div>

        {subAbaInventario === "mochila" && (
          <>
            <h4>INVENTÁRIO</h4>

            <div className="lista-inventario inventario-cards">
              {" "}
              {personagem.inventario.map((item, index) => (
                <article
                  key={index}
                  className="item-inventario item-recolhivel inventario-card"
                  onClick={() => setItemVisualizado({ ...item, index })}
                >
                  <div className="inventario-resumo">
                    <div className="inventario-card-icone">
                      {item.icone || "🎒"}
                    </div>

                    <span className="inventario-item-nome">{item.nome}</span>

                    <small className="inventario-item-tipo">
                      {item.tipo || item.custo || item.detalhes || "Item"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {subAbaInventario === "criacao" && (
          <div className="criacao-itens">
            <div className="estoque-materiais">
              <div className="estoque-topo">
                <span>Estoque</span>
                <strong>Materiais de Criação</strong>
              </div>
              {mensagemCraft && (
                <div className="craft-mensagem">{mensagemCraft}</div>
              )}
              <div className="estoque-grid">
                {[
                  ["alcool", "🧪", "Álcool"],
                  ["trapos", "🧻", "Trapos"],
                  ["recipiente", "🫙", "Recipiente"],
                  ["explosivos", "💣", "Explosivos"],
                  ["fita", "🩹", "Fita"],
                  ["laminas", "🔪", "Lâminas"],
                  ["pregos", "📌", "Pregos"],
                  ["madeira", "🪵", "Madeira"],
                  ["cano", "🔩", "Cano"],
                  ["faca", "🗡️", "Faca"],
                ].map(([chave, icon, nome]) => (
                  <label key={chave} className="estoque-material">
                    <span className="material-icon">{icon}</span>

                    <span className="material-nome">{nome}</span>

                    <input
                      type="number"
                      min="0"
                      value={personagem.materiaisCriacao?.[chave] || 0}
                      onChange={(e) =>
                        atualizarMaterialCriacao(chave, e.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="criacao-abas">
              <button
                className={abaCriacao === "armas" ? "ativa" : ""}
                onClick={() => setAbaCriacao("armas")}
              >
                Armas
              </button>

              <button
                className={abaCriacao === "improvisados" ? "ativa" : ""}
                onClick={() => setAbaCriacao("improvisados")}
              >
                Improvisados
              </button>

              <button
                className={abaCriacao === "municoes" ? "ativa" : ""}
                onClick={() => setAbaCriacao("municoes")}
              >
                Munições
              </button>
            </div>

            {receitasCriacao
              .filter((grupo) => {
                if (abaCriacao === "armas") {
                  return grupo.categoria === "Armas Aprimoráveis";
                }

                if (abaCriacao === "improvisados") {
                  return grupo.categoria === "Itens Improvisados";
                }

                if (abaCriacao === "municoes") {
                  return grupo.categoria === "Munições Fabricadas";
                }

                if (abaCriacao === "materiais") {
                  return grupo.categoria === "Materiais de Criação";
                }

                return true;
              })
              .map((grupo) => (
                <section key={grupo.categoria} className="criacao-grupo">
                  <h5>{grupo.categoria}</h5>

                  <div className="criacao-grid">
                    {grupo.itens.map((receita) => (
                      <article key={receita.nome} className="criacao-card">
                        <span>{receita.tipo}</span>

                        <div className="receita-titulo">
                          <strong>{receita.nome}</strong>
                        </div>
                        <p>
                          <b>Durabilidade:</b> {receita.durabilidade}
                        </p>

                        <p>
                          <b>Dano:</b> {receita.dano}
                        </p>

                        <div className="receita-recursos">
                          {receita.ingredientes.length > 0 ? (
                            receita.ingredientes.map((ingrediente) => (
                              <small
                                key={ingrediente.nome}
                                className="ingrediente-chip"
                              >
                                <span>{ingrediente.icone}</span>
                                {ingrediente.nome}
                              </small>
                            ))
                          ) : (
                            <small>Item base</small>
                          )}
                        </div>

                        <button onClick={() => criarItem(receita)}>
                          Criar
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
        {subAbaInventario === "personalizado" && (
          <div className="criacao-itens">
            <section className="criacao-grupo">
              <h5>Criar Item Personalizado</h5>

              <form
                className="item-personalizado-form"
                onSubmit={criarItemPersonalizado}
              >
                <label>
                  Ícone
                  <input
                    type="text"
                    value={itemPersonalizado.icone}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        icone: e.target.value,
                      }))
                    }
                    placeholder="🎒"
                  />
                </label>

                <label>
                  Nome
                  <input
                    type="text"
                    value={itemPersonalizado.nome}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    placeholder="Ex: Rádio Quebrado"
                  />
                </label>

                <label>
                  Tipo
                  <input
                    type="text"
                    value={itemPersonalizado.tipo}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    placeholder="Item, Arma, Cura, Ferramenta..."
                  />
                </label>

                <label>
                  Durabilidade
                  <select
                    value={itemPersonalizado.durabilidade}
                    onChange={(e) =>
                      setItemPersonalizado({
                        ...itemPersonalizado,
                        durabilidade: e.target.value,
                      })
                    }
                  >
                    <option value="—">Sem Durabilidade</option>
                    <option value="10/10">10/10</option>
                    <option value="20/20">20/20</option>
                    <option value="30/30">30/30</option>
                    <option value="50/50">50/50</option>
                    <option value="100/100">100/100</option>
                    <option value="∞">Infinita</option>
                  </select>
                </label>

                <label>
                  Usos
                  <select
                    value={itemPersonalizado.usos}
                    onChange={(e) =>
                      setItemPersonalizado({
                        ...itemPersonalizado,
                        usos: e.target.value,
                      })
                    }
                  >
                    <option value="">Sem Usos</option>
                    <option value="1">1 Uso</option>
                    <option value="2">2 Usos</option>
                    <option value="3">3 Usos</option>
                    <option value="5">5 Usos</option>
                    <option value="10">10 Usos</option>
                    <option value="20">20 Usos</option>
                    <option value="∞">Infinitos</option>
                  </select>
                </label>

                <label>
                  Fórmula da rolagem
                  <input
                    type="text"
                    value={itemPersonalizado.dano}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        dano: e.target.value,
                      }))
                    }
                    placeholder="1d6, 2d8+2..."
                  />
                </label>

                <label>
                  Tipo da rolagem
                  <select
                    value={itemPersonalizado.rolagemTipo}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        rolagemTipo: e.target.value,
                      }))
                    }
                  >
                    <option value="dano">Dano</option>
                    <option value="cura">Cura</option>
                  </select>
                </label>

                <label className="full">
                  Efeito
                  <textarea
                    value={itemPersonalizado.efeito}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        efeito: e.target.value,
                      }))
                    }
                    placeholder="Descreva o efeito mecânico do item..."
                  />
                </label>

                <label className="full">
                  Descrição
                  <textarea
                    value={itemPersonalizado.descricao}
                    onChange={(e) =>
                      setItemPersonalizado((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descrição narrativa do item..."
                  />
                </label>

                <button type="submit">Adicionar ao Inventário</button>
              </form>
            </section>
          </div>
        )}
        {subAbaInventario === "maleta" && ehMedicoDeCampo && (
          <div className="maleta-campo-container">
            <div className="maleta-aprimoramentos-ativos">
              <div className="maleta-aprimoramentos-topo">
                <span>Aprimoramentos Ativos</span>

                <strong>
                  {(personagem.maletaCampo?.aprimoramentosAtivos || []).length}
                  /3
                </strong>
              </div>

              <div className="maleta-aprimoramentos-grid">
                {(personagem.maletaCampo?.aprimoramentosAtivos || []).length >
                0 ? (
                  personagem.maletaCampo.aprimoramentosAtivos.map(
                    (aprimoramento, index) => (
                      <article
                        key={aprimoramento.id || index}
                        className={`maleta-aprimoramento-card ${
                          aprimoramento.tipoMaleta || "geral"
                        }`}
                      >
                        <span className="maleta-tipo">
                          {aprimoramento.tipoMaleta === "medicinal"
                            ? "Medicinal"
                            : aprimoramento.tipoMaleta === "combate"
                              ? "Combate"
                              : "Geral"}
                        </span>

                        <h5>{aprimoramento.nome}</h5>

                        <p>
                          {aprimoramento.descricao ||
                            aprimoramento.efeito ||
                            aprimoramento.detalhe}
                        </p>
                      </article>
                    ),
                  )
                ) : (
                  <p className="maleta-vazia">
                    Nenhum aprimoramento instalado.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    ),

    corpo: (
      <div className="conteudo-aba corpo-aba">
        <div className="sistema-membros-sidebar">
          <div className="corpo-container-sidebar">
            <div className="controles-membros-sidebar">
              <MembroControle
                nome="CABEÇA"
                membroChave="cabeca"
                membro={personagem.membros.cabeca}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) => atualizarVidaMembro("cabeca", valor)}
                onDamage={(dano) => aplicarDanoMembro("cabeca", dano)}
                onDefesaChange={atualizarDefesaMembro}
                classNameInput="cabeca-input"
              />

              <MembroControle
                nome="TORSO"
                membroChave="torso"
                membro={personagem.membros.torso}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) => atualizarVidaMembro("torso", valor)}
                onDamage={(dano) => aplicarDanoMembro("torso", dano)}
                onDefesaChange={atualizarDefesaMembro}
                classNameInput="torso-input"
              />

              <MembroControle
                nome="BRAÇO DIREITO"
                membroChave="bracoDireito"
                membro={personagem.membros.bracoDireito}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) => atualizarVidaMembro("bracoDireito", valor)}
                onDamage={(dano) => aplicarDanoMembro("bracoDireito", dano)}
                onDefesaChange={atualizarDefesaMembro}
                classNameInput="bracoDireito-input"
              />

              <MembroControle
                nome="BRAÇO ESQUERDO"
                membroChave="bracoEsquerdo"
                membro={personagem.membros.bracoEsquerdo}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) =>
                  atualizarVidaMembro("bracoEsquerdo", valor)
                }
                onDamage={(dano) => aplicarDanoMembro("bracoEsquerdo", dano)}
                onDefesaChange={atualizarDefesaMembro}
                classNameInput="bracoEsquerdo-input"
              />

              <MembroControle
                nome="PERNA DIREITA"
                membroChave="pernaDireita"
                membro={personagem.membros.pernaDireita}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) => atualizarVidaMembro("pernaDireita", valor)}
                onDamage={(dano) => aplicarDanoMembro("pernaDireita", dano)}
                onDefesaChange={atualizarDefesaMembro}
                classNameInput="pernaDireita-input"
              />

              <MembroControle
                nome="PERNA ESQUERDA"
                membroChave="pernaEsquerda"
                membro={personagem.membros.pernaEsquerda}
                onMaxChange={atualizarMaxMembro}
                onChange={(valor) =>
                  atualizarVidaMembro("pernaEsquerda", valor)
                }
                onDamage={(dano) => aplicarDanoMembro("pernaEsquerda", dano)}
                onDefesaChange={atualizarDefesaMembro}
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

            <div className="condicoes-wrapper">
              <div className="lista-condicoes">
                {[...condicoes]
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((condicao, index) => (
                    <button
                      key={index}
                      className={`condicao-chip ${
                        personagem.condicoesAtivas?.includes(condicao.classe)
                          ? "ativa"
                          : ""
                      } ${condicao.classe}`}
                      onClick={() => {
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
                            condicoesAtivas: [
                              ...novasCondicoes,
                              condicao.classe,
                            ],
                          };
                        });
                      }}
                    >
                      {condicao.nome}
                    </button>
                  ))}
              </div>

              <div className="condicoes-ativas-descricao">
                {condicoes
                  .filter((condicao) =>
                    personagem.condicoesAtivas?.includes(condicao.classe),
                  )
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((condicao) => (
                    <div
                      key={condicao.classe}
                      className="condicao-descricao-card"
                    >
                      <strong>{condicao.nome}</strong>
                      <p>{condicao.descricao}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    descricao: (
      <div className="conteudo-aba personagem-aba">
        <label className="personagem-label">Descrição</label>
        <textarea
          className="textarea-descricao"
          placeholder="Descreva a aparência, personalidade e detalhes do personagem..."
          rows="5"
          value={personagem.descricao || ""}
          onChange={(e) =>
            setPersonagem((prev) => ({
              ...prev,
              descricao: e.target.value,
            }))
          }
        />

        <label className="personagem-label">Anotação</label>
        <textarea
          className="textarea-descricao"
          placeholder="Anotações rápidas, lembretes e observações importantes..."
          rows="5"
          value={personagem.anotacao || ""}
          onChange={(e) =>
            setPersonagem((prev) => ({
              ...prev,
              anotacao: e.target.value,
            }))
          }
        />

        <label className="personagem-label">História</label>
        <textarea
          className="textarea-descricao"
          placeholder="Escreva a história do personagem..."
          rows="7"
          value={personagem.historia || ""}
          onChange={(e) =>
            setPersonagem((prev) => ({
              ...prev,
              historia: e.target.value,
            }))
          }
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

  const obterEstadoRecurso = (recurso, prefixo) => {
    const atual = Number(recurso?.atual) || 0;
    const max = Number(recurso?.max) || 0;

    if (max <= 0 || atual <= 0) {
      return `${prefixo}-zero`;
    }

    const porcentagem = (atual / max) * 100;

    if (porcentagem <= 25) {
      return `${prefixo}-critico`;
    }

    if (porcentagem <= 50) {
      return `${prefixo}-metade`;
    }

    return `${prefixo}-normal`;
  };

  const estadoSanidadePerfil = obterEstadoRecurso(
    personagem.sanidade,
    "sanidade",
  );
  const estadoEsperancaPerfil = obterEstadoRecurso(
    personagem.esperanca,
    "esperanca",
  );

  useEffect(() => {
    if (!ultimoEstadoSanidade) {
      setUltimoEstadoSanidade(estadoSanidadePerfil);
      return;
    }

    const saiuDoEfeito =
      ultimoEstadoSanidade !== "sanidade-normal" &&
      estadoSanidadePerfil === "sanidade-normal";

    if (saiuDoEfeito) {
      setSanidadeSaindo(true);

      setTimeout(() => {
        setSanidadeSaindo(false);
      }, 500);
    }

    setUltimoEstadoSanidade(estadoSanidadePerfil);
  }, [estadoSanidadePerfil]);

  useEffect(() => {
    if (!ultimoEstadoEsperanca) {
      setUltimoEstadoEsperanca(estadoEsperancaPerfil);
      return;
    }

    const saiuDoEfeito =
      ultimoEstadoEsperanca !== "esperanca-normal" &&
      estadoEsperancaPerfil === "esperanca-normal";

    if (saiuDoEfeito) {
      setEsperancaSaindo(true);

      setTimeout(() => {
        setEsperancaSaindo(false);
      }, 500);
    }

    setUltimoEstadoEsperanca(estadoEsperancaPerfil);
  }, [estadoEsperancaPerfil]);

  const atualizarFotoPerfil = (event) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      setPersonagem((prev) => ({
        ...prev,
        fotoPerfil: leitor.result,
      }));
    };

    leitor.readAsDataURL(arquivo);
    event.target.value = "";
  };

  return (
    <div
      className="ficha-container"
      style={{
        "--cor-primaria": personagem.temaFicha?.primaria,
        "--cor-secundaria": personagem.temaFicha?.secundaria,
        "--cor-texto": personagem.temaFicha?.texto,
        "--cor-fundo": personagem.temaFicha?.fundo,
        "--cor-borda": personagem.temaFicha?.borda,
      }}
    >
      <button
        className="botao-mestre-flutuante"
        onClick={abrirUpgradeNivel}
        title="Abrir upgrade de nivel"
      >
        <Icon path={mdiDiceD20} size={1.2} />
        <span>Upgrade</span>
      </button>
      <button
        className="botao-loja-flutuante"
        onClick={abrirLoja}
        title="Abrir loja da Helena"
      >
        <Icon path={mdiStorefrontOutline} size={1.2} />
        <span>Loja</span>
      </button>
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
                    <input
                      type="text"
                      placeholder="PRONOME"
                      value={personagem.pronome || ""}
                      readOnly
                      title="Informação bloqueada para jogadores"
                      className="dado-personagem perfil-info-bloqueada"
                      maxLength={10}
                    />
                    <input
                      type="text"
                      placeholder="NOME DO PERSONAGEM"
                      value={personagem.nome}
                      readOnly
                      title="Informação bloqueada para jogadores"
                      maxLength={30}
                      className="nome-personagem perfil-info-bloqueada"
                    />
                    <div className="dados-personagem">
                      <input
                        type="text"
                        placeholder="CLASSE"
                        value={personagem.classe || ""}
                        readOnly
                        title="Informação bloqueada para jogadores"
                        className="dado-personagem perfil-info-bloqueada"
                        maxLength={30}
                      />
                      <input
                        type="text"
                        placeholder="ARQUÉTIPO"
                        value={arquetipoNome}
                        readOnly
                        title="Informação bloqueada para jogadores"
                        className="dado-personagem perfil-info-bloqueada"
                        maxLength={40}
                      />
                    </div>
                  </div>

                  <div
                    className={`profile-wrapper profile-editavel ${primeiraCondicaoAtiva} ${estadoSanidadePerfil} ${estadoEsperancaPerfil} ${
                      temRitoAtivo ? "rito-ativo-perfil" : ""
                    } ${ritoDesativando ? "rito-desativando" : ""} ${
                      sanidadeSaindo ? "sanidade-saindo" : ""
                    } ${esperancaSaindo ? "esperanca-saindo" : ""}`}
                    title="Clique para trocar a foto de perfil"
                  >
                    <label
                      className="profile-upload-label"
                      htmlFor="foto-perfil-input"
                    >
                      <img
                        src={personagem.fotoPerfil || profile}
                        alt="Perfil"
                        className="profile"
                      />
                      <span className="profile-upload-hint">Trocar foto</span>
                    </label>

                    <input
                      id="foto-perfil-input"
                      type="file"
                      accept="image/*"
                      className="profile-upload-input"
                      onChange={atualizarFotoPerfil}
                    />

                    <div className="profile-overlay"></div>
                  </div>

                  {/* Sanidade + Esperança empilhadas */}
                  <div className="sanidade-completa">
                    <div className="nivel-acima-sanidade">
                      <span className="nivel-label">NÍVEL</span>
                      <span className="nivel-valor">
                        {personagem.nivel || 1}
                      </span>
                    </div>

                    <div className="barra-recurso-rpg sanidade-barra">
                      <div className="barra-rpg-header">
                        <span className="barra-rpg-label">Sanidade</span>
                        <button
                          className="barra-btn barra-btn-menos"
                          onClick={() =>
                            atualizarSanidade(personagem.sanidade.atual - 1)
                          }
                        >
                          −
                        </button>
                        <span className="barra-rpg-valores">
                          <input
                            type="number"
                            value={personagem.sanidade.atual}
                            onChange={(e) => atualizarSanidade(e.target.value)}
                            className="barra-rpg-input atual"
                            min="0"
                            max={personagem.sanidade.max}
                          />
                          <span className="barra-rpg-sep">/</span>
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
                            className="barra-rpg-input max"
                            min="0"
                          />
                        </span>
                        <button
                          className="barra-btn barra-btn-mais"
                          onClick={() =>
                            atualizarSanidade(personagem.sanidade.atual + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className="barra-rpg-track">
                        <div
                          className="barra-rpg-fill sanidade-fill"
                          style={{
                            width: `${personagem.sanidade.max > 0 ? Math.min(100, (personagem.sanidade.atual / personagem.sanidade.max) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="barra-recurso-rpg esperanca-barra">
                      <div className="barra-rpg-header">
                        <span className="barra-rpg-label esperanca-label">
                          Esperança
                        </span>
                        <button
                          className="barra-btn barra-btn-menos esperanca-btn"
                          onClick={() =>
                            atualizarEsperanca(personagem.esperanca.atual - 1)
                          }
                        >
                          −
                        </button>

                        <span className="barra-rpg-valores">
                          <input
                            type="number"
                            value={personagem.esperanca.atual}
                            onChange={(e) => atualizarEsperanca(e.target.value)}
                            className="barra-rpg-input atual esperanca-input"
                            min="0"
                            max={personagem.esperanca.max}
                          />
                          <span className="barra-rpg-sep">/</span>
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
                            className="barra-rpg-input max esperanca-input"
                            min="0"
                          />
                        </span>
                        <button
                          className="barra-btn barra-btn-mais esperanca-btn"
                          onClick={() =>
                            atualizarEsperanca(personagem.esperanca.atual + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className="barra-rpg-track-esperanca-track">
                        <div
                          className="barra-rpg-fill esperanca-fill"
                          style={{
                            width: `${personagem.esperanca.max > 0 ? Math.min(100, (personagem.esperanca.atual / personagem.esperanca.max) * 100) : 0}%`,
                          }}
                        />
                      </div>
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
              className={`aba-btn ${abaAtiva === "habilidades" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("habilidades")}
            >
              HABILIDADES
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
              PERSONAGEM
            </button>
          </div>

          <div className="sidebar-conteudo">{conteudoAbas[abaAtiva]}</div>
          {itemVisualizado && (
            <div
              className="item-visualizer-overlay"
              onClick={() => setItemVisualizado(null)}
            >
              <div
                className="item-visualizer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="item-visualizer-topo">
                  <div className="item-visualizer-icone">
                    {itemVisualizado.icone || "🎒"}
                  </div>

                  <div className="visualizer-info">
                    <span className="visualizer-categoria">
                      {itemVisualizado.tipo || "Item"}
                    </span>

                    <h2>{itemVisualizado.nome}</h2>
                  </div>

                  <button
                    className="item-visualizer-fechar"
                    onClick={() => setItemVisualizado(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="item-visualizer-info">
                  {itemVisualizado.usos && (
                    <p>
                      <strong>Usos:</strong> {itemVisualizado.usos}
                    </p>
                  )}

                  {itemVisualizado.durabilidade && (
                    <p>
                      <strong>Durabilidade:</strong>{" "}
                      {itemVisualizado.durabilidade}
                    </p>
                  )}

                  {itemVisualizado.dano && (
                    <p>
                      <strong>Dano:</strong> {itemVisualizado.dano}
                    </p>
                  )}

                  {itemVisualizado.detalhes && (
                    <p>
                      <strong>Detalhes:</strong> {itemVisualizado.detalhes}
                    </p>
                  )}

                  {itemVisualizado.efeito && (
                    <p>
                      <strong>Efeito:</strong> {itemVisualizado.efeito}
                    </p>
                  )}

                  {itemVisualizado.custo && (
                    <p>
                      <strong>Custo:</strong> {itemVisualizado.custo}
                    </p>
                  )}
                </div>

                {itemVisualizado.armaStatus && (
                  <div className="item-visualizer-status">
                    <span>
                      <strong>Tipo:</strong> {itemVisualizado.armaStatus.tipo}
                    </span>
                    <span>
                      <strong>DMG:</strong> {itemVisualizado.armaStatus.dmg}
                    </span>
                    <span>
                      <strong>ROF:</strong> {itemVisualizado.armaStatus.rof}
                    </span>
                    <span>
                      <strong>MAG:</strong> {itemVisualizado.armaStatus.mag}
                    </span>
                    <span>
                      <strong>Crítico:</strong>{" "}
                      {itemVisualizado.armaStatus.critico}
                    </span>
                    <span>
                      <strong>Dano Cabeça:</strong>{" "}
                      {itemVisualizado.armaStatus.danoCabeca}
                    </span>
                    <span>
                      <strong>Hipfire:</strong>{" "}
                      {itemVisualizado.armaStatus.hipfire}
                    </span>
                    <span>
                      <strong>Precision:</strong>{" "}
                      {itemVisualizado.armaStatus.precision}
                    </span>
                    <span>
                      <strong>Control:</strong>{" "}
                      {itemVisualizado.armaStatus.control}
                    </span>
                    <span>
                      <strong>Mobility:</strong>{" "}
                      {itemVisualizado.armaStatus.mobility}
                    </span>
                  </div>
                )}

                <div className="item-visualizer-acoes">
                  {itemVisualizado.armaStatus ? (
                    <>
                      <button
                        onClick={() =>
                          rolarAtaqueArma(itemVisualizado, "violencia")
                        }
                      >
                        Reflexos + Violência
                      </button>

                      <button
                        onClick={() =>
                          rolarAtaqueArma(itemVisualizado, "percepcao")
                        }
                      >
                        Reflexos + Percepção
                      </button>

                      <button
                        onClick={() =>
                          rolarAtaqueArma(itemVisualizado, "persistencia")
                        }
                      >
                        Reflexos + Persistência
                      </button>

                      <button
                        onClick={() =>
                          rolarAtaqueArma(itemVisualizado, "firmeza")
                        }
                      >
                        Reflexos + Firmeza
                      </button>
                    </>
                  ) : (
                    (itemVisualizado?.rolagem?.formula ||
                      itemVisualizado?.dano?.match(/(\d+)d(\d+)([+-]\d+)?/i) ||
                      itemVisualizado?.efeito?.match(
                        /(\d+)d(\d+)([+-]\d+)?/i,
                      )) && (
                      <button onClick={() => rolarItem(itemVisualizado)}>
                        {itemVisualizado?.tipo
                          ?.toLowerCase()
                          .includes("cura") ||
                        itemVisualizado?.efeito
                          ?.toLowerCase()
                          .includes("recupera")
                          ? "Rolar Cura"
                          : "Rolar Dano"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE ROLAGEM */}
          {modalRolagem && (
            <div
              className="modal-rolagem-overlay"
              onClick={() => !rolandoDados && fecharModalRolagem()}
            >
              <div
                className="modal-rolagem"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-rolagem-topo">
                  <span>
                    {modalRolagem.tipo === "cura"
                      ? "Rolagem de Cura"
                      : modalRolagem.tipo === "dano"
                        ? "Rolagem de Dano"
                        : "Rolagem de Ataque"}
                  </span>

                  <h3>{modalRolagem.titulo}</h3>

                  <p>{modalRolagem.modo}</p>
                </div>

                <div className="modal-rolagem-formula">
                  {modalRolagem.formula}
                </div>

                <div className="dados-rolagem">
                  {modalRolagem.dados.map((dado, index) => (
                    <div
                      key={index}
                      className={`
              dado-rolagem
              d${modalRolagem.faces}
              ${rolandoDados ? "rolando" : ""}
              ${
                !rolandoDados && dado === modalRolagem.maiorResultado
                  ? "maior"
                  : ""
              }
            `}
                    >
                      <span>{rolandoDados ? "?" : dado}</span>
                    </div>
                  ))}
                </div>

                {!rolandoDados && (
                  <>
                    <div className="resultado-rolagem">
                      <span>Maior dado</span>
                      <strong>{modalRolagem.maiorResultado}</strong>
                    </div>

                    <div className="bonus-rolagem">
                      <span>Ativo: +{modalRolagem.bonusAtivo}</span>
                      <span>Passiva: +{modalRolagem.bonusPassiva}</span>
                    </div>

                    <div className="total-rolagem">
                      <span>Resultado Final</span>
                      <strong>{modalRolagem.total}</strong>
                    </div>

                    {modalRolagem.dano && (
                      <div className="dano-rolagem">
                        <span>
                          {modalRolagem.tipo === "cura" ? "Cura" : "Dano"}
                        </span>

                        <strong>
                          {modalRolagem.dano.texto}
                          {" ["}
                          {modalRolagem.dano.rolagens.join(", ")}
                          {"] = "}
                          {modalRolagem.dano.total}
                        </strong>
                      </div>
                    )}

                    <button
                      className="fechar-rolagem"
                      onClick={fecharModalRolagem}
                    >
                      Fechar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {modalAberto && (
          <div className="modal-descricao-overlay" onClick={fecharModal}>
            <div
              className="modal-descricao"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-fechar" onClick={fecharModal}>
                ×
              </button>

              <h2>{modalTitulo}</h2>

              <p style={{ whiteSpace: "pre-line" }}>{modalDescricao}</p>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        className="botao-customizacao-flutuante"
        onClick={() => setCustomizacaoAberta(true)}
      >
        Customizar
      </button>

      {customizacaoAberta && (
        <div
          className="customizacao-overlay"
          onClick={() => setCustomizacaoAberta(false)}
        >
          <section
            className="customizacao-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customizacao-topo">
              <span>Ficha</span>
              <h2>Customização</h2>

              <button
                type="button"
                onClick={() => setCustomizacaoAberta(false)}
              >
                ×
              </button>
            </div>

            {[
              ["primaria", "Cor principal"],
              ["secundaria", "Cor secundária"],
              ["texto", "Texto"],
              ["fundo", "Fundo"],
              ["borda", "Bordas"],
            ].map(([campo, label]) => (
              <label key={campo} className="customizacao-linha">
                <span>{label}</span>

                <div className="customizacao-controles-cor">
                  <input
                    type="color"
                    value={
                      personagem.temaFicha?.[campo] || TEMA_PADRAO_FICHA[campo]
                    }
                    onChange={(event) =>
                      atualizarTemaFicha(campo, event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="customizacao-restaurar-cor"
                    onClick={() => restaurarCorPadrao(campo)}
                  >
                    Restaurar cor
                  </button>
                </div>
              </label>
            ))}

            <button
              type="button"
              className="customizacao-restaurar"
              onClick={restaurarTemaPadrao}
            >
              Restaurar tudo para o padrão
            </button>
          </section>
        </div>
      )}
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

const Atributo = ({ nome, valor }) => {
  const dado = calcularDadoAtributo(valor);

  return (
    <div className="atributoCompleto">
      <div className="atributo-dado">
        <Icon path={dado} size={2} />
      </div>

      <div className="atributo-item">
        <span className="atributo-nome">{nome}</span>

        <div className="atributo-controles">
          <input
            type="number"
            value={valor}
            className="atributo-valor atributo-bloqueado"
            disabled
            title="Atributo bloqueado. Aumente pela tela de Upgrade."
          />
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
const MembroControle = ({
  nome,
  membro,
  membroChave,
  onChange,
  onDamage,
  onDefesaChange,
  onMaxChange,
  classNameInput,
}) => {
  const porcentagem = membro.max > 0 ? (membro.atual / membro.max) * 100 : 0;
  const estadoVida = membro.grave ? "grave" : membro.ferido ? "ferido" : "";

  const classeVida =
  porcentagem <= 10
    ? "vida-critica"
    : porcentagem <= 50
      ? "vida-alerta"
      : "vida-normal";

  return (
    <div className={`membro-controle ${estadoVida}`}>
      <span className="membro-nome">{nome}</span>

      <div className="membro-barra-container">
        <div className="membro-barra-vida">
          <div
            className={`membro-barra-preenchimento ${classeVida}`}
            style={{
              width: `${Math.min(100, Math.max(0, porcentagem))}%`,
            }}
          />

          <input
            type="range"
            min="0"
            max={membro.max}
            value={membro.atual}
            onChange={(e) => onChange(e.target.value)}
            className="membro-slider"
          />
        </div>
        <div className="membro-vida-inputs">
          <input
            type="text"
            inputMode="numeric"
            value={membro.atual}
            min="0"
            max={membro.max}
            onChange={(e) => onChange(e.target.value)}
            className="membro-vida-input"
          />

          <span>/</span>

          <input
            type="text"
            inputMode="numeric"
            value={membro.max}
            min="1"
            onChange={(e) => onMaxChange(membroChave, e.target.value)}
            className="membro-vida-input"
          />
        </div>
      </div>

      <div className="membro-defesa">
        <span className="membro-defesa-label">DEF</span>

        <input
          inputMode="numeric"
          value={membro.defesa || 0}
          onChange={(e) => onDefesaChange(membroChave, e.target.value)}
          className="membro-defesa-input"
        />
      </div>

      <div className="membro-botoes">
        <button
          onClick={() => onDamage(10)}
          title="Dano 10"
          className="btn-rapido btn-menos10"
        >
          -10
        </button>

        <button
          onClick={() => onDamage(5)}
          title="Dano 5"
          className="btn-rapido btn-menos5"
        >
          -5
        </button>

        <button onClick={() => onDamage(1)} title="Dano 1">
          -
        </button>

        <button
          onClick={() => onChange(Math.min(membro.max, membro.atual + 1))}
          title="+1"
        >
          +
        </button>

        <button
          onClick={() => onChange(Math.min(membro.max, membro.atual + 5))}
          title="+5"
          className="btn-rapido btn-mais5"
        >
          +5
        </button>

        <button
          onClick={() => onChange(Math.min(membro.max, membro.atual + 10))}
          title="+10"
          className="btn-rapido btn-mais10"
        >
          +10
        </button>
      </div>
    </div>
  );
};

export default FichaPersonagem;
