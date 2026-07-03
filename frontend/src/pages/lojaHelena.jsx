import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiArrowLeft,
  mdiCart,
  mdiCheck,
  mdiCreationOutline,
  mdiShield,
  mdiTools,
  mdiTrashCanOutline,
  mdiPistol,
  mdiKnifeMilitary,
  mdiCreation,
  mdiWrench,
} from "@mdi/js";
import "../CSS/LojaHelena.css";
import { obterIconeItem } from "../utils/itemIcons";
import {
  buscarCatalogoLoja,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import {
  notificarPersonagemAtualizado,
  ouvirPersonagemAtualizado,
} from "../services/syncEvents";
import { SYNC_INTERVALS, iniciarPollingVisivel } from "../services/syncPolicy";
import {
  DEFAULT_CATALOGO_LOJA,
  normalizarItemLoja,
} from "../data/catalogoLoja";
import { estadoInicial } from "./fichaPersonagem";
import { APRIMORAMENTOS_MALETA } from "../data/Catalogo/aprimoramentoMaleta";

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";
const DEFAULT_FICHA_ID = "principal";

const categorias = [
  { id: "armas-fogo", nome: "Armas de Fogo", icon: mdiPistol },
  { id: "armas-corpo", nome: "Corpo a Corpo", icon: mdiKnifeMilitary },
  { id: "defesas", nome: "Defesas", icon: mdiShield },
  { id: "itens", nome: "Itens", icon: mdiTools },
  { id: "ritos", nome: "Ritos Absolutos", icon: mdiCreationOutline },
  { id: "poderes", nome: "Poderes Absolutos", icon: mdiCreation },
  { id: "maleta-campo", nome: "Maleta de Campo", icon: mdiTools },
  { id: "aprimoramento", nome: "✦ Aprimoramento", icon: mdiWrench },
];

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

const montarUrlFicha = (personagem, fichaId) => {
  const nomeUrl = normalizarFichaId(personagem?.nome || fichaId);
  const params = new URLSearchParams({
    ficha: nomeUrl,
    senha: fichaId,
  });

  return `?${params.toString()}`;
};

const LojaHelena = () => {
  const [fichaId] = useState(obterFichaIdDaUrl);
  const [personagem, setPersonagem] = useState(estadoInicial);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [categoriaAtiva, setCategoriaAtiva] = useState("armas-fogo");
  const [nivelRitoAtivo, setNivelRitoAtivo] = useState("iniciante");
  const [subAbaMaleta, setSubAbaMaleta] = useState("medicinal");
  const [filtroModificadores, setFiltroModificadores] = useState("todos");
  const [carrinho, setCarrinho] = useState([]);
  const [mensagem, setMensagem] = useState("");

  // Estado para Aprimoramento de Armas
  const [armaUpgradeIndex, setArmaUpgradeIndex] = useState(null);
  const [armaUpgradeTipo, setArmaUpgradeTipo] = useState("dano");

  // Estado para Aplicar Modificadores
  const [modAba, setModAba] = useState("aplicar"); // aplicar | estoque
  const [modSubAba, setModSubAba] = useState("todas");

  const storageKey = `${STORAGE_KEY}_${fichaId}`;
  const saldoKey = `lojaHelena_creditos_${fichaId}`;

  const saldo = Math.max(0, parseInt(personagem.lojaCreditos, 10) || 0);
  const saldoMementos = Math.max(
    0,
    parseInt(personagem.ritosCreditos, 10) || 0,
  );

  const usandoRitos = categoriaAtiva === "ritos";
  const usandoPoderes = categoriaAtiva === "poderes";
  const usandoLojaAbsoluto = usandoRitos || usandoPoderes;

  const classeAtual = personagem.classeId || personagem.classe || "";
  const ehMedicoDeCampo =
    classeAtual.toLowerCase().includes("medico") ||
    classeAtual.toLowerCase().includes("médico");

  const aprimoramentoMedicoGratisUsado =
    personagem.maletaCampo?.aprimoramentoMedicoGratisUsado || false;

  useEffect(() => {
    const catalogoSalvo = localStorage.getItem(CATALOGO_STORAGE_KEY);

    if (catalogoSalvo) {
      try {
        const catalogoLocal = JSON.parse(catalogoSalvo);

        if (Array.isArray(catalogoLocal)) {
          const catalogoLocalNormalizado =
            catalogoLocal.map(normalizarItemLoja);
          const catalogoAtualizado = catalogoLocalNormalizado.some(
            (item) =>
              item.armaStatus ||
              item.nivelRito ||
              item.categoria === "poderes" ||
              item.categoria === "armas-fogo" ||
              item.categoria === "armas-corpo",
          );

          if (catalogoAtualizado) {
            setCatalogo(catalogoLocalNormalizado);
          } else {
            localStorage.removeItem(CATALOGO_STORAGE_KEY);
            setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
          }
        }
      } catch (error) {
        console.warn("Nao foi possivel carregar o catalogo local.", error);
      }
    }

    buscarCatalogoLoja()
      .then((catalogoApi) => {
        const apiAtualizada =
          Array.isArray(catalogoApi) &&
          catalogoApi.some(
            (item) =>
              item.armaStatus ||
              item.nivelRito ||
              item.categoria === "poderes" ||
              item.categoria === "armas-fogo" ||
              item.categoria === "armas-corpo",
          );

        if (catalogoApi.length > 0 && apiAtualizada) {
          const catalogoNormalizado = catalogoApi.map(normalizarItemLoja);
          setCatalogo(catalogoNormalizado);
          localStorage.setItem(
            CATALOGO_STORAGE_KEY,
            JSON.stringify(catalogoNormalizado),
          );
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Loja usando catalogo local.");
      });
  }, []);

  useEffect(() => {
    const saldoSalvo = localStorage.getItem(saldoKey);
    const creditosLocais = saldoSalvo
      ? Math.max(0, parseInt(saldoSalvo, 10) || 0)
      : null;

    const aplicarCompatibilidade = (personagemBase) => ({
      ...personagemBase,
      lojaCreditos: personagemBase.lojaCreditos ?? creditosLocais ?? 900,
      ritosCreditos: personagemBase.ritosCreditos ?? 15,
      poderesAbsolutos: personagemBase.poderesAbsolutos ?? [],
    });

    const dadosSalvos = localStorage.getItem(storageKey);

    if (dadosSalvos) {
      try {
        setPersonagem(aplicarCompatibilidade(JSON.parse(dadosSalvos)));
      } catch (error) {
        console.warn("Nao foi possivel carregar a ficha local.", error);
      }
    }

    buscarPersonagem(fichaId)
      .then((personagemApi) => {
        if (personagemApi) {
          setPersonagem(aplicarCompatibilidade(personagemApi));
        }
      })
      .catch(() => {
        console.warn("Backend indisponivel. Loja usando localStorage.");
      });
  }, [fichaId, saldoKey, storageKey]);

  useEffect(() => {
    let cancelado = false;

    const sincronizarPersonagem = async ({ fichaId: fichaAtualizada } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaId) return;

      try {
        const personagemApi = await buscarPersonagem(fichaId);
        if (!cancelado && personagemApi) {
          setPersonagem({
            ...estadoInicial,
            ...personagemApi,
            lojaCreditos: personagemApi.lojaCreditos ?? 900,
          });
        }
      } catch (error) {
        const dadosSalvos = localStorage.getItem(storageKey);

        if (!cancelado && dadosSalvos) {
          try {
            setPersonagem(JSON.parse(dadosSalvos));
          } catch {
            console.warn("Nao foi possivel sincronizar a loja local.");
          }
        }
      }
    };

    const pararPersonagem = ouvirPersonagemAtualizado(sincronizarPersonagem);
    const pararPolling = iniciarPollingVisivel(
      sincronizarPersonagem,
      SYNC_INTERVALS.loja,
    );

    return () => {
      cancelado = true;
      pararPersonagem();
      pararPolling();
    };
  }, [fichaId, storageKey]);

  const temMaletaDeCampo = (personagem.inventario || []).some(
    (item) => item.nome === "Maleta de Campo",
  );

  const itemMaletaDeCampo = {
    id: "maleta-de-campo",
    nome: "Maleta de Campo",
    categoria: "itens",
    preco: ehMedicoDeCampo ? 0 : 500,
    entrega: "Equipamento Médico",
    detalhe:
      "A Maleta de Campo é o coração operacional de todo agente em missão. Permite instalar até 3 aprimoramentos ativos.",
    tipo: "Item Especial",
    icone: "🩺",
    descricao:
      "A Maleta de Campo representa preparo, sobrevivência e adaptação diante do desconhecido.",
    maletaCampo: true,
  };

  const aprimoramentosMaletaLoja = useMemo(() => {
    const mapear = (lista, tipoMaleta) =>
      lista.map((item) => ({
        ...item,
        categoria: "maleta-campo",
        tipoMaleta,
        preco:
          tipoMaleta === "medicinal" &&
          ehMedicoDeCampo &&
          !aprimoramentoMedicoGratisUsado
            ? 0
            : 250,
        detalhe: item.efeito,
        entrega: item.nome,
      }));

    return {
      medicinal: mapear(APRIMORAMENTOS_MALETA.medicinal, "medicinal"),
      combate: mapear(APRIMORAMENTOS_MALETA.combate, "combate"),
      geral: mapear(APRIMORAMENTOS_MALETA.geral, "geral"),
    };
  }, [ehMedicoDeCampo, aprimoramentoMedicoGratisUsado]);

  const itensFiltrados = useMemo(() => {
    if (categoriaAtiva === "maleta-campo") {
      if (!ehMedicoDeCampo && !temMaletaDeCampo) return [];
      return aprimoramentosMaletaLoja[subAbaMaleta] || [];
    }

    if (categoriaAtiva === "todos") return catalogo;

    if (categoriaAtiva === "ritos") {
      return catalogo.filter(
        (item) =>
          item.categoria === "ritos" && item.nivelRito === nivelRitoAtivo,
      );
    }

    if (categoriaAtiva === "modificacoes") {
      return catalogo.filter((item) => item.categoria === "modificacoes");
    }

    if (categoriaAtiva === "aprimoramento") {
      return []; // não usado; renderiza por renderizarAprimoramento()
    }

    const itensBase = catalogo.filter(
      (item) => item.categoria === categoriaAtiva,
    );

    if (categoriaAtiva === "itens" && !temMaletaDeCampo && !ehMedicoDeCampo) {
      return [itemMaletaDeCampo, ...itensBase];
    }

    return itensBase;
  }, [
    categoriaAtiva,
    catalogo,
    nivelRitoAtivo,
    aprimoramentosMaletaLoja,
    subAbaMaleta,
    temMaletaDeCampo,
    ehMedicoDeCampo,
  ]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco, 0);
  const saldoAtual = usandoLojaAbsoluto ? saldoMementos : saldo;
  const podeComprar = carrinho.length > 0 && totalCarrinho <= saldoAtual;

  const formatarPreco = (itemOuValor) => {
    const valor =
      typeof itemOuValor === "number" ? itemOuValor : itemOuValor.preco;
    return usandoLojaAbsoluto ? `${valor} Mementos` : `${valor} cr`;
  };

  const renderizarIconeItem = (item, size = 1.8) => {
    const icone = obterIconeItem(item);
    const ehImagem =
      typeof icone === "string" &&
      (icone.includes(".svg") || icone.startsWith("data:image"));

    if (ehImagem) {
      return (
        <img src={icone} alt="" className="loja-item-img" aria-hidden="true" />
      );
    }

    return <Icon path={icone} size={size} />;
  };

  const adicionarAoCarrinho = (item) => {
    setCarrinho((atual) => [...atual, item]);
    setMensagem(`${item.nome} separado no balcao.`);
  };

  const removerDoCarrinho = (index) => {
    setCarrinho((atual) => atual.filter((_, itemIndex) => itemIndex !== index));
  };

  const voltarParaFicha = () => {
    window.location.href = montarUrlFicha(personagem, fichaId);
  };

  // =====================
  // Aprimoramento (antigo)
  // =====================
  const interpretarDano = (danoTexto) => {
    const texto = String(danoTexto || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const match = texto.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return null;
    return {
      quantidade: parseInt(match[1], 10),
      faces: parseInt(match[2], 10),
      bonus: parseInt(match[3] || 0, 10),
    };
  };

  const reduzirCritico = (criticoTexto) => {
    const texto = String(criticoTexto || "").trim();
    const match = texto.match(/(\d+)x(\d+)/i);
    if (!match) return texto;
    const quantidade = Math.max(1, parseInt(match[1], 10) - 1);
    const faces = match[2];
    return `${quantidade}x${faces}`;
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
      if (texto.includes("|")) return `${texto} +1`;
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
    if (texto.includes("|")) return `${texto} +1`;
    return `${texto || "Persistência"} | +1`;
  };

  const incrementarMobilidade = (mobilityTexto) => {
    const texto = String(mobilityTexto || "").trim();
    const match = texto.match(/(\d+)\s*alvos?/i);
    if (match) {
      const quantidade = parseInt(match[1], 10) + 1;
      return texto.replace(/(\d+)\s*alvos?/i, `${quantidade} alvos`);
    }
    if (texto.includes("|")) {
      const [prefixo, sufixo] = texto.split("|").map((parte) => parte.trim());
      return `${prefixo} | 3 alvos`;
    }
    return `${texto || "Firmeza"} | 3 alvos`;
  };

  const tiposUpgradeFogo = [
    {
      chave: "dano",
      nome: "Dano",
      icone: "⚔️",
      descricao: "Aumenta o dano base da arma",
      max: 5,
    },
    {
      chave: "critico",
      nome: "Crítico",
      icone: "💥",
      descricao: "Reduz a dificuldade de crítico (menos dados necessários)",
      max: 3,
    },
    {
      chave: "precisao",
      nome: "Precisão",
      icone: "🎯",
      descricao:
        "Aumenta o bônus de ataque com Percepção e fortalece alcance/control",
      max: 3,
    },
    {
      chave: "controle",
      nome: "Controle",
      icone: "🎚️",
      descricao: "Melhora o controle de recuo e a estabilidade do disparo",
      max: 3,
    },
    {
      chave: "velocidade",
      nome: "Velocidade",
      icone: "💨",
      descricao: "Aumenta a capacidade de atingir mais alvos em uma mesma ação",
      max: 3,
    },
    {
      chave: "alcance",
      nome: "Alcance",
      icone: "📏",
      descricao:
        "Estende o alcance efetivo da arma e reforça ataques de precisão",
      max: 3,
    },
  ];

  const tiposUpgradeCorpo = [
    {
      chave: "dadoDano",
      nome: "Dados de Dano",
      icone: "⚡",
      descricao: "Adiciona +1 dado de dano permanente",
      max: 3,
    },
    {
      chave: "bonusDano",
      nome: "Bônus de Dano",
      icone: "⚡",
      descricao: "Adiciona +2 de dano fixo permanente",
      max: 3,
    },
    {
      chave: "danoCritico",
      nome: "Dano Crítico",
      icone: "💢",
      descricao: "Aumenta em +1 o número de dados extras do crítico",
      max: 3,
    },
    {
      chave: "danoCabeca",
      nome: "Dano na Cabeça",
      icone: "💀",
      descricao: "Aumenta o dano máximo na cabeça em +10",
      max: 3,
    },
  ];

  const armasAprimoraveis = useMemo(() => {
    return (personagem.inventario || [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const texto = `${item.nome || ""} ${item.tipo || ""} ${item.categoria || ""}`;
        return (
          item.armaStatus ||
          /arma|pistola|rifle|fuzil|escopeta|arco/i.test(texto)
        );
      });
  }, [personagem.inventario]);

  const armaUpgradeAtiva = useMemo(() => {
    return (
      armasAprimoraveis.find(({ index }) => index === armaUpgradeIndex) ||
      armasAprimoraveis[0] ||
      null
    );
  }, [armasAprimoraveis, armaUpgradeIndex]);

  const tiposUpgrade = useMemo(() => {
    if (!armaUpgradeAtiva) return tiposUpgradeFogo;
    const isCorpo = armaUpgradeAtiva.item.armaStatus?.tipo === "Corpo a Corpo";
    return isCorpo ? tiposUpgradeCorpo : tiposUpgradeFogo;
  }, [armaUpgradeAtiva]);

  // =====================
  // Função: aplicar Modificações na arma selecionada
  // =====================
  const aplicarModificacoesNaArmaSelecionada = ({
    inventarioAtualizado,
    novosModificacoesArma,
  }) => {
    if (!novosModificacoesArma?.length) return true;

    const armaAlvoIndex =
      armaUpgradeAtiva?.index ?? armasAprimoraveis[0]?.index;
    const armaAlvo = inventarioAtualizado[armaAlvoIndex];

    if (!armaAlvo) {
      setMensagem("Selecione uma arma para aplicar modificadores.");
      return false;
    }

    // Verifica limite de 3 modificadores
    const modificacoesAtuais = armaAlvo.modificacoesArma || [];
    if (modificacoesAtuais.length + novosModificacoesArma.length > 3) {
      setMensagem("A arma só pode ter até 3 modificadores por vez.");
      return false;
    }

    // Aplica os efeitos no armaStatus
    if (armaAlvo.armaStatus) {
      novosModificacoesArma.forEach((mod) => {
        // Pega os efeitos (pode estar em mod.modificacao.efeitos ou diretamente em mod.efeitos)
        const efeitos = mod.modificacao?.efeitos || mod.efeitos;
        if (efeitos) {
          aplicarEfeitosModificador(armaAlvo.armaStatus, efeitos);
        }
      });
    }

    // Adiciona ao histórico da arma
    armaAlvo.modificacoesArma = [
      ...modificacoesAtuais,
      ...novosModificacoesArma,
    ];

    // Salva no inventário
    inventarioAtualizado[armaAlvoIndex] = armaAlvo;
    return true;
  };
  // =========================================================
  // Aplica os efeitos de um modificador no armaStatus
  // ========================================================
  const aplicarEfeitosModificador = (armaStatus, efeitos) => {
    if (!armaStatus || !efeitos) return armaStatus;

    // 1. Bônus de Dano (número fixo ou dado extra)
    if (efeitos.bonusDano !== undefined && efeitos.bonusDano !== null) {
      const bonus = efeitos.bonusDano;
      const danoAtual = interpretarDano(armaStatus.dmg);
      if (danoAtual) {
        let novaQtd = danoAtual.quantidade;
        let novoBonus = danoAtual.bonus || 0;
        // Se for número, soma ao bônus fixo
        if (typeof bonus === "number" || !isNaN(parseInt(bonus))) {
          novoBonus += parseInt(bonus);
        }
        // Se for string com 'd' (ex: "1d"), adiciona +1 dado
        else if (typeof bonus === "string" && bonus.includes("d")) {
          const extra = interpretarDano(bonus);
          if (extra) {
            // Se as faces forem iguais, soma a quantidade
            if (extra.faces === danoAtual.faces) {
              novaQtd += extra.quantidade;
            } else {
              // Se faces diferentes, concatena (ex: 1d6 + 1d8)
              armaStatus.dmg = `${armaStatus.dmg} + ${bonus}`;
              return armaStatus;
            }
          }
        }
        armaStatus.dmg = `${novaQtd}d${danoAtual.faces}${novoBonus > 0 ? "+" + novoBonus : ""}`;
      }
    }

    // 2. Dano Adicional (ex: "1d6")
    if (efeitos.danoAdicional) {
      const danoAtual = interpretarDano(armaStatus.dmg);
      const extra = interpretarDano(efeitos.danoAdicional);
      if (danoAtual && extra) {
        if (danoAtual.faces === extra.faces) {
          const novaQtd = danoAtual.quantidade + extra.quantidade;
          armaStatus.dmg = `${novaQtd}d${danoAtual.faces}${danoAtual.bonus > 0 ? "+" + danoAtual.bonus : ""}`;
        } else {
          armaStatus.dmg = `${armaStatus.dmg} + ${efeitos.danoAdicional}`;
        }
      }
    }

    // 3. Bônus de Teste de Ataque
    if (efeitos.bonusTesteAtaque) {
      const valor = parseInt(efeitos.bonusTesteAtaque) || 0;
      armaStatus.bonusTesteAtaque = (armaStatus.bonusTesteAtaque || 0) + valor;

      // IMPORTANTE: não modificar armaStatus.precision aqui.
      // O campo "Precision" é do modo Percepção (estat do teste de Ataque a longa distância),
      // e não deve exibir modificadores genéricos vindos de modificações.
    }

    // 4. Ignorar Armadura
    if (efeitos.ignorarArmadura) {
      armaStatus.ignorarArmadura =
        (armaStatus.ignorarArmadura || 0) + parseInt(efeitos.ignorarArmadura);
    }

    // 5. Bônus de Munição (MAG)
    if (efeitos.bonusMunicao) {
      armaStatus.mag =
        (parseInt(armaStatus.mag) || 0) + parseInt(efeitos.bonusMunicao);
    }

    // 6. Bônus de Dano na Cabeça
    if (efeitos.danoCabeca) {
      armaStatus.danoCabeca =
        (parseInt(armaStatus.danoCabeca) || 0) + parseInt(efeitos.danoCabeca);
    }

    // 7. Bônus de Furtividade / Desarme / etc (adiciona ao texto do mobility ou cria uma propriedade)
    if (efeitos.bonusFurtividade) {
      armaStatus.bonusFurtividade =
        (armaStatus.bonusFurtividade || 0) + parseInt(efeitos.bonusFurtividade);
    }
    if (efeitos.bonusDesarme) {
      armaStatus.bonusDesarme =
        (armaStatus.bonusDesarme || 0) + parseInt(efeitos.bonusDesarme);
    }

    // 8. Modificadores de Alcance/Precisão
    if (efeitos.bonusLongo || efeitos.penalidadeCurto) {
      let precision = armaStatus.precision || "";
      if (efeitos.bonusLongo) precision += ` | Longo +${efeitos.bonusLongo}`;
      if (efeitos.penalidadeCurto)
        precision += ` | Curto ${efeitos.penalidadeCurto}`;
      armaStatus.precision = precision.trim();
    }

    return armaStatus;
  };

  // =====================
  // Finalizar Compra (com Modificadores)
  // =====================
  const finalizarCompra = () => {
    if (!podeComprar) {
      setMensagem(
        usandoLojaAbsoluto
          ? "Mementos insuficientes para fechar essa compra."
          : "Creditos insuficientes para fechar essa compra.",
      );
      return;
    }

    const novosRitos = carrinho
      .filter((item) => item.categoria === "ritos")
      .map((item) => ({
        nome: item.nome,
        custo: item.entrega,
        descricao: item.detalhe,
        detalhe: item.detalhe,
        nivel: item.nivelRito || "iniciante",
        nivelRito: item.nivelRito || "iniciante",
        acao: item.acao || "",
        distancia: item.distancia || "",
        duracao: item.duracao || "",
        requisitos: item.requisitos || "",
        alvo: item.alvo || "",
        efeito: item.efeito || item.detalhe || "",
      }));

    const novosPoderes = carrinho
      .filter((item) => item.categoria === "poderes")
      .map((item) => ({
        nome: item.nome,
        descricao: item.detalhe,
        absolutismo: item.entrega,
      }));

    const novosAprimoramentosMaleta = carrinho.filter(
      (item) => item.categoria === "maleta-campo",
    );

    const novosModificacoesArma = carrinho.filter(
      (item) => item.categoria === "modificacoes",
    );

    const novosItens = carrinho
      .filter(
        (item) =>
          item.categoria !== "ritos" &&
          item.categoria !== "poderes" &&
          item.categoria !== "maleta-campo" &&
          item.categoria !== "modificacoes",
      )
      .map((item) =>
        item.maletaCampo
          ? {
              nome: "Maleta de Campo",
              tipo: "Item Especial",
              icone: "🩺",
              detalhes: "Equipamento Médico",
              descricao: item.descricao || item.detalhe,
              compartimentos: { medicinal: [], combate: [], geral: [] },
              aprimoramentosAtivos: [],
              personalizado: false,
            }
          : {
              nome: item.nome,
              detalhes: item.entrega,
              armaStatus: item.armaStatus || null,
            },
      );

    const aprimoramentosAtuais =
      personagem.maletaCampo?.aprimoramentosAtivos || [];

    if (aprimoramentosAtuais.length + novosAprimoramentosMaleta.length > 3) {
      setMensagem("A Maleta de Campo só pode ter até 3 aprimoramentos ativos.");
      return;
    }

    // Inventário base
    const inventarioAtualizado = [...(personagem.inventario || [])];

    // Aplicar modificadores na arma (usa a arma selecionada no Aprimoramento)
    if (novosModificacoesArma.length > 0) {
      const ok = aplicarModificacoesNaArmaSelecionada({
        inventarioAtualizado,
        novosModificacoesArma,
      });

      if (!ok) return;
    }

    const personagemAtualizado = {
      ...personagem,
      lojaCreditos: usandoLojaAbsoluto ? saldo : saldo - totalCarrinho,
      ritosCreditos: usandoLojaAbsoluto
        ? saldoMementos - totalCarrinho
        : saldoMementos,
      rituais: [...(personagem.rituais || []), ...novosRitos],
      poderesAbsolutos: [
        ...(personagem.poderesAbsolutos || []),
        ...novosPoderes,
      ],
      inventario: [...inventarioAtualizado, ...novosItens],
      maletaCampo: {
        ...(personagem.maletaCampo || {}),
        aprimoramentosAtivos: [
          ...(personagem.maletaCampo?.aprimoramentosAtivos || []),
          ...novosAprimoramentosMaleta,
        ],
        aprimoramentoMedicoGratisUsado:
          personagem.maletaCampo?.aprimoramentoMedicoGratisUsado ||
          novosAprimoramentosMaleta.some(
            (item) => item.tipoMaleta === "medicinal" && item.preco === 0,
          ),
      },
    };

    setPersonagem(personagemAtualizado);
    setCarrinho([]);

    setMensagem(
      usandoLojaAbsoluto
        ? "Compra concluida. O Absoluto gravou a escolha na sua ficha."
        : "Compra concluida. Helena ja colocou tudo na sua ficha.",
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify(personagemAtualizado));
    } catch (error) {
      console.warn("LocalStorage cheio. Salvando sem foto.", error);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...personagemAtualizado, fotoPerfil: "" }),
      );
    }

    localStorage.setItem(saldoKey, String(personagemAtualizado.lojaCreditos));
    notificarPersonagemAtualizado(fichaId, personagemAtualizado);

    salvarPersonagem(fichaId, personagemAtualizado)
      .then((personagemSalvo) => {
        notificarPersonagemAtualizado(
          fichaId,
          personagemSalvo || personagemAtualizado,
        );
      })
      .catch((error) => {
        console.warn("Backend indisponivel. Compra salva localmente.", error);
      });
  };

  // =====================
  // renderização Aprimoramento + Modificadores
  // =====================
  const renderizarAprimoramento = () => {
    const listaModificacoes = catalogo.filter(
      (item) => item.categoria === "modificacoes",
    );

    const subCategorias = Array.from(
      new Set(
        listaModificacoes
          .map((m) => String(m.subcategoria || "geral").trim())
          .filter(Boolean),
      ),
    );
    const subCategoriasFinal = ["todas", ...subCategorias];

    const listaModificacoesFallback = DEFAULT_CATALOGO_LOJA.filter(
      (item) => item.categoria === "modificacoes",
    );

    const listaModificacoesEfetiva = listaModificacoes.length
      ? listaModificacoes
      : listaModificacoesFallback;

    const armaSelecionada = armaUpgradeAtiva;
    const isArmaFogo =
      armaSelecionada?.item?.armaStatus?.tipo !== "Corpo a Corpo";
    const isArmaCorpo =
      armaSelecionada?.item?.armaStatus?.tipo === "Corpo a Corpo";

    const listaModificacoesFiltrada = listaModificacoesEfetiva.filter((m) => {
      // Filtro por subcategoria
      if (modSubAba !== "todas" && (m.subcategoria || "geral") !== modSubAba) {
        return false;
      }
      // Filtro por tipo de arma
      const aplicavel = m.aplicavel || "ambos";
      if (aplicavel === "ambos") return true;
      if (isArmaCorpo && aplicavel === "arma-corpo") return true;
      if (isArmaFogo && aplicavel === "arma-fogo") return true;
      return false;
    });

    return (
      <div className="melhorias-container loja-aprimoramento-container">
        <div
          className="melhorias-topo"
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <span>✦ Aprimoramento & Modificadores</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`loja-categoria ${modAba === "aplicar" ? "ativa" : ""}`}
              onClick={() => {
                setModAba("aplicar");
                setMensagem("");
              }}
            >
              Aprimorar
            </button>
            <button
              type="button"
              className={`loja-categoria ${modAba === "estoque" ? "ativa" : ""}`}
              onClick={() => {
                setModAba("estoque");
                setModSubAba("todas");
                setMensagem("");
              }}
            >
              Comprar Modificadores
            </button>
          </div>
        </div>

        {!armaSelecionada && (
          <div className="melhorias-vazio" style={{ width: "100%" }}>
            <p>
              Selecione uma arma no painel acima para ver os modificadores
              compatíveis.
            </p>
          </div>
        )}

        {modAba === "aplicar" ? (
          <>
            {armasAprimoraveis.length === 0 ? (
              <div className="melhorias-vazio">
                <p>Nenhuma arma aprimorável encontrada no inventário.</p>
                <small>
                  Armas precisam ter <strong>armaStatus</strong> ou conter
                  termos como Pistola, Rifle, Fuzil, Escopeta, Arco no nome.
                </small>
              </div>
            ) : (
              <>
                <div className="melhorias-lista-armas">
                  <h5>Armas Disponíveis</h5>
                  <div className="melhorias-armas-grid">
                    {armasAprimoraveis.map(({ item, index }) => {
                      const melhoria = item.melhoriaArma || { nivel: 0 };
                      const selecionada = armaUpgradeAtiva?.index === index;

                      return (
                        <button
                          key={index}
                          className={`melhoria-arma-card ${selecionada ? "selecionada" : ""}`}
                          onClick={() => {
                            setArmaUpgradeIndex(index);
                            setMensagem("");
                          }}
                        >
                          <div className="melhoria-arma-icone">
                            {renderizarIconeItem(item, 1.5)}
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
                            <b>DMG:</b> {armaUpgradeAtiva.item.armaStatus.dmg}
                          </span>
                          <span>
                            <b>ROF:</b> {armaUpgradeAtiva.item.armaStatus.rof}
                          </span>
                          <span>
                            <b>MAG:</b> {armaUpgradeAtiva.item.armaStatus.mag}
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
                          const selecionado = armaUpgradeTipo === tipo.chave;

                          return (
                            <button
                              key={tipo.chave}
                              className={`melhoria-tipo-card ${selecionado ? "selecionado" : ""} ${noMaximo ? "maximizado" : ""}`}
                              onClick={() =>
                                !noMaximo && setArmaUpgradeTipo(tipo.chave)
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
                                  {noMaximo ? " ✅" : ""}
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
                        Custo em créditos para{" "}
                        {
                          tiposUpgrade.find((t) => t.chave === armaUpgradeTipo)
                            ?.nome
                        }
                        :
                      </span>
                      {(() => {
                        const melhoriaAtual =
                          armaUpgradeAtiva.item.melhoriaArma || {};
                        const valorAtual =
                          parseInt(melhoriaAtual[armaUpgradeTipo], 10) || 0;
                        const custoCreditos = 100 + valorAtual * 50;
                        const podePagar = saldo >= custoCreditos;
                        return (
                          <div className="melhoria-recursos-lista">
                            <span
                              className={`recurso-chip ${podePagar ? "disponivel" : "insuficiente"}`}
                            >
                              💰 {custoCreditos} cr
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      className="melhoria-upgrade-btn aprimoramento-creditos-btn"
                      onClick={() => {
                        if (!armaUpgradeAtiva) {
                          setMensagem("Selecione uma arma para aprimorar.");
                          return;
                        }
                        const tipoInfo = tiposUpgrade.find(
                          (t) => t.chave === armaUpgradeTipo,
                        );
                        if (!tipoInfo) return;

                        const melhoriaAtual =
                          armaUpgradeAtiva.item.melhoriaArma || {};
                        const valorAtual =
                          parseInt(melhoriaAtual[armaUpgradeTipo], 10) || 0;

                        if (valorAtual >= tipoInfo.max) {
                          setMensagem(
                            `${tipoInfo.nome} já está no nível máximo!`,
                          );
                          return;
                        }

                        const custoCreditos = 100 + valorAtual * 50;
                        if (saldo < custoCreditos) {
                          setMensagem(
                            `Créditos insuficientes! Precisa de ${custoCreditos} cr.`,
                          );
                          return;
                        }

                        setPersonagem((prev) => {
                          const inventario = [...(prev.inventario || [])];
                          const arma = inventario[armaUpgradeAtiva.index];
                          if (!arma) return prev;

                          const melhoriaAtualArma = arma.melhoriaArma || {};
                          const nivelAtual =
                            parseInt(melhoriaAtualArma.nivel, 10) || 0;

                          const armaStatus = arma.armaStatus
                            ? { ...arma.armaStatus }
                            : null;
                          if (armaStatus) {
                            switch (armaUpgradeTipo) {
                              case "dano": {
                                const danoAtual = interpretarDano(
                                  armaStatus.dmg,
                                );
                                if (danoAtual) {
                                  const novaQtd = Math.min(
                                    danoAtual.quantidade + 1,
                                    12,
                                  );
                                  armaStatus.dmg = `${novaQtd}d${danoAtual.faces}${danoAtual.bonus ? `${danoAtual.bonus > 0 ? "+" : ""}${danoAtual.bonus}` : ""}`;
                                }
                                break;
                              }
                              case "critico":
                                armaStatus.critico = reduzirCritico(
                                  armaStatus.critico,
                                );
                                break;
                              case "precisao":
                                armaStatus.precision = incrementarPrecisao(
                                  armaStatus.precision,
                                );
                                break;
                              case "controle":
                                armaStatus.control = incrementarControle(
                                  armaStatus.control,
                                );
                                break;
                              case "velocidade":
                                armaStatus.mobility = incrementarMobilidade(
                                  armaStatus.mobility,
                                );
                                break;
                              case "alcance":
                                armaStatus.precision = aumentarAlcance(
                                  armaStatus.precision,
                                );
                                break;
                              case "dadoDano": {
                                const danoAtual = interpretarDano(
                                  armaStatus.dmg,
                                );
                                if (danoAtual) {
                                  const novaQtd = Math.min(
                                    danoAtual.quantidade + 1,
                                    12,
                                  );
                                  armaStatus.dmg = `${novaQtd}d${danoAtual.faces}${danoAtual.bonus ? (danoAtual.bonus > 0 ? "+" : "") + danoAtual.bonus : ""}`;
                                }
                                break;
                              }
                              case "bonusDano": {
                                const danoAtual = interpretarDano(
                                  armaStatus.dmg,
                                );
                                if (danoAtual) {
                                  const novoBonus = (danoAtual.bonus || 0) + 2;
                                  armaStatus.dmg = `${danoAtual.quantidade}d${danoAtual.faces}${novoBonus > 0 ? "+" + novoBonus : ""}`;
                                }
                                break;
                              }
                              case "danoCritico": {
                                const criticoMatch =
                                  armaStatus.critico.match(/(\d+)x(\d+)/i);
                                if (criticoMatch) {
                                  const qtd = parseInt(criticoMatch[1], 10) + 1;
                                  armaStatus.critico = `${qtd}x${criticoMatch[2]}`;
                                }
                                break;
                              }
                              case "danoCabeca":
                                armaStatus.danoCabeca =
                                  (parseInt(armaStatus.danoCabeca, 10) || 0) +
                                  10;
                                break;
                              default:
                                break;
                            }
                          }

                          inventario[armaUpgradeAtiva.index] = {
                            ...arma,
                            ...(armaStatus ? { armaStatus } : {}),
                            melhoriaArma: {
                              ...melhoriaAtualArma,
                              nivel: nivelAtual + 1,
                              [armaUpgradeTipo]: valorAtual + 1,
                            },
                          };

                          const personagemAtualizado = {
                            ...prev,
                            inventario,
                            lojaCreditos:
                              (prev.lojaCreditos || 0) - custoCreditos,
                          };

                          localStorage.setItem(
                            storageKey,
                            JSON.stringify(personagemAtualizado),
                          );
                          localStorage.setItem(
                            saldoKey,
                            String(personagemAtualizado.lojaCreditos),
                          );
                          notificarPersonagemAtualizado(
                            fichaId,
                            personagemAtualizado,
                          );
                          salvarPersonagem(fichaId, personagemAtualizado).catch(
                            () => {},
                          );

                          return personagemAtualizado;
                        });

                        setMensagem(
                          `${armaUpgradeAtiva.item.nome} — ${tipoInfo.nome} melhorado por ${custoCreditos} cr!`,
                        );
                        setTimeout(() => setMensagem(""), 3000);
                      }}
                      disabled={(() => {
                        if (!armaUpgradeAtiva) return true;
                        const melhoriaAtual =
                          armaUpgradeAtiva.item.melhoriaArma || {};
                        const valorAtual =
                          parseInt(melhoriaAtual[armaUpgradeTipo], 10) || 0;
                        const custoCreditos = 100 + valorAtual * 50;
                        const noMaximo =
                          valorAtual >=
                          (tiposUpgrade.find((t) => t.chave === armaUpgradeTipo)
                            ?.max || 5);
                        return saldo < custoCreditos || noMaximo;
                      })()}
                    >
                      ✦ Aprimorar{" "}
                      {
                        tiposUpgrade.find((t) => t.chave === armaUpgradeTipo)
                          ?.nome
                      }
                    </button>

                    {mensagem && (
                      <div
                        className="craft-mensagem"
                        style={{ marginTop: "12px" }}
                      >
                        {mensagem}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {modAba === "estoque" && (
              <>
                <div className="melhorias-lista-armas">
                  <h5>Selecione a arma para receber os modificadores</h5>
                  <div className="melhorias-armas-grid">
                    {armasAprimoraveis.map(({ item, index }) => {
                      const melhoria = item.melhoriaArma || { nivel: 0 };
                      const selecionada = armaUpgradeAtiva?.index === index;

                      return (
                        <button
                          key={index}
                          className={`melhoria-arma-card ${selecionada ? "selecionada" : ""}`}
                          onClick={() => {
                            setArmaUpgradeIndex(index);
                            setMensagem("");
                          }}
                        >
                          <div className="melhoria-arma-icone">
                            {renderizarIconeItem(item, 1.5)}
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
                        </button>
                      );
                    })}
                  </div>
                  {!armaUpgradeAtiva && (
                    <div className="melhorias-vazio" style={{ marginTop: 12 }}>
                      <p>Selecione uma arma para aplicar os modificadores.</p>
                    </div>
                  )}
                </div>

                <div
                  className="melhorias-lista-armas"
                  style={{ marginBottom: 18 }}
                >
                  <h5>Comprar Modificadores</h5>
                  <div
                    style={{
                      color: "#aaa294",
                      fontSize: "0.82rem",
                      lineHeight: 1.45,
                      marginTop: 6,
                    }}
                  >
                    Os modificadores serão aplicados na arma selecionada acima.
                    Máximo de 3 por arma.
                  </div>
                </div>

                <div
                  className="melhoria-upgrade-tipos-grid"
                  style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                >
                  {listaModificacoesFiltrada.length === 0 ? (
                    <div className="melhorias-vazio" style={{ width: "100%" }}>
                      <p>Nenhum modificador nesta subcategoria.</p>
                    </div>
                  ) : (
                    listaModificacoesFiltrada.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="melhoria-tipo-card"
                        onClick={() => {
                          if (!armaUpgradeAtiva) {
                            setMensagem(
                              "Selecione uma arma antes de comprar modificadores.",
                            );
                            return;
                          }
                          adicionarAoCarrinho(m);
                        }}
                        style={{ width: 220 }}
                      >
                        <span className="melhoria-tipo-icone">
                          {renderizarIconeItem(m, 1.1)}
                        </span>
                        <div className="melhoria-tipo-info">
                          <strong>{m.nome}</strong>
                          <small>
                            {m.subcategoria ? `${m.subcategoria}` : m.categoria}
                          </small>
                          <span className="melhoria-tipo-nivel">
                            {formatarPreco(m)}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#aaa294",
                            fontSize: "0.72rem",
                            lineHeight: 1.3,
                          }}
                        >
                          {m.detalhe}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const renderizarCarrinhoResumo = () => {
    return null;
  };

  return (
    <main className="loja-page">
      <section
        className={`loja-hero ${usandoLojaAbsoluto ? "loja-hero-ritos" : ""}`}
      >
        <img
          src={usandoLojaAbsoluto ? "/SalaMarcos.webp" : "/loja-helena.webp"}
          alt="Loja"
          className="loja-hero-img"
          decoding="async"
        />

        <div className="loja-hero-overlay" />

        <button
          className="loja-voltar"
          onClick={voltarParaFicha}
          title="Voltar para ficha"
        >
          <Icon path={mdiArrowLeft} size={1} />
          Ficha
        </button>

        <div className="loja-hero-copy">
          <span className="loja-kicker">
            {usandoRitos
              ? "Conhecimento proibido"
              : usandoPoderes
                ? "Dons do Absoluto"
                : "Arsenal particular"}
          </span>

          <h1>
            {usandoRitos
              ? "Ritos Absolutos"
              : usandoPoderes
                ? "Poderes Absolutos"
                : "Loja da Helena"}
          </h1>

          <p>
            {usandoRitos
              ? "Fragmentos do Absoluto esquecidos entre simbolos, sangue e sacrificios."
              : usandoPoderes
                ? "Poderes marcados por vontade, dor e uma verdade que não deveria existir."
                : "Armas, defesas, recursos de campo para quem sabe que preparo tambem e sobrevivencia."}
          </p>
        </div>
      </section>

      <section className="loja-shell">
        <div className="loja-toolbar" aria-label="Categorias da loja">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className={`loja-categoria ${categoriaAtiva === categoria.id ? "ativa" : ""}`}
              onClick={() => {
                setCategoriaAtiva(categoria.id);
                setCarrinho([]);
                setMensagem("");

                if (categoria.id === "modificadores") {
                  setModAba("estoque");
                  setCategoriaAtiva("aprimoramento");
                }
              }}
            >
              <Icon path={categoria.icon} size={0.8} />
              {categoria.nome}
            </button>
          ))}
        </div>

        {usandoRitos && (
          <div className="ritos-subabas">
            <button
              className={nivelRitoAtivo === "iniciante" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("iniciante")}
            >
              I — Iniciante
            </button>
            <button
              className={nivelRitoAtivo === "intermediario" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("intermediario")}
            >
              II — Intermediário
            </button>
            <button
              className={nivelRitoAtivo === "avancado" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("avancado")}
            >
              III — Avançado
            </button>
            <button
              className={nivelRitoAtivo === "experiente" ? "ativa" : ""}
              onClick={() => setNivelRitoAtivo("experiente")}
            >
              IV — Experiente
            </button>
          </div>
        )}

        {categoriaAtiva === "maleta-campo" && (
          <div className="ritos-subabas maleta-subabas">
            <button
              className={subAbaMaleta === "medicinal" ? "ativa" : ""}
              onClick={() => setSubAbaMaleta("medicinal")}
            >
              Medicina
            </button>
            <button
              className={subAbaMaleta === "combate" ? "ativa" : ""}
              onClick={() => setSubAbaMaleta("combate")}
            >
              Combate
            </button>
            <button
              className={subAbaMaleta === "geral" ? "ativa" : ""}
              onClick={() => setSubAbaMaleta("geral")}
            >
              Gerais
            </button>
          </div>
        )}

        <div className="loja-layout">
          <div className="loja-catalogo">
            {categoriaAtiva === "aprimoramento"
              ? renderizarAprimoramento()
              : itensFiltrados.map((item) => (
                  <article
                    key={item.id}
                    className={`loja-item ${item.armaStatus ? "loja-arma" : ""}`}
                  >
                    <div>
                      <div className="loja-item-topo">
                        <div className="loja-item-icone" aria-hidden="true">
                          {renderizarIconeItem(item, 1.8)}{" "}
                        </div>

                        <span className={`loja-item-tipo ${item.categoria}`}>
                          {item.armaStatus?.tipo || item.categoria}
                        </span>
                      </div>

                      <h2>{item.nome}</h2>
                      <p>{item.detalhe}</p>

                      {item.armaStatus && (
                        <div className="arma-status-card">
                          <div className="arma-status-principais">
                            <div>
                              <span>DMG</span>
                              <strong>{item.armaStatus.dmg}</strong>
                            </div>
                            {item.armaStatus.tipo !== "Corpo a Corpo" && (
                              <>
                                <div>
                                  <span>ROF</span>
                                  <strong>{item.armaStatus.rof}</strong>
                                </div>
                                <div>
                                  <span>MAG</span>
                                  <strong>{item.armaStatus.mag}</strong>
                                </div>
                              </>
                            )}
                          </div>

                          {item.armaStatus.tipo !== "Corpo a Corpo" && (
                            <div className="arma-status-modos">
                              <div>
                                <span>HIPFIRE</span>
                                <strong>{item.armaStatus.hipfire}</strong>
                              </div>
                              <div>
                                <span>PRECISION</span>
                                <strong>{item.armaStatus.precision}</strong>
                              </div>
                              <div>
                                <span>CONTROL</span>
                                <strong>{item.armaStatus.control}</strong>
                              </div>
                              <div>
                                <span>MOBILITY</span>
                                <strong>{item.armaStatus.mobility}</strong>
                              </div>
                            </div>
                          )}

                          <div className="arma-status-extra">
                            {item.armaStatus.tipo !== "Corpo a Corpo" && (
                              <>
                                <span>
                                  Disparos:{" "}
                                  {item.armaStatus.disparosSemDesvantagem}
                                </span>
                                <span>Recarga: {item.armaStatus.recarga}</span>
                              </>
                            )}
                            <span>Crítico: {item.armaStatus.critico}</span>
                            <span>Cabeça: {item.armaStatus.danoCabeca}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="loja-item-footer">
                      <span className="loja-preco">{formatarPreco(item)}</span>
                      <button onClick={() => adicionarAoCarrinho(item)}>
                        <Icon path={mdiCart} size={0.75} />
                        Comprar
                      </button>
                    </div>
                  </article>
                ))}
          </div>

          <aside className="loja-carrinho" aria-label="Carrinho">
            <div className="loja-carrinho-topo">
              <div>
                <span>{usandoLojaAbsoluto ? "Mementos" : "Creditos"}</span>
                <strong>
                  {usandoLojaAbsoluto
                    ? `${saldoMementos} Mementos`
                    : `${saldo} cr`}
                </strong>
              </div>
              <Icon path={mdiCart} size={1.2} />
            </div>

            <div className="loja-carrinho-lista">
              {carrinho.length === 0 ? (
                <p className="loja-carrinho-vazio">Nenhum item separado.</p>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="loja-carrinho-item"
                  >
                    <span className="loja-carrinho-icone" aria-hidden="true">
                      <Icon path={obterIconeItem(item)} size={0.95} />
                    </span>

                    <div>
                      <strong>{item.nome}</strong>
                      <span>{formatarPreco(item)}</span>
                    </div>

                    <button
                      onClick={() => removerDoCarrinho(index)}
                      title="Remover"
                    >
                      <Icon path={mdiTrashCanOutline} size={0.7} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="loja-total">
              <span>Total</span>
              <strong>{formatarPreco(totalCarrinho)}</strong>
            </div>

            <button
              className="loja-finalizar"
              onClick={finalizarCompra}
              disabled={!podeComprar}
            >
              <Icon path={mdiCheck} size={0.8} />
              Finalizar compra
            </button>

            {mensagem && <p className="loja-mensagem">{mensagem}</p>}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default LojaHelena;
