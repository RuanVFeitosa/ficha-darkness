import React, { useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft, mdiCart, mdiCheck, mdiClose, mdiMedicalBag, mdiPistol, mdiRadio, mdiShield, mdiSword, mdiToolbox, mdiAxe, mdiKnifeMilitary } from "@mdi/js";
import "../CSS/LojaEspiral.css";
import { CATALOGO_ESPIRAL, CATEGORIAS_ESPIRAL } from "../data/catalogoEspiral";
import { obterIconeItem } from "../utils/itemIcons";

const sheetKey = (id) => `espiral:sheet:v1:${id || "principal"}`;
const iconForItem = (item) => {
  if (item.type === "weapon" && item.weaponGroup === "fogo") {
    const namesForLegacyIcons = {
      Carabina: "Fuzil",
      Rifle: "Fuzil",
    };
    return obterIconeItem({
      nome: namesForLegacyIcons[item.name] || item.name,
      categoria: "armas-fogo",
    });
  }
  const text = `${item.name} ${item.category || ""}`.toLowerCase();
  if (item.type === "protection") return mdiShield;
  if (text.includes("medic") || text.includes("kit") || text.includes("torniquete")) return mdiMedicalBag;
  if (text.includes("rádio") || text.includes("telefone")) return mdiRadio;
  if (text.includes("faca") || text.includes("punhal")) return mdiKnifeMilitary;
  if (text.includes("machado") || text.includes("marreta") || text.includes("martelo")) return mdiAxe;
  if (item.type === "weapon" && (text.includes("pistola") || text.includes("revólver"))) return mdiPistol;
  return item.type === "weapon" ? mdiSword : mdiToolbox;
};
const itemType = (item) => item.type === "weapon" ? "ARMA" : item.type === "protection" ? "PROTEÇÃO" : "EQUIPAMENTO";
const renderItemIcon = (item, size = 1.45) => {
  const icon = iconForItem(item);
  const isImage = typeof icon === "string" && (icon.includes(".svg") || icon.startsWith("data:image"));
  return isImage ? <img className="espiral-store-firearm-icon" src={icon} alt="" aria-hidden="true" /> : <Icon path={icon} size={size} />;
};

