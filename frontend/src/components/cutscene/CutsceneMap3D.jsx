import React,{Component,Suspense,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import AnimatedTokenArt from '../tokens/AnimatedTokenArt';
import {PlacedAssets} from '../tabletop/MapEditor3D';
import {RealisticAvatarModel} from '../tabletop/RealisticAvatar3D';
import {cameraRecordingPose} from '../../utils/cameraCutscene';
import TabletopCamera from '../tabletop/TabletopCamera';
import WeatherEnvironment from '../tabletop/WeatherEnvironment';
import {cinematicWeather} from '../../utils/tabletopWeather';
import HandheldCameraMotion from '../tabletop/HandheldCameraMotion';

export class MapPreviewBoundary extends Component {
 state={error:false};
 static getDerivedStateFromError(){return {error:true};}
 render(){return this.state.error?<div className="cs-map-error" role="alert">Não foi possível abrir o mapa 3D. Confira os arquivos do modelo e a aceleração gráfica.<button type="button" onClick={()=>this.setState({error:false})}>Tentar novamente</button></div>:this.props.children;}
}
function RecordedCamera({recording,time}) {
 const {camera}=useThree();
 useFrame(()=>{
  const pose=cameraRecordingPose(recording,time);if(!pose)return;
  camera.position.set(...pose.position);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.lookAt(...pose.target);
 },-1);
 return null;
}
function TokenArt({token,time,onSelectToken}) {
 const ref=useRef(null);
 useFrame(({camera})=>{if(ref.current && token.billboard!==false)ref.current.rotation.y=Math.atan2(camera.position.x-token.position[0],camera.position.z-token.position[2]);});
 return <group ref={ref} position={token.position} rotation={[0,token.rotation || 0,0]} onClick={onSelectToken?event=>{event.stopPropagation();if(event.delta<=4)onSelectToken(token.id);}:undefined}><AnimatedTokenArt image={token.image} animation={token.animation || {enabled:false}} id={token.id} height={token.height || .65} timelineTime={time}/></group>;
}
export default function CutsceneMap3D({scene,recording,time=0,interactive=false,poseRef,cameraSpeed=1,cameraMotion={intensity:0},cameraView='room',focusToken=null,focusRequest=0,shoulderSide=1,onSelectToken}) {
 const weather=cinematicWeather(scene.weather,time);
 return <MapPreviewBoundary key={scene.id}><Canvas shadows dpr={[1,1.5]} camera={{fov:42,near:.05,far:2000}} gl={{antialias:true}}>
  <WeatherEnvironment weather={weather} timelineTime={interactive?undefined:time}/>
  <Suspense fallback={null}><PlacedAssets items={scene.assets || []} selectedId={null} onSelect={()=>{}} doorStates={scene.doorStates || {}}/></Suspense>
  {(scene.tokens || []).map(token=><Suspense key={token.id} fallback={null}>{token.avatar3D?.modelUrl?<group key={token.id} position={token.position} scale={token.scale || .35} rotation={[0,token.rotation || 0,0]}><RealisticAvatarModel avatar={token.avatar3D}/></group>:token.image?<TokenArt key={token.id} token={token} time={interactive?undefined:time} onSelectToken={onSelectToken}/>:null}</Suspense>)}
  {interactive ? <TabletopCamera cinematicSmoothing view={cameraView} cameraSpeed={cameraSpeed} keyboardFocus allowRightLook spawnPose={scene.spawnPoints?.camera} spawnKey={scene.id} onPoseSample={pose=>{if(poseRef)poseRef.current=pose;}} mode={focusToken?'character':'free'} overShoulder shoulderSide={shoulderSide} focusRequest={focusRequest} followPosition={focusToken?[focusToken.position[0],focusToken.position[2]]:null} followHeight={focusToken?.height || .65} followElevation={focusToken?.position[1] || 0}/> : <RecordedCamera recording={recording} time={time}/>} 
  <HandheldCameraMotion {...cameraMotion} timelineTime={interactive?undefined:time}/>
 </Canvas></MapPreviewBoundary>;
}
