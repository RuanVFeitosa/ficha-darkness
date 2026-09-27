import React, { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "../CSS/Tabletop3D.css";

const PEOPLE = [
  { name: "Helena", role: "Investigadora", color: "#ad784d", skin: "#c89472", start: [-1.4, 1.7] },
  { name: "Marcos", role: "Agente", color: "#536764", skin: "#a57759", start: [0.2, 0.8] },
  { name: "Vicente", role: "Informante", color: "#817184", skin: "#d0a081", start: [2, 1.6] },
];
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
function Room({night,onFloor}) {
  return <>
    <color attach="background" args={[night ? "#11191d" : "#252c2c"]}/>
    <ambientLight intensity={night ? 0.3 : 0.9}/><hemisphereLight args={["#a7c8de","#6e4c33",1]}/>
    <directionalLight position={[2,9,5]} intensity={night ? 0.4 : 2} color="#ffdfb6" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={0.04}/>
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
function Person({person,position,selected,onSelect,onPosition}) {
  const ref = useRef();
  useFrame((_,delta) => {
    const target=ref.current, dx=position[0]-target.position.x, dz=position[1]-target.position.z;
    if(Math.hypot(dx,dz)>0.015) {
      target.rotation.y=Math.atan2(dx,dz);
      const factor=Math.min(1,delta*6);
      target.position.x+=dx*factor; target.position.z+=dz*factor;
    }
    onPosition([target.position.x,target.position.z]);
  });
  return <group ref={ref} position={[person.start[0],0,person.start[1]]} onClick={e => {e.stopPropagation();onSelect();}}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.025,0]}><ringGeometry args={[0.29,0.34,40]}/><meshBasicMaterial color={selected ? "#eec77e" : "#777a71"}/></mesh>
    {[-0.13,0.13].map(x => <group key={x}><Box position={[x,0.3,0]} size={[0.18,0.5,0.22]} color="#303738"/><Box position={[x,0.08,0.06]} size={[0.2,0.13,0.34]} color="#211f1d"/></group>)}
    <Box position={[0,0.85,0]} size={[0.49,0.65,0.28]} color={person.color}/>
    {[-0.32,0.32].map(x => <Box key={x} position={[x,0.79,0]} size={[0.15,0.58,0.19]} color={person.color} rotation={[0,0,x*0.25]}/>)}
    <mesh position={[0,1.38,0]} castShadow><sphereGeometry args={[0.22,12,10]}/><meshStandardMaterial color={person.skin}/></mesh>
    <mesh position={[0,1.49,-0.025]} castShadow><sphereGeometry args={[0.225,12,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#30251f"/></mesh>
    <Box position={[0,1.36,0.21]} size={[0.07,0.09,0.07]} color={person.skin}/>
  </group>;
}
function Camera({view}) {
  const {camera,gl}=useThree(); const controls=useRef();
  useEffect(() => {
    const orbit=new OrbitControls(camera,gl.domElement);
    orbit.enableDamping=true; orbit.minDistance=4; orbit.maxDistance=19;
    orbit.maxPolarAngle=Math.PI/2.05; orbit.target.set(0,0.7,0); controls.current=orbit;
    return () => orbit.dispose();
  },[camera,gl]);
  useEffect(() => {
    camera.position.set(...(view === "top" ? [0,14,0.1] : view === "close" ? [5,3.5,7] : [10,8,12]));
    controls.current.target.set(0,0.7,0); controls.current.update();
  },[camera,view]);
  useFrame(() => controls.current?.update()); return null;
}
class SceneBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError() {return {failed:true};}
  render() {return this.state.failed ? <div className="tt3-fallback">Não foi possível iniciar o 3D. Verifique a aceleração gráfica do navegador ou volte à mesa.</div> : this.props.children;}
}
export default function Tabletop3D() {
  const [selected,setSelected]=useState(0), [positions,setPositions]=useState(PEOPLE.map(p => [...p.start]));
  const [night,setNight]=useState(false), [view,setView]=useState("room");
  const [notice,setNotice]=useState("Selecione um personagem e clique no piso para movê-lo.");
  const actualPositions=useRef(PEOPLE.map(p => [...p.start]));
  const params=new URLSearchParams(window.location.search); params.delete("tabletop3d");
  function move(e) {
    e.stopPropagation(); if(e.delta>5) return;
    const destination=[e.point.x,e.point.z];
    if(!clearPath(actualPositions.current[selected],destination) || positions.some((p,i) => i!==selected && Math.hypot(p[0]-destination[0],p[1]-destination[1])<0.65)) {
      setNotice("Caminho bloqueado. Clique em pontos livres para contornar os móveis."); return;
    }
    setPositions(previous => previous.map((p,i) => i===selected ? destination : p));
    setNotice(`${PEOPLE[selected].name} se deslocou pela sala.`);
  }
  return <main className="tt3">
    <header className="tt3-header"><a href={`?${params}`}>← Voltar à mesa</a><div><span>LABORATÓRIO · TABLETOP 3D</span><h1>O último depoimento</h1></div><span className="tt3-badge">Protótipo local</span></header>
    <section className="tt3-stage" aria-label="Sala de investigação tridimensional">
      <SceneBoundary><Canvas shadows dpr={[1,1.5]} camera={{position:[10,8,12],fov:42}} fallback={<div className="tt3-fallback">Seu navegador não oferece suporte a WebGL.</div>}><Camera view={view}/><Room night={night} onFloor={move}/>{PEOPLE.map((person,i) => <Person key={person.name} person={person} position={positions[i]} selected={selected===i} onPosition={p => {actualPositions.current[i]=p;}} onSelect={() => setSelected(i)}/>)}</Canvas></SceneBoundary>
      <div className="tt3-caption"><span>CENA 01 / INTERIOR</span><h2>Arquivo municipal</h2><p>Três pessoas. Uma versão dos fatos.</p></div>
      <div className="tt3-tools" aria-label="Controles da cena">{[["room","Diorama"],["close","Próxima"],["top","Superior"]].map(([id,label]) => <button key={id} aria-pressed={view===id} onClick={() => setView(id)}>{label}</button>)}<button aria-pressed={night} onClick={() => setNight(v => !v)}>{night ? "Noite" : "Dia"}</button></div>
    </section>
    <footer className="tt3-footer"><div className="tt3-cast">{PEOPLE.map((p,i) => <button key={p.name} aria-pressed={selected===i} onClick={() => setSelected(i)}><i style={{background:p.color}}/><span><strong>{p.name}</strong><small>{p.role}</small></span></button>)}</div><div className="tt3-help"><p role="status">{notice}</p><small>Arraste para girar · Scroll para zoom · Botão direito para deslocar</small></div><button onClick={() => {setPositions(PEOPLE.map(p => [...p.start]));setNotice("Personagens nas posições iniciais.");}}>Reiniciar posições</button></footer>
  </main>;
}
