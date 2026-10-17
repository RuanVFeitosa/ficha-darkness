import { espiralDie } from '../utils/espiralDice';
import CombatPostureButton from '../components/CombatPostureButton';
import {tokenPresentation} from '../utils/tokenAnimation';
import TabletopResolutionLimit from '../components/TabletopResolutionLimit';
import {createTabletopRenderer,isWebGLCreationError,tabletop2DUrl} from '../utils/tabletopRenderer';
import '../CSS/TokenAnimationStudio.css';
import AnimatedTokenArt from '../components/AnimatedTokenArt';
import {readTokenAnimations} from '../utils/tokenAnimation';
import { campaignCharacters, tabletopPlayerId } from "../utils/tabletopCharacters";
import MobileTabletopControls from "../components/MobileTabletopControls";
import { suavizarPosicaoToken } from "../utils/tokenMotion";
import { rotacaoToken } from "../utils/tokenOrientation";
import TokenFlashlight, { FlashlightControls, normalizarLanterna } from "../components/TokenFlashlight";
import MediaMigrationPanel from "../components/MediaMigrationPanel";
import { externalizarImagens, r2Configurado } from "../services/mediaStorage";
import { verificarConfiguracaoMidia } from "../services/mediaMigration";
import SceneDifficultyPanel from "../components/SceneDifficultyPanel";
import {difficultyOptions,rollOutcome} from "../utils/sceneDifficulty";
import RollNotifications, {RollHistory} from "../components/RollNotifications";
import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import { PlacedAssets, loadSavedMap } from "../components/MapEditor3D";
import { RealisticAvatarModel } from "../components/RealisticAvatar3D";
import { compressBackgroundImage, prepareTokenImage } from "../services/imageCompression";
import { ativarCena, buscarCampanhaPorCodigo, enviarImagemCena, ouvirCampanha, salvarClima3DCampanha, salvarMapas3DCampanha, obterEstadoToken3D, salvarEstadoToken3D, salvarTokenCustom3D, desvincularFicha, registrarRolagem, salvarCena } from "../services/mesaApi";
import "../CSS/Tabletop3D.css";
import ContextTransition from "../components/ContextTransition";
import { activeTabletopScene } from "../utils/tabletopScene";

const TabletopSessionTools = lazy(() => import("../components/TabletopSessionTools"));
const TacticalTabletop = lazy(() => import("../components/TacticalTabletop"));
const FichaEspiral = lazy(() => import("./fichaEspiral"));
const CUSTOM_TOKENS_STORAGE_KEY = "darkness_tabletop_custom_tokens_v1";
const ESPIRAL_SHEET_PREFIX = "espiral:sheet:v1:";
const DARKNESS_SHEET_PREFIX = "fichaRPG_personagem_";
const WEATHER_PRESETS = {
  dia: { preset:"dia", label:"Dia", skyColor:"#7db9df", fogColor:"#bfd9e5", sunColor:"#fff0bd", ambient:0.92, sun:2.05, sunSize:1.05, sunPosition:[11,14,-25], fogNear:20, fogFar:75, rain:0, snow:0, wind:0.12 },
  sol: { preset:"sol", label:"Sol forte", skyColor:"#48a4df", fogColor:"#a9d5e9", sunColor:"#fff2af", ambient:1, sun:2.55, sunSize:1.25, sunPosition:[12,15,-25], fogNear:24, fogFar:90, rain:0, snow:0, wind:0.08 },
  tarde: { preset:"tarde", label:"Tarde", skyColor:"#b36f62", fogColor:"#d39a79", sunColor:"#ff9a4f", ambient:0.58, sun:1.7, sunSize:1.35, sunPosition:[14,5,-24], fogNear:16, fogFar:62, rain:0, snow:0, wind:0.16 },
  noite: { preset:"noite", label:"Noite", skyColor:"#07121f", fogColor:"#101d28", sunColor:"#7596bb", ambient:0.13, sun:0.08, sunSize:0.8, sunPosition:[-12,12,-25], fogNear:12, fogFar:52, rain:0, snow:0, wind:0.12 },
  nublado: { preset:"nublado", label:"Nublado", skyColor:"#657178", fogColor:"#879195", sunColor:"#d8e0df", ambient:0.62, sun:0.7, sunSize:1, sunPosition:[9,13,-25], fogNear:12, fogFar:45, rain:0, snow:0, wind:0.35 },
  chuva: { preset:"chuva", label:"Chuva", skyColor:"#25343c", fogColor:"#40515a", sunColor:"#a9c1cb", ambient:0.38, sun:0.38, sunSize:1, sunPosition:[9,12,-25], fogNear:8, fogFar:32, rain:0.82, snow:0, wind:0.48 },
  neve: { preset:"neve", label:"Neve", skyColor:"#9da9ad", fogColor:"#d8dfe0", sunColor:"#f1f7ff", ambient:0.78, sun:0.75, sunSize:1, sunPosition:[8,12,-25], fogNear:7, fogFar:29, rain:0, snow:0.72, wind:0.22 },
  ato3: { preset:"ato3", label:"Ato III", skyColor:"#53070a", fogColor:"#260205", sunColor:"#ff392e", ambient:0.24, sun:1.05, sunSize:1.7, sunPosition:[13,7,-24], fogNear:6, fogFar:34, rain:0.12, snow:0, wind:0.58 },
};
const DEFAULT_WEATHER = WEATHER_PRESETS.dia;
const mapRevision = (maps = []) => (Array.isArray(maps) ? maps : [])
  .map((map) => `${map.id || ""}:${map.atualizadoEm || ""}`)
  .join("|");
const sameVisualWeather = (current, next) => {
  const keys = ["preset","label","skyColor","fogColor","sunColor","ambient","sun","sunSize","fogNear","fogFar","rain","snow","wind"];
  return keys.every((key) => current?.[key] === next?.[key])
    && JSON.stringify(current?.sunPosition || []) === JSON.stringify(next?.sunPosition || []);
};

function loadSavedCustomTokens() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TOKENS_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function loadSavedEspiralCharacters() {
  const characters=[];
  try {
    for(let index=0;index<localStorage.length;index+=1) {
      const key=localStorage.key(index);
      if(!key?.startsWith(ESPIRAL_SHEET_PREFIX)) continue;
      const sheet=JSON.parse(localStorage.getItem(key) || "null");
      if(sheet?.version!==1 || !sheet?.attributes) continue;
      let sheetId=key.slice(ESPIRAL_SHEET_PREFIX.length);
      if(sheetId.startsWith("darkness-")) {
        sheetId=sheetId.slice("darkness-".length);
        if(localStorage.getItem(`${ESPIRAL_SHEET_PREFIX}${sheetId}`)) continue;
      }
      characters.push({id:`espiral:${sheetId}`,sheet});
    }
  } catch {}
  return characters.sort((a,b) => String(a.sheet.name || "").localeCompare(String(b.sheet.name || ""),"pt-BR"));
}

function loadSavedDarknessCharacters() {
  const characters=[];
  try {
    for(let index=0;index<localStorage.length;index+=1) {
      const key=localStorage.key(index);
      if(!key?.startsWith(DARKNESS_SHEET_PREFIX)) continue;
      const sheet=JSON.parse(localStorage.getItem(key) || "null");
      if(!sheet?.nome) continue;
      characters.push({id:`darkness:${key.slice(DARKNESS_SHEET_PREFIX.length)}`,sheet});
    }
  } catch {}
  return characters.sort((a,b) => String(a.sheet.nome || "").localeCompare(String(b.sheet.nome || ""),"pt-BR"));
}

const OBSTACLES = [[-4.3,-2.6,-3.1,0.1], [0.1,3.5,-3.3,-1.5], [-0.9,0.9,-0.9,0.3], [3.2,4.4,-0.6,0.7]];
function free(x,z) {
  return Math.abs(x)<4.3 && Math.abs(z)<3.3 && !OBSTACLES.some(([a,b,c,d]) => x>a && x<b && z>c && z<d);
}
function clearPath(from,to) {
  const steps = Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/0.08);
  for(let i=1;i<=steps;i++) if(!free(from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps)) return false;
  return true;
}
function Box({ position,size,color,...props }) {
  return <mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.85}/></mesh>;
}
function WeatherParticles({type,intensity=0,wind=0}) {
  const geometryRef=useRef();
  const count=Math.round(Math.max(0,Math.min(1,intensity))*1400);
  const positions=useMemo(() => {
    const values=new Float32Array(count*3);
    for(let index=0;index<count;index+=1) {
      values[index*3]=(Math.random()-0.5)*34;
      values[index*3+1]=Math.random()*16;
      values[index*3+2]=(Math.random()-0.5)*34;
    }
    return values;
  },[count]);
  useFrame((_,delta) => {
    const attribute=geometryRef.current?.attributes?.position;
    if(!attribute) return;
    const speed=type==="rain" ? 13 : 1.25;
    for(let index=0;index<attribute.count;index+=1) {
      attribute.array[index*3]+=wind*delta*(type==="rain" ? 2.4 : 1);
      attribute.array[index*3+1]-=speed*delta;
      if(attribute.array[index*3+1]<0) {
        attribute.array[index*3+1]=16;
        attribute.array[index*3]=(Math.random()-0.5)*34;
        attribute.array[index*3+2]=(Math.random()-0.5)*34;
      }
    }
    attribute.needsUpdate=true;
  });
  if(!count) return null;
  return <points frustumCulled={false} renderOrder={20}>
    <bufferGeometry ref={geometryRef}><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color={type==="rain" ? "#b9d8e5" : "#ffffff"} size={type==="rain" ? 0.035 : 0.085} transparent opacity={type==="rain" ? 0.62 : 0.88} depthWrite={false}/>
  </points>;
}

function WeatherEnvironment({weather}) {
  const sunPosition=Array.isArray(weather.sunPosition) ? weather.sunPosition : DEFAULT_WEATHER.sunPosition;
  return <>
    <color attach="background" args={[weather.skyColor]}/>
    <fog attach="fog" args={[weather.fogColor,Number(weather.fogNear),Number(weather.fogFar)]}/>
    <ambientLight intensity={Number(weather.ambient)}/>
    <hemisphereLight args={[weather.skyColor,"#33281f",Number(weather.ambient)*0.9]}/>
    <directionalLight position={sunPosition} intensity={Number(weather.sun)} color={weather.sunColor} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-normalBias={0.04}/>
    {Number(weather.sun)>0.12 && <group position={sunPosition}>
      <mesh><sphereGeometry args={[Number(weather.sunSize)||1.1,28,20]}/><meshBasicMaterial color={weather.sunColor}/></mesh>
      <pointLight color={weather.sunColor} intensity={8} distance={28}/>
    </group>}
    <WeatherParticles type="rain" intensity={Number(weather.rain)} wind={Number(weather.wind)}/>
    <WeatherParticles type="snow" intensity={Number(weather.snow)} wind={Number(weather.wind)}/>
  </>;
}

function PanoramaBackground({url}) {
  const {camera}=useThree();
  const groupRef=useRef();
  const [texture,setTexture]=useState(null);
  useEffect(() => {
    if(!url) { setTexture(null); return undefined; }
    let active=true;
    const loader=new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(url,(loaded) => {
      if(!active) { loaded.dispose(); return; }
      loaded.colorSpace=THREE.SRGBColorSpace;
      loaded.wrapS=THREE.RepeatWrapping;
      setTexture(previous => { previous?.dispose(); return loaded; });
    },undefined,() => { if(active) setTexture(null); });
    return () => { active=false; };
  },[url]);
  useEffect(() => () => texture?.dispose(),[texture]);
  useFrame(() => groupRef.current?.position.copy(camera.position));
  if(!texture) return null;
  return <group ref={groupRef}>
    <mesh renderOrder={-100}>
      <sphereGeometry args={[450,64,32]}/>
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false}/>
    </mesh>
  </group>;
}

function Room({night,onFloor}) {
  return <>
    <pointLight position={[-3,2.7,-2]} color="#ffb66c" intensity={night ? 28 : 14} distance={10}/>
    <Box position={[0,-0.25,0]} size={[9.5,0.45,7.5]} color="#302b28"/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow onClick={onFloor}><planeGeometry args={[9,7]}/><meshStandardMaterial color="#9c8870" roughness={0.95}/></mesh>
    {Array.from({length:13},(_,i) => <Box key={i} position={[0,0.006,-3.25+i*0.53]} size={[9,0.008,0.018]} color="#645747"/>)}
    <Box position={[0,1.6,-3.6]} size={[9.4,3.2,0.18]} color="#b4a086"/>
    <Box position={[-4.6,1.6,0]} size={[0.18,3.2,7.2]} color="#a5947d"/>
    <Box position={[0,0.6,-3.47]} size={[9.2,1.2,0.08]} color="#594940"/>
    <Box position={[-4.47,0.6,0]} size={[0.08,1.2,7.1]} color="#594940"/>
    <Box position={[0,1.24,-3.4]} size={[9.2,0.1,0.14]} color="#382e29"/>
    <Box position={[-4.4,1.24,0]} size={[0.14,0.1,7.1]} color="#382e29"/>
    <Box position={[1.8,0.6,-2.4]} size={[2.8,1.2,1.2]} color="#50392c"/>
    <Box position={[1.8,1.24,-2.4]} size={[3.05,0.12,1.4]} color="#967454"/>
    <Box position={[2.5,1.4,-2.5]} size={[0.6,0.22,0.4]} color="#2d3736"/>
    <Box position={[1,1.32,-2.3]} size={[0.55,0.025,0.35]} color="#d3c4a6"/>
    <Box position={[0,0.75,-0.3]} size={[1.3,0.12,0.7]} color="#644937"/>
    {[-0.5,0.5].map(x => <Box key={x} position={[x,0.36,-0.3]} size={[0.1,0.72,0.5]} color="#332c27"/>)}
    {[-2.3,-1.2].map(z => <group key={z}><Box position={[-3.65,1,z]} size={[0.75,2,0.85]} color="#48524e"/>{[0.4,0.9,1.4,1.9].map(y => <group key={y}><Box position={[-3.24,y,z]} size={[0.04,0.39,0.75]} color="#59635d"/><Box position={[-3.2,y,z]} size={[0.06,0.04,0.22]} color="#b4ad8b"/></group>)}</group>)}
    <Box position={[-1.1,2.15,-3.44]} size={[2,1.15,0.12]} color="#403229"/>
    <Box position={[-1.1,2.15,-3.36]} size={[1.82,0.97,0.03]} color="#807252"/>
    {[-1.6,-1,-0.5].map((x,i) => <Box key={x} position={[x,2.1+(i%2)*0.2,-3.32]} size={[0.32,0.42,0.02]} color="#c8bb95" rotation={[0,0,i*0.1]}/>)}
    <Box position={[3.3,2.25,-3.46]} size={[1.3,1.25,0.1]} color="#342d29"/>
    <Box position={[3.3,2.25,-3.39]} size={[1.1,1.05,0.03]} color={night ? "#364c5b" : "#8cabb2"}/>
    <Box position={[3.3,2.25,-3.34]} size={[0.06,1.1,0.05]} color="#342d29"/>
    <Box position={[3.3,2.25,-3.34]} size={[1.1,0.06,0.05]} color="#342d29"/>
    <Box position={[3.8,0.4,0]} size={[0.7,0.8,0.65]} color="#573e30"/>
    <mesh position={[-3,2.7,-2]}><sphereGeometry args={[0.12,16,12]}/><meshStandardMaterial color="#ffe4ad" emissive="#ffb65b" emissiveIntensity={3}/></mesh>
  </>;
}
function CustomMapStage({onFloor,baseElevation=0}) {
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,(Number(baseElevation)||0)+0.006,0]} receiveShadow raycast={() => null}>
      <planeGeometry args={[2000,2000]}/>
      <shadowMaterial transparent opacity={0.5} depthWrite={false}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,Number(baseElevation)||0,0]} onClick={onFloor}>
      <planeGeometry args={[2000,2000]}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
  </>;
}
const planoDeslocamentoToken = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pontoDeslocamentoToken = new THREE.Vector3();
const TOKEN_DRAG_SENSITIVITY = 0.35;

