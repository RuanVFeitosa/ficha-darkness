// src/components/FichaPersonagem.jsx
import React, { useState, useEffect, useRef } from "react";
import "../CSS/FichaPersonagem.css";
import "../CSS/CondicoesProfile.css";

import { condicoes } from "../components/data/condicoes";
import { receitasCriacao } from "../components/data/receitasCriacao";
import profile from "../assets/IMG/OAbsoluto.webp";
import corpoHumano from "../assets/IMG/corpo_humano.webp";
import { descricoesHabilidades } from "../components/descricoesHabilidades";
import ModalDescricao from "../components/modal/modalDescricao";
import {
  buscarArvoresHabilidades,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import { compressProfileImage } from "../services/imageCompression";
import {
  notificarPersonagemAtualizado,
  ouvirArvoresAtualizadas,
  ouvirPersonagemAtualizado,
} from "../services/syncEvents";
import { SYNC_INTERVALS, iniciarPollingVisivel } from "../services/syncPolicy";
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
  mdiBagPersonalOutline,
  mdiFlashlight,
  mdiMedicalBag,
  mdiTools,
  mdiShield,
  mdiMapMarkerPath,
  mdiClipboardText,
  mdiHeartPulse,
  mdiBomb,
  mdiFire,
  mdiFlask,
  mdiSleep,
  mdiCircleSmall,
} from "@mdi/js";
import { obterIconeItem } from "../utils/itemIcons";
import {
  listarHabilidadesSelecionadas,
  obterArvoreClasse,
  salvarArvoresCustom,
} from "../data/Classes/arvoresHabilidades";

// Chave para o localStorage
const STORAGE_KEY = "fichaRPG_personagem";
const DEFAULT_FICHA_ID = "principal";
const RECEITAS_STORAGE_KEY = "darkness_receitas_criacao";

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

