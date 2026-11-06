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