function pontoNoPiso(event,elevation=0) {
  planoDeslocamentoToken.constant=-elevation;
  return event.ray.intersectPlane(planoDeslocamentoToken, pontoDeslocamentoToken)
    ? [pontoDeslocamentoToken.x, pontoDeslocamentoToken.z]
    : null;
}

function BillboardPersonArt({image,artRef,selected,animation,id}) {
  return <group ref={artRef}><AnimatedTokenArt image={image} animation={animation} id={id} width={1.02} height={1.86} bottom={-0.02} selected={selected}/></group>;
}

function Person({person,position,selected,onSelect,onEdit,onPosition,onDragStart,onDragEnd,constrainPosition,scale=0.35,elevation=0,baseElevation=0,lanterna,aimWithCamera,onAim,rotacao=0,olharCamera=true,canDrag=true,animation,playerView=false,sheetOpen=false,combat=false}) {
  const ref = useRef();
  const artRef = useRef();
  const initialPosition = useRef([...position]);
  const presentation=tokenPresentation(person.image,animation,{playerView,sheetOpen,combat});
  const dragRef = useRef(null);
  const touchTimer=useRef(null);
  useEffect(() => () => clearTimeout(touchTimer.current),[]);
  useFrame(({camera},delta) => {
    const target=ref.current;
    if(!target) return;
    if (!dragRef.current) {
      const next=suavizarPosicaoToken([target.position.x,target.position.z],position,delta);
      target.position.x=next[0];target.position.z=next[1];
    }
    if (artRef.current) {
      artRef.current.rotation.y = rotacaoToken(rotacao,playerView || olharCamera,[camera.position.x,camera.position.z],[target.position.x,target.position.z]) + (person.avatar3D?.modelUrl ? Math.PI+(presentation.back ? Math.PI : 0) : 0);
    }
    onPosition([target.position.x,target.position.z]);
  });
  const startDrag = (event) => {
    if(event.button !== 0) return;
    event.stopPropagation();
    if(event.pointerType==="touch") {touchTimer.current=setTimeout(() => onEdit?.(),550);if(!selected) {onSelect();return;}}
    if(!canDrag) {onSelect();return;}
    const point = pontoNoPiso(event,ref.current.position.y);
    if (!point) return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offset: [ref.current.position.x - point[0], ref.current.position.z - point[1]],
      position: [ref.current.position.x, ref.current.position.z],
      origin: [ref.current.position.x, ref.current.position.z],
      moved: false,
    };
    onSelect();
    onDragStart?.();
  };
  const drag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = pontoNoPiso(event,ref.current.position.y);
    if (!point) return;
    const nextPosition = constrainPosition?.([
      dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY,
      dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY,
    ]) || [dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY, dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY];
    dragRef.current.position = nextPosition;
    ref.current.position.x = nextPosition[0];
    ref.current.position.z = nextPosition[1];
    if (Math.hypot(nextPosition[0] - dragRef.current.origin[0], nextPosition[1] - dragRef.current.origin[1]) > 0.04)
      dragRef.current.moved = true;
  };
  const endDrag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    const { position: finalPosition, moved } = dragRef.current;
    dragRef.current = null;
    onDragEnd?.(finalPosition,moved);
  };
  const edit = (event) => {
    event.stopPropagation();
    event.nativeEvent?.preventDefault();
    onSelect();
    onEdit?.();
  };
  const safeScale=Math.max(0.01,Math.min(3,Number(scale)||0.35));
  const safeElevation=(Number(baseElevation)||0)+Math.max(-500,Math.min(500,Number(elevation)||0));
  return <group userData={{tokenInteraction:true}} ref={ref} position={[initialPosition.current[0],safeElevation,initialPosition.current[1]]} scale={safeScale} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onContextMenu={edit}>
    {lanterna?.ativa && <TokenFlashlight config={lanterna} aimWithCamera={aimWithCamera} onAim={onAim} scale={safeScale} height={1.1*safeScale}/>}
    {person.avatar3D?.modelUrl
      ? <group ref={artRef} rotation={[0,Math.PI+(Number(rotacao)||0)*Math.PI/180,0]} scale={selected ? 1.04 : 1}><RealisticAvatarModel avatar={person.avatar3D}/></group>
      : <BillboardPersonArt image={presentation.image} artRef={artRef} selected={selected} animation={presentation.animation} id={person.id}/>
    }
    {selected && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.012,0]}>
      <ringGeometry args={[0.48,0.57,48]}/>
      <meshBasicMaterial color="#d5bd79" transparent opacity={0.9} depthWrite={false}/>
    </mesh>}
  </group>;
}
function CustomToken({ token, selected, onSelect, onEdit, onDragStart, onDragEnd, constrainPosition, baseElevation=0, aimWithCamera, onAim, canDrag=true }) {
  const ref = useRef();
  const artRef = useRef();
  const dragRef = useRef(null);
  const touchTimer=useRef(null);
  useEffect(() => () => clearTimeout(touchTimer.current),[]);
  const initialPosition = useRef([token.x,token.z]);
  const texture = useLoader(THREE.TextureLoader, token.image);
  const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 0.55;
  const tokenHeight = 0.65;
  const tokenWidth = Math.min(0.52, Math.max(0.18, tokenHeight * aspect));
  const scale = Math.max(0.01, Math.min(3, Number(token.scale) || 1));
  const elevation = (Number(baseElevation)||0)+Math.max(-500, Math.min(500, Number(token.elevation) || 0));
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  useFrame(({ camera },delta) => {
    if(ref.current && !dragRef.current) {
      const next=suavizarPosicaoToken([ref.current.position.x,ref.current.position.z],[token.x,token.z],delta);
      ref.current.position.x=next[0];ref.current.position.z=next[1];
    }
    if (artRef.current && ref.current) {
      artRef.current.rotation.y = rotacaoToken(token.rotacao,token.olharCamera,[camera.position.x,camera.position.z],[ref.current.position.x,ref.current.position.z]);
    }
  });
  const startDrag = (event) => {
    if(event.button !== 0) return;
    event.stopPropagation();
    if(event.pointerType==="touch") {touchTimer.current=setTimeout(() => onEdit?.(token.id),550);if(!selected) {onSelect(token.id);return;}}
    if(!canDrag) {onSelect(token.id);return;}
    const point = pontoNoPiso(event,ref.current.position.y);
    if (!point) return;
    event.target.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offset: [ref.current.position.x - point[0], ref.current.position.z - point[1]],
      position: [ref.current.position.x, ref.current.position.z],
      origin: [ref.current.position.x, ref.current.position.z],
      moved: false,
    };
    onSelect(token.id);
    onDragStart?.(token.id);
  };
  const drag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = pontoNoPiso(event,ref.current.position.y);
    if (!point) return;
    const position = constrainPosition?.([
      dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY,
      dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY,
    ]) || [dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY, dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY];
    dragRef.current.position = position;
    ref.current.position.x = position[0];
    ref.current.position.z = position[1];
    if (Math.hypot(position[0] - dragRef.current.origin[0], position[1] - dragRef.current.origin[1]) > 0.04)
      dragRef.current.moved = true;
  };
  const endDrag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    const { position, moved } = dragRef.current;
    dragRef.current = null;
    onDragEnd?.(token.id, position, moved);
  };
  const edit = (event) => {
    event.stopPropagation();
    event.nativeEvent?.preventDefault();
    onSelect(token.id);
    onEdit?.(token.id);
  };
  return <group userData={{tokenInteraction:true}} ref={ref} position={[initialPosition.current[0], elevation, initialPosition.current[1]]} scale={scale} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onContextMenu={edit}>

    {token.lanterna?.ativa && <TokenFlashlight config={token.lanterna} aimWithCamera={aimWithCamera} onAim={onAim} scale={scale} height={tokenHeight*scale*0.65}/>}
    <group ref={artRef}><AnimatedTokenArt image={token.image} animation={token.animation} id={token.id} width={tokenWidth} height={tokenHeight} selected={selected}/></group>
  </group>;
}
const CAMERA_PRESETS = {
  room: { position: [10,8,12], target: [0,0.7,0], fov: 42 },
  cinema: { position: [-8,2.35,10], target: [0,1.15,0], fov: 42 },
  panorama: { position: [10,8,12], target: [0,0.7,0], fov: 65 },
  detail: { position: [10,8,12], target: [0,0.7,0], fov: 28 },
};