const CampoNumeroEditavel = ({ valor, onConfirmar, ...props }) => {
  const [rascunho, setRascunho] = useState(String(valor ?? ""));

  useEffect(() => {
    setRascunho(String(valor ?? ""));
  }, [valor]);

  const confirmar = () => {
    const numero = parseInt(rascunho, 10);
    onConfirmar(Number.isFinite(numero) ? numero : 0);
  };

  return (
    <input
      {...props}
      value={rascunho}
      onChange={(event) => setRascunho(event.target.value)}
      onBlur={confirmar}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
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
  bonusDefesa: 0,
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
  pontosIntegridade: {
    disponiveis: 0,
    gastos: 0,
  },
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
  poderesAbsolutos: [], // <-- ADICIONE AQUI
  habilidadesClasse: {
    habilidadeAbsoluta: "",
    aptidoes: {},
    especialidade: "",
    especialidadeDefinida: false,
    habilidadesEspecialidade: {},
  },

  // Habilidades criadas pelos jogadores (aba "Marcas")
  marcas: [],
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

const descricoesStatusArma = {
  tipo: "TIPO\n\nDefine a categoria da arma (Pistola, Rifle, Fuzil, etc.). Cada tipo possui características próprias de manuseio e modificações.",
  dmg: "DMG\n\nRepresenta o dano que a arma pode causar por rodada. É o valor base considerado sempre que um disparo acerta o alvo.",
  rof: "ROF (Rate of Fire)\n\nDefine o potencial crítico da arma — a chance de causar dano adicional quando o disparo atinge um ponto vulnerável. Quanto maior o ROF, maior a probabilidade de um acerto crítico. Para um acerto crítico, os dados terão que ser igual ou maior que o ROF. Caso os dados não cheguem até o resultado, soma-se o resultado dos dados.",
  critico:
    "CRÍTICO\n\nRequisito de crítico: O valor necessário para que um disparo seja considerado crítico. Geralmente depende de uma rolagem específica ou de um modificador proveniente da arma ou do personagem. Por exemplo: 3x6 é equivalente a 3 dados que resultaram em 6.",
  danoCabeca:
    "DANO MÁXIMO NA CABEÇA\n\nDefine o teto de dano que a arma pode causar caso acerte diretamente a cabeça do alvo.",
  hipfire:
    "HIPFIRE (Violência)\n\nDisparo rápido e agressivo. Ao usar o Ativo de Violência, o personagem aumenta o dano causado pelo tiro. Ideal para confrontos de curta distância, quando precisão é secundária ao impacto.",
  precision:
    "PRECISION (Percepção)\n\nTiro focado e calculado. Com o Ativo de Percepção, o personagem estende o alcance da arma além do normal e, em certos modelos, ainda recebe bônus no teste. É o modo preferido para acertos de longa distância.",
  control:
    "CONTROL (Persistência)\n\nTiro estabilizado e constante. Utilizando o Ativo de Persistência, o atirador remove todas as penalidades que teria ao disparar — seja por movimento, postura, distância ou condição adversa. Excelente para confrontos prolongados.",
  mobility:
    "MOBILITY (Firmeza)\n\nMovimentação fluida e ofensiva. Com o Ativo de Firmeza, o personagem pode atacar até dois alvos na mesma ação, se a arma permitir múltiplos disparos. Favorece personagens ágeis que atacam em movimento.",
};

const FichaPersonagem = () => {
  const [fichaId] = useState(() => obterFichaIdDaUrl());
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [abaAtiva, setAbaAtiva] = useState("combate");
  const [ultimoSave, setUltimoSave] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const [receitasCriacaoAtuais, setReceitasCriacaoAtuais] = useState(() => {
    try {
      const raw = localStorage.getItem(RECEITAS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : receitasCriacao;
    } catch (error) {
      console.warn("Erro ao carregar receitas do localStorage:", error);
      return receitasCriacao;
    }
  });

  useEffect(() => {
    const atualizarReceitasDoStorage = (event) => {
      if (event.key !== RECEITAS_STORAGE_KEY) {
        return;
      }

      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : null;

        setReceitasCriacaoAtuais(
          Array.isArray(parsed) && parsed.length > 0 ? parsed : receitasCriacao,
        );
      } catch (error) {
        console.warn("Erro ao atualizar receitas do localStorage:", error);
      }
    };

    window.addEventListener("storage", atualizarReceitasDoStorage);
    return () => {
      window.removeEventListener("storage", atualizarReceitasDoStorage);
    };
  }, []);

  const [subAbaInventario, setSubAbaInventario] = useState("mochila");
  const [abaCriacao, setAbaCriacao] = useState("armas");
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [armaUpgradeIndex, setArmaUpgradeIndex] = useState(null);
  const [mensagemCraft, setMensagemCraft] = useState("");
  const [popupCraft, setPopupCraft] = useState(null);
  const [municaoSelecionadaIndex, setMunicaoSelecionadaIndex] = useState(null);
  const [rolandoDados, setRolandoDados] = useState(false);
  const [itemVisualizado, setItemVisualizado] = useState(null);
  const [visualizadorAberto, setVisualizadorAberto] = useState(false);
  const [visualizadorFechando, setVisualizadorFechando] = useState(false);
  const [ritoVisualizado, setRitoVisualizado] = useState(null);
  const [ritoDesativando, setRitoDesativando] = useState(false);
  const [sanidadeSaindo, setSanidadeSaindo] = useState(false);
  const [esperancaSaindo, setEsperancaSaindo] = useState(false);
  const [ultimoEstadoSanidade, setUltimoEstadoSanidade] = useState("");
  const [ultimoEstadoEsperanca, setUltimoEstadoEsperanca] = useState("");
  const [ritoAtivo, setRitoAtivo] = useState(false);
  const [customizacaoAberta, setCustomizacaoAberta] = useState(false);
  const [subAbaMaleta, setSubAbaMaleta] = useState("medicinal");
  const [subAbaRituais, setSubAbaRituais] = useState("rituais");

  // ESTADO PARA O MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalDescricao, setModalDescricao] = useState("");
  const [modalRolagem, setModalRolagem] = useState(null);
  const [ataqueModalAberto, setAtaqueModalAberto] = useState(false);
  const [ataqueModoSelecionado, setAtaqueModoSelecionado] = useState("normal");
  const [modoAtaque, setModoAtaque] = useState("normal");
  const [criticoAtivo, setCriticoAtivo] = useState(false);
  const [ataqueCritico, setAtaqueCritico] = useState(false);
  const [criticoCorpoACorpo, setCriticoCorpoACorpo] = useState(false);
  const [ataqueItemRef, setAtaqueItemRef] = useState(null);
  // Dentro do componente FichaPersonagem, adicione estes estados:

  const [subAbaPersonalizacao, setSubAbaPersonalizacao] =
    useState("customizacao");
  const [formulaDadoPersonalizado, setFormulaDadoPersonalizado] = useState("");
  const [erroRolagemPersonalizada, setErroRolagemPersonalizada] = useState("");
  const [modificadorDadosRolagem, setModificadorDadosRolagem] = useState(0);
  const [ativoPassivaSelecionado, setAtivoPassivaSelecionado] =
    useState("razao");
  const ignorarProximoSalvamentoRef = useRef(false);

  const [subAbaHabilidade, setSubAbaHabilidade] = useState("arquetipo");
  const [subAbaMarcaSelecionada, setSubAbaMarcaSelecionada] = useState(null);

  const [marcaModalAberto, setMarcaModalAberto] = useState(false);
  const [marcaSelecionada, setMarcaSelecionada] = useState(null);
  const [habilidadeEscolhidaIndex, setHabilidadeEscolhidaIndex] =
    useState(null);
  const marcasPendentes = (personagem.marcas || []).filter((m) => !m.aceita);
  const temMarcaPendente = marcasPendentes.length > 0;

  const abrirVisualizador = (item, index) => {
    setItemVisualizado({ ...item, index });
    setVisualizadorAberto(true);
    setVisualizadorFechando(false);
  };

  const fecharVisualizador = () => {
    setVisualizadorFechando(true);
    setTimeout(() => {
      setItemVisualizado(null);
      setVisualizadorAberto(false);
      setVisualizadorFechando(false);
    }, 300);
  };

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

  const abrirModalMarca = (marca) => {
    setMarcaSelecionada(marca);
    setHabilidadeEscolhidaIndex(null);
    setMarcaModalAberto(true);
  };

  const abrirDescricaoStatus = (titulo, chave) => {
    setModalTitulo(titulo);
    setModalDescricao(
      descricoesStatusArma[chave] || "Descrição não disponível.",
    );
    setModalAberto(true);
  };

  const abrirModalAtaque = (item) => {
    setAtaqueItemRef(item);
    setAtaqueModoSelecionado("normal");
    setAtaqueCritico(false);
    setAtaqueModalAberto(true);
  };

  const fecharModalAtaque = () => {
    setAtaqueModalAberto(false);
    setAtaqueItemRef(null);
  };

  const executarAtaque = () => {
    if (!ataqueItemRef) return;
    rolarAtaqueArma(ataqueItemRef, ataqueModoSelecionado, ataqueCritico);
    fecharModalAtaque();
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

    const carregarFicha = async () => {
      try {
        salvarLocalSeguro(ULTIMA_FICHA_KEY, fichaId);

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

        if (!ativo) return;

        if (arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
        }

        if (personagemApi) {
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

          setPersonagem(personagemApi);
          console.log("BACKEND:", personagemApi);

          console.log("✅ Dados carregados do backend");
        }
      } catch (error) {
        console.warn("⚠️ Backend indisponível. Tentando localStorage.", error);

        const dadosSalvos = lerLocalSeguro(storageKey);

        if (dadosSalvos && ativo) {
          try {
            const personagemSalvo = JSON.parse(dadosSalvos);

            setPersonagem(personagemSalvo);
            console.log("LOCAL STORAGE:", personagemSalvo);

            console.log("⚠️ Dados carregados do localStorage");
          } catch (erro) {
            console.error("Erro ao carregar localStorage:", erro);
          }
        }
      } finally {
        if (ativo) {
          setCarregado(true);
        }
      }
    };

    carregarFicha();

    return () => {
      ativo = false;
    };
  }, [fichaId, storageKey]);

  useEffect(() => {
    let cancelado = false;

    const recarregarPersonagem = async ({ fichaId: fichaAtualizada } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaId) return;

      try {
        const personagemApi = await buscarPersonagem(fichaId);
        if (!cancelado && personagemApi) {
          ignorarProximoSalvamentoRef.current = true;
          setPersonagem(personagemApi);
        }
      } catch (error) {
        const dadosSalvos = lerLocalSeguro(storageKey);

        if (!cancelado && dadosSalvos) {
          try {
            ignorarProximoSalvamentoRef.current = true;
            setPersonagem(JSON.parse(dadosSalvos));
          } catch {
            console.warn("Nao foi possivel sincronizar a ficha local.");
          }
        }
      }
    };

    const recarregarArvores = async () => {
      try {
        const arvoresApi = await buscarArvoresHabilidades();
        if (!cancelado && arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          ignorarProximoSalvamentoRef.current = true;
          setPersonagem((atual) => ({ ...atual }));
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar arvores.", error);
      }
    };

    const sincronizarTudo = () => {
      recarregarPersonagem();
      recarregarArvores();
    };
    const pararPersonagem = ouvirPersonagemAtualizado(recarregarPersonagem);
    const pararArvores = ouvirArvoresAtualizadas(recarregarArvores);
    const pararPolling = iniciarPollingVisivel(
      sincronizarTudo,
      SYNC_INTERVALS.ficha,
    );

    return () => {
      cancelado = true;
      pararPersonagem();
      pararArvores();
      pararPolling();
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

    if (ignorarProximoSalvamentoRef.current) {
      ignorarProximoSalvamentoRef.current = false;
      salvarPersonagemLocalSeguro(storageKey, personagem);
      return;
    }

    salvarPersonagemLocalSeguro(storageKey, personagem);
    notificarPersonagemAtualizado(fichaId, personagem);
    setUltimoSave(new Date().toLocaleTimeString());

    const timeout = window.setTimeout(() => {
      salvarPersonagem(fichaId, personagem)
        .then((personagemSalvo) => {
          notificarPersonagemAtualizado(fichaId, personagemSalvo || personagem);
        })
        .catch((error) => {
          console.warn(
            "Backend indisponivel. Dados mantidos no localStorage.",
            error,
          );
        });
    }, SYNC_INTERVALS.autoSaveDebounce);

    return () => {
      window.clearTimeout(timeout);
    };
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
    window.location.href = montarUrlFicha(personagem, fichaId, "?loja=1");
  };

  const abrirUpgradeNivel = () => {
    window.location.href = montarUrlFicha(personagem, fichaId, "?upgrade=1");
  };

  const abrirArvoreHabilidades = () => {
    window.location.href = montarUrlFicha(
      personagem,
      fichaId,
      "?habilidades=1",
    );
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
    faca: "faca",
    polvora: "polvora",
    pólvora: "polvora",
    chumbo: "chumbo",
    capsula: "capsula",
    cápsula: "capsula",
    espoleta: "espoleta",
    "caixa de municao": "caixaMunicao",
    "caixa de munição": "caixaMunicao",
    municao: "caixaMunicao",
    munição: "caixaMunicao",
    // Se você tiver um material genérico "materiais de criação"
    "kit de municao": "kitMunicao",
    "kit de munição": "kitMunicao",
  };

  const obterQuantidadeIngrediente = (nome) => {
    const encontrado = String(nome).match(/(\d+)x/i);
    return encontrado ? parseInt(encontrado[1], 10) : 1;
  };

  const obterIngredientesReceita = (receita) => {
    const rawIngredientes = receita?.ingredientes;
    if (!rawIngredientes) return [];
    if (typeof rawIngredientes === "string") {
      return rawIngredientes
        .split(",")
        .map((ingrediente) => ingrediente.trim())
        .filter(Boolean)
        .map((nome) => ({ nome }));
    }
    if (Array.isArray(rawIngredientes)) {
      return rawIngredientes.map((ingrediente) => {
        if (!ingrediente) return { nome: "" };
        return typeof ingrediente === "string"
          ? { nome: ingrediente }
          : { nome: ingrediente.nome || "" };
      });
    }
    return [];
  };

  const isMunicaoEspecialItem = (item) => {
    const texto = `${item?.nome || ""} ${item?.tipo || ""}`.toLowerCase();
    return /muni[cç][ãa]o|flechas|quantidade:/i.test(texto);
  };

  const getTipoMunicaoEspecial = (item) => {
    const texto = `${item?.nome || ""} ${item?.tipo || ""}`.toLowerCase();
    if (texto.includes("explosivo")) return "explosiva";
    if (texto.includes("incendiaria") || texto.includes("fogo"))
      return "incendiaria";
    if (texto.includes("ácido") || texto.includes("acido")) return "acida";
    if (
      texto.includes("sono") ||
      texto.includes("sonífera") ||
      texto.includes("sonifera")
    )
      return "sonifera";
    return "padrao";
  };

  const getClassMunicaoEspecial = (item) =>
    `municao-especial-item tipo-${getTipoMunicaoEspecial(item)}`;

  const getIconMunicaoEspecial = (item) => {
    switch (getTipoMunicaoEspecial(item)) {
      case "explosiva":
        return mdiBomb;
      case "incendiaria":
        return mdiFire;
      case "acida":
        return mdiFlask;
      case "sonifera":
        return mdiSleep;
      default:
        return mdiCircleSmall;
    }
  };

  const obterBonusMunicaoEspecial = (texto) => {
    const valor = String(texto || "").toLowerCase();
    if (valor.includes("explosivo")) return "1d6";
    if (valor.includes("ácido") || valor.includes("acido")) return "1d4";
    if (valor.includes("fogo") || valor.includes("incendiaria")) return "1d6";
    if (valor.includes("sono") || valor.includes("sonifera")) return "1d4";
    if (valor.includes("perfura") || valor.includes("flecha")) return "1d4";
    return "1d4";
  };

  const montarMunicaoEspecial = (receita) => {
    const danoBruto = receita.dano || receita.tipo || receita.nome || "";

    // Verifica se já é uma fórmula de dados (ex: 3d6, 2d8+2)
    const isFormula = /(\d+)d(\d+)([+-]\d+)?/i.test(danoBruto);

    // Se for fórmula, usa ela diretamente. Senão, usa o mapeamento antigo.
    const bonusDano = isFormula
      ? danoBruto
      : obterBonusMunicaoEspecial(danoBruto);

    return {
      ...receita,
      detalhes: receita.efeito || receita.dano || receita.tipo || "Item",
      quantidade: (String(receita.tipo || "").match(/⧭/g) || []).length || 1,
      municaoEspecial: true,
      bonusDano,
      criado: true,
    };
  };

  const combinarBonusDano = (baseBonus, extraBonus) => {
    const partes = [baseBonus, extraBonus]
      .filter(Boolean)
      .map((texto) => texto.trim())
      .filter(Boolean);

    if (!partes.length) return "";
    return partes.join(" + ");
  };

  const registrarRolagemMestre = (rolagem) => {
    const novaRolagem = {
      id: `${Date.now()}-${Math.random()}`,
      jogador: personagem.nome || "Jogador",
      horario: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      ...rolagem,
    };

    const chave = "darkness_rolagens_mestre";

    let historico = [];

    try {
      historico = JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      historico = [];
    }

    const atualizado = [novaRolagem, ...historico].slice(0, 3);

    localStorage.setItem(chave, JSON.stringify(atualizado));

    window.dispatchEvent(
      new CustomEvent("darkness:nova-rolagem", {
        detail: novaRolagem,
      }),
    );
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

  const interpretarBonusDano = (bonusTexto) => {
    const texto = String(bonusTexto || "")
      .toLowerCase()
      .replace(/\s/g, "");

    if (!texto) {
      return null;
    }

    const dado = interpretarDano(texto.replace(/^\+/, ""));

    if (dado) {
      return {
        tipo: "dados",
        ...dado,
      };
    }

    const valorFixo = parseInt(texto, 10);

    if (!Number.isNaN(valorFixo)) {
      return {
        tipo: "fixo",
        bonus: valorFixo,
      };
    }

    return null;
  };

  const obterQuantidadeAlvosFirmeza = (mobilityTexto) => {
    const texto = String(mobilityTexto || "");

    // Prioriza padrões que indiquem explicitamente alvos.
    // Aceita: "Firmeza | 2 alvos", "Firmeza | 2", "2 alvos", "2 alvo".
    const matchAlvos = texto.match(/(\d+)\s*(?:alvos?|alvo)\b/i);
    if (matchAlvos) {
      const n = parseInt(matchAlvos[1], 10);
      return Number.isFinite(n) ? Math.max(1, n) : 2;
    }

    // Fallback: pega o primeiro número do texto (ex: "Firmeza | 2").
    const matchNumero = texto.match(/(\d+)/);
    if (matchNumero) {
      const n = parseInt(matchNumero[1], 10);
      return Number.isFinite(n) ? Math.max(1, n) : 2;
    }

    return 2;
  };

  const rolarDanoArma = (dmg, dadosExtras = 0, bonusDano = "") => {
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

    const bonus = interpretarBonusDano(bonusDano);
    const rolagensBonus =
      bonus?.tipo === "dados"
        ? Array.from({ length: bonus.quantidade }, () => rolarDado(bonus.faces))
        : [];

    const total =
      rolagens.reduce((soma, valor) => soma + valor, 0) +
      dano.bonus +
      rolagensBonus.reduce((soma, valor) => soma + valor, 0) +
      (bonus?.bonus || 0);

    const textoBonus =
      bonus?.tipo === "dados"
        ? ` + ${bonus.quantidade}d${bonus.faces}${bonus.bonus ? `+${bonus.bonus}` : ""}`
        : bonus?.bonus
          ? `${bonus.bonus > 0 ? " +" : " "}${bonus.bonus}`
          : "";

    return {
      total,
      rolagens,
      rolagensBonus,
      texto: `${quantidadeFinal}d${dano.faces}${dano.bonus ? `+${dano.bonus}` : ""}${textoBonus}`,

      dadosDetalhados: [
        ...rolagens.map((valor) => ({
          valor,
          faces: dano.faces,
        })),
        ...rolagensBonus.map((valor) => ({
          valor,
          faces: bonus?.faces || dano.faces,
        })),
      ],
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

  const rolarTeste = ({
    atributo,
    ativo,
    passiva = 0,
    modificadorDados = 0,
  }) => {
    const valorAtributo = parseInt(atributo, 10) || 0;
    const bonusAtivo = parseInt(ativo, 10) || 0;
    const bonusPassiva = parseInt(passiva, 10) || 0;

    const quantidadeBase = obterModificadorAtributo(valorAtributo);
    const quantidadeDados = Math.max(1, quantidadeBase + modificadorDados);
    const faces = obterDadoAtributo(valorAtributo);

    const rolagens = Array.from({ length: quantidadeDados }, () =>
      rolarDado(faces),
    );

    const rolagensOrdenadas = [...rolagens].sort((a, b) => b - a);
    const finais = rolagens.filter((valor) => valor === faces).length;

    const maiorResultado = rolagensOrdenadas[0] || 0;

    const resultadosExtras = rolagensOrdenadas.slice(1, 1 + finais);
    const bonusFinais = resultadosExtras.reduce(
      (soma, valor) => soma + valor,
      0,
    );

    const total = maiorResultado + bonusFinais + bonusAtivo + bonusPassiva;

    return {
      quantidadeBase,
      modificadorDados,
      quantidadeDados,
      faces,
      rolagens,
      rolagensOrdenadas,
      finais,
      resultadosExtras,
      bonusFinais,
      maiorResultado,
      bonusAtivo,
      bonusPassiva,
      total,
    };
  };

  const extrairDadosCritico = (criticoTexto) => {
    if (!criticoTexto) return 2; // fallback seguro
    const match = String(criticoTexto).match(/(\d+)x/i);
    return match ? parseInt(match[1], 10) : 2;
  };

  const rolarAtaqueArma = (item, modo = "normal", critico = false) => {
    const arma = item.armaStatus;

    if (!arma) {
      setMensagemCraft("Este item não possui dados de arma.");
      return;
    }

    const efeitosPorModo = {
      normal: "Disparo padrão.",
      violencia: "Violência: +2 dados de dano.",
      percepcao: "Percepção: disparo atento.",
      persistencia: "Persistência: disparo resistente.",
      firmeza: "Firmeza: ataque simultâneo em dois alvos.",
    };

    const dadosExtrasPorModo = {
      normal: 0,
      violencia: 2,
      percepcao: 0,
      persistencia: 0,
      firmeza: 0,
    };

    // Adiciona +2 dados se for crítico

    const dadosExtrasBase = dadosExtrasPorModo[modo] || 0;
    const dadosCritico = critico ? extrairDadosCritico(arma.critico) : 0;
    const dadosExtras = dadosExtrasBase + dadosCritico;
    const danoBase = interpretarDano(arma.dmg);
    const quantidadeAlvosFirmeza =
      modo === "firmeza" ? obterQuantidadeAlvosFirmeza(arma.mobility) : 1;

    const bonusMunicao = item.municaoCarregada
      ? item.municaoCarregada.bonusDano
      : "";
    const bonusFinal = combinarBonusDano(
      item.bonusDanoArma || "",
      bonusMunicao,
    );

    const resultadosAlvos =
      modo === "firmeza"
        ? Array.from({ length: quantidadeAlvosFirmeza }, () =>
            rolarDanoArma(arma.dmg, dadosExtras, bonusFinal),
          )
        : [rolarDanoArma(arma.dmg, dadosExtras, bonusFinal)];

    const resultado = resultadosAlvos[0];
    const formula =
      modo === "firmeza"
        ? `${quantidadeAlvosFirmeza}x ${resultado.texto}`
        : resultado.texto;
    const modoDescricao =
      modo === "firmeza"
        ? `Firmeza: ataque simultâneo em ${quantidadeAlvosFirmeza} alvos.`
        : efeitosPorModo[modo] || efeitosPorModo.normal;

    // Adiciona "Crítico!" ao modo se for crítico
    const modoComCritico = critico
      ? `⚡ CRÍTICO! - ${modoDescricao}`
      : modoDescricao;

    setRolandoDados(true);

    const rolagem = {
      tipo: "dano",
      titulo: item.nome,
      modo: modoComCritico,
      formula,

      dados: resultadosAlvos.flatMap((res) => [
        ...res.rolagens,
        ...(res.rolagensBonus || []),
      ]),

      dadosDetalhados:
        modo === "firmeza" && resultadosAlvos.length > 1
          ? []
          : resultado.dadosDetalhados,

      faces: danoBase?.faces || 6,

      maiorResultado: Math.max(
        ...resultado.rolagens,
        ...(resultado.rolagensBonus || []),
      ),

      bonusAtivo: 0,
      bonusPassiva: 0,

      total: resultadosAlvos.reduce((soma, res) => soma + res.total, 0),

      dano: null,

      alvos:
        modo === "firmeza" && resultadosAlvos.length > 1
          ? resultadosAlvos.map((res, index) => ({
              nome: `ALVO ${index + 1}`,
              resultado: res,
            }))
          : [],
    };

    setModalRolagem(rolagem);
    registrarRolagemMestre(rolagem);

    if (item.municaoCarregada) {
      const armaIndex = encontrarIndexArmaNoInventario(item);
      if (armaIndex !== undefined && armaIndex !== null && armaIndex >= 0) {
        consumirMunicaoDaArma(armaIndex);
      }
    }

    setTimeout(() => {
      setRolandoDados(false);
    }, 1200);
  };

  const atualizarBonusDanoArma = (indexAlvo, bonusDano) => {
    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const item = novoInventario[indexAlvo];

      if (!item) {
        return prev;
      }

      const itemAtualizado = {
        ...item,
        bonusDanoArma: bonusDano,
      };

      novoInventario[indexAlvo] = itemAtualizado;
      setItemVisualizado({ ...itemAtualizado, index: indexAlvo });

      return {
        ...prev,
        inventario: novoInventario,
      };
    });
  };

  const obterMunicoesEspeciais = () =>
    (personagem.inventario || [])
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) => item.municaoEspecial || isMunicaoEspecialItem(item),
      );

  const encontrarIndexArmaNoInventario = (item) => {
    const inventario = personagem.inventario || [];

    if (item?.index !== undefined && inventario[item.index] === item) {
      return item.index;
    }

    return inventario.findIndex((inventarioItem) => {
      if (!item || !inventarioItem) return false;
      if (inventarioItem === item) return true;
      if (inventarioItem.nome !== item.nome) return false;

      const armaA = item.armaStatus;
      const armaB = inventarioItem.armaStatus;

      if (!!armaA !== !!armaB) return false;
      if (!armaA && !armaB) return true;

      return (
        String(armaA.dmg || "") === String(armaB.dmg || "") &&
        String(armaA.tipo || "") === String(armaB.tipo || "") &&
        String(armaA.rof || "") === String(armaB.rof || "")
      );
    });
  };

  const carregarMunicaoEspecial = (armaIndex, ammoIndex) => {
    if (ammoIndex === null || ammoIndex === undefined) return;

    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const arma = novoInventario[armaIndex];
      const municao = novoInventario[ammoIndex];

      if (
        !arma ||
        !arma.armaStatus ||
        !municao ||
        !(municao.municaoEspecial || isMunicaoEspecialItem(municao))
      ) {
        return prev;
      }

      const quantidadeMunicao = parseInt(municao.quantidade, 10) || 1;
      const municaoCarregada = {
        ...municao,
        quantidade: quantidadeMunicao,
        municaoEspecial: true,
      };

      novoInventario.splice(ammoIndex, 1);
      const armaIndexAtualizado =
        ammoIndex < armaIndex ? armaIndex - 1 : armaIndex;

      novoInventario[armaIndexAtualizado] = {
        ...arma,
        municaoCarregada,
      };

      if (
        itemVisualizado?.index === armaIndex ||
        itemVisualizado?.index === armaIndexAtualizado
      ) {
        setItemVisualizado({
          ...arma,
          municaoCarregada,
          index: armaIndexAtualizado,
        });
      }

      return {
        ...prev,
        inventario: novoInventario,
      };
    });

    setMunicaoSelecionadaIndex(null);
  };

  const removerMunicaoDaArma = (armaIndex) => {
    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const arma = novoInventario[armaIndex];

      if (!arma || !arma.municaoCarregada) {
        return prev;
      }

      const { municaoCarregada, ...armaSemMunicao } = arma;
      novoInventario[armaIndex] = armaSemMunicao;
      novoInventario.push({
        ...municaoCarregada,
        municaoEspecial: true,
      });

      if (itemVisualizado?.index === armaIndex) {
        setItemVisualizado({ ...armaSemMunicao, index: armaIndex });
      }

      return {
        ...prev,
        inventario: novoInventario,
      };
    });
  };

  const consumirMunicaoDaArma = (armaIndex) => {
    setPersonagem((prev) => {
      const novoInventario = [...(prev.inventario || [])];
      const arma = novoInventario[armaIndex];

      if (!arma || !arma.municaoCarregada) {
        return prev;
      }

      const municaoCarregada = {
        ...arma.municaoCarregada,
        quantidade: Math.max(
          0,
          (parseInt(arma.municaoCarregada.quantidade, 10) || 1) - 1,
        ),
      };

      if (municaoCarregada.quantidade > 0) {
        novoInventario[armaIndex] = {
          ...arma,
          municaoCarregada,
        };
      } else {
        const { municaoCarregada: _removed, ...armaSemMunicao } = arma;
        novoInventario[armaIndex] = armaSemMunicao;
      }

      const precisaAtualizarVisualizado =
        itemVisualizado?.index === armaIndex ||
        (itemVisualizado?.nome === arma.nome &&
          itemVisualizado?.armaStatus?.dmg === arma.armaStatus?.dmg &&
          itemVisualizado?.armaStatus?.tipo === arma.armaStatus?.tipo);

      if (precisaAtualizarVisualizado) {
        const itemAtualizado = novoInventario[armaIndex];
        setItemVisualizado({ ...itemAtualizado, index: armaIndex });
      }

      return {
        ...prev,
        inventario: novoInventario,
      };
    });
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
      fecharVisualizador(); // 🔥 substituído
      setTimeout(() => setMensagemCraft(""), 3000);
    }
  };

  const iconesPersonalizados = React.useMemo(
    () => [
      { nome: "Mochila", value: mdiBagPersonalOutline },
      { nome: "Lanterna", value: mdiFlashlight },
      { nome: "Kit Médico", value: mdiMedicalBag },
      { nome: "Ferramentas", value: mdiTools },
      { nome: "Escudo", value: mdiShield },
      { nome: "Mapa", value: mdiMapMarkerPath },
      { nome: "Prancheta", value: mdiClipboardText },
      { nome: "Pulso", value: mdiHeartPulse },
    ],
    [],
  );

  const [itemPersonalizado, setItemPersonalizado] = useState({
    nome: "",
    icone: mdiBagPersonalOutline,
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
      fecharVisualizador(); // <-- substitui setItemVisualizado(null)
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

    const rolagem = {
      tipo: tipoRolagem,
      titulo: item.nome,
      modo: tipoRolagem === "cura" ? "Rolagem de Cura" : "Rolagem de Dano",
      formula: resultado.texto,
      dados: [...resultado.rolagens, ...(resultado.rolagensBonus || [])],
      dadosDetalhados: resultado.dadosDetalhados,
      faces: interpretarDano(formula)?.faces || 6,
      maiorResultado: Math.max(
        ...resultado.rolagens,
        ...(resultado.rolagensBonus || []),
      ),
      bonusAtivo: 0,
      bonusPassiva: 0,
      total: resultado.total,
      dano: resultado,
      itemQuebrou: quebrouComEssaRolagem,
    };

    setModalRolagem(rolagem);
    registrarRolagemMestre(rolagem);

    if (
      tipoRolagem === "dano" &&
      item?.durabilidade &&
      item?.durabilidade !== "—"
    ) {
      reduzirDurabilidadeItem(item.index);
    }

    if (tipoRolagem === "dano" && item?.municaoCarregada) {
      const armaIndex = encontrarIndexArmaNoInventario(item);
      if (armaIndex >= 0) {
        consumirMunicaoDaArma(armaIndex);
      }
    }

    setTimeout(() => setRolandoDados(false), 1200);
  };

  const fecharModalRolagem = () => {
    if (modalRolagem?.itemQuebrou) {
      setItemVisualizado(null);
    }

    setModalRolagem(null);
  };

  const renderizarIconeItem = (item) => {
    const icone = item?.icone || obterIconeItem(item);

    const ehImagem =
      typeof icone === "string" &&
      (icone.endsWith(".svg") ||
        icone.includes(".svg") ||
        icone.startsWith("data:image"));

    if (ehImagem) {
      return (
        <img
          src={icone}
          alt=""
          className="inventario-card-img"
          aria-hidden="true"
        />
      );
    }

    const ehEmoji =
      typeof icone === "string" &&
      [...icone].some((char) => /\p{Extended_Pictographic}/u.test(char));

    if (ehEmoji) {
      return <span className="inventario-card-emoji">{icone}</span>;
    }

    if (typeof icone === "string") {
      return <Icon path={icone} size={2.2} color="#f5efe4" />;
    }

    return <Icon path={icone} size={2.2} color="#f5efe4" />;
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
    const inventarioAtual = personagem.inventario || [];
    const ingredientes = obterIngredientesReceita(receita);

    // Verifica se há ingredientes suficientes
    let materiaisFaltantes = [];
    let itensBaseFaltantes = [];

    const temIngredientes = ingredientes.every(({ nome }) => {
      const chaveNormalizada = normalizarIngrediente(nome);
      const chaveMaterial = mapaIngredientes[chaveNormalizada];
      const quantidadeNecessaria = obterQuantidadeIngrediente(nome);

      if (chaveMaterial) {
        // É um material de criação
        const tem =
          (materiaisAtuais[chaveMaterial] || 0) >= quantidadeNecessaria;
        if (!tem) {
          materiaisFaltantes.push(
            `${nome} (faltam ${quantidadeNecessaria}, tem ${materiaisAtuais[chaveMaterial] || 0})`,
          );
        }
        return tem;
      } else {
        // É um item base (não está no mapa de materiais)
        const quantidadeDisponivel = inventarioAtual.filter(
          (item) => item.nome === nome,
        ).length;
        if (quantidadeDisponivel < quantidadeNecessaria) {
          itensBaseFaltantes.push(
            `${nome} (faltam ${quantidadeNecessaria}, tem ${quantidadeDisponivel})`,
          );
        }
        return quantidadeDisponivel >= quantidadeNecessaria;
      }
    });

    if (!temIngredientes) {
      const mensagem = [...materiaisFaltantes, ...itensBaseFaltantes].join(
        "\n",
      );
      setPopupCraft({
        titulo: "Materiais insuficientes",
        mensagem: `Você não possui todos os materiais necessários:\n${mensagem}`,
      });
      return;
    }

    // Consome os materiais de criação
    let materiaisAtualizados = { ...materiaisAtuais };
    ingredientes.forEach(({ nome }) => {
      const chaveNormalizada = normalizarIngrediente(nome);
      const chaveMaterial = mapaIngredientes[chaveNormalizada];
      const quantidadeNecessaria = obterQuantidadeIngrediente(nome);

      if (chaveMaterial) {
        materiaisAtualizados[chaveMaterial] = Math.max(
          0,
          (materiaisAtualizados[chaveMaterial] || 0) - quantidadeNecessaria,
        );
      }
    });

    // Remove os itens base do inventário
    let novoInventario = [...inventarioAtual];
    ingredientes.forEach(({ nome }) => {
      const chaveNormalizada = normalizarIngrediente(nome);
      const chaveMaterial = mapaIngredientes[chaveNormalizada];
      const quantidadeNecessaria = obterQuantidadeIngrediente(nome);

      if (!chaveMaterial) {
        // Remove a quantidade necessária do item base
        let removidos = 0;
        novoInventario = novoInventario.filter((item) => {
          if (item.nome === nome && removidos < quantidadeNecessaria) {
            removidos++;
            return false;
          }
          return true;
        });
      }
    });

    // Cria o novo item
    const itemCriado = isMunicaoEspecialItem(receita)
      ? montarMunicaoEspecial(receita)
      : {
          ...receita,
          detalhes: receita.efeito || receita.dano || receita.tipo || "Item",
          criado: true,
        };

    novoInventario.push(itemCriado);

    setPersonagem((prev) => ({
      ...prev,
      materiaisCriacao: materiaisAtualizados,
      inventario: novoInventario,
    }));

    setMensagemCraft(`${receita.nome} criado com sucesso.`);
    setTimeout(() => setMensagemCraft(""), 3000);
  };

  const gruposCriacaoFiltrados = receitasCriacaoAtuais.filter((grupo) => {
    if (abaCriacao === "armas") {
      return grupo.categoria === "Armas AprimorÃ¡veis";
    }

    if (abaCriacao === "improvisados") {
      return grupo.categoria === "Itens Improvisados";
    }

    if (abaCriacao === "municoes") {
      return grupo.categoria === "MuniÃ§Ãµes Fabricadas";
    }

    return false;
  });

  const receitasDaBancada = (
    abaCriacao === "melhorias" ? [] : receitasCriacaoAtuais
  ).flatMap((grupo) => grupo.itens);

  const receitaAtiva = receitaSelecionada || receitasDaBancada[0] || null;

  const armasAprimoraveis = (personagem.inventario || [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const texto = `${item.nome || ""} ${item.tipo || ""} ${
        item.categoria || ""
      }`;

      return (
        item.armaStatus || /arma|pistola|rifle|fuzil|escopeta|arco/i.test(texto)
      );
    });

  const armaUpgradeAtiva =
    armasAprimoraveis.find(({ index }) => index === armaUpgradeIndex) ||
    armasAprimoraveis[0] ||
    null;

  const [armaUpgradeTipo, setArmaUpgradeTipo] = useState("dano");

  const tiposUpgrade = [
    {
      chave: "dano",
      nome: "Dano",
      icone: "⚔️",
      descricao: "Aumenta o dano base da arma",
      max: 5,
      materiais: { cano: 3, fita: 3 },
    },
    {
      chave: "critico",
      nome: "Crítico",
      icone: "💥",
      descricao: "Reduz a dificuldade de crítico (menos dados necessários)",
      max: 3,
      materiais: { laminas: 3, fita: 3 },
    },
    {
      chave: "precisao",
      nome: "Precisão",
      icone: "🎯",
      descricao:
        "Aumenta o bônus de ataque com Percepção e fortalece alcance/control",
      max: 3,
      materiais: { fita: 3, alcool: 3 },
    },
    {
      chave: "controle",
      nome: "Controle",
      icone: "🎚️",
      descricao: "Melhora o controle de recuo e a estabilidade do disparo",
      max: 3,
      materiais: { cano: 3, laminas: 3 },
    },
    {
      chave: "velocidade",
      nome: "Velocidade",
      icone: "💨",
      descricao: "Aumenta a capacidade de atingir mais alvos em uma mesma ação",
      max: 3,
      materiais: { fita: 1, explosivos: 1 },
    },
    {
      chave: "alcance",
      nome: "Alcance",
      icone: "📏",
      descricao:
        "Estende o alcance efetivo da arma e reforça ataques de precisão",
      max: 3,
      materiais: { cano: 1, fita: 1 },
    },
  ];

  const obterCustoUpgrade = (tipoChave) => {
    const tipo = tiposUpgrade.find((t) => t.chave === tipoChave);
    return tipo?.materiais || { cano: 1, fita: 1 };
  };

  const verificarMateriaisUpgrade = (tipoChave) => {
    const custo = obterCustoUpgrade(tipoChave);
    const materiais = personagem.materiaisCriacao || {};
    return Object.entries(custo).every(
      ([mat, qtd]) => (materiais[mat] || 0) >= qtd,
    );
  };

  const reduzirCritico = (criticoTexto) => {
    const texto = String(criticoTexto || "").trim();

    // Se for apenas um número (ex: "20")
    if (/^\d+$/.test(texto)) {
      const num = Math.max(1, parseInt(texto, 10) - 1);
      return String(num);
    }

    // Se for "NxM" (ex: "3x6")
    const match = texto.match(/(\d+)x(\d+)/i);
    if (match) {
      let quantidade = Math.max(1, parseInt(match[1], 10) - 1);
      const faces = match[2];
      return `${quantidade}x${faces}`;
    }

    // Se não reconhecer, retorna o texto original
    return texto;
  };

  const incrementarPrecisao = (precisionTexto) => {
    const texto = String(precisionTexto || "").trim();
    const bonusMatch = texto.match(/([+-]\d+)/);
    if (bonusMatch) {
      const valorAtual = parseInt(bonusMatch[1], 10);
      return texto.replace(/([+-]\d+)/, `${valorAtual + 1}`);
    }

    if (texto.includes("distância")) {
      return texto.includes("|") ? `${texto} +1` : `${texto} | +1`;
    }

    if (texto.includes("|")) {
      const [prefixo, sufixo] = texto.split("|").map((parte) => parte.trim());
      return `${prefixo} | +1 ${sufixo}`;
    }

    return `Percepção | +1`;
  };

  const aumentarAlcance = (precisionTexto) => {
    const texto = String(precisionTexto || "").trim();
    const niveis = ["curta", "média", "distante", "longa"];
    const match = texto.match(/distância\s*(curta|média|distante|longa)/i);

    if (match) {
      const atual = match[1].toLowerCase();
      const indice = niveis.indexOf(atual);
      if (indice >= 0 && indice < niveis.length - 1) {
        return texto.replace(
          new RegExp(`distância\\s*${atual}`, "i"),
          `distância ${niveis[indice + 1]}`,
        );
      }
      if (texto.includes("|")) {
        return `${texto} +1`;
      }
      return `${texto} | +1`;
    }

    if (texto.includes("|")) {
      const [prefixo, sufixo] = texto.split("|").map((parte) => parte.trim());
      return `${prefixo} | +1 ${sufixo}`;
    }

    return `${texto || "Percepção"} | +1`;
  };

  const incrementarControle = (controlTexto) => {
    const texto = String(controlTexto || "").trim();
    const bonusMatch = texto.match(/([+-]\d+)/);
    if (bonusMatch) {
      const valorAtual = parseInt(bonusMatch[1], 10);
      return texto.replace(/([+-]\d+)/, `${valorAtual + 1}`);
    }
    if (texto.includes("|")) {
      return `${texto} +1`;
    }
    return `${texto || "Persistência"} | +1`;
  };

  const incrementarMobilidade = (mobilityTexto) => {
    const texto = String(mobilityTexto || "").trim();

    // Descobre o número atual, usando o mesmo parser da regra de combate.
    // Isso evita divergências entre "Velocidade" (escrita) e "Firmeza" (leitura).
    const numeroAtual = obterQuantidadeAlvosFirmeza(texto);

    const proximoNumero = Math.max(1, numeroAtual + 1);

    // Mantém o prefixo original antes de '|', se existir.
    // Se não houver separador, tenta preservar o primeiro trecho textual.
    let prefixo = "Firmeza";
    if (texto.includes("|")) {
      prefixo = texto.split("|")[0].trim() || "Firmeza";
    } else if (texto) {
      // remove a parte numérica pra ficar só o rótulo textual
      prefixo = texto.replace(/\d+[\s\w\-]*/g, "").trim() || "Firmeza";
    }

    return `${prefixo} | ${proximoNumero} alvos`;
  };

  const melhorarArmaSelecionada = () => {
    if (!armaUpgradeAtiva) {
      setMensagemCraft("Selecione uma arma para melhorar.");
      setTimeout(() => setMensagemCraft(""), 3000);
      return;
    }

    const tipoInfo = tiposUpgrade.find((t) => t.chave === armaUpgradeTipo);
    if (!tipoInfo) {
      setMensagemCraft("Tipo de melhoria inválido.");
      setTimeout(() => setMensagemCraft(""), 3000);
      return;
    }

    if (!verificarMateriaisUpgrade(armaUpgradeTipo)) {
      setMensagemCraft(`Materiais insuficientes para ${tipoInfo.nome}.`);
      setTimeout(() => setMensagemCraft(""), 3000);
      return;
    }

    setPersonagem((prev) => {
      const inventario = [...(prev.inventario || [])];
      const arma = inventario[armaUpgradeAtiva.index];

      if (!arma) return prev;

      const melhoriaAtual = arma.melhoriaArma || {};
      const nivelAtual = parseInt(melhoriaAtual.nivel, 10) || 0;
      const valorAtual = parseInt(melhoriaAtual[armaUpgradeTipo], 10) || 0;

      if (valorAtual >= tipoInfo.max) {
        setMensagemCraft(`${tipoInfo.nome} já está no nível máximo!`);
        setTimeout(() => setMensagemCraft(""), 3000);
        return prev;
      }

      const custo = obterCustoUpgrade(armaUpgradeTipo);

      // Aplica as melhorias nos stats reais da arma (armaStatus)
      const armaStatus = arma.armaStatus ? { ...arma.armaStatus } : null;
      if (armaStatus) {
        switch (armaUpgradeTipo) {
          case "dano": {
            // Aumenta o dano: incrementa a quantidade de dados (ex: 2d6 -> 3d6)
            const danoAtual = interpretarDano(armaStatus.dmg);
            if (danoAtual) {
              const novaQtd = Math.min(danoAtual.quantidade + 1, 12);
              armaStatus.dmg = `${novaQtd}d${danoAtual.faces}${danoAtual.bonus ? `${danoAtual.bonus > 0 ? "+" : ""}${danoAtual.bonus}` : ""}`;
            }
            break;
          }
          case "critico": {
            // ROF: diminui o valor em 1 a cada melhoria (ex: 20 -> 19 -> 18...)
            const rofAtual = parseInt(armaStatus.rof, 10) || 20;
            const novoRof = Math.max(1, rofAtual - 1); // mínimo 1
            armaStatus.rof = novoRof;
            break;
          }
          case "precisao": {
            armaStatus.precision = incrementarPrecisao(armaStatus.precision);
            break;
          }
          case "controle": {
            armaStatus.control = incrementarControle(armaStatus.control);
            break;
          }
          case "velocidade": {
            armaStatus.mobility = incrementarMobilidade(armaStatus.mobility);
            break;
          }
          case "alcance": {
            // Não permitir que modificadores de Alcance sejam incluídos no texto do campo Precision.
            // AUI: continuar aumentando apenas o alcance efetivo no combate,
            // mas manter o rótulo Precision como “estável”.
            // Caso o seu sistema dependa do texto em precision, ajuste aqui depois.
            armaStatus.precision = String(armaStatus.precision || "");
            break;
          }
        }
      }

      inventario[armaUpgradeAtiva.index] = {
        ...arma,
        ...(armaStatus ? { armaStatus } : {}),
        melhoriaArma: {
          ...melhoriaAtual,
          nivel: nivelAtual + 1,
          [armaUpgradeTipo]: valorAtual + 1,
        },
      };

      const novosMateriais = { ...prev.materiaisCriacao };
      Object.entries(custo).forEach(([mat, qtd]) => {
        novosMateriais[mat] = Math.max(0, (novosMateriais[mat] || 0) - qtd);
      });

      return {
        ...prev,
        materiaisCriacao: novosMateriais,
        inventario,
      };
    });

    setMensagemCraft(
      `${armaUpgradeAtiva.item.nome} — ${tipoInfo.nome} melhorado!`,
    );
    setTimeout(() => setMensagemCraft(""), 3000);
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

    const valorTemporario = personagem.habilidadesTemporarias?.[chave] || 0;

    const bonusAtivo =
      (personagem.habilidadesCombate?.[chave] || 0) +
      bonusAtributo +
      valorTemporario;

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
        modificadorDados: modificadorDadosRolagem,
      });

      setRolandoDados(true);

      const rolagem = {
        tipo: "teste",
        titulo: `${nomesAtributos[atributoBase]} | ${nome}`,
        modo: "Teste de Ativo",
        formula: `${resultado.quantidadeDados}d${resultado.faces} + ${resultado.bonusAtivo}`,
        dados: resultado.rolagens,
        faces: resultado.faces,
        maiorResultado: resultado.maiorResultado,
        quantidadeBase: resultado.quantidadeBase,
        finais: resultado.finais,
        resultadosExtras: resultado.resultadosExtras,
        bonusFinais: resultado.bonusFinais,
        modificadorDados: resultado.modificadorDados,
        bonusAtivo: resultado.bonusAtivo,
        bonusPassiva: 0,
        total: resultado.total,
        dano: null,
        dadosDetalhados: null,
      };

      setModalRolagem(rolagem);
      registrarRolagemMestre(rolagem);

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
    const chaveAtivo = ativosParaPassiva[chave];
    const nomeAtivo = dadosAtivos[chaveAtivo]?.nome || "Ativo";
    return (
      <div className="habilidade-passiva-item">
        <button
          type="button"
          className="passiva-rolar-btn"
          onClick={() => rolarPassiva(nome, chave)}
          title="Rolar passiva"
        >
          <Icon path={mdiDiceD20} size={0.75} />
        </button>

        <div className="passiva-identidade">
          <span className="passiva-ativo-vinculado">{nomeAtivo}</span>

          <span
            className="passiva-nome clickable"
            onClick={() => abrirModal(nome, chave)}
            title="Clique para ver descrição"
          >
            {nome}
          </span>
        </div>

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

  const ativosParaPassiva = {
    enganacao: "carisma",
    raciocinioLogico: "razao",
    investigacao: "razao",
    instinto: "intuicao",
    sensibilidade: "persistencia",
    coragem: "persistencia",

    diplomacia: "carisma",
    disciplina: "razao",
    autocontrole: "persistencia",
    intimidacaoPassiva: "violencia",
    presenca: "carisma",
    memoria: "razao",
    empatia: "intuicao",
    lealdade: "persistencia",
    fe: "persistencia",

    vitalidade: "resistencia",
    folego: "resistencia",
    equilibrio: "firmeza",
    velocidade: "firmeza",
    precisao: "percepcao",
    lutar: "violencia",
    resistenciaFisica: "resistencia",
    primeirosSocorros: "razao",

    conhecimentoMedico: "razao",
    conhecimentoTecnico: "razao",
    conhecimentoHistorico: "razao",
    conhecimentoOculto: "razao",
    tecnologia: "razao",
    tatica: "razao",

    percepcaoAuditiva: "percepcao",
    percepcaoVisual: "percepcao",
    percepcaoOlfativa: "percepcao",

    crime: "firmeza",
    manipulacao: "carisma",
    intimidacao: "violencia",
    seducao: "carisma",
    resistenciaMental: "persistencia",

    furtividade: "firmeza",
    instintoSobrevivencia: "intuicao",
  };

  const dadosAtivos = {
    razao: {
      nome: "Razão",
      atributo: "inteligencia",
    },

    intuicao: {
      nome: "Intuição",
      atributo: "inteligencia",
    },

    percepcao: {
      nome: "Percepção",
      atributo: "vontade",
    },

    firmeza: {
      nome: "Firmeza",
      atributo: "reflexos",
    },

    violencia: {
      nome: "Violência",
      atributo: "forca",
    },

    carisma: {
      nome: "Carisma",
      atributo: "vontade",
    },

    persistencia: {
      nome: "Persistência",
      atributo: "vontade",
    },

    resistencia: {
      nome: "Resistência",
      atributo: "fontitude",
    },
  };

  const obterValorAtivoSelecionado = () => {
    const ativo = ativosParaPassiva[ativoPassivaSelecionado];

    if (!ativo) return 0;

    const valorAtributo = personagem.atributos?.[ativo.atributo] || 0;
    const bonusAtributo = calcularModificadorAtivo(valorAtributo);
    const bonusAtivo =
      personagem.habilidadesCombate?.[ativoPassivaSelecionado] || 0;

    return bonusAtributo + bonusAtivo;
  };

  const rolarPassiva = (nome, chave) => {
    const valorPassiva = obterBonusPassiva(chave);

    const chaveAtivo = ativosParaPassiva[chave];
    const ativoInfo = dadosAtivos[chaveAtivo];

    const valorAtributo = personagem.atributos?.[ativoInfo?.atributo] || 0;

    const bonusAtributo = calcularModificadorAtivo(valorAtributo);

    const bonusAtivo =
      (personagem.habilidadesCombate?.[chaveAtivo] || 0) + bonusAtributo;

    const teste = rolarTeste({
      atributo: valorAtributo,
      ativo: bonusAtivo,
      passiva: valorPassiva,
      modificadorDados: modificadorDadosRolagem,
    });

    setRolandoDados(true);

    const rolagem = {
      tipo: "teste",
      titulo: `${ativoInfo?.nome || "Ativo"} + ${nome}`,
      modo: "Teste de Passiva",
      formula: `${teste.quantidadeDados}d${teste.faces} + ${teste.bonusAtivo} + ${teste.bonusPassiva}`,
      dados: teste.rolagens,
      dadosDetalhados: null,
      faces: teste.faces,
      maiorResultado: teste.maiorResultado,
      bonusAtivo: teste.bonusAtivo,
      bonusPassiva: teste.bonusPassiva,
      finais: teste.finais,
      resultadosExtras: teste.resultadosExtras,
      bonusFinais: teste.bonusFinais,
      total: teste.total,
      dano: null,
    };

    setModalRolagem(rolagem);
    registrarRolagemMestre(rolagem);

    setTimeout(() => {
      setRolandoDados(false);
    }, 1200);
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

  // “Poderes Absolutos” devem ser exibidos dentro da aba RITUAIS.
  // Mapeia as habilidades absolutas para uma estrutura semelhante à dos ritos.
  const poderesAbsolutos = habilidadesAbsolutas.map((habilidade, index) => ({
    id: habilidade.id || `${habilidade.nome}-${index}`,
    nome: habilidade.nome,
    custo: habilidade.custo,
    grupo: "poderes-absolutos",
    nivelRito: habilidade.nivel || "Iniciante", // ou "Absoluto", se preferir
    icone: habilidade.icone || "✦",
    // --- Campos que serão exibidos (mapeie todos os que existirem) ---
    acao: habilidade.acao,
    alvo: habilidade.alvo,
    duracao: habilidade.duracao,
    distancia: habilidade.distancia,
    requisitos: habilidade.requisitos,
    efeito: habilidade.efeito,
    descricao: habilidade.descricao,
    absolutismo: habilidade.absolutismo || habilidade.descricao,
    isPoder: true, // marcador para o visualizador
  }));

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

  // Cria uma nova habilidade e adiciona ao array 'marcas'
  const venderHabilidadeCriada = (habilidade) => {
    const custo = Math.max(0, parseInt(habilidade.custo, 10) || 0);
    const nomeRecurso = habilidade.recurso === "evolucao"
      ? "Pontos de Evolução"
      : habilidade.recurso === "esperanca" ? "Esperança" : "Sanidade";

    if (!window.confirm(`Vender "${habilidade.nome}" e recuperar ${custo} de ${nomeRecurso}?`)) return;

    setPersonagem((atual) => {
      const atualizado = {
        ...atual,
        habilidadesCriadas: (atual.habilidadesCriadas || []).filter(
          (item) => item.id !== habilidade.id,
        ),
      };
      if (habilidade.tipo === "rito") {
        atualizado.rituais = (atual.rituais || []).filter(
          (item) => item.id !== habilidade.id,
        );
      }
      if (habilidade.tipo === "poderAbsoluto") {
        atualizado.poderesAbsolutos = (atual.poderesAbsolutos || []).filter(
          (item) => item.id !== habilidade.id,
        );
      }
      if (habilidade.recurso === "evolucao") {
        atualizado.pontosEvolucao = {
          ...(atualizado.pontosEvolucao || {}),
          disponiveis: (parseInt(atualizado.pontosEvolucao?.disponiveis, 10) || 0) + custo,
        };
      } else if (habilidade.recurso === "esperanca" || habilidade.recurso === "sanidade") {
        const recurso = habilidade.recurso;
        const novoMaximo = (parseInt(atualizado[recurso]?.max, 10) || 0) + custo;
        atualizado[recurso] = {
          ...(atualizado[recurso] || {}),
          max: novoMaximo,
          atual: Math.min(
            novoMaximo,
            Math.max(
              parseInt(atualizado[recurso]?.atual, 10) || 0,
              parseInt(habilidade.recursoAtualAntes, 10) || 0,
            ),
          ),
        };
      }
      return atualizado;
    });
  };

  const aceitarMarca = () => {
    if (!marcaSelecionada) return;

    // Pega apenas a habilidade escolhida (se houver)
    let habilidadesEscolhidas = [];
    if (
      habilidadeEscolhidaIndex !== null &&
      marcaSelecionada.habilidades?.length > 0
    ) {
      const habilidadeEscolhida =
        marcaSelecionada.habilidades[habilidadeEscolhidaIndex];
      habilidadesEscolhidas = [habilidadeEscolhida];
    }

    // Atualiza a marca: aceita e com apenas as habilidades escolhidas
    const marcaAtualizada = {
      ...marcaSelecionada,
      aceita: true,
      habilidades: habilidadesEscolhidas, // substitui a lista original
    };

    // Substitui a marca pendente pela aceita no array do personagem
    const marcasAtualizadas = (personagem.marcas || []).map((m) =>
      m.id === marcaSelecionada.id ? marcaAtualizada : m,
    );

    const personagemAtualizado = {
      ...personagem,
      marcas: marcasAtualizadas,
      // Remove o campo habilidadesMarcas se não for usado em outro lugar
      // habilidadesMarcas: [], // opcional: limpar para evitar duplicidade
    };

    setPersonagem(personagemAtualizado);
    setMarcaModalAberto(false);
    setMarcaSelecionada(null);
    setHabilidadeEscolhidaIndex(null);
  };

  const bonusDefesa = parseInt(personagem.bonusDefesa, 10) || 0;
  const defesaBaseNatural =
    10 + calcularModificadorAtivo(personagem.atributos?.reflexos || 0);
  const defesaBase = defesaBaseNatural + bonusDefesa;

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

  const rolarFormulaPersonalizada = () => {
    const formula = formulaDadoPersonalizado.replace(/\s/g, "");

    if (!formula.trim()) {
      setErroRolagemPersonalizada("Digite uma fórmula.");
      return;
    }

    const partes = formula.match(/[+-]?[^+-]+/g) || [];

    let total = 0;
    const dados = [];

    for (const parte of partes) {
      const sinal = parte.startsWith("-") ? -1 : 1;
      const texto = parte.replace(/^[+-]/, "");

      const dadoMatch = texto.match(/^(\d*)d(\d+)$/i);

      if (dadoMatch) {
        const quantidade = parseInt(dadoMatch[1] || "1", 10);
        const faces = parseInt(dadoMatch[2], 10);

        if (quantidade <= 0 || faces <= 0) {
          setErroRolagemPersonalizada("Fórmula inválida.");
          return;
        }

        for (let i = 0; i < quantidade; i++) {
          const valorOriginal = rolarDado(faces);
          const valor = valorOriginal * sinal;

          dados.push({
            valor,
            valorOriginal,
            faces,
            sinal,
            origem: `${sinal < 0 ? "-" : ""}d${faces}`,
          });

          total += valor;
        }

        continue;
      }

      const numero = parseInt(texto, 10);

      if (!Number.isNaN(numero)) {
        total += numero * sinal;
        continue;
      }

      setErroRolagemPersonalizada("Use fórmulas como 3d20+5d100-2.");
      return;
    }

    const dadosPositivos = dados.filter((dado) => dado.sinal > 0);

    const finais = dadosPositivos.filter(
      (dado) => dado.valorOriginal === dado.faces,
    ).length;

    const valoresOrdenados = dadosPositivos
      .map((dado) => dado.valorOriginal)
      .sort((a, b) => b - a);

    const resultadosExtras = valoresOrdenados.slice(1, 1 + finais);

    const bonusFinais = resultadosExtras.reduce(
      (soma, valor) => soma + valor,
      0,
    );

    total += bonusFinais;

    setErroRolagemPersonalizada("");
    setRolandoDados(true);

    const rolagem = {
      tipo: "teste",
      titulo: "Rolagem Personalizada",
      modo: formulaDadoPersonalizado,
      formula: formulaDadoPersonalizado,

      dados: dados.map((dado) => dado.valor),

      dadosDetalhados: dados.map((dado) => ({
        valor: dado.valor,
        faces: dado.faces,
      })),

      faces: 20,

      maiorResultado: dados.length
        ? Math.max(...dados.map((dado) => dado.valor))
        : total,

      bonusAtivo: 0,
      bonusPassiva: 0,
      finais,
      resultadosExtras,
      bonusFinais,
      total,
      dano: null,
    };

    setModalRolagem(rolagem);
    registrarRolagemMestre(rolagem);

    setTimeout(() => {
      setRolandoDados(false);
    }, 1200);
  };

  // Conteúdo das abas
  const conteudoAbas = {
    combate: (
      <div className="conteudo-aba">
        <h4>ATIVOS</h4>
        <div className="controle-dados-pre-rolagem">
          <button
            type="button"
            onClick={() =>
              setModificadorDadosRolagem((prev) => Math.max(-4, prev - 1))
            }
          >
            -1D
          </button>

          <span>
            Dados da rolagem: {modificadorDadosRolagem >= 0 ? "+" : ""}
            {modificadorDadosRolagem}
          </span>

          <button
            type="button"
            onClick={() => setModificadorDadosRolagem((prev) => prev + 1)}
          >
            +1D
          </button>

          <button type="button" onClick={() => setModificadorDadosRolagem(0)}>
            Reset
          </button>
        </div>

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
                    <input inputMode="numeric" value={defesaBase} readOnly />
                  </div>
                </div>

                <div className="defesa-info">
                  <label className="defesa-bonus-inline">
                    <span>{bonusDefesa >= 0 ? "+" : "-"}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={Math.abs(personagem.bonusDefesa ?? 0)}
                      onChange={(e) =>
                        setPersonagem((prev) => ({
                          ...prev,
                          bonusDefesa:
                            (bonusDefesa >= 0 ? 1 : -1) *
                            (parseInt(e.target.value, 10) || 0),
                        }))
                      }
                    />
                  </label>
                  <div className="defesa-formula">
                    Base {defesaBaseNatural} + bonus
                  </div>
                </div>
              </div>

              <div className="defesa-valores">
                <label>
                  <span>BLOQUEIO</span>
                  <input type="text" value={bloqueio} readOnly />
                </label>

                <label>
                  <span>ESQUIVA</span>
                  <input type="text" value={esquiva} readOnly />
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

           
          </aside>
        </div>
      </div>
    ),

    passivas: (
      <div className="conteudo-aba passiva-aba">
        <div className="controle-dados-pre-rolagem">
          <button
            type="button"
            onClick={() =>
              setModificadorDadosRolagem((prev) => Math.max(-4, prev - 1))
            }
          >
            -1D
          </button>

          <span>
            Dados da rolagem: {modificadorDadosRolagem >= 0 ? "+" : ""}
            {modificadorDadosRolagem}
          </span>

          <button
            type="button"
            onClick={() => setModificadorDadosRolagem((prev) => prev + 1)}
          >
            +1D
          </button>

          <button type="button" onClick={() => setModificadorDadosRolagem(0)}>
            Reset
          </button>
        </div>
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
            <button
              className={subAbaHabilidade === "marcas" ? "ativa" : ""}
              onClick={() => setSubAbaHabilidade("marcas")}
            >
              Habilidades Criadas
            </button>

            {/* Subabas dinâmicas para marcas aceitas */}
            {personagem.marcas &&
              personagem.marcas
                .filter((m) => m.aceita)
                .map((marca, index) => {
                  const chave = `marca-${marca.id || index}`;
                  return (
                    <button
                      key={chave}
                      className={subAbaHabilidade === chave ? "ativa" : ""}
                      onClick={() => {
                        setSubAbaHabilidade(chave);
                        setSubAbaMarcaSelecionada(marca);
                      }}
                    >
                      {marca.nome}
                    </button>
                  );
                })}
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
          {subAbaHabilidade === "marcas" && (
            <section className="habilidades-criadas-section">
              <div className="lista-habilidades-criadas-bloco">
                <h5>Habilidades criadas</h5>
                <p className="habilidades-criadas-ajuda">Crie novas habilidades na página de Upgrade. Ao vender uma habilidade, você recupera o valor investido.</p>
                <div className="habilidades-criadas-grid">
                  {(personagem.habilidadesCriadas || []).length > 0 ? (
                    personagem.habilidadesCriadas.map((habilidade) => (
                      <div key={habilidade.id} className={`habilidade-criada-card ${habilidade.status || "pendente"}`}>
                        <div className="habilidade-criada-info">
                          <strong>{habilidade.nome}</strong>
                          <span className="custo-badge">{habilidade.tipo === "rito" ? "Rito" : habilidade.tipo === "poderAbsoluto" ? "Poder Absoluto" : "Habilidade"} · {habilidade.custo} {habilidade.recurso === "evolucao" ? "Pontos de Evolução" : habilidade.recurso}</span>
                          <span className="status-habilidade-criada">{habilidade.status || "pendente"}</span>
                          <p>{habilidade.descricao || "Sem descrição."}</p>
                        </div>
                        <button className="btn-vender-habilidade" onClick={() => venderHabilidadeCriada(habilidade)}>Vender</button>
                      </div>
                    ))
                  ) : <p className="sem-habilidades">Nenhuma habilidade criada ainda.</p>}
                </div>
              </div>
            </section>
          )}

          {subAbaHabilidade.startsWith("marca-") && subAbaMarcaSelecionada && (
            <section className="marca-detalhes-section">
              <div className="marca-detalhes-card">
                <div className="marca-detalhes-header">
                  <span>MARCA</span>
                  <h2>{subAbaMarcaSelecionada.nome}</h2>
                </div>

                <div className="marca-detalhes-descricao">
                  <p>{subAbaMarcaSelecionada.descricao || "Sem descrição."}</p>
                </div>

                <div className="marca-detalhes-grid">
                  <div className="marca-detalhes-beneficios">
                    <h4>✦ Benefícios</h4>
                    <p>
                      {subAbaMarcaSelecionada.beneficios ||
                        "Nenhum benefício listado."}
                    </p>
                  </div>

                  <div className="marca-detalhes-penalidades">
                    <h4>✧ Penalidades</h4>
                    <p>
                      {subAbaMarcaSelecionada.penalidades ||
                        "Nenhuma penalidade listada."}
                    </p>
                  </div>
                </div>

                {subAbaMarcaSelecionada.habilidades?.length > 0 && (
                  <div className="marca-detalhes-habilidades">
                    <h4>⚡ Habilidades Adquiridas</h4>
                    <div className="marca-habilidades-lista-detalhes">
                      {subAbaMarcaSelecionada.habilidades.map((hab, idx) => (
                        <div key={idx} className="marca-habilidade-item">
                          <strong>{hab.nome}</strong>
                          <p>{hab.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      </div>
    ),

    rituais: (
      <div className="conteudo-aba rituais-aba">
        <div className="rituais-topo">
          <span>Biblioteca do Absoluto</span>
          <h4>RITOS CONHECIDOS</h4>
        </div>

        <div className="rituais-subabas">
          <button
            type="button"
            className={subAbaRituais === "rituais" ? "ativa" : ""}
            onClick={() => {
              setSubAbaRituais("rituais");
              setRitoVisualizado(null);
            }}
          >
            Ritos
          </button>
           <button
            type="button"
            className={subAbaRituais === "absolutos" ? "ativa" : ""}
            onClick={() => {
              setSubAbaRituais("absolutos");
              setRitoVisualizado(null);
            }}
          >
            Poderes Absolutos
          </button>
        </div>

        <div className="lista-rituais rituais-cards">
          {subAbaRituais === "absolutos"
            ? // ============================================================
              //  PODERES ABSOLUTOS (lidos do campo poderesAbsolutos)
              // ============================================================
              (() => {
                const poderes = personagem.poderesAbsolutos || [];
                if (poderes.length === 0) {
                  return (
                    <div className="rituais-vazio">
                      Nenhum poder absoluto adquirido.
                    </div>
                  );
                }
                return poderes.map((poder, index) => (
                  <article
                    key={`poder-${index}`}
                    className="ritual-card poder-absoluto"
                    onClick={() => {
                      // Para depuração, veja o que está no objeto poder
                      console.log("Poder selecionado:", poder);
                      setRitoVisualizado({
                        ...poder,
                        index,
                        isPoder: true,
                      });
                    }}
                  >
                    <div className="ritual-card-icone">
                      {poder.icone || "✦"}
                    </div>

                    <div className="ritual-card-info">
                      <strong>{poder.nome}</strong>
                      <small>{poder.custo || "Absoluto"}</small>
                    </div>
                  </article>
                ));
              })()
            : // ============================================================
              //  RITUAIS NORMAIS (da lista personagem.rituais)
              // ============================================================
              (() => {
                const rituaisNormais = (personagem.rituais || []).filter(
                  (r) =>
                    !String(r.grupo || r.tipo || "")
                      .toLowerCase()
                      .includes("absoluto") &&
                    !String(r.nome || "")
                      .toLowerCase()
                      .includes("absolutismo"),
                );
                if (rituaisNormais.length === 0) {
                  return (
                    <div className="rituais-vazio">
                      Nenhum ritual conhecido.
                    </div>
                  );
                }
                return rituaisNormais.map((ritual, index) => {
                  const originalIndex = (personagem.rituais || []).indexOf(
                    ritual,
                  );
                  return (
                    <article
                      key={originalIndex}
                      className={`ritual-card ${
                        ritosAtivos.includes(obterRitoId(ritual, originalIndex))
                          ? "ativo"
                          : ""
                      } nivel-${ritual.nivelRito || ritual.nivel || "iniciante"}`}
                      onClick={() =>
                        setRitoVisualizado({ ...ritual, index: originalIndex })
                      }
                    >
                      <div className="ritual-card-icone">
                        {ritual.icone || "☉"}
                      </div>

                      <div className="ritual-card-info">
                        <strong>{ritual.nome}</strong>
                        <small>
                          {ritual.nivelRito || ritual.nivel
                            ? `Nível ${ritual.nivelRito || ritual.nivel}`
                            : "Ritual Obscuro"}
                        </small>
                      </div>

                      <button
                        className="btn-ativar-rito"
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarRitoAtivo(ritual, originalIndex);
                        }}
                      >
                        {ritosAtivos.includes(
                          obterRitoId(ritual, originalIndex),
                        )
                          ? "Desativar"
                          : "Ativar"}
                      </button>
                    </article>
                  );
                });
              })()}
        </div>

        {/* ============================================================
        VISUALIZADOR (funciona para poderes e rituais)
        ============================================================ */}
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
                  {ritoVisualizado.icone ||
                    (ritoVisualizado.isPoder ? "✦" : "☉")}
                </div>

                <div className="rito-visualizer-info-topo">
                  <span>
                    {ritoVisualizado.isPoder
                      ? "Poder Absoluto"
                      : ritoVisualizado.nivelRito || ritoVisualizado.nivel
                        ? `Nível ${ritoVisualizado.nivelRito || ritoVisualizado.nivel}`
                        : "Ritual Obscuro"}
                  </span>

                  <h2>{ritoVisualizado.nome}</h2>
                </div>

                <button
                  className="rito-visualizer-fechar"
                  onClick={() => setRitoVisualizado(null)}
                >
                  ×
                </button>
              </div>

              <div className="rito-visualizer-grid">
                {ritoVisualizado.isPoder ? (
                  // ---- PODER ABSOLUTO ----
                  <>
                    {/* Ação */}
                    {ritoVisualizado.acao && (
                      <div className="rito-visualizer-bloco">
                        <span>Ação</span>
                        <p>{ritoVisualizado.acao}</p>
                      </div>
                    )}

                    {/* Alvo */}
                    {ritoVisualizado.alvo && (
                      <div className="rito-visualizer-bloco">
                        <span>Alvo</span>
                        <p>{ritoVisualizado.alvo}</p>
                      </div>
                    )}

                    {/* Duração */}
                    {ritoVisualizado.duracao && (
                      <div className="rito-visualizer-bloco">
                        <span>Duração</span>
                        <p>{ritoVisualizado.duracao}</p>
                      </div>
                    )}

                    {/* Distância */}
                    {ritoVisualizado.distancia && (
                      <div className="rito-visualizer-bloco">
                        <span>Distância</span>
                        <p>{ritoVisualizado.distancia}</p>
                      </div>
                    )}

                    {/* Requisitos */}
                    {ritoVisualizado.requisitos && (
                      <div className="rito-visualizer-bloco">
                        <span>Requisitos</span>
                        <p>{ritoVisualizado.requisitos}</p>
                      </div>
                    )}

                    {/* Efeito */}
                    {ritoVisualizado.efeito && (
                      <div className="rito-visualizer-bloco">
                        <span>Efeito</span>
                        <p>{ritoVisualizado.efeito}</p>
                      </div>
                    )}

                    {/* Descrição (usada apenas se não houver efeito, para evitar duplicação) */}
                    {ritoVisualizado.descricao && !ritoVisualizado.efeito && (
                      <div className="rito-visualizer-bloco">
                        <span>Descrição</span>
                        <p>{ritoVisualizado.descricao}</p>
                      </div>
                    )}

                    {/* Absolutismo (campo extra, comum em poderes e alguns rituais) */}
                    {ritoVisualizado.absolutismo && (
                      <div className="rito-visualizer-bloco">
                        <span>
                          {ritoVisualizado.isPoder
                            ? "Absolutismo"
                            : "Descrição"}
                        </span>
                        <p>{ritoVisualizado.absolutismo}</p>
                      </div>
                    )}
                  </>
                ) : (
                  // ---- RITUAL NORMAL ----
                  <>
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
                  </>
                )}
              </div>

              <div className="rito-visualizer-acoes">
                {/* Botão de ativar/desativar só para rituais normais */}
                {!ritoVisualizado.isPoder && (
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
                )}
              </div>
            </div>
          </div>
        )}
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
          {(ehMedicoDeCampo || temMaletaDeCampo) && (
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
              {personagem.inventario
                .filter((item) => item.nome !== "Maleta de Campo") // oculta a maleta da lista comum
                .map((item, index) => (
                  <article
                    key={index}
                    className="item-inventario item-recolhivel inventario-card"
                    tabIndex={0}
                    aria-label={item.nome}
                    title={item.nome}
                    data-item-name={item.nome}
                    onClick={() => abrirVisualizador(item, index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setItemVisualizado({ ...item, index });
                      }
                    }}
                  >
                    <div className="inventario-resumo">
                      <div className="inventario-card-icone">
                        {renderizarIconeItem(item)}
                      </div>
                      <span className="inventario-item-nome">{item.nome}</span>
                    </div>
                  </article>
                ))}
            </div>

            {/* Visualizador de Item (Overlay) */}
            <div
              className={`item-visualizer-inline ${visualizadorAberto ? "aberto" : ""} ${visualizadorFechando ? "fechando" : ""}`}
            >
              {itemVisualizado && (
                <div className="item-visualizador">
                  {/* TOPO */}
                  <div className="item-visualizer-topo">
                    <div className="item-visualizer-icone">
                      {renderizarIconeItem(itemVisualizado)}
                    </div>
                    <div className="visualizer-info">
                      <span className="visualizer-categoria">
                        {itemVisualizado.tipo || "Item"}
                      </span>
                      <h2>{itemVisualizado.nome}</h2>
                    </div>
                    <button
                      className="item-visualizer-fechar"
                      onClick={fecharVisualizador}
                    >
                      ×
                    </button>
                  </div>

                  {/* INFORMAÇÕES GERAIS */}
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
                    {itemVisualizado.efeito && (
                      <p>
                        <strong>Efeito:</strong> {itemVisualizado.efeito}
                      </p>
                    )}
                  </div>

                  {/* STATUS DE ARMA */}
                  {itemVisualizado.armaStatus && (
                    <>
                      {itemVisualizado.armaStatus.tipo === "Corpo a Corpo" ? (
                        // --- LAYOUT CORPO A CORPO ---
                        <div className="item-visualizer-status corpo-a-corpo-status">
                          <span>
                            <strong>Tipo:</strong>{" "}
                            {itemVisualizado.armaStatus.tipo}
                          </span>
                          <span>
                            <strong>Dano Padrão:</strong>{" "}
                            {itemVisualizado.armaStatus.dmg}
                          </span>
                          <span>
                            <strong>Crítico:</strong>{" "}
                            {itemVisualizado.armaStatus.critico}
                          </span>
                          <span>
                            <strong>Dano Cabeça:</strong>{" "}
                            {itemVisualizado.armaStatus.danoCabeca}
                          </span>
                        </div>
                      ) : (
                        // --- LAYOUT ARMAS DE FOGO (completo) ---
                        <div className="item-visualizer-status">
                          <span
                            onClick={() => abrirDescricaoStatus("Tipo", "tipo")}
                          >
                            <strong>Tipo:</strong>{" "}
                            {itemVisualizado.armaStatus.tipo}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Dano Padrão", "dmg")
                            }
                          >
                            <strong>Dano Padrão:</strong>{" "}
                            {itemVisualizado.armaStatus.dmg}
                          </span>
                          <span
                            onClick={() => abrirDescricaoStatus("ROF", "rof")}
                          >
                            <strong>Critico ROF:</strong>{" "}
                            {itemVisualizado.armaStatus.rof}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Dano Cabeça", "danoCabeca")
                            }
                          >
                            <strong>Dano Cabeca:</strong>{" "}
                            {itemVisualizado.armaStatus.danoCabeca}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Hipfire", "hipfire")
                            }
                          >
                            <strong>Hipfire:</strong>{" "}
                            {itemVisualizado.armaStatus.hipfire}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Precision", "precision")
                            }
                          >
                            <strong>Precision:</strong>{" "}
                            {itemVisualizado.armaStatus.precision}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Control", "control")
                            }
                          >
                            <strong>Control:</strong>{" "}
                            {itemVisualizado.armaStatus.control}
                          </span>
                          <span
                            onClick={() =>
                              abrirDescricaoStatus("Mobility", "mobility")
                            }
                          >
                            <strong>Mobility:</strong>{" "}
                            {itemVisualizado.armaStatus.mobility}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* MODIFICAÇÕES APLICADAS - CARDS RECOLHÍVEIS */}
                  {itemVisualizado.modificacoesArma &&
                    itemVisualizado.modificacoesArma.length > 0 && (
                      <div className="modificacoes-aplicadas">
                        <span className="modificacoes-titulo">
                          Modificações Aplicadas
                        </span>
                        <div className="modificacoes-lista">
                          {itemVisualizado.modificacoesArma.map((mod, idx) => (
                            <details
                              key={idx}
                              className="modificacao-card-recolhivel"
                            >
                              <summary className="modificacao-summary">
                                <div className="modificacao-summary-info">
                                  <span className="modificacao-nome">
                                    {mod.nome}
                                  </span>
                                  {mod.subcategoria && (
                                    <span className="modificacao-subcategoria">
                                      {mod.subcategoria}
                                    </span>
                                  )}
                                </div>
                                <span className="modificacao-expandir-icon">
                                  ▼
                                </span>
                              </summary>
                              <div className="modificacao-detalhes">
                                <p>
                                  {mod.detalhe ||
                                    mod.descricao ||
                                    mod.efeito ||
                                    "Sem descrição."}
                                </p>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* CONTROLES PARA ARMAS DE FOGO */}
                  {itemVisualizado.armaStatus &&
                    itemVisualizado.armaStatus.tipo !== "Corpo a Corpo" && (
                      <div className="arma-fogo-controles">
                        <div className="modos-ataque">
                          <span>Modo de ataque</span>
                          <div className="modos-botoes">
                            {[
                              "normal",
                              "violencia",
                              "percepcao",
                              "persistencia",
                              "firmeza",
                            ].map((modo) => (
                              <button
                                key={modo}
                                className={`modo-btn ${
                                  modoAtaque === modo ? "selecionado" : ""
                                }`}
                                onClick={() => setModoAtaque(modo)}
                              >
                                {modo.charAt(0).toUpperCase() + modo.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bonus-dano-arma">
                          <span>Bônus de dano</span>
                          <input
                            value={itemVisualizado.bonusDanoArma || ""}
                            placeholder="+2, 1d6, 2d8+3..."
                            onChange={(event) =>
                              atualizarBonusDanoArma(
                                itemVisualizado.index,
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="ataque-critico">
                          <label>
                            <input
                              type="checkbox"
                              checked={criticoAtivo}
                              onChange={(e) =>
                                setCriticoAtivo(e.target.checked)
                              }
                            />
                            Crítico (
                            {extrairDadosCritico(
                              itemVisualizado.armaStatus.critico,
                            )}{" "}
                            dados extras)
                          </label>
                        </div>
                      </div>
                    )}

                  {/* MUNIÇÃO ESPECIAL (apenas para armas de fogo) */}
                  {itemVisualizado.armaStatus &&
                    itemVisualizado.armaStatus.tipo !== "Corpo a Corpo" && (
                      <div className="item-visualizer-municao">
                        {itemVisualizado.municaoCarregada ? (
                          // ... exibe munição carregada (mantém igual)
                          <>
                            <p>
                              <strong>Munição Especial Carregada:</strong>{" "}
                              {itemVisualizado.municaoCarregada.nome}
                            </p>
                            <p>
                              <strong>Bônus:</strong>{" "}
                              {itemVisualizado.municaoCarregada.bonusDano ||
                                "—"}
                            </p>
                            <p>
                              <strong>Quantidade restante:</strong>{" "}
                              {itemVisualizado.municaoCarregada.quantidade || 0}
                            </p>
                            <button
                              type="button"
                              className="item-visualizer-municao-remover"
                              onClick={() =>
                                removerMunicaoDaArma(itemVisualizado.index)
                              }
                            >
                              Remover munição
                            </button>
                          </>
                        ) : (
                          <>
                            {obterMunicoesEspeciais().length > 0 ? (
                              <div className="item-visualizer-municao-select">
                                <span>Selecione munição especial</span>
                                <div className="municao-especial-list">
                                  {obterMunicoesEspeciais().map(
                                    ({ item, index }) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className={getClassMunicaoEspecial(
                                          item,
                                        )}
                                        onClick={() =>
                                          carregarMunicaoEspecial(
                                            itemVisualizado.index,
                                            index,
                                          )
                                        }
                                      >
                                        <span className="municao-especial-icon">
                                          <Icon
                                            path={getIconMunicaoEspecial(item)}
                                            size={1.2}
                                          />
                                        </span>
                                        <span className="municao-especial-nome">
                                          {item.nome}
                                        </span>
                                        {item.quantidade && (
                                          <span className="municao-especial-quantidade">
                                            {item.quantidade}
                                          </span>
                                        )}
                                      </button>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p>
                                Nenhuma munição especial disponível no
                                inventário.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  {/* BÔNUS DE DANO E CRÍTICO PARA CORPO A CORPO */}
                  {itemVisualizado.armaStatus &&
                    itemVisualizado.armaStatus.tipo === "Corpo a Corpo" && (
                      <div className="corpo-a-corpo-bonus">
                        <div className="bonus-dano-arma">
                          <span>Bônus de dano</span>
                          <input
                            value={itemVisualizado.bonusDanoArma || ""}
                            placeholder="+2, 1d6, 2d8+3..."
                            onChange={(event) =>
                              atualizarBonusDanoArma(
                                itemVisualizado.index,
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="corpo-a-corpo-critico">
                          <label>
                            <input
                              type="checkbox"
                              checked={criticoCorpoACorpo}
                              onChange={(e) =>
                                setCriticoCorpoACorpo(e.target.checked)
                              }
                            />
                            Crítico (
                            {extrairDadosCritico(
                              itemVisualizado.armaStatus.critico,
                            )}{" "}
                            dados extras)
                          </label>
                        </div>
                      </div>
                    )}

                  {/* AÇÕES */}
                  <div className="item-visualizer-acoes">
                    {itemVisualizado.armaStatus ? (
                      <>
                        {itemVisualizado.armaStatus.tipo === "Corpo a Corpo" ? (
                          <button
                            className="item-ataque-btn corpo-a-corpo-btn"
                            onClick={() =>
                              rolarAtaqueArma(
                                itemVisualizado,
                                "normal",
                                criticoCorpoACorpo,
                              )
                            }
                          >
                            <Icon path={mdiDiceD20} size={0.9} />
                            Rolar Dano
                          </button>
                        ) : (
                          <button
                            className="item-ataque-btn"
                            onClick={() =>
                              rolarAtaqueArma(
                                itemVisualizado,
                                modoAtaque,
                                criticoAtivo,
                              )
                            }
                          >
                            <Icon path={mdiDiceD20} size={0.9} />
                            Rolar Dano
                          </button>
                        )}
                      </>
                    ) : (
                      // Itens sem armaStatus (rolagem personalizada)
                      (itemVisualizado?.rolagem?.formula ||
                        itemVisualizado?.dano?.match(
                          /(\d+)d(\d+)([+-]\d+)?/i,
                        ) ||
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
              )}
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
              {popupCraft && (
                <div
                  className="popup-craft-overlay"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="popup-craft">
                    <strong>{popupCraft.titulo}</strong>
                    <p>{popupCraft.mensagem}</p>
                    <button type="button" onClick={() => setPopupCraft(null)}>
                      Fechar
                    </button>
                  </div>
                </div>
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

            <div className="criacao-conteudo">
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

                <button
                  className={abaCriacao === "melhorias" ? "ativa" : ""}
                  onClick={() => setAbaCriacao("melhorias")}
                >
                  ✦ Melhorias
                </button>
              </div>

              {abaCriacao === "melhorias" ? (
                <div className="melhorias-container">
                  {armasAprimoraveis.length === 0 ? (
                    <div className="melhorias-vazio">
                      <p>Nenhuma arma aprimorável encontrada no inventário.</p>
                      <small>
                        Armas precisam ter <strong>armaStatus</strong> ou conter
                        termos como Pistola, Rifle, Fuzil, Escopeta, Arco no
                        nome.
                      </small>
                    </div>
                  ) : (
                    <>
                      <div className="melhorias-lista-armas">
                        <h5>Armas Disponíveis</h5>
                        <div className="melhorias-armas-grid">
                          {armasAprimoraveis.map(({ item, index }) => {
                            const melhoria = item.melhoriaArma || {
                              nivel: 0,
                              forca: 0,
                              velocidade: 0,
                              alcance: 0,
                            };
                            const selecionada =
                              armaUpgradeAtiva?.index === index;

                            return (
                              <button
                                key={index}
                                className={`melhoria-arma-card ${selecionada ? "selecionada" : ""}`}
                                onClick={() => setArmaUpgradeIndex(index)}
                              >
                                <div className="melhoria-arma-icone">
                                  {renderizarIconeItem(item)}
                                </div>
                                <div className="melhoria-arma-info">
                                  <strong>{item.nome}</strong>
                                  {item.armaStatus && (
                                    <span className="melhoria-arma-dmg">
                                      DMG: {item.armaStatus.dmg}
                                    </span>
                                  )}
                                  <span className="melhoria-arma-nivel">
                                    Nível: {melhoria.nivel || 0}
                                  </span>
                                </div>
                                {melhoria.nivel > 0 && (
                                  <div className="melhoria-arma-atributos">
                                    {melhoria.forca > 0 && (
                                      <small>Força +{melhoria.forca}</small>
                                    )}
                                    {melhoria.velocidade > 0 && (
                                      <small>
                                        Veloc. +{melhoria.velocidade}
                                      </small>
                                    )}
                                    {melhoria.alcance > 0 && (
                                      <small>Alcance +{melhoria.alcance}</small>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {armaUpgradeAtiva && (
                        <div className="melhorias-upgrade-painel">
                          <div className="melhoria-upgrade-topo">
                            <h5>Aprimorando: {armaUpgradeAtiva.item.nome}</h5>
                            {armaUpgradeAtiva.item.armaStatus && (
                              <div className="melhoria-upgrade-stats-atuais">
                                <span>
                                  <b>DMG:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.dmg}
                                </span>
                                <span>
                                  <b>ROF:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.rof}
                                </span>
                                <span>
                                  <b>MAG:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.mag}
                                </span>
                                <span>
                                  <b>Crítico:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.critico}
                                </span>
                                <span>
                                  <b>Precisão:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.precision}
                                </span>
                                <span>
                                  <b>Controle:</b>{" "}
                                  {armaUpgradeAtiva.item.armaStatus.control}
                                </span>
                              </div>
                            )}
                            <div className="melhoria-upgrade-nivel-info">
                              Nível atual da arma:{" "}
                              <strong>
                                {armaUpgradeAtiva.item.melhoriaArma?.nivel || 0}
                              </strong>
                            </div>
                          </div>

                          <div className="melhoria-upgrade-tipos">
                            <span className="melhoria-upgrade-tipos-label">
                              Selecione o tipo de melhoria:
                            </span>
                            <div className="melhoria-upgrade-tipos-grid">
                              {tiposUpgrade.map((tipo) => {
                                const melhoriaAtual =
                                  armaUpgradeAtiva.item.melhoriaArma || {};
                                const valorAtual =
                                  parseInt(melhoriaAtual[tipo.chave], 10) || 0;
                                const noMaximo = valorAtual >= tipo.max;
                                const podePagar = verificarMateriaisUpgrade(
                                  tipo.chave,
                                );
                                const selecionado =
                                  armaUpgradeTipo === tipo.chave;

                                return (
                                  <button
                                    key={tipo.chave}
                                    className={`melhoria-tipo-card ${selecionado ? "selecionado" : ""} ${noMaximo ? "maximizado" : ""}`}
                                    onClick={() =>
                                      !noMaximo &&
                                      setArmaUpgradeTipo(tipo.chave)
                                    }
                                    disabled={noMaximo}
                                  >
                                    <span className="melhoria-tipo-icone">
                                      {tipo.icone}
                                    </span>
                                    <div className="melhoria-tipo-info">
                                      <strong>{tipo.nome}</strong>
                                      <small>{tipo.descricao}</small>
                                      <span className="melhoria-tipo-nivel">
                                        Nível: {valorAtual}/{tipo.max}
                                        {noMaximo && " ✅"}
                                      </span>
                                    </div>
                                    <div className="melhoria-tipo-bar">
                                      <div
                                        className="melhoria-tipo-bar-fill"
                                        style={{
                                          width: `${(valorAtual / tipo.max) * 100}%`,
                                        }}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="melhoria-upgrade-recursos">
                            <span>
                              Recursos necessários para{" "}
                              {
                                tiposUpgrade.find(
                                  (t) => t.chave === armaUpgradeTipo,
                                )?.nome
                              }
                              :
                            </span>
                            <div className="melhoria-recursos-lista">
                              {Object.entries(
                                obterCustoUpgrade(armaUpgradeTipo),
                              ).map(([mat, qtd]) => {
                                const tem =
                                  (personagem.materiaisCriacao?.[mat] || 0) >=
                                  qtd;
                                const nomesMateriais = {
                                  cano: "🔩 Cano",
                                  fita: "🩹 Fita",
                                  laminas: "🔪 Lâminas",
                                  alcool: "🧪 Álcool",
                                  explosivos: "💣 Explosivos",
                                };
                                return (
                                  <span
                                    key={mat}
                                    className={`recurso-chip ${tem ? "disponivel" : "insuficiente"}`}
                                  >
                                    {nomesMateriais[mat] || mat} (x{qtd})
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            className="melhoria-upgrade-btn"
                            onClick={melhorarArmaSelecionada}
                            disabled={
                              !verificarMateriaisUpgrade(armaUpgradeTipo) ||
                              (parseInt(
                                armaUpgradeAtiva.item.melhoriaArma?.[
                                  armaUpgradeTipo
                                ],
                                10,
                              ) || 0) >=
                                (tiposUpgrade.find(
                                  (t) => t.chave === armaUpgradeTipo,
                                )?.max || 5)
                            }
                          >
                            ✦ Aprimorar{" "}
                            {
                              tiposUpgrade.find(
                                (t) => t.chave === armaUpgradeTipo,
                              )?.nome
                            }
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                receitasCriacaoAtuais
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
                  ))
              )}
            </div>
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
                  <div className="item-personalizado-icone-selector">
                    <select
                      value={itemPersonalizado.icone}
                      onChange={(e) =>
                        setItemPersonalizado((prev) => ({
                          ...prev,
                          icone: e.target.value,
                        }))
                      }
                    >
                      {iconesPersonalizados.map((icone) => (
                        <option key={icone.nome} value={icone.value}>
                          {icone.nome}
                        </option>
                      ))}
                    </select>
                    <div className="item-personalizado-icone-preview">
                      {itemPersonalizado.icone === "🎒" ? (
                        <span>🎒</span>
                      ) : (
                        <Icon
                          path={itemPersonalizado.icone}
                          size={1.8}
                          color="#f5efe4"
                        />
                      )}
                    </div>
                  </div>
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
        {subAbaInventario === "maleta" &&
          (ehMedicoDeCampo || temMaletaDeCampo) && (
            <div className="maleta-campo-container">
              <div className="maleta-aprimoramentos-ativos">
                <div className="maleta-aprimoramentos-topo">
                  <span>Aprimoramentos Ativos</span>

                  <strong>
                    {
                      (personagem.maletaCampo?.aprimoramentosAtivos || [])
                        .length
                    }
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

    personalizacao: (
      <div className="conteudo-aba personalizacao-aba">
        <div className="personalizacao-subabas">
          <button
            className={subAbaPersonalizacao === "customizacao" ? "ativa" : ""}
            onClick={() => setSubAbaPersonalizacao("customizacao")}
          >
            Customização
          </button>

          <button
            className={subAbaPersonalizacao === "dados" ? "ativa" : ""}
            onClick={() => setSubAbaPersonalizacao("dados")}
          >
            Dados Personalizados
          </button>
        </div>

        {subAbaPersonalizacao === "customizacao" && (
          <div className="customizacao-bloco">
            <h4>Customização da Ficha</h4>

            <div className="customizacao-grid">
              {[
                ["primaria", "Cor Primária"],
                ["secundaria", "Cor Secundária"],
                ["texto", "Cor do Texto"],
                ["fundo", "Cor do Fundo"],
                ["borda", "Cor da Borda"],
              ].map(([campo, label]) => (
                <label key={campo} className="customizacao-cor-item">
                  <span>{label}</span>

                  <input
                    type="color"
                    value={
                      personagem.temaFicha?.[campo] || TEMA_PADRAO_FICHA[campo]
                    }
                    onChange={(e) => atualizarTemaFicha(campo, e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => restaurarCorPadrao(campo)}
                  >
                    Reset
                  </button>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="btn-restaurar-tema"
              onClick={restaurarTemaPadrao}
            >
              Restaurar Tema Padrão
            </button>
          </div>
        )}

        {subAbaPersonalizacao === "dados" && (
          <div className="rolagem-personalizada-bloco">
            <h4>Rolagem de Dados Personalizada</h4>

            <p>
              Monte qualquer combinação. Exemplos: 3d20+5d100, 2d6+10,
              1d20+4d8-3.
            </p>

            <div className="rolagem-personalizada-form">
              <input
                value={formulaDadoPersonalizado}
                onChange={(e) => setFormulaDadoPersonalizado(e.target.value)}
                placeholder="Ex: 3d20+5d100"
              />

              <button type="button" onClick={rolarFormulaPersonalizada}>
                Rolar
              </button>
            </div>

            {erroRolagemPersonalizada && (
              <span className="erro-rolagem-personalizada">
                {erroRolagemPersonalizada}
              </span>
            )}
          </div>
        )}
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

  const atualizarFotoPerfil = async (event) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    try {
      const fotoComprimida = await compressProfileImage(arquivo);
      setPersonagem((prev) => ({
        ...prev,
        fotoPerfil: fotoComprimida,
      }));
    } catch (error) {
      alert(error.message || "Nao foi possivel carregar a imagem.");
    }

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

      <aside
        className="ficha-identificacao-secreta"
        aria-label="Dados da ficha"
      >
        <span>Jogador</span>
        <strong>{personagem.nomeJogador || "Sem jogador"}</strong>
        <span>Senha da ficha</span>
        <strong>{fichaId}</strong>
      </aside>

      {/* Container Principal: Perfil + Atributos + Sidebar */}
      <div className="main-content">
        {/* ... (seu conteúdo existente permanece igual) ... */}
        <div className="profile-section">
          <div className="profile-container">
            {temMarcaPendente && (
              <button
                className="marca-pendente-btn"
                onClick={() => abrirModalMarca(marcasPendentes[0])}
              >
                ✦ Nova Marca Disponível
              </button>
            )}
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
                      {/* EXIBIR MARCAS */}
                      {personagem.marcas && personagem.marcas.length > 0 && (
                        <div className="marcas-personagem-perfil">
                          {personagem.marcas.map((marca, index) => (
                            <span key={index} className="marca-perfil-nome">
                              {marca.nome}
                              {!marca.aceita && (
                                <span className="marca-pendente-tag">
                                  {" "}
                                  pendente
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
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
                          <CampoNumeroEditavel
                            type="number"
                            valor={personagem.sanidade.atual}
                            onConfirmar={atualizarSanidade}
                            className="barra-rpg-input atual"
                            min="0"
                            max={personagem.sanidade.max}
                          />
                          <span className="barra-rpg-sep">/</span>
                          <CampoNumeroEditavel
                            type="number"
                            valor={personagem.sanidade.max}
                            onConfirmar={(valor) =>
                              setPersonagem((prev) => ({
                                ...prev,
                                sanidade: {
                                  ...prev.sanidade,
                                  max: Math.max(0, valor),
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
                          <CampoNumeroEditavel
                            type="number"
                            valor={personagem.esperanca.atual}
                            onConfirmar={atualizarEsperanca}
                            className="barra-rpg-input atual esperanca-input"
                            min="0"
                            max={personagem.esperanca.max}
                          />
                          <span className="barra-rpg-sep">/</span>
                          <CampoNumeroEditavel
                            type="number"
                            valor={personagem.esperanca.max}
                            onConfirmar={(valor) =>
                              setPersonagem((prev) => ({
                                ...prev,
                                esperanca: {
                                  ...prev.esperanca,
                                  max: Math.max(0, valor),
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
              ABSOLUTO
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
            <button
              className={`aba-btn ${abaAtiva === "personalizacao" ? "ativa" : ""}`}
              onClick={() => setAbaAtiva("personalizacao")}
            >
              Personalização
            </button>
          </div>

          <div className="sidebar-conteudo">{conteudoAbas[abaAtiva]}</div>
          {/* MODAL DE MARCA */}
          {marcaModalAberto && marcaSelecionada && (
            <div
              className="marca-modal-overlay"
              onClick={() => setMarcaModalAberto(false)}
            >
              <div className="marca-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="marca-modal-fechar"
                  onClick={() => setMarcaModalAberto(false)}
                >
                  ×
                </button>

                <div className="marca-modal-header">
                  <span>MARCA</span>
                  <h2>{marcaSelecionada.nome}</h2>
                  <p className="marca-descricao">
                    {marcaSelecionada.descricao}
                  </p>
                </div>

                <div className="marca-modal-corpo">
                  <div className="marca-beneficios">
                    <h4>✦ Benefícios</h4>
                    <p>
                      {marcaSelecionada.beneficios ||
                        "Nenhum benefício listado."}
                    </p>
                  </div>

                  <div className="marca-penalidades">
                    <h4>✧ Penalidades</h4>
                    <p>
                      {marcaSelecionada.penalidades ||
                        "Nenhuma penalidade listada."}
                    </p>
                  </div>

                  {marcaSelecionada.habilidades?.length > 0 && (
                    <div className="marca-habilidades">
                      <h4>⚡ Escolha uma habilidade</h4>
                      <div className="marca-habilidades-lista">
                        {marcaSelecionada.habilidades.map((hab, index) => (
                          <button
                            key={index}
                            className={`marca-habilidade-btn ${
                              habilidadeEscolhidaIndex === index
                                ? "selecionada"
                                : ""
                            }`}
                            onClick={() => setHabilidadeEscolhidaIndex(index)}
                          >
                            <strong>{hab.nome}</strong>
                            <span>{hab.descricao}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="marca-acoes">
                    <button
                      className="marca-aceitar-btn"
                      onClick={aceitarMarca}
                      disabled={
                        marcaSelecionada.habilidades?.length > 0 &&
                        habilidadeEscolhidaIndex === null
                      }
                    >
                      Aceitar Marca
                    </button>
                    <button
                      className="marca-recusar-btn"
                      onClick={() => setMarcaModalAberto(false)}
                    >
                      Recusar
                    </button>
                  </div>
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

                {modalRolagem.alvos?.length > 0 ? (
                  <div className="cards-alvos-dano">
                    {modalRolagem.alvos.map((alvo, index) => {
                      const dadosAlvo = [
                        ...alvo.resultado.rolagens,
                        ...(alvo.resultado.rolagensBonus || []),
                      ];

                      return (
                        <div className="card-alvo-dano" key={index}>
                          <h4>{alvo.nome}</h4>

                          <div className="dados-rolagem dados-card-alvo">
                            {(alvo.resultado.dadosDetalhados || []).map(
                              (dado, dadoIndex) => (
                                <div
                                  key={dadoIndex}
                                  className={`dado-rolagem d${dado.faces} ${
                                    rolandoDados ? "rolando" : ""
                                  }`}
                                >
                                  <span>{rolandoDados ? "?" : dado.valor}</span>
                                </div>
                              ),
                            )}
                          </div>

                          {!rolandoDados && (
                            <div className="resultado-alvo-dano">
                              <span>DANO</span>
                              <strong>{alvo.resultado.total}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dados-rolagem">
                    {(
                      modalRolagem.dadosDetalhados ||
                      modalRolagem.dados.map((valor) => ({
                        valor,
                        faces: modalRolagem.faces,
                      }))
                    ).map((dado, index) => (
                      <div
                        key={index}
                        className={`
        dado-rolagem
        d${dado.faces}
        ${rolandoDados ? "rolando" : ""}
        ${
          !rolandoDados &&
          modalRolagem.tipo !== "dano" &&
          dado.valor === modalRolagem.maiorResultado
            ? "maior"
            : ""
        }
      `}
                      >
                        <span>{rolandoDados ? "?" : dado.valor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!rolandoDados && !modalRolagem.alvos?.length && (
                  <>
                    {modalRolagem.tipo === "dano" ? (
                      <div className="total-rolagem">
                        <span>Dano Total</span>
                        <strong>{modalRolagem.total}</strong>
                      </div>
                    ) : (
                      <>
                        <div className="resultado-rolagem">
                          <span>Maior dado</span>
                          <strong>{modalRolagem.maiorResultado}</strong>
                        </div>

                        <div className="bonus-rolagem">
                          <span>Ativo: +{modalRolagem.bonusAtivo}</span>
                          <span>Passiva: +{modalRolagem.bonusPassiva}</span>
                        </div>

                        {modalRolagem.finais > 0 && (
                          <div className="bonus-finais">
                            <span>Finais: {modalRolagem.finais}</span>

                            <strong>+{modalRolagem.bonusFinais || 0}</strong>

                            {modalRolagem.resultadosExtras?.length > 0 && (
                              <small>
                                Extras:{" "}
                                {modalRolagem.resultadosExtras.join(", ")}
                              </small>
                            )}
                          </div>
                        )}

                        <div className="total-rolagem">
                          <span>Resultado Final</span>
                          <strong>{modalRolagem.total}</strong>
                        </div>
                      </>
                    )}
                  </>
                )}

                {!rolandoDados && (
                  <button
                    className="fechar-rolagem"
                    onClick={fecharModalRolagem}
                  >
                    Fechar
                  </button>
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
