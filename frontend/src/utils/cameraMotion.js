// Exponential easing keeps the same response across refresh rates.
export function easeCameraAngle(current,target,delta,reduced=false){
 if(reduced || Math.abs(target-current)<.001) return target;
 return current+(target-current)*(1-Math.exp(-9*Math.max(0,Math.min(delta,.05))));
}
export function cameraDamping(delta){
 return 1-Math.pow(1-.045,Math.max(0,Math.min(delta,.05))*60);
}
