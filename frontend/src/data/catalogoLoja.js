import { CATALOGO_COMBATE } from "./Catalogo/combate";
import { CATALOGO_RITOS_ABSOLUTOS } from "./Catalogo/ritosAbsolutos";
import { CATALOGO_PODERES_ABSOLUTOS } from "./Catalogo/poderesAbsolutos";
import { MODIFICACOES } from "./Catalogo/modificacoes";
import { CATALOGO_DEFESAS } from "./Catalogo/defesas";
import { CATALOGO_ITENS_COMUNS } from "./Catalogo/itensComuns";
import { CATALOGO_MUNICOES_ESPECIAIS } from "./Catalogo/municoesEspeciais";


export const CATEGORIAS_LOJA = [
  { id: "armas-fogo", nome: "Armas de Fogo" },
  { id: "armas-corpo", nome: "Armas Corpo a Corpo" },
  { id: "defesas", nome: "Defesas" },
  { id: "itens", nome: "Itens" },
  { id: "modificacoes", nome: "Modificações" },
  { id: "municoes-especiais", nome: "Munições Especiais" },
  { id: "ritos", nome: "Ritos Absolutos" },
  { id: "poderes", nome: "Poderes Absolutos" },
  // Categoria administrativa: exibida apenas no dashboard do mestre, nunca na loja.
  { id: "armas-exclusivas", nome: "Armas Exclusivas" },
];


export const DEFAULT_CATALOGO_LOJA = [
  ...CATALOGO_COMBATE.filter(
    (item) => item.categoria !== "defesas" && item.categoria !== "itens",
  ),
  ...CATALOGO_DEFESAS,
  ...CATALOGO_ITENS_COMUNS,
  ...CATALOGO_MUNICOES_ESPECIAIS,
  ...CATALOGO_RITOS_ABSOLUTOS,
  ...CATALOGO_PODERES_ABSOLUTOS,
  ...MODIFICACOES,
];

export const catalogoPossuiDefesasAtualizadas = (catalogo = []) =>
  Array.isArray(catalogo) &&
  catalogo.some(
    (item) =>
      item.id === "blindagem-integral" &&
      Array.isArray(item.resistenciasDano) &&
      item.resistenciasDano.length > 0,
  ) &&
  catalogo.some(
    (item) =>
      item.id === "algemas-reforcadas" &&
      item.bonusTeste === "Violência +2 para imobilizar um alvo rendido",
  ) &&
  catalogo.some(
    (item) =>
      item.id === "municao-arco-farpada" && item.municaoEspecial === true,
  );

export const catalogoPossuiDanosBalanceados = (catalogo = []) =>
  Array.isArray(catalogo) &&
  catalogo.some(
    (item) =>
      item.id === "pistola-sable" && item.armaStatus?.dmg === "3d8",
  ) &&
  catalogo.some(
    (item) =>
      item.id === "fuzil-assalto-helena" &&
      item.armaStatus?.dmg === "3d12+3",
  ) &&
  catalogo.some(
    (item) =>
      item.id === "katana-militar" && item.armaStatus?.dmg === "3d8+7",
  );

const aplicarDanosArmasBalanceados = (catalogo = []) => {
  const armasPadrao = new Map(
    CATALOGO_COMBATE.filter(
      (item) =>
        item.categoria === "armas-fogo" || item.categoria === "armas-corpo",
    ).map((item) => [item.id, item]),
  );

  return catalogo.map((item) => {
    const armaPadrao = armasPadrao.get(item.id);

    if (!armaPadrao) return item;

    return {
      ...item,
      armaStatus: {
        ...(item.armaStatus || {}),
        ...armaPadrao.armaStatus,
      },
    };
  });
};

export const aplicarDefesasAtualizadas = (catalogo = []) => {
  const itens = Array.isArray(catalogo) ? catalogo : [];
  const itensComDanosBalanceados = aplicarDanosArmasBalanceados(itens);

  if (catalogoPossuiDefesasAtualizadas(itens)) {
    return itensComDanosBalanceados;
  }

  return [
    ...itensComDanosBalanceados.filter(
      (item) =>
        item.categoria !== "defesas" &&
        item.categoria !== "itens" &&
        item.categoria !== "municoes-especiais",
    ),
    ...CATALOGO_DEFESAS,
    ...CATALOGO_ITENS_COMUNS,
    ...CATALOGO_MUNICOES_ESPECIAIS,
  ];
};


