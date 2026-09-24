import React, { useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiAxe, mdiKnifeMilitary, mdiMedicalBag, mdiPistol, mdiRadio, mdiShield, mdiSword, mdiToolbox } from "@mdi/js";
import "../CSS/LojaEspiral.css";
import { CATALOGO_ESPIRAL, CATEGORIAS_ESPIRAL } from "../data/catalogoEspiral";

const sheetKey = (id) => `espiral:sheet:v1:${id || "principal"}`;

const iconForItem = (item) => {
  const text = `${item.name} ${item.category || ""}`.toLowerCase();
  if (item.type === "protection") return mdiShield;
  if (text.includes("medic") || text.includes("kit") || text.includes("torniquete")) return mdiMedicalBag;
  if (text.includes("rádio") || text.includes("telefone")) return mdiRadio;
  if (text.includes("faca") || text.includes("punhal")) return mdiKnifeMilitary;
  if (text.includes("machado") || text.includes("marreta") || text.includes("martelo")) return mdiAxe;
  if (item.type === "weapon" && (text.includes("pistola") || text.includes("revólver"))) return mdiPistol;
  if (item.type === "weapon") return mdiSword;
  return mdiToolbox;
};

export default function LojaEspiral() {
  const id = new URLSearchParams(window.location.search).get("ficha") || "principal";
  const [area, setArea] = useState("armas");
  const [weaponGroup, setWeaponGroup] = useState("brancas");
  const [category, setCategory] = useState("medicina");
  const [notice, setNotice] = useState("");
  const equipmentCategories = CATEGORIAS_ESPIRAL.filter((entry) => !["armas", "protecoes"].includes(entry.id));
  const items = useMemo(() => CATALOGO_ESPIRAL.filter((item) => item.category === (area === "equipamentos" ? category : area) && (area !== "armas" || item.weaponGroup === weaponGroup)), [area, category, weaponGroup]);
  const addToSheet = (item) => {
    let sheet;
    try { sheet = JSON.parse(localStorage.getItem(sheetKey(id)) || "{}"); } catch { sheet = {}; }
    if (item.type === "weapon") {
      sheet.weapons = [...(sheet.weapons || []), { id: `${item.id}-${Date.now()}`, name: item.name, damage: item.damage, ammo: "" }];
    } else if (item.type === "protection") {
      sheet.protections = [...(sheet.protections || []), { id: `${item.id}-${Date.now()}`, name: item.name, value: String(item.value), region: item.region }];
    } else {
      sheet.inventory = [...new Set([...(sheet.inventory || "").split("\n").filter(Boolean), item.name])].join("\n");
    }
    localStorage.setItem(sheetKey(id), JSON.stringify(sheet));
    setNotice(`✓ ${item.name} incorporado ao arquivo ESPIRAL.`);
  };
  return <main className="espiral-store">
    <header className="espiral-store-hero">
      <div className="espiral-store-mark" aria-hidden="true"><i /><i /><i /><i /></div>
      <div><small>ESPIRAL // TERMINAL DE SUPRIMENTOS</small><h1>O que você leva<br />para o incerto.</h1><p>Recursos de campo catalogados para esta ficha. Toda escolha deixa uma marca.</p></div>
      <a href={`/?ficha=${encodeURIComponent(id)}`}>Retornar ao arquivo →</a>
    </header>
    <aside className="espiral-store-aside">
      <span className="espiral-store-aside-kicker">ARQUIVO DE CAMPO</span>
      <h2>Suprimentos</h2>
      <p>Escolha recursos para esta ficha. Cada incorporação permanece registrada no inventário.</p>
      <div className="espiral-store-aside-rule" />
      <div className="espiral-store-aside-meta"><span>FICHA ATIVA</span><b>{id === "principal" ? "PRINCIPAL" : id}</b></div>
      <div className="espiral-store-aside-meta"><span>PROTOCOLO</span><b>ESPIRAL / CAMPO</b></div>
      <div className="espiral-store-aside-note">Itens adicionados podem ser removidos ou ajustados diretamente na ficha.</div>
    </aside>
    <section className="espiral-store-main">
    <nav className="espiral-store-tabs espiral-store-areas" aria-label="Áreas da loja">
      <button type="button" className={area === "armas" ? "active" : ""} onClick={() => setArea("armas")}>Armas</button>
      <button type="button" className={area === "protecoes" ? "active" : ""} onClick={() => setArea("protecoes")}>Proteções</button>
      <button type="button" className={area === "equipamentos" ? "active" : ""} onClick={() => setArea("equipamentos")}>Equipamentos</button>
    </nav>
    {area === "armas" && <nav className="espiral-store-tabs espiral-store-subtabs espiral-store-weapon-tabs" aria-label="Categorias de armas"><button type="button" className={weaponGroup === "brancas" ? "active" : ""} onClick={() => setWeaponGroup("brancas")}>Armas brancas</button><button type="button" className={weaponGroup === "fogo" ? "active" : ""} onClick={() => setWeaponGroup("fogo")}>Armas de fogo</button></nav>}
    {area === "equipamentos" && <nav className="espiral-store-tabs espiral-store-subtabs" aria-label="Categorias de equipamentos">{equipmentCategories.map((entry) => <button type="button" className={category === entry.id ? "active" : ""} onClick={() => setCategory(entry.id)} key={entry.id}>{entry.nome}</button>)}</nav>}
    <div className="espiral-store-ledger"><span>CATÁLOGO ATIVO</span><b>{area === "equipamentos" ? equipmentCategories.find((entry) => entry.id === category)?.nome : area === "armas" ? "Armas" : "Proteções"}</b><small>{items.length} REGISTROS DISPONÍVEIS</small></div>
    <p className="espiral-store-notice" role="status">{notice}</p>
    <section className="espiral-store-grid">{items.map((item, index) => <article key={item.id} data-index={String(index + 1).padStart(2, "0")}>
      <div className="espiral-store-card-head"><span className="espiral-store-item-icon"><Icon path={iconForItem(item)} size={1.35} /></span><small>{item.type === "weapon" ? "ARMA" : item.type === "protection" ? "PROTEÇÃO" : "EQUIPAMENTO"}</small><h2>{item.name}</h2>
      <span className="espiral-store-index">{String(index + 1).padStart(2, "0")}</span>{item.damage && <strong>DANO {item.damage}</strong>}{item.value !== undefined && <strong>PROTEÇÃO {item.value}</strong>}<p>{item.detail}</p>{item.region && <p>REGIÃO // {item.region}</p>}</div>
      <button type="button" onClick={() => addToSheet(item)}>Incorporar →</button>
    </article>)}</section>
    </section>
  </main>;
}
