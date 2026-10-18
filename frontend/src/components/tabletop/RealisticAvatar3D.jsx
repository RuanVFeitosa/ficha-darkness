import {createTabletopRenderer} from '../../utils/tabletopRenderer';
import TabletopResolutionLimit from './TabletopResolutionLimit';
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import "../../styles/RealisticAvatar3D.css";

export const REALISTIC_AVATARS = [
  {
    id: "maya",
    name: "Maya",
    description: "Silhueta leve",
    hairLabel: "Rabo de cavalo",
    outfitLabel: "Regata e calça",
    shoeLabel: "Botas urbanas",
    modelUrl: "/tabletop/characters/maya-idle.glb",
  },
  {
    id: "sam",
    name: "Sam",
    description: "Silhueta atlética",
    hairLabel: "Curto",
    outfitLabel: "Casual de campo",
    shoeLabel: "Tênis casual",
    modelUrl: "/tabletop/characters/sam-idle.glb",
  },
  {
    id: "harper",
    name: "Harper",
    description: "Silhueta robusta",
    hairLabel: "Rente",
    outfitLabel: "Traje alinhado",
    shoeLabel: "Sapato social",
    modelUrl: "/tabletop/characters/harper-idle.glb",
  },
];

export const DEFAULT_REALISTIC_AVATAR = {
  version: 3,
  modelId: REALISTIC_AVATARS[0].id,
  modelUrl: REALISTIC_AVATARS[0].modelUrl,
  hairModelId: "maya",
  outfitModelId: "maya",
  shoeModelId: "maya",
  accessoryId: "phone",
  height: 1,
  build: 1,
  skinTone: "#efc4a7",
  hairColor: "#3d271f",
  topColor: "#66505e",
  bottomColor: "#30343b",
  shoeColor: "#201a20",
  accessoryColor: "#31434c",
};

const OUTFIT_PRESETS = [
  { id: "survivor", name: "Sobrevivente", topColor: "#4c5948", bottomColor: "#34383a", shoeColor: "#2b241f" },
  { id: "urban", name: "Urbano", topColor: "#3d4654", bottomColor: "#1f252b", shoeColor: "#17191d" },
  { id: "earth", name: "Terra", topColor: "#715444", bottomColor: "#39342f", shoeColor: "#30231c" },
  { id: "wine", name: "Vinho", topColor: "#67364f", bottomColor: "#292d33", shoeColor: "#21191f" },
];

function materialList(object) {
  return Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
}

function meshSlot(objectName) {
  if(objectName==="low-poly" || objectName.includes("fine scalp roots")) return "hidden";
  if(objectName.includes("eyebrow") || objectName.includes("eyelashes") || objectName.includes("anatomical body") || objectName.includes("teeth base")) return "body";
  if(objectName.includes("ponytail") || objectName.includes("short01")) return "hair";
  if(objectName.includes("casualsuit") || objectName.includes("elegantsuit")) return "outfit";
  if(objectName.includes("shoes") || objectName.includes("ankle lining")) return "shoes";
  if(objectName==="phone" || objectName==="briefcase" || objectName.includes("original held accessory")) return "accessory";
  return null;
}

function applyAvatarAppearance(scene, avatar, sourceId) {
  scene.traverse((object) => {
    const objectName=String(object.name || "").toLowerCase().replace(/[_|]+/g," ").replace(/\s+/g," ").trim();
    if(object.isMesh) {
      const slot=meshSlot(objectName);
      if(slot==="hidden") object.visible=false;
      if(slot==="body") object.visible=sourceId===avatar.modelId;
      if(slot==="hair") object.visible=sourceId===avatar.hairModelId;
      if(slot==="outfit") object.visible=sourceId===avatar.outfitModelId;
      if(slot==="shoes") object.visible=sourceId===avatar.shoeModelId;
      if(slot==="accessory") {
        object.visible=(avatar.accessoryId==="phone" && sourceId==="maya") || (avatar.accessoryId==="briefcase" && sourceId==="harper");
      }
    }
    materialList(object).forEach((material) => {
      const name=String(material.name || "").toLowerCase();
      let color=null;
      if(name.includes("anatomical body.body")) color=avatar.skinTone;
      else if(name.includes("ponytail") || name.includes("short01") || name.includes("fine hair roots") || name.includes("eyebrow")) color=avatar.hairColor;
      else if(name.includes("plum satin") || name.includes("original top")) color=avatar.topColor;
      else if(name.includes("charcoal tailored") || name.includes("original bottom")) color=avatar.bottomColor;
      else if(name.includes("shoes")) color=avatar.shoeColor;
      else if(name.includes("accessory")) color=avatar.accessoryColor;
      if(color && material.color) material.color.set(color);
    });
  });
}

