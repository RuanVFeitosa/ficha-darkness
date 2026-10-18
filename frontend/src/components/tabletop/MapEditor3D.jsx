import React, { useEffect, useMemo, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import "../../styles/MapEditor3D.css";

export const MAP_STORAGE_KEY = "darkness_tabletop_3d_map_v1";
const POLY_API = "https://api.polyhaven.com";
const EMPTY_DEPENDENCIES = {};
const PBR_TEXTURES = {
  "floor-grass": "grass_ground",
  "floor-grass-dark": "withered_grass",
  "floor-stone": "monastery_stone_floor",
  "floor-wood": "wood_floor",
  "floor-concrete": "concrete_floor",
  "floor-tiles": "anti_skid_tiles",
  "wall-brick": "brick_wall_001",
  "wall-concrete": "concrete_wall_007",
  "wall-wood": "wood_floor_worn",
  "door-modern": "wood_floor",
};
const LOCAL_PBR_TEXTURES = new Set([
  "grass_ground",
  "withered_grass",
  "monastery_stone_floor",
  "wood_floor",
  "concrete_floor",
  "anti_skid_tiles",
]);
const REALISTIC_CATEGORIES = [
  { id: "all", label: "Todos", terms: [] },
  { id: "furniture", label: "Móveis", terms: ["furniture", "chair", "table", "sofa", "bed", "cabinet", "shelf"] },
  { id: "architecture", label: "Arquitetura", terms: ["architecture", "door", "window", "wall", "building", "column", "stairs"] },
  { id: "urban", label: "Urbano", terms: ["urban", "street", "road", "traffic", "city", "sidewalk", "sign"] },
  { id: "decor", label: "Decoração", terms: ["decor", "art", "statue", "vase", "picture", "rug", "curtain"] },
  { id: "electronics", label: "Eletrônicos", terms: ["electronic", "appliance", "computer", "phone", "radio", "television"] },
  { id: "lighting", label: "Iluminação", terms: ["lighting", "lamp", "lantern", "light", "candle"] },
  { id: "nature", label: "Natureza", terms: ["nature", "plant", "tree", "rock", "wood", "outdoor"] },
  { id: "industrial", label: "Industrial", terms: ["industrial", "tool", "equipment", "machine", "barrel", "construction"] },
  { id: "food", label: "Cozinha", terms: ["food", "kitchen", "drink", "fruit", "bottle", "plate"] },
];
const FAVORITES_STORAGE_KEY = "darkness_map_asset_favorites_v1";
const STRUCTURE_CATEGORIES = [
  ["all", "Todos"],
  ["floor", "Chãos"],
  ["wall", "Paredes"],
  ["opening", "Portas e aberturas"],
];
const STRUCTURE_ASSETS = [
  { id: "structure/grass", name: "Grama natural", kind: "floor-grass", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/grass_ground.png?width=256&height=256" },
  { id: "structure/grass-dark", name: "Grama seca", kind: "floor-grass-dark", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/withered_grass.png?width=256&height=256" },
  { id: "structure/stone", name: "Piso de pedra", kind: "floor-stone", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/monastery_stone_floor.png?width=256&height=256" },
  { id: "structure/wood", name: "Piso de madeira", kind: "floor-wood", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/wood_floor.png?width=256&height=256" },
  { id: "structure/concrete", name: "Concreto moderno", kind: "floor-concrete", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/concrete_floor.png?width=256&height=256" },
  { id: "structure/tiles", name: "Ladrilho antiderrapante", kind: "floor-tiles", category: "floor", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/anti_skid_tiles.png?width=256&height=256" },
  { id: "structure/brick-wall", name: "Parede de tijolos", kind: "wall-brick", category: "wall", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/brick_wall_001.png?width=256&height=256" },
  { id: "structure/concrete-wall", name: "Parede de concreto", kind: "wall-concrete", category: "wall", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/concrete_wall_007.png?width=256&height=256" },
  { id: "structure/wood-wall", name: "Parede de madeira", kind: "wall-wood", category: "wall", packName: "PBR · Poly Haven", thumb: "https://cdn.polyhaven.com/asset_img/thumbs/wood_floor_worn.png?width=256&height=256" },
  { id: "structure/glass-wall", name: "Divisória de vidro", kind: "wall-glass", category: "wall", packName: "Arquitetura moderna" },
  { id: "structure/doorway", name: "Vão de porta", kind: "doorway", category: "opening", packName: "Portas e aberturas" },
  { id: "structure/modern-door", name: "Porta moderna", kind: "door-modern", category: "opening", packName: "Portas e aberturas" },
  { id: "structure/window", name: "Janela ampla", kind: "window-modern", category: "opening", packName: "Portas e aberturas" },
];

function PbrMaterial({ slug, repeat = [1, 1], fallback = "#777" }) {
  const [maps, setMaps] = useState(null);
  const repeatX = repeat[0];
  const repeatY = repeat[1];
  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    setMaps(null);
    const base = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${slug}/${slug}`;
    const diffuseUrl = LOCAL_PBR_TEXTURES.has(slug)
      ? `/tabletop/textures/${slug}_diff_1k.jpg`
      : `${base}_diff_1k.jpg`;
    const loader = new THREE.TextureLoader();
    const loadedTextures = [];
    loader.setCrossOrigin("anonymous");
    const applyTexture = (key, texture, color = false) => {
      if (!active) {
        texture.dispose();
        return;
      }
      loadedTextures.push(texture);
      if (color) texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.needsUpdate = true;
      setMaps((current) => ({ ...(current || {}), [key]: texture }));
    };
    loader.load(diffuseUrl, (texture) => applyTexture("map", texture, true));
    loader.load(`${base}_nor_gl_1k.jpg`, (texture) => applyTexture("normalMap", texture));
    loader.load(`${base}_rough_1k.jpg`, (texture) => applyTexture("roughnessMap", texture));
    return () => {
      active = false;
      loadedTextures.forEach((texture) => texture.dispose());
    };
  }, [repeatX, repeatY, slug]);
  return <meshStandardMaterial {...maps} color={maps?.map ? "#fff" : fallback} roughness={maps?.roughnessMap ? 1 : .9} normalScale={new THREE.Vector2(.65, .65)} side={THREE.DoubleSide}/>;
}

export function loadSavedMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MAP_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PrimitiveAsset({ kind }) {
  const material = <meshStandardMaterial color="#765d48" roughness={0.82} />;
  if (kind?.startsWith("floor-")) {
    const colors = {
      "floor-grass": "#789268", "floor-grass-dark": "#697257", "floor-stone": "#99978f",
      "floor-wood": "#a67d5b", "floor-concrete": "#949899", "floor-tiles": "#918d82",
    };
    const color = colors[kind] || "#777";
    return <group>
      <mesh position={[0,.035,0]} receiveShadow><boxGeometry args={[2,.07,2]}/><PbrMaterial slug={PBR_TEXTURES[kind]} repeat={[2,2]} fallback={color}/></mesh>
    </group>;
  }
  if (kind?.startsWith("wall-") || kind === "window-modern") {
    if (kind === "wall-glass" || kind === "window-modern") return <group>
      <mesh position={[0,1,0]} castShadow><boxGeometry args={[2,.09,.14]}/><meshStandardMaterial color="#262f31" metalness={.6} roughness={.35}/></mesh>
      <mesh position={[0,.08,0]} castShadow><boxGeometry args={[2,.12,.14]}/><meshStandardMaterial color="#262f31" metalness={.6} roughness={.35}/></mesh>
      {[-.94,.94].map((x) => <mesh key={x} position={[x,.55,0]} castShadow><boxGeometry args={[.1,1,.14]}/><meshStandardMaterial color="#262f31" metalness={.6} roughness={.35}/></mesh>)}
      <mesh position={[0,.55,0]}><boxGeometry args={[1.82,.82,.045]}/><meshPhysicalMaterial color="#8fb8be" transparent opacity={.34} roughness={.12} metalness={.1}/></mesh>
    </group>;
    const wallColor = kind === "wall-brick" ? "#794d3e" : kind === "wall-wood" ? "#654834" : "#777b7a";
    return <group><mesh position={[0,1,0]} castShadow receiveShadow><boxGeometry args={[2,2,.18]}/><PbrMaterial slug={PBR_TEXTURES[kind]} repeat={[2,2]} fallback={wallColor}/></mesh></group>;
  }
  if (kind === "doorway" || kind === "door-modern") return <group>
    {[-.85,.85].map((x) => <mesh key={x} position={[x,1,0]} castShadow><boxGeometry args={[.3,2,.22]}/><meshStandardMaterial color="#6f7270" roughness={.8}/></mesh>)}
    <mesh position={[0,1.9,0]} castShadow><boxGeometry args={[2,.22,.22]}/><meshStandardMaterial color="#6f7270" roughness={.8}/></mesh>
    {kind === "door-modern" && <mesh position={[0,.95,.02]} castShadow><boxGeometry args={[1.52,1.78,.12]}/><PbrMaterial slug={PBR_TEXTURES[kind]} repeat={[1,2]} fallback="#47372d"/></mesh>}
  </group>;
  if (kind === "wall") return <mesh position={[0,0.65,0]} castShadow receiveShadow><boxGeometry args={[1.8,1.3,0.16]}/>{material}</mesh>;
  if (kind === "crate") return <mesh position={[0,0.38,0]} castShadow receiveShadow><boxGeometry args={[0.75,0.75,0.75]}/>{material}</mesh>;
  if (kind === "table") return <group><mesh position={[0,0.72,0]} castShadow><boxGeometry args={[1.5,0.14,0.85]}/>{material}</mesh>{[[-0.6,-0.28],[0.6,-0.28],[-0.6,0.28],[0.6,0.28]].map(([x,z]) => <mesh key={`${x}-${z}`} position={[x,0.35,z]} castShadow><boxGeometry args={[0.12,0.7,0.12]}/>{material}</mesh>)}</group>;
  if (kind === "shelf") return <group><mesh position={[0,0.9,0]} castShadow><boxGeometry args={[1.15,1.8,0.32]}/><meshStandardMaterial color="#4e4036" roughness={0.9}/></mesh>{[0.35,0.85,1.35].map(y => <mesh key={y} position={[0,y,0.18]} castShadow><boxGeometry args={[1.05,0.08,0.38]}/>{material}</mesh>)}</group>;
  return <group><mesh position={[0,0.62,0]} castShadow><cylinderGeometry args={[0.05,0.07,1.2,12]}/><meshStandardMaterial color="#343b3d"/></mesh><mesh position={[0,1.25,0]}><sphereGeometry args={[0.18,16,12]}/><meshStandardMaterial color="#ffe0a0" emissive="#ffb85c" emissiveIntensity={2}/></mesh><pointLight position={[0,1.25,0]} color="#ffbf74" intensity={5} distance={4}/></group>;
}

export function RemoteAsset({ file, dependencies, modelRole }) {
  const url = file;
  const [loadedScene, setLoadedScene] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setLoadedScene(null);
    setFailed(false);
    const manager = new THREE.LoadingManager();
    const dependencyEntries = Object.entries(dependencies || EMPTY_DEPENDENCIES);
    manager.setURLModifier((requestedUrl) => {
      const normalized = decodeURI(requestedUrl).replaceAll("\\", "/");
      const match = dependencyEntries.find(([path]) => normalized.endsWith(path.replaceAll("\\", "/")));
      return match?.[1] || requestedUrl;
    });
    const loader = new GLTFLoader(manager);
    loader.load(url, (gltf) => active && setLoadedScene(gltf.scene), undefined, () => active && setFailed(true));
    return () => { active = false; };
  }, [dependencies, url]);
  const normalized = useMemo(() => {
    if (!loadedScene) return null;
    const scene = loadedScene.clone(true);
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z, 0.01);
    return {
      scene,
      scale: (modelRole === "map" ? 12 : 1.35) / largest,
      offset: [-center.x, -bounds.min.y, -center.z],
    };
  }, [loadedScene, modelRole]);
  if (!normalized) return <LoadingAsset failed={failed}/>;
  return <group scale={normalized.scale}><primitive object={normalized.scene} position={normalized.offset}/></group>;
}

function LoadingAsset({ failed = false }) {
  return <mesh position={[0,0.32,0]} castShadow><boxGeometry args={[0.55,0.55,0.55]}/><meshStandardMaterial color={failed ? "#9b4c47" : "#756b5d"} wireframe/></mesh>;
}

export function AssetModel({ asset }) {
  if (!asset) return null;
  return asset.kind
    ? <PrimitiveAsset kind={asset.kind}/>
    : <RemoteAsset file={asset.fileUrl || asset.file} dependencies={asset.dependencies} modelRole={asset.modelRole}/>;
}

export function PlacedAssets({ items, selectedId, onSelect, onSurfaceClick }) {
  return items.map((item) => (
    <group
      key={item.instanceId}
      position={[item.x,0.01,item.z]}
      rotation={[0,item.rotation || 0,0]}
      scale={item.scale || 1}
      onClick={(event) => {
        event.stopPropagation();
        if(onSurfaceClick) onSurfaceClick(event);
        else onSelect(item.instanceId);
      }}
    >
      <AssetModel asset={item.asset}/>
      {selectedId === item.instanceId && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.025,0]}><ringGeometry args={[0.68,0.75,40]}/><meshBasicMaterial color="#ffe09b" transparent opacity={0.95}/></mesh>}
    </group>
  ));
}

const normalize = (value) => String(value || "").toLocaleLowerCase("pt-BR");

export default function MapEditor3D({
  open,
  items,
  selectedId,
  pendingAsset,
  onClose,
  onPrepare,
  onUpdate,
  onDuplicate,
  onDelete,
  onSave,
  onClear,
  mapName = "",
  onMapNameChange,
  savedMaps = [],
  activeMapId = "",
  onLoadMap,
  onNewMap,
  placement = { rotation: 0, scale: 1, snap: true, repeat: false },
  onPlacementChange,
  onCancelPlacement,
  onImportModel,
  importingModel = false,
  onPublishScene,
  publishingScene = false,
}) {
  const modelInputRef = useRef(null);
  const [source, setSource] = useState("structures");
  const [structureCategory, setStructureCategory] = useState("all");
  const [realisticCategory, setRealisticCategory] = useState("all");
  const [realisticCatalog, setRealisticCatalog] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    }
    catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [resolvingId, setResolvingId] = useState("");

  useEffect(() => {
    if (!open || source !== "polyhaven") return;
    let active = true;
    setLoading(true);
    setCatalogError("");
    fetch(`${POLY_API}/assets?type=models`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Object.keys(data || {}).length) return data;
        const fallback = await fetch(`${POLY_API}/assets?type=2`);
        if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`);
        return fallback.json();
      })
      .then((data) => {
        if (!active) return;
        setRealisticCatalog(Object.entries(data).map(([id, asset]) => ({
          id: `polyhaven/${id}`,
          slug: id,
          name: asset.name || id.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          description: asset.description,
          thumb: asset.thumbnail_url || asset.thumbnail || asset.preview_url || `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?height=256`,
          category: asset.category || "",
          tags: Array.isArray(asset.tags) ? asset.tags : [],
          published: asset.date_published || asset.published || "",
          packName: "Poly Haven · PBR",
          sourceUrl: `https://polyhaven.com/a/${id}`,
          license: "CC0-1.0",
          downloadCount: asset.download_count || 0,
        })).sort((a,b) => b.downloadCount - a.downloadCount));
      })
      .catch(() => active && setCatalogError("Não foi possível carregar os modelos realistas. Tente novamente ou use a biblioteca leve."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, source]);

  const selected = items.find((item) => item.instanceId === selectedId);
  const visibleAssets = useMemo(() => {
    const query = normalize(search);
    const category = REALISTIC_CATEGORIES.find((item) => item.id === realisticCategory);
    if (source === "structures") return STRUCTURE_ASSETS
      .filter((asset) => structureCategory === "all" || asset.category === structureCategory)
      .filter((asset) => !query || normalize(`${asset.name} ${asset.packName}`).includes(query));
    const online = realisticCatalog
      .filter((asset) => {
        const searchable = normalize(`${asset.name} ${asset.description || ""} ${asset.category || ""} ${(asset.tags || []).join(" ")}`);
        const matchesCategory = !category?.terms.length || category.terms.some((term) => searchable.includes(term));
        const matchesFavorite = !onlyFavorites || favorites.includes(asset.id);
        return matchesCategory && matchesFavorite && (!query || searchable.includes(query));
      })
      .sort((a, b) => sort === "name"
        ? String(a.name).localeCompare(String(b.name), "pt-BR")
        : sort === "recent"
          ? String(b.published || "").localeCompare(String(a.published || ""))
          : (b.downloadCount || 0) - (a.downloadCount || 0));
    return online.slice(0, 120);
  }, [favorites, onlyFavorites, realisticCatalog, realisticCategory, search, sort, source, structureCategory]);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  };

  const prepareAsset = async (asset) => {
    if (!asset.slug) {
      onPrepare(asset);
      return;
    }
    try {
      setResolvingId(asset.id);
      setCatalogError("");
      const response = await fetch(`${POLY_API}/files/${encodeURIComponent(asset.slug)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const files = await response.json();
      const selectedFile = files.gltf?.["1k"]?.gltf || files.gltf?.["2k"]?.gltf;
      const fileUrl = selectedFile?.url;
      if (!fileUrl) throw new Error("Modelo sem glTF compatível");
      const dependencies = Object.fromEntries(Object.entries(selectedFile.include || {}).map(([path,info]) => [path,info.url]));
      onPrepare({...asset,fileUrl,dependencies});
    } catch {
      setCatalogError("Este modelo não pôde ser preparado. Escolha outro asset.");
    } finally {
      setResolvingId("");
    }
  };

  if (!open) return null;
  return <aside className="tt3-editor" aria-label="Criador de mapas 3D">
    <div className="tt3-editor-head"><div><small>OFICINA 3D · {items.length} OBJETOS</small><h2>Construtor de cenários</h2></div><button type="button" onClick={onClose} aria-label="Fechar criador">×</button></div>
    <section className="tt3-map-document">
      <input value={mapName} onChange={(event) => onMapNameChange(event.target.value)} placeholder="Nome do mapa" aria-label="Nome do mapa 3D"/>
      <select value={activeMapId} onChange={(event) => onLoadMap(event.target.value)} aria-label="Mapas 3D salvos">
        <option value="">Mapa novo</option>
        {savedMaps.map((map) => <option key={map.id} value={map.id}>{map.nome}</option>)}
      </select>
      <button type="button" onClick={onNewMap} title="Criar mapa vazio">＋ Novo</button>
    </section>
    <div className="tt3-editor-actions"><button type="button" className="primary" onClick={onSave}>Salvar mapa</button><button type="button" className="scene" onClick={onPublishScene} disabled={!items.length || publishingScene}>{publishingScene ? "Publicando…" : "Salvar e usar na cena"}</button><button type="button" onClick={onClear} disabled={!items.length}>Limpar tudo</button></div>
    <section className="tt3-model-import">
      <div><span>IMPORTAR MAPA 3D</span><small>GLB ou pacote GLTF com BIN e texturas</small></div>
      <button type="button" onClick={() => modelInputRef.current?.click()} disabled={importingModel}>{importingModel ? "Enviando…" : "Importar modelo"}</button>
      <input ref={modelInputRef} type="file" multiple accept=".glb,.gltf,.bin,.png,.jpg,.jpeg,.webp,.ktx2,.basis" hidden onChange={(event) => { const files=Array.from(event.target.files || []); event.target.value=""; if(files.length) onImportModel(files); }}/>
    </section>
    {pendingAsset && <section className="tt3-placement">
      <div className="tt3-placement-title"><span>POSICIONANDO</span><strong>{pendingAsset.name}</strong><button type="button" onClick={onCancelPlacement}>Cancelar</button></div>
      <div className="tt3-placement-tools">
        <button type="button" onClick={() => onPlacementChange({ rotation: placement.rotation - Math.PI / 4 })}>↶ 45°</button>
        <button type="button" onClick={() => onPlacementChange({ rotation: placement.rotation + Math.PI / 4 })}>↷ 45°</button>
        <button type="button" onClick={() => onPlacementChange({ scale: Math.max(.25, placement.scale - .15) })}>− Menor</button>
        <button type="button" onClick={() => onPlacementChange({ scale: Math.min(4, placement.scale + .15) })}>＋ Maior</button>
      </div>
      <div className="tt3-placement-options">
        <label><input type="checkbox" checked={placement.snap} onChange={(event) => onPlacementChange({ snap: event.target.checked })}/> Encaixar na grade</label>
        <label><input type="checkbox" checked={placement.repeat} onChange={(event) => onPlacementChange({ repeat: event.target.checked })}/> Inserir vários</label>
      </div>
      <p>Mova o cursor pelo cenário e clique para confirmar. Q/E gira · Esc cancela.</p>
    </section>}
    {selected && <section className="tt3-selection">
      <div><span>OBJETO SELECIONADO</span><strong>{selected.asset.name}</strong></div>
      <label className="tt3-range">Escala <input type="range" min="0.25" max="4" step="0.05" value={selected.scale || 1} onChange={(event) => onUpdate({ scale: Number(event.target.value) })}/><b>{(selected.scale || 1).toFixed(2)}×</b></label>
      <div className="tt3-transform-row"><button type="button" onClick={() => onUpdate({rotation:(selected.rotation || 0) - Math.PI/4})}>↶ Girar</button><button type="button" onClick={() => onUpdate({rotation:(selected.rotation || 0) + Math.PI/4})}>↷ Girar</button></div>
      <div className="tt3-transform-row"><button type="button" onClick={onDuplicate}>Duplicar</button><button type="button" className="danger" onClick={onDelete}>Remover</button></div>
      <p>Clique na grade para mover · Q/E gira · Delete remove.</p>
    </section>}
    <section className="tt3-library">
      <div className="tt3-library-title"><div><span>BIBLIOTECA DE ASSETS</span><strong>{source === "structures" ? `${STRUCTURE_ASSETS.length} peças PBR` : `${realisticCatalog.length} modelos PBR`}</strong></div><a href={source === "structures" ? "https://polyhaven.com/textures" : "https://polyhaven.com/models"} target="_blank" rel="noreferrer">Poly Haven ↗</a></div>
      <div className="tt3-library-filters">
        <select value={source} onChange={(event) => {setSource(event.target.value);setSearch("");setCatalogError("");}} aria-label="Estilo da biblioteca"><option value="structures">Construção PBR · pisos e paredes</option><option value="polyhaven">Objetos PBR · Poly Haven</option></select>
        {source === "structures" ? <select value={structureCategory} onChange={(event) => setStructureCategory(event.target.value)} aria-label="Categoria de construção">{STRUCTURE_CATEGORIES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select> : <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar assets"><option value="popular">Mais populares</option><option value="recent">Mais recentes</option><option value="name">Nome A–Z</option></select>}
      </div>
      <div className="tt3-search-row"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar sofá, porta, computador..." aria-label="Buscar assets"/><button type="button" className={onlyFavorites ? "active" : ""} onClick={() => setOnlyFavorites((value) => !value)} title="Mostrar favoritos">★</button></div>
      {source === "structures" ? <div className="tt3-category-chips">{STRUCTURE_CATEGORIES.map(([id,label]) => <button type="button" key={id} className={structureCategory === id ? "active" : ""} onClick={() => setStructureCategory(id)}>{label}</button>)}</div> : source === "polyhaven" && <div className="tt3-category-chips">{REALISTIC_CATEGORIES.map(({id,label}) => <button type="button" key={id} className={realisticCategory === id ? "active" : ""} onClick={() => setRealisticCategory(id)}>{label}</button>)}</div>}
      {loading && <p className="tt3-library-message">Carregando catálogo da internet…</p>}
      {catalogError && <p className="tt3-library-message error">{catalogError}</p>}
      <div className="tt3-asset-grid">{visibleAssets.map((asset) => <article key={asset.id} className={pendingAsset?.id === asset.id ? "active" : ""}>
        <button type="button" className="tt3-asset-main" disabled={resolvingId === asset.id} onClick={() => prepareAsset(asset)} title={`Adicionar ${asset.name}`}>
          {asset.thumb ? <img src={asset.thumb} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }}/> : null}<span className={`tt3-asset-icon ${asset.kind || "model"}`} hidden={Boolean(asset.thumb)}/><strong>{resolvingId === asset.id ? "Preparando…" : asset.name || "Modelo 3D"}</strong><small>{asset.packName || "Asset 3D"}</small>
        </button>
        {asset.slug && <button type="button" className={`tt3-favorite ${favorites.includes(asset.id) ? "active" : ""}`} onClick={() => toggleFavorite(asset.id)} aria-label={`${favorites.includes(asset.id) ? "Remover" : "Adicionar"} ${asset.name} dos favoritos`}>★</button>}
      </article>)}</div>
      {!loading && !visibleAssets.length && <p className="tt3-library-message">Nenhum asset encontrado.</p>}
    </section>
    <footer><span>{pendingAsset ? "Pré-visualização ativa no cenário" : `${items.length} objeto(s) no mapa`}</span><a href="https://polyhaven.com" target="_blank" rel="noreferrer">Materiais e assets CC0 · Poly Haven</a></footer>
  </aside>;
}
