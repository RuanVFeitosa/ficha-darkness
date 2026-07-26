import { CATALOGO_COMBATE } from "./Catalogo/combate";
import { CATALOGO_RITOS_ABSOLUTOS } from "./Catalogo/ritosAbsolutos";
import { CATALOGO_PODERES_ABSOLUTOS } from "./Catalogo/poderesAbsolutos";
import { MODIFICACOES } from "./Catalogo/modificacoes";


export const CATEGORIAS_LOJA = [
  { id: "armas-fogo", nome: "Armas de Fogo" },
  { id: "armas-corpo", nome: "Armas Corpo a Corpo" },
  { id: "defesas", nome: "Defesas" },
  { id: "itens", nome: "Itens" },
  { id: "modificacoes", nome: "Modificações" },
  { id: "ritos", nome: "Ritos Absolutos" },
  { id: "poderes", nome: "Poderes Absolutos" },
];


export const DEFAULT_CATALOGO_LOJA = [
  ...CATALOGO_COMBATE,
  ...CATALOGO_RITOS_ABSOLUTOS,
  ...CATALOGO_PODERES_ABSOLUTOS,
  ...MODIFICACOES,
];


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

  const categoriaValida = CATEGORIAS_LOJA.some(
    (categoria) => categoria.id === item?.categoria,
  );

  return {
    id,

    nome: nome || "Item sem nome",
    categoria: modificacaoPadrao
      ? "modificacoes"
      : categoriaValida
        ? item.categoria
        : "itens",
    preco: Math.max(0, parseInt(item?.preco, 10) || 0),
    detalhe: String(item?.detalhe || "").trim(),
    entrega: String(item?.entrega || "").trim(),
    dano: String(item?.dano || "").trim(),
    bonusDano: String(item?.bonusDano || "").trim(),
    armaStatus: item?.armaStatus || null,
    nivelRito: String(item?.nivelRito || "").trim(),
    subcategoria: String(
      item?.subcategoria || modificacaoPadrao?.subcategoria || "",
    ).trim(),
    aplicavel: String(item?.aplicavel || modificacaoPadrao?.aplicavel || "").trim(),
    modificacao: item?.modificacao || modificacaoPadrao?.modificacao || null,
  };
};
