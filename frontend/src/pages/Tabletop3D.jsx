import ShieldInitiativeStrip from '../components/tabletop/ShieldInitiativeStrip';
import PlayerViewSettings from '../components/tabletop/PlayerViewSettings';
import SurvivalIndicators from '../components/campanha/SurvivalIndicators';
import '../styles/PlayerTabletop.css';
import {WEATHER_PRESETS,DEFAULT_WEATHER} from '../utils/tabletopWeather';
import WeatherEnvironment from '../components/tabletop/WeatherEnvironment';
import Camera from '../components/tabletop/TabletopCamera';
import {cutsceneEditorUrl} from '../utils/cutsceneRoutes';
import ExplorationPanel from '../components/tabletop/ExplorationPanel';
import ContextualInteraction from '../components/tabletop/ContextualInteraction';
import SpatialAudioZones from '../components/tabletop/SpatialAudioZones';
import TokenQuickActions from '../components/tabletop/TokenQuickActions';
import {visibleToPlayer,localCameraMotion} from '../utils/tabletopExploration';
import CharacterCameraObstruction from '../components/tabletop/CharacterCameraObstruction';
import {confirmarDialogo} from '../components/ui/DialogoGlobal';
import {initiativeOrder} from '../utils/initiativeOrder';
import PlayerInitiativeBar from '../components/tabletop/PlayerInitiativeBar';
import SceneMedia from '../components/tabletop/SceneMedia';
import SpecialScene from '../components/tabletop/SpecialScene';
import useTabletopTokenSync from '../components/tabletop/useTabletopTokenSync';
import { SpecialMechanicsBanner, SpecialMechanicsDialog } from '../components/tabletop/SpecialMechanics';
import RevoltPlayerHUD, { hasActiveRevolt } from '../components/tabletop/RevoltPlayerHUD';
import {sharedCustomToken} from '../utils/sharedCustomToken';
import PlayerUVControls from '../components/tabletop/PlayerUVControls';
import {tokenFlashlight,playerFlashlightPatch,flashlightModeActive,toggleFlashlightMode} from '../utils/flashlightAccess';
import useUVReveal from '../components/tabletop/useUVReveal';
import {uvTextImage} from '../utils/uvLight';
import UVClueControls from '../components/tabletop/UVClueControls';
import PlayerCameraDistance,{PLAYER_CAMERA_DISTANCE_KEY,normalizePlayerDistance,minimumPlayerDistance} from '../components/tabletop/PlayerCameraDistance';
import {cameraMotionForViewer} from '../utils/cameraMotion';
import CameraMotionControls,{CAMERA_MOTION_KEY,normalizeCameraMotion} from '../components/tabletop/CameraMotionControls';
import HandheldCameraMotion from '../components/tabletop/HandheldCameraMotion';
import useCameraSpeedShortcut from '../components/tabletop/useCameraSpeedShortcut';
import { normalizeCameraSpeed, CAMERA_SPEED_KEY } from '../utils/cameraSpeed';
import TokenSizeControls from '../components/tabletop/TokenSizeControls';
import MasterShield from '../components/tabletop/MasterShield';
import SessionClockControls from '../components/tabletop/SessionClockControls';
import { normalizeSessionClock, sessionMinutes, changeSessionClock, daylightWeather } from '../utils/tabletopClock';
import NumberInput from '../components/ui/NumberInput';
import AnimatedScene from '../components/tabletop/AnimatedScene';
import { espiralDie } from '../utils/espiralDice';
import CombatPostureButton from '../components/absoluto/CombatPostureButton';
import {tokenPresentation} from '../utils/tokenAnimation';
import TabletopResolutionLimit from '../components/tabletop/TabletopResolutionLimit';
import {createTabletopRenderer,isWebGLCreationError,tabletop2DUrl} from '../utils/tabletopRenderer';
import '../styles/TokenAnimationStudio.css';
import AnimatedTokenArt from '../components/tokens/AnimatedTokenArt';
import {readTokenAnimations} from '../utils/tokenAnimation';
import { campaignCharacters, tabletopPlayerId, canMoveTacticalToken } from "../utils/tabletopCharacters";
import MobileTabletopControls from "../components/tabletop/MobileTabletopControls";
import { suavizarPoseToken } from "../utils/tokenMotion";
import {playerLocomotion,walkingPose} from '../utils/playerLocomotion';
import {useReducedTokenMotion} from '../components/tokens/AnimatedTokenArt';
import { mapCollisionMeshes, mapCollisionPending, collisionSignature, createTokenCollisionWorld, moveTokenWithCollision } from '../utils/tabletopCollision';
import {tokenAppearance,missingTokenAppearance,olderTokenState,mergeTokenUpdate,tokenTransformCache,mergeDoorStates} from '../utils/tabletopTokenState';
import { rotacaoToken } from "../utils/tokenOrientation";
import TokenFlashlight, { FlashlightControls, normalizarLanterna } from "../components/tokens/TokenFlashlight";
import MediaMigrationPanel from "../components/midia/MediaMigrationPanel";
import { externalizarImagens, r2Configurado } from "../services/mediaStorage";
import { verificarConfiguracaoMidia } from "../services/mediaMigration";
import {activeSceneDifficulty,rollOutcome} from "../utils/sceneDifficulty";
import RollNotifications, {RollHistory} from "../components/tabletop/RollNotifications";
import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PlacedAssets, loadSavedMap } from "../components/tabletop/MapEditor3D";
import { RealisticAvatarModel } from "../components/tabletop/RealisticAvatar3D";
import { compressBackgroundImage, prepareTokenImage } from "../services/imageCompression";
import { definirIniciativa, desvincularInimigo, vincularInimigo, atualizarInimigoCampanha, ativarCena, buscarCampanhaPorCodigo, enviarImagemCena, ouvirCampanha, salvarClima3DCampanha, salvarMapas3DCampanha, salvarPorta3DCampanha, obterEstadoToken3D, salvarEstadoToken3D, salvarTokenCustom3D, desvincularFicha, registrarRolagem, salvarCena } from "../services/mesaApi";
import "../styles/Tabletop3D.css";
import ContextTransition from "../components/ui/ContextTransition";
import { activeTabletopScene,specialSceneDestinations } from "../utils/tabletopScene";

export {default as Camera} from '../components/tabletop/TabletopCamera';

const TabletopSessionTools = lazy(() => import("../components/tabletop/TabletopSessionTools"));
const TacticalTabletop = lazy(() => import("../components/tabletop/TacticalTabletop"));
const ShieldDocuments = lazy(() => import("./mesa"));
const FichaEspiral = lazy(() => import("./fichaEspiral"));
const CUSTOM_TOKENS_STORAGE_KEY = "darkness_tabletop_custom_tokens_v1";
const ESPIRAL_SHEET_PREFIX = "espiral:sheet:v1:";
const DARKNESS_SHEET_PREFIX = "fichaRPG_personagem_";
const mapRevision = (maps = []) => (Array.isArray(maps) ? maps : [])
  .map((map) => `${map.id || ""}:${map.atualizadoEm || ""}`)
  .join("|");
