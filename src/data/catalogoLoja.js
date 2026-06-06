export const CATEGORIAS_LOJA = [
  { id: "armas", nome: "Armas" },
  { id: "defesas", nome: "Defesas" },
  { id: "itens", nome: "Itens" },
  { id: "ritos", nome: "Ritos Absolutos" },
];

export const DEFAULT_CATALOGO_LOJA = [
  {
    id: "pistola-sable",
    nome: "Pistola Sable 9mm",
    categoria: "armas",
    preco: 180,
    detalhe: "Leve, discreta e confiavel em corredores apertados.",
    entrega: "1 pente extra",
  },
  {
    id: "carabina-helena",
    nome: "Carabina Helena-7",
    categoria: "armas",
    preco: 460,
    detalhe: "Precisao estavel para media distancia.",
    entrega: "2 carregadores",
  },
  {
    id: "lamina-fosca",
    nome: "Lamina Fosca",
    categoria: "armas",
    preco: 135,
    detalhe: "Faca tatica de corte silencioso.",
    entrega: "Bainha magnetica",
  },
  {
    id: "colete-kevlar",
    nome: "Colete Kevlar II",
    categoria: "defesas",
    preco: 320,
    detalhe: "Protecao corporal sem travar movimento.",
    entrega: "+ resistencia contra perfuracao",
  },
  {
    id: "placa-ceramica",
    nome: "Placa Ceramica",
    categoria: "defesas",
    preco: 260,
    detalhe: "Reforco para impacto concentrado.",
    entrega: "Instalacao incluida",
  },
  {
    id: "mascara-filtro",
    nome: "Mascara de Filtro",
    categoria: "defesas",
    preco: 150,
    detalhe: "Filtro lacrado contra poeira, gas e fuligem ritual.",
    entrega: "2 filtros",
  },
  {
    id: "kit-trauma",
    nome: "Kit de Trauma",
    categoria: "itens",
    preco: 95,
    detalhe: "Curativos, torniquete, analgesicos e selante.",
    entrega: "3 usos",
  },
  {
    id: "municao-prata",
    nome: "Municao de Prata",
    categoria: "itens",
    preco: 120,
    detalhe: "Cartuchos preparados para alvos anormais.",
    entrega: "Caixa com 12",
  },
  {
    id: "rastreador-sinal",
    nome: "Rastreador de Sinal",
    categoria: "itens",
    preco: 210,
    detalhe: "Pulso curto para localizar aparelhos ativos.",
    entrega: "Bateria 6h",
  },
  {
    id: "rito-limiar",
    nome: "Rito Absoluto: Limiar",
    categoria: "ritos",
    preco: 520,
    detalhe: "Marca uma passagem onde o real fica fino.",
    entrega: "Custo 6 PE",
  },
  {
    id: "rito-cicatriz",
    nome: "Rito Absoluto: Cicatriz",
    categoria: "ritos",
    preco: 640,
    detalhe: "Converte dor recebida em memoria armada.",
    entrega: "Custo 8 PE",
  },
  {
    id: "rito-noite-fechada",
    nome: "Rito Absoluto: Noite Fechada",
    categoria: "ritos",
    preco: 780,
    detalhe: "Apaga rastros, luzes pequenas e certezas.",
    entrega: "Custo 10 PE",
  },
];

export const normalizarItemLoja = (item, index = 0) => {
  const nome = String(item?.nome || "").trim();
  const categoriaValida = CATEGORIAS_LOJA.some(
    (categoria) => categoria.id === item?.categoria,
  );

  return {
    id:
      String(item?.id || nome || `item-${Date.now()}-${index}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `item-${index}`,
    nome: nome || "Item sem nome",
    categoria: categoriaValida ? item.categoria : "itens",
    preco: Math.max(0, parseInt(item?.preco, 10) || 0),
    detalhe: String(item?.detalhe || "").trim(),
    entrega: String(item?.entrega || "").trim(),
  };
};
