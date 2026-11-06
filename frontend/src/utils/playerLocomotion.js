import {normalizeCameraSpeed} from './cameraSpeed';
// Smooth direction changes without adding drift after releasing the controls.
export function playerLocomotion(velocity,input,delta,speed=1) {
  const dt=Math.max(0,Math.min(delta,.05));
  const length=Math.hypot(...input);
  if(!length) return {velocity:[0,0],offset:[0,0]};
  const target=input.map(value=>value/length*.65*normalizeCameraSpeed(speed));
  const decay=Math.exp(-22*dt);
  return {
    velocity:target.map((value,i)=>value+(velocity[i]-value)*decay),
    offset:target.map((value,i)=>value*dt+(velocity[i]-value)*(1-decay)/22),
  };
}

export function walkingPose(distance,speed,weight=1) {
  const stride=distance/.42*Math.PI*2;
  const amount=Math.min(1,Math.max(0,speed/.65))*weight;
  return {lift:(1-Math.cos(stride*2))*.009*amount,roll:Math.sin(stride)*.012*amount};
}
