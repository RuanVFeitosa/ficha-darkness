export const MISSING_ESPIRAL_TOKEN = "Falta a imagem de corpo inteiro do personagem. Adicione essa imagem na seção Background da ficha ESPIRAL para entrar no tabletop.";
export const hasEspiralToken = (sheet) => typeof sheet?.tabletopTokenImage === "string" && Boolean(sheet.tabletopTokenImage.trim());
export function readEspiralTabletopSheet(id) {
  try {
    const sheet=JSON.parse(localStorage.getItem(`espiral:sheet:v1:${id}`));
    if(sheet?.version===1) return sheet;
    return JSON.parse(localStorage.getItem(`espiral:sheet:v1:darkness-${id}`));
  } catch { return null; }
}
export function espiralTabletopUrl(id,campaign) {
  return `/?${new URLSearchParams({sistema:"espiral",ficha:id,campanha:campaign.codigo,tabletop3d:"1",papel:"jogador"}).toString()}`;
}