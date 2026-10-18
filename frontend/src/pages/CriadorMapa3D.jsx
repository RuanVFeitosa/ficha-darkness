import React, { Component, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import MapEditor3D, { AssetModel, MAP_STORAGE_KEY, PlacedAssets, loadSavedMap } from "../components/tabletop/MapEditor3D";
import { ativarCena, buscarCampanhaPorCodigo, enviarModelo3DMapa, salvarCena, salvarMapas3DCampanha } from "../services/mesaApi";
import "../styles/Tabletop3D.css";
import "../styles/CriadorMapa3D.css";

function CameraEditor({ poseApiRef }) {
  const { camera, gl } = useThree();
  const controls = useRef();
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableDamping = true;
    orbit.minDistance = 4;
    orbit.maxDistance = 24;
    orbit.maxPolarAngle = Math.PI / 2.04;
    orbit.target.set(0, 0, 0);
    controls.current = orbit;
    poseApiRef.current=() => ({position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov});
    return () => { poseApiRef.current=null; orbit.dispose(); };
  }, [camera, gl, poseApiRef]);
  useEffect(() => {
    camera.position.set(9, 11, 11);
    controls.current?.update();
  }, [camera]);
  return null;
}

function AreaDeTrabalho({ onFloor, onPointerMove }) {
  return <>
    <color attach="background" args={["#11191b"]}/>
    <fog attach="fog" args={["#11191b", 14, 32]}/>
    <ambientLight intensity={1.15}/>
    <hemisphereLight args={["#a8c5ce", "#4a382c", 1.25]}/>
    <directionalLight position={[5, 12, 7]} intensity={2.2} color="#ffe0b5" castShadow shadow-mapSize={[1024, 1024]}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onFloor} onPointerMove={onPointerMove}>
      <planeGeometry args={[20, 20]}/>
      <meshStandardMaterial color="#554c42" roughness={0.96}/>
    </mesh>
    <gridHelper args={[20, 20, "#a98e61", "#393b38"]} position={[0, 0.012, 0]}/>
  </>;
}

function PlacementGhost({ asset, position, rotation, scale }) {
  if (!asset || !position) return null;
  return <group position={[position.x, .025, position.z]} rotation={[0, rotation, 0]} scale={scale}>
    <AssetModel asset={asset}/>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]}>
      <ringGeometry args={[.7, .78, 40]}/>
      <meshBasicMaterial color="#70e0bd" transparent opacity={.9}/>
    </mesh>
  </group>;
}

function SpawnMarkers({ spawnPoints }) {
  const token=spawnPoints?.tokens;
  const camera=spawnPoints?.camera;
  return <>
    {token && <group position={[token.x,token.y + .04,token.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.58,40]}/><meshBasicMaterial color="#70e0bd" transparent opacity={.95} depthWrite={false}/></mesh>
      <mesh position={[0,.45,0]}><coneGeometry args={[.16,.42,20]}/><meshBasicMaterial color="#70e0bd"/></mesh>
    </group>}
    {camera?.position?.length===3 && <group position={camera.position}>
      <mesh><sphereGeometry args={[.2,18,12]}/><meshBasicMaterial color="#89a8e5"/></mesh>
      <mesh rotation={[0,0,-Math.PI/2]} position={[.32,0,0]}><coneGeometry args={[.12,.38,16]}/><meshBasicMaterial color="#89a8e5"/></mesh>
    </group>}
  </>;
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <div className="tt3-fallback">Não foi possível iniciar o editor 3D. Verifique a aceleração gráfica do navegador.</div>
      : this.props.children;
  }
}

