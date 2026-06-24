import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  mdiContentCopy,
} from "@mdi/js";
import "../CSS/DashboardMestre.css";
import {
  apagarPersonagem,
  buscarArvoresHabilidades,
  buscarCatalogoLoja,
  criarPersonagem,
  listarPersonagens,
  salvarArvoresHabilidades,
  salvarCatalogoLoja,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import {
  notificarArvoresAtualizadas,
  notificarPersonagemAtualizado,
  ouvirArvoresAtualizadas,
  ouvirPersonagemAtualizado,
} from "../services/syncEvents";
import { estadoInicial } from "./fichaPersonagem";
import {
  carregarArvoresCustom,
  obterTodasArvores,
  salvarArvoresCustom,
} from "../data/Classes/arvoresHabilidades";
import {
  CATEGORIAS_LOJA,
  DEFAULT_CATALOGO_LOJA,
  normalizarItemLoja,
} from "../data/catalogoLoja";
import {
  calcularGanhoRecursosNivel,
  obterCustosNivel,
} from "../data/evolucaoPersonagem";

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

const numeroRomanoDashboard = (numero) => {
  const romanos = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];

  let n = Math.max(1, parseInt(numero, 10) || 1);
  let resultado = "";

  romanos.forEach(([letra, valor]) => {
    while (n >= valor) {
      resultado += letra;
      n -= valor;
    }
  });

  return resultado;
};

const porcentagemRecurso = (atual = 0, max = 0) =>
  max > 0 ? `${Math.min(100, Math.max(0, (atual / max) * 100))}%` : "0%";

