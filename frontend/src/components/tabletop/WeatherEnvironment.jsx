import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {DEFAULT_WEATHER} from '../../utils/tabletopWeather';

function WeatherParticles({type,intensity=0,wind=0,timelineTime}) {
  const geometryRef=useRef();
  const elapsed=useRef(0);
  const count=Math.round(Math.max(0,Math.min(1,intensity))*1400);
  const positions=useMemo(() => {
    const values=new Float32Array(count*3);
    let seed=type==="rain"?13:37;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let index=0;index<count;index+=1) {
      values[index*3]=(random()-0.5)*34;
      values[index*3+1]=random()*16;
      values[index*3+2]=(random()-0.5)*34;
    }
    return values;
  },[count,type]);
  const basePositions=useMemo(()=>positions.slice(),[positions]);
  useFrame((_,delta) => {
    const attribute=geometryRef.current?.attributes?.position;
    if(!attribute) return;
    elapsed.current+=Math.min(delta,.1);
    const time=Number.isFinite(timelineTime)?Math.max(0,timelineTime):elapsed.current;
    const speed=type==="rain"?13:1.25;
    for(let index=0;index<attribute.count;index+=1){
      const offset=index*3;
      attribute.array[offset]=((basePositions[offset]+17+wind*time*(type==="rain"?2.4:1))%34+34)%34-17;
      attribute.array[offset+1]=((basePositions[offset+1]-speed*time)%16+16)%16;
      attribute.array[offset+2]=basePositions[offset+2];
    }
    attribute.needsUpdate=true;
  });
  if(!count) return null;
  return <points frustumCulled={false} renderOrder={20}>
    <bufferGeometry ref={geometryRef}><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial color={type==="rain" ? "#b9d8e5" : "#ffffff"} size={type==="rain" ? 0.035 : 0.085} transparent opacity={type==="rain" ? 0.62 : 0.88} depthWrite={false}/>
  </points>;
}

export default function WeatherEnvironment({weather,timelineTime}) {
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
    <WeatherParticles type="rain" intensity={Number(weather.rain)} wind={Number(weather.wind)} timelineTime={timelineTime}/>
    <WeatherParticles type="snow" intensity={Number(weather.snow)} wind={Number(weather.wind)}/>
  </>;
}