export function StaticSceneCinema({activeKey,mestre,onHudChange}) {
  const automatic=useRef(false);
  useEffect(() => {
    if(mestre) return;
    if(activeKey) {onHudChange(true);automatic.current=true;}
    else if(automatic.current) {onHudChange(false);automatic.current=false;}
  },[activeKey,mestre,onHudChange]);
  return null;
}
export function PlayerTokenNavigation({enabled,position,onMove,onStop,cameraRelative=true}) {
  const keys=useRef(new Set());
  const stop=useRef(onStop);
  stop.current=onStop;
  const direction=useMemo(() => new THREE.Vector3(),[]);
  useEffect(() => {
    const clear=() => {if(keys.current.size) stop.current?.();keys.current.clear();};
    clear();
    if(!enabled) return;
    const down=event => {
      const key=event.key.toLowerCase();
      if(!['w','a','s','d'].includes(key) || event.target?.closest?.('input,textarea,select,button,[contenteditable="true"]')) return;
      keys.current.add(key);
      event.preventDefault();
    };
    const up=event => {const released=keys.current.delete(event.key.toLowerCase());if(released && !keys.current.size) stop.current?.();};
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',clear);
    return () => {clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[enabled]);
  useFrame(({camera},delta) => {
    if(!enabled || !position || !keys.current.size) return;
    if(cameraRelative) camera.getWorldDirection(direction);
    else direction.set(0,0,-1);
    const length=Math.hypot(direction.x,direction.z);
    const fx=length>0.001 ? direction.x/length : 0;
    const fz=length>0.001 ? direction.z/length : -1;
    const forward=Number(keys.current.has('w'))-Number(keys.current.has('s'));
    const sideways=Number(keys.current.has('d'))-Number(keys.current.has('a'));
    const x=fx*forward-fz*sideways,z=fz*forward+fx*sideways;
    const magnitude=Math.hypot(x,z);
    if(!magnitude) return;
    const step=0.65*Math.min(delta,0.05)/magnitude;
    onMove([position[0]+x*step,position[1]+z*step]);
  });
  return null;
}
export function Camera({view,interactionLocked=false,mode="free",followPosition=null,followHeight=0.65,followElevation=0,sheetFocus=false,focusRequest=0,syncedPose=null,onPoseChange,spawnPose=null,spawnKey=""}) {
  const {camera,gl,scene}=useThree();
  const controls=useRef();
  const pressedKeys=useRef(new Set());
  const lookDrag=useRef(null);
  const lastReportedPose=useRef(null);
  const appliedCameraSpawn=useRef(null);
  const forward=useMemo(() => new THREE.Vector3(),[]);
  const characterCameraInitialized=useRef(false);
  const stationaryLook=useRef(false);
  const touchPoints=useRef(new Map());
  const pinchDistance=useRef(null);
  const stationaryFollow=useRef(null);
  const sheetCameraPose=useRef(null);
  const sheetCameraTransition=useRef(null);
  const appliedFocusRequest=useRef(0);
  const cameraPresetInitialized=useRef(false);
  const right=useMemo(() => new THREE.Vector3(),[]);
  const movement=useMemo(() => new THREE.Vector3(),[]);
  const desiredTarget=useMemo(() => new THREE.Vector3(),[]);
  useEffect(() => {
    const orbit=new OrbitControls(camera,gl.domElement);
    orbit.enableDamping=true;
    orbit.dampingFactor=0.065;
    orbit.enableRotate=true;
    orbit.enablePan=true;
    orbit.enableZoom=true;
    orbit.zoomToCursor=true;
    orbit.screenSpacePanning=true;
    orbit.rotateSpeed=0.22;
    orbit.panSpeed=0.28;
    orbit.zoomSpeed=1.6;
    orbit.keyPanSpeed=18;
    orbit.minDistance=0.08;
    orbit.maxDistance=500;
    orbit.minPolarAngle=0.01;
    orbit.maxPolarAngle=Math.PI-0.01;
    orbit.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
    orbit.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
    orbit.target.set(0,0.7,0);
    controls.current=orbit;
    return () => {
      orbit.dispose();
    };
  },[camera,gl]);
  useEffect(() => {
    const touches=touchPoints.current;
    const canvas=gl.domElement;
    const finishLook=() => {
      if(!lookDrag.current) return;
      lookDrag.current=null;
      if(controls.current) controls.current.enabled=!interactionLocked && mode!=="master";
    };
    const startLook=(event) => {
      if(interactionLocked || !controls.current || !["free","character"].includes(mode)) return;
      if(event.pointerType==="touch") {
        touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(touchPoints.current.size===2) {lookDrag.current=null;pinchDistance.current=null;controls.current.enabled=false;event.preventDefault();event.stopImmediatePropagation();return;}
        const ray=new THREE.Raycaster();const bounds=canvas.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),camera);
        const hit=scene ? ray.intersectObjects(scene.children,true)[0] : null;
        let object=hit?.object;while(object) {if(object.userData?.tokenInteraction) return;object=object.parent;}
      }
      if((event.button!==2 && event.pointerType!=="touch") || !["free","character"].includes(mode) || interactionLocked || !controls.current) return;
      stationaryLook.current=mode==="character";
      stationaryFollow.current=null;
      event.preventDefault();
      event.stopImmediatePropagation();
      // Flush orbit damping before beginning a stationary look.
      const orbit=controls.current;
      const frozenPosition=camera.position.toArray();
      const damping=orbit.enableDamping;
      orbit.enableDamping=false;
      orbit.update();
      orbit.enableDamping=damping;
      camera.position.set(...frozenPosition);
      orbit.enabled=false;
      lookDrag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    };
    const moveLook=(event) => {
      if(event.pointerType==="touch" && touchPoints.current.has(event.pointerId)) {
        touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(touchPoints.current.size===2) {
          event.preventDefault();event.stopImmediatePropagation();
          const [a,b]=[...touchPoints.current.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);
          if(pinchDistance.current && distance>0) {const orbit=controls.current;const currentDistance=Math.hypot(camera.position.x-orbit.target.x,camera.position.y-orbit.target.y,camera.position.z-orbit.target.z);const nextDistance=Math.max(.2,Math.min(500,currentDistance*pinchDistance.current/distance));const factor=nextDistance/Math.max(currentDistance,.001);camera.position.set(orbit.target.x+(camera.position.x-orbit.target.x)*factor,orbit.target.y+(camera.position.y-orbit.target.y)*factor,orbit.target.z+(camera.position.z-orbit.target.z)*factor);orbit.update();}
          pinchDistance.current=distance;return;
        }
      }
      const drag=lookDrag.current;
      if(!drag || drag.id!==event.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const orbit=controls.current;
      const x=orbit.target.x-camera.position.x;
      const y=orbit.target.y-camera.position.y;
      const z=orbit.target.z-camera.position.z;
      const distance=Math.max(Math.hypot(x,y,z),0.08);
      const yaw=Math.atan2(x,z)-(event.clientX-drag.x)*0.004;
      const pitch=Math.max(-Math.PI/2+0.01,Math.min(Math.PI/2-0.01,Math.asin(y/distance)-(event.clientY-drag.y)*0.004));
      const horizontal=Math.cos(pitch)*distance;
      orbit.target.set(camera.position.x+Math.sin(yaw)*horizontal,camera.position.y+Math.sin(pitch)*distance,camera.position.z+Math.cos(yaw)*horizontal);
      drag.x=event.clientX;
      drag.y=event.clientY;
      orbit.update();
    };
    const endLook=(event) => {
      if(event.pointerType==="touch") {touchPoints.current.delete(event.pointerId);pinchDistance.current=null;if(!touchPoints.current.size && controls.current) controls.current.enabled=!interactionLocked && mode!=="master";}
      if(lookDrag.current?.id!==event.pointerId) return;
      event.stopImmediatePropagation();
      finishLook();
    };
    canvas.addEventListener("pointerdown",startLook,true);
    window.addEventListener("pointermove",moveLook,true);
    window.addEventListener("pointerup",endLook,true);
    window.addEventListener("pointercancel",endLook,true);
    window.addEventListener("blur",finishLook);
    return () => {
      finishLook();
      touches.clear();pinchDistance.current=null;
      canvas.removeEventListener("pointerdown",startLook,true);
      window.removeEventListener("pointermove",moveLook,true);
      window.removeEventListener("pointerup",endLook,true);
      window.removeEventListener("pointercancel",endLook,true);
      window.removeEventListener("blur",finishLook);
    };
  },[camera,gl,scene,interactionLocked,mode]);
  useEffect(() => {
    const navigationKeys=new Set(["w","a","s","d","q","e","arrowup","arrowdown","arrowleft","arrowright"]);
    const isEditable=(target) => target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, button")));
    const onKeyDown=(event) => {
      const key=event.key.toLowerCase();
      if(!navigationKeys.has(key) || isEditable(event.target)) return;
      pressedKeys.current.add(key);
      event.preventDefault();
    };
    const onKeyUp=(event) => pressedKeys.current.delete(event.key.toLowerCase());
    const clearKeys=() => pressedKeys.current.clear();
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",onKeyUp);
    window.addEventListener("blur",clearKeys);
    return () => {
      window.removeEventListener("keydown",onKeyDown);
      window.removeEventListener("keyup",onKeyUp);
      window.removeEventListener("blur",clearKeys);
    };
  },[]);
  useEffect(() => {
    if(mode!=="character") {
      characterCameraInitialized.current=false;
      return;
    }
    if(characterCameraInitialized.current || !Array.isArray(followPosition) || !controls.current) return;
    if(focusRequest) {characterCameraInitialized.current=true;return;}
    const x=Number(followPosition[0])||0;
    const z=Number(followPosition[1])||0;
    const height=Math.max(0.05,Number(followHeight)||0.65);
    const ground=Number(followElevation)||0;
    controls.current.target.set(x+height*0.35,ground+height*0.65,z);
    camera.position.set(x+height*0.35,ground+height*0.75,z+height*1.1);
    camera.fov=50;
    camera.updateProjectionMatrix();
    controls.current.update();
    characterCameraInitialized.current=true;
  },[camera,followPosition,followHeight,followElevation,mode,focusRequest]);
  useEffect(() => {
    if(!focusRequest || appliedFocusRequest.current===focusRequest || mode!=="character" || !controls.current || !Array.isArray(followPosition)) return;
    appliedFocusRequest.current=focusRequest;
    stationaryLook.current=false;stationaryFollow.current=null;
    const x=Number(followPosition[0])||0,z=Number(followPosition[1])||0;
    const height=Math.max(0.05,Number(followHeight)||0.65),ground=Number(followElevation)||0;
    sheetCameraTransition.current={from:{position:camera.position.toArray(),target:controls.current.target.toArray(),fov:camera.fov},to:{position:[x+height*0.35,ground+height*0.75,z+height*1.1],target:[x+height*0.35,ground+height*0.65,z],fov:50},elapsed:0};
  },[camera,mode,focusRequest,followPosition,followHeight,followElevation]);
  useEffect(() => {
    const orbit=controls.current;
    if(mode!=="character" || !orbit) return;
    if(sheetFocus && !sheetCameraPose.current && Array.isArray(followPosition)) {
      sheetCameraPose.current={position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov};
      const x=Number(followPosition[0])||0,z=Number(followPosition[1])||0;
      const height=Math.max(0.05,Number(followHeight)||0.65),ground=Number(followElevation)||0;
      // Translate along the current camera right axis at every orbit angle.
      const dx=orbit.target.x-camera.position.x,dz=orbit.target.z-camera.position.z;
      const length=Math.hypot(dx,dz)||1;
      const screenRight=((x-orbit.target.x)*(-dz)+(z-orbit.target.z)*dx)/length;
      {
        const desiredRight=length*Math.tan((Number(camera.fov)||50)*Math.PI/360)*(Number(camera.aspect)||16/9)*0.64;
        const shift=desiredRight-screenRight;
        const shiftX=(-dz/length)*shift,shiftZ=(dx/length)*shift;
        const target=[orbit.target.x-shiftX,orbit.target.y,orbit.target.z-shiftZ];
        sheetCameraPose.current.followOffset=[target[0]-x,target[1]-ground,target[2]-z];
        if(Math.abs(shift)<height*0.05) {sheetCameraPose.current.preserved=true;return;}
        sheetCameraTransition.current={from:{position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov},to:{position:[camera.position.x-shiftX,camera.position.y,camera.position.z-shiftZ],target,fov:camera.fov},elapsed:0};
        return;
      }
    } else if(!sheetFocus && sheetCameraPose.current) {
      const pose=sheetCameraPose.current;
      if(pose.preserved) {sheetCameraPose.current=null;return;}
      sheetCameraTransition.current={from:{position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov},to:pose,elapsed:0};
      sheetCameraPose.current=null;
    }
  },[camera,mode,sheetFocus,followPosition,followHeight,followElevation]);
  useEffect(() => {
    if(mode!=="free" || !controls.current) return;
    if(focusRequest>0) {sheetCameraTransition.current=null;cameraPresetInitialized.current=true;}
    const preset=CAMERA_PRESETS[view] || CAMERA_PRESETS.room;
    if(!cameraPresetInitialized.current) camera.position.set(...preset.position);
    camera.fov=preset.fov;
    camera.near=0.05;
    camera.far=1200;
    camera.updateProjectionMatrix();
    if(!cameraPresetInitialized.current) controls.current.target.set(...preset.target);
    cameraPresetInitialized.current=true;
    controls.current.update();
  },[camera,mode,view,focusRequest]);
  useEffect(() => {
    if(mode!=="character" || !view) return;
    camera.fov=view==="panorama" ? 65 : view==="detail" ? 28 : 50;
    camera.updateProjectionMatrix();
  },[camera,mode,view]);
  useEffect(() => {
    if(appliedCameraSpawn.current?.key!==spawnKey) {
      appliedCameraSpawn.current={key:spawnKey,applied:false};
    }
    if(appliedCameraSpawn.current.applied) return;
    if(mode!=="free" || !controls.current || !Array.isArray(spawnPose?.position) || !Array.isArray(spawnPose?.target)) return;
    camera.position.set(...spawnPose.position);
    camera.fov=Number(spawnPose.fov)||42;
    camera.near=0.05;
    camera.far=1200;
    camera.updateProjectionMatrix();
    controls.current.target.set(...spawnPose.target);
    controls.current.update();
    appliedCameraSpawn.current.applied=true;
  },[camera,mode,spawnKey,spawnPose]);
  useEffect(() => {
    if (controls.current) controls.current.enabled = !interactionLocked && mode!=="master" && !lookDrag.current && touchPoints.current.size<2;
    if (interactionLocked || mode!=="free") pressedKeys.current.clear();
  }, [interactionLocked,mode]);
  useFrame((_,delta) => {
    const orbit=controls.current;
    if(!orbit) return;
    const transition=sheetCameraTransition.current;
    if(transition && mode==="character") {
      transition.elapsed+=Math.min(delta,0.05);
      const t=Math.min(1,transition.elapsed/0.55);
      const eased=t*t*t*(t*(t*6-15)+10);
      const blend=(a,b)=>a+(b-a)*eased;
      camera.position.set(...transition.from.position.map((value,index)=>blend(value,transition.to.position[index])));
      orbit.target.set(...transition.from.target.map((value,index)=>blend(value,transition.to.target[index])));
      camera.fov=blend(transition.from.fov,transition.to.fov);
      camera.updateProjectionMatrix();orbit.enabled=false;orbit.update();
      if(t===1) {sheetCameraTransition.current=null;orbit.enabled=!interactionLocked;}
      return;
    }
    if(mode==="master" && syncedPose?.position?.length===3 && syncedPose?.target?.length===3) {
      const factor=1-Math.exp(-Math.min(delta,0.05)*9);
      desiredTarget.set(...syncedPose.position);
      camera.position.lerp(desiredTarget,factor);
      desiredTarget.set(...syncedPose.target);
      orbit.target.lerp(desiredTarget,factor);
      const nextFov=Number(syncedPose.fov) || camera.fov;
      if(Math.abs(camera.fov-nextFov)>0.01) {
        camera.fov=THREE.MathUtils.lerp(camera.fov,nextFov,factor);
        camera.updateProjectionMatrix();
      }
      orbit.update();
      return;
    }
    if(mode==="character" && stationaryLook.current && Array.isArray(followPosition)) {
      const next=[Number(followPosition[0])||0,Number(followElevation)||0,Number(followPosition[1])||0];
      const previous=stationaryFollow.current || next;
      movement.set(next[0]-previous[0],next[1]-previous[1],next[2]-previous[2]);
      camera.position.add(movement);orbit.target.add(movement);
      stationaryFollow.current=next;
    }
    if(mode==="character" && !stationaryLook.current && Array.isArray(followPosition)) {
      const height=Math.max(0.05,Number(followHeight)||0.65);
      desiredTarget.set((Number(followPosition[0])||0)+(sheetFocus ? -height*1.7*Math.tan(25*Math.PI/180)*(Number(camera.aspect)||16/9)*0.64 : height*0.35),(Number(followElevation)||0)+height*(sheetFocus ? 0.5 : 0.65),Number(followPosition[1])||0);
      if(sheetFocus && sheetCameraPose.current?.followOffset) {
        const offset=sheetCameraPose.current.followOffset;
        desiredTarget.set((Number(followPosition[0])||0)+offset[0],(Number(followElevation)||0)+offset[1],(Number(followPosition[1])||0)+offset[2]);
      }
      movement.copy(desiredTarget).sub(orbit.target).multiplyScalar(1-Math.exp(-Math.min(delta,0.05)*10));
      camera.position.add(movement);
      orbit.target.add(movement);
    }
    if(mode==="free" && !interactionLocked && pressedKeys.current.size) {
      camera.getWorldDirection(forward);
      forward.y=0;
      if(forward.lengthSq()<0.0001) forward.set(0,0,-1);
      else forward.normalize();
      right.crossVectors(forward,camera.up).normalize();
      movement.set(0,0,0);
      if(pressedKeys.current.has("w") || pressedKeys.current.has("arrowup")) movement.add(forward);
      if(pressedKeys.current.has("s") || pressedKeys.current.has("arrowdown")) movement.sub(forward);
      if(pressedKeys.current.has("d") || pressedKeys.current.has("arrowright")) movement.add(right);
      if(pressedKeys.current.has("a") || pressedKeys.current.has("arrowleft")) movement.sub(right);
      if(pressedKeys.current.has("e")) movement.y+=1;
      if(pressedKeys.current.has("q")) movement.y-=1;
      if(movement.lengthSq()>0) {
        const speed=0.65;
        movement.normalize().multiplyScalar(speed*Math.min(delta,0.05));
        camera.position.add(movement);
        orbit.target.add(movement);
      }
    }
    orbit.update();
    if(mode==="free" && onPoseChange) {
      const pose={
        position:camera.position.toArray(),
        target:orbit.target.toArray(),
        fov:camera.fov,
        updatedAt:new Date().toISOString(),
      };
      const previous=lastReportedPose.current;
      const changed=!previous || pose.position.some((value,index) => Math.abs(value-previous.position[index])>0.002) || pose.target.some((value,index) => Math.abs(value-previous.target[index])>0.002) || Math.abs(pose.fov-previous.fov)>0.02;
      if(changed) {
        lastReportedPose.current=pose;
        onPoseChange(pose);
      }
    }
  });
  return null;
}
export class SceneBoundary extends Component {
  state={error:null};
  static getDerivedStateFromError(error) {return {error};}
  render() {
    if(!this.state.error) return this.props.children;
    const graphics=isWebGLCreationError(this.state.error);
    return <div className="tt3-fallback tt3-scene-error" role="alert"><div><h2>{graphics ? 'O navegador não conseguiu iniciar o 3D' : 'Não foi possível carregar a cena'}</h2><p>{graphics ? 'A criação do contexto WebGL falhou mesmo com a configuração gráfica reduzida. Feche outras abas com conteúdo 3D e reinicie o navegador. No Firefox, confira a aceleração de hardware em Configurações → Geral → Desempenho.' : 'Um recurso da cena não pôde ser carregado. Tente abrir a cena novamente.'}</p><div><button type="button" onClick={() => this.setState({error:null})}>Tentar abrir o 3D novamente</button><a href={tabletop2DUrl(window.location.search)}>Abrir mesa 2D</a></div></div></div>;
  }
}export default function Tabletop3D() {
  const [mobile,setMobile]=useState(() => window.matchMedia?.("(max-width: 1100px) and (pointer: coarse)")?.matches || false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [landscape,setLandscape]=useState(() => window.matchMedia?.("(orientation: landscape)")?.matches || false);
  useEffect(() => {if(!window.matchMedia) return;const query=window.matchMedia("(orientation: landscape)");const update=() => setLandscape(query.matches);query.addEventListener("change",update);return () => query.removeEventListener("change",update);},[]);
  useEffect(() => {if(!window.matchMedia) return;const query=window.matchMedia("(max-width: 1100px) and (pointer: coarse)");const update=() => setMobile(query.matches);query.addEventListener("change",update);return () => query.removeEventListener("change",update);},[]);
  const routeParams=new URLSearchParams(window.location.search);
  const mestre=routeParams.get("papel") === "mestre";
  const campaignCode=routeParams.get("campanha") || "local";
  const returnParams=new URLSearchParams();
  const playerSheetId=tabletopPlayerId(routeParams);
  if(!mestre) {
    if(routeParams.get("sistema")==="espiral") returnParams.set("sistema","espiral");
    if(routeParams.get("ficha")) returnParams.set("ficha",routeParams.get("ficha"));
    if(routeParams.get("senha")) returnParams.set("senha",routeParams.get("senha"));
  }
  const returnUrl=mestre ? "/?mestre=1" : returnParams.toString() ? `/?${returnParams.toString()}` : "/";
  const tokenSyncOrigin=useRef(`tabletop3d-${Date.now()}-${Math.random()}`);
  const receivedTokenRevisions=useRef(new Map());
  const [selected,setSelected]=useState(0), [positions,setPositions]=useState([]);
  const [view,setView]=useState("room");
  const [masterFocusId,setMasterFocusId]=useState(null);
  const [masterFocusRequest,setMasterFocusRequest]=useState(0);
  const weatherStorageKey=`darkness_tabletop3d_weather_${campaignCode}`;
  const backgroundStorageKey=`darkness_tabletop3d_backgrounds_${campaignCode}`;
  const sheetTokenStorageKey=`darkness_tabletop3d_sheet_tokens_${campaignCode}`;
  const [weather,setWeather]=useState(() => {
    try { return { ...DEFAULT_WEATHER, ...JSON.parse(localStorage.getItem(weatherStorageKey) || "{}") }; }
    catch { return { ...DEFAULT_WEATHER }; }
  });
  const playerCameraMode="character";
  const [tacticalMode,setTacticalMode]=useState(false);
  const night=weather.preset==="noite";
  const [savingWeather,setSavingWeather]=useState(false);
  const [notice,setNotice]=useState("Selecione um personagem e clique no piso para movê-lo.");
  const actualPositions=useRef([]);
  const localMapAssets=useRef(campaignCode === "local" ? loadSavedMap() : []).current;
  const [mapAssets,setMapAssets]=useState(localMapAssets);
  const [activeMapName,setActiveMapName]=useState(localMapAssets.length ? "Mapa 3D local" : "");
  const weatherRef=useRef(weather);
  const lastCameraSyncRef=useRef(0);
  const masterCameraPoseRef=useRef(null);
  const campaignRef=useRef(null);
  const mapAssetsRevisionRef=useRef(localMapAssets.length ? "local" : "");
  const [activeMapId,setActiveMapId]=useState("");
  const [campaign,setCampaign]=useState(null);
  const [syncedMasterCamera,setSyncedMasterCamera]=useState(null);
  const [localBackgrounds,setLocalBackgrounds]=useState(() => {
    try { return JSON.parse(localStorage.getItem(backgroundStorageKey) || "{}"); }
    catch { return {}; }
  });
  const [backgroundUrlInput,setBackgroundUrlInput]=useState("");
  const [savingBackground,setSavingBackground]=useState(false);
  const backgroundFileRef=useRef(null);
  const [switchingScene,setSwitchingScene]=useState(false);
  const [customTokens,setCustomTokens]=useState(loadSavedCustomTokens);
  const [sheetTokenTransforms,setSheetTokenTransforms]=useState(() => {
    try {
      const saved=JSON.parse(localStorage.getItem(sheetTokenStorageKey) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch { return {}; }
  });
  const [espiralCharacters,setEspiralCharacters]=useState(loadSavedEspiralCharacters);
  const [darknessCharacters,setDarknessCharacters]=useState(loadSavedDarknessCharacters);
  const [tokenPanelOpen,setTokenPanelOpen]=useState(false);
  const [flashlightTarget,setFlashlightTarget]=useState("");
  const [tokenMode,setTokenMode]=useState(false);
  const [pendingToken,setPendingToken]=useState(null);
  const [selectedToken,setSelectedToken]=useState(null);
  const [draggingToken,setDraggingToken]=useState(false);
  const [tokenUrl,setTokenUrl]=useState("");
  const [animationLibrary,setAnimationLibrary]=useState(readTokenAnimations);
  useEffect(() => {const refresh=() => setAnimationLibrary(readTokenAnimations());if(tokenPanelOpen) refresh();window.addEventListener("storage",refresh);window.addEventListener("focus",refresh);return () => {window.removeEventListener("storage",refresh);window.removeEventListener("focus",refresh);};},[tokenPanelOpen]);
  const tokenFileRef=useRef(null);
  const [hudPanel,setHudPanel]=useState(null);
  const [sessionOpen,setSessionOpen]=useState(false);
  const [sessionTool,setSessionTool]=useState("");
  const [sessionRequest,setSessionRequest]=useState(0);
  const [hudHidden,setHudHidden]=useState(false);
  const [notes,setNotes]=useState(() => localStorage.getItem(`darkness_tabletop3d_notes_${campaignCode}`) || "");
  const [diceHistory,setDiceHistory]=useState([]);

  const activeBackgroundKey=activeMapId || (activeMapName ? `name:${activeMapName}` : "default");
  const activeMapData=(campaign?.mapas3D || []).find(map => map.id===activeMapId);
  const activeSpawnPoints=activeMapData?.spawnPoints || {};
  const activeBackgroundUrl=activeMapData?.backgroundUrl || localBackgrounds[activeBackgroundKey]?.url || "";
  const tabletopPeople=useMemo(() => {
    const entries=new Map(campaignCharacters(campaign,[...espiralCharacters,...darknessCharacters]).map(character => [character.id,character]));
    (campaign?.tokens || []).filter(token => String(token.ficha_id).startsWith("inimigo:") && !token.removido && (mestre || !token.oculto)).forEach(token => {
      const state=obterEstadoToken3D(token,activeMapId);
      entries.set(token.ficha_id,{id:token.ficha_id,sheet:{name:token.nome || "NPC",occupation:"NPC",profileImage:token.imagem_url,tabletopTokenImage:state?.image || token.imagem_url}});
    });
    return [...entries.values()].map((character,index) => {
      const sheet=character.sheet || {};
      const isDarkness=character.id.startsWith("darkness:");
      return {
        id:character.id,
        name:sheet.name || sheet.nome || "Personagem",
        role:sheet.occupation || sheet.vertente || sheet.classe || (isDarkness ? "DARKNESS" : "ESPIRAL"),
        color:sheet.temaFicha?.primaria || "#817184",
        animation:sheet.tabletopTokenAnimation,portraitAnimation:sheet.profileTokenAnimation,portrait:sheet.profileImage || sheet.fotoPerfil || obterEstadoToken3D(campaign?.tokens?.find(token => token.ficha_id===character.id || `darkness:${token.ficha_id}`===character.id),activeMapId)?.portrait || "",
        image:sheet.tabletopTokenImage || obterEstadoToken3D(campaign?.tokens?.find(token => (token.ficha_id===character.id || `darkness:${token.ficha_id}`===character.id)),activeMapId)?.image || "",
        avatar3D:sheet.avatar3D || null,
        start:[((index%5)-2)*1.35,Math.floor(index/5)*1.35],
      };
    }).filter(person => person.image || person.avatar3D?.modelUrl);
  },[campaign,activeMapId,darknessCharacters,espiralCharacters,mestre]);
  const playerCharacterIndex=useMemo(() => {
    if(!tabletopPeople.length) return -1;
    const expectedIds=new Set([playerSheetId,`espiral:${playerSheetId}`,`darkness:${playerSheetId}`]);
    const found=tabletopPeople.findIndex(person => expectedIds.has(String(person.id)));
    return found;
  },[playerSheetId,tabletopPeople]);
  useEffect(() => {
    if(!mestre && playerCharacterIndex>=0) setSelected(playerCharacterIndex);
  },[mestre,playerCharacterIndex]);
  const updateEspiralSheet=useCallback((id,sheet) => {
    setEspiralCharacters(current => current.map(character => character.id===`espiral:${id}` ? {...character,sheet} : character));
  },[]);
  const playerFollowPosition=playerCharacterIndex>=0
    ? positions[playerCharacterIndex] || tabletopPeople[playerCharacterIndex]?.start || null
    : null;
  const masterFocusIndex=tabletopPeople.findIndex(person => person.id===masterFocusId);
  const masterFocusCustom=customTokens.find(token => token.id===masterFocusId);
  const cameraPersonIndex=mestre ? masterFocusIndex : playerCharacterIndex;
  const cameraFollowPosition=mestre ? (masterFocusIndex>=0 ? positions[masterFocusIndex] || tabletopPeople[masterFocusIndex].start : masterFocusCustom ? [masterFocusCustom.x,masterFocusCustom.z] : null) : playerFollowPosition;
  const appliedSpawnRef=useRef("");
  useEffect(() => {
    const spawn=activeSpawnPoints.tokens;
    const spawnKey=spawn && activeMapId ? `${activeMapId}:${spawn.x}:${spawn.y}:${spawn.z}` : "";
    if(!spawnKey || appliedSpawnRef.current===spawnKey) return;
    appliedSpawnRef.current=spawnKey;
    const positionFor=(index) => [
      Number(spawn.x)+(index%4-1.5)*0.72,
      Number(spawn.z)+Math.floor(index/4)*0.72,
    ];
    const nextPositions=tabletopPeople.map((person,index) => positionFor(index));
    actualPositions.current=nextPositions.map(position => [...position]);
    setPositions(nextPositions);
    setCustomTokens(current => current.map((token,index) => {
      const [x,z]=positionFor(tabletopPeople.length+index);
      return {...token,x,z};
    }));
    setNotice("Câmera e tokens posicionados no ponto inicial deste mapa.");
  },[activeMapId,activeSpawnPoints.tokens,tabletopPeople]);
  useEffect(() => {
    const patches=new Map();
    for(const token of campaign?.tokens || []) {
      const state=obterEstadoToken3D(token,activeMapId);
      if(!state || state.origin===tokenSyncOrigin.current) continue;
      const key=`${activeMapId}:${token.id}`;
      const revision=JSON.stringify(state);
      if(receivedTokenRevisions.current.get(key)===revision) continue;
      receivedTokenRevisions.current.set(key,revision);
      if(token.ficha_id.startsWith("custom3d:")) {
        setCustomTokens(current => [...current.filter(item => item.id!==state.id),state]);
        continue;
      }
      patches.set(token.ficha_id.startsWith("espiral:") || token.ficha_id.startsWith("darkness:") || token.ficha_id.startsWith("inimigo:") ? token.ficha_id : `darkness:${token.ficha_id}`,state);
    }
    if(!patches.size) return;
    setSheetTokenTransforms(current => {
      const next={...current};
      patches.forEach((state,id) => {next[id]={...current[id],...state};});
      localStorage.setItem(sheetTokenStorageKey,JSON.stringify(next));
      return next;
    });
    setPositions(current => tabletopPeople.map((person,index) => {
      const state=patches.get(person.id);
      return Number.isFinite(state?.x) && Number.isFinite(state?.z) ? [state.x,state.z] : current[index] || person.start;
    }));
  },[campaign?.tokens,activeMapId,tabletopPeople,sheetTokenStorageKey]);
  weatherRef.current=weather;
  campaignRef.current=campaign;
  if(syncedMasterCamera) masterCameraPoseRef.current=syncedMasterCamera;
  useEffect(() => {
    if(!mestre && playerCharacterIndex>=0) setSelected(playerCharacterIndex);
  },[mestre,playerCharacterIndex]);
  useEffect(() => {
    const refreshSavedCharacters=(event) => {
      if(!event?.key || event.key.startsWith(ESPIRAL_SHEET_PREFIX)) setEspiralCharacters(loadSavedEspiralCharacters());
      if(!event?.key || event.key.startsWith(DARKNESS_SHEET_PREFIX)) setDarknessCharacters(loadSavedDarknessCharacters());
    };
    window.addEventListener("storage",refreshSavedCharacters);window.addEventListener("darkness:token-animation-updated",refreshSavedCharacters);
    return () => {window.removeEventListener("storage",refreshSavedCharacters);window.removeEventListener("darkness:token-animation-updated",refreshSavedCharacters);};
  },[]);
  useEffect(() => {
    setPositions(previous => tabletopPeople.map((person,index) => {
      const saved=sheetTokenTransforms[person.id];
      return previous[index] || (Number.isFinite(saved?.x) && Number.isFinite(saved?.z) ? [saved.x,saved.z] : [...person.start]);
    }));
    actualPositions.current=tabletopPeople.map((person,index) => {
      const saved=sheetTokenTransforms[person.id];
      return actualPositions.current[index] || (Number.isFinite(saved?.x) && Number.isFinite(saved?.z) ? [saved.x,saved.z] : [...person.start]);
    });
    setSelected(current => Math.max(0,Math.min(current,Math.max(0,tabletopPeople.length-1))));
  },[sheetTokenTransforms,tabletopPeople]);
  useEffect(() => {
    localStorage.setItem(`darkness_tabletop3d_notes_${campaignCode}`,notes);
  },[campaignCode,notes]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if(event.key.toLowerCase() === "h" && !event.target.matches("input, textarea")) setHudHidden(value => !value);
      if(event.key === "Escape") { setHudPanel(null); setTokenPanelOpen(false); }
    };
    window.addEventListener("keydown",onKeyDown);
    return () => window.removeEventListener("keydown",onKeyDown);
  },[]);
  const applyCampaign = useCallback((loadedCampaign) => {
    if(!loadedCampaign) return;
    const maps=Array.isArray(loadedCampaign.mapas3D) ? loadedCampaign.mapas3D : [];
    const scene=loadedCampaign.cenaAtiva || loadedCampaign.cenas?.[0] || null;
    const activeMedia=activeTabletopScene({...loadedCampaign,cenaAtiva:scene});
    const activeLink=activeMedia.type==="map" ? activeMedia.media : null;
    const selectedMap=maps.find((map) => map.id === activeLink?.mapa3dId) || (!scene && maps[0]) || null;
    setCampaign({...loadedCampaign,cenaAtiva:scene});
    const selectedMapRevision=selectedMap ? `${selectedMap.id || ""}:${selectedMap.atualizadoEm || ""}` : "";
    if(mapAssetsRevisionRef.current !== selectedMapRevision) {
      mapAssetsRevisionRef.current=selectedMapRevision;
      setMapAssets(selectedMap?.assets || []);
    }
    setActiveMapId(selectedMap?.id || "");
    setActiveMapName(selectedMap ? selectedMap.nome || "Mapa 3D" : "");
    if(loadedCampaign.clima3D) {
      setSyncedMasterCamera(loadedCampaign.clima3D.camera || null);
      const visualWeather={...loadedCampaign.clima3D};
      delete visualWeather.camera;
      setWeather(current => {
        const next={...current,...visualWeather};
        return sameVisualWeather(current,next) ? current : next;
      });
    }
  },[]);
  const refreshCampaign = useCallback(() => buscarCampanhaPorCodigo(campaignCode)
    .then(applyCampaign)
    .catch(() => setNotice("Não foi possível carregar as cenas 3D desta campanha.")),[applyCampaign,campaignCode]);
  const handleCampaignChange = useCallback((event) => {
    if(event?.table==="tokens_mapa" && event.eventType==="DELETE") {
      const removed=campaignRef.current?.tokens?.find(token => token.id===event.old?.id);
      if(removed?.ficha_id?.startsWith("custom3d:")) setCustomTokens(current => current.filter(token => token.id!==removed.ficha_id.slice("custom3d:".length)));
      setCampaign(current => current ? {...current,tokens:(current.tokens || []).filter(token => token.id!==event.old?.id)} : current);
      return;
    }
    if(event?.table==="tokens_mapa" && event.new?.id) {
      setCampaign(current => current ? {...current,tokens:[...(current.tokens || []).filter(token => token.id!==event.new.id),event.new]} : current);
      return;
    }
    const current=campaignRef.current;
    const row=event?.table === "campanhas" ? event.new : null;
    const demoState=event?.detail?.estado || null;
    const realtimeState=row ? {
      mode:row.modo,
      sceneId:row.cena_ativa_id,
      mediaId:row.midia_ativa_id,
      maps:row.mapas_3d,
      climate:row.clima_3d,
    } : demoState ? {
      mode:demoState.modo,
      sceneId:demoState.cenaAtivaId,
      mediaId:demoState.midiaAtivaId,
      maps:demoState.mapas3D,
      climate:demoState.clima3D,
    } : null;
    if(demoState?.rolagens) setCampaign(previous => previous ? {...previous,rolagens:demoState.rolagens} : previous);
    if(demoState?.tokens) setCampaign(previous => previous ? {...previous,tokens:demoState.tokens} : previous);
    const sameMapStructure=realtimeState && current
      && realtimeState.mode===current.modo
      && String(realtimeState.sceneId || "") === String(current.cenaAtiva?.id || "")
      && String(realtimeState.mediaId || "") === String(current.midiaAtivaId || "")
      && mapRevision(realtimeState.maps) === mapRevision(current.mapas3D);
    if(sameMapStructure && realtimeState.climate) {
      const nextClimate=realtimeState.climate;
      setSyncedMasterCamera(nextClimate.camera || null);
      const visualWeather={...nextClimate};
      delete visualWeather.camera;
      setWeather(previous => {
        const next={...previous,...visualWeather};
        return sameVisualWeather(previous,next) ? previous : next;
      });
      return;
    }
    refreshCampaign();
  },[refreshCampaign]);
  useEffect(() => {
    let active=true;
    buscarCampanhaPorCodigo(campaignCode).then((loadedCampaign) => {
      if(active) applyCampaign(loadedCampaign);
    }).catch(() => setNotice("Não foi possível carregar as cenas 3D desta campanha."));
    return () => {active=false;};
  },[applyCampaign,campaignCode]);
  const publishMasterCamera=useCallback((pose) => {
    masterCameraPoseRef.current=pose;
    if(!mestre || !campaign?.id) return;
    const now=Date.now();
    if(now-lastCameraSyncRef.current<400) return;
    lastCameraSyncRef.current=now;
    salvarClima3DCampanha(campaign.id,{...weatherRef.current,camera:pose}).catch(() => {
      setNotice("A câmera continua local, mas a transmissão para os jogadores foi interrompida.");
    });
  },[campaign?.id,mestre]);
  useEffect(() => {
    if(!campaign?.id) return undefined;
    return ouvirCampanha(campaign.id, handleCampaignChange);
  },[campaign?.id,handleCampaignChange]);
  const persistWeather = async (next=weather) => {
    const synchronized=masterCameraPoseRef.current ? {...next,camera:masterCameraPoseRef.current} : next;
    localStorage.setItem(weatherStorageKey,JSON.stringify(synchronized));
    if(!mestre || !campaign?.id) return;
    try {
      setSavingWeather(true);
      await salvarClima3DCampanha(campaign.id,synchronized);
      setNotice(`Clima ${next.label || "personalizado"} aplicado à mesa.`);
    } catch(error) {
      setNotice(error.message || "Não foi possível sincronizar o clima.");
    } finally {
      setSavingWeather(false);
    }
  };
  const applyWeatherPreset = (presetId) => {
    const next={...WEATHER_PRESETS[presetId]};
    setWeather(next);
    persistWeather(next);
  };
  const customizeWeather = (patch) => setWeather(current => ({...current,...patch,preset:"custom",label:"Personalizado"}));
  const persistBackground = async (url,name="") => {
    try {
      setSavingBackground(true);
      if(campaign?.id && activeMapId) {
        const nextMaps=(campaign.mapas3D || []).map(map => map.id===activeMapId
          ? {...map,backgroundUrl:url,backgroundName:name,atualizadoEm:new Date().toISOString()}
          : map);
        await salvarMapas3DCampanha(campaign.id,nextMaps);
        setCampaign(current => current ? {...current,mapas3D:nextMaps} : current);
      } else {
        const next={...localBackgrounds,[activeBackgroundKey]:url ? {url,name} : undefined};
        if(!url) delete next[activeBackgroundKey];
        localStorage.setItem(backgroundStorageKey,JSON.stringify(next));
        setLocalBackgrounds(next);
      }
      setNotice(url ? "Background aplicado ao mapa." : "Background removido do mapa.");
    } catch(error) {
      setNotice(error.message || "Não foi possível salvar o background.");
    } finally {
      setSavingBackground(false);
    }
  };
  const importBackgroundFile = async (event) => {
    const file=event.target.files?.[0];
    event.target.value="";
    if(!file) return;
    try {
      setSavingBackground(true);
      const compressed=await compressBackgroundImage(file);
      let url=compressed;
      if(campaign?.id && activeMapId && campaign.id!=="demo" && !String(campaign.id).startsWith("demo-")) {
        const blob=await fetch(compressed).then(response => response.blob());
        const upload=new File([blob],`${file.name.replace(/\.[^.]+$/,"") || "background"}.jpg`,{type:"image/jpeg"});
        url=await enviarImagemCena(campaign.id,upload,"mapa");
      }
      await persistBackground(url,file.name);
    } catch(error) {
      setNotice(error.message || "Não foi possível preparar o background.");
      setSavingBackground(false);
    }
  };
  const applyBackgroundUrl = () => {
    const url=backgroundUrlInput.trim();
    if(!/^https?:\/\//i.test(url)) { setNotice("Informe uma URL iniciando com http:// ou https://."); return; }
    persistBackground(url,"URL personalizada");
    setBackgroundUrlInput("");
  };
  const publishCustomToken=(token) => {
    if(!mestre || !campaign?.id) return;
    salvarTokenCustom3D(campaign.id,activeMapId,token,tokenSyncOrigin.current).catch(error => setNotice(error.message || "Não foi possível sincronizar o token importado com a campanha."));
  };
  const saveCustomTokens = (next) => {
    next.filter(token => JSON.stringify(token)!==JSON.stringify(customTokens.find(item => item.id===token.id))).forEach(publishCustomToken);
    customTokens.filter(token => !next.some(item => item.id===token.id)).forEach(token => {if(mestre && campaign?.id) desvincularFicha(campaign.id,`custom3d:${token.id}`).catch(() => setNotice("Não foi possível remover o token da campanha."));});
    setCustomTokens(next);
    try { localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(next)); } catch { setNotice("Não foi possível salvar o token; a imagem pode ser grande demais."); }
  };
  const prepareToken = (image, name, animation) => {
    const token = { id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, image, animation, name: name || "Token importado", color: "#7a5b78", x: 0, z: 0, elevation: 0, scale: 1 };
    setPendingToken(token);
    setSelectedToken(null);
    setTokenMode(true);
    setTokenPanelOpen(false);
    setNotice(`Token ${token.name} pronto. Clique no piso para posicioná-lo.`);
  };
  const importTokenFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (r2Configurado) await verificarConfiguracaoMidia();
      setNotice(r2Configurado ? "Enviando a imagem do token ao R2…" : "Preparando token local: R2 inativo neste frontend.");
      const preparedImage = await prepareTokenImage(file);
      const image = await externalizarImagens(preparedImage);
      prepareToken(image, file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      setNotice(error.message || "Não foi possível importar essa imagem.");
    }
  };
  const importTokenUrl = () => {
    const value = tokenUrl.trim();
    if (!/^https?:\/\//i.test(value)) { setNotice("Informe uma URL de imagem iniciando com http:// ou https://."); return; }
    prepareToken(value, "Token por URL");
    setTokenUrl("");
  };
  const updateSelectedToken = (patch) => {
    if (!selectedToken) return;
    saveCustomTokens(customTokens.map(token => token.id === selectedToken ? { ...token, ...patch } : token));
  };
  const updateSheetToken = (personId,patch) => {
    if(!personId || (!mestre && personId!==tabletopPeople[playerCharacterIndex]?.id)) return;
    const sharedToken=campaign?.tokens?.find(token => (token.ficha_id===personId || `darkness:${token.ficha_id}`===personId));
    if(sharedToken) {
      const person=tabletopPeople.find(person => person.id===personId);
      salvarEstadoToken3D(sharedToken.id,activeMapId,{...patch,...(person?.image ? {image:person.image,portrait:person.portrait} : {}),origin:tokenSyncOrigin.current,revision:Date.now()}).catch(() => setNotice("Não foi possível sincronizar o token com a campanha. A posição permanece neste navegador."));
    }
    setSheetTokenTransforms(current => {
      const next={...current,[personId]:{...(current[personId] || {}),...patch}};
      try { localStorage.setItem(sheetTokenStorageKey,JSON.stringify(next)); }
      catch { setNotice("Não foi possível salvar os ajustes deste token."); }
      return next;
    });
  };
  const resetSheetToken = (personId) => {
    if(!personId) return;
    setSheetTokenTransforms(current => {
      const next={...current};
      delete next[personId];
      localStorage.setItem(sheetTokenStorageKey,JSON.stringify(next));
      return next;
    });
    const personIndex=tabletopPeople.findIndex(person => person.id===personId);
    if(personIndex>=0) {
      const initial=[...tabletopPeople[personIndex].start];
      actualPositions.current[personIndex]=initial;
      setPositions(previous => previous.map((position,index) => index===personIndex ? initial : position));
    }
    setNotice("Ajustes do token restaurados.");
  };
  const limitarPosicaoToken = ([x,z]) => activeMapName
    ? [x,z]
    : [Math.max(-4.3,Math.min(4.3,x)),Math.max(-3.3,Math.min(3.3,z))];
  const finishTokenInteraction = (tokenId, position, moved) => {
    const [x,z]=limitarPosicaoToken(position);
    const sharedCustom=customTokens.find(token => token.id===tokenId);
    if(sharedCustom) publishCustomToken({...sharedCustom,x,z});
    setDraggingToken(false);
    setCustomTokens(tokens => {
      const next=tokens.map(token => token.id === tokenId ? { ...token,x,z } : token);
      try { localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY,JSON.stringify(next)); } catch { setNotice("Não foi possível salvar a nova posição do token."); }
      return next;
    });
    if (moved) {
      setNotice("Token reposicionado.");
    } else {
      setNotice("Token selecionado. Clique com o botão direito para editar.");
    }
  };
  const removeSelectedToken = () => {
    if (!selectedToken) return;
    const token = customTokens.find(item => item.id === selectedToken);
    if (!window.confirm(`Apagar ${token?.name || "este token"} do tabletop?`)) return;
    saveCustomTokens(customTokens.filter(token => token.id !== selectedToken));
    setSelectedToken(null);
    setTokenMode(false);
    setNotice("Token removido do tabletop.");
  };
  const toggleHudPanel = (panel) => {
    if(!mestre && ["scene","scenes","audio","soundpad"].includes(panel)) return;
    if(["audio","evidence","initiative","session","soundpad","participants","npcs","scenes","combat","investigation","dashboard","shop"].includes(panel) || (panel==="notes" && mestre)) {
      setSessionTool(panel);setSessionRequest(value => value+1);setSessionOpen(current => sessionTool===panel ? !current : true);setHudPanel(null);setTokenPanelOpen(false);return;
    }
    setSessionOpen(false);
    setHudPanel(current => current === panel ? null : panel);
    setTokenPanelOpen(false);
  };
  const activeDifficulty=difficultyOptions(campaign?.cenaAtiva,campaign?.inimigos || []).find(option=>option.id===(campaign?.cenaAtiva?.dificuldades?.contexto || "ambiente")) || difficultyOptions(campaign?.cenaAtiva)[0];
  const updateSceneDifficulty=async(patch) => {
    if(!mestre || !campaign?.id || !campaign.cenaAtiva) return;
    const scene={...campaign.cenaAtiva,dificuldades:{ambiente:4,combateAmbiente:4,conflitos:4,...campaign.cenaAtiva.dificuldades,...patch}};
    try {
      await salvarCena(campaign.id,scene);
      setCampaign(current=>({...current,cenaAtiva:scene,cenas:current.cenas.map(item=>item.id===scene.id ? scene : item)}));
    } catch(error) {setNotice(error.message || "Não foi possível compartilhar a dificuldade da cena.");}
  };
  const setDifficultyContext=(contexto)=>updateSceneDifficulty({contexto});
  const rollDie = (sides) => {
    const result=Math.floor(Math.random()*sides)+1;
    setDiceHistory(previous => [{sides,result,id:Date.now()},...previous].slice(0,6));
    setNotice(`Rolagem ${routeParams.get("sistema")==="espiral" ? espiralDie(sides) : `d${sides}`}: ${result}.`);
    if(campaign?.id) registrarRolagem(campaign.id,mestre ? "Mestre" : tabletopPeople[playerCharacterIndex]?.name || "Jogador",{formula:`1d${sides}`,total:result,resultado:result,...rollOutcome(result,activeDifficulty.value),context:activeDifficulty.label,category:activeDifficulty.category}).catch(() => setNotice("A rolagem ficou local; não foi possível compartilhá-la com a campanha."));
  };
  const sceneMaps = (scene) => (scene?.mapasBatalha || [])
    .filter((map) => map.origem === "tabletop3d" || map.mapa3dId)
    .map((link) => ({link,map:campaign?.mapas3D?.find((item) => item.id === link.mapa3dId)}))
    .filter((item) => item.map);
  const switchScene = async (scene,mapLink=null,imageLink=null) => {
    if(!mestre || !campaign?.id || switchingScene) return;
    try {
      setSwitchingScene(true);
      const mode=mapLink ? "mapa" : "cena";
      const mediaId=mapLink?.id || imageLink?.id || null;
      await ativarCena(campaign.id,scene.id,mode,mediaId);
      applyCampaign({...campaign,cenaAtiva:scene,modo:mode,midiaAtivaId:mediaId});
      setPositions(tabletopPeople.map((person) => [...person.start]));
      setNotice(mapLink ? `${scene.nome} · ${mapLink.nome} apresentado para a mesa.` : `${scene.nome} apresentada sem mapa 3D.`);
    } catch(error) {
      setNotice(error.message || "Não foi possível trocar a cena.");
    } finally {
      setSwitchingScene(false);
    }
  };
  const activePresentation=activeTabletopScene(campaign);
  const staticScene=activePresentation.type==="static" ? activePresentation.media : null;
  const staticCinemaKey=staticScene ? `${campaign?.cenaAtiva?.id}:${staticScene.id}:${staticScene.url}` : "";

  const activeSceneIndex=Math.max(0,(campaign?.cenas || []).findIndex((scene) => scene.id === campaign?.cenaAtiva?.id));
  const activeSceneLabel=String(activeSceneIndex + 1).padStart(2,"0");
  const activeSceneName=campaign?.cenaAtiva?.nome || (activeMapName ? "Cena 3D" : "O último depoimento");
  const selectedTokenData=customTokens.find(token => token.id === selectedToken) || null;
  const selectedSheetPerson=!tokenMode ? tabletopPeople[selected] || null : null;
  const selectedSheetTransform=selectedSheetPerson ? sheetTokenTransforms[selectedSheetPerson.id] || {} : null;
  const editableTokenData=selectedTokenData || (selectedSheetPerson ? {
    ...selectedSheetPerson,
    elevation:Number(selectedSheetTransform?.elevation)||0,
    scale:Number(selectedSheetTransform?.scale)||0.35,
    lanterna:selectedSheetTransform?.lanterna,
    rotacao:Number(selectedSheetTransform?.rotacao)||0,
    olharCamera:selectedSheetTransform?.olharCamera!==false,animation:selectedSheetPerson?.animation ? {...selectedSheetPerson.animation,enabled:selectedSheetTransform?.animationEnabled ?? selectedSheetPerson.animation.enabled} : selectedSheetTransform?.animation,
    fromSheet:true,
  } : null);
  const updateEditableToken = (patch) => selectedTokenData
    ? updateSelectedToken(patch)
    : updateSheetToken(selectedSheetPerson?.id,patch);
  const lastPlayerMoveSave=useRef(0);
  const movePlayerToken=(destination) => {
    if(mestre || playerCharacterIndex<0) return;
    const person=tabletopPeople[playerCharacterIndex];
    const next=limitarPosicaoToken(destination);
    if(!activeMapName && !clearPath(playerFollowPosition,next)) return;
    setPositions(previous => previous.map((position,index) => index===playerCharacterIndex ? next : position));
    if(Date.now()-lastPlayerMoveSave.current>=150) {
      lastPlayerMoveSave.current=Date.now();
      updateSheetToken(person.id,{x:next[0],z:next[1]});
    }
  };
  const embeddedEspiralId=mestre ? (selectedSheetPerson?.id?.startsWith("espiral:") ? selectedSheetPerson.id.slice("espiral:".length) : null) : routeParams.get("sistema")==="espiral" ? playerSheetId || "principal" : null;
  function move(e) {
    e.stopPropagation();
    // A floor click only places a newly imported token; existing tokens move by dragging.
    if(!mestre || e.delta>5 || !pendingToken) return;
    const heightPatch=activeMapName ? {elevation:e.point.y-(Number(activeSpawnPoints.tokens?.y)||0)} : {};
    const placed={...pendingToken,x:e.point.x,z:e.point.z,...heightPatch};
    saveCustomTokens([...customTokens,placed]);
    setSelectedToken(placed.id);setPendingToken(null);
    setNotice(placed.name+" inserido. Arraste o token para mover.");
  }
  const tacticalCenter=useMemo(() => [Number(activeSpawnPoints.tokens?.x)||0,Number(activeSpawnPoints.tokens?.z)||0],[activeSpawnPoints.tokens?.x,activeSpawnPoints.tokens?.z]);
  const flashlightCandidates=mestre ? [...tabletopPeople.map(person => ({id:person.id,name:person.name,lanterna:sheetTokenTransforms[person.id]?.lanterna})),...customTokens.map(token => ({...token,custom:true}))] : playerCharacterIndex>=0 ? [{...tabletopPeople[playerCharacterIndex],lanterna:sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id]?.lanterna}] : [];
  const flashlightPerson=flashlightCandidates.find(person => person.id===flashlightTarget) || flashlightCandidates[0];
  const changeFlashlight=lanterna => {
    if(!flashlightPerson) return;
    if(!mestre && flashlightPerson.id!==tabletopPeople[playerCharacterIndex]?.id) return;
    if(flashlightPerson.custom) saveCustomTokens(customTokens.map(token => token.id===flashlightPerson.id ? {...token,lanterna} : token));
    else updateSheetToken(flashlightPerson.id,{lanterna});
  };
  const cameraFlashlightId=mestre ? (hudPanel==="flashlight" ? flashlightPerson?.id : tokenMode ? selectedToken : tabletopPeople[selected]?.id) : tabletopPeople[playerCharacterIndex]?.id;
  const tacticalTokens=[...tabletopPeople.map((person,index) => ({id:person.id,name:person.name,image:person.portrait || "",animation:person.portraitAnimation,color:person.color,rotacao:sheetTokenTransforms[person.id]?.rotacao,lanterna:sheetTokenTransforms[person.id]?.lanterna,x:(positions[index] || person.start)[0],z:(positions[index] || person.start)[1],elevation:(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[person.id]?.elevation)||0),personIndex:index,selected:!tokenMode && selected===index})),...customTokens.map(token => ({...token,selected:tokenMode && selectedToken===token.id}))];
  return <main className={`tt3 ${mobile ? "tt3-mobile" : ""} ${mobileMenu ? "tt3-mobile-menu-open" : ""} ${view==="cinema" && !tacticalMode ? "tt3-letterboxed" : ""} ${!mestre && hudPanel==="sheet" && !hudHidden && !staticScene && !tacticalMode ? "tt3-player-sheet-open" : ""} ${hudHidden ? "tt3-hud-hidden" : ""}`}>
    <ContextTransition contextKey={campaign ? `${campaign.cenaAtiva?.id}:${campaign.midiaAtivaId}:${campaign.modo}` : "loading"}/>
    <Suspense fallback={null}><TabletopSessionTools open={sessionOpen} tool={sessionTool} requestVersion={sessionRequest} onClose={() => setSessionOpen(false)}/></Suspense>
    <section className="tt3-stage" aria-label="Sala de investigação tridimensional">
      <div className="tt3-cinema-bars" aria-hidden="true"/>
      <StaticSceneCinema activeKey={staticCinemaKey} mestre={mestre} onHudChange={setHudHidden}/>
      <SceneBoundary key={activeMapId}>
        {!staticScene && !tacticalMode && <Canvas
          className="tt3-world-canvas"
          style={staticScene || tacticalMode ? {visibility:"hidden",pointerEvents:"none"} : undefined}
          shadows
          dpr={1}
          camera={{position:[10,8,12],fov:42}}
          gl={parameters => createTabletopRenderer(parameters,THREE.WebGLRenderer)}
          onCreated={({gl}) => { gl.toneMapping=THREE.ACESFilmicToneMapping; gl.toneMappingExposure=0.92; }}
          fallback={<div className="tt3-fallback">Seu navegador não oferece suporte a WebGL.</div>}
        >
          <TabletopResolutionLimit/>
          <Camera
            view={view}
            interactionLocked={draggingToken || Boolean(staticScene) || tacticalMode}
            mode={mestre ? (masterFocusId ? "character" : "free") : playerCameraMode}
            focusRequest={mestre ? masterFocusRequest : 0}
            sheetFocus={(!mobile || landscape) && !mestre && hudPanel==="sheet" && !hudHidden && !staticScene && !tacticalMode}
            followPosition={cameraFollowPosition}
            followHeight={1.86*(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.scale)||0.35)}
            followElevation={(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.elevation)||0)}
            syncedPose={syncedMasterCamera}
            onPoseChange={mestre ? publishMasterCamera : undefined}
            spawnPose={activeSpawnPoints.camera}
            spawnKey={activeMapId}
          />
          <PlayerTokenNavigation enabled={!staticScene && !mestre && playerCharacterIndex>=0 && !hudPanel && !tokenPanelOpen && !draggingToken} cameraRelative={!tacticalMode} position={playerFollowPosition} onMove={movePlayerToken} onStop={() => {if(playerCharacterIndex>=0 && playerFollowPosition) updateSheetToken(tabletopPeople[playerCharacterIndex].id,{x:playerFollowPosition[0],z:playerFollowPosition[1]});}}/>
          <WeatherEnvironment weather={weather}/>
          <PanoramaBackground url={activeBackgroundUrl}/>
          {activeMapName ? <CustomMapStage onFloor={move} baseElevation={activeSpawnPoints.tokens?.y}/> : <Room night={night} onFloor={move}/>}
          <PlacedAssets items={mapAssets} selectedId={null} onSelect={() => {}} onSurfaceClick={activeMapName ? move : undefined}/>
          {customTokens.map(token => <Suspense key={`${activeMapId}:${token.id}`} fallback={null}><CustomToken token={token} canDrag={mestre} aimWithCamera={!tacticalMode && cameraFlashlightId===token.id} onAim={lanterna => {if(mestre) saveCustomTokens(customTokens.map(item => item.id===token.id ? {...item,lanterna} : item));}} baseElevation={activeSpawnPoints.tokens?.y} selected={token.id === selectedToken} onSelect={id => {setSelectedToken(id);setPendingToken(null);setTokenMode(true);setNotice(`${token.name} selecionado. Arraste-o livremente para mover.`);}} onEdit={() => {setTokenPanelOpen(true);setHudPanel(null);setNotice(`Editando ${token.name}.`);}} onDragStart={() => setDraggingToken(true)} constrainPosition={limitarPosicaoToken} onDragEnd={finishTokenInteraction}/></Suspense>)}
          {tabletopPeople.map((person,i) => <Suspense key={`${activeMapId}:${person.id}`} fallback={null}><Person person={person} playerView={!mestre && i===playerCharacterIndex} sheetOpen={hudPanel==="sheet"} combat={Boolean(sheetTokenTransforms[person.id]?.combat)} animation={person.animation ? {...person.animation,enabled:sheetTokenTransforms[person.id]?.animationEnabled ?? person.animation.enabled} : sheetTokenTransforms[person.id]?.animation} canDrag={mestre} rotacao={sheetTokenTransforms[person.id]?.rotacao} olharCamera={sheetTokenTransforms[person.id]?.olharCamera} aimWithCamera={!tacticalMode && cameraFlashlightId===person.id} onAim={lanterna => updateSheetToken(person.id,{lanterna})} lanterna={sheetTokenTransforms[person.id]?.lanterna} position={positions[i] || person.start} scale={sheetTokenTransforms[person.id]?.scale} elevation={sheetTokenTransforms[person.id]?.elevation} baseElevation={activeSpawnPoints.tokens?.y} selected={!tokenMode && selected===i} onPosition={p => {actualPositions.current[i]=p;}} onSelect={() => {setSelected(i);setTokenMode(false);setSelectedToken(null);}} onEdit={() => {setTokenPanelOpen(true);setHudPanel(null);setNotice(`Editando o token de ${person.name}.`);}} onDragStart={() => setDraggingToken(true)} constrainPosition={limitarPosicaoToken} onDragEnd={(position,moved) => {setDraggingToken(false);setPositions(previous => previous.map((current,index) => index===i ? position : current));updateSheetToken(person.id,{x:position[0],z:position[1]});setNotice(moved ? `${person.name} foi reposicionado.` : `${person.name} selecionado. Clique com o botão direito para editar.`);}}/></Suspense>)}
        </Canvas>}
      </SceneBoundary>

      {tacticalMode && !staticScene && <SceneBoundary><Suspense fallback={<div className="tt3-fallback">Carregando mapa tático…</div>}><TacticalTabletop assets={mapAssets} mapKey={activeMapId} center={tacticalCenter} locked={draggingToken} mestre={mestre} tokens={tacticalTokens} onFloor={move} onDragStart={() => setDraggingToken(true)} onDragEnd={() => setDraggingToken(false)} onSelect={token => {if(token.personIndex!==undefined) {setSelected(token.personIndex);setTokenMode(false);} else {setSelectedToken(token.id);setTokenMode(true);}}} onMove={(token,position) => {if(!mestre) return;if(token.personIndex!==undefined) {setPositions(current => current.map((p,index) => index===token.personIndex ? position : p));updateSheetToken(token.id,{x:position[0],z:position[1]});} else finishTokenInteraction(token.id,position,true);}}/></Suspense></SceneBoundary>}
      {staticScene && <div className={`tt3-static-scene ${!mestre ? "tt3-static-scene-player" : ""}`}><img src={staticScene.url} alt={staticScene.nome || campaign?.cenaAtiva?.nome || "Cena estática"}/></div>}
      <div className="tt3-cinema-shade" aria-hidden="true"/>
      <div className="tt3-film-grain" aria-hidden="true"/>

      <header className="tt3-cinema-header">
        <div className="tt3-scene-identity">
          <a href={returnUrl} className="tt3-back" aria-label={mestre ? "Voltar ao dashboard" : "Voltar para a ficha"}>←</a>
          <div><span>{activeMapName ? `CENA ${activeSceneLabel} · ${activeMapName}` : `CENA ${activeSceneLabel} · SEM MAPA 3D`}</span><h1>{activeSceneName}</h1></div>
        </div>
        <div className="tt3-session-meta">
          <span className="tt3-role">{mestre ? "Visão do mestre" : "Visão do jogador"}</span>{!mestre && playerCharacterIndex>=0 && <CombatPostureButton active={Boolean(sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id]?.combat)} animation={tabletopPeople[playerCharacterIndex].animation || sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id]?.animation} onChange={combat => updateSheetToken(tabletopPeople[playerCharacterIndex].id,{combat})} onNotice={setNotice}/>}
          <button type="button" onClick={() => setHudHidden(true)} title="Ocultar interface (H)">Modo cinema</button>
        </div>
      </header>

      {hudHidden && <button type="button" className="tt3-show-hud" onClick={() => setHudHidden(false)}>Mostrar interface · H</button>}

      {mobile && !hudHidden && <button type="button" className="tt3-mobile-menu-button" aria-label="Ferramentas" aria-expanded={mobileMenu} onClick={() => setMobileMenu(value => !value)}>☰</button>}
      {mobile && !hudHidden && !staticScene && <MobileTabletopControls enabled={!hudPanel && !tokenPanelOpen && !sessionOpen} onMoveStart={() => {if(mestre) setMasterFocusId(null);}}/>}
      <nav className="tt3-command-rail" aria-label={mestre ? "Ferramentas do mestre" : "Ferramentas do jogador"}>
        {(mestre ? [
          ["scene","Cena",activeSceneLabel],
          ["tokens","Tokens",tabletopPeople.length + customTokens.length],
          ["scenes","Biblioteca",""],
          ["npcs","NPCs",""],
          ["investigation","Investigação",""],
          ["dashboard","Dashboard",""],
          ["weather","Clima",weather.preset==="custom" ? "Livre" : weather.label],
          ["background","Fundo",activeBackgroundUrl ? "Ativo" : "—"],
          ["dice","Dados","D20"],
          ["initiative","Iniciativa","D20"],
          ["flashlight","Lanterna",""],
          ["evidence","Pistas",""],
          ["audio","Músicas",""],
          ["soundpad","Soundpad",""],
          ["participants","Jogadores",""],
          ["notes","Notas",notes ? "•" : ""],
        ] : [
          ["sheet","Ficha",""],
          ["dice","Dados","D20"],
          ["initiative","Iniciativa",""],
          ["evidence","Pistas",""],
          ["participants","Jogadores",""],
          ["notes","Notas",notes ? "•" : ""],
        ]).map(([id,label,badge]) => <button
          type="button"
          key={id}
          aria-pressed={hudPanel===id || (sessionOpen && sessionTool===id) || (id==="tokens" && (tokenPanelOpen || tokenMode))}
          onClick={() => {
            if(id==="tokens") { setSessionOpen(false); setTokenPanelOpen(value => !value); setTokenMode(true); setSelectedToken(null); setPendingToken(null); setHudPanel(null); }
            else toggleHudPanel(id);
            setMobileMenu(false);
          }}
        ><span>{label}</span>{badge !== "" && <small>{badge}</small>}</button>)}
      </nav>

      {mestre && <div className="tt3-cast-bar" aria-label="Personagens na cena">
        {tabletopPeople.map((person,index) => <button type="button" key={person.id} aria-pressed={!tokenMode && selected===index} onClick={() => {setSelected(index);setTokenMode(false);setSelectedToken(null);if(mestre){setMasterFocusId(person.id);setMasterFocusRequest(value=>value+1);setTacticalMode(false);}}} onContextMenu={event => {event.preventDefault();setSelected(index);setTokenMode(false);setSelectedToken(null);setTokenPanelOpen(true);setHudPanel(null);setNotice(`Editando o token de ${person.name}.`);}} title={`${person.name} · ${person.role} · botão direito para editar`}><i style={{background:person.color}}/><span>{person.name}</span></button>)}
        {customTokens.map(token => <button type="button" key={token.id} aria-pressed={tokenMode && selectedToken===token.id} onClick={() => {setTokenMode(true);setPendingToken(null);setSelectedToken(token.id);if(mestre){setMasterFocusId(token.id);setMasterFocusRequest(value=>value+1);setTacticalMode(false);}}} onContextMenu={event => {event.preventDefault();setTokenMode(true);setPendingToken(null);setSelectedToken(token.id);setTokenPanelOpen(true);setHudPanel(null);setNotice(`Editando ${token.name}.`);}} title={`Token · ${token.name} · botão direito para editar`}><i style={{background:token.color || "#7a5b78"}}/><span>{token.name}</span></button>)}
      </div>}

      {!mestre && !staticScene && <button type="button" className="tt3-player-flashlight" aria-label={flashlightPerson?.lanterna?.ativa ? "Apagar lanterna" : "Acender lanterna"} aria-pressed={Boolean(flashlightPerson?.lanterna?.ativa)} title={flashlightPerson?.lanterna?.ativa ? "Lanterna acesa · clique para apagar" : "Lanterna apagada · clique para acender"} disabled={!flashlightPerson} onClick={() => changeFlashlight({...normalizarLanterna(flashlightPerson?.lanterna),ativa:!flashlightPerson?.lanterna?.ativa})}>
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g transform="rotate(-35 16 16)"><path d="M12 13h8v14h-8zM10 6h12v5l-2 2h-8l-2-2z"/><path d="M10 6h12M14 18h4"/>{flashlightPerson?.lanterna?.ativa && <path d="M16 1v2M9 1l2 2M23 1l-2 2"/>}</g>{!flashlightPerson?.lanterna?.ativa && <path d="M5 27L27 5"/>}</svg>
      </button>}
      <div className="tt3-camera-dock" aria-label="Modos de câmera">
        {[['room','Cena'],['cinema','Cinema'],['panorama','Panorâmica'],['detail','Detalhe']].map(([id,label]) => <button type="button" key={id} aria-pressed={!tacticalMode && view===id} onClick={() => {if(mestre)setMasterFocusId(null);setTacticalMode(false);setView(id);}}>{label}</button>)}
        <button type="button" disabled={Boolean(staticScene)} aria-pressed={tacticalMode} onClick={() => setTacticalMode(value => !value)}>Mapa tático 2D</button>
      </div>

      {campaign && <RollNotifications key={campaign.id} rolls={campaign.rolagens || []} mestre={mestre}/>}
      <div className="tt3-toast" role="status"><span>{notice}</span><small>{tacticalMode && !staticScene ? (mestre ? "Arraste os tokens para mover · arraste o mapa para navegar · roda: zoom" : "WASD: mover seu personagem · arraste o mapa para navegar · roda: zoom") : mestre ? "Botão direito + arrastar: olhar sem sair do lugar · botão esquerdo: orbitar · WASD: mover · Shift + arrastar: deslocar · roda: zoom · Q/E: descer/subir" : "WASD: mover seu personagem · botão direito + arrastar: olhar no mesmo lugar · botão esquerdo: orbitar · roda: aproximar"}</small></div>

      {hudPanel && <aside className={`tt3-hud-drawer ${hudPanel==="sheet" && embeddedEspiralId ? "tt3-sheet-drawer" : ""}`} aria-label="Painel de ferramentas">
        <header><div><span>TABLETOP 3D</span><h2>{({scene:"Cena",weather:"Clima",background:"Background",initiative:"Iniciativa",dice:"Dados",evidence:"Pistas",audio:"Áudio",notes:"Notas",sheet:"Ficha"})[hudPanel]}</h2></div><button type="button" onClick={() => setHudPanel(null)} aria-label="Fechar painel">×</button></header>
        {hudPanel==="scene" && <div className="tt3-drawer-content"><p className="tt3-kicker">Cena ativa</p><h3>{activeSceneName}</h3><p>{activeMapName ? `Mapa: ${activeMapName}` : "Esta cena ainda não possui um mapa 3D vinculado."}</p><div className="tt3-scene-stats"><span><strong>{tabletopPeople.length + customTokens.length}</strong> participantes</span><span><strong>{mapAssets.length}</strong> assets</span><span><strong>{night ? "Noite" : "Dia"}</strong> luz</span></div><div className="tt3-scene-browser">{(campaign?.cenas || []).map((scene,index) => {const maps=sceneMaps(scene);const active=scene.id===campaign?.cenaAtiva?.id;return <article key={scene.id} className={active ? "active" : ""}><button type="button" className="tt3-scene-choice" disabled={!mestre || switchingScene} onClick={() => switchScene(scene,(scene.imagensCena || []).length ? null : maps[0]?.link || null,(scene.imagensCena || [])[0] || null)}><small>CENA {String(index+1).padStart(2,"0")}</small><strong>{scene.nome}</strong><span>{maps.length ? `${maps.length} mapa(s) 3D` : "Sem mapa 3D"}</span></button>{maps.length>0 && <div>{maps.map(({link,map}) => <button type="button" key={link.id} className={active && map.id===activeMapId ? "active" : ""} disabled={!mestre || switchingScene} onClick={() => switchScene(scene,link)}>{map.nome}</button>)}</div>}{(scene.imagensCena || []).length>0 && <div>{scene.imagensCena.map(image => <button type="button" key={image.id} className={active && staticScene?.id===image.id ? "active" : ""} disabled={!mestre || switchingScene} onClick={() => switchScene(scene,null,image)}>{image.nome || "Cena estática"}</button>)}</div>}</article>;})}{!(campaign?.cenas || []).length && <p>Nenhuma cena cadastrada nesta campanha.</p>}</div>{!mestre && <small className="tt3-scene-sync-note">A troca de cena é controlada pelo mestre e sincronizada automaticamente.</small>}<button type="button" className="tt3-primary" onClick={() => {setPositions(tabletopPeople.map(person => [...person.start]));setNotice("Personagens nas posições iniciais.");}}>Reiniciar posições</button></div>}
        {hudPanel==="flashlight" && <div className="tt3-drawer-content"><p>A luz acompanha o token no mapa.</p>{mestre && <label>Personagem ou NPC<select aria-label="Token da lanterna" value={flashlightPerson?.id || ""} onChange={event => setFlashlightTarget(event.target.value)}>{flashlightCandidates.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}{flashlightPerson ? <FlashlightControls value={flashlightPerson.lanterna} onChange={changeFlashlight}/> : <p>Nenhum token disponível no mapa.</p>}</div>}
        {hudPanel==="weather" && <div className="tt3-drawer-content tt3-weather-panel">
          <p>Escolha uma atmosfera pronta ou ajuste livremente para improvisar a cena.</p>
          <div className="tt3-weather-presets">{Object.entries(WEATHER_PRESETS).map(([id,preset]) => <button type="button" key={id} aria-pressed={weather.preset===id} onClick={() => applyWeatherPreset(id)}>{preset.label}</button>)}</div>
          <div className="tt3-weather-colors">
            <label><span>Céu</span><input type="color" value={weather.skyColor} onChange={event => customizeWeather({skyColor:event.target.value})} onBlur={() => persistWeather()}/></label>
            <label><span>Neblina</span><input type="color" value={weather.fogColor} onChange={event => customizeWeather({fogColor:event.target.value})} onBlur={() => persistWeather()}/></label>
            <label><span>Luz</span><input type="color" value={weather.sunColor} onChange={event => customizeWeather({sunColor:event.target.value})} onBlur={() => persistWeather()}/></label>
          </div>
          {[["rain","Chuva",0,1,.01],["snow","Neve",0,1,.01],["wind","Vento",-1,1,.01],["ambient","Luz ambiente",0,1.5,.01],["sun","Força do sol",0,3,.01],["sunSize","Tamanho do sol",.3,2.5,.01],["fogNear","Início da névoa",1,30,.1],["fogFar","Alcance visual",8,100,.5]].map(([field,label,min,max,step]) => <label className="tt3-weather-range" key={field}><span>{label}<b>{Number(weather[field]).toFixed(step<.1 ? 2 : 1)}</b></span><input type="range" min={min} max={max} step={step} value={weather[field]} onChange={event => customizeWeather({[field]:Number(event.target.value)})} onPointerUp={() => persistWeather()} onKeyUp={() => persistWeather()}/></label>)}
          <button type="button" className="tt3-primary" disabled={savingWeather} onClick={() => persistWeather()}>{savingWeather ? "Sincronizando…" : "Aplicar clima improvisado"}</button>
        </div>}
        {hudPanel==="background" && <div className="tt3-drawer-content tt3-background-panel">
          <p>Adicione uma imagem panorâmica ou uma fotografia de floresta, cidade ou outro ambiente para preencher o horizonte deste mapa.</p>
          <div className={`tt3-background-status ${activeBackgroundUrl ? "active" : ""}`}>
            <span>{activeBackgroundUrl ? "Background ativo" : "Sem background"}</span>
            <small>{activeMapName || "Cenário atual"}</small>
          </div>
          <button type="button" className="tt3-primary" disabled={savingBackground} onClick={() => backgroundFileRef.current?.click()}>{savingBackground ? "Preparando…" : "Escolher imagem do dispositivo"}</button>
          <input ref={backgroundFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={importBackgroundFile} hidden/>
          <div className="tt3-background-url"><input value={backgroundUrlInput} onChange={event => setBackgroundUrlInput(event.target.value)} placeholder="https://site.com/background.jpg" aria-label="URL do background"/><button type="button" disabled={savingBackground} onClick={applyBackgroundUrl}>Aplicar URL</button></div>
          <small>Para o melhor resultado, use uma imagem panorâmica larga. Imagens comuns também são ajustadas ao redor do mapa.</small>
          {activeBackgroundUrl && <button type="button" className="tt3-background-remove" disabled={savingBackground} onClick={() => persistBackground("","")}>Remover background</button>}
        </div>}
        {hudPanel==="dice" && <div className="tt3-drawer-content tt3-dice-panel">
          {mestre && <SceneDifficultyPanel scene={campaign?.cenaAtiva} enemies={campaign?.inimigos} onSave={updateSceneDifficulty}/>}
          <section className="tt3-quick-rolls"><header><span>ROLAGEM RÁPIDA</span><h3>Escolha um dado</h3></header><div className="tt3-dice-grid">{[20,12,10,8,6,4].map(sides => <button type="button" key={sides} onClick={() => rollDie(sides)}>{routeParams.get("sistema")==="espiral" ? espiralDie(sides) : `d${sides}`}</button>)}</div></section>
          {mestre ? <section className="tt3-dice-history-section" aria-label="Histórico de Dados"><header><span>CAMPANHA</span><h3>Histórico de Dados</h3></header><RollHistory rolls={campaign?.rolagens || []}/></section> : <div className="tt3-roll-history">{diceHistory.length ? diceHistory.map(roll => <span key={roll.id}>{routeParams.get("sistema")==="espiral" ? espiralDie(roll.sides) : `d${roll.sides}`}<strong>{roll.result}</strong></span>) : <small>Nenhuma rolagem ainda.</small>}</div>}
        </div>}
        {hudPanel==="notes" && <div className="tt3-drawer-content"><p>Anotações privadas desta campanha, salvas neste navegador.</p><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Registre suspeitas, nomes e decisões..."/><small>Salvamento automático.</small></div>}
        {hudPanel==="sheet" && (embeddedEspiralId ? <div className="tt3-embedded-sheet" onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()}>
          <Suspense fallback={<p role="status">Carregando ficha ESPIRAL…</p>}><FichaEspiral key={embeddedEspiralId} sheetId={embeddedEspiralId} embedded scene={campaign?.cenaAtiva} sceneEnemies={campaign?.inimigos || []} rollContext={activeDifficulty} difficultyLocked={!mestre} onRollContextChange={setDifficultyContext} onSheetChange={updateEspiralSheet} onRoll={(roll,author) => {if(campaign?.id) registrarRolagem(campaign.id,author,{...roll,...rollOutcome(roll.total ?? roll.best ?? roll.resultado ?? 0,roll.difficulty ?? activeDifficulty.value),context:roll.context || activeDifficulty.label,category:roll.category || activeDifficulty.category,formula:roll.label,sistema:"espiral"}).catch(() => setNotice("Não foi possível compartilhar a rolagem da ficha."));}}/></Suspense>
        </div> : <div className="tt3-drawer-content tt3-empty-panel"><span>▤</span><h3>Ficha do personagem</h3><a href={returnUrl} className="tt3-primary">Abrir ficha</a></div>)}
      </aside>}

      {tokenPanelOpen && <aside className="tt3-token-panel" aria-label="Importar e ajustar token">
        <header><div><span>PERSONAGEM · IMAGEM</span><strong>{editableTokenData ? editableTokenData.name : "Adicionar token"}</strong></div><button type="button" onClick={() => setTokenPanelOpen(false)} aria-label="Fechar">×</button></header>
        {editableTokenData && <div className="tt3-token-transform">
          {(mestre || (!selectedTokenData && selectedSheetPerson?.id===tabletopPeople[playerCharacterIndex]?.id)) && <FlashlightControls value={editableTokenData.lanterna} onChange={lanterna => updateEditableToken({lanterna})}/>}
          {mestre && editableTokenData.fromSheet && <label><input type="checkbox" checked={Boolean(selectedSheetTransform?.combat)} onChange={event => updateEditableToken({combat:event.target.checked})}/> Postura de combate</label>}{mestre && <div className="tt3-token-rotation">
            <label><span>Rotação do token</span><input aria-label="Rotação do token" type="number" min="0" max="359" step="5" value={((Number(editableTokenData.rotacao)||0)%360+360)%360} onChange={event => updateEditableToken({rotacao:((Number(event.target.value)||0)%360+360)%360,olharCamera:false})}/></label>
            <section><button type="button" onClick={() => updateEditableToken({rotacao:((Number(editableTokenData.rotacao)||0)+315)%360,olharCamera:false})}>↶ 45°</button><button type="button" onClick={() => updateEditableToken({rotacao:((Number(editableTokenData.rotacao)||0)+45)%360,olharCamera:false})}>↷ 45°</button></section>
            <label><input type="checkbox" checked={editableTokenData.olharCamera!==false} onChange={event => updateEditableToken({olharCamera:event.target.checked})}/> Sempre olhar para a câmera</label>
          </div>}
          <label className="tt3-token-name"><span>Nome do personagem</span><input type="text" value={editableTokenData.name || ""} readOnly={editableTokenData.fromSheet} onChange={(event) => updateEditableToken({name:event.target.value})} placeholder="Nome do personagem"/></label>
          <p>Arraste o token pela imagem. Use os controles abaixo para alinhar os pés com qualquer superfície.</p>
          <div>
            <span>Altura precisa <b>{(Number(editableTokenData.elevation)||0).toFixed(2)} m</b></span>
            <input
              type="number"
              min="-500"
              max="500"
              step="0.01"
              value={Number(editableTokenData.elevation)||0}
              onChange={(event) => updateEditableToken({elevation:Number(event.target.value)})}
              aria-label="Altura precisa do token"
            />
            <section className="tt3-token-transform-three">
              <button type="button" onClick={() => updateEditableToken({elevation:Math.max(-500,(Number(editableTokenData.elevation)||0)-0.05)})} disabled={(Number(editableTokenData.elevation)||0)<=-500} aria-label="Descer token">↓ 5 cm</button>
              <button type="button" onClick={() => updateEditableToken({elevation:0})} aria-label="Colocar token no nível base">Nível 0</button>
              <button type="button" onClick={() => updateEditableToken({elevation:Math.min(500,(Number(editableTokenData.elevation)||0)+0.05)})} disabled={(Number(editableTokenData.elevation)||0)>=500} aria-label="Subir token">↑ 5 cm</button>
            </section>
          </div>
          <div>
            <span>Tamanho livre <b>{Math.round((Number(editableTokenData.scale)||1)*100)}%</b></span>
            <input
              type="range"
              min="0.01"
              max="3"
              step="0.01"
              value={Number(editableTokenData.scale)||1}
              onChange={(event) => updateEditableToken({scale:Number(event.target.value)})}
              aria-label="Tamanho preciso do token"
            />
            <section>
              <button type="button" onClick={() => updateEditableToken({scale:Math.max(0.01,(Number(editableTokenData.scale)||1)-0.05)})} disabled={(Number(editableTokenData.scale)||1)<=0.01} aria-label="Diminuir token">− 5%</button>
              <button type="button" onClick={() => updateEditableToken({scale:Math.min(3,(Number(editableTokenData.scale)||1)+0.05)})} disabled={(Number(editableTokenData.scale)||1)>=3} aria-label="Aumentar token">+ 5%</button>
            </section>
          </div>
          {editableTokenData.fromSheet
            ? <button type="button" className="tt3-token-remove" onClick={() => resetSheetToken(editableTokenData.id)}>Restaurar tamanho, altura e posição</button>
            : <button type="button" className="tt3-token-remove" onClick={removeSelectedToken}>Apagar token</button>}
        </div>}
                {mestre && <section className="tt3-animation-library" aria-label="Animações de tokens"><strong>Animações do mestre</strong><a href="/?mestre=1&amp;aba=animacoes" target="_blank" rel="noreferrer">Abrir Estúdio de Tokens</a>{animationLibrary.length===0 && <small>As animações salvas nas fichas são aplicadas automaticamente aos tokens. Configure-as no Dashboard.</small>}{animationLibrary.filter(entry => !entry.fichaId && entry.tokenType!=="2d").map(entry => <button type="button" key={entry.id} onClick={() => {const animation={...entry.animation,image:entry.image};if(editableTokenData) {updateEditableToken(editableTokenData.fromSheet ? {animation} : {image:entry.image,animation});setNotice(`Animação ${entry.name} aplicada ao token.`);} else {prepareToken(entry.image,entry.name,animation);}}}>{editableTokenData ? 'Aplicar' : 'Adicionar'}: {entry.name}</button>)}{editableTokenData?.animation && <button type="button" onClick={() => updateEditableToken(editableTokenData.fromSheet ? {animationEnabled:editableTokenData.animation.enabled===false} : {animation:{...editableTokenData.animation,enabled:editableTokenData.animation.enabled===false}})}>{editableTokenData.animation.enabled===false ? 'Ativar animação' : 'Desativar animação'}</button>}</section>}
        <p>Escolha uma imagem PNG/JPG, de preferência com fundo transparente, para colocar no tabuleiro.</p>
        <button type="button" className="tt3-token-upload" onClick={() => tokenFileRef.current?.click()}>Escolher imagem do dispositivo</button>
        <input ref={tokenFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={importTokenFile} hidden/>
        <div className="tt3-token-url"><input value={tokenUrl} onChange={event => setTokenUrl(event.target.value)} placeholder="https://site.com/personagem.png" aria-label="URL da imagem"/><button type="button" onClick={importTokenUrl}>Usar URL</button></div>
        <small>Imagens importadas usam R2 quando configurado. URLs externas continuam no site de origem.</small>
        {mestre && <MediaMigrationPanel/>}
      </aside>}

    </section>
  </main>;
}