const sameVisualWeather = (current, next) => {
  const keys = ["preset","label","skyColor","fogColor","sunColor","ambient","sun","sunSize","fogNear","fogFar","rain","snow","wind"];
  return keys.every((key) => current?.[key] === next?.[key])
    && JSON.stringify(current?.sunPosition || []) === JSON.stringify(next?.sunPosition || [])
    && JSON.stringify(current?.clock || null) === JSON.stringify(next?.clock || null);
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

export function useTokenDragCollision(ref, scale, baseElevation) {
  const {scene}=useThree();
  const cache=useRef(null);
  return destination => {
    scene.updateMatrixWorld?.();
    const feet=ref.current.position;
    if(mapCollisionPending(scene)) return {position:[feet.x,feet.z],elevation:feet.y};
    const meshes=mapCollisionMeshes(scene);
    const signature=collisionSignature(meshes);
    if(!cache.current || cache.current.signature!==signature) cache.current={signature,world:createTokenCollisionWorld(meshes)};
    return moveTokenWithCollision(cache.current.world,[feet.x,feet.y,feet.z],destination,{
      scale,baseElevation:Number(baseElevation)||0,recoverSpawn:true,
    });
  };
}

function Person({person,position,selected,onSelect,onEdit,onPosition,onDragStart,onDragEnd,constrainPosition,scale=0.35,elevation=0,baseElevation=0,lanterna,aimWithCamera,onAim,rotacao=0,olharCamera=true,canDrag=true,animation,playerView=false,sheetOpen=false,combat=false,firstPerson=false,hideWhenClose=false}) {
  const ref = useRef();
  const artRef = useRef();
  const bodyRef = useRef();
  const walkRef=useRef();
  const gait=useRef({last:null,distance:0,speed:0});
  const reducedMotion=useReducedTokenMotion();
  const safeElevation=(Number(baseElevation)||0)+Math.max(-500,Math.min(500,Number(elevation)||0));
  const initialPose = useRef([position[0],safeElevation,position[1]]);
  const presentation=tokenPresentation(person.image,animation,{playerView,sheetOpen,combat});
  const dragRef = useRef(null);
  const resolveDrag=useTokenDragCollision(ref,scale,baseElevation);
  const touchTimer=useRef(null);
  useEffect(() => () => clearTimeout(touchTimer.current),[]);
  useFrame((_,delta) => {
    const target=ref.current;
    if(!target) return;
    if (!dragRef.current) {
      const next=suavizarPoseToken([target.position.x,target.position.y,target.position.z],[position[0],safeElevation,position[1]],delta);
      target.position.set(...next);
    }
    onPosition([target.position.x,target.position.z],target.position.y);
    const walking=gait.current;
    const traveled=walking.last ? Math.hypot(target.position.x-walking.last[0],target.position.z-walking.last[1]) : 0;
    walking.last=[target.position.x,target.position.z];
    const active=playerView && !person.avatar3D?.modelUrl && !dragRef.current && !firstPerson && !sheetOpen && !reducedMotion;
    const speed=active && traveled<.25 && delta>0 ? Math.min(.8,traveled/delta) : 0;
    walking.speed+=(speed-walking.speed)*(1-Math.exp(-18*Math.min(delta,.05)));
    if(active && traveled<.25) walking.distance+=traveled;
    if(walkRef.current) {
      const pose=walkingPose(walking.distance,walking.speed,active ? 1 : 0);
      walkRef.current.position.y=pose.lift;
      walkRef.current.rotation.z=pose.roll;
    }
  },-2);
  useFrame(({camera}) => {
    if(bodyRef.current && ref.current) {
      const target=ref.current.position,size=Math.max(.01,Number(scale)||.35);
      const distance=Math.hypot(camera.position.x-target.x,camera.position.y-(target.y+size*1.4),camera.position.z-target.z);
      // Hysteresis prevents flicker at the visibility threshold.
      const limit=size*(bodyRef.current.visible ? .65 : .85);
      bodyRef.current.visible=!firstPerson && (!hideWhenClose || distance>limit);
    }
    const target=ref.current;
    if(!target) return;
    if (artRef.current) {
      artRef.current.rotation.y = rotacaoToken(rotacao,playerView || olharCamera,[camera.position.x,camera.position.z],[target.position.x,target.position.z]) + (person.avatar3D?.modelUrl ? Math.PI+(presentation.back ? Math.PI : 0) : 0);
    }
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
      planeElevation: ref.current.position.y,
      moved: false,
    };
    onSelect();
    onDragStart?.();
  };
  const drag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = pontoNoPiso(event,dragRef.current.planeElevation);
    if (!point) return;
    let nextPosition = constrainPosition?.([
      dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY,
      dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY,
    ]) || [dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY, dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY];
    const resolved=resolveDrag(nextPosition);
    nextPosition=resolved.position;
    ref.current.position.y=resolved.elevation;
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
    onDragEnd?.(finalPosition,moved,ref.current.position.y-(Number(baseElevation)||0));
  };
  const edit = (event) => {
    event.stopPropagation();
    event.nativeEvent?.preventDefault();
    onSelect();
    onEdit?.();
  };
  const safeScale=Math.max(0.01,Math.min(3,Number(scale)||0.35));
  return <group userData={{tokenInteraction:true}} ref={ref} position={initialPose.current} scale={safeScale} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onContextMenu={edit}>
    {lanterna?.ativa && <TokenFlashlight config={lanterna} aimWithCamera={aimWithCamera} onAim={onAim} scale={safeScale} height={1.1*safeScale}/>}
    <group ref={bodyRef} visible={!firstPerson}><group ref={walkRef}>{person.avatar3D?.modelUrl
      ? <group ref={artRef} rotation={[0,Math.PI+(Number(rotacao)||0)*Math.PI/180,0]} scale={selected ? 1.04 : 1}><RealisticAvatarModel avatar={person.avatar3D}/></group>
      : <BillboardPersonArt image={presentation.image} artRef={artRef} selected={selected} animation={presentation.animation} id={person.id}/>
    }
    </group></group>
    {selected && !firstPerson && <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.012,0]}>
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
  const image=useMemo(()=>token.uvText ? uvTextImage(token.uvText) : token.image,[token.uvText,token.image]);
  const texture = useLoader(THREE.TextureLoader, image);
  const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 0.55;
  const tokenHeight = 0.65;
  const tokenWidth = Math.min(0.52, Math.max(0.18, tokenHeight * aspect));
  const scale = Math.max(0.01, Math.min(3, Number(token.scale) || 1));
  const resolveDrag=useTokenDragCollision(ref,scale*0.65/1.86,baseElevation);
  useUVReveal(ref,Boolean(token.uvOnly),canDrag,tokenHeight/2);
  const elevation = (Number(baseElevation)||0)+Math.max(-500, Math.min(500, Number(token.elevation) || 0));
  const initialPose=useRef([token.x,elevation,token.z]);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  useFrame(({ camera },delta) => {
    if(ref.current && !dragRef.current) {
      const next=suavizarPoseToken([ref.current.position.x,ref.current.position.y,ref.current.position.z],[token.x,elevation,token.z],delta);
      ref.current.position.set(...next);
    }
    if (artRef.current && ref.current) {
      artRef.current.rotation.y = rotacaoToken(token.rotacao,token.olharCamera,[camera.position.x,camera.position.z],[ref.current.position.x,ref.current.position.z]);
    }
  });
  const startDrag = (event) => {
    if(event.button !== 0 || ref.current?.visible===false) return;
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
      planeElevation: ref.current.position.y,
      moved: false,
    };
    onSelect(token.id);
    onDragStart?.(token.id);
  };
  const drag = (event) => {
    clearTimeout(touchTimer.current);
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = pontoNoPiso(event,dragRef.current.planeElevation);
    if (!point) return;
    let position = constrainPosition?.([
      dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY,
      dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY,
    ]) || [dragRef.current.origin[0] + (point[0] + dragRef.current.offset[0] - dragRef.current.origin[0]) * TOKEN_DRAG_SENSITIVITY, dragRef.current.origin[1] + (point[1] + dragRef.current.offset[1] - dragRef.current.origin[1]) * TOKEN_DRAG_SENSITIVITY];
    const resolved=resolveDrag(position);
    position=resolved.position;
    ref.current.position.y=resolved.elevation;
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
    onDragEnd?.(token.id, position, moved,ref.current.position.y-(Number(baseElevation)||0));
  };
  const edit = (event) => {
    if(ref.current?.visible===false || !canDrag) return;
    event.stopPropagation();
    event.nativeEvent?.preventDefault();
    onSelect(token.id);
    onEdit?.(token.id);
  };
  return <group visible={!token.uvOnly || canDrag} userData={{tokenInteraction:true,tabletopInstanceId:token.id,tabletopClue:token.uvText ? {title:token.name || 'Pista UV',text:token.uvText} : null}} ref={ref} position={initialPose.current} scale={scale} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onContextMenu={edit}>

    {token.lanterna?.ativa && <TokenFlashlight config={token.lanterna} aimWithCamera={aimWithCamera} onAim={onAim} scale={scale} height={tokenHeight*scale*0.65}/>}
    <group ref={artRef}><AnimatedTokenArt unlit={Boolean(token.uvOnly)} image={image} animation={token.animation} id={token.id} width={tokenWidth} height={tokenHeight} selected={selected}/></group>
  </group>;
}
export function StaticSceneCinema({activeKey,mestre,onHudChange}) {
  const automatic=useRef(false);
  useEffect(() => {
    if(mestre) return;
    if(activeKey) {onHudChange(true);automatic.current=true;}
    else if(automatic.current) {onHudChange(false);automatic.current=false;}
  },[activeKey,mestre,onHudChange]);
  return null;
}
export function PlayerTokenNavigation({enabled,position,onMove,onStop,cameraRelative=true,collision=false,elevation=0,baseElevation=0,scale=0.35,collisionController,speed=1}) {
  const {scene}=useThree();
  const physics=useRef({signature:null,world:null,velocity:0,checkedAt:-Infinity,lastFeet:null,pending:false,recoverSpawn:true});
  useEffect(()=>{
    const changed=()=>{physics.current.checkedAt=-Infinity;physics.current.lastFeet=null;};
    window.addEventListener('darkness:map-collision-changed',changed);
    return ()=>window.removeEventListener('darkness:map-collision-changed',changed);
  },[]);
  const refreshWorld = () => {
    if(Date.now()-physics.current.checkedAt<500) return;
    physics.current.checkedAt=Date.now();
    scene.updateMatrixWorld?.();
    const pending=mapCollisionPending(scene);
    if(physics.current.pending && !pending) physics.current.recoverSpawn=true;
    physics.current.pending=pending;
    const meshes=mapCollisionMeshes(scene);
    const signature=collisionSignature(meshes);
    if(signature!==physics.current.signature) {
      physics.current.world=createTokenCollisionWorld(meshes);
      physics.current.signature=signature;
      physics.current.lastFeet=null;
    }
  };
  const resolve = (destination,delta=0) => {
    refreshWorld();
    if(physics.current.pending) {physics.current.velocity=0;return {position:[...position],elevation:baseElevation+elevation,velocity:0};}
    const result=moveTokenWithCollision(physics.current.world,[position[0],baseElevation+elevation,position[1]],destination,{scale,baseElevation,delta,velocity:physics.current.velocity,recoverSpawn:physics.current.recoverSpawn});
    physics.current.recoverSpawn=false;
    physics.current.velocity=result.velocity;
    physics.current.lastFeet=[result.position[0],result.elevation,result.position[1],scale];
    return result;
  };
  useEffect(() => {
    if(!collisionController || !collision || !position) return;
    collisionController.current=resolve;
    return () => {collisionController.current=null;};
  });
  const keys=useRef(new Set());
  const movementVelocity=useRef([0,0]);
  const stop=useRef(onStop);
  stop.current=onStop;
  const direction=useMemo(() => new THREE.Vector3(),[]);
  useEffect(() => {
    const clear=() => {movementVelocity.current=[0,0];if(keys.current.size) stop.current?.();keys.current.clear();};
    clear();
    if(!enabled) return;
    const down=event => {
      const key=event.key.toLowerCase();
      if(!['w','a','s','d'].includes(key) || event.target?.closest?.('input,textarea,select,button,[contenteditable="true"]')) return;
      keys.current.add(key);
      event.preventDefault();
    };
    const up=event => {const released=keys.current.delete(event.key.toLowerCase());if(released && !keys.current.size) {movementVelocity.current=[0,0];stop.current?.();}};
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',clear);
    return () => {clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[enabled]);
  useFrame(({camera},delta) => {
    if(!enabled || !position || (!collision && !keys.current.size)) return;
    if(collision) {
      refreshWorld();
      const last=physics.current.lastFeet;
      if(!keys.current.size && physics.current.velocity===0 && last && last[3]===scale && Math.abs(last[0]-position[0])<0.00001 && Math.abs(last[1]-baseElevation-elevation)<0.00001 && Math.abs(last[2]-position[1])<0.00001) {
        return;
      }
    }
    if(cameraRelative) camera.getWorldDirection(direction);
    else direction.set(0,0,-1);
    const length=Math.hypot(direction.x,direction.z);
    const fx=length>0.001 ? direction.x/length : 0;
    const fz=length>0.001 ? direction.z/length : -1;
    const forward=Number(keys.current.has('w'))-Number(keys.current.has('s'));
    const sideways=Number(keys.current.has('d'))-Number(keys.current.has('a'));
    const x=fx*forward-fz*sideways,z=fz*forward+fx*sideways;
    const movement=playerLocomotion(movementVelocity.current,[x,z],delta,speed);
    movementVelocity.current=movement.velocity;
    const destination=position.map((value,i)=>value+movement.offset[i]);
    if(collision) {
      const next=resolve(destination,delta);
      if(next.position.some((value,i)=>Math.abs(value-position[i])>0.00001) || Math.abs(next.elevation-baseElevation-elevation)>0.00001) onMove(next.position,next.elevation-baseElevation);
    } else onMove(destination);
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
  const sheetPanelRef=useRef(null);
  const [landscape,setLandscape]=useState(()=>window.matchMedia?.('(orientation: landscape)')?.matches || false);
  useEffect(()=>{const query=window.matchMedia?.('(orientation: landscape)');if(!query)return;const update=()=>setLandscape(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  useEffect(() => {if(!window.matchMedia) return;const query=window.matchMedia("(max-width: 1100px) and (pointer: coarse)");const update=() => setMobile(query.matches);query.addEventListener("change",update);return () => query.removeEventListener("change",update);},[]);
  const routeParams=new URLSearchParams(window.location.search);
  const mestre=routeParams.get("papel") === "mestre";
  const campaignCode=routeParams.get("campanha") || "local";
  const returnParams=new URLSearchParams();
  const playerSheetId=tabletopPlayerId(routeParams);
  if(!mestre) {
    if(campaignCode!=="local") returnParams.set("campanhaTeste",campaignCode);
    if(routeParams.get("sistema")==="espiral") returnParams.set("sistema","espiral");
    if(routeParams.get("ficha")) returnParams.set("ficha",routeParams.get("ficha"));
    if(routeParams.get("senha")) returnParams.set("senha",routeParams.get("senha"));
  }
  const returnUrl=mestre ? "/?mestre=1" : returnParams.toString() ? `/?${returnParams.toString()}` : "/";
  const tokenSyncOrigin=useRef(`tabletop3d-${Date.now()}-${Math.random()}`);
  const receivedTokenRevisions=useRef(new Map());
  const latestTokenRevisions=useRef(new Map());
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
  const [savingWeather,setSavingWeather]=useState(false);
  const [notice,setNotice]=useState(mestre ? "Selecione um personagem e clique no piso para movê-lo." : "");
  const actualPositions=useRef([]);
  const renderedTokenPoses=useRef(new Map());
  const localMapAssets=useRef(campaignCode === "local" ? loadSavedMap() : []).current;
  const [mapAssets,setMapAssets]=useState(localMapAssets);
  const [localDoorStates,setLocalDoorStates]=useState({});
  const pendingDoors=useRef(new Set());
  const [identifyDoors,setIdentifyDoors]=useState(false);
  const [activeMapName,setActiveMapName]=useState(localMapAssets.length ? "Mapa 3D local" : "");
  const weatherRef=useRef(weather);
  const [clockNow,setClockNow]=useState(Date.now);
  const clockMinutes=sessionMinutes(weather.clock,clockNow);
  const renderedWeather=daylightWeather(weather,clockMinutes,WEATHER_PRESETS);
  useEffect(() => {
    if (!weather.clock?.enabled || !weather.clock?.running) return undefined;
    const timer=window.setInterval(() => setClockNow(Date.now()),250);
    return () => window.clearInterval(timer);
  },[weather.clock?.enabled,weather.clock?.running]);
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
  const [shieldCollapsed,setShieldCollapsed]=useState(false);
  const [shieldHeight,setShieldHeight]=useState(()=>Math.min(65,Math.max(25,Number(localStorage.getItem('darkness:shield3d:height')) || 32)));

  const [sessionOpen,setSessionOpen]=useState(false);
  const [mechanicsOpen,setMechanicsOpen]=useState(false);
  const [playerCameraDistance,setPlayerCameraDistance]=useState(()=>{try{return normalizePlayerDistance(JSON.parse(localStorage.getItem(PLAYER_CAMERA_DISTANCE_KEY)||'1.5'));}catch{return 1.5;}});
  useEffect(()=>{if(!mestre)localStorage.setItem(PLAYER_CAMERA_DISTANCE_KEY,JSON.stringify(playerCameraDistance));},[playerCameraDistance,mestre]);
  const [cameraMotion,setCameraMotion]=useState(()=>{if(!mestre)return normalizeCameraMotion(null);try{return normalizeCameraMotion(JSON.parse(localStorage.getItem(CAMERA_MOTION_KEY)||'null'));}catch{return normalizeCameraMotion(null);}});
  useEffect(()=>{if(mestre)localStorage.setItem(CAMERA_MOTION_KEY,JSON.stringify(cameraMotion));},[cameraMotion,mestre]);
  const [interactionHint,setInteractionHint]=useState(null);
  const [examinedClue,setExaminedClue]=useState(null);
  const [quickToken,setQuickToken]=useState(null);
  const [spatialContext,setSpatialContext]=useState(null);
  const [motionReduction,setMotionReduction]=useState(()=>{try{return Math.max(0,Math.min(1,Number(localStorage.getItem('darkness:tabletop:motion-reduction')??1)));}catch{return 1;}});
  useEffect(()=>{localStorage.setItem('darkness:tabletop:motion-reduction',String(motionReduction));},[motionReduction]);
  useEffect(()=>()=>{spatialContext?.close().catch(()=>{});},[spatialContext]);
  const [shoulderSide,setShoulderSide]=useState(1);
  useEffect(()=>{
    const switchShoulder=event=>{
      if(event.code!=='KeyV' || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target?.closest?.('input,textarea,select,button,[contenteditable=true]'))return;
      setShoulderSide(value=>-value);
    };
    window.addEventListener('keydown',switchShoulder);
    return ()=>window.removeEventListener('keydown',switchShoulder);
  },[]);
  const [tokenSpeed,setTokenSpeed]=useState(()=>{try{return normalizeCameraSpeed(JSON.parse(localStorage.getItem('darkness:tabletop:token-speed') || '1'));}catch{return 1;}});
  useEffect(()=>{localStorage.setItem('darkness:tabletop:token-speed',JSON.stringify(tokenSpeed));},[tokenSpeed]);
  useCameraSpeedShortcut(setTokenSpeed,null,!mestre);
  const cameraMotionRef=useRef(cameraMotion);
  cameraMotionRef.current=cameraMotion;
  const [cameraSpeed,setCameraSpeed]=useState(()=>{try{return normalizeCameraSpeed(JSON.parse(localStorage.getItem(CAMERA_SPEED_KEY) || '1'));}catch{return 1;}});
  useCameraSpeedShortcut(setCameraSpeed,setCameraMotion,mestre);
  useEffect(()=>{localStorage.setItem(CAMERA_SPEED_KEY,JSON.stringify(cameraSpeed));},[cameraSpeed]);
  const [sessionTool,setSessionTool]=useState("");
  const [sessionRequest,setSessionRequest]=useState(0);
  const [hudHidden,setHudHidden]=useState(false);
  const [notes,setNotes]=useState(() => localStorage.getItem(`darkness_tabletop3d_notes_${campaignCode}`) || "");
  const [diceHistory,setDiceHistory]=useState([]);

  const activeBackgroundKey=activeMapId || (activeMapName ? `name:${activeMapName}` : "default");
  const activeMapData=(campaign?.mapas3D || []).find(map => map.id===activeMapId);
  const exploration=activeMapData?.exploration || {};
  const visibleAssets=mapAssets.filter(item=>visibleToPlayer(exploration.visibility?.[item.instanceId],playerSheetId,mestre));
  const visiblePerson=id=>visibleToPlayer(sheetTokenTransforms[id],playerSheetId,mestre);
  const visibleCustom=token=>visibleToPlayer(token,playerSheetId,mestre);
  const doorStates=activeMapData?.doorStates || localDoorStates;
  const activeSpawnPoints=activeMapData?.spawnPoints || {};
  const activeBackgroundUrl=activeMapData?.backgroundUrl || localBackgrounds[activeBackgroundKey]?.url || "";
  const toggleDoor=async (id,bounds,identify=false)=>{
    if(!id) {setNotice('Esta peça inclui grande parte do mapa. A folha da porta precisa ser um objeto separado no modelo 3D.');return;}
    const key=`${activeMapId}:${id}`;
    if(pendingDoors.current.has(key)) return;
    const previous=doorStates[id];
    if(identify && previous?.interactive) {setNotice('Esta porta já está identificada. Desative Marcar portas para abrir ou fechar.');return;}
    if(previous?.open && bounds && tabletopPeople.some((person,index)=>{
      const [x,z]=positions[index] || person.start;
      const scale=Number(sheetTokenTransforms[person.id]?.scale)||.35;
      const y=(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[person.id]?.elevation)||0);
      return bounds.intersectsBox(new THREE.Box3(new THREE.Vector3(x-scale*.32,y+.002,z-scale*.32),new THREE.Vector3(x+scale*.32,y+scale*1.86,z+scale*.32)));
    })) {setNotice('A passagem está ocupada. Afaste o personagem antes de fechar a porta.');return;}
    const optimistic={open:identify ? false : !Boolean(previous?.open),interactive:true,revision:Date.now()};
    const update=patch=>{
      if(campaign?.id) setCampaign(current=>current ? {...current,mapas3D:(current.mapas3D || []).map(map=>map.id===activeMapId ? {...map,doorStates:mergeDoorStates(map.doorStates,patch)} : map)} : current);
      else setLocalDoorStates(current=>mergeDoorStates(current,patch));
    };
    pendingDoors.current.add(key);
    update({[id]:optimistic});
    try {
      if(campaign?.id) update(await salvarPorta3DCampanha(campaign.id,activeMapId,id,optimistic.open));
      setNotice(identify ? 'Porta identificada. Desative Marcar portas e clique nela para abrir.' : optimistic.open ? 'Porta aberta. Clique na porta para fechar.' : 'Porta fechada. Clique na porta para abrir.');
    } catch(error) {
      const rollback=states=>states[id]?.revision===optimistic.revision ? {...states,[id]:previous || {open:false,revision:Date.now()}} : states;
      if(campaign?.id) setCampaign(current=>current ? {...current,mapas3D:(current.mapas3D || []).map(map=>map.id===activeMapId ? {...map,doorStates:rollback(map.doorStates || {})} : map)} : current);
      else setLocalDoorStates(rollback);
      setNotice(`Não foi possível sincronizar a porta: ${error.message || 'falha ao salvar'}.`);
    } finally {pendingDoors.current.delete(key);}
  };
  const tabletopPeople=useMemo(() => {
    const entries=new Map(campaignCharacters(campaign,[...espiralCharacters,...darknessCharacters]).map(character => [character.id,character]));
    (campaign?.tokens || []).filter(token => String(token.ficha_id).startsWith("inimigo:") && !token.removido && (mestre || !token.oculto)).forEach(token => {
      const state=obterEstadoToken3D(token,activeMapId);
      entries.set(token.ficha_id,{id:token.ficha_id,sheet:{name:token.nome || "NPC",occupation:"NPC",profileImage:token.imagem_url,tabletopTokenImage:state?.image || token.imagem_url}});
    });
    return [...entries.values()].map((character,index) => {
      const sheet=character.sheet || {};
      const shared=campaign?.tokens?.find(token=>token.ficha_id===character.id || `darkness:${token.ficha_id}`===character.id);
      const appearance=tokenAppearance(sheet,obterEstadoToken3D(shared,activeMapId) || {});
      const isDarkness=character.id.startsWith("darkness:");
      return {
        id:character.id,
        name:sheet.name || sheet.nome || "Personagem",
        role:sheet.occupation || sheet.vertente || sheet.classe || (isDarkness ? "DARKNESS" : "ESPIRAL"),
        color:sheet.temaFicha?.primaria || "#817184",
        ...appearance,
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
  const playerCameraMinimum=minimumPlayerDistance(1.86*(Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.scale)||0.35)*(Number(tabletopPeople[playerCharacterIndex]?.avatar3D?.height)||1));
  const effectivePlayerDistance=normalizePlayerDistance(playerCameraDistance,playerCameraMinimum);
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
      if(olderTokenState(state,{revision:latestTokenRevisions.current.get(key)})) continue;
      const revision=JSON.stringify(state);
      if(receivedTokenRevisions.current.get(key)===revision) continue;
      receivedTokenRevisions.current.set(key,revision);
      latestTokenRevisions.current.set(key,Number(state.revision)||0);
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
      try {localStorage.setItem(sheetTokenStorageKey,JSON.stringify(tokenTransformCache(next)));} catch {}
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
      if(loadedCampaign.clima3D.cameraMotion) setCameraMotion(normalizeCameraMotion(loadedCampaign.clima3D.cameraMotion));
      const visualWeather={...loadedCampaign.clima3D};
      delete visualWeather.camera;
      delete visualWeather.cameraMotion;
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
    if(event?.table==='mapas3d_portas') {
      setCampaign(current=>current ? {...current,mapas3D:(current.mapas3D || []).map(map=>map.id===event.mapId ? {...map,doorStates:mergeDoorStates(map.doorStates,event.doorStates)} : map)} : current);
      return;
    }
    if(event?.table==="tokens_mapa" && event.eventType==="DELETE") {
      const removed=campaignRef.current?.tokens?.find(token => token.id===event.old?.id);
      if(removed?.ficha_id?.startsWith("custom3d:")) setCustomTokens(current => current.filter(token => token.id!==removed.ficha_id.slice("custom3d:".length)));
      setCampaign(current => current ? {...current,tokens:(current.tokens || []).filter(token => token.id!==event.old?.id)} : current);
      return;
    }
    if(event?.table==="tokens_mapa" && event.new?.id) {
      setCampaign(current => current ? {...current,tokens:[...(current.tokens || []).filter(token => token.id!==event.new.id),event.partial ? mergeTokenUpdate(current.tokens?.find(token=>token.id===event.new.id),event.new) : event.new]} : current);
      return;
    }
    const current=campaignRef.current;
    const row=event?.table === "campanhas" ? event.new : null;
    const demoState=event?.detail?.estado || null;
    if(row || demoState) setCampaign(previous=>previous ? {...previous,turnoCombate:row ? row.turno_combate || null : demoState.turnoCombate || null,combateAtivo:row?Boolean(row.combate_ativo):Boolean(demoState.combateAtivo),investigacaoAtiva:row?Boolean(row.investigacao_ativa):Boolean(demoState.investigacaoAtiva)}:previous);
    if (row?.mecanicas_especiais || demoState?.mecanicasEspeciais) setCampaign(previous => previous ? { ...previous, mecanicasEspeciais: row?.mecanicas_especiais || demoState.mecanicasEspeciais } : previous);
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
    if(realtimeState?.maps) setCampaign(previous=>{
      if(!previous) return previous;
      let changed=false;
      const maps=(previous.mapas3D || []).map(map=>{
        const incoming=realtimeState.maps.find(item=>item.id===map.id)?.doorStates;
        if(!incoming) return map;
        const next=mergeDoorStates(map.doorStates,incoming);
        if(JSON.stringify(next)===JSON.stringify(map.doorStates || {})) return map;
        changed=true;return {...map,doorStates:next};
      });
      return changed ? {...previous,mapas3D:maps} : previous;
    });
    const sameMapStructure=realtimeState && current
      && realtimeState.mode===current.modo
      && String(realtimeState.sceneId || "") === String(current.cenaAtiva?.id || "")
      && String(realtimeState.mediaId || "") === String(current.midiaAtivaId || "")
      && mapRevision(realtimeState.maps) === mapRevision(current.mapas3D);
    if(sameMapStructure && realtimeState.climate) {
      const nextClimate=realtimeState.climate;
      setSyncedMasterCamera(nextClimate.camera || null);
      if(!mestre) setCameraMotion(previous=>{const next=normalizeCameraMotion(nextClimate.cameraMotion);return JSON.stringify(previous)===JSON.stringify(next) ? previous : next;});
      const visualWeather={...nextClimate};
      delete visualWeather.camera;
      delete visualWeather.cameraMotion;
      setWeather(previous => {
        const next={...previous,...visualWeather};
        return sameVisualWeather(previous,next) ? previous : next;
      });
      return;
    }
    refreshCampaign();
  },[refreshCampaign,mestre]);
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
    salvarClima3DCampanha(campaign.id,{...weatherRef.current,camera:pose,cameraMotion:cameraMotionRef.current}).catch(() => {
      setNotice("A câmera continua local, mas a transmissão para os jogadores foi interrompida.");
    });
  },[campaign?.id,mestre]);
  useEffect(() => {
    if(!campaign?.id) return undefined;
    return ouvirCampanha(campaign.id, handleCampaignChange);
  },[campaign?.id,handleCampaignChange]);
  useEffect(()=>{
    if(!mestre || !campaign?.id) return;
    const timer=setTimeout(()=>{
      salvarClima3DCampanha(campaign.id,{
        ...weatherRef.current,cameraMotion:cameraMotionRef.current,
        ...(masterCameraPoseRef.current ? {camera:masterCameraPoseRef.current} : {}),
      }).catch(()=>setNotice("Não foi possível sincronizar o balanço da câmera."));
    },300);
    return ()=>clearTimeout(timer);
  },[mestre,campaign?.id,cameraMotion]);
  const persistWeather = async (next=weather) => {
    const synchronized={...next,cameraMotion:cameraMotionRef.current,...(masterCameraPoseRef.current ? {camera:masterCameraPoseRef.current} : {})};
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
    if (!mestre) return;
    const times={dia:540,sol:720,tarde:1050,noite:1320};
    const currentClock=weatherRef.current.clock;
    const next={...WEATHER_PRESETS[presetId],clock:currentClock ? changeSessionClock(currentClock,times[presetId]!==undefined ? {minutes:times[presetId]} : {}) : undefined};
    setWeather(next);
    persistWeather(next);
  };
  const customizeWeather = (patch) => setWeather(current => ({...current,...patch,preset:"custom",label:"Personalizado"}));
  const changeClock = (patch) => {
    if (!mestre) return;
    const base=weatherRef.current;
    const clock=changeSessionClock(base.clock || {...normalizeSessionClock(),minutes:540},patch);
    const next={...base,clock};
    weatherRef.current=next;
    setWeather(next); setClockNow(Date.now());
    persistWeather(next);
  };
  useEffect(() => {
    if (!mestre || !weather.clock?.enabled || !weather.clock?.running) return undefined;
    const timer=window.setInterval(() => {
      const current=weatherRef.current;
      const next={...current,clock:changeSessionClock(current.clock,{})};
      weatherRef.current=next;
      setWeather(next);
      const synchronized={...next,cameraMotion:cameraMotionRef.current,...(masterCameraPoseRef.current ? {camera:masterCameraPoseRef.current} : {})};
      try { localStorage.setItem(weatherStorageKey,JSON.stringify(synchronized)); } catch {}
      if (campaign?.id) salvarClima3DCampanha(campaign.id,synchronized).catch(() => setNotice('O tempo continua localmente; não foi possível sincronizar o relógio.'));
    },10000);
    return () => window.clearInterval(timer);
  },[mestre,campaign?.id,weather.clock?.enabled,weather.clock?.running,weatherStorageKey]);
  const saveExploration=async(config)=>{
    if(!mestre || !campaign?.id || !activeMapId)throw new Error("Abra um mapa salvo da campanha para configurar a exploração.");
    const maps=campaign.mapas3D.map(map=>map.id===activeMapId?{...map,exploration:config,atualizadoEm:new Date().toISOString()}:map);
    await salvarMapas3DCampanha(campaign.id,maps);
    setCampaign(current=>({...current,mapas3D:maps}));
    setNotice("Exploração e áudio salvos neste mapa.");
  };
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
  useTabletopTokenSync(campaignCode,Boolean(campaign?.id),tokens=>{
    setCampaign(current=>current && JSON.stringify(current.tokens)!==JSON.stringify(tokens) ? {...current,tokens} : current);
  });
  const publishCustomToken=async(token) => {
    if(!mestre || !campaign?.id) return;
    try{
      const saved=await salvarTokenCustom3D(campaign.id,activeMapId,sharedCustomToken(token),tokenSyncOrigin.current);
      if(saved)setCampaign(current=>current ? {...current,tokens:[...(current.tokens || []).filter(item=>item.id!==saved.id),saved]} : current);
      if(token.uvOnly)setNotice('Pista UV compartilhada com os jogadores. Ela será revelada quando iluminada por UV.');
    }catch(error){setNotice(`Não foi possível compartilhar ${token.name || 'o token'}: ${error.message || 'falha na sincronização'}. Use Sincronizar pistas no painel da lanterna.`);}

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
    if(!mestre)patch=playerFlashlightPatch(sheetTokenTransforms[personId] || {},patch);
    patch={...patch,origin:tokenSyncOrigin.current,revision:Date.now()};
    const sharedToken=campaign?.tokens?.find(token => (token.ficha_id===personId || `darkness:${token.ficha_id}`===personId));
    if(sharedToken) {
      latestTokenRevisions.current.set(`${activeMapId}:${sharedToken.id}`,patch.revision);
      salvarEstadoToken3D(sharedToken.id,activeMapId,patch).then(()=>setNotice(current=>current.startsWith('Não foi possível sincronizar o token') ? 'Token sincronizado com a campanha.' : current)).catch(error => setNotice(`Não foi possível sincronizar o token: ${error.message || error.code || 'falha ao salvar'}.`));
    }
    setSheetTokenTransforms(current => {
      const next={...current,[personId]:{...(current[personId] || {}),...patch}};
      try { localStorage.setItem(sheetTokenStorageKey,JSON.stringify(tokenTransformCache(next))); }
      catch { if(!sharedToken) setNotice("Não foi possível salvar os ajustes deste token."); }
      return next;
    });
  };
  const publishedAppearances=useRef(new Set());
  useEffect(()=>{
    for(const person of tabletopPeople) {
      if(!mestre && person.id!==tabletopPeople[playerCharacterIndex]?.id) continue;
      const token=campaign?.tokens?.find(item=>item.ficha_id===person.id || `darkness:${item.ficha_id}`===person.id);
      if(!token) continue;
      const state=obterEstadoToken3D(token,activeMapId) || {};
      const patch=missingTokenAppearance(person,state,Number(sheetTokenTransforms[person.id]?.scale)||0.35);
      if(!Object.keys(patch).length) continue;
      const key=`${activeMapId}:${token.id}:${Object.keys(patch).join(',')}`;
      if(publishedAppearances.current.has(key)) continue;
      publishedAppearances.current.add(key);
      // Upload appearance separately: a media failure cannot block movement.
      externalizarImagens(patch).then(prepared=>salvarEstadoToken3D(token.id,activeMapId,{...prepared,origin:tokenSyncOrigin.current,revision:Date.now()})).catch(error=>setNotice(`Não foi possível compartilhar a aparência de ${person.name}: ${error.message || 'falha de mídia'}.`));
    }
  },[tabletopPeople,playerCharacterIndex,mestre,campaign?.tokens,activeMapId,sheetTokenTransforms]);
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
  const finishTokenInteraction = (tokenId, position, moved, elevation) => {
    const height=elevation===undefined ? {} : {elevation};
    const [x,z]=limitarPosicaoToken(position);
    const sharedCustom=customTokens.find(token => token.id===tokenId);
    if(sharedCustom) publishCustomToken({...sharedCustom,x,z,...height});
    setDraggingToken(false);
    setCustomTokens(tokens => {
      const next=tokens.map(token => token.id === tokenId ? { ...token,x,z,...height } : token);
      try { localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY,JSON.stringify(next)); } catch { setNotice("Não foi possível salvar a nova posição do token."); }
      return next;
    });
    if (moved) {
      setNotice("Token reposicionado.");
    } else {
      setNotice("Token selecionado. Clique com o botão direito para ações.");
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
    if (panel === 'mechanics') { setMechanicsOpen(value => !value); setHudPanel(null); setSessionOpen(false); return; }
    if(!mestre && ["scene","scenes","audio","soundpad"].includes(panel)) return;
    if(["audio","evidence","initiative","session","soundpad","participants","npcs","scenes","combat","investigation","dashboard","shop"].includes(panel) || (panel==="notes" && mestre)) {
      setSessionTool(panel);setSessionRequest(value => value+1);setSessionOpen(current => sessionTool===panel ? !current : true);setHudPanel(null);setTokenPanelOpen(false);return;
    }
    setSessionOpen(false);
    setHudPanel(current => current === panel ? null : panel);
    setTokenPanelOpen(false);
  };
  const rollingPerson=tabletopPeople[mestre ? selected : playerCharacterIndex];
  const combatDifficulty=Boolean(campaign?.combateAtivo || (rollingPerson && sheetTokenTransforms[rollingPerson.id]?.combat));
  const activeDifficulty=activeSceneDifficulty(campaign?.cenaAtiva,campaign?.inimigos || [],combatDifficulty);
  const addShieldEnemy=async(record) => {
    const saved=await vincularInimigo(campaign.id,record);
    if(saved) setCampaign(current=>({...current,inimigos:[...(current.inimigos || []),saved]}));
  };
  const removeShieldEnemy=async(record)=>{
    if(!mestre || !campaign?.id) return;
    if(!await confirmarDialogo('Remover '+(record.nome || 'este participante')+' desta mesa?',{titulo:'Remover da mesa',confirmarTexto:'Remover',perigo:true}))return;
    await desvincularInimigo(campaign.id,record.id);
    await refreshCampaign();
  };
  const updateShieldEnemy=async(record) => {
    const saved=await atualizarInimigoCampanha(campaign.id,record);
    setCampaign(current=>({...current,inimigos:(current.inimigos || []).map(item=>item.id===saved.id ? saved:item)}));
    return saved;
  };
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
  const switchScene = async (scene,mapLink=null,imageLink=null,special=false) => {
    if(!mestre || !campaign?.id || switchingScene) return false;
    try {
      setSwitchingScene(true);
      const mode=special ? "especial" : mapLink ? "mapa" : "cena";
      const mediaId=mapLink?.id || imageLink?.id || null;
      await ativarCena(campaign.id,scene.id,mode,mediaId);
      applyCampaign({...campaign,cenaAtiva:scene,modo:mode,midiaAtivaId:mediaId});
      setPositions(tabletopPeople.map((person) => [...person.start]));
      setNotice(mapLink ? `${scene.nome} · ${mapLink.nome} apresentado para a mesa.` : `${scene.nome} apresentada sem mapa 3D.`);
      return true;
    } catch(error) {
      setNotice(error.message || "Não foi possível trocar a cena.");
      return false;
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
    lanterna:tokenFlashlight(selectedSheetTransform),
    rotacao:Number(selectedSheetTransform?.rotacao)||0,
    olharCamera:selectedSheetTransform?.olharCamera!==false,animation:selectedSheetPerson?.animation ? {...selectedSheetPerson.animation,enabled:selectedSheetTransform?.animationEnabled ?? selectedSheetPerson.animation.enabled} : selectedSheetTransform?.animation,
    fromSheet:true,
  } : null);
  const updateEditableToken = (patch) => selectedTokenData
    ? updateSelectedToken(patch)
    : updateSheetToken(selectedSheetPerson?.id,patch);
  const lastPlayerMoveSave=useRef(0);
  const playerMoveSaveTimer=useRef(null);
  useEffect(() => () => clearTimeout(playerMoveSaveTimer.current),[activeMapId]);
  const playerCollisionController=useRef(null);
  const movePlayerToken=(destination,resolvedElevation) => {
    if(mestre || playerCharacterIndex<0) return;
    const person=tabletopPeople[playerCharacterIndex];
    const resolved=resolvedElevation===undefined ? playerCollisionController.current?.(destination) : null;
    const next=limitarPosicaoToken(resolved?.position || destination);
    const elevation=resolvedElevation ?? (resolved ? resolved.elevation-(Number(activeSpawnPoints.tokens?.y)||0) : Number(sheetTokenTransforms[person.id]?.elevation)||0);
    setPositions(previous => previous.map((position,index) => index===playerCharacterIndex ? next : position));
    setSheetTokenTransforms(current => Math.abs((Number(current[person.id]?.elevation)||0)-elevation)<0.00001 ? current : ({...current,[person.id]:{...(current[person.id] || {}),elevation}}));
    clearTimeout(playerMoveSaveTimer.current);
    playerMoveSaveTimer.current=setTimeout(() => updateSheetToken(person.id,{x:next[0],z:next[1],elevation}),180);
    if(Date.now()-lastPlayerMoveSave.current>=150) {
      lastPlayerMoveSave.current=Date.now();
      updateSheetToken(person.id,{x:next[0],z:next[1],elevation});
    }
  };
  const embeddedEspiralId=mestre ? (selectedSheetPerson?.id?.startsWith("espiral:") ? selectedSheetPerson.id.slice("espiral:".length) : null) : routeParams.get("sistema")==="espiral" ? playerSheetId || "principal" : null;
  function prepareUVClue(text){
    if(!mestre)return;
    try {
      setPendingToken({id:`uv-${Date.now()}`,name:text,image:uvTextImage(text),uvOnly:true,uvText:text,x:0,z:0,elevation:0,scale:2,color:'#b78aff'});
      setHudPanel(null);setTokenPanelOpen(false);setTacticalMode(false);
      setNotice('Pista UV pronta. Clique no piso para posicioná-la. Depois ajuste a altura para colocá-la em uma parede.');
    }catch(error){setNotice(error.message);}
  }
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
  const flashlightCandidates=mestre ? [...tabletopPeople.map(person => ({id:person.id,name:person.name,lanterna:tokenFlashlight(sheetTokenTransforms[person.id])})),...customTokens.map(token => ({...token,custom:true}))] : playerCharacterIndex>=0 ? [{...tabletopPeople[playerCharacterIndex],lanterna:tokenFlashlight(sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id])}] : [];
  const flashlightPerson=flashlightCandidates.find(person => person.id===flashlightTarget) || flashlightCandidates[0];
  const changeFlashlight=lanterna => {
    if(!flashlightPerson) return;
    if(!mestre && flashlightPerson.id!==tabletopPeople[playerCharacterIndex]?.id) return;
    if(flashlightPerson.custom) saveCustomTokens(customTokens.map(token => token.id===flashlightPerson.id ? {...token,lanterna} : token));
    else updateSheetToken(flashlightPerson.id,{lanterna});
  };
  const cameraFlashlightId=mestre ? (view==="firstPerson" ? masterFocusId : hudPanel==="flashlight" ? flashlightPerson?.id : tokenMode ? selectedToken : tabletopPeople[selected]?.id) : tabletopPeople[playerCharacterIndex]?.id;
  const tacticalTokens=[...tabletopPeople.map((person,index) => ({id:person.id,name:person.name,image:person.portrait || "",animation:person.portraitAnimation,color:person.color,rotacao:sheetTokenTransforms[person.id]?.rotacao,lanterna:tokenFlashlight(sheetTokenTransforms[person.id]),x:(positions[index] || person.start)[0],z:(positions[index] || person.start)[1],elevation:(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[person.id]?.elevation)||0),personIndex:index,selected:!tokenMode && selected===index})).filter(token=>visiblePerson(token.id)),...customTokens.filter(token=>visibleCustom(token) && (mestre || !token.uvOnly)).map(token => ({...token,selected:tokenMode && selectedToken===token.id}))];
  const mobilePlayer=mobile && !mestre;
  const sceneHeader=(<><header className="tt3-cinema-header">
        <div className="tt3-scene-identity">
          <a href={returnUrl} className="tt3-back" aria-label={mestre ? "Voltar ao dashboard" : "Voltar para a ficha"}>←</a>
          <div><span>{activeMapName ? `CENA ${activeSceneLabel} · ${activeMapName}` : `CENA ${activeSceneLabel} · SEM MAPA 3D`}</span><h1>{activeSceneName}</h1></div>
        </div>
        <PlayerViewSettings master={mestre || mobilePlayer}>
          {mestre && <><button type="button" className="tt3-master-launch" aria-pressed={hudPanel==="shield" && !shieldCollapsed} onClick={()=>{setShieldCollapsed(false);if(hudPanel!=="shield")toggleHudPanel("shield");}}><span aria-hidden="true">◈</span> Escudo do mestre <small>Central da sessão</small></button><details className="tt3-master-options"><summary>Ajustes da mesa</summary><div>          {mestre && <a className="tt3-role" href={`/?${new URLSearchParams({criarMapa3d:"1",campanha:campaignCode,...(activeMapId ? {mapa3d:activeMapId} : {})})}`}>Editar mapa</a>}
          {mestre && activeMapName && !staticScene && !tacticalMode && <button className="tt3-role" aria-pressed={identifyDoors} onClick={()=>{setIdentifyDoors(value=>!value);setNotice(identifyDoors ? 'Clique em uma porta para abrir ou fechar.' : 'Clique somente na folha da porta para identificá-la. O objeto deve estar separado das paredes no modelo.');}}>{identifyDoors ? 'Concluir portas' : 'Marcar portas'}</button>}


          {mestre && campaign && <a className="tt3-role" href={cutsceneEditorUrl(campaign,campaign.cenaAtiva?.id,'3d')}>Editor de cutscenes ↗</a>}
          {mestre && <CameraMotionControls value={cameraMotion} onChange={setCameraMotion}/>}          {mestre && <div className="tt3-speed-indicator" title="Ctrl + scroll para ajustar a velocidade da câmera"><span>Velocidade</span><output aria-label="Velocidade da câmera" aria-live="polite">{cameraSpeed.toLocaleString('pt-BR',{maximumFractionDigits:2})}×</output><small>Ctrl + scroll</small></div>}</div></details></>}
          {!mestre && !tacticalMode && !staticScene && view!=="firstPerson" && <PlayerCameraDistance minimum={playerCameraMinimum} value={effectivePlayerDistance} onChange={setPlayerCameraDistance}/>}
          {!mestre && <><details className="tt3-token-speed"><summary>Velocidade <span>{tokenSpeed.toLocaleString('pt-BR')}×</span></summary><div><label>Velocidade do token<input aria-label="Velocidade do token" type="range" min="0.25" max="5" step="0.25" value={tokenSpeed} onChange={event=>setTokenSpeed(normalizeCameraSpeed(event.target.value))}/></label><small>Ctrl + roda sobre o mapa</small><button type="button" onClick={()=>setTokenSpeed(1)}>Restaurar 1×</button></div></details><span className="tt3-shared-motion" title="Balanço da câmera controlado pelo mestre">Balanço {Math.round(cameraMotion.intensity*100)}% · Mestre</span></>}
          {!mestre && <details className="tt3-token-speed"><summary>Conforto</summary><div><label>Balanço local<select aria-label="Reduzir balanço local" value={motionReduction} onChange={e=>setMotionReduction(Number(e.target.value))}><option value="1">Definido pelo mestre</option><option value="0.5">Reduzir pela metade</option><option value="0">Desligar neste navegador</option></select></label></div></details>}
          {(exploration.audioZones || []).length>0 && <button type="button" className="tt3-spatial-toggle" aria-pressed={Boolean(spatialContext)} onClick={async()=>{
            if(spatialContext){setSpatialContext(null);return;}
            const AudioContext=window.AudioContext || window.webkitAudioContext;
            if(!AudioContext){setNotice("Este navegador não suporta áudio espacial.");return;}
            const context=new AudioContext();
            try{await context.resume();setSpatialContext(context);}catch{context.close();setNotice("Não foi possível ativar o áudio.");}
          }}>{spatialContext?"Desligar som ambiente":"Ativar som ambiente"}</button>}
          <span className="tt3-role">{mestre ? "Visão do mestre" : "Visão do jogador"}</span>{!mestre && playerCharacterIndex>=0 && <CombatPostureButton active={Boolean(sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id]?.combat)} animation={tabletopPeople[playerCharacterIndex].animation || sheetTokenTransforms[tabletopPeople[playerCharacterIndex].id]?.animation} onChange={combat => updateSheetToken(tabletopPeople[playerCharacterIndex].id,{combat})} onNotice={setNotice}/>}
          {!mobilePlayer && <button type="button" onClick={() => setHudHidden(true)} title="Ocultar interface (H)">Modo cinema</button>}
        </PlayerViewSettings>
      </header></>);
  const commandMenu=(<><nav className="tt3-command-rail" aria-label={mestre ? "Ferramentas do mestre" : "Ferramentas do jogador"}>
        {(mestre ? [
          ["shield","Escudo do mestre",""],
        ] : [
          ["sheet","Ficha",""],
          ["mechanics","Mecânicas especiais",""],
          ["flashlight","Lanterna",""],
          ["dice","Dados","D20"],
          ["evidence","Pistas",""],
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
      </nav></>);
  const normalFlashlight=(<>{!mestre && !staticScene && <button type="button" className="tt3-player-flashlight" aria-label={flashlightModeActive(flashlightPerson?.lanterna,'normal') ? "Apagar lanterna" : "Acender lanterna"} aria-pressed={Boolean(flashlightModeActive(flashlightPerson?.lanterna,'normal'))} title={flashlightModeActive(flashlightPerson?.lanterna,'normal') ? "Lanterna acesa · clique para apagar" : "Lanterna apagada · clique para acender"} disabled={!flashlightPerson} onClick={() => changeFlashlight(toggleFlashlightMode(normalizarLanterna(flashlightPerson?.lanterna),'normal'))}>
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g transform="rotate(-35 16 16)"><path d="M12 13h8v14h-8zM10 6h12v5l-2 2h-8l-2-2z"/><path d="M10 6h12M14 18h4"/>{flashlightModeActive(flashlightPerson?.lanterna,'normal') && <path d="M16 1v2M9 1l2 2M23 1l-2 2"/>}</g>{!flashlightModeActive(flashlightPerson?.lanterna,'normal') && <path d="M5 27L27 5"/>}</svg>
      </button>}
</>);
  const cameraModes=(<><div className="tt3-camera-dock" aria-label="Modos de câmera">
        <button type="button" title="Trocar ombro · V" aria-label="Trocar ombro da câmera" onClick={()=>setShoulderSide(value=>-value)}>Ombro {shoulderSide===1 ? "direito" : "esquerdo"} · V</button>
        {[['room','Cena'],['cinema','Cinema'],['panorama','Panorâmica'],['detail','Detalhe'],['firstPerson','Primeira pessoa']].map(([id,label]) => <button type="button" key={id} disabled={id==="firstPerson" && (mestre ? !tabletopPeople.length : playerCharacterIndex<0)} aria-pressed={!tacticalMode && view===id} onClick={() => {if(mestre)setMasterFocusId(id==="firstPerson" ? (tabletopPeople[selected] || tabletopPeople[0])?.id : null);setTacticalMode(false);setView(id);}}>{label}</button>)}
        <button type="button" disabled={Boolean(staticScene)} aria-pressed={tacticalMode} onClick={() => setTacticalMode(value => !value)}>Mapa tático 2D</button>
      </div></>);
  const uvFlashlight=(<>{!mestre && !staticScene && <button type="button" className="tt3-player-flashlight tt3-player-uv" aria-label="Lanterna UV" title={sheetTokenTransforms[flashlightPerson?.id]?.uvPermitida===false ? 'Modo UV bloqueado pelo mestre' : 'Ligar ou apagar lanterna UV'} disabled={!flashlightPerson || sheetTokenTransforms[flashlightPerson?.id]?.uvPermitida===false} aria-pressed={Boolean(flashlightPerson?.lanterna?.ativa && flashlightPerson?.lanterna?.modo==='uv')} onClick={()=>changeFlashlight(toggleFlashlightMode(normalizarLanterna(flashlightPerson?.lanterna),'uv'))}> <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g transform="rotate(-35 16 16)"><path d="M12 13h8v14h-8zM10 6h12v5l-2 2h-8l-2-2z"/><path d="M10 6h12M14 18h4"/>{(flashlightPerson?.lanterna?.ativa && flashlightPerson?.lanterna?.modo==='uv') && <path d="M16 1v2M9 1l2 2M23 1l-2 2"/>}</g>{!(flashlightPerson?.lanterna?.ativa && flashlightPerson?.lanterna?.modo==='uv') && <path d="M5 27L27 5"/>}</svg></button>}
</>);
  const renderWeatherRanges = fields => fields.map(([field,label,min,max,step]) => <label className="tt3-weather-range" key={field}><span>{label}<b>{Number(weather[field]).toFixed(step<.1 ? 2 : 1)}</b></span><input type="range" min={min} max={max} step={step} value={weather[field]} onChange={event => customizeWeather({[field]:Number(event.target.value)})} onPointerUp={() => persistWeather()} onKeyUp={() => persistWeather()}/></label>);
  const renderShieldWeather = () => (<div className="tt3-drawer-content tt3-weather-panel">
    <section className="tt3-weather-column"><header><span>01 / ATMOSFERA</span><h3>Horário e ambiente</h3></header>
      <SessionClockControls clock={weather.clock} minutes={clockMinutes} mestre={mestre} onChange={changeClock}/>
      <p>Escolha uma atmosfera pronta para a cena.</p>
          <div className="tt3-weather-presets">{Object.entries(WEATHER_PRESETS).map(([id,preset]) => <button type="button" key={id} aria-pressed={weather.preset===id} onClick={() => applyWeatherPreset(id)}>{preset.label}</button>)}</div>

    </section>
    <section className="tt3-weather-column"><header><span>02 / ILUMINAÇÃO</span><h3>Cores e luz</h3></header>
          <div className="tt3-weather-colors">
            <label><span>Céu</span><input type="color" value={weather.skyColor} onChange={event => customizeWeather({skyColor:event.target.value})} onBlur={() => persistWeather()}/></label>
            <label><span>Neblina</span><input type="color" value={weather.fogColor} onChange={event => customizeWeather({fogColor:event.target.value})} onBlur={() => persistWeather()}/></label>
            <label><span>Luz</span><input type="color" value={weather.sunColor} onChange={event => customizeWeather({sunColor:event.target.value})} onBlur={() => persistWeather()}/></label>
          </div>

      {renderWeatherRanges([["ambient","Luz ambiente",0,1.5,.01],["sun","Força do sol",0,3,.01],["sunSize","Tamanho do sol",.3,2.5,.01]])}
    </section>
    <section className="tt3-weather-column"><header><span>03 / CONDIÇÕES</span><h3>Tempo e visibilidade</h3></header>
      {renderWeatherRanges([["rain","Chuva",0,1,.01],["snow","Neve",0,1,.01],["wind","Vento",-1,1,.01],["fogNear","Início da névoa",1,30,.1],["fogFar","Alcance visual",8,100,.5]])}
    </section>
    <footer className="tt3-weather-footer"><button type="button" className="tt3-primary" disabled={savingWeather} onClick={() => persistWeather()}>{savingWeather ? "Sincronizando…" : "Aplicar clima improvisado"}</button></footer>
  </div>);
  const renderShieldFlashlight = () => (<div className="tt3-drawer-content tt3-flashlight-panel"><div className="tt3-light-intro"><span>ILUMINAÇÃO</span><h3>Lanterna</h3><p>Controle a luz de cada personagem no cenário.</p></div>{mestre && <label className="tt3-light-target">Personagem ou NPC<select aria-label="Token da lanterna" value={flashlightPerson?.id || ""} onChange={event => setFlashlightTarget(event.target.value)}>{flashlightCandidates.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}{flashlightPerson ? <FlashlightControls uvAllowed={sheetTokenTransforms[flashlightPerson.id]?.uvPermitida!==false} value={flashlightPerson.lanterna} onChange={changeFlashlight}/> : <p>Nenhum token disponível no mapa.</p>}{mestre && <PlayerUVControls players={tabletopPeople.filter(person=>!person.id.startsWith("inimigo:")).map(person=>({id:person.id,name:person.name,state:sheetTokenTransforms[person.id]}))} onChange={updateSheetToken}/>} {mestre && <UVClueControls onSync={()=>customTokens.filter(token=>token.uvOnly).forEach(publishCustomToken)} clues={customTokens.filter(token=>token.uvOnly)} onCreate={prepareUVClue} onEdit={id=>{setSelectedToken(id);setTokenMode(true);setTokenPanelOpen(true);setHudPanel(null);}} onRemove={id=>saveCustomTokens(customTokens.filter(token=>token.id!==id))}/>}</div>);
  const renderNativeScene = () => (<div className="tt3-drawer-content"><p className="tt3-kicker">Cena ativa</p><h3>{activeSceneName}</h3><p>{activeMapName ? `Mapa: ${activeMapName}` : "Esta cena ainda não possui um mapa 3D vinculado."}</p><div className="tt3-scene-stats"><span><strong>{tabletopPeople.length + customTokens.length}</strong> participantes</span><span><strong>{mapAssets.length}</strong> assets</span><span><strong>{weather.preset === "noite" ? "Noite" : "Dia"}</strong> luz</span></div><div className="tt3-scene-browser">{(campaign?.cenas || []).map((scene,index) => {const maps=sceneMaps(scene);const active=scene.id===campaign?.cenaAtiva?.id;return <article key={scene.id} className={active ? "active" : ""}><button type="button" className="tt3-scene-choice" disabled={!mestre || switchingScene} onClick={() => switchScene(scene,(scene.imagensCena || []).length ? null : maps[0]?.link || null,(scene.imagensCena || [])[0] || null)}><small>CENA {String(index+1).padStart(2,"0")}</small><strong>{scene.nome}</strong><span>{maps.length ? `${maps.length} mapa(s) 3D` : "Sem mapa 3D"}</span></button>{scene.cenaEspecial?.ativo && scene.cenaEspecial.midiaUrl && <button type="button" disabled={!mestre || switchingScene} onClick={()=>switchScene(scene,null,null,true)}>Apresentar cena especial</button>}{maps.length>0 && <div>{maps.map(({link,map}) => <button type="button" key={link.id} className={active && map.id===activeMapId ? "active" : ""} disabled={!mestre || switchingScene} onClick={() => switchScene(scene,link)}>{map.nome}</button>)}</div>}{(scene.imagensCena || []).length>0 && <div>{scene.imagensCena.map(image => <button type="button" key={image.id} className={active && staticScene?.id===image.id ? "active" : ""} disabled={!mestre || switchingScene} onClick={() => switchScene(scene,null,image)}>{image.nome || "Cena estática"}</button>)}</div>}</article>;})}{!(campaign?.cenas || []).length && <p>Nenhuma cena cadastrada nesta campanha.</p>}</div>{!mestre && <small className="tt3-scene-sync-note">A troca de cena é controlada pelo mestre e sincronizada automaticamente.</small>}<button type="button" className="tt3-primary" onClick={() => {setPositions(tabletopPeople.map(person => [...person.start]));setNotice("Personagens nas posições iniciais.");}}>Reiniciar posições</button></div>);
  const renderNativeBackground = () => (<div className="tt3-drawer-content tt3-background-panel">
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
        </div>);
  const renderNativeDice = () => (<div className="tt3-drawer-content tt3-dice-panel">
          <section className="tt3-quick-rolls"><header><span>ROLAGEM RÁPIDA</span><h3>Escolha um dado</h3></header><div className="tt3-dice-grid">{[20,12,10,8,6,4].map(sides => <button type="button" key={sides} onClick={() => rollDie(sides)}>{routeParams.get("sistema")==="espiral" ? espiralDie(sides) : `d${sides}`}</button>)}</div></section>
          {mestre ? <section className="tt3-dice-history-section" aria-label="Histórico de Dados"><header><span>CAMPANHA</span><h3>Histórico de Dados</h3></header><RollHistory rolls={campaign?.rolagens || []}/></section> : <div className="tt3-roll-history">{diceHistory.length ? diceHistory.map(roll => <span key={roll.id}>{routeParams.get("sistema")==="espiral" ? espiralDie(roll.sides) : `d${roll.sides}`}<strong>{roll.result}</strong></span>) : <small>Nenhuma rolagem ainda.</small>}</div>}
        </div>);
  const renderNativeNotes = () => (<div className="tt3-drawer-content"><p>Anotações privadas desta campanha, salvas neste navegador.</p><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Registre suspeitas, nomes e decisões..."/><small>Salvamento automático.</small></div>);
  const renderNativeTokens = () => (<aside className="tt3-token-panel tt3-token-inspector" aria-label="Importar e ajustar token">
        <header><div><span>PERSONAGEM / AJUSTES NO TABULEIRO</span><strong>{editableTokenData ? editableTokenData.name : "Adicionar token"}</strong></div><button type="button" onClick={() => setTokenPanelOpen(false)} aria-label="Fechar">×</button></header>
        <div className="tt3-token-inspector-body">
        {editableTokenData && <div className="tt3-token-transform">
          <div className="tt3-token-overview">{editableTokenData.image ? <img src={editableTokenData.image} alt={`Token de ${editableTokenData.name || 'personagem'}`}/> : <span aria-hidden="true">◇</span>}<div><strong>{editableTokenData.name || 'Personagem'}</strong><small>{editableTokenData.fromSheet ? 'Vinculado à ficha do personagem' : 'Token personalizado da cena'}</small><p>Ajustes aplicados diretamente no tabuleiro.</p></div></div>
          <label className="tt3-token-name"><span>Nome do personagem</span><input type="text" value={editableTokenData.name || ""} readOnly={editableTokenData.fromSheet} onChange={(event) => updateEditableToken({name:event.target.value})} placeholder="Nome do personagem"/></label>
          {(mestre || (!selectedTokenData && selectedSheetPerson?.id===tabletopPeople[playerCharacterIndex]?.id)) && <details className="tt3-token-section"><summary><span>Lanterna</span><small>{editableTokenData.lanterna?.ativa ? "Ligada" : "Desligada"}</small></summary><FlashlightControls uvAllowed={sheetTokenTransforms[selectedSheetPerson?.id]?.uvPermitida!==false} value={editableTokenData.lanterna} onChange={lanterna => updateEditableToken({lanterna})}/></details>}
          {mestre && selectedTokenData && <label className="tt3-token-check"><input type="checkbox" checked={Boolean(editableTokenData.uvOnly)} onChange={event=>updateEditableToken({uvOnly:event.target.checked})}/> Revelar somente com lanterna UV</label>}
          <details className="tt3-token-section" hidden={!mestre}><summary><span>Postura e direção</span><small>Orientação do token</small></summary>{mestre && editableTokenData.fromSheet && <label className="tt3-token-check"><input type="checkbox" checked={Boolean(selectedSheetTransform?.combat)} onChange={event => updateEditableToken({combat:event.target.checked})}/> Postura de combate</label>}{mestre && <div className="tt3-token-rotation">
            <label><span>Rotação do token</span><NumberInput aria-label="Rotação do token" type="number" min="0" max="359" step="5" value={((Number(editableTokenData.rotacao)||0)%360+360)%360} onChange={event => updateEditableToken({rotacao:((Number(event.target.value)||0)%360+360)%360,olharCamera:false})}/></label>
            <section><button type="button" onClick={() => updateEditableToken({rotacao:((Number(editableTokenData.rotacao)||0)+315)%360,olharCamera:false})}>↶ 45°</button><button type="button" onClick={() => updateEditableToken({rotacao:((Number(editableTokenData.rotacao)||0)+45)%360,olharCamera:false})}>↷ 45°</button></section>
            <label><input type="checkbox" checked={editableTokenData.olharCamera!==false} onChange={event => updateEditableToken({olharCamera:event.target.checked})}/> Sempre olhar para a câmera</label>
          </div>}</details>

          <section className="tt3-token-position"><h3>Posição e tamanho</h3><p>Ajuste a altura dos pés e o tamanho do personagem no cenário.</p>
          <div>
            <span>Altura precisa <b>{(Number(editableTokenData.elevation)||0).toFixed(2)} m</b></span>
            <NumberInput
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
          <TokenSizeControls scale={Number(editableTokenData.scale)||0.35} onChange={scale=>updateEditableToken({scale})}/>
          </section>
          {editableTokenData.fromSheet
            ? <button type="button" className="tt3-token-remove" onClick={() => resetSheetToken(editableTokenData.id)}>Restaurar tamanho, altura e posição</button>
            : <button type="button" className="tt3-token-remove" onClick={removeSelectedToken}>Apagar token</button>}
        </div>}
                {mestre && <details className="tt3-token-section"><summary><span>Animações</span><small>Movimento e piscadas</small></summary><section className="tt3-animation-library" aria-label="Animações de tokens"><strong>Animações do mestre</strong><a href="/?mestre=1&amp;aba=animacoes" target="_blank" rel="noreferrer">Abrir Estúdio de Tokens</a>{animationLibrary.length===0 && <small>As animações salvas nas fichas são aplicadas automaticamente aos tokens. Configure-as no Dashboard.</small>}{animationLibrary.filter(entry => !entry.fichaId && entry.tokenType!=="2d").map(entry => <button type="button" key={entry.id} onClick={() => {const animation={...entry.animation,image:entry.image};if(editableTokenData) {updateEditableToken(editableTokenData.fromSheet ? {animation} : {image:entry.image,animation});setNotice(`Animação ${entry.name} aplicada ao token.`);} else {prepareToken(entry.image,entry.name,animation);}}}>{editableTokenData ? 'Aplicar' : 'Adicionar'}: {entry.name}</button>)}{editableTokenData?.animation && <button type="button" onClick={() => updateEditableToken(editableTokenData.fromSheet ? {animationEnabled:editableTokenData.animation.enabled===false} : {animation:{...editableTokenData.animation,enabled:editableTokenData.animation.enabled===false}})}>{editableTokenData.animation.enabled===false ? 'Ativar animação' : 'Desativar animação'}</button>}</section></details>}
        <details className="tt3-token-section tt3-token-image-section" open={!editableTokenData}><summary><span>Imagem do token</span><small>Dispositivo ou link</small></summary><p>Escolha uma imagem PNG/JPG, de preferência com fundo transparente, para colocar no tabuleiro.</p>
        <button type="button" className="tt3-token-upload" onClick={() => tokenFileRef.current?.click()}>Escolher imagem do dispositivo</button>
        <input ref={tokenFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={importTokenFile} hidden/>
        <div className="tt3-token-url"><input value={tokenUrl} onChange={event => setTokenUrl(event.target.value)} placeholder="https://site.com/personagem.png" aria-label="URL da imagem"/><button type="button" onClick={importTokenUrl}>Usar URL</button></div>
        <small>Imagens importadas usam R2 quando configurado. URLs externas continuam no site de origem.</small>
        </details>{mestre && <details className="tt3-token-section tt3-token-advanced"><summary><span>Armazenamento</span><small>Configuração e migração</small></summary><MediaMigrationPanel/></details>}
        </div>
      </aside>);
  return <main className={`tt3 ${mestre ? "tt3-master" : ""} ${mestre && hudPanel==="shield" && !shieldCollapsed ? "tt3-master-working" : ""} ${mobile ? "tt3-mobile" : ""} ${mobilePlayer ? "tt3-mobile-player" : ""} ${mobileMenu ? "tt3-mobile-menu-open" : ""} ${view==="cinema" && !tacticalMode ? "tt3-letterboxed" : ""} ${!mestre && hudPanel==="sheet" && !hudHidden && !staticScene && !tacticalMode ? "tt3-player-sheet-open" : ""} ${hudHidden ? "tt3-hud-hidden" : ""}`}>
    <ContextTransition contextKey={campaign ? `${campaign.cenaAtiva?.id}:${campaign.midiaAtivaId}:${campaign.modo}` : "loading"}/>
    <Suspense fallback={null}><TabletopSessionTools tabletopMapId={activeMapId} open={sessionOpen} tool={sessionTool} requestVersion={sessionRequest} onClose={() => setSessionOpen(false)}/></Suspense>

    <section style={mestre ? {"--master-workspace-height":hudPanel==="shield" && !shieldCollapsed ? shieldHeight+"dvh" : "0px"} : undefined} className={`tt3-stage ${!mestre && !mobile ? 'tt3-player-desktop' : ''}`} aria-label="Sala de investigação tridimensional">
      <div className="tt3-cinema-bars" aria-hidden="true"/>
      {!mestre && <PlayerInitiativeBar campaign={campaign} entries={initiativeOrder(campaign,Object.fromEntries(tabletopPeople.map(person=>[person.id,{nome:person.name,fotoPerfil:person.portrait}])))} variant="3d"/>}
    <StaticSceneCinema activeKey={staticCinemaKey} mestre={mestre} onHudChange={setHudHidden}/>
      <SceneBoundary key={activeMapId}>
        {!staticScene && activePresentation.type!=="special" && !tacticalMode && <Canvas
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
          <Camera overShoulder shoulderSide={shoulderSide} touchNavigation={mobile && !mestre} characterDistance={mestre ? null : effectivePlayerDistance} allowRightLook={mestre} cameraSpeed={mestre ? cameraSpeed : 1}
            view={view}
            interactionLocked={draggingToken || Boolean(staticScene) || tacticalMode || Boolean(examinedClue) || Boolean(quickToken)}
            mode={mestre ? (masterFocusId ? "character" : "free") : playerCameraMode}
            focusRequest={mestre ? masterFocusRequest : 0}
            sheetFocus={(!mobile || landscape) && !mestre && hudPanel==="sheet" && !hudHidden && !staticScene && !tacticalMode && view!=="firstPerson"}
            getSheetBounds={mobile ? () => sheetPanelRef.current?.getBoundingClientRect() : undefined}
            getFollowPose={() => renderedTokenPoses.current.get(tabletopPeople[cameraPersonIndex]?.id)}
            followPosition={cameraFollowPosition}
            followHeight={1.86*(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.scale)||0.35)*(Number(tabletopPeople[cameraPersonIndex]?.avatar3D?.height)||1)}
            followElevation={(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.elevation)||0)}
            syncedPose={syncedMasterCamera}
            onPoseChange={mestre ? publishMasterCamera : undefined}
            spawnPose={activeSpawnPoints.camera}
            spawnKey={activeMapId}
          />
          <CharacterCameraObstruction key={'collision:'+activeMapId} enabled={view!=="firstPerson" && (mestre ? Boolean(masterFocusId) : playerCameraMode==="character")} position={cameraFollowPosition}
            height={1.86*(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.scale)||.35)}
            elevation={(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[tabletopPeople[cameraPersonIndex]?.id]?.elevation)||0)}
            getPose={()=>renderedTokenPoses.current.get(tabletopPeople[cameraPersonIndex]?.id)}/>
          <ContextualInteraction enabled={!mestre && !hudPanel && !tokenPanelOpen && !quickToken && !examinedClue && !hudHidden} position={playerFollowPosition}
            height={1.86*(Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.scale)||.35)}
            elevation={(Number(activeSpawnPoints.tokens?.y)||0)+(Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.elevation)||0)}
            getPose={()=>renderedTokenPoses.current.get(tabletopPeople[playerCharacterIndex]?.id)}
            onHint={setInteractionHint} onDoor={toggleDoor} onClue={setExaminedClue}/>
          <SpatialAudioZones context={spatialContext} zones={exploration.audioZones} onError={setNotice}/>
          <HandheldCameraMotion key={activeMapId} {...localCameraMotion(cameraMotionForViewer(cameraMotion,mestre),mestre?1:motionReduction)}
            walking={!mestre && playerCameraMode==='character' && !staticScene && !tacticalMode && !hudPanel && !tokenPanelOpen && !draggingToken}
            getWalkingPosition={() => renderedTokenPoses.current.get(tabletopPeople[playerCharacterIndex]?.id)?.position || playerFollowPosition}/>
          <PlayerTokenNavigation speed={tokenSpeed} key={activeMapId} collision={!tacticalMode} elevation={Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.elevation)||0} baseElevation={Number(activeSpawnPoints.tokens?.y)||0} scale={sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.scale} collisionController={playerCollisionController} enabled={!tacticalMode && !staticScene && !mestre && playerCharacterIndex>=0 && !hudPanel && !tokenPanelOpen && !draggingToken && !examinedClue && !quickToken} cameraRelative={!tacticalMode} position={playerFollowPosition} onMove={movePlayerToken} onStop={() => {if(playerCharacterIndex>=0 && playerFollowPosition) updateSheetToken(tabletopPeople[playerCharacterIndex].id,{x:playerFollowPosition[0],z:playerFollowPosition[1],elevation:Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.elevation)||0});}}/>
          <WeatherEnvironment weather={renderedWeather}/>
          <PanoramaBackground url={activeBackgroundUrl}/>
          <CustomMapStage onFloor={move} baseElevation={activeSpawnPoints.tokens?.y}/>
          <PlacedAssets identifyDoors={mestre && identifyDoors} doorStates={doorStates} onToggleDoor={toggleDoor} revealUV={mestre} items={visibleAssets} selectedId={null} onSelect={() => {}} onSurfaceClick={activeMapName ? move : undefined}/>
          {customTokens.filter(visibleCustom).map(token => <Suspense key={`${activeMapId}:${token.id}`} fallback={null}><CustomToken token={token} canDrag={mestre} aimWithCamera={!tacticalMode && cameraFlashlightId===token.id} onAim={lanterna => {if(mestre) saveCustomTokens(customTokens.map(item => item.id===token.id ? {...item,lanterna} : item));}} baseElevation={activeSpawnPoints.tokens?.y} selected={token.id === selectedToken} onSelect={id => {setSelectedToken(id);setPendingToken(null);setTokenMode(true);setNotice(`${token.name} selecionado. Arraste-o livremente para mover.`);}} onEdit={() => {setQuickToken({kind:"custom",id:token.id});setHudPanel(null);}} onDragStart={() => setDraggingToken(true)} constrainPosition={limitarPosicaoToken} onDragEnd={finishTokenInteraction}/></Suspense>)}
          {tabletopPeople.map((person,i) => visiblePerson(person.id) && <Suspense key={`${activeMapId}:${person.id}`} fallback={null}><Person hideWhenClose={cameraPersonIndex===i && (mestre ? Boolean(masterFocusId) : playerCameraMode==="character") && hudPanel!=="sheet"} firstPerson={!tacticalMode && view==="firstPerson" && cameraPersonIndex===i} person={person} playerView={!mestre && i===playerCharacterIndex} sheetOpen={hudPanel==="sheet"} combat={Boolean(sheetTokenTransforms[person.id]?.combat)} animation={person.animation ? {...person.animation,enabled:sheetTokenTransforms[person.id]?.animationEnabled ?? person.animation.enabled} : sheetTokenTransforms[person.id]?.animation} canDrag={mestre} rotacao={sheetTokenTransforms[person.id]?.rotacao} olharCamera={sheetTokenTransforms[person.id]?.olharCamera} aimWithCamera={!tacticalMode && cameraFlashlightId===person.id} onAim={lanterna => updateSheetToken(person.id,{lanterna})} lanterna={tokenFlashlight(sheetTokenTransforms[person.id])} position={positions[i] || person.start} scale={sheetTokenTransforms[person.id]?.scale} elevation={sheetTokenTransforms[person.id]?.elevation} baseElevation={activeSpawnPoints.tokens?.y} selected={!tokenMode && selected===i} onPosition={(p,elevation) => {actualPositions.current[i]=p;renderedTokenPoses.current.set(person.id,{position:p,elevation});}} onSelect={() => {setSelected(i);setTokenMode(false);setSelectedToken(null);}} onEdit={() => {setQuickToken({kind:"person",id:person.id});setHudPanel(null);}} onDragStart={() => setDraggingToken(true)} constrainPosition={limitarPosicaoToken} onDragEnd={(position,moved,elevation) => {setDraggingToken(false);setPositions(previous => previous.map((current,index) => index===i ? position : current));updateSheetToken(person.id,{x:position[0],z:position[1],elevation});setNotice(moved ? `${person.name} foi reposicionado.` : `${person.name} selecionado. Clique com o botão direito para editar.`);}}/></Suspense>)}
        </Canvas>}
      </SceneBoundary>

      {tacticalMode && !staticScene && <SceneBoundary><Suspense fallback={<div className="tt3-fallback">Carregando mapa tático…</div>}><TacticalTabletop doorStates={doorStates} onToggleDoor={toggleDoor} constrainMove={(token,position) => !mestre ? playerCollisionController.current?.(position) : null} cameraSpeed={mestre ? cameraSpeed : 1} playerTokenId={!mestre ? tabletopPeople[playerCharacterIndex]?.id : null} navigation={<PlayerTokenNavigation speed={tokenSpeed} key={activeMapId} collision elevation={Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.elevation)||0} baseElevation={Number(activeSpawnPoints.tokens?.y)||0} scale={sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.scale} collisionController={playerCollisionController} enabled={!mestre && playerCharacterIndex>=0 && !hudPanel && !tokenPanelOpen && !draggingToken && !examinedClue && !quickToken} cameraRelative={false} position={playerFollowPosition} onMove={movePlayerToken} onStop={() => {if(playerCharacterIndex>=0 && playerFollowPosition) updateSheetToken(tabletopPeople[playerCharacterIndex].id,{x:playerFollowPosition[0],z:playerFollowPosition[1],elevation:Number(sheetTokenTransforms[tabletopPeople[playerCharacterIndex]?.id]?.elevation)||0});}}/>} assets={visibleAssets} mapKey={activeMapId} center={tacticalCenter} locked={draggingToken} mestre={mestre} tokens={tacticalTokens} onFloor={move} onDragStart={() => setDraggingToken(true)} onDragEnd={() => setDraggingToken(false)} onSelect={token => {if(token.personIndex!==undefined) {setSelected(token.personIndex);setTokenMode(false);} else {setSelectedToken(token.id);setTokenMode(true);}}} onMove={(token,position) => {if(!canMoveTacticalToken(token,mestre,tabletopPeople[playerCharacterIndex]?.id)) return;if(!mestre) {movePlayerToken(position);return;}position=limitarPosicaoToken(position);if(token.personIndex!==undefined) {setPositions(current => current.map((p,index) => index===token.personIndex ? position : p));updateSheetToken(token.id,{x:position[0],z:position[1]});} else finishTokenInteraction(token.id,position,true);}}/></Suspense></SceneBoundary>}
      {activePresentation.type==="special" && <SpecialScene key={campaign.cenaAtiva.id+activePresentation.media.midiaUrl} scene={campaign.cenaAtiva} destinations={specialSceneDestinations(campaign)} busy={switchingScene} onNavigate={mestre ? target=>switchScene(target.scene,target.mapLink || null,target.imageLink || null) : undefined} onClose={mestre ? ()=>switchScene(campaign.cenaAtiva) : undefined}/>}
      {staticScene && <div className={`tt3-static-scene ${!mestre ? "tt3-static-scene-player" : ""}`}>{staticScene.animation?.enabled ? <AnimatedScene media={staticScene} id={`${campaign?.cenaAtiva?.id}:${staticScene.id}`} alt={staticScene.nome || campaign?.cenaAtiva?.nome || "Cena narrativa"}/> : <SceneMedia media={staticScene} alt={staticScene.nome || campaign?.cenaAtiva?.nome || "Cena estática"}/>}</div>}
      <div className="tt3-cinema-shade" aria-hidden="true"/>
      <div className="tt3-film-grain" aria-hidden="true"/>

      {!mobilePlayer && sceneHeader}

      {hudHidden && !mobilePlayer && <button type="button" className="tt3-show-hud" onClick={() => setHudHidden(false)}>Mostrar interface · H</button>}

      {mobile && (mobilePlayer || !hudHidden) && !hudPanel && !tokenPanelOpen && !sessionOpen && !mechanicsOpen && <button type="button" className="tt3-mobile-menu-button" aria-label="Ferramentas" aria-controls={mobilePlayer ? "tt3-mobile-player-menu" : undefined} aria-expanded={mobileMenu} onClick={() => {if(mobilePlayer) setHudHidden(false);setMobileMenu(value => !value);}}>☰</button>}
      {mobile && (mobilePlayer || !hudHidden) && !staticScene && !hudPanel && !tokenPanelOpen && !sessionOpen && !mechanicsOpen && <MobileTabletopControls enabled={!mobileMenu} onMoveStart={() => {if(mestre) setMasterFocusId(null);}}/>}
      {mobilePlayer && mobileMenu && <aside id="tt3-mobile-player-menu" className="tt3-mobile-player-menu" aria-label="Opções do jogador">{sceneHeader}{commandMenu}<section className="tt3-mobile-camera-options" aria-label="Câmera e iluminação">{cameraModes}<div className="tt3-mobile-lights">{normalFlashlight}{uvFlashlight}</div></section></aside>}
      {(!mobilePlayer || mobileMenu) && (mestre || !hasActiveRevolt(campaign?.mecanicasEspeciais)) && <SpecialMechanicsBanner state={campaign?.mecanicasEspeciais} onOpen={() => setMechanicsOpen(true)}/>}
      {!mestre && (!mobilePlayer || mobileMenu) && !mechanicsOpen && <RevoltPlayerHUD campaign={campaign} playerId={routeParams.get('sistema')==='espiral' ? `espiral:${playerSheetId}` : playerSheetId} onOpen={() => setMechanicsOpen(true)} onState={state => setCampaign(current => ({ ...current, mecanicasEspeciais: state }))}/>}
      {mechanicsOpen && campaign && <SpecialMechanicsDialog campaign={campaign} master={mestre} playerId={routeParams.get("sistema")==="espiral" ? `espiral:${playerSheetId}` : playerSheetId} onClose={() => setMechanicsOpen(false)} onState={state => setCampaign(current => ({ ...current, mecanicasEspeciais: state }))}/>}
      {!mobilePlayer && !mestre && commandMenu}
      {!mestre && !hudPanel && !mechanicsOpen && !mobileMenu && <SurvivalIndicators campaign={campaign} playerId={routeParams.get('sistema')==='espiral' ? `espiral:${playerSheetId}` : playerSheetId} compact/>}

      {mestre && <div className="tt3-cast-bar" aria-label="Personagens na cena">
        <div className="tt3-cast-heading"><span>EM CENA</span><b>{tabletopPeople.length+customTokens.length}</b></div>
        {tabletopPeople.map((person,index) => <button type="button" key={person.id} aria-pressed={!tokenMode && selected===index} onClick={() => {setSelected(index);setTokenMode(false);setSelectedToken(null);if(mestre){setMasterFocusId(person.id);setMasterFocusRequest(value=>value+1);setTacticalMode(false);}}} onContextMenu={event => {event.preventDefault();setSelected(index);setTokenMode(false);setSelectedToken(null);setQuickToken({kind:"person",id:person.id});setHudPanel(null);}} title={`${person.name} · ${person.role} · botão direito para editar`}><i style={{backgroundColor:person.color,backgroundImage:person.image ? `url("${person.image}")` : undefined}}/><span>{person.name}</span></button>)}
        {customTokens.filter(token=>mestre || !token.uvOnly).map(token => <button type="button" key={token.id} aria-pressed={tokenMode && selectedToken===token.id} onClick={() => {setTokenMode(true);setPendingToken(null);setSelectedToken(token.id);if(mestre){setMasterFocusId(token.id);setMasterFocusRequest(value=>value+1);setTacticalMode(false);}}} onContextMenu={event => {event.preventDefault();setTokenMode(true);setPendingToken(null);setSelectedToken(token.id);setQuickToken({kind:"custom",id:token.id});setHudPanel(null);}} title={`Token · ${token.name} · botão direito para editar`}><i style={{backgroundColor:token.color || "#7a5b78",backgroundImage:token.image ? `url("${token.image}")` : undefined}}/><span>{token.name}</span></button>)}
      </div>}

      {!mobilePlayer && normalFlashlight}
      {mobilePlayer && !staticScene && !mobileMenu && !hudPanel && !sessionOpen && !tokenPanelOpen && !mechanicsOpen && <div className="tt3-mobile-flashlights" role="group" aria-label="Iluminação">{normalFlashlight}{uvFlashlight}</div>}
      {!mobilePlayer && (mestre ? cameraModes : <details className="tt3-player-camera-menu" onClick={event=>{if(event.target.closest('button'))event.currentTarget.open=false;}}><summary>Câmera · {tacticalMode ? 'Mapa 2D' : ({room:'Cena',cinema:'Cinema',panorama:'Panorâmica',detail:'Detalhe',firstPerson:'Primeira pessoa'})[view]} <span aria-hidden="true">⌃</span></summary><div className="tt3-player-camera-options">{cameraModes}</div></details>)}

      {!mobilePlayer && uvFlashlight}
      {campaign && <RollNotifications key={campaign.id} rolls={campaign.rolagens || []} mechanics={campaign.mecanicasEspeciais} mestre={mestre}/>}
      <div className="tt3-toast" role="status"><span>{notice}</span><small>{mestre && "Ctrl + roda: velocidade · Shift + roda: inclinação lateral · "}{view==="firstPerson" ? (mestre ? "Botão esquerdo + arrastar: olhar ao redor · visão do personagem selecionado" : "Botão esquerdo + arrastar: olhar ao redor · WASD: mover seu personagem") : tacticalMode && !staticScene ? (mestre ? "Arraste os tokens para mover · arraste o mapa para navegar · roda: zoom" : "Arraste seu personagem ou use WASD · arraste o mapa para navegar · roda: zoom") : mestre ? "Botão direito + arrastar: olhar sem sair do lugar · botão esquerdo: orbitar · WASD: mover · Shift + arrastar: deslocar · roda: zoom · Q/E: descer/subir" : "WASD: mover seu personagem · botão esquerdo: orbitar · roda: aproximar"}</small></div>

      {hudPanel && <aside ref={sheetPanelRef} style={hudPanel==="shield"?{'--shield-height':shieldHeight+'dvh'}:undefined} data-collapsed={hudPanel==="shield" && shieldCollapsed ? "true":undefined} className={`tt3-hud-drawer ${hudPanel==="shield"?"tt3-master-shield-drawer":""} ${hudPanel==="sheet" && embeddedEspiralId ? "tt3-sheet-drawer" : ""}`} aria-label="Painel de ferramentas">
        <header><div><span>TABLETOP 3D</span><h2>{({camera:"Câmera",shield:"Escudo do mestre",scene:"Cena",weather:"Clima",background:"Background",initiative:"Iniciativa",dice:"Dados",evidence:"Pistas",audio:"Áudio",notes:"Notas",sheet:"Ficha"})[hudPanel]}</h2></div>{mestre && hudPanel==='shield' && !shieldCollapsed && <ShieldInitiativeStrip campaign={campaign} onCampaignChange={setCampaign} onRefresh={refreshCampaign}/>} {hudPanel==='shield' && <div className="tt3-shield-layout-controls"><label>Altura<input aria-label="Altura do escudo" type="range" min="25" max="65" step="1" value={shieldHeight} disabled={shieldCollapsed} onChange={event=>{const value=Number(event.target.value);setShieldHeight(value);localStorage.setItem('darkness:shield3d:height',String(value));}}/></label><button type="button" aria-label={shieldCollapsed?'Expandir escudo do mestre':'Recolher escudo do mestre'} aria-expanded={!shieldCollapsed} onClick={()=>setShieldCollapsed(value=>!value)}>{shieldCollapsed?'⌃ Escudo do mestre':'⌄ Recolher'}</button></div>}<button type="button" onClick={() => setHudPanel(null)} aria-label="Fechar painel">×</button></header>
        {hudPanel==="scene" && renderNativeScene()}
        {hudPanel==="flashlight" && renderShieldFlashlight()}

        {mestre && hudPanel==="shield" && <MasterShield organized campaign={campaign} onOptionalState={state=>setCampaign(current=>({...current,mecanicasEspeciais:state}))} extraTools={[
          ['exploration','Exploração'],['tokens','Tokens'],['mechanics','Mecânicas especiais'],['weather','Clima'],['background','Fundo'],['dice','Dados'],['flashlight','Lanterna'],['players','Jogadores']
        ]} members={campaign?.membros || []} campaignSystem={campaign?.sistema || "absoluto"} campaignId={campaign?.id} scene={campaign?.cenaAtiva} combat={campaign?.combateAtivo} investigation={campaign?.investigacaoAtiva} enemies={campaign?.inimigos} onSaveDifficulty={updateSceneDifficulty} onSaveEnemy={updateShieldEnemy} onAddEnemy={addShieldEnemy} onRemoveEnemy={removeShieldEnemy} renderTool={tool=>{
          if(tool==='exploration') return <ExplorationPanel key={activeMapId} assets={mapAssets} config={exploration} members={campaign?.membros || []} position={cameraFollowPosition || positions[selected] || [0,0]} elevation={Number(activeSpawnPoints.tokens?.y)||0} onSave={saveExploration}/>;
          if(tool==='tokens') return renderNativeTokens();
          if(tool==='weather') return renderShieldWeather();
          if(tool==='background') return renderNativeBackground();
          if(tool==='dice') return renderNativeDice();
          if(tool==='flashlight') return renderShieldFlashlight();
          if(tool==='notes') return renderNativeNotes();
          if(tool==='mechanics') return <div className="tt3-drawer-content"><button type="button" onClick={()=>setMechanicsOpen(true)}>Abrir mecânicas especiais</button></div>;
          return <><Suspense fallback={<p role="status">Carregando ferramenta…</p>}><ShieldDocuments embedded shieldTool={tool} requestedTool={tool}/></Suspense></>;
        }} documents={<Suspense fallback={<p role="status">Carregando documentos…</p>}><ShieldDocuments embedded documentsOnly requestedTool="evidence"/></Suspense>}/> }
        {hudPanel==="weather" && renderShieldWeather()}
        {hudPanel==="background" && renderNativeBackground()}
        {hudPanel==="dice" && renderNativeDice()}
        {hudPanel==="notes" && renderNativeNotes()}
        {hudPanel==="sheet" && (embeddedEspiralId ? <div className="tt3-embedded-sheet" onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()}>
          <Suspense fallback={<p role="status">Carregando ficha ESPIRAL…</p>}><FichaEspiral campaign={campaign} key={embeddedEspiralId} sheetId={embeddedEspiralId} embedded scene={campaign?.cenaAtiva} sceneEnemies={campaign?.inimigos || []} rollContext={activeDifficulty} difficultyLocked={!mestre} onRollContextChange={setDifficultyContext} onSheetChange={updateEspiralSheet} onRoll={(roll,author) => {if(campaign?.id) registrarRolagem(campaign.id,author,{...roll,...(roll.tipo==="dano" ? {} : rollOutcome(roll.total ?? roll.best ?? roll.resultado ?? 0,roll.difficulty ?? activeDifficulty.value)),context:roll.context || activeDifficulty.label,category:roll.category || activeDifficulty.category,formula:roll.label,sistema:"espiral"}).catch(() => setNotice("Não foi possível compartilhar a rolagem da ficha."));}}/></Suspense>
        </div> : <div className="tt3-drawer-content tt3-empty-panel"><span>▤</span><h3>Ficha do personagem</h3><a href={returnUrl} className="tt3-primary">Abrir ficha</a></div>)}
      </aside>}

      {!mestre && !hudPanel && !staticScene && !tacticalMode && !hudHidden && <span className="tt3-interaction-aim" aria-hidden="true"/>}
      {interactionHint && !hudPanel && !examinedClue && <button type="button" className="tt3-interact-prompt" onClick={interactionHint.interact}><kbd>E</kbd> {interactionHint.label}</button>}
      {examinedClue && <div className="tt3-quick-backdrop" onClick={()=>setExaminedClue(null)}><section role="dialog" aria-modal="true" aria-label={examinedClue.title} className="tt3-quick-actions" onClick={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setExaminedClue(null);}}><h3>{examinedClue.title}</h3><p>{examinedClue.text}</p><button autoFocus type="button" onClick={()=>setExaminedClue(null)}>Fechar pista</button></section></div>}
      {mestre && quickToken && (()=>{
        const custom=quickToken.kind==='custom',token=custom ? customTokens.find(token=>token.id===quickToken.id) : tabletopPeople.find(person=>person.id===quickToken.id);
        if(!token)return null;
        const state=custom ? token : sheetTokenTransforms[token.id] || {};
        const select=()=>{if(custom){setTokenMode(true);setSelectedToken(token.id);}else{setTokenMode(false);setSelected(tabletopPeople.findIndex(person=>person.id===token.id));setSelectedToken(null);}};
        return <TokenQuickActions name={token.name} hidden={state.hidden} audience={state.audience} members={campaign?.membros || []}
          onVisibility={patch=>{if(custom)saveCustomTokens(customTokens.map(item=>item.id===token.id?{...item,...patch}:item));else updateSheetToken(token.id,patch);}}
          onFocus={()=>{select();setMasterFocusId(token.id);setMasterFocusRequest(value=>value+1);setTacticalMode(false);setQuickToken(null);}}
          onEdit={()=>{select();setTokenPanelOpen(true);setHudPanel(null);setQuickToken(null);}}
          onInitiative={!custom && campaign?.id ? async value=>{const member=campaign.membros?.find(member=>member.ficha_id===token.id || 'darkness:'+member.ficha_id===token.id);const id=member?.ficha_id || token.id;await definirIniciativa(campaign.id,id,value,token.name);await refreshCampaign();}:undefined}
          onClose={()=>setQuickToken(null)}/>;
      })()}
      {tokenPanelOpen && renderNativeTokens()}

    </section>
  </main>;
}














