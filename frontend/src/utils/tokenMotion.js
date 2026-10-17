// Frame-rate independent interpolation. Large teleports settle immediately.
export function suavizarPosicaoToken(current, destination, delta) {
  const dx=destination[0]-current[0], dz=destination[1]-current[1];
  const distance=Math.hypot(dx,dz);
  if(distance>12 || distance<0.001) return [...destination];
  const factor=1-Math.exp(-Math.min(Math.max(delta,0),0.1)*14);
  return [current[0]+dx*factor,current[1]+dz*factor];
}