function sourceOffset(baseId,sourceId) {
  if(baseId===sourceId) return [0,0,0];
  if(baseId==="maya" && (sourceId==="sam" || sourceId==="harper")) return [0,-0.13,0];
  if((baseId==="sam" || baseId==="harper") && sourceId==="maya") return [0,0.13,0];
  return [0,0,0];
}

export function RealisticAvatarModel({ avatar = DEFAULT_REALISTIC_AVATAR, preview = false }) {
  const groupRef = useRef();
  const [mayaGltf,samGltf,harperGltf] = useLoader(GLTFLoader, REALISTIC_AVATARS.map((option) => option.modelUrl));
  const gltfs = useMemo(() => [mayaGltf,samGltf,harperGltf], [mayaGltf,samGltf,harperGltf]);
  const scenes = useMemo(() => gltfs.map((gltf) => {
    const copy=clone(gltf.scene);
    copy.traverse((object) => {
      if(!object.isMesh || !object.material) return;
      object.material=Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone();
    });
    return copy;
  }), [gltfs]);
  const mixers = useMemo(() => scenes.map((scene) => new THREE.AnimationMixer(scene)), [scenes]);
  const height = Number(avatar.height) || 1;
  const build = Number(avatar.build) || 1;

  useEffect(() => {
    scenes.forEach((scene,index) => {
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        materialList(object).forEach((material) => { material.envMapIntensity=0.55; });
      });
      const idle=gltfs[index]?.animations?.[0];
      if(idle) mixers[index].clipAction(idle).reset().play();
    });
    return () => {
      mixers.forEach((mixer,index) => { mixer.stopAllAction(); mixer.uncacheRoot(scenes[index]); });
    };
  }, [gltfs, mixers, scenes]);

  useEffect(() => {
    const appearance={ ...DEFAULT_REALISTIC_AVATAR, ...avatar };
    scenes.forEach((scene,index) => applyAvatarAppearance(scene, appearance, REALISTIC_AVATARS[index].id));
  }, [avatar, scenes]);

  useFrame((_, delta) => {
    mixers.forEach((mixer) => mixer.update(Math.min(delta, 0.05)));
    if (preview && groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef} scale={[build * height, height, build * height]}>
      {scenes.map((scene,index) => {
        const sourceId=REALISTIC_AVATARS[index].id;
        return <group key={sourceId} position={sourceOffset(avatar.modelId,sourceId)}><primitive object={scene} /></group>;
      })}
    </group>
  );
}

function PreviewControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);

  useEffect(() => {
    controls.target.set(0, 0.95, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 4.2;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.update();
    return () => controls.dispose();
  }, [controls]);

  useFrame(() => controls.update());
  return null;
}

function PreviewScene({ avatar,onCaptureReady }) {
  return (
    <>
      <color attach="background" args={["#101316"]} />
      <fog attach="fog" args={["#101316", 4.5, 8]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#d9ecff", "#30251e", 1.15]} />
      <directionalLight position={[2.6, 4.2, 3.1]} intensity={2.4} color="#fff1dc" castShadow />
      <directionalLight position={[-3, 2.2, -1]} intensity={1.2} color="#6f9bc4" />
      <RealisticAvatarModel avatar={avatar}/><CaptureAvatar onCaptureReady={onCaptureReady} avatar={avatar}/>
      <mesh userData={{captureHidden:true}} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.25, 64]} />
        <meshStandardMaterial color="#24292c" roughness={0.94} />
      </mesh>
      <PreviewControls />
    </>
  );
}

