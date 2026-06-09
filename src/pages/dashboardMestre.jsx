import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountPlus,
  mdiArrowLeft,
  mdiCashPlus,
  mdiDeleteOutline,
  mdiTrendingUp,
  mdiOpenInNew,
  mdiPackageVariantClosedPlus,
  mdiRefresh,
  mdiStoreCogOutline,
  mdiPencil,
} from "@mdi/js";
import "../CSS/DashboardMestre.css";
import {
  apagarPersonagem,
  buscarCatalogoLoja,
  criarPersonagem,
  listarPersonagens,
  salvarCatalogoLoja,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import { estadoInicial } from "./fichaPersonagem";
import {
  CATEGORIAS_LOJA,
  DEFAULT_CATALOGO_LOJA,
  normalizarItemLoja,
} from "../data/catalogoLoja";
import { obterCustosNivel } from "../data/evolucaoPersonagem";

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";

const fichaVazia = {
  nome: "",
  pronome: "Ele",
  classe: "",
  especialidade: "",
};

const itemInventarioVazio = {
  nome: "",
  detalhes: "",
};

const ritoVazio = {
  nome: "",
  custo: "",
};

const itemLojaVazio = {
  id: "",
  nome: "",
  categoria: "armas-fogo",
  preco: 0,
  detalhe: "",
  entrega: "",
  nivelRito: "iniciante",
  armaStatus: {
    tipo: "",
    dmg: "",
    rof: "",
    mag: "",
    disparosSemDesvantagem: "",
    recarga: "",
    critico: "",
    danoCabeca: "",
    hipfire: "",
    precision: "",
    control: "",
    mobility: "",
  },
};

const abasFicha = [
  { id: "perfil", nome: "Perfil" },
  { id: "ativos", nome: "Ativos" },
  { id: "passivos", nome: "Passivos" },
  { id: "ritos", nome: "Ritos" },
  { id: "inventario", nome: "Inventario" },
  { id: "corpo", nome: "Corpo" },
  { id: "descricao", nome: "Descricao" },
];

const ativosFicha = [
  { chave: "razao", nome: "Razao" },
  { chave: "firmeza", nome: "Firmeza" },
  { chave: "intuicao", nome: "Intuicao" },
  { chave: "violencia", nome: "Violencia" },
  { chave: "percepcao", nome: "Percepcao" },
  { chave: "carisma", nome: "Carisma" },
  { chave: "persistencia", nome: "Persistencia" },
  { chave: "resistencia", nome: "Resistencia" },
];

const passivosFicha = [
  { chave: "enganacao", nome: "Enganacao" },
  { chave: "raciocinioLogico", nome: "Raciocinio Logico" },
  { chave: "investigacao", nome: "Investigacao" },
  { chave: "instinto", nome: "Instinto" },
  { chave: "sensibilidade", nome: "Sensibilidade" },
  { chave: "instintoSobrevivencia", nome: "Instinto de Sobrevivencia" },
  { chave: "coragem", nome: "Coragem" },
  { chave: "diplomacia", nome: "Diplomacia" },
  { chave: "disciplina", nome: "Disciplina" },
  { chave: "autocontrole", nome: "Autocontrole" },
  { chave: "intimidacaoPassiva", nome: "Intimidacao Passiva" },
  { chave: "presenca", nome: "Presenca" },
  { chave: "memoria", nome: "Memoria" },
  { chave: "empatia", nome: "Empatia" },
  { chave: "lealdade", nome: "Lealdade" },
  { chave: "fe", nome: "Fe" },
  { chave: "vitalidade", nome: "Vitalidade" },
  { chave: "folego", nome: "Folego" },
  { chave: "equilibrio", nome: "Equilibrio" },
  { chave: "velocidade", nome: "Velocidade" },
  { chave: "precisao", nome: "Precisao" },
  { chave: "lutar", nome: "Lutar" },
  { chave: "resistenciaFisica", nome: "Resistencia Fisica" },
  { chave: "primeirosSocorros", nome: "Primeiros Socorros" },
  { chave: "furtividade", nome: "Furtividade" },
  { chave: "conhecimentoMedico", nome: "Conhecimento Medico" },
  { chave: "conhecimentoTecnico", nome: "Conhecimento Tecnico" },
  { chave: "conhecimentoHistorico", nome: "Conhecimento Historico" },
  { chave: "conhecimentoOculto", nome: "Conhecimento Oculto" },
  { chave: "tecnologia", nome: "Tecnologia" },
  { chave: "tatica", nome: "Tatica" },
  { chave: "percepcaoAuditiva", nome: "Percepcao Auditiva" },
  { chave: "percepcaoVisual", nome: "Percepcao Visual" },
  { chave: "percepcaoOlfativa", nome: "Percepcao Olfativa" },
  { chave: "crime", nome: "Crime" },
  { chave: "manipulacao", nome: "Manipulacao" },
  { chave: "intimidacao", nome: "Intimidacao" },
  { chave: "seducao", nome: "Seducao" },
  { chave: "resistenciaMental", nome: "Resistencia Mental" },
];

const membrosFicha = [
  { chave: "cabeca", nome: "Cabeca" },
  { chave: "torso", nome: "Torso" },
  { chave: "bracoDireito", nome: "Braco direito" },
  { chave: "bracoEsquerdo", nome: "Braco esquerdo" },
  { chave: "pernaDireita", nome: "Perna direita" },
  { chave: "pernaEsquerda", nome: "Perna esquerda" },
];

const normalizarFichaId = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const listarFichasLocais = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${STORAGE_KEY}_`))
    .map((key) => {
      const fichaId = key.replace(`${STORAGE_KEY}_`, "");
      try {
        return {
          fichaId,
          personagem: JSON.parse(localStorage.getItem(key)),
          updatedAt: null,
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.fichaId.localeCompare(b.fichaId));

const salvarFichaLocal = (fichaId, personagem) => {
  const chave = `${STORAGE_KEY}_${fichaId}`;

  try {
    localStorage.setItem(chave, JSON.stringify(personagem));
  } catch (error) {
    console.warn("LocalStorage cheio. Salvando sem foto de perfil.", error);

    const personagemSemFoto = {
      ...personagem,
      fotoPerfil: "",
    };

    try {
      localStorage.setItem(chave, JSON.stringify(personagemSemFoto));
    } catch (novoErro) {
      console.warn("Nao foi possivel salvar localmente.", novoErro);
    }
  }
};

const DashboardMestre = () => {
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState("");
  const [personagem, setPersonagem] = useState(null);
  const [novaFicha, setNovaFicha] = useState(fichaVazia);
  const [itemInventario, setItemInventario] = useState(itemInventarioVazio);
  const [novoRito, setNovoRito] = useState(ritoVazio);
  const [creditosDelta, setCreditosDelta] = useState(100);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [novoItemLoja, setNovoItemLoja] = useState(itemLojaVazio);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("todos");
  const [abaFicha, setAbaFicha] = useState("perfil");
  const [aba, setAba] = useState("fichas");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abaLojaEditor, setAbaLojaEditor] = useState("armas-fogo");
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [nivelRitoDashboard, setNivelRitoDashboard] = useState("iniciante");
  const [editandoDashboard, setEditandoDashboard] = useState(false);
  const [modalFichaAberto, setModalFichaAberto] = useState(false);

  const fichaAtual = useMemo(
    () => fichas.find((ficha) => ficha.fichaId === fichaSelecionada),
    [fichaSelecionada, fichas],
  );

  const categoriasFiltroLoja = useMemo(
    () => [{ id: "todos", nome: "Todos" }, ...CATEGORIAS_LOJA],
    [],
  );

  const catalogoFiltrado = useMemo(() => {
    if (categoriaLojaAtiva === "todos") {
      return catalogo;
    }

    return catalogo.filter((item) => item.categoria === categoriaLojaAtiva);
  }, [catalogo, categoriaLojaAtiva]);

  const carregarTudo = async () => {
    setCarregando(true);
    setMensagem("");

    try {
      const [fichasApi, catalogoApi] = await Promise.all([
        listarPersonagens(),
        buscarCatalogoLoja(),
      ]);

      const fichasNormalizadas = fichasApi.map((ficha) => ({
        ...ficha,
        personagem: {
          ...estadoInicial,
          ...(ficha.personagem || {}),
          lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
        },
      }));
      const categoriasObrigatorias = [
        "armas-fogo",
        "armas-corpo",
        "defesas",
        "itens",
        "ritos",
        "poderes",
      ];

      const catalogoApiAtualizado =
        Array.isArray(catalogoApi) &&
        categoriasObrigatorias.every((categoria) =>
          catalogoApi.some((item) => item.categoria === categoria),
        );

      const catalogoNormalizado =
        catalogoApi.length > 0 && catalogoApiAtualizado
          ? catalogoApi.map(normalizarItemLoja)
          : DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja);

      setFichas(fichasNormalizadas);
      setCatalogo(catalogoNormalizado);
      localStorage.setItem(
        CATALOGO_STORAGE_KEY,
        JSON.stringify(catalogoNormalizado),
      );

      if (fichasNormalizadas.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasNormalizadas[0].fichaId);
        setPersonagem(fichasNormalizadas[0].personagem);
      }
    } catch (error) {
      const fichasLocais = listarFichasLocais();
      const catalogoLocal = localStorage.getItem(CATALOGO_STORAGE_KEY);

      if (catalogoLocal) {
        try {
          const catalogoParseado = JSON.parse(catalogoLocal);

          const catalogoTemCategoriasNovas = catalogoParseado.some((item) =>
            [
              "armas-fogo",
              "armas-corpo",
              "defesas",
              "itens",
              "ritos",
              "poderes",
            ].includes(item.categoria),
          );

          if (catalogoTemCategoriasNovas) {
            setCatalogo(catalogoParseado.map(normalizarItemLoja));
          } else {
            localStorage.removeItem(CATALOGO_STORAGE_KEY);
            setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
          }
        } catch {
          localStorage.removeItem(CATALOGO_STORAGE_KEY);
          setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
        }
      }

      setFichas(fichasLocais);
      if (fichasLocais.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasLocais[0].fichaId);
        setPersonagem({
          ...estadoInicial,
          ...fichasLocais[0].personagem,
          lojaCreditos: fichasLocais[0].personagem?.lojaCreditos ?? 900,
        });
      }

      setMensagem(
        "Backend indisponivel. Mostrando dados locais deste navegador.",
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fichaSelecionada) return;

    const intervalo = setInterval(async () => {
      if (editandoDashboard) return;

      try {
        const personagemAtualizado = await buscarPersonagem(fichaSelecionada);

        if (!personagemAtualizado) return;

        const personagemFinal = {
          ...estadoInicial,
          ...personagemAtualizado,
          lojaCreditos: personagemAtualizado.lojaCreditos ?? 900,
        };

        setPersonagem(personagemFinal);

        setFichas((atuais) =>
          atuais.map((ficha) =>
            ficha.fichaId === fichaSelecionada
              ? { ...ficha, personagem: personagemFinal }
              : ficha,
          ),
        );
      } catch (error) {
        console.warn(
          "Nao foi possivel atualizar a ficha em tempo real.",
          error,
        );
      }
    }, 2000);

    return () => clearInterval(intervalo);
  }, [fichaSelecionada, editandoDashboard]);

  useEffect(() => {
    if (fichaAtual) {
      setPersonagem({
        ...estadoInicial,
        ...fichaAtual.personagem,
        lojaCreditos: fichaAtual.personagem?.lojaCreditos ?? 900,
      });
    }
  }, [fichaAtual]);

  const atualizarPersonagem = (campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarGrupoFicha = (grupo, chave, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [grupo]: {
        ...(atual?.[grupo] || {}),
        [chave]: parseInt(valor, 10) || 0,
      },
    }));
  };

  const atualizarMembro = (membro, campo, valor) => {
    setPersonagem((atual) => {
      const membroAtual = atual?.membros?.[membro] || {
        atual: 0,
        max: 0,
        ferido: false,
        grave: false,
      };
      const atualizado = {
        ...membroAtual,
        [campo]: Math.max(0, parseInt(valor, 10) || 0),
      };
      const proporcao =
        atualizado.max > 0 ? atualizado.atual / atualizado.max : 0;

      return {
        ...atual,
        membros: {
          ...(atual?.membros || {}),
          [membro]: {
            ...atualizado,
            ferido: atualizado.atual < atualizado.max && proporcao < 0.5,
            grave: proporcao <= 0.1,
          },
        },
      };
    });
  };

  const atualizarItemInventario = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      inventario: (atual.inventario || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [campo]: valor } : item,
      ),
    }));
  };

  const atualizarRito = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      rituais: (atual.rituais || []).map((rito, ritoIndex) =>
        ritoIndex === index ? { ...rito, [campo]: valor } : rito,
      ),
    }));
  };

  const salvarFichaSelecionada = async (personagemAtualizado = personagem) => {
    if (!fichaSelecionada || !personagemAtualizado) return;

    let fichaMaisRecente = {};

    try {
      const doBackend = await buscarPersonagem(fichaSelecionada);
      if (doBackend) fichaMaisRecente = doBackend;
    } catch {
      try {
        const local = localStorage.getItem(
          `${STORAGE_KEY}_${fichaSelecionada}`,
        );
        if (local) fichaMaisRecente = JSON.parse(local);
      } catch {}
    }

    const personagemFinal = {
      ...estadoInicial,
      ...fichaMaisRecente,
      ...personagemAtualizado,

      // CAMPOS DO JOGADOR — NÃO SOBRESCREVER PELO DASHBOARD
      membros: fichaMaisRecente.membros || personagemAtualizado.membros,
      sanidade: fichaMaisRecente.sanidade || personagemAtualizado.sanidade,
      esperanca: fichaMaisRecente.esperanca || personagemAtualizado.esperanca,
      fotoPerfil:
        fichaMaisRecente.fotoPerfil || personagemAtualizado.fotoPerfil,
    };

    salvarFichaLocal(fichaSelecionada, personagemFinal);
    setPersonagem(personagemFinal);

    setFichas((atuais) =>
      atuais.map((ficha) =>
        ficha.fichaId === fichaSelecionada
          ? { ...ficha, personagem: personagemFinal }
          : ficha,
      ),
    );

    try {
      await salvarPersonagem(fichaSelecionada, personagemFinal);
      setMensagem("Ficha salva. Alterações do jogador preservadas.");
    } catch {
      setMensagem("Ficha salva localmente sem foto. Backend indisponivel.");
    }
  };

  const criarNovaFicha = async (event) => {
    event.preventDefault();

    if (!novaFicha.nome.trim()) {
      setMensagem("Informe um nome para criar a ficha.");
      return;
    }

    const personagemCriado = {
      ...estadoInicial,
      ...novaFicha,
      nome: novaFicha.nome.trim(),
      classe: novaFicha.classe.trim(),
      especialidade: novaFicha.especialidade.trim(),
      lojaCreditos: 900,
      rituais: [],
      inventario: [],
    };

    try {
      const { fichaId, personagem: salvo } =
        await criarPersonagem(personagemCriado);
      salvarFichaLocal(fichaId, salvo);
      await carregarTudo();
      setFichaSelecionada(fichaId);
      setPersonagem(salvo);
      setNovaFicha(fichaVazia);
      setMensagem(`Ficha ${fichaId} criada.`);
    } catch (error) {
      const fichaId = normalizarFichaId(novaFicha.nome);
      salvarFichaLocal(fichaId, personagemCriado);
      setFichas((atuais) => [
        ...atuais,
        { fichaId, personagem: personagemCriado },
      ]);
      setFichaSelecionada(fichaId);
      setPersonagem(personagemCriado);
      setNovaFicha(fichaVazia);
      setMensagem("Ficha criada localmente. Backend indisponivel.");
    }
  };

  const apagarFichaSelecionada = async () => {
    if (!fichaSelecionada) return;

    const confirmado = window.confirm(`Apagar a ficha ${fichaSelecionada}?`);
    if (!confirmado) return;

    localStorage.removeItem(`${STORAGE_KEY}_${fichaSelecionada}`);

    try {
      await apagarPersonagem(fichaSelecionada);
    } catch (error) {
      setMensagem("Ficha removida localmente. Backend indisponivel.");
    }

    const restantes = fichas.filter(
      (ficha) => ficha.fichaId !== fichaSelecionada,
    );
    setFichas(restantes);
    setFichaSelecionada(restantes[0]?.fichaId || "");
    setPersonagem(restantes[0]?.personagem || null);
  };

  const adicionarCreditos = () => {
    const delta = parseInt(creditosDelta, 10) || 0;
    const atualizado = {
      ...personagem,
      lojaCreditos: Math.max(
        0,
        (parseInt(personagem.lojaCreditos, 10) || 0) + delta,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const subirNivelJogador = () => {
    const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
    const proximoNivel = Math.min(10, nivelAtual + 1);
    const pontosGanhos = obterCustosNivel(proximoNivel).acumulado;

    if (nivelAtual >= 10) {
      setMensagem("Este personagem ja esta no NV10.");
      return;
    }

    const atualizado = {
      ...personagem,
      nivel: proximoNivel,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis:
          (parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0) +
          pontosGanhos,
        acumulados:
          (parseInt(personagem.pontosEvolucao?.acumulados, 10) || 0) +
          pontosGanhos,
      },
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
    setMensagem(
      `Jogador subiu para NV${proximoNivel} e recebeu ${pontosGanhos} pontos.`,
    );
  };

  const adicionarItemInventario = (event) => {
    event.preventDefault();

    if (!itemInventario.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const atualizado = {
      ...personagem,
      inventario: [
        ...(personagem.inventario || []),
        {
          nome: itemInventario.nome.trim(),
          detalhes: itemInventario.detalhes.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setItemInventario(itemInventarioVazio);
    salvarFichaSelecionada(atualizado);
  };

  const removerItemInventario = (index) => {
    const atualizado = {
      ...personagem,
      inventario: (personagem.inventario || []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const adicionarRito = (event) => {
    event.preventDefault();

    if (!novoRito.nome.trim()) {
      setMensagem("Informe o nome do Rito.");
      return;
    }

    const atualizado = {
      ...personagem,
      rituais: [
        ...(personagem.rituais || []),
        {
          nome: novoRito.nome.trim(),
          custo: novoRito.custo.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setNovoRito(ritoVazio);
    salvarFichaSelecionada(atualizado);
  };

  const removerRito = (index) => {
    const atualizado = {
      ...personagem,
      rituais: (personagem.rituais || []).filter(
        (_, ritoIndex) => ritoIndex !== index,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const salvarCatalogo = async (catalogoAtualizado) => {
    const normalizado = catalogoAtualizado.map(normalizarItemLoja);
    setCatalogo(normalizado);
    localStorage.setItem(CATALOGO_STORAGE_KEY, JSON.stringify(normalizado));

    try {
      await salvarCatalogoLoja(normalizado);
      setMensagem("Catalogo da loja salvo.");
    } catch (error) {
      setMensagem("Catalogo salvo localmente. Backend indisponivel.");
    }
  };

  const adicionarItemLoja = (event) => {
    event.preventDefault();

    if (!novoItemLoja.nome.trim()) {
      setMensagem("Informe o nome do item da loja.");
      return;
    }

    salvarCatalogo([
      ...catalogo,
      normalizarItemLoja(novoItemLoja, catalogo.length),
    ]);
    setNovoItemLoja(itemLojaVazio);
  };

  const removerItemLoja = (id) => {
    salvarCatalogo(catalogo.filter((item) => item.id !== id));
  };

  const abasEditorLoja = [
    { id: "armas-fogo", nome: "Armas de fogo" },
    { id: "armas-corpo", nome: "Armas brancas" },
    { id: "itens", nome: "Itens" },
    { id: "ritos", nome: "Ritos Absolutos" },
    { id: "poderes", nome: "Poderes Absolutos" },
  ];

  const itensEditorLoja = catalogo.filter((item) => {
    if (item.categoria !== abaLojaEditor) {
      return false;
    }

    if (abaLojaEditor === "ritos") {
      return (item.nivelRito || "iniciante") === nivelRitoDashboard;
    }

    return true;
  });

  const gerarIdItemLoja = (nome, categoria) =>
    `${categoria}-${nome}`
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const limparEditorLoja = () => {
    setNovoItemLoja({
      ...itemLojaVazio,
      categoria: abaLojaEditor,
    });
    setItemEditandoId(null);
  };

  const atualizarCampoLoja = (campo, valor) => {
    setNovoItemLoja((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarArmaStatusLoja = (campo, valor) => {
    setNovoItemLoja((atual) => ({
      ...atual,
      armaStatus: {
        ...(atual.armaStatus || {}),
        [campo]: valor,
      },
    }));
  };

  const editarItemLoja = (item) => {
    setItemEditandoId(item.id);
    setAbaLojaEditor(item.categoria);

    if (item.categoria === "ritos") {
      setNivelRitoDashboard(item.nivelRito || "iniciante");
    }

    setNovoItemLoja({
      ...itemLojaVazio,
      ...item,
      armaStatus: {
        ...itemLojaVazio.armaStatus,
        ...(item.armaStatus || {}),
      },
    });
  };

  const salvarItemLojaEditor = (event) => {
    event.preventDefault();

    if (!novoItemLoja.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const itemBase = {
      ...novoItemLoja,
      categoria: abaLojaEditor,
      id: itemEditandoId || gerarIdItemLoja(novoItemLoja.nome, abaLojaEditor),
      preco: Math.max(0, parseInt(novoItemLoja.preco, 10) || 0),
    };

    const itemFinal = {
      ...itemBase,
      armaStatus: abaLojaEditor === "armas-fogo" ? itemBase.armaStatus : null,
      nivelRito:
        abaLojaEditor === "ritos" ? itemBase.nivelRito || "iniciante" : "",
    };

    const catalogoAtualizado = itemEditandoId
      ? catalogo.map((item) =>
          item.id === itemEditandoId ? normalizarItemLoja(itemFinal) : item,
        )
      : [...catalogo, normalizarItemLoja(itemFinal, catalogo.length)];

    salvarCatalogo(catalogoAtualizado);
    limparEditorLoja();
  };

  return (
    <main className="mestre-page">
      <header className="mestre-header">
        <button
          className="mestre-voltar"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <Icon path={mdiArrowLeft} size={0.9} />
          Inicio
        </button>
        <div>
          <span>Controle do narrador</span>
          <h1>Dashboard do Mestre</h1>
        </div>
        <button
          className="mestre-refresh"
          onClick={carregarTudo}
          disabled={carregando}
        >
          <Icon path={mdiRefresh} size={0.9} />
          {carregando ? "Carregando" : "Atualizar"}
        </button>
      </header>

      {mensagem && <p className="mestre-mensagem">{mensagem}</p>}

      <nav className="mestre-tabs" aria-label="Areas do dashboard">
        <button
          className={aba === "fichas" ? "ativa" : ""}
          onClick={() => setAba("fichas")}
        >
          Fichas
        </button>
        <button
          className={aba === "loja" ? "ativa" : ""}
          onClick={() => setAba("loja")}
        >
          Loja
        </button>
      </nav>

      {aba === "fichas" && (
        <section className="mestre-dashboard-full">
          <div className="mestre-dashboard-cards">
            {fichas.map((ficha) => {
              const personagemCard = ficha.personagem || {};
              const membros = personagemCard.membros || {};

              const vidaAtual = Object.values(membros).reduce(
                (total, membro) => total + (membro?.atual || 0),
                0,
              );

              const vidaMax = Object.values(membros).reduce(
                (total, membro) => total + (membro?.max || 0),
                0,
              );

              return (
                <button
                  key={ficha.fichaId}
                  className={`mestre-card-personagem ${
                    fichaSelecionada === ficha.fichaId ? "ativo" : ""
                  }`}
                  onClick={() => {
                    setFichaSelecionada(ficha.fichaId);
                    setPersonagem({
                      ...estadoInicial,
                      ...personagemCard,
                      lojaCreditos: personagemCard.lojaCreditos ?? 900,
                    });
                    setModalFichaAberto(true);
                  }}
                >
                  <div className="mestre-card-topo">
                    <img
                      src={
                        personagemCard.fotoPerfil ||
                        "https://placehold.co/300x300"
                      }
                      alt={personagemCard.nome}
                      className="mestre-card-foto"
                    />

                    <div className="mestre-card-info">
                      <h3>{personagemCard.nome || ficha.fichaId}</h3>

                      <span>{personagemCard.classe || "Sem classe"}</span>

                      <small>NV {personagemCard.nivel || 1}</small>
                    </div>
                  </div>

                  <div className="mestre-card-atributos">
                    {Object.entries(personagemCard.atributos || {})
                      .slice(0, 5)
                      .map(([atributo, valor]) => (
                        <div key={atributo}>
                          <span>{atributo.slice(0, 3).toUpperCase()}</span>
                          <strong>{valor}</strong>
                        </div>
                      ))}
                  </div>

                  <div className="mestre-card-barras">
                    <div>
                      <label>VIDA</label>

                      <div className="barra vermelho">
                        <span
                          style={{
                            width: `${
                              vidaMax > 0 ? (vidaAtual / vidaMax) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {vidaAtual} / {vidaMax}
                      </small>
                    </div>

                    <div>
                      <label>SANIDADE</label>

                      <div className="barra roxo">
                        <span
                          style={{
                            width: `${
                              personagemCard.sanidade?.max > 0
                                ? (personagemCard.sanidade?.atual /
                                    personagemCard.sanidade?.max) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {personagemCard.sanidade?.atual || 0} /{" "}
                        {personagemCard.sanidade?.max || 0}
                      </small>
                    </div>

                    <div>
                      <label>ESPERANÇA</label>

                      <div className="barra dourado">
                        <span
                          style={{
                            width: `${
                              personagemCard.esperanca?.max > 0
                                ? (personagemCard.esperanca?.atual /
                                    personagemCard.esperanca?.max) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {personagemCard.esperanca?.atual || 0} /{" "}
                        {personagemCard.esperanca?.max || 0}
                      </small>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {modalFichaAberto && personagem && (
            <div
              className="mestre-modal-overlay"
              onClick={() => setModalFichaAberto(false)}
            >
              <section
                className="mestre-modal-ficha minimalista"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="mestre-modal-header">
                  <div className="mestre-modal-header-esquerda">
                    <img
                      src={
                        personagem.fotoPerfil || "https://placehold.co/300x300"
                      }
                      alt={personagem.nome}
                      className="mestre-modal-foto"
                    />

                    <div className="mestre-modal-identidade">
                      <span>PERSONAGEM</span>

                      <h2>{personagem.nome || "Sem Nome"}</h2>

                      <small>
                        {personagem.classe || "Sem Classe"} • NV{" "}
                        {personagem.nivel || 1}
                      </small>
                    </div>
                  </div>

                  <button
                    className="mestre-modal-fechar"
                    onClick={() => setModalFichaAberto(false)}
                  >
                    ×
                  </button>
                </header>

                {/* ATRIBUTOS */}
                <section className="mestre-modal-bloco full">
                  <div className="mestre-modal-linha-topo">
                    <span>Atributos</span>

                    <button
                      className="mestre-abrir-ficha"
                      onClick={() => {
                        window.open(
                          `/?ficha=${encodeURIComponent(fichaSelecionada)}`,
                          "_blank",
                        );
                      }}
                    >
                      Abrir ficha
                    </button>
                  </div>

                  <div className="mestre-modal-atributos linha">
                    {Object.entries(personagem.atributos || {}).map(
                      ([atributo, valor]) => (
                        <div key={atributo}>
                          <small>{atributo}</small>
                          <strong>{valor}</strong>
                        </div>
                      ),
                    )}
                  </div>
                </section>

                {/* SANIDADE + ESPERANÇA */}
                <section className="mestre-modal-recursos">
                  <div className="mestre-modal-bloco">
                    <span>Sanidade</span>

                    <div className="mestre-barra-container">
                      <div className="mestre-barra roxo">
                        <span
                          style={{
                            width: `${
                              personagem.sanidade?.max > 0
                                ? (personagem.sanidade?.atual /
                                    personagem.sanidade?.max) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <strong>
                        {personagem.sanidade?.atual || 0} /{" "}
                        {personagem.sanidade?.max || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="mestre-modal-bloco">
                    <span>Esperança</span>

                    <div className="mestre-barra-container">
                      <div className="mestre-barra dourado">
                        <span
                          style={{
                            width: `${
                              personagem.esperanca?.max > 0
                                ? (personagem.esperanca?.atual /
                                    personagem.esperanca?.max) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <strong>
                        {personagem.esperanca?.atual || 0} /{" "}
                        {personagem.esperanca?.max || 0}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* CORPO */}
                <section className="mestre-modal-bloco full">
                  <span>Integridade Corporal</span>

                  <div className="mestre-corpo-grid">
                    {Object.entries(personagem.membros || {}).map(
                      ([membro, dados]) => (
                        <div key={membro} className="mestre-corpo-item">
                          <small>{membro}</small>

                          <div className="mestre-barra vermelho">
                            <span
                              style={{
                                width: `${
                                  dados.max > 0
                                    ? (dados.atual / dados.max) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>

                          <strong>
                            {dados.atual} / {dados.max}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </section>

                {/* PASSIVAS */}
                <section className="mestre-modal-bloco full">
                  <span>Passivas</span>

                  <div className="mestre-passivas-grid">
                    {Object.entries(personagem.habilidadesPassivas || {}).map(
                      ([nome, valor]) => (
                        <div key={nome} className="mestre-passiva-item">
                          <small>{nome}</small>
                          <strong>{valor}</strong>
                        </div>
                      ),
                    )}
                  </div>
                </section>

                {/* INVENTÁRIO */}
                <section className="mestre-modal-bloco full">
                  <span>Inventário</span>

                  <div className="mestre-inventario-grid">
                    {(personagem.inventario || []).map((item, index) => (
                      <div
                        key={`${item.nome}-${index}`}
                        className="mestre-item-card"
                      >
                        <strong>{item.nome}</strong>

                        <small>{item.tipo}</small>
                      </div>
                    ))}
                  </div>
                </section>

                {/* RITOS */}
                <section className="mestre-modal-bloco full">
                  <span>Ritos</span>

                  <div className="mestre-inventario-grid">
                    {(personagem.rituais || []).map((rito, index) => (
                      <div
                        key={`${rito.nome}-${index}`}
                        className={`mestre-item-card ${
                          rito.ativo ? "ativo" : ""
                        }`}
                      >
                        <strong>{rito.nome}</strong>

                        <small>{rito.nivel}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            </div>
          )}
        </section>
      )}

      {aba === "loja" && (
        <section className="mestre-loja">
          <div className="mestre-loja-editor-topo">
            <h2>
              <Icon path={mdiStoreCogOutline} size={0.95} />
              Editor da Loja
            </h2>
          </div>

          <nav className="mestre-ficha-tabs">
            {abasEditorLoja.map((abaItem) => (
              <button
                key={abaItem.id}
                className={abaLojaEditor === abaItem.id ? "ativa" : ""}
                onClick={() => {
                  setAbaLojaEditor(abaItem.id);

                  setNovoItemLoja({
                    ...itemLojaVazio,
                    categoria: abaItem.id,
                    nivelRito:
                      abaItem.id === "ritos" ? nivelRitoDashboard : "iniciante",
                  });

                  setItemEditandoId(null);
                }}
              >
                {abaItem.nome}
              </button>
            ))}
          </nav>

          <form className="mestre-loja-form" onSubmit={salvarItemLojaEditor}>
            <h3>
              {itemEditandoId ? "Editando" : "Adicionando"}{" "}
              {abasEditorLoja.find((a) => a.id === abaLojaEditor)?.nome}
            </h3>

            <div className="mestre-form-grid">
              <label>
                Nome
                <input
                  value={novoItemLoja.nome}
                  onChange={(event) =>
                    atualizarCampoLoja("nome", event.target.value)
                  }
                />
              </label>

              <label>
                Preço
                <input
                  type="number"
                  min="0"
                  value={novoItemLoja.preco}
                  onChange={(event) =>
                    atualizarCampoLoja("preco", event.target.value)
                  }
                />
              </label>

              <label>
                Entrega / Custo
                <textarea
                  className={
                    abaLojaEditor === "ritos" ? "textarea-rito-descricao" : ""
                  }
                  value={novoItemLoja.detalhe}
                  onChange={(event) =>
                    atualizarCampoLoja("detalhe", event.target.value)
                  }
                />
              </label>

              {abaLojaEditor === "ritos" && (
                <nav className="mestre-ritos-niveis-tabs">
                  <label>Niveis do Absoluto</label>
                  {[
                    { id: "iniciante", nome: "I — Iniciante" },
                    { id: "intermediario", nome: "II — Intermediário" },
                    { id: "avancado", nome: "III — Avançado" },
                    { id: "experiente", nome: "IV — Experiente" },
                  ].map((nivel) => (
                    <button
                      key={nivel.id}
                      type="button"
                      className={nivelRitoDashboard === nivel.id ? "ativa" : ""}
                      onClick={() => {
                        setNivelRitoDashboard(nivel.id);
                        setNovoItemLoja((atual) => ({
                          ...atual,
                          categoria: "ritos",
                          nivelRito: nivel.id,
                        }));
                        setItemEditandoId(null);
                      }}
                    >
                      {nivel.nome}
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <label>
              Descrição / Detalhe
              <textarea
                value={novoItemLoja.detalhe}
                onChange={(event) =>
                  atualizarCampoLoja("detalhe", event.target.value)
                }
              />
            </label>

            {abaLojaEditor === "poderes" && (
              <label>
                Absolutismo
                <textarea
                  value={novoItemLoja.entrega}
                  onChange={(event) =>
                    atualizarCampoLoja("entrega", event.target.value)
                  }
                  placeholder="Absolutismo: ..."
                />
              </label>
            )}

            {abaLojaEditor === "armas-fogo" && (
              <div className="mestre-arma-status-editor">
                <h4>Características da arma</h4>

                <div className="mestre-form-grid">
                  <label>
                    Tipo
                    <input
                      value={novoItemLoja.armaStatus?.tipo || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("tipo", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    DMG
                    <input
                      value={novoItemLoja.armaStatus?.dmg || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("dmg", event.target.value)
                      }
                      placeholder="2d6"
                    />
                  </label>

                  <label>
                    ROF
                    <input
                      value={novoItemLoja.armaStatus?.rof || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("rof", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    MAG
                    <input
                      value={novoItemLoja.armaStatus?.mag || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("mag", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Disparos sem desvantagem
                    <input
                      value={
                        novoItemLoja.armaStatus?.disparosSemDesvantagem || ""
                      }
                      onChange={(event) =>
                        atualizarArmaStatusLoja(
                          "disparosSemDesvantagem",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Recarga
                    <input
                      value={novoItemLoja.armaStatus?.recarga || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("recarga", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Crítico
                    <input
                      value={novoItemLoja.armaStatus?.critico || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("critico", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Dano Cabeça
                    <input
                      value={novoItemLoja.armaStatus?.danoCabeca || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja(
                          "danoCabeca",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Hipfire
                    <input
                      value={novoItemLoja.armaStatus?.hipfire || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("hipfire", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Precision
                    <input
                      value={novoItemLoja.armaStatus?.precision || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("precision", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Control
                    <input
                      value={novoItemLoja.armaStatus?.control || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("control", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Mobility
                    <input
                      value={novoItemLoja.armaStatus?.mobility || ""}
                      onChange={(event) =>
                        atualizarArmaStatusLoja("mobility", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="mestre-loja-form-acoes">
              <button type="submit">
                {itemEditandoId ? "Salvar alterações" : "Adicionar ao catálogo"}
              </button>

              {itemEditandoId && (
                <button type="button" onClick={limparEditorLoja}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="mestre-catalogo-area">
            <div className="mestre-catalogo">
              {itensEditorLoja.map((item) => (
                <article key={item.id} className="mestre-catalogo-item">
                  <div>
                    <span>{item.categoria}</span>
                    <h3>{item.nome}</h3>
                    <p>{item.detalhe}</p>
                    <small>{item.entrega}</small>

                    {item.armaStatus && (
                      <small>
                        DMG: {item.armaStatus.dmg} | MAG: {item.armaStatus.mag}{" "}
                        | CRIT: {item.armaStatus.critico}
                      </small>
                    )}

                    {item.nivelRito && <small>Nível: {item.nivelRito}</small>}
                  </div>

                  <strong>{item.preco} cr</strong>

                  <div className="mestre-catalogo-acoes">
                    <button
                      type="button"
                      className="mestre-botao-editar"
                      onClick={() => editarItemLoja(item)}
                    >
                      <Icon path={mdiPencil} size={0.8} color="#ffffff" />
                    </button>

                    <button
                      type="button"
                      className="perigo"
                      onClick={() => removerItemLoja(item.id)}
                    >
                      <Icon path={mdiDeleteOutline} size={0.8} />
                    </button>
                  </div>
                </article>
              ))}

              {itensEditorLoja.length === 0 && (
                <div className="mestre-catalogo-vazio">
                  Nenhum item nesta categoria.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default DashboardMestre;
