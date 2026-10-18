import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
export function normalizarLanterna(value = {}) {
  const number = (key, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value[key])) ? Number(value[key]) : fallback));
  return { ...(Array.isArray(value.vetor) && value.vetor.length===3 && value.vetor.every(Number.isFinite) ? {vetor:value.vetor} : {}), ativa: Boolean(value.ativa), alcance: number("alcance", 18, 4, 60), abertura: number("abertura", 50, 20, 120), direcao: number("direcao", 0, -180, 180), cor: /^#[a-f0-9]{6}$/i.test(value.cor || "") ? value.cor : "#fff1cd" };
}
export function direcaoDaCamera(vector) {
  const length=Math.hypot(...vector) || 1;
  const vetor=vector.map(value => value/length);
  return {vetor,direcao:Math.atan2(vetor[0],-vetor[2])*180/Math.PI};
}
export default function TokenFlashlight({ config, scale = 1, height = 1.1, aimWithCamera=false, onAim }) {
  const light = normalizarLanterna(config);
  const target = useMemo(() => new THREE.Object3D(), []);
  const cameraDirection=useMemo(() => new THREE.Vector3(), []);
  const lastSent=useRef({time:0,vector:null});
  useFrame(({camera,clock}) => {
    if(!aimWithCamera) return;
    camera.getWorldDirection(cameraDirection);
    const aim=direcaoDaCamera(cameraDirection.toArray());
    target.position.set(aim.vetor[0]*light.alcance,height+aim.vetor[1]*light.alcance,aim.vetor[2]*light.alcance);
    const now=clock.elapsedTime;
    const previous=lastSent.current;
    if(onAim && now-previous.time>=0.4 && (!previous.vector || aim.vetor.some((value,index) => Math.abs(value-previous.vector[index])>0.01))) {
      lastSent.current={time:now,vector:aim.vetor};
      onAim({...light,...aim});
    }
  });
  const angle = light.direcao * Math.PI / 180;
  if(light.vetor) target.position.set(light.vetor[0]*light.alcance,height+light.vetor[1]*light.alcance,light.vetor[2]*light.alcance);
  else target.position.set(Math.sin(angle)*light.alcance,height-0.2,-Math.cos(angle)*light.alcance);
  return <group scale={1 / Math.max(0.01, scale)}>
    <primitive object={target}/>
    <spotLight castShadow shadow-mapSize={[1024,1024]} shadow-camera-near={0.05} shadow-camera-far={light.alcance} shadow-bias={-0.0002} shadow-normalBias={0.01} shadow-radius={2} position={[0,height,0]} target={target} color={light.cor} intensity={35} distance={light.alcance} angle={light.abertura * Math.PI / 360} penumbra={0.35} decay={1}/>
  </group>;
}
export function FlashlightControls({ value, onChange }) {
  const light = normalizarLanterna(value);
  const update = patch => onChange({ ...light, ...patch });
  return <div className="tt3-flashlight-controls">
    <label><input type="checkbox" checked={light.ativa} onChange={event => update({ ativa: event.target.checked })}/> Lanterna ligada</label>
    <label>Alcance · {light.alcance} m<input aria-label="Alcance da lanterna" type="range" min="4" max="60" value={light.alcance} onChange={event => update({ alcance: Number(event.target.value) })}/></label>
    <p>A direção acompanha a câmera, incluindo olhar para cima e para baixo.</p>
    <label>Abertura · {light.abertura}°<input aria-label="Abertura da lanterna" type="range" min="20" max="120" value={light.abertura} onChange={event => update({ abertura: Number(event.target.value) })}/></label>
    <label>Cor da luz<input aria-label="Cor da lanterna" type="color" value={light.cor} onChange={event => update({ cor: event.target.value })}/></label>
  </div>;
}