function CaptureAvatar({onCaptureReady,avatar}) {
 const {gl,scene,camera}=useThree();
 useEffect(() => {
  if(!onCaptureReady) return;
  onCaptureReady(() => {
   const oldSize=gl.getSize(new THREE.Vector2()),oldRatio=gl.getPixelRatio(),oldPosition=camera.position.clone(),oldQuaternion=camera.quaternion.clone(),oldAspect=camera.aspect,oldFov=camera.fov,background=scene.background,fog=scene.fog;
   const clearColor=gl.getClearColor(new THREE.Color()),clearAlpha=gl.getClearAlpha(),hidden=[];
   scene.traverse(object => {if(object.userData?.captureHidden){hidden.push([object,object.visible]);object.visible=false;}});
   const height=Number(avatar.height)||1;
   function image(width,heightPixels,position,target){gl.setSize(width,heightPixels,false);camera.aspect=width/heightPixels;camera.fov=34;camera.position.set(...position);camera.lookAt(...target);camera.updateProjectionMatrix();gl.render(scene,camera);return gl.domElement.toDataURL('image/webp',.88);}
   try {scene.background=null;scene.fog=null;gl.setClearColor(0x000000,0);gl.setPixelRatio(1);return {
    front:image(480,880,[0,1.05*height,3.8],[0,.98*height,0]),
    back:image(480,880,[0,1.05*height,-3.8],[0,.98*height,0]),
    portrait:image(384,384,[0,1.64*height,1.15],[0,1.63*height,0]),
   };}finally{scene.background=background;scene.fog=fog;hidden.forEach(([object,visible]) => {object.visible=visible;});camera.position.copy(oldPosition);camera.quaternion.copy(oldQuaternion);camera.aspect=oldAspect;camera.fov=oldFov;camera.updateProjectionMatrix();gl.setClearColor(clearColor,clearAlpha);gl.setPixelRatio(oldRatio);gl.setSize(oldSize.x,oldSize.y,false);gl.render(scene,camera);}
  });
  return () => onCaptureReady(null);
 },[gl,scene,camera,avatar,onCaptureReady]);
 return null;
}
function LoadingAvatar() {
  return <div className="avatar-realista-loading"><span />Carregando modelo realista...</div>;
}