export default function LojaEspiral() {
  const id = new URLSearchParams(window.location.search).get("ficha") || "principal";
  const [area, setArea] = useState("armas");
  const [weaponGroup, setWeaponGroup] = useState("brancas");
  const [category, setCategory] = useState("medicina");
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState("");
  const equipmentCategories = CATEGORIAS_ESPIRAL.filter(({ id: categoryId }) => !["armas", "protecoes"].includes(categoryId));
  const items = useMemo(() => CATALOGO_ESPIRAL.filter((item) => item.category === (area === "equipamentos" ? category : area) && (area !== "armas" || item.weaponGroup === weaponGroup)), [area, category, weaponGroup]);
  const addToCart = (item) => { setCart((current) => [...current, { ...item, cartId: `${item.id}-${Date.now()}-${current.length}` }]); setNotice(`${item.name} separado para incorporação.`); };
  const removeFromCart = (cartId) => setCart((current) => current.filter((item) => item.cartId !== cartId));
  const finalize = () => {
    if (!cart.length) return;
    let sheet;
    try { sheet = JSON.parse(localStorage.getItem(sheetKey(id)) || "{}"); } catch { sheet = {}; }
    cart.forEach((item) => {
      if (item.type === "weapon") sheet.weapons = [...(sheet.weapons || []), { id: `${item.id}-${Date.now()}-${Math.random()}`, name: item.name, damage: item.damage, ammo: "" }];
      else if (item.type === "protection") sheet.protections = [...(sheet.protections || []), { id: `${item.id}-${Date.now()}-${Math.random()}`, name: item.name, value: String(item.value), region: item.region }];
      else sheet.inventory = [...new Set([...(sheet.inventory || "").split("\n").filter(Boolean), item.name])].join("\n");
    });
    localStorage.setItem(sheetKey(id), JSON.stringify(sheet));
    setNotice(`${cart.length} ${cart.length === 1 ? "item incorporado" : "itens incorporados"} ao arquivo ESPIRAL.`);
    setCart([]);
  };
  const catalogTitle = area === "equipamentos" ? equipmentCategories.find((entry) => entry.id === category)?.nome : area === "armas" ? "Armas" : "Proteções";
  return <main className="espiral-store loja-page">
    <header className="espiral-store-hero loja-hero"><div className="espiral-store-hero-overlay" /><a className="espiral-store-back loja-voltar" href={`?ficha=${encodeURIComponent(id)}`}><Icon path={mdiArrowLeft} size={0.8} /> Voltar à ficha</a><div className="espiral-store-hero-copy loja-hero-copy"><span className="loja-kicker">ESPIRAL // TERMINAL DE SUPRIMENTOS</span><h1>O que você leva<br />para o incerto.</h1><p>Recursos de campo catalogados para esta ficha. Separe os itens necessários e incorpore tudo ao arquivo quando estiver pronto.</p></div><div className="espiral-store-sigil" aria-hidden="true"><i /><i /><i /><i /></div></header>
    <section className="loja-shell espiral-store-shell">
      <div className="loja-toolbar" aria-label="Categorias da loja"><button type="button" className={`loja-categoria ${area === "armas" ? "ativa" : ""}`} onClick={() => setArea("armas")}><Icon path={mdiPistol} size={0.8} /> Armas</button><button type="button" className={`loja-categoria ${area === "protecoes" ? "ativa" : ""}`} onClick={() => setArea("protecoes")}><Icon path={mdiShield} size={0.8} /> Proteções</button><button type="button" className={`loja-categoria ${area === "equipamentos" ? "ativa" : ""}`} onClick={() => setArea("equipamentos")}><Icon path={mdiToolbox} size={0.8} /> Equipamentos</button></div>
      {area === "armas" && <div className="ritos-subabas espiral-store-subtabs" aria-label="Categorias de armas"><button type="button" className={weaponGroup === "brancas" ? "ativa" : ""} onClick={() => setWeaponGroup("brancas")}>Armas brancas</button><button type="button" className={weaponGroup === "fogo" ? "ativa" : ""} onClick={() => setWeaponGroup("fogo")}>Armas de fogo</button></div>}
      {area === "equipamentos" && <div className="ritos-subabas espiral-store-subtabs" aria-label="Categorias de equipamentos">{equipmentCategories.map((entry) => <button type="button" className={category === entry.id ? "ativa" : ""} onClick={() => setCategory(entry.id)} key={entry.id}>{entry.nome}</button>)}</div>}
      <div className="espiral-store-ledger"><span>CATÁLOGO ATIVO</span><b>{catalogTitle}</b><small>{items.length} REGISTROS DISPONÍVEIS</small></div>{notice && <p className="loja-mensagem espiral-store-notice" role="status">{notice}</p>}
      <div className="loja-layout"><section className="loja-catalogo" aria-label="Catálogo">{items.map((item, index) => <article className="loja-item espiral-store-item" key={item.id}><div><div className="loja-item-topo"><div className="loja-item-icone">{renderItemIcon(item)}</div><span className="loja-item-tipo">{itemType(item)}</span><span className="espiral-store-index">{String(index + 1).padStart(2, "0")}</span></div><h2>{item.name}</h2>{item.damage && <div className="loja-item-beneficios"><span>DANO // {item.damage}</span></div>}{item.value !== undefined && <div className="loja-defesa-beneficios"><span>PROTEÇÃO // {item.value}</span></div>}<p>{item.detail}</p>{item.region && <p className="espiral-store-region">REGIÃO // {item.region}</p>}</div><div className="loja-item-footer"><button type="button" onClick={() => addToCart(item)}>Separar <Icon path={mdiCart} size={0.75} /></button></div></article>)}</section>
        <aside className="loja-carrinho espiral-store-cart" aria-label="Itens separados"><div className="loja-carrinho-topo"><div><Icon path={mdiCart} size={0.9} /><span>INCORPORAÇÃO</span></div><strong>{cart.length} {cart.length === 1 ? "item" : "itens"}</strong></div><div className="loja-carrinho-lista">{cart.length === 0 ? <p className="loja-carrinho-vazio">Nenhum item separado.</p> : cart.map((item) => <div className="loja-carrinho-item" key={item.cartId}><span className="loja-carrinho-icone">{renderItemIcon(item, 0.75)}</span><div><strong>{item.name}</strong><small>{itemType(item)}</small></div><button type="button" onClick={() => removeFromCart(item.cartId)} aria-label={`Remover ${item.name}`}><Icon path={mdiClose} size={0.7} /></button></div>)}</div><div className="loja-total"><span>ARQUIVO ATIVO</span><strong>{id === "principal" ? "PRINCIPAL" : id}</strong></div><button className="loja-finalizar" type="button" disabled={!cart.length} onClick={finalize}><Icon path={mdiCheck} size={0.8} /> Incorporar à ficha</button></aside>
      </div>
    </section>
  </main>;
}