export default function CriadorMapa3D() {
  const params = new URLSearchParams(window.location.search);
  const campaignCode = params.get("campanha") || "";
  const [campaign, setCampaign] = useState(null);
  const [items, setItems] = useState(loadSavedMap);
  const [savedMaps, setSavedMaps] = useState([]);
  const [activeMapId, setActiveMapId] = useState("");
  const [mapName, setMapName] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [pendingAsset, setPendingAsset] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, z: 0 });
  const [placement, setPlacement] = useState({ rotation: 0, scale: 1, snap: true, repeat: false });
  const [spawnPoints,setSpawnPoints]=useState({camera:null,tokens:null});
  const [placingTokenSpawn,setPlacingTokenSpawn]=useState(false);
  const cameraPoseApi=useRef(null);
  const [notice, setNotice] = useState("Escolha um asset e clique na grade para posicioná-lo.");
  const [importingModel, setImportingModel] = useState(false);
  const [publishingScene, setPublishingScene] = useState(false);

  const snapPosition = (value) => placement.snap ? Math.round(value * 2) / 2 : value;

  useEffect(() => {
    let active = true;
    buscarCampanhaPorCodigo(campaignCode)
      .then((loadedCampaign) => {
        if (!active || !loadedCampaign) return;
        const maps = Array.isArray(loadedCampaign.mapas3D) ? loadedCampaign.mapas3D : [];
        setCampaign(loadedCampaign);
        setSavedMaps(maps);
        setItems([]);
      })
      .catch(() => setNotice("Não foi possível carregar a campanha."));
    return () => { active = false; };
  }, [campaignCode]);

  const updateSelected = (patch) => setItems((current) => current.map((item) =>
    item.instanceId === selectedId ? { ...item, ...patch } : item));

  const duplicateSelected = () => setItems((current) => {
    const source = current.find((item) => item.instanceId === selectedId);
    if (!source) return current;
    const copy = {
      ...source,
      instanceId: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: source.x + 0.35,
      z: source.z + 0.35,
    };
    setSelectedId(copy.instanceId);
    return [...current, copy];
  });

  const persistMap = async () => {
    const name = mapName.trim() || `Mapa ${savedMaps.length + 1}`;
    const id = activeMapId || `mapa3d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const savedMap = { id, nome: name, assets: items, spawnPoints, atualizadoEm: new Date().toISOString() };
    const nextMaps = savedMaps.some((map) => map.id === id)
      ? savedMaps.map((map) => map.id === id ? savedMap : map)
      : [...savedMaps, savedMap];
    try {
      if (!campaign?.id) throw new Error("A campanha ainda está sendo carregada.");
      localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(items));
      await salvarMapas3DCampanha(campaign.id, nextMaps);
      setSavedMaps(nextMaps);
      setActiveMapId(id);
      setMapName(name);
      return { savedMap, nextMaps };
    } catch (error) {
      throw error;
    }
  };

  const saveMap = async () => {
    try {
      const { savedMap } = await persistMap();
      setNotice(`${savedMap.nome} salvo com ${savedMap.assets.length} asset(s).`);
    } catch (error) {
      setNotice(error.message || "Não foi possível salvar o mapa.");
    }
  };

  const importModel = async (files) => {
    try {
      if (!campaign?.id) throw new Error("A campanha ainda está sendo carregada.");
      setImportingModel(true);
      setNotice("Enviando e preparando o modelo 3D…");
      const uploaded = await enviarModelo3DMapa(campaign.id, files, (name, sent, total) => setNotice(`Enviando ${name} ao Cloudflare R2 · ${Math.round(sent / total * 100)}%`));
      const baseName = uploaded.fileName.replace(/\.(glb|gltf)$/i, "") || "Mapa importado";
      const asset = {
        id: `imported-map/${Date.now()}`,
        name: baseName,
        packName: "Modelo 3D importado",
        modelRole: "map",
        ...uploaded,
      };
      const instanceId = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current, { instanceId, asset, x: 0, z: 0, rotation: 0, scale: 1 }]);
      setSelectedId(instanceId);
      setPendingAsset(null);
      if (!mapName.trim()) setMapName(baseName);
      setNotice(`${baseName} importado. Ajuste escala e rotação, depois salve ou publique na cena.`);
    } catch (error) {
      setNotice(error.message || "Não foi possível importar o modelo 3D.");
    } finally {
      setImportingModel(false);
    }
  };

  const publishMapAsScene = async () => {
    try {
      setPublishingScene(true);
      const { savedMap } = await persistMap();
      const currentScene = campaign.cenaAtiva || campaign.cenas?.[0];
      const otherMaps = (currentScene?.mapasBatalha || []).filter((map) => map.origem !== "tabletop3d");
      const sceneMap = { id:`mapa3d-cena-${savedMap.id}`, nome:savedMap.nome, url:"", origem:"tabletop3d", mapa3dId:savedMap.id, larguraGrade:12, alturaGrade:8, exibirGrade:false };
      const savedScene = await salvarCena(campaign.id, {
        ...(currentScene || {}),
        nome: currentScene?.nome || savedMap.nome,
        descricao: currentScene?.descricao || "Cena criada a partir de um mapa 3D importado.",
        ordem: currentScene?.ordem ?? campaign.cenas?.length ?? 0,
        imagensCena: currentScene?.imagensCena || [],
        mapasBatalha: [...otherMaps, sceneMap],
      });
      await ativarCena(campaign.id, savedScene.id, "cena", sceneMap.id);
      setCampaign((current) => ({ ...current, cenaAtiva: { ...(currentScene || {}), ...savedScene, mapasBatalha: [...otherMaps, sceneMap] } }));
      setNotice(`${savedMap.nome} salvo e definido como a cena 3D ativa.`);
    } catch (error) {
      setNotice(error.message || "Não foi possível publicar o mapa na cena.");
    } finally {
      setPublishingScene(false);
    }
  };

  const loadMap = (id) => {
    const map = savedMaps.find((item) => item.id === id);
    setActiveMapId(map?.id || "");
    setMapName(map?.nome || "");
    setItems(map?.assets || []);
    setSpawnPoints(map?.spawnPoints || {camera:null,tokens:null});
    setPlacingTokenSpawn(false);
    setSelectedId(null);
    setPendingAsset(null);
    setNotice(map ? `${map.nome} carregado.` : "Novo mapa iniciado.");
  };

  const newMap = () => {
    if (items.length && !window.confirm("Iniciar outro mapa? Alterações não salvas serão descartadas.")) return;
    loadMap("");
  };

  const clearMap = () => {
    if (!window.confirm("Remover todos os assets adicionados ao mapa?")) return;
    setItems([]);
    setSelectedId(null);
    setPendingAsset(null);
    localStorage.removeItem(MAP_STORAGE_KEY);
    setNotice("O mapa foi limpo.");
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches("input, textarea, select")) return;
      const key = event.key.toLowerCase();
      if (key === "escape") {
        setPendingAsset(null);
        setSelectedId(null);
      }
      if ((key === "delete" || key === "backspace") && selectedId) {
        event.preventDefault();
        setItems((current) => current.filter((item) => item.instanceId !== selectedId));
        setSelectedId(null);
      }
      if (key === "q" || key === "e") {
        const delta = (key === "q" ? -1 : 1) * Math.PI / 4;
        if (pendingAsset) setPlacement((current) => ({ ...current, rotation: current.rotation + delta }));
        else if (selectedId) setItems((current) => current.map((item) => item.instanceId === selectedId ? { ...item, rotation: (item.rotation || 0) + delta } : item));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingAsset, selectedId]);

  const placeAsset = (event) => {
    event.stopPropagation();
    if (event.delta > 5) return;
    if(placingTokenSpawn) {
      const point={x:snapPosition(event.point.x),y:Number(event.point.y)||0,z:snapPosition(event.point.z)};
      setSpawnPoints(current => ({...current,tokens:point}));
      setPlacingTokenSpawn(false);
      setSelectedId(null);
      setNotice("Ponto de surgimento dos tokens definido. Salve o mapa para confirmar.");
      return;
    }
    const destination = { x: snapPosition(event.point.x), z: snapPosition(event.point.z) };
    if (pendingAsset) {
      const instanceId = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current, { instanceId, asset: pendingAsset, ...destination, rotation: placement.rotation, scale: placement.scale }]);
      setSelectedId(placement.repeat ? null : instanceId);
      if (!placement.repeat) setPendingAsset(null);
      setNotice(placement.repeat ? `${pendingAsset.name} inserido. Clique novamente para adicionar outro.` : `${pendingAsset.name} inserido e selecionado.`);
    } else if (selectedId) {
      updateSelected(destination);
      setNotice("Asset reposicionado.");
    } else {
      setNotice("Escolha um asset na biblioteca para adicioná-lo ao mapa.");
    }
  };

  const captureCameraSpawn = () => {
    const pose=cameraPoseApi.current?.();
    if(!pose) return;
    setSpawnPoints(current => ({...current,camera:pose}));
    setNotice("Posição atual da câmera definida como ponto de surgimento. Salve o mapa para confirmar.");
  };

  return <main className="tt3 mapa3d-criador">
    <section className="tt3-stage editor-open" aria-label="Criador de mapas 3D">
      <SceneBoundary>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [9, 11, 11], fov: 44 }} gl={{ antialias: true }} onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
        }}>
          <CameraEditor poseApiRef={cameraPoseApi}/>
          <AreaDeTrabalho onFloor={placeAsset} onPointerMove={(event) => setCursor({ x: snapPosition(event.point.x), z: snapPosition(event.point.z) })}/>
          <PlacementGhost asset={pendingAsset} position={cursor} rotation={placement.rotation} scale={placement.scale}/>
          <SpawnMarkers spawnPoints={spawnPoints}/>
          <PlacedAssets items={items} selectedId={selectedId} onSelect={(id) => {
            setSelectedId(id);
            setPendingAsset(null);
          }} onSurfaceClick={placingTokenSpawn ? placeAsset : null}/>
        </Canvas>
      </SceneBoundary>
      <header className="mapa3d-criador-header">
        <a href="/?mestre=1" aria-label="Voltar ao painel do mestre">←</a>
        <div><span>OFICINA DE MAPAS 3D</span><h1>{campaign?.nome || "Carregando campanha…"}</h1></div>
      </header>
      <div className="mapa3d-criador-ajuda" role="status">{notice}<small>Arraste para orbitar · roda para aproximar</small></div>
      <div className="mapa3d-spawn-tools" aria-label="Pontos de surgimento">
        <span>PONTOS DE INÍCIO</span>
        <button type="button" className={spawnPoints.camera ? "defined" : ""} onClick={captureCameraSpawn}>Câmera: usar visão atual</button>
        <button type="button" className={placingTokenSpawn ? "active" : spawnPoints.tokens ? "defined" : ""} onClick={() => {setPlacingTokenSpawn(value => !value);setPendingAsset(null);setSelectedId(null);setNotice("Clique sobre o piso do mapa onde os tokens devem surgir.");}}>{placingTokenSpawn ? "Cancelar posição dos tokens" : "Tokens: escolher no mapa"}</button>
      </div>
      <div className="mapa3d-criador-shortcuts" aria-label="Atalhos do editor"><span><kbd>Q</kbd><kbd>E</kbd> girar</span><span><kbd>Del</kbd> remover</span><span><kbd>Esc</kbd> cancelar</span></div>
      <MapEditor3D
        open
        items={items}
        selectedId={selectedId}
        pendingAsset={pendingAsset}
        onClose={() => { window.location.href = "/?mestre=1"; }}
        onPrepare={(asset) => { setPendingAsset(asset); setSelectedId(null); setPlacement((current) => ({ ...current, rotation: 0, scale: 1 })); setNotice(`Posicione ${asset.name} usando a pré-visualização.`); }}
        onUpdate={updateSelected}
        onDuplicate={duplicateSelected}
        onDelete={() => { setItems((current) => current.filter((item) => item.instanceId !== selectedId)); setSelectedId(null); }}
        onSave={saveMap}
        onClear={clearMap}
        mapName={mapName}
        onMapNameChange={setMapName}
        savedMaps={savedMaps}
        activeMapId={activeMapId}
        onLoadMap={loadMap}
        onNewMap={newMap}
        placement={placement}
        onPlacementChange={(patch) => setPlacement((current) => ({ ...current, ...patch }))}
        onCancelPlacement={() => { setPendingAsset(null); setNotice("Inserção cancelada."); }}
        onImportModel={importModel}
        importingModel={importingModel}
        onPublishScene={publishMapAsScene}
        publishingScene={publishingScene}
      />
    </section>
  </main>;
}
