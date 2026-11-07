import {useCallback,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {shoulderCameraTarget} from '../../utils/shoulderCamera';
import {cameraDamping,smoothCameraTranslation} from '../../utils/cameraMotion';
import {normalizeCameraSpeed} from '../../utils/cameraSpeed';
import {normalizePlayerDistance,minimumPlayerDistance} from './PlayerCameraDistance';

const CAMERA_PRESETS = {
  room: { position: [10,8,12], target: [0,0.7,0], fov: 42 },
  cinema: { position: [-8,2.35,10], target: [0,1.15,0], fov: 42 },
  panorama: { position: [10,8,12], target: [0,0.7,0], fov: 65 },
  detail: { position: [10,8,12], target: [0,0.7,0], fov: 28 },
};

export default function Camera({view,cameraSpeed=1,allowRightLook=true,characterDistance=null,overShoulder=false,shoulderSide=1,interactionLocked=false,mode="free",followPosition=null,followHeight=0.65,followElevation=0,getFollowPose,sheetFocus=false,getSheetBounds,focusRequest=0,syncedPose=null,onPoseChange,onPoseSample,spawnPose=null,spawnKey="",touchNavigation=false,keyboardFocus=false,cinematicSmoothing=false}) {
  const {camera,gl,scene}=useThree();
  const controls=useRef();
  const cameraSpeedRef=useRef(1);
  cameraSpeedRef.current=normalizeCameraSpeed(cameraSpeed);
  const pressedKeys=useRef(new Set());
  const translationVelocity=useRef([0,0,0]);
  useEffect(()=>{translationVelocity.current=[0,0,0];},[spawnKey,mode,interactionLocked]);
  const lookDrag=useRef(null);
  const smoothLook=useRef(null);
  const distanceTarget=useRef(null);
  const smoothShoulder=useRef(shoulderSide);
  const firstPersonPose=useRef(null);
  useEffect(()=>{firstPersonPose.current=null;},[spawnKey]);
  useEffect(()=>{distanceTarget.current=mode==="character" && characterDistance!==null ? normalizePlayerDistance(characterDistance) : null;},[characterDistance,mode,spawnKey]);
  useEffect(()=>{smoothLook.current=null;},[interactionLocked,mode,view,spawnKey,sheetFocus,focusRequest]);
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
  const viewFovTransition=useRef(null);
  const characterViewInitialized=useRef(false);
  const transitionFov=useCallback((target,smooth=true) => {
    if (smooth && view!=="cinema" && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      viewFovTransition.current={from:camera.fov,to:target,elapsed:0};
    } else {
      viewFovTransition.current=null;
      camera.fov=target;
      camera.updateProjectionMatrix();
    }
  },[camera,view]);
  const right=useMemo(() => new THREE.Vector3(),[]);
  const movement=useMemo(() => new THREE.Vector3(),[]);
  const desiredTarget=useMemo(() => new THREE.Vector3(),[]);
  useEffect(() => {
    const orbit=new OrbitControls(camera,gl.domElement);
    orbit.enableDamping=true;
    orbit.dampingFactor=0.045;
    orbit.enableRotate=true;
    orbit.enablePan=true;
    orbit.enableZoom=true;
    orbit.zoomToCursor=true;
    orbit.screenSpacePanning=true;
    orbit.rotateSpeed=0.18;
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
  useEffect(()=>{
    const orbit=controls.current;
    if(!orbit) return;
    const orbital=mode==='character' && view!=='firstPerson';
    orbit.enablePan=mode!=='character';
    orbit.zoomToCursor=mode!=='character';
    orbit.minPolarAngle=orbital && touchNavigation ? .45 : .01;
    orbit.minDistance=orbital ? minimumPlayerDistance(followHeight) : 0.08;
    // Permit looking above the horizon without flipping over the vertical pole.
    orbit.maxPolarAngle=orbital ? Math.PI-.15 : Math.PI-0.01;
  },[mode,view,followHeight,touchNavigation]);
  useEffect(()=>{if(controls.current)controls.current.mouseButtons.RIGHT=allowRightLook ? THREE.MOUSE.ROTATE : null;},[allowRightLook]);
  useEffect(()=>{const orbit=controls.current;if(!orbit)return;const factor=normalizeCameraSpeed(cameraSpeed);orbit.rotateSpeed=(touchNavigation ? .65 : .18)*factor;orbit.panSpeed=.28*factor;orbit.zoomSpeed=1.6*factor;orbit.keyPanSpeed=18*factor;},[cameraSpeed,touchNavigation]);
  useEffect(() => {
    const touches=touchPoints.current;
    const canvas=gl.domElement;
    const finishLook=() => {
      if(!lookDrag.current) return;
      lookDrag.current=null;
      if(controls.current) controls.current.enabled=!interactionLocked && mode!=="master" && view!=="firstPerson";
    };
    const startLook=(event) => {
      if(keyboardFocus)canvas.focus({preventScroll:true});
      if(event.button===2 && event.pointerType!=="touch" && !allowRightLook) return;
      if(event.button===0 && event.pointerType!=="touch") smoothLook.current=null;
      if(interactionLocked || !controls.current || !["free","character"].includes(mode)) return;
      // Use the same orbit gesture over the entire player canvas. Mixing a
      // stationary look on scenery with orbit on tokens made touch unpredictable
      // and let orbit's polar clamp move the camera upwards after looking up.
      if(event.pointerType==='touch' && touchNavigation && mode==='character' && view!=='firstPerson') {
        stationaryLook.current=false;
        stationaryFollow.current=null;
        smoothLook.current=null;
        return;
      }
      if(event.pointerType==="touch") {
        touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(touchPoints.current.size===2) {lookDrag.current=null;smoothLook.current=null;pinchDistance.current=null;controls.current.enabled=false;event.preventDefault();event.stopImmediatePropagation();return;}
        const ray=new THREE.Raycaster();const bounds=canvas.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),camera);
        const hit=scene ? ray.intersectObjects(scene.children,true)[0] : null;
        let object=hit?.object;while(object) {if(object.userData?.tokenInteraction && !touchNavigation) return;object=object.parent;}
      }
      if((event.button!==2 && !(view==="firstPerson" && event.button===0) && event.pointerType!=="touch") || !["free","character"].includes(mode) || interactionLocked || !controls.current) return;
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
      const dx=orbit.target.x-camera.position.x,dy=orbit.target.y-camera.position.y,dz=orbit.target.z-camera.position.z;
      const distance=Math.max(Math.hypot(dx,dy,dz),.08);
      const yaw=Math.atan2(dx,dz),pitch=Math.asin(Math.max(-1,Math.min(1,dy/distance)));
      smoothLook.current={yaw,pitch,targetYaw:yaw,targetPitch:pitch,distance};
      lookDrag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    };
    const moveLook=(event) => {
      if(event.pointerType==="touch" && touchPoints.current.has(event.pointerId)) {
        touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(touchPoints.current.size===2) {
          event.preventDefault();event.stopImmediatePropagation();
          if(touchNavigation && view==='firstPerson') {pinchDistance.current=null;return;}
          const [a,b]=[...touchPoints.current.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);
          if(pinchDistance.current && distance>0) {const orbit=controls.current;const currentDistance=Math.hypot(camera.position.x-orbit.target.x,camera.position.y-orbit.target.y,camera.position.z-orbit.target.z);const nextDistance=Math.max(.2,Math.min(500,currentDistance*pinchDistance.current/distance));const factor=nextDistance/Math.max(currentDistance,.001);camera.position.set(orbit.target.x+(camera.position.x-orbit.target.x)*factor,orbit.target.y+(camera.position.y-orbit.target.y)*factor,orbit.target.z+(camera.position.z-orbit.target.z)*factor);orbit.update();}
          pinchDistance.current=distance;return;
        }
      }
      const drag=lookDrag.current;
      if(!drag || drag.id!==event.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const look=smoothLook.current;
      if(!look) return;
      look.targetYaw-=(event.clientX-drag.x)*.0035*cameraSpeedRef.current;
      look.targetPitch=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,look.targetPitch-(event.clientY-drag.y)*.0035*cameraSpeedRef.current));
      drag.x=event.clientX;
      drag.y=event.clientY;
    };
    const endLook=(event) => {
      if(event.pointerType==="touch") {touchPoints.current.delete(event.pointerId);pinchDistance.current=null;if(!touchPoints.current.size && controls.current) controls.current.enabled=!interactionLocked && mode!=="master" && view!=="firstPerson";}
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
      touches.clear();smoothLook.current=null;pinchDistance.current=null;
      canvas.removeEventListener("pointerdown",startLook,true);
      window.removeEventListener("pointermove",moveLook,true);
      window.removeEventListener("pointerup",endLook,true);
      window.removeEventListener("pointercancel",endLook,true);
      window.removeEventListener("blur",finishLook);
    };
  },[camera,gl,scene,interactionLocked,mode,allowRightLook,view,touchNavigation,keyboardFocus]);
  useEffect(() => {
    if(!keyboardFocus)return;
    const canvas=gl.domElement,previousTabIndex=canvas.tabIndex;
    canvas.tabIndex=0;
    const focus=()=>canvas.focus({preventScroll:true});
    canvas.addEventListener('pointerdown',focus,true);
    return()=>{canvas.removeEventListener('pointerdown',focus,true);canvas.tabIndex=previousTabIndex;};
  },[gl,keyboardFocus]);
  useEffect(() => {
    const navigationKeys=new Set(["w","a","s","d","q","e","arrowup","arrowdown","arrowleft","arrowright"]);
    const isEditable=(target) => target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, button")));
    const onKeyDown=(event) => {
      const key=event.key.toLowerCase();
      if(!navigationKeys.has(key) || isEditable(event.target) || (keyboardFocus && gl.domElement!==document.activeElement)) return;
      pressedKeys.current.add(key);
      event.preventDefault();
    };
    const onKeyUp=(event) => pressedKeys.current.delete(event.key.toLowerCase());
    const clearKeys=() => {pressedKeys.current.clear();translationVelocity.current=[0,0,0];};
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",onKeyUp);
    window.addEventListener("blur",clearKeys);
    const canvas=gl.domElement;
    if(keyboardFocus)canvas.addEventListener('blur',clearKeys);
    return () => {
      window.removeEventListener("keydown",onKeyDown);
      window.removeEventListener("keyup",onKeyUp);
      window.removeEventListener("blur",clearKeys);
      canvas.removeEventListener('blur',clearKeys);
    };
  },[gl,keyboardFocus]);
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
    if(overShoulder) {
      controls.current.target.set(...shoulderCameraTarget([x,z],height,ground,[0,-1],shoulderSide));
      camera.position.set(x+height*.32*shoulderSide,ground+height*.86,z+height*.95);
    }
    camera.fov=overShoulder ? 48 : 50;
    camera.near=0.01;
    camera.updateProjectionMatrix();
    controls.current.update();
    characterCameraInitialized.current=true;
  },[camera,followPosition,followHeight,followElevation,mode,focusRequest,overShoulder,shoulderSide]);
  useEffect(() => {
    if(!focusRequest || appliedFocusRequest.current===focusRequest || mode!=="character" || !controls.current || !Array.isArray(followPosition)) return;
    appliedFocusRequest.current=focusRequest;
    stationaryLook.current=false;stationaryFollow.current=null;
    const x=Number(followPosition[0])||0,z=Number(followPosition[1])||0;
    const height=Math.max(0.05,Number(followHeight)||0.65),ground=Number(followElevation)||0;
    sheetCameraTransition.current={from:{position:camera.position.toArray(),target:controls.current.target.toArray(),fov:camera.fov},to:{position:[x+height*0.35,ground+height*0.75,z+height*1.1],target:[x+height*0.35,ground+height*0.65,z],fov:50},elapsed:0};
    if(overShoulder) sheetCameraTransition.current.to={position:[x+height*.32,ground+height*.86,z+height*.95],target:shoulderCameraTarget([x,z],height,ground),fov:48};
  },[camera,mode,focusRequest,followPosition,followHeight,followElevation,overShoulder]);
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
        const panelBounds=getSheetBounds?.();
        const canvasBounds=gl.domElement.getBoundingClientRect();
        // The remaining field starts at the panel's right edge. Its centre has
        // this NDC offset, keeping the character visible beside a compact sheet.
        const screenOffset=panelBounds && canvasBounds.width>0 ? Math.max(0,Math.min(.9,(panelBounds.right-canvasBounds.left)/canvasBounds.width)) : .64;
        const desiredRight=length*Math.tan((Number(camera.fov)||50)*Math.PI/360)*(Number(camera.aspect)||16/9)*screenOffset;
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
  },[camera,gl,mode,sheetFocus,getSheetBounds,followPosition,followHeight,followElevation]);
  useEffect(() => {
    if(mode!=="free" || !controls.current) return;
    if(focusRequest>0) {sheetCameraTransition.current=null;cameraPresetInitialized.current=true;}
    const preset=CAMERA_PRESETS[view] || CAMERA_PRESETS.room;
    if(!cameraPresetInitialized.current) camera.position.set(...preset.position);
    transitionFov(preset.fov,cameraPresetInitialized.current);
    camera.near=0.05;
    camera.far=1200;
    camera.updateProjectionMatrix();
    if(!cameraPresetInitialized.current) controls.current.target.set(...preset.target);
    cameraPresetInitialized.current=true;
    controls.current.update();
  },[camera,mode,view,focusRequest,transitionFov]);
  useEffect(() => {
    if(mode!=="character" || !view) return;
    transitionFov(view==="panorama" ? 65 : view==="detail" ? 28 : overShoulder ? 48 : 50,characterViewInitialized.current);
    characterViewInitialized.current=true;
  },[camera,mode,view,transitionFov,overShoulder]);
  useEffect(() => {
    if(appliedCameraSpawn.current?.key!==spawnKey) {
      appliedCameraSpawn.current={key:spawnKey,applied:false};
    }
    if(appliedCameraSpawn.current.applied) return;
    if(mode!=="free" || !controls.current || !Array.isArray(spawnPose?.position) || !Array.isArray(spawnPose?.target)) return;
    viewFovTransition.current=null;
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
    if (controls.current) controls.current.enabled = view!=="firstPerson" && !interactionLocked && mode!=="master" && !lookDrag.current && touchPoints.current.size<2;
    if (interactionLocked || mode!=="free") pressedKeys.current.clear();
  }, [interactionLocked,mode,view]);
  useEffect(()=>{
    const previous=firstPersonPose.current;
    if(view!=="firstPerson" && previous && controls.current){
      const shift=Array.isArray(followPosition) ? [followPosition[0]-previous.follow[0],(Number(followElevation)||0)-previous.elevation,followPosition[1]-previous.follow[1]] : [0,0,0];
      const to={position:previous.position.map((v,i)=>v+shift[i]),target:previous.target.map((v,i)=>v+shift[i]),fov:previous.fov};
      if(mode==="character")sheetCameraTransition.current={from:{position:camera.position.toArray(),target:controls.current.target.toArray(),fov:camera.fov},to,elapsed:0};
      else {camera.position.set(...to.position);controls.current.target.set(...to.target);controls.current.update();}
      firstPersonPose.current=null;
    }
  },[view,mode,camera,followPosition,followElevation]);
  useFrame((_,delta) => {
    const renderedPose=getFollowPose?.();
    const visualPosition=renderedPose?.position || followPosition;
    const visualElevation=renderedPose?.elevation ?? followElevation;
    const orbit=controls.current;
    if(!orbit) return;
    const samplePose=()=>{if(onPoseSample)onPoseSample({position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov});};
    orbit.dampingFactor=cinematicSmoothing ? 1-Math.exp(-Math.min(delta,.05)/.45) : touchNavigation ? 1-Math.exp(-12*Math.min(delta,.05)) : cameraDamping(delta);
    const fovTransition=viewFovTransition.current;
    if (fovTransition && mode!=="master" && !sheetCameraTransition.current) {
      fovTransition.elapsed+=Math.min(delta,0.05);
      const progress=Math.min(1,fovTransition.elapsed/0.65);
      const eased=progress*progress*(3-2*progress);
      camera.fov=fovTransition.from+(fovTransition.to-fovTransition.from)*eased;
      camera.updateProjectionMatrix();
      if (progress===1) viewFovTransition.current=null;
    }
    if(view==="firstPerson" && Array.isArray(visualPosition)){
      orbit.enabled=false;
      if(!firstPersonPose.current){
        firstPersonPose.current={position:camera.position.toArray(),target:orbit.target.toArray(),fov:camera.fov,follow:[...visualPosition],elevation:Number(visualElevation)||0};
        const dx=orbit.target.x-camera.position.x,dz=orbit.target.z-camera.position.z;
        firstPersonPose.current.yaw=Math.atan2(dx,dz);firstPersonPose.current.pitch=0;
        const damping=orbit.enableDamping;orbit.enableDamping=false;orbit.update();orbit.enableDamping=damping;
        sheetCameraTransition.current=null;
      }
      const pose=firstPersonPose.current,look=smoothLook.current;
      if(look){const alpha=1-Math.exp(-12*Math.min(delta,.05));look.yaw+=(look.targetYaw-look.yaw)*alpha;look.pitch+=(look.targetPitch-look.pitch)*alpha;pose.yaw=look.yaw;pose.pitch=look.pitch;}
      const alpha=1-Math.exp(-12*Math.min(delta,.05));
      const eye=[Number(visualPosition[0])||0,(Number(visualElevation)||0)+Math.max(.05,Number(followHeight)||.65)*.9,Number(visualPosition[1])||0];
      camera.position.set(camera.position.x+(eye[0]-camera.position.x)*alpha,camera.position.y+(eye[1]-camera.position.y)*alpha,camera.position.z+(eye[2]-camera.position.z)*alpha);
      const horizontal=Math.cos(pose.pitch);
      orbit.target.set(camera.position.x+Math.sin(pose.yaw)*horizontal,camera.position.y+Math.sin(pose.pitch),camera.position.z+Math.cos(pose.yaw)*horizontal);
      orbit.update();samplePose();return;
    }
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
      samplePose();return;
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
    if(mode==="character" && stationaryLook.current && Array.isArray(visualPosition)) {
      const next=[Number(visualPosition[0])||0,Number(visualElevation)||0,Number(visualPosition[1])||0];
      const previous=stationaryFollow.current || next;
      movement.set(next[0]-previous[0],next[1]-previous[1],next[2]-previous[2]);
      camera.position.add(movement);orbit.target.add(movement);
      stationaryFollow.current=next;
    }
    if(mode==="character" && !stationaryLook.current && Array.isArray(visualPosition)) {
      const height=Math.max(0.05,Number(followHeight)||0.65);
      desiredTarget.set((Number(visualPosition[0])||0)+(sheetFocus ? -height*1.7*Math.tan(25*Math.PI/180)*(Number(camera.aspect)||16/9)*0.64 : height*0.35),(Number(visualElevation)||0)+height*(sheetFocus ? 0.5 : 0.65),Number(visualPosition[1])||0);
      if(overShoulder && !sheetFocus) {
        smoothShoulder.current+=(shoulderSide-smoothShoulder.current)*(1-Math.exp(-12*Math.min(delta,.05)));
        desiredTarget.set(...shoulderCameraTarget(visualPosition,height,visualElevation,[
          orbit.target.x-camera.position.x,orbit.target.z-camera.position.z,
        ],smoothShoulder.current));
      }
      if(sheetFocus && sheetCameraPose.current?.followOffset) {
        const offset=sheetCameraPose.current.followOffset;
        desiredTarget.set((Number(visualPosition[0])||0)+offset[0],(Number(visualElevation)||0)+offset[1],(Number(visualPosition[1])||0)+offset[2]);
      }
      movement.copy(desiredTarget).sub(orbit.target).multiplyScalar(renderedPose ? 1 : 1-Math.exp(-Math.min(delta,0.05)*10));
      camera.position.add(movement);
      orbit.target.add(movement);
    }
    if(mode==="free" && !interactionLocked && (pressedKeys.current.size || (cinematicSmoothing && translationVelocity.current.some(value=>Math.abs(value)>1e-7)))) {
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
      if(cinematicSmoothing){
        if(movement.lengthSq()>0)movement.normalize().multiplyScalar(.65*cameraSpeedRef.current);
        const next=smoothCameraTranslation(translationVelocity.current,movement.toArray(),delta);
        translationVelocity.current=next.velocity;
        movement.set(...next.offset);camera.position.add(movement);orbit.target.add(movement);
      } else if(movement.lengthSq()>0) {
        const speed=0.65*cameraSpeedRef.current;
        movement.normalize().multiplyScalar(speed*Math.min(delta,0.05));
        camera.position.add(movement);
        orbit.target.add(movement);
      }
    }
    if(distanceTarget.current!==null && mode==="character") {
      const dx=camera.position.x-orbit.target.x,dy=camera.position.y-orbit.target.y,dz=camera.position.z-orbit.target.z;
      const current=Math.max(.0001,Math.hypot(dx,dy,dz));
      const target=distanceTarget.current;
      const next=current+(target-current)*(1-Math.exp(-9*Math.min(delta,.05)));
      const factor=next/current;
      camera.position.set(orbit.target.x+dx*factor,orbit.target.y+dy*factor,orbit.target.z+(current<=.0001 ? next : dz*factor));
      if(Math.abs(next-target)<.001)distanceTarget.current=null;
    }
    const look=smoothLook.current;
    if(look && !interactionLocked && mode!=="master" && !sheetCameraTransition.current) {
      const alpha=1-Math.exp(-(cinematicSmoothing?7:12)*Math.min(delta,.05));
      look.yaw+=(look.targetYaw-look.yaw)*alpha;
      look.pitch+=(look.targetPitch-look.pitch)*alpha;
      const horizontal=Math.cos(look.pitch)*look.distance;
      orbit.target.set(camera.position.x+Math.sin(look.yaw)*horizontal,camera.position.y+Math.sin(look.pitch)*look.distance,camera.position.z+Math.cos(look.yaw)*horizontal);
      if(!lookDrag.current && Math.abs(look.targetYaw-look.yaw)+Math.abs(look.targetPitch-look.pitch)<.00001) smoothLook.current=null;
    }
    orbit.update();
    samplePose();
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
  },-1);
  return null;
}