const DashboardFichaCard = memo(({ ficha, tipo = "jogador", onAbrir }) => {
  const personagemCard = ficha.personagem || ficha;
  const membros = personagemCard.membros || {};
  const imagem =
    personagemCard.fotoPerfil || "https://placehold.co/600x800?text=Sem+Foto";

  return (
    <article
      className="mestre-card-personagem"
      onClick={() => onAbrir(ficha, tipo)}
      style={{ backgroundImage: `url(${imagem})` }}
    >
      <div className="mestre-card-overlay" />

      <div className="mestre-card-conteudo">
        <div className="mestre-card-info">
          <small>
            NV{" "}
            {tipo === "inimigo"
              ? numeroRomanoDashboard(personagemCard.nivel)
              : personagemCard.nivel || 1}
          </small>{" "}
          <h3>{personagemCard.nome || "Sem nome"}</h3>
          <span>{personagemCard.classe || "Sem classe"}</span>
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
          <div className="mestre-card-membros">
            <label>INTEGRIDADE</label>

            {membrosFicha.map(({ chave, nome }) => {
              const dados = membros[chave] || { atual: 0, max: 0 };

              return (
                <div key={chave} className="mestre-card-membro-mini">
                  <span>{nome}</span>

                  <div className="barra vermelho">
                    <span
                      style={{
                        width: porcentagemRecurso(dados.atual, dados.max),
                      }}
                    />
                  </div>

                  <small>
                    {dados.atual || 0} / {dados.max || 0}
                  </small>
                </div>
              );
            })}
          </div>

          <div>
            <label>SANIDADE</label>
            <div className="barra roxo">
              <span
                style={{
                  width: porcentagemRecurso(
                    personagemCard.sanidade?.atual,
                    personagemCard.sanidade?.max,
                  ),
                }}
              />
            </div>
            <small>
              {personagemCard.sanidade?.atual || 0} /{" "}
              {personagemCard.sanidade?.max || 0}
            </small>
          </div>

          {tipo === "jogador" && (
            <div>
              <label>ESPERANCA</label>
              <div className="barra dourado">
                <span
                  style={{
                    width: porcentagemRecurso(
                      personagemCard.esperanca?.atual,
                      personagemCard.esperanca?.max,
                    ),
                  }}
                />
              </div>
              <small>
                {personagemCard.esperanca?.atual || 0} /{" "}
                {personagemCard.esperanca?.max || 0}
              </small>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

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
  const [ritosCreditosDelta, setRitosCreditosDelta] = useState(100);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [novoItemLoja, setNovoItemLoja] = useState(itemLojaVazio);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("todos");
  const [abaFicha, setAbaFicha] = useState("perfil");
  const [aba, setAba] = useState("campanha");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abaLojaEditor, setAbaLojaEditor] = useState("armas-fogo");
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [nivelRitoDashboard, setNivelRitoDashboard] = useState("iniciante");
  const [editandoDashboard, setEditandoDashboard] = useState(false);
  const [modalFichaAberto, setModalFichaAberto] = useState(false);

  const [arvoresEditor, setArvoresEditor] = useState({});
  const [classeArvoreAtiva, setClasseArvoreAtiva] = useState("aniquilador");
  const [tipoHabilidadeEditor, setTipoHabilidadeEditor] = useState("absolutas");
  const [especialidadeEditorId, setEspecialidadeEditorId] = useState("");
  const [habilidadeEditando, setHabilidadeEditando] = useState(null);

  const STORAGE_INIMIGOS = "darkness_inimigos";

  const [inimigos, setInimigos] = useState([]);
  const [inimigoEditando, setInimigoEditando] = useState(null);

  const STORAGE_NPCS = "darkness_npcs";

  const [subAbaFichas, setSubAbaFichas] = useState("jogadores");
  const [npcs, setNpcs] = useState([]);
  const [npcEditando, setNpcEditando] = useState(null);

  const [party, setParty] = useState(null);
  const [partyCode, setPartyCode] = useState("");
  const [partyMensagem, setPartyMensagem] = useState("");

  const STORAGE_CAMPANHA = "darkness_campanha";

  const [campanhaItens, setCampanhaItens] = useState([]);
  const [campanhaEditando, setCampanhaEditando] = useState(null);
  const [filtroCampanha, setFiltroCampanha] = useState("todos");

  const [popup, setPopup] = useState(null);

  const abrirPopup = ({
    tipo = "info",
    titulo,
    mensagem,
    confirmarTexto = "Confirmar",
    onConfirmar,
  }) => {
    setPopup({
      tipo,
      titulo,
      mensagem,
      confirmarTexto,
      onConfirmar,
    });
  };

  const fecharPopup = () => setPopup(null);

  const confirmarPopup = () => {
    const acao = popup?.onConfirmar;

    fecharPopup();

    setTimeout(() => {
      if (acao) acao();
    }, 0);
  };

  const [formHabilidade, setFormHabilidade] = useState({
    id: "",
    nome: "",
    custo: "",
    descricao: "",
  });

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
      const [fichasApi, catalogoApi, arvoresApi] = await Promise.all([
        listarPersonagens(),
        buscarCatalogoLoja(),
        buscarArvoresHabilidades(),
      ]);

      const novo = {
        ...estadoInicial,
        id: crypto.randomUUID(),
        nome: "Novo Inimigo",
        classe: "Inimigo",
        nivel: 1,
        defesa: 10,
        ataques: [],
        habilidades: [],
      };

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

      const arvoresLocais = carregarArvoresCustom();
      const arvoresCompartilhadas =
        Object.keys(arvoresApi || {}).length > 0 ? arvoresApi : arvoresLocais;

      setFichas(fichasNormalizadas);
      setCatalogo(catalogoNormalizado);
      salvarArvoresCustom(arvoresCompartilhadas);
      setArvoresEditor(obterTodasArvores());

      if (
        Object.keys(arvoresApi || {}).length === 0 &&
        Object.keys(arvoresLocais).length > 0
      ) {
        salvarArvoresHabilidades(arvoresLocais).catch((error) => {
          console.warn("Nao foi possivel publicar arvores locais.", error);
        });
      }

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
      setArvoresEditor(obterTodasArvores());

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
        `Backend indisponivel: ${error?.message || "erro desconhecido"}. Mostrando dados locais deste navegador.`,
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

    const sincronizarFichaSelecionada = async ({
      fichaId: fichaAtualizada,
    } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaSelecionada) return;
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
    };

    const intervalo = setInterval(sincronizarFichaSelecionada, 8000);
    const pararPersonagem = ouvirPersonagemAtualizado(
      sincronizarFichaSelecionada,
    );

    return () => {
      clearInterval(intervalo);
      pararPersonagem();
    };
  }, [fichaSelecionada, editandoDashboard]);

  useEffect(() => {
    let cancelado = false;

    const sincronizarListas = async () => {
      try {
        const [fichasApi, arvoresApi] = await Promise.all([
          listarPersonagens(),
          buscarArvoresHabilidades().catch(() => null),
        ]);

        if (cancelado) return;

        setFichas(
          fichasApi.map((ficha) => ({
            ...ficha,
            personagem: {
              ...estadoInicial,
              ...(ficha.personagem || {}),
              lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
            },
          })),
        );

        if (arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setArvoresEditor(obterTodasArvores());
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar o dashboard.", error);
      }
    };

    const sincronizarArvores = async ({ arvores } = {}) => {
      if (arvores && Object.keys(arvores).length > 0) {
        salvarArvoresCustom(arvores);
        setArvoresEditor(obterTodasArvores());
        return;
      }

      try {
        const arvoresApi = await buscarArvoresHabilidades();
        if (!cancelado && arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setArvoresEditor(obterTodasArvores());
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar arvores.", error);
      }
    };

    const pararPersonagem = ouvirPersonagemAtualizado(sincronizarListas);
    const pararArvores = ouvirArvoresAtualizadas(sincronizarArvores);
    const intervalo = setInterval(sincronizarListas, 15000);

    const aoVoltarFoco = () => {
      if (!document.hidden) {
        sincronizarListas();
      }
    };

    document.addEventListener("visibilitychange", aoVoltarFoco);

    return () => {
      cancelado = true;
      pararPersonagem();
      pararArvores();
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltarFoco);
    };
  }, []);

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

  const gerarIdHabilidade = (nome) =>
    String(nome || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const salvarArvoresEditor = (novasArvores) => {
    setArvoresEditor(novasArvores);
    salvarArvoresCustom(novasArvores);
    notificarArvoresAtualizadas(novasArvores);
    salvarArvoresHabilidades(novasArvores).then((arvoresSalvas) => {
      notificarArvoresAtualizadas(arvoresSalvas || novasArvores);
    }).catch((error) => {
      console.warn("Backend indisponivel. Arvore salva localmente.", error);
      setMensagem("Arvore salva localmente. Backend indisponivel.");
    });
    setMensagem("Árvore de habilidades salva.");
  };

  const limparFormHabilidade = () => {
    setFormHabilidade({
      id: "",
      nome: "",
      custo: "",
      descricao: "",
    });
    setHabilidadeEditando(null);
  };

  const salvarHabilidadeEditor = (event) => {
    event.preventDefault();

    if (!formHabilidade.nome.trim()) {
      setMensagem("Informe o nome da habilidade.");
      return;
    }

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];

    if (!arvoreAtual) return;

    const novaHabilidade = {
      id: formHabilidade.id || gerarIdHabilidade(formHabilidade.nome),
      nome: formHabilidade.nome.trim(),
      custo: formHabilidade.custo.trim(),
      descricao: formHabilidade.descricao.trim(),
    };

    const novasArvores = { ...arvoresEditor };

    if (tipoHabilidadeEditor === "especialidade") {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        especialidades: (arvoreAtual.especialidades || []).map((esp) => {
          if (esp.id !== especialidadeEditorId) return esp;

          const habilidades = esp.habilidades || [];

          return {
            ...esp,
            habilidades: habilidadeEditando
              ? habilidades.map((hab) =>
                  hab.id === habilidadeEditando ? novaHabilidade : hab,
                )
              : [...habilidades, novaHabilidade],
          };
        }),
      };
    } else {
      const lista = arvoreAtual[tipoHabilidadeEditor] || [];

      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        [tipoHabilidadeEditor]: habilidadeEditando
          ? lista.map((hab) =>
              hab.id === habilidadeEditando ? novaHabilidade : hab,
            )
          : [...lista, novaHabilidade],
      };
    }

    salvarArvoresEditor(novasArvores);
    limparFormHabilidade();
  };

  const editarHabilidadeEditor = (habilidade) => {
    setHabilidadeEditando(habilidade.id);
    setFormHabilidade({
      id: habilidade.id,
      nome: habilidade.nome || "",
      custo: habilidade.custo || "",
      descricao: habilidade.descricao || "",
    });
  };

  const excluirHabilidadeEditor = (habilidadeId) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir habilidade",
      mensagem: "Deseja excluir esta habilidade permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
        const arvoreAtual = arvoresEditor[classeArvoreAtiva];
        const novasArvores = { ...arvoresEditor };

        if (tipoHabilidadeEditor === "especialidade") {
          novasArvores[classeArvoreAtiva] = {
            ...arvoreAtual,
            especialidades: (arvoreAtual.especialidades || []).map((esp) =>
              esp.id === especialidadeEditorId
                ? {
                    ...esp,
                    habilidades: (esp.habilidades || []).filter(
                      (hab) => hab.id !== habilidadeId,
                    ),
                  }
                : esp,
            ),
          };
        } else {
          novasArvores[classeArvoreAtiva] = {
            ...arvoreAtual,
            [tipoHabilidadeEditor]: (
              arvoreAtual[tipoHabilidadeEditor] || []
            ).filter((hab) => hab.id !== habilidadeId),
          };
        }

        salvarArvoresEditor(novasArvores);
        abrirPopup({
          titulo: "Habilidade excluída",
          mensagem: "A habilidade foi removida com sucesso.",
        });
      },
    });

    return;

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];
    const novasArvores = { ...arvoresEditor };

    if (tipoHabilidadeEditor === "especialidade") {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        especialidades: (arvoreAtual.especialidades || []).map((esp) =>
          esp.id === especialidadeEditorId
            ? {
                ...esp,
                habilidades: (esp.habilidades || []).filter(
                  (hab) => hab.id !== habilidadeId,
                ),
              }
            : esp,
        ),
      };
    } else {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        [tipoHabilidadeEditor]: (
          arvoreAtual[tipoHabilidadeEditor] || []
        ).filter((hab) => hab.id !== habilidadeId),
      };
    }

    salvarArvoresEditor(novasArvores);
  };

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_INIMIGOS)) || [];
      setInimigos(dados);
    } catch {
      setInimigos([]);
    }
  }, []);

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_NPCS)) || [];
      setNpcs(dados);
    } catch {
      setNpcs([]);
    }
  }, []);

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_CAMPANHA)) || [];
      setCampanhaItens(dados);
    } catch {
      setCampanhaItens([]);
    }
  }, []);

  const salvarCampanha = (novaLista) => {
    setCampanhaItens(novaLista);
    localStorage.setItem(STORAGE_CAMPANHA, JSON.stringify(novaLista));
  };

  const criarItemCampanha = (tipo = "documento") => {
    const novo = {
      id: crypto.randomUUID(),
      tipo,
      titulo: "Novo documento",
      subtitulo: "",
      conteudo: "",
      tags: "",
      importante: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    salvarCampanha([novo, ...campanhaItens]);
    setCampanhaEditando(novo.id);
  };

  const atualizarItemCampanha = (id, dados) => {
    salvarCampanha(
      campanhaItens.map((item) =>
        item.id === id
          ? {
              ...item,
              ...dados,
              atualizadoEm: new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  const duplicarItemCampanha = (item) => {
    const copia = {
      ...structuredClone(item),
      id: crypto.randomUUID(),
      titulo: `${item.titulo} (Cópia)`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    salvarCampanha([copia, ...campanhaItens]);
  };

  const excluirItemCampanha = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir registro da campanha",
      mensagem: "Deseja excluir este conteúdo da campanha permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
        salvarCampanha(campanhaItens.filter((item) => item.id !== id));
        setCampanhaEditando(null);
      },
    });
  };

  const campanhaFiltrada =
    filtroCampanha === "todos"
      ? campanhaItens
      : campanhaItens.filter((item) => item.tipo === filtroCampanha);

  const salvarListaNpcs = (novaLista) => {
    setNpcs(novaLista);
    localStorage.setItem(STORAGE_NPCS, JSON.stringify(novaLista));
  };

  const criarNovoNpc = () => {
    const novo = {
      id: crypto.randomUUID(),
      nome: "Novo NPC",
      classe: "NPC",
      nivel: 1,

      atributos: {
        forca: 0,
        fortitude: 0,
        inteligencia: 0,
        vontade: 0,
        reflexos: 0,
      },

      defesa: 10,

      membros: {
        cabeca: { atual: 100, max: 100, defesa: 0 },
        torso: { atual: 500, max: 500, defesa: 0 },
        bracoDireito: { atual: 500, max: 500, defesa: 0 },
        bracoEsquerdo: { atual: 500, max: 500, defesa: 0 },
        pernaDireita: { atual: 500, max: 500, defesa: 0 },
        pernaEsquerda: { atual: 500, max: 500, defesa: 0 },
      },

      sanidade: {
        atual: 10,
        max: 10,
      },

      ataques: [],
      habilidades: [],
      inventario: [],
      rituais: [],
      descricao: "",
    };

    salvarListaNpcs([...npcs, novo]);
    setNpcEditando(novo.id);
  };

  const excluirNpc = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir NPC",
      mensagem: "Deseja excluir este NPC permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
        salvarListaNpcs(npcs.filter((npc) => npc.id !== id));
        setNpcEditando(null);

        abrirPopup({
          titulo: "NPC excluído",
          mensagem: "O NPC foi removido com sucesso.",
        });
      },
    });
  };

  const duplicarNpc = (npc) => {
    const copia = {
      ...structuredClone(npc),
      id: crypto.randomUUID(),
      nome: `${npc.nome} (Cópia)`,
    };

    salvarListaNpcs([...npcs, copia]);

    abrirPopup({
      titulo: "NPC duplicado",
      mensagem: `${copia.nome} foi criado com base no NPC original.`,
    });
  };

  const atualizarNpc = (id, dados) => {
    salvarListaNpcs(
      npcs.map((npc) =>
        npc.id === id
          ? {
              ...npc,
              ...dados,
            }
          : npc,
      ),
    );
  };

  const salvarListaInimigos = (novaLista) => {
    setInimigos(novaLista);
    localStorage.setItem(STORAGE_INIMIGOS, JSON.stringify(novaLista));
  };

  const criarNovoInimigo = () => {
    const novo = {
      id: crypto.randomUUID(),

      nome: "Novo Inimigo",

      classe: "aniquilador",

      nivel: 1,

      atributos: {
        forca: 0,
        fortitude: 0,
        inteligencia: 0,
        vontade: 0,
        reflexos: 0,
      },

      habilidadesClasse: {},

      inventario: [],

      vida: {
        atual: 10,
        max: 10,
      },

      sanidade: {
        atual: 10,
        max: 10,
      },

      energia: {
        atual: 10,
        max: 10,
      },
    };

    const novaLista = [...inimigos, novo];

    salvarListaInimigos(novaLista);

    setInimigoEditando(novo.id);
  };

  const excluirInimigo = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir inimigo",
      mensagem: "Deseja eliminar este inimigo permanentemente?",
      confirmarTexto: "Excluir",

      onConfirmar: () => {
        const novaLista = inimigos.filter((inimigo) => inimigo.id !== id);

        salvarListaInimigos(novaLista);
        setInimigoEditando(null);

        abrirPopup({
          titulo: "MORTO",
          mensagem: "O inimigo foi eliminado com sucesso.",
        });
      },
    });
  };

  const duplicarInimigo = (inimigo) => {
    const copia = {
      ...structuredClone(inimigo),

      id: crypto.randomUUID(),

      nome: `${inimigo.nome} (Cópia)`,
    };

    const novaLista = [...inimigos, copia];

    salvarListaInimigos(novaLista);
    abrirPopup({
      titulo: "Inimigo duplicado",
      mensagem: `${copia.nome} foi criado com base no inimigo original.`,
    });
  };

  const atualizarInimigo = (id, dados) => {
    const novaLista = inimigos.map((inimigo) =>
      inimigo.id === id
        ? {
            ...inimigo,
            ...dados,
          }
        : inimigo,
    );

    salvarListaInimigos(novaLista);
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
    };

    salvarFichaLocal(fichaSelecionada, personagemFinal);
    notificarPersonagemAtualizado(fichaSelecionada, personagemFinal);
    setPersonagem(personagemFinal);

    setFichas((atuais) =>
      atuais.map((ficha) =>
        ficha.fichaId === fichaSelecionada
          ? { ...ficha, personagem: personagemFinal }
          : ficha,
      ),
    );

    try {
      const personagemSalvo = await salvarPersonagem(
        fichaSelecionada,
        personagemFinal,
      );
      notificarPersonagemAtualizado(
        fichaSelecionada,
        personagemSalvo || personagemFinal,
      );
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
      lojaCreditos: 0,
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

    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir ficha",
      mensagem: "Deseja remover este personagem permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: async () => {
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
        setModalFichaAberto(false);

        abrirPopup({
          titulo: "INIEXISTIDO",
          mensagem: "O personagem não existe mais....",
        });
      },
    });

    localStorage.removeItem(`${STORAGE_KEY}_${fichaSelecionada}`);
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

  const adicionarRitosCreditos = () => {
    const delta = parseInt(ritosCreditosDelta, 10) || 0;

    const atualizado = {
      ...personagem,
      ritosCreditos: Math.max(
        0,
        (parseInt(personagem.ritosCreditos, 10) || 0) + delta,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const subirNivelJogador = () => {
    const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
    const proximoNivel = Math.min(10, nivelAtual + 1);
    const pontosGanhos = obterCustosNivel(proximoNivel).acumulado;
    const recursosGanhos = calcularGanhoRecursosNivel(personagem);

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
      sanidade: {
        ...(personagem.sanidade || {}),
        atual:
          (parseInt(personagem.sanidade?.atual, 10) || 0) +
          recursosGanhos.sanidade,
        max:
          (parseInt(personagem.sanidade?.max, 10) || 0) +
          recursosGanhos.sanidade,
      },
      esperanca: {
        ...(personagem.esperanca || {}),
        atual:
          (parseInt(personagem.esperanca?.atual, 10) || 0) +
          recursosGanhos.esperanca,
        max:
          (parseInt(personagem.esperanca?.max, 10) || 0) +
          recursosGanhos.esperanca,
      },
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
    setMensagem(
      `Jogador subiu para NV${proximoNivel}, recebeu ${pontosGanhos} pontos, +${recursosGanhos.sanidade} SAN e +${recursosGanhos.esperanca} PE.`,
    );
  };

  const diminuirNivelJogador = () => {
    const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
    const proximoNivel = Math.max(1, nivelAtual - 1);
    const pontosRemovidos = obterCustosNivel(nivelAtual).acumulado;
    const recursosRemovidos = calcularGanhoRecursosNivel(personagem);

    if (nivelAtual <= 1) {
      setMensagem("Este personagem ja esta no NV1.");
      return;
    }

    const sanidadeMaxAtual = parseInt(personagem.sanidade?.max, 10) || 0;
    const esperancaMaxAtual = parseInt(personagem.esperanca?.max, 10) || 0;
    const sanidadeNovoMax = Math.max(
      0,
      sanidadeMaxAtual - recursosRemovidos.sanidade,
    );
    const esperancaNovoMax = Math.max(
      0,
      esperancaMaxAtual - recursosRemovidos.esperanca,
    );

    const atualizado = {
      ...personagem,
      nivel: proximoNivel,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis: Math.max(
          0,
          (parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0) -
            pontosRemovidos,
        ),
        acumulados: Math.max(
          0,
          (parseInt(personagem.pontosEvolucao?.acumulados, 10) || 0) -
            pontosRemovidos,
        ),
      },
      sanidade: {
        ...(personagem.sanidade || {}),
        atual: Math.min(
          sanidadeNovoMax,
          Math.max(
            0,
            (parseInt(personagem.sanidade?.atual, 10) || 0) -
              recursosRemovidos.sanidade,
          ),
        ),
        max: sanidadeNovoMax,
      },
      esperanca: {
        ...(personagem.esperanca || {}),
        atual: Math.min(
          esperancaNovoMax,
          Math.max(
            0,
            (parseInt(personagem.esperanca?.atual, 10) || 0) -
              recursosRemovidos.esperanca,
          ),
        ),
        max: esperancaNovoMax,
      },
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
    setMensagem(
      `Jogador voltou para NV${proximoNivel}, perdeu ${pontosRemovidos} pontos, -${recursosRemovidos.sanidade} SAN e -${recursosRemovidos.esperanca} PE.`,
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

  const abrirCardFicha = useCallback((ficha, tipo = "jogador") => {
    const personagemCard = ficha.personagem || ficha;

    if (tipo === "jogador") {
      setFichaSelecionada(ficha.fichaId);
      setPersonagem({
        ...estadoInicial,
        ...personagemCard,
        lojaCreditos: personagemCard.lojaCreditos ?? 900,
      });
      setModalFichaAberto(true);
      return;
    }

    if (tipo === "npc") {
      setNpcEditando(personagemCard.id);
      return;
    }

    setInimigoEditando(personagemCard.id);
  }, []);

  // Mantido temporariamente para comparar o card antigo durante a migração de performance.
  // eslint-disable-next-line no-unused-vars
  const renderCardFicha = (ficha, tipo = "jogador") => {
    const personagemCard = ficha.personagem || ficha;
    const membros = personagemCard.membros || {};
    const imagem =
      personagemCard.fotoPerfil || "https://placehold.co/600x800?text=Sem+Foto";

    return (
      <article
        key={ficha.fichaId || ficha.id}
        className="mestre-card-personagem"
        onClick={() => {
          if (tipo === "jogador") {
            setFichaSelecionada(ficha.fichaId);
            setPersonagem({
              ...estadoInicial,
              ...personagemCard,
              lojaCreditos: personagemCard.lojaCreditos ?? 900,
            });
            setModalFichaAberto(true);
          } else if (tipo === "npc") {
            setNpcEditando(personagemCard.id);
          } else {
            setInimigoEditando(personagemCard.id);
          }
        }}
        style={{ backgroundImage: `url(${imagem})` }}
      >
        <div className="mestre-card-overlay" />

        <div className="mestre-card-conteudo">
          <div className="mestre-card-info">
            <small>
              NV{" "}
              {tipo === "inimigo"
                ? numeroRomanoDashboard(personagemCard.nivel)
                : personagemCard.nivel || 1}
            </small>{" "}
            <h3>{personagemCard.nome || "Sem nome"}</h3>
            <span>{personagemCard.classe || "Sem classe"}</span>
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
            <div className="mestre-card-membros">
              <label>INTEGRIDADE</label>

              {membrosFicha.map(({ chave, nome }) => {
                const dados = membros[chave] || { atual: 0, max: 0 };
                const porcentagem =
                  dados.max > 0 ? (dados.atual / dados.max) * 100 : 0;

                return (
                  <div key={chave} className="mestre-card-membro-mini">
                    <span>{nome}</span>

                    <div className="barra vermelho">
                      <span
                        style={{
                          width: `${Math.min(100, Math.max(0, porcentagem))}%`,
                        }}
                      />
                    </div>

                    <small>
                      {dados.atual || 0} / {dados.max || 0}
                    </small>
                  </div>
                );
              })}
            </div>

            <div>
              <label>SANIDADE</label>
              <div className="barra roxo">
                <span
                  style={{
                    width: `${
                      personagemCard.sanidade?.max > 0
                        ? (personagemCard.sanidade.atual /
                            personagemCard.sanidade.max) *
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

            {tipo === "jogador" && (
              <div>
                <label>ESPERANÇA</label>
                <div className="barra dourado">
                  <span
                    style={{
                      width: `${
                        personagemCard.esperanca?.max > 0
                          ? (personagemCard.esperanca.atual /
                              personagemCard.esperanca.max) *
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
            )}
          </div>
        </div>
      </article>
    );
  };

  const deveMostrarPartyLateral = !["loja", "habilidades", "campanha"].includes(
    aba,
  );
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
          className={aba === "campanha" ? "ativa" : ""}
          onClick={() => setAba("campanha")}
        >
          Campanha
        </button>
        <button
          className={aba === "fichas" ? "ativa" : ""}
          onClick={() => setAba("fichas")}
        >
          Fichas
        </button>
        <button
          className={aba === "inimigos" ? "ativa" : ""}
          onClick={() => setAba("inimigos")}
        >
          Inimigos
        </button>
        <button
          className={aba === "loja" ? "ativa" : ""}
          onClick={() => setAba("loja")}
        >
          Loja
        </button>
        <button
          className={aba === "habilidades" ? "ativa" : ""}
          onClick={() => setAba("habilidades")}
        >
          Habilidades
        </button>
      </nav>
      {false && <section className="mestre-dashboard-full"></section>}

      {aba === "campanha" && (
        <section className="mestre-dashboard-full campanha-dashboard">
          <div className="campanha-hero">
            <div>
              <span>Arquivo do Narrador</span>
              <h2>Campanha</h2>
              <p>
                Organize documentos, narrações, locais, segredos, pistas e tudo
                que você precisa para mestrar.
              </p>
            </div>

            <div className="campanha-acoes">
              <button
                type="button"
                onClick={() => criarItemCampanha("documento")}
              >
                + Documento
              </button>

              <button
                type="button"
                onClick={() => criarItemCampanha("narracao")}
              >
                + Narração
              </button>

              <button type="button" onClick={() => criarItemCampanha("local")}>
                + Local
              </button>

              <button
                type="button"
                onClick={() => criarItemCampanha("segredo")}
              >
                + Segredo
              </button>
            </div>
          </div>

          <div className="campanha-filtros">
            {["todos", "documento", "narracao", "local", "npc", "segredo"].map(
              (tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={filtroCampanha === tipo ? "ativa" : ""}
                  onClick={() => setFiltroCampanha(tipo)}
                >
                  {tipo}
                </button>
              ),
            )}
          </div>

          <div className="campanha-layout">
            <section className="campanha-lista">
              {campanhaFiltrada.length ? (
                campanhaFiltrada.map((item) => (
                  <article
                    key={item.id}
                    className={`campanha-card ${item.importante ? "importante" : ""}`}
                    onClick={() => setCampanhaEditando(item.id)}
                  >
                    <small>{item.tipo}</small>
                    <h3>{item.titulo || "Sem título"}</h3>

                    {item.subtitulo && <p>{item.subtitulo}</p>}

                    <div className="campanha-card-footer">
                      <span>{item.tags || "Sem tags"}</span>

                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicarItemCampanha(item);
                          }}
                        >
                          Duplicar
                        </button>

                        <button
                          type="button"
                          className="perigo"
                          onClick={(event) => {
                            event.stopPropagation();
                            excluirItemCampanha(item.id);
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="campanha-vazia">
                  Nenhum conteúdo criado para esta categoria.
                </div>
              )}
            </section>

            <aside className="campanha-editor">
              {(() => {
                const item = campanhaItens.find(
                  (doc) => doc.id === campanhaEditando,
                );

                if (!item) {
                  return (
                    <div className="campanha-editor-vazio">
                      <h3>Nenhum documento selecionado</h3>
                      <p>Crie ou selecione um item para editar.</p>
                    </div>
                  );
                }

                return (
                  <>
                    <label>
                      Tipo
                      <select
                        value={item.tipo}
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            tipo: e.target.value,
                          })
                        }
                      >
                        <option value="documento">Documento</option>
                        <option value="narracao">Narração</option>
                        <option value="local">Local</option>
                        <option value="npc">NPC / Personagem</option>
                        <option value="segredo">Segredo</option>
                      </select>
                    </label>

                    <label>
                      Título
                      <input
                        value={item.titulo || ""}
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            titulo: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Subtítulo
                      <input
                        value={item.subtitulo || ""}
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            subtitulo: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Tags
                      <input
                        value={item.tags || ""}
                        placeholder="ex: Brasil, Lincoln, Chave 1"
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            tags: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="campanha-check">
                      <input
                        type="checkbox"
                        checked={!!item.importante}
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            importante: e.target.checked,
                          })
                        }
                      />
                      Importante
                    </label>

                    <label>
                      Conteúdo
                      <textarea
                        className="campanha-textarea"
                        value={item.conteudo || ""}
                        onChange={(e) =>
                          atualizarItemCampanha(item.id, {
                            conteudo: e.target.value,
                          })
                        }
                      />
                    </label>
                  </>
                );
              })()}
            </aside>
          </div>
        </section>
      )}

      {aba === "fichas" && (
        <section className="mestre-dashboard-full">
          <div className="mestre-subtabs">
            <button
              type="button"
              className={subAbaFichas === "jogadores" ? "ativa" : ""}
              onClick={() => setSubAbaFichas("jogadores")}
            >
              Jogadores
            </button>

            <button
              type="button"
              className={subAbaFichas === "npcs" ? "ativa" : ""}
              onClick={() => setSubAbaFichas("npcs")}
            >
              NPCs
            </button>

            {subAbaFichas === "npcs" && (
              <button type="button" onClick={criarNovoNpc}>
                Criar NPC
              </button>
            )}
          </div>

          {subAbaFichas === "jogadores" && (
            <div className="mestre-dashboard-cards">
              {fichas.length > 0 ? (
                fichas.map((ficha) => (
                  <DashboardFichaCard
                    key={ficha.fichaId || ficha.id}
                    ficha={ficha}
                    tipo="jogador"
                    onAbrir={abrirCardFicha}
                  />
                ))
              ) : (
                <div className="mestre-vazio">Nenhuma ficha encontrada.</div>
              )}
            </div>
          )}

          {subAbaFichas === "npcs" && (
            <div className="mestre-dashboard-cards">
              {npcs.length > 0 ? (
                npcs.map((npc) => (
                  <DashboardFichaCard
                    key={npc.fichaId || npc.id}
                    ficha={npc}
                    tipo="npc"
                    onAbrir={abrirCardFicha}
                  />
                ))
              ) : (
                <div className="mestre-vazio">Nenhum NPC criado.</div>
              )}
            </div>
          )}

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
                      <div className="mestre-personagem-recursos">
                        <span>Créditos: {personagem.lojaCreditos || 0}</span>

                        <span>Mementos: {personagem.ritosCreditos || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mestre-modal-header-acoes">
                    <div className="mestre-header-admin">
                      <div className="mestre-header-admin-grupo">
                        <input
                          type="number"
                          value={creditosDelta}
                          onChange={(e) => setCreditosDelta(e.target.value)}
                        />

                        <button onClick={adicionarCreditos}>+ Créditos</button>
                      </div>

                      <div className="mestre-header-admin-grupo">
                        <input
                          type="number"
                          value={ritosCreditosDelta}
                          onChange={(e) =>
                            setRitosCreditosDelta(e.target.value)
                          }
                        />

                        <button onClick={adicionarRitosCreditos}>
                          + Mementos
                        </button>
                      </div>

                      <button onClick={diminuirNivelJogador}>
                        Diminuir NV
                      </button>

                      <button onClick={subirNivelJogador}>Subir NV</button>
                    </div>

                    <button
                      className="mestre-btn-apagar"
                      onClick={apagarFichaSelecionada}
                    >
                      Apagar Personagem
                    </button>

                    <button
                      className="mestre-modal-fechar"
                      onClick={() => setModalFichaAberto(false)}
                    >
                      ×
                    </button>
                  </div>
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
                <div className="mestre-status-layout">
                  <div className="mestre-modal-bloco">
                    <span>Integridade Corporal</span>

                    <div className="mestre-corpo-grid novo">
                      {membrosFicha.map((membro) => {
                        const dados = personagem?.membros?.[membro.chave];

                        return (
                          <div key={membro.chave} className="mestre-corpo-item">
                            <small>{membro.nome}</small>

                            <div className="mestre-barra vermelho">
                              <span
                                style={{
                                  width: `${
                                    ((dados?.atual || 0) / (dados?.max || 1)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            <strong>
                              {dados?.atual || 0} / {dados?.max || 0}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mestre-status-lateral">
                    <div className="mestre-modal-bloco">
                      <span>Sanidade</span>

                      <div className="mestre-barra-container">
                        <div className="mestre-barra roxo">
                          <span
                            style={{
                              width: `${
                                ((personagem?.sanidade?.atual || 0) /
                                  (personagem?.sanidade?.max || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <div className="mestre-recurso-editor">
                          <input
                            type="number"
                            value={personagem?.sanidade?.atual || 0}
                            onChange={(e) => {
                              const atualizado = {
                                ...personagem,
                                sanidade: {
                                  ...(personagem.sanidade || {}),
                                  atual: Math.max(
                                    0,
                                    parseInt(e.target.value, 10) || 0,
                                  ),
                                },
                              };

                              setPersonagem(atualizado);
                              salvarFichaSelecionada(atualizado);
                            }}
                          />

                          <span>/</span>

                          <input
                            type="number"
                            value={personagem?.sanidade?.max || 0}
                            onChange={(e) => {
                              const atualizado = {
                                ...personagem,
                                sanidade: {
                                  ...(personagem.sanidade || {}),
                                  max: Math.max(
                                    0,
                                    parseInt(e.target.value, 10) || 0,
                                  ),
                                },
                              };

                              setPersonagem(atualizado);
                              salvarFichaSelecionada(atualizado);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mestre-modal-bloco">
                      <span>Esperança</span>

                      <div className="mestre-barra-container">
                        <div className="mestre-barra dourado">
                          <span
                            style={{
                              width: `${
                                ((personagem?.esperanca?.atual || 0) /
                                  (personagem?.esperanca?.max || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <div className="mestre-recurso-editor">
                          <input
                            type="number"
                            value={personagem?.esperanca?.atual || 0}
                            onChange={(e) => {
                              const atualizado = {
                                ...personagem,
                                esperanca: {
                                  ...(personagem.esperanca || {}),
                                  atual: Math.max(
                                    0,
                                    parseInt(e.target.value, 10) || 0,
                                  ),
                                },
                              };

                              setPersonagem(atualizado);
                              salvarFichaSelecionada(atualizado);
                            }}
                          />

                          <span>/</span>

                          <input
                            type="number"
                            value={personagem?.esperanca?.max || 0}
                            onChange={(e) => {
                              const atualizado = {
                                ...personagem,
                                esperanca: {
                                  ...(personagem.esperanca || {}),
                                  max: Math.max(
                                    0,
                                    parseInt(e.target.value, 10) || 0,
                                  ),
                                },
                              };

                              setPersonagem(atualizado);
                              salvarFichaSelecionada(atualizado);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
          {npcEditando && (
            <div
              className="mestre-modal-overlay"
              onClick={() => setNpcEditando(null)}
            >
              <section
                className="mestre-modal-ficha minimalista"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const npc = npcs.find((item) => item.id === npcEditando);

                  if (!npc) return null;

                  const atualizarCampoNpc = (campo, valor) => {
                    atualizarNpc(npc.id, {
                      [campo]: valor,
                    });
                  };

                  const atualizarGrupoNpc = (grupo, chave, valor) => {
                    atualizarNpc(npc.id, {
                      [grupo]: {
                        ...(npc[grupo] || {}),
                        [chave]: parseInt(valor, 10) || 0,
                      },
                    });
                  };

                  const atualizarMembroNpc = (membro, campo, valor) => {
                    atualizarNpc(npc.id, {
                      membros: {
                        ...(npc.membros || {}),
                        [membro]: {
                          ...(npc.membros?.[membro] || {}),
                          [campo]: Math.max(0, parseInt(valor, 10) || 0),
                        },
                      },
                    });
                  };

                  const adicionarAtaqueNpc = () => {
                    atualizarNpc(npc.id, {
                      ataques: [
                        ...(npc.ataques || []),
                        {
                          id: crypto.randomUUID(),
                          nome: "Novo Ataque",
                          dano: "",
                          descricao: "",
                        },
                      ],
                    });
                  };

                  const atualizarAtaqueNpc = (ataqueId, campo, valor) => {
                    atualizarNpc(npc.id, {
                      ataques: (npc.ataques || []).map((ataque) =>
                        ataque.id === ataqueId
                          ? {
                              ...ataque,
                              [campo]: valor,
                            }
                          : ataque,
                      ),
                    });
                  };

                  const removerAtaqueNpc = (ataqueId) => {
                    atualizarNpc(npc.id, {
                      ataques: (npc.ataques || []).filter(
                        (ataque) => ataque.id !== ataqueId,
                      ),
                    });
                  };

                  const adicionarHabilidadeNpc = () => {
                    atualizarNpc(npc.id, {
                      habilidades: [
                        ...(npc.habilidades || []),
                        {
                          id: crypto.randomUUID(),
                          nome: "Nova Habilidade",
                          descricao: "",
                        },
                      ],
                    });
                  };

                  const atualizarHabilidadeNpc = (
                    habilidadeId,
                    campo,
                    valor,
                  ) => {
                    atualizarNpc(npc.id, {
                      habilidades: (npc.habilidades || []).map((habilidade) =>
                        habilidade.id === habilidadeId
                          ? {
                              ...habilidade,
                              [campo]: valor,
                            }
                          : habilidade,
                      ),
                    });
                  };

                  const removerHabilidadeNpc = (habilidadeId) => {
                    atualizarNpc(npc.id, {
                      habilidades: (npc.habilidades || []).filter(
                        (habilidade) => habilidade.id !== habilidadeId,
                      ),
                    });
                  };

                  return (
                    <>
                      <header className="inimigo-ficha-header">
                        <label className="inimigo-foto-editavel">
                          <img
                            src={
                              npc.fotoPerfil || "https://placehold.co/300x300"
                            }
                            alt={npc.nome}
                          />

                          <span>Editar imagem</span>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const arquivo = event.target.files?.[0];

                              if (!arquivo) return;

                              const reader = new FileReader();

                              reader.onload = () => {
                                atualizarCampoNpc("fotoPerfil", reader.result);
                              };

                              reader.readAsDataURL(arquivo);
                            }}
                          />
                        </label>

                        <div className="inimigo-identidade">
                          <label>
                            NV
                            <input
                              type="number"
                              value={npc.nivel || 1}
                              onChange={(e) =>
                                atualizarCampoNpc(
                                  "nivel",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                            />
                          </label>

                          <input
                            className="inimigo-nome-input"
                            value={npc.nome || ""}
                            onChange={(e) =>
                              atualizarCampoNpc("nome", e.target.value)
                            }
                          />
                        </div>

                        <div className="mestre-modal-header-acoes">
                          <button
                            className="duplicarButton"
                            onClick={() => duplicarNpc(npc)}
                          >
                            Duplicar
                          </button>

                          <button
                            className="mestre-btn-apagar"
                            onClick={() => excluirNpc(npc.id)}
                          >
                            Apagar
                          </button>

                          <button
                            className="mestre-modal-fechar"
                            onClick={() => setNpcEditando(null)}
                          >
                            ×
                          </button>
                        </div>
                      </header>

                      <section className="mestre-modal-bloco full">
                        <span>Atributos</span>

                        <div className="mestre-modal-atributos linha">
                          {Object.entries(npc.atributos || {}).map(
                            ([atributo, valor]) => (
                              <label key={atributo}>
                                {atributo}
                                <input
                                  type="number"
                                  value={valor || 0}
                                  onChange={(e) =>
                                    atualizarGrupoNpc(
                                      "atributos",
                                      atributo,
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                            ),
                          )}
                        </div>
                      </section>

                      <section className="mestre-modal-bloco full">
                        <span>Sanidade</span>

                        <div className="mestre-duplo">
                          <label>
                            Atual
                            <input
                              type="number"
                              value={npc.sanidade?.atual || 0}
                              onChange={(e) =>
                                atualizarCampoNpc("sanidade", {
                                  ...(npc.sanidade || {}),
                                  atual: parseInt(e.target.value, 10) || 0,
                                })
                              }
                            />
                          </label>

                          <label>
                            Máxima
                            <input
                              type="number"
                              value={npc.sanidade?.max || 0}
                              onChange={(e) =>
                                atualizarCampoNpc("sanidade", {
                                  ...(npc.sanidade || {}),
                                  max: parseInt(e.target.value, 10) || 0,
                                })
                              }
                            />
                          </label>
                        </div>
                      </section>

                      <section className="mestre-modal-bloco full">
                        <span>Defesa</span>

                        <input
                          type="number"
                          value={npc.defesa || 0}
                          onChange={(e) =>
                            atualizarCampoNpc(
                              "defesa",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                      </section>

                      <section className="mestre-modal-bloco full">
                        <span>Membros</span>

                        <div className="mestre-corpo-grid">
                          {membrosFicha.map((membro) => {
                            const dados = npc.membros?.[membro.chave] || {
                              atual: 0,
                              max: 0,
                              defesa: 0,
                            };

                            return (
                              <div key={membro.chave} className="mestre-membro">
                                <strong>{membro.nome}</strong>

                                <label>
                                  Atual
                                  <input
                                    type="number"
                                    value={dados.atual || 0}
                                    onChange={(e) =>
                                      atualizarMembroNpc(
                                        membro.chave,
                                        "atual",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>

                                <label>
                                  Máx
                                  <input
                                    type="number"
                                    value={dados.max || 0}
                                    onChange={(e) =>
                                      atualizarMembroNpc(
                                        membro.chave,
                                        "max",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>

                                <label>
                                  Def
                                  <input
                                    type="number"
                                    value={dados.defesa || 0}
                                    onChange={(e) =>
                                      atualizarMembroNpc(
                                        membro.chave,
                                        "defesa",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <section className="mestre-modal-bloco full">
                        <div className="mestre-modal-linha-topo">
                          <span>Ataques</span>

                          <button type="button" onClick={adicionarAtaqueNpc}>
                            + Ataque
                          </button>
                        </div>

                        <div className="mestre-edit-lista">
                          {(npc.ataques || []).map((ataque) => (
                            <div key={ataque.id}>
                              <input
                                value={ataque.nome || ""}
                                onChange={(e) =>
                                  atualizarAtaqueNpc(
                                    ataque.id,
                                    "nome",
                                    e.target.value,
                                  )
                                }
                              />

                              <input
                                value={ataque.dano || ""}
                                onChange={(e) =>
                                  atualizarAtaqueNpc(
                                    ataque.id,
                                    "dano",
                                    e.target.value,
                                  )
                                }
                              />

                              <button
                                onClick={() => removerAtaqueNpc(ataque.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="mestre-modal-bloco full">
                        <div className="mestre-modal-linha-topo">
                          <span>Habilidades</span>

                          <button
                            type="button"
                            onClick={adicionarHabilidadeNpc}
                          >
                            + Habilidade
                          </button>
                        </div>

                        <div className="mestre-edit-lista">
                          {(npc.habilidades || []).map((habilidade) => (
                            <div key={habilidade.id}>
                              <input
                                value={habilidade.nome || ""}
                                onChange={(e) =>
                                  atualizarHabilidadeNpc(
                                    habilidade.id,
                                    "nome",
                                    e.target.value,
                                  )
                                }
                              />

                              <input
                                value={habilidade.descricao || ""}
                                onChange={(e) =>
                                  atualizarHabilidadeNpc(
                                    habilidade.id,
                                    "descricao",
                                    e.target.value,
                                  )
                                }
                              />

                              <button
                                onClick={() =>
                                  removerHabilidadeNpc(habilidade.id)
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  );
                })()}
              </section>
            </div>
          )}
        </section>
      )}

      {aba === "inimigos" && (
        <section className="mestre-dashboard-full">
          <div className="mestre-modal-linha-topo">
            <h2>Inimigos</h2>

            <button
              className="criarInimigo-button"
              type="button"
              onClick={criarNovoInimigo}
            >
              Criar inimigo
            </button>
          </div>

          <div className="mestre-fichas-com-party">
            <div className="mestre-dashboard-cards">
              {inimigos.map((inimigo) => (
                <DashboardFichaCard
                  key={inimigo.fichaId || inimigo.id}
                  ficha={inimigo}
                  tipo="inimigo"
                  onAbrir={abrirCardFicha}
                />
              ))}
            </div>
            {inimigoEditando && (
              <div
                className="mestre-modal-overlay"
                onClick={() => setInimigoEditando(null)}
              >
                <section
                  className="mestre-modal-ficha minimalista"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const inimigo = inimigos.find(
                      (i) => i.id === inimigoEditando,
                    );

                    if (!inimigo) return null;

                    const atualizarCampoInimigo = (campo, valor) => {
                      atualizarInimigo(inimigo.id, {
                        [campo]: valor,
                      });
                    };

                    const atualizarGrupoInimigo = (grupo, chave, valor) => {
                      atualizarInimigo(inimigo.id, {
                        [grupo]: {
                          ...(inimigo[grupo] || {}),
                          [chave]: parseInt(valor, 10) || 0,
                        },
                      });
                    };

                    return (
                      <>
                        <header className="inimigo-ficha-header">
                          <label className="inimigo-foto-editavel">
                            <img
                              src={
                                inimigo.fotoPerfil ||
                                "https://placehold.co/300x300"
                              }
                              alt={inimigo.nome}
                            />

                            <span>Editar imagem</span>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const arquivo = event.target.files?.[0];
                                if (!arquivo) return;

                                const reader = new FileReader();

                                reader.onload = () => {
                                  atualizarCampoInimigo(
                                    "fotoPerfil",
                                    reader.result,
                                  );
                                };

                                reader.readAsDataURL(arquivo);
                              }}
                            />
                          </label>

                          <div className="inimigo-identidade">
                            <label>
                              NV
                              <input
                                type="number"
                                value={inimigo.nivel || 1}
                                onChange={(e) =>
                                  atualizarCampoInimigo(
                                    "nivel",
                                    parseInt(e.target.value, 10) || 1,
                                  )
                                }
                              />
                            </label>

                            <input
                              className="inimigo-nome-input"
                              value={inimigo.nome || ""}
                              onChange={(e) =>
                                atualizarCampoInimigo("nome", e.target.value)
                              }
                            />
                          </div>

                          <div className="mestre-modal-header-acoes">
                            <button
                              className="duplicarButton"
                              onClick={() => duplicarInimigo(inimigo)}
                            >
                              Duplicar
                            </button>

                            <button
                              className="mestre-btn-apagar"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                excluirInimigo(inimigo.id);
                              }}
                            >
                              Apagar
                            </button>

                            <button
                              className="mestre-modal-fechar"
                              onClick={() => setInimigoEditando(null)}
                            >
                              ×
                            </button>
                          </div>
                        </header>

                        <section className="mestre-modal-bloco full">
                          <span>Atributos</span>

                          <div className="mestre-modal-atributos linha">
                            {Object.entries(inimigo.atributos || {}).map(
                              ([atributo, valor]) => (
                                <label key={atributo}>
                                  {atributo}

                                  <input
                                    type="number"
                                    value={valor}
                                    onChange={(e) =>
                                      atualizarGrupoInimigo(
                                        "atributos",
                                        atributo,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                              ),
                            )}
                          </div>
                        </section>
                        {/* SANIDADE */}
                        <section className="inimigo-ficha-bloco">
                          <h3>Sanidade</h3>

                          <div className="mestre-form-grid">
                            <label>
                              Atual
                              <input
                                type="number"
                                value={inimigo.sanidade?.atual || 0}
                                onChange={(e) =>
                                  atualizarCampoInimigo("sanidade", {
                                    ...(inimigo.sanidade || {}),
                                    atual: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                              />
                            </label>

                            <label>
                              Máxima
                              <input
                                type="number"
                                value={inimigo.sanidade?.max || 0}
                                onChange={(e) =>
                                  atualizarCampoInimigo("sanidade", {
                                    ...(inimigo.sanidade || {}),
                                    max: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </section>

                        {/* DEFESA */}
                        <section className="inimigo-ficha-bloco">
                          <h3>Defesa</h3>

                          <input
                            type="number"
                            value={inimigo.defesa || 0}
                            onChange={(e) =>
                              atualizarCampoInimigo(
                                "defesa",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                          />
                        </section>

                        {/* MEMBROS */}
                        <section className="inimigo-ficha-bloco">
                          <h3>Membros</h3>

                          <div className="mestre-corpo-grid">
                            {membrosFicha.map(({ chave, nome }) => {
                              const dados = inimigo.membros?.[chave] || {
                                atual: 0,
                                max: 0,
                                defesa: 0,
                              };

                              const atualizarMembroInimigo = (campo, valor) => {
                                atualizarCampoInimigo("membros", {
                                  ...(inimigo.membros || {}),
                                  [chave]: {
                                    ...dados,
                                    [campo]: Math.max(
                                      0,
                                      parseInt(valor, 10) || 0,
                                    ),
                                  },
                                });
                              };

                              return (
                                <div key={chave} className="mestre-corpo-item">
                                  <strong>{nome}</strong>

                                  <label>
                                    Atual
                                    <input
                                      type="number"
                                      value={dados.atual || 0}
                                      onChange={(e) =>
                                        atualizarMembroInimigo(
                                          "atual",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    Máx
                                    <input
                                      type="number"
                                      value={dados.max || 0}
                                      onChange={(e) =>
                                        atualizarMembroInimigo(
                                          "max",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    DEF
                                    <input
                                      type="number"
                                      value={dados.defesa || 0}
                                      onChange={(e) =>
                                        atualizarMembroInimigo(
                                          "defesa",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        {/* ATAQUES */}
                        <section className="inimigo-ficha-bloco">
                          <div className="inimigo-bloco-topo">
                            <h3>Ataques</h3>

                            <button
                              className="ataqueButton"
                              type="button"
                              onClick={() =>
                                atualizarCampoInimigo("ataques", [
                                  ...(inimigo.ataques || []),
                                  {
                                    nome: "Novo Ataque",
                                    alcance: "Corpo a Corpo",
                                    dano: "1d6",
                                    efeito: "",
                                  },
                                ])
                              }
                            >
                              + Ataque
                            </button>
                          </div>

                          {(inimigo.ataques || []).map((ataque, index) => (
                            <div key={index} className="inimigo-ataque-card">
                              <input
                                value={ataque.nome || ""}
                                placeholder="Nome do ataque"
                                onChange={(e) => {
                                  const ataques = [...(inimigo.ataques || [])];
                                  ataques[index] = {
                                    ...ataque,
                                    nome: e.target.value,
                                  };
                                  atualizarCampoInimigo("ataques", ataques);
                                }}
                              />

                              <input
                                value={ataque.alcance || ""}
                                placeholder="Alcance"
                                onChange={(e) => {
                                  const ataques = [...(inimigo.ataques || [])];
                                  ataques[index] = {
                                    ...ataque,
                                    alcance: e.target.value,
                                  };
                                  atualizarCampoInimigo("ataques", ataques);
                                }}
                              />

                              <input
                                value={ataque.dano || ""}
                                placeholder="Dano: 2d6 + 3"
                                onChange={(e) => {
                                  const ataques = [...(inimigo.ataques || [])];
                                  ataques[index] = {
                                    ...ataque,
                                    dano: e.target.value,
                                  };
                                  atualizarCampoInimigo("ataques", ataques);
                                }}
                              />

                              <textarea
                                value={ataque.efeito || ""}
                                placeholder="Efeito do ataque"
                                onChange={(e) => {
                                  const ataques = [...(inimigo.ataques || [])];
                                  ataques[index] = {
                                    ...ataque,
                                    efeito: e.target.value,
                                  };
                                  atualizarCampoInimigo("ataques", ataques);
                                }}
                              />

                              <button
                                type="button"
                                className="mestre-btn-apagar"
                                onClick={() =>
                                  atualizarCampoInimigo(
                                    "ataques",
                                    (inimigo.ataques || []).filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </section>

                        {/* HABILIDADES */}
                        <section className="inimigo-ficha-bloco">
                          <div className="inimigo-bloco-topo">
                            <h3>Habilidades</h3>

                            <button
                              className="habilidadeButton"
                              type="button"
                              onClick={() =>
                                atualizarCampoInimigo("habilidades", [
                                  ...(inimigo.habilidades || []),
                                  {
                                    nome: "Nova Habilidade",
                                    descricao: "",
                                  },
                                ])
                              }
                            >
                              + Habilidade
                            </button>
                          </div>

                          {(inimigo.habilidades || []).map(
                            (habilidade, index) => (
                              <div key={index} className="inimigo-ataque-card">
                                <input
                                  value={habilidade.nome || ""}
                                  placeholder="Nome da habilidade"
                                  onChange={(e) => {
                                    const habilidades = [
                                      ...(inimigo.habilidades || []),
                                    ];
                                    habilidades[index] = {
                                      ...habilidade,
                                      nome: e.target.value,
                                    };
                                    atualizarCampoInimigo(
                                      "habilidades",
                                      habilidades,
                                    );
                                  }}
                                />

                                <textarea
                                  value={habilidade.descricao || ""}
                                  placeholder="Descrição da habilidade"
                                  onChange={(e) => {
                                    const habilidades = [
                                      ...(inimigo.habilidades || []),
                                    ];
                                    habilidades[index] = {
                                      ...habilidade,
                                      descricao: e.target.value,
                                    };
                                    atualizarCampoInimigo(
                                      "habilidades",
                                      habilidades,
                                    );
                                  }}
                                />

                                <button
                                  type="button"
                                  className="mestre-btn-apagar"
                                  onClick={() =>
                                    atualizarCampoInimigo(
                                      "habilidades",
                                      (inimigo.habilidades || []).filter(
                                        (_, i) => i !== index,
                                      ),
                                    )
                                  }
                                >
                                  Remover
                                </button>
                              </div>
                            ),
                          )}
                        </section>
                      </>
                    );
                  })()}
                </section>
              </div>
            )}
          </div>
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
      {aba === "habilidades" && (
        <section className="mestre-loja">
          <form className="mestre-loja-form" onSubmit={salvarHabilidadeEditor}>
            <h3>
              {habilidadeEditando ? "Editando habilidade" : "Nova habilidade"}
            </h3>

            <label>
              Classe
              <select
                value={classeArvoreAtiva}
                onChange={(e) => {
                  setClasseArvoreAtiva(e.target.value);
                  setEspecialidadeEditorId("");
                  limparFormHabilidade();
                }}
              >
                {Object.entries(arvoresEditor).map(([id, arvore]) => (
                  <option key={id} value={id}>
                    {arvore.classe || id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo
              <select
                value={tipoHabilidadeEditor}
                onChange={(e) => {
                  setTipoHabilidadeEditor(e.target.value);
                  limparFormHabilidade();
                }}
              >
                <option value="absolutas">Habilidades Absolutas</option>
                <option value="aptidoes">Aptidões</option>
                <option value="especialidade">
                  Habilidades de Especialidade
                </option>
              </select>
            </label>

            {tipoHabilidadeEditor === "especialidade" && (
              <label>
                Especialidade
                <select
                  value={especialidadeEditorId}
                  onChange={(e) => setEspecialidadeEditorId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {(arvoresEditor[classeArvoreAtiva]?.especialidades || []).map(
                    (esp) => (
                      <option key={esp.id} value={esp.id}>
                        {esp.nome}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}

            <label>
              Nome
              <input
                value={formHabilidade.nome}
                onChange={(e) =>
                  setFormHabilidade((prev) => ({
                    ...prev,
                    nome: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Custo
              <input
                value={formHabilidade.custo}
                onChange={(e) =>
                  setFormHabilidade((prev) => ({
                    ...prev,
                    custo: e.target.value,
                  }))
                }
                placeholder="Ex: 2 PE, Passiva, Reação..."
              />
            </label>

            <label>
              Descrição
              <textarea
                value={formHabilidade.descricao}
                onChange={(e) =>
                  setFormHabilidade((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
              />
            </label>

            <div className="mestre-loja-form-acoes">
              <button type="submit">
                {habilidadeEditando ? "Salvar alteração" : "Criar habilidade"}
              </button>

              {habilidadeEditando && (
                <button type="button" onClick={limparFormHabilidade}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="mestre-catalogo-area">
            <div className="mestre-catalogo">
              {(() => {
                const arvoreAtual = arvoresEditor[classeArvoreAtiva] || {};

                const lista =
                  tipoHabilidadeEditor === "especialidade"
                    ? (arvoreAtual.especialidades || []).find(
                        (esp) => esp.id === especialidadeEditorId,
                      )?.habilidades || []
                    : arvoreAtual[tipoHabilidadeEditor] || [];

                return lista.map((habilidade) => (
                  <article key={habilidade.id} className="mestre-catalogo-item">
                    <div>
                      <span>{tipoHabilidadeEditor}</span>
                      <h3>{habilidade.nome}</h3>
                      <p>{habilidade.descricao}</p>
                      <small>{habilidade.custo}</small>
                    </div>

                    <div className="mestre-catalogo-acoes">
                      <button
                        type="button"
                        className="mestre-botao-editar"
                        onClick={() => editarHabilidadeEditor(habilidade)}
                      >
                        <Icon path={mdiPencil} size={0.8} />
                      </button>

                      <button
                        type="button"
                        className="perigo"
                        onClick={() => excluirHabilidadeEditor(habilidade.id)}
                      >
                        <Icon path={mdiDeleteOutline} size={0.8} />
                      </button>
                    </div>
                  </article>
                ));
              })()}
            </div>
          </div>
        </section>
      )}
      {popup &&
        createPortal(
          <div className="mestre-popup-overlay" onClick={fecharPopup}>
            <section
              className={`mestre-popup ${popup.tipo === "perigo" ? "perigo" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>
                {popup.tipo === "perigo" ? "CONFIRMAÇÃO" : "ABSOLUTO"}
              </span>

              <h2>{popup.titulo}</h2>

              <p>{popup.mensagem}</p>

              <div className="mestre-popup-acoes">
                {popup.onConfirmar && (
                  <button type="button" onClick={fecharPopup}>
                    Cancelar
                  </button>
                )}

                <button
                  type="button"
                  className={popup.tipo === "perigo" ? "perigo" : "primario"}
                  onClick={popup.onConfirmar ? confirmarPopup : fecharPopup}
                >
                  {popup.onConfirmar ? popup.confirmarTexto : "Ok"}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </main>
  );
};

export default DashboardMestre;