export default function RealisticAvatarCreator({ value, onChange,onCaptureReady }) {
  const [activePanel,setActivePanel]=useState("corpo");
  const avatar = { ...DEFAULT_REALISTIC_AVATAR, ...(value || {}) };
  
  const update = (changes) => {
    const next={ ...avatar, ...changes, version: 3 };
    next.modelUrl=REALISTIC_AVATARS.find((option) => option.id===next.modelId)?.modelUrl || DEFAULT_REALISTIC_AVATAR.modelUrl;
    onChange?.(next);
  };

  return (
    <section className="avatar-realista-criador">
      <div className="avatar-realista-palco">
        <Suspense fallback={<LoadingAvatar />}>
          <Canvas shadows dpr={1} gl={parameters => createTabletopRenderer({...parameters,alpha:true},THREE.WebGLRenderer)} camera={{ position: [0, 1.15, 3.15], fov: 34 }}>
            <TabletopResolutionLimit/><PreviewScene avatar={avatar} onCaptureReady={onCaptureReady}/>
          </Canvas>
        </Suspense>
        <div className="avatar-realista-selo"><i />MODELO 3D REALISTA</div>
        <p>Arraste para girar · use a roda para aproximar</p>
      </div>

      <div className="avatar-realista-painel">
        <header>
          <span>Editor modular</span>
          <h3>Construa seu personagem</h3>
          <p>Combine corpo, cabelo, roupa, calçado e acessórios da biblioteca disponível.</p>
        </header>

        <nav className="avatar-realista-abas" aria-label="Personalização do personagem">
          {[["corpo","Corpo"],["cabelo","Cabelo"],["roupa","Roupa"],["detalhes","Detalhes"]].map(([id,label]) => (
            <button key={id} type="button" className={activePanel===id ? "ativo" : ""} onClick={() => setActivePanel(id)}>{label}</button>
          ))}
        </nav>

        <div className="avatar-realista-editor">
          {activePanel==="corpo" && <>
            <SlotOptions label="Tipo de corpo" options={REALISTIC_AVATARS.map((option) => ({id:option.id,name:option.name,description:option.description}))} value={avatar.modelId} onChange={(modelId) => update({modelId})}/>
            <ColorControl label="Tom de pele" value={avatar.skinTone} onChange={(skinTone) => update({skinTone})}/>
            <label className="avatar-realista-controle">
              <span><b>Altura</b><output>{Math.round(avatar.height * 100)}%</output></span>
              <input type="range" min="0.9" max="1.1" step="0.01" value={avatar.height} onChange={(event) => update({ height: Number(event.target.value) })} />
            </label>
            <label className="avatar-realista-controle">
              <span><b>Porte físico</b><output>{Math.round(avatar.build * 100)}%</output></span>
              <input type="range" min="0.9" max="1.1" step="0.01" value={avatar.build} onChange={(event) => update({ build: Number(event.target.value) })} />
            </label>
          </>}

          {activePanel==="cabelo" && <>
            <SlotOptions label="Corte de cabelo" options={[...REALISTIC_AVATARS.map(option => ({id:option.id,name:option.hairLabel,description:`Peça ${option.name}`})),{id:"none",name:"Sem cabelo",description:"Sem malha de cabelo"}]} value={avatar.hairModelId} onChange={(hairModelId) => update({hairModelId})}/>
            <ColorControl label="Cor do cabelo" value={avatar.hairColor} onChange={(hairColor) => update({hairColor})}/>
          </>}

          {activePanel==="roupa" && <>
            <SlotOptions label="Conjunto" options={REALISTIC_AVATARS.map((option) => ({id:option.id,name:option.outfitLabel,description:`Coleção ${option.name}`}))} value={avatar.outfitModelId} onChange={(outfitModelId) => update({outfitModelId})}/>
            <div className="avatar-realista-paletas">
              {OUTFIT_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => update(preset)}><i style={{background:preset.topColor}}/><i style={{background:preset.bottomColor}}/><span>{preset.name}</span></button>)}
            </div>
            <div className="avatar-realista-cores-duplas">
              <ColorControl label="Parte superior" value={avatar.topColor} onChange={(topColor) => update({topColor})}/>
              <ColorControl label="Parte inferior" value={avatar.bottomColor} onChange={(bottomColor) => update({bottomColor})}/>
            </div>
            <ColorControl label="Calçados" value={avatar.shoeColor} onChange={(shoeColor) => update({shoeColor})}/>
          </>}

          {activePanel==="detalhes" && <>
            <SlotOptions label="Calçado" options={REALISTIC_AVATARS.map((option) => ({id:option.id,name:option.shoeLabel,description:`Coleção ${option.name}`}))} value={avatar.shoeModelId} onChange={(shoeModelId) => update({shoeModelId})}/>
            <SlotOptions label="Acessório" options={[{id:"none",name:"Nenhum",description:"Visual limpo"},{id:"phone",name:"Celular",description:"Acessório urbano"},{id:"briefcase",name:"Maleta",description:"Acessório de mão"}]} value={avatar.accessoryId} onChange={(accessoryId) => update({accessoryId})}/>
            <ColorControl label="Cor do acessório" value={avatar.accessoryColor} onChange={(accessoryColor) => update({accessoryColor})}/>
          </>}
        </div>

        <div className="avatar-realista-nota">
          <span>CC0</span>
          <p>Arte 3D criada por artistas e disponibilizada em domínio público. Nenhuma imagem foi gerada por IA.</p>
        </div>
      </div>
    </section>
  );
}

function ColorControl({label,value,onChange}) {
  return <label className="avatar-realista-cor">
    <span>{label}</span>
    <span className="avatar-realista-color-input">
      <i style={{background:value}}/>
      <code>{String(value || "").toUpperCase()}</code>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)}/>
    </span>
  </label>;
}

function SlotOptions({label,options,value,onChange}) {
  return <div className="avatar-realista-slot">
    <span>{label}</span>
    <div>
      {options.map((option) => <button key={option.id} type="button" className={value===option.id ? "ativo" : ""} onClick={() => onChange(option.id)}>
        <strong>{option.name}</strong>
        <small>{option.description}</small>
      </button>)}
    </div>
  </div>;
}