export const normalizarItemLoja = (item, index = 0) => {
  const nome = String(item?.nome || "").trim();
  const id =
    String(item?.id || nome || `item-${Date.now()}-${index}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `item-${index}`;
  const modificacaoPadrao = MODIFICACOES.find(
    (modificacao) => modificacao.id === id,
  );
  // Itens criados na antiga aba "Armas Exclusivas" recebiam este prefixo,
  // mas eram salvos incorretamente na categoria "itens".
  const ehArmaExclusivaLegada = id.startsWith("armas-exclusivas-");

  const categoriaValida = CATEGORIAS_LOJA.some(
    (categoria) => categoria.id === item?.categoria,
  );
  // Catalogos antigos usavam a categoria generica "armas". Quando um item
  // conhecido chega assim do servidor, preservamos sua categoria oficial em
  // vez de manda-lo para "itens" (caso da Pistola Sable).
  const itemPadrao = DEFAULT_CATALOGO_LOJA.find(
    (itemPadraoCatalogo) => itemPadraoCatalogo.id === id,
  );
  const categoriaNormalizada = modificacaoPadrao
    ? "modificacoes"
    : ehArmaExclusivaLegada
      ? "armas-exclusivas"
      : categoriaValida
        ? item.categoria
        : itemPadrao?.categoria || "itens";

  return {
    id,

    nome: nome || "Item sem nome",
    categoria: categoriaNormalizada,
    preco: Math.max(0, parseInt(item?.preco, 10) || 0),
    detalhe: String(item?.detalhe || "").trim(),
    entrega: String(item?.entrega || "").trim(),
    defesaBonus: Math.max(0, parseInt(item?.defesaBonus, 10) || 0),
    resistencia: String(item?.resistencia || "").trim(),
    resistenciasDano: Array.isArray(item?.resistenciasDano)
      ? item.resistenciasDano
          .map((resistencia) => ({
            tipo: String(resistencia?.tipo || "").trim().toLowerCase(),
            reducao: Math.max(0, parseInt(resistencia?.reducao, 10) || 0),
          }))
          .filter((resistencia) => resistencia.tipo && resistencia.reducao > 0)
      : [],
    icone: String(item?.icone || "").trim(),
    dano: String(item?.dano || "").trim(),
    bonusDano: String(item?.bonusDano || "").trim(),
    cura: String(item?.cura || "").trim(),
    bonusTeste: String(item?.bonusTeste || "").trim(),
    efeito: String(item?.efeito || "").trim(),
    usos: String(item?.usos || "").trim(),
    tipoArma: String(item?.tipoArma || "").trim(),
    quantidade: Math.max(0, parseInt(item?.quantidade, 10) || 0),
    municaoEspecial: Boolean(item?.municaoEspecial),
    subtipo: String(
      item?.subtipo ||
        (ehArmaExclusivaLegada && item?.armaStatus
          ? item.armaStatus.tipo === "Corpo a Corpo"
            ? "corpo"
            : "fogo"
          : "nenhum"),
    ).trim(),
    critico: String(item?.critico || "").trim(),
    danoCabeca: String(item?.danoCabeca || "").trim(),
    modificacoesArma: Array.isArray(item?.modificacoesArma)
      ? item.modificacoesArma
      : [],
    aprimoramentoCustomizado: item?.aprimoramentoCustomizado || null,
    armaStatusBase: item?.armaStatusBase || null,
    armaStatus: item?.armaStatus || null,
    nivelRito: String(item?.nivelRito || "").trim(),
    subcategoria: String(
      item?.subcategoria || modificacaoPadrao?.subcategoria || "",
    ).trim(),
    aplicavel: String(item?.aplicavel || modificacaoPadrao?.aplicavel || "").trim(),
    modificacao: item?.modificacao || modificacaoPadrao?.modificacao || null,
  };
};
