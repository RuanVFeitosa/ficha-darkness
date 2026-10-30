import EspiralDice from '../components/espiral/EspiralDice';
import React, { useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiArrowLeft, mdiCart, mdiCheck, mdiClose, mdiMedicalBag, mdiPistol, mdiRadio, mdiShield, mdiSword, mdiToolbox, mdiAxe, mdiKnifeMilitary } from "@mdi/js";
import "../styles/LojaEspiral.css";
import "../styles/EspiralMerchant.css";
import { CATALOGO_ESPIRAL, CATEGORIAS_ESPIRAL } from "../data/catalogoEspiral";
import { obterIconeItem } from "../utils/itemIcons";
import { iconeLojaEspiral } from '../utils/espiralStoreIcons';

const sheetKey = (id) => `espiral:sheet:v1:${id || "principal"}`;
const iconForItem = (item) => {
  const especifico = iconeLojaEspiral(item);
  if (especifico) return especifico;
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
  const [busca, setBusca] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const equipmentCategories = CATEGORIAS_ESPIRAL.filter(({ id: categoryId }) => !["armas", "protecoes"].includes(categoryId));
  const items = useMemo(() => {
    const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return CATALOGO_ESPIRAL.filter((item) => item.category === (area === "equipamentos" ? category : area) && (area !== "armas" || item.weaponGroup === weaponGroup) && normalizar(`${item.name} ${item.detail}`).includes(normalizar(busca.trim())));
  }, [area, category, weaponGroup, busca]);
  const selected = items.find(item => item.id === selectedId) || items[0];
  const addToCart = (item) => { setCart((current) => [...current, { ...item, cartId: `${item.id}-${Date.now()}-${current.length}` }]); setNotice(`${item.name} separado para incorporação.`); };
  const removeFromCart = (cartId) => setCart((current) => current.filter((item) => item.cartId !== cartId));
  const finalize = () => {
    if (!cart.length) return;
    let sheet;
    try { sheet = JSON.parse(localStorage.getItem(sheetKey(id)) || "{}"); } catch { sheet = {}; }
    cart.forEach((item) => {
      const itemId = `${item.id}-${Date.now()}-${Math.random()}`;
      if (item.type === "weapon") sheet.weapons = [...(sheet.weapons || []), {
        id: itemId,
        sourceId: item.id,
        name: item.name,
        damage: item.damage,
        ammo: "",
        detail: item.detail,
        category: item.category,
        weaponGroup: item.weaponGroup,
      }];
      else if (item.type === "protection") sheet.protections = [...(sheet.protections || []), {
        id: itemId,
        sourceId: item.id,
        name: item.name,
        value: String(item.value),
        region: item.region,
        detail: item.detail,
        category: item.category,
      }];
      else {
        sheet.inventoryItems = [...(Array.isArray(sheet.inventoryItems) ? sheet.inventoryItems : []), {
          id: itemId,
          sourceId: item.id,
          name: item.name,
          type: item.type,
          category: item.category,
          detail: item.detail,
          quantity: 1,
        }];
        sheet.inventory = [...new Set([...(sheet.inventory || "").split("\n").filter(Boolean), item.name])].join("\n");
      }
    });
    localStorage.setItem(sheetKey(id), JSON.stringify(sheet));
    setNotice(`${cart.length} ${cart.length === 1 ? "item incorporado" : "itens incorporados"} ao arquivo ESPIRAL.`);
    setCart([]);
  };
  const catalogTitle = area === "equipamentos" ? equipmentCategories.find((entry) => entry.id === category)?.nome : area === "armas" ? "Armas" : "Proteções";
  return <main className="espiral-store loja-page espiral-merchant" style={{ '--store-texture': `url("${process.env.PUBLIC_URL || ''}/tabletop/textures/concrete_floor_diff_1k.jpg")` }}>
    <header className="espiral-store-hero loja-hero"><div className="espiral-store-hero-overlay" /><a className="espiral-store-back loja-voltar" href={`?sistema=espiral&ficha=${encodeURIComponent(id)}`}><Icon path={mdiArrowLeft} size={0.8} /> Voltar à ficha</a><div className="espiral-store-hero-copy loja-hero-copy"><span className="loja-kicker">ESPIRAL / DEPÓSITO DE SUPRIMENTOS</span><h1>Leve o necessário.<br /><em>Volte inteiro.</em></h1><p>Uma lâmina confiável. Um colete gasto. O kit que pode salvar alguém. Escolha o que vai acompanhar você lá fora.</p><div className="espiral-store-hero-tags"><span><i/> Suprimentos de campo</span><span>Armas · Proteções · Equipamentos</span></div></div><div className="espiral-store-hero-art" aria-hidden="true"><div className="espiral-store-orbit"/><div className="espiral-store-case"><Icon path={mdiToolbox} size={5}/><span>ESPIRAL / MATERIAL DE CAMPO</span></div><span className="espiral-store-art-note">INSPECIONADO E CATALOGADO<br/>USO EM CAMPO</span><span className="espiral-store-art-cross">+</span></div></header>
    <section className="loja-shell espiral-store-shell">
      <div className="espiral-store-toolbar-row"><div className="loja-toolbar" aria-label="Categorias da loja"><button type="button" className={`loja-categoria ${area === "armas" ? "ativa" : ""}`} onClick={() => setArea("armas")}><Icon path={mdiPistol} size={0.8} /> Armas</button><button type="button" className={`loja-categoria ${area === "protecoes" ? "ativa" : ""}`} onClick={() => setArea("protecoes")}><Icon path={mdiShield} size={0.8} /> Proteções</button><button type="button" className={`loja-categoria ${area === "equipamentos" ? "ativa" : ""}`} onClick={() => setArea("equipamentos")}><Icon path={mdiToolbox} size={0.8} /> Equipamentos</button></div><label className="espiral-store-search"><span>Buscar no catálogo</span><input type="search" placeholder="Nome ou característica…" value={busca} onChange={e=>setBusca(e.target.value)}/></label></div>
      {area === "armas" && <div className="ritos-subabas espiral-store-subtabs" aria-label="Categorias de armas"><button type="button" className={weaponGroup === "brancas" ? "ativa" : ""} onClick={() => setWeaponGroup("brancas")}>Armas brancas</button><button type="button" className={weaponGroup === "fogo" ? "ativa" : ""} onClick={() => setWeaponGroup("fogo")}>Armas de fogo</button></div>}
      {area === "equipamentos" && <div className="ritos-subabas espiral-store-subtabs" aria-label="Categorias de equipamentos">{equipmentCategories.map((entry) => <button type="button" className={category === entry.id ? "ativa" : ""} onClick={() => setCategory(entry.id)} key={entry.id}>{entry.nome}</button>)}</div>}
      <div className="espiral-store-ledger"><span>CATÁLOGO ATIVO</span><b>{catalogTitle}</b><small>{items.length} REGISTROS DISPONÍVEIS</small></div>{notice && <p className="loja-mensagem espiral-store-notice" role="status">{notice}</p>}
      <div className="loja-layout">
        <section className="merchant-list" aria-label="Catálogo">
          <div className="merchant-list-heading"><span>SUPRIMENTOS DISPONÍVEIS</span><small>{String(items.length).padStart(2,'0')}</small></div>
          {!items.length && <p className="espiral-store-empty">Nenhum item encontrado nesta categoria. Tente outra busca.</p>}
          {items.map((item,index)=><button type="button" className={`merchant-row ${selected?.id===item.id?'selected':''}`} key={item.id} aria-pressed={selected?.id===item.id} onClick={()=>setSelectedId(item.id)}>
            <span className="merchant-row-icon" aria-hidden="true">{renderItemIcon(item)}</span><span className="merchant-row-name">{item.name}<small>{itemType(item)}</small></span><span className="merchant-row-stat">{item.damage?<EspiralDice value={item.damage}/>:item.value!==undefined?`+${item.value}`:String(index+1).padStart(2,'0')}</span><span className="merchant-row-arrow" aria-hidden="true">›</span>
          </button>)}
        </section>
        <section className="merchant-inspection" aria-label="Item selecionado">
          {selected ? <div key={selected.id} className="merchant-inspection-content">
            <header><span>{itemType(selected)} / {selected.weaponGroup==='fogo'?'ARMA DE FOGO':selected.weaponGroup==='brancas'?'ARMA BRANCA':'SUPRIMENTO DE CAMPO'}</span><small>ESPIRAL · CATÁLOGO DE CAMPO</small></header>
            <div className="merchant-display" aria-hidden="true"><div className="merchant-display-object">{renderItemIcon(selected,9)}</div><span className="merchant-display-label">{selected.name}</span></div>
            <div className="merchant-item-title"><h2>{selected.name}</h2><button type="button" onClick={()=>addToCart(selected)}>Separar <Icon path={mdiCart} size={0.75}/></button></div>
            <div className="merchant-specification"><div><h3>Características</h3><p>{selected.detail}</p>{selected.region && <p>Região protegida: {selected.region}</p>}</div><dl>{selected.damage && <div><dt>Dano</dt><dd><EspiralDice value={selected.damage}/></dd></div>}{selected.value!==undefined && <div><dt>Proteção</dt><dd>{selected.value}</dd></div>}<div><dt>Categoria</dt><dd>{itemType(selected).toLowerCase()}</dd></div><div><dt>Destino</dt><dd>{selected.type==='weapon'?'Armamento':selected.type==='protection'?'Proteções':'Inventário'}</dd></div></dl></div>
          </div> : <p className="espiral-store-empty">Escolha outra categoria ou ajuste sua busca para inspecionar um item.</p>}
        </section>
        <aside className="loja-carrinho espiral-store-cart" aria-label="Itens separados"><div className="loja-carrinho-topo"><div><Icon path={mdiCart} size={0.9} /><span>INCORPORAÇÃO</span></div><strong>{cart.length} {cart.length === 1 ? "item" : "itens"}</strong></div><div className="loja-carrinho-lista">{cart.length === 0 ? <p className="loja-carrinho-vazio">Seu próximo kit começa aqui. Separe os itens do catálogo para montar seu equipamento.</p> : cart.map((item) => <div className="loja-carrinho-item" key={item.cartId}><span className="loja-carrinho-icone">{renderItemIcon(item, 0.75)}</span><div><strong>{item.name}</strong><small>{itemType(item)}</small></div><button type="button" onClick={() => removeFromCart(item.cartId)} aria-label={`Remover ${item.name}`}><Icon path={mdiClose} size={0.7} /></button></div>)}</div><div className="loja-total"><span>ARQUIVO ATIVO</span><strong>{id === "principal" ? "PRINCIPAL" : id}</strong></div><button className="loja-finalizar" type="button" disabled={!cart.length} onClick={finalize}><Icon path={mdiCheck} size={0.8} /> Incorporar à ficha</button></aside>
      </div>
    </section>
  </main>;
}
