// Offsets rotate with the view, keeping the character on the left at every yaw.
export function shoulderCameraTarget(position,height,elevation,viewDirection=[0,-1],side=1) {
 const size=Math.max(.05,Number(height)||.65);
 const length=Math.hypot(...viewDirection)||1;
 const [fx,fz]=length>0 && Math.hypot(...viewDirection)>0 ? viewDirection.map(value=>value/length) : [0,-1];
 const lateral=size*.32*Math.max(-1,Math.min(1,side)), ahead=size*.45;
 return [(Number(position[0])||0)-fz*lateral+fx*ahead,
  (Number(elevation)||0)+size*.78,
  (Number(position[1])||0)+fx*lateral+fz*ahead];
}

// Follow actual travel, ignoring tiny jitter and teleports; turn via the short arc.
export function movementCameraHeading(previous,position,forward,delta,height=.65) {
 const yaw=previous?.yaw ?? Math.atan2(forward[0],forward[1]);
 const dx=previous ? position[0]-previous.position[0] : 0,dz=previous ? position[1]-previous.position[1] : 0;
 const distance=Math.hypot(dx,dz);
 const target=distance>.00005 && distance<Math.max(.5,height*2) ? Math.atan2(dx,dz) : (previous?.target ?? yaw);
 const difference=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));
 return {position:[...position],target,yaw:yaw+difference*(1-Math.exp(-5*Math.max(0,Math.min(delta,.05))))};
}
