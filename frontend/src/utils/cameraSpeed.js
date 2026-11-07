export const CAMERA_SPEED_KEY='darkness:tabletop:camera-speed';
export function normalizeCameraSpeed(value){
 const number=Number(value);
 return Number.isFinite(number)?Math.max(.01,Math.min(5,Math.round(number*100)/100)):1;
}
export function adjustCameraSpeed(value,direction){
 const speed=normalizeCameraSpeed(value);
 return normalizeCameraSpeed(speed+direction*(speed<.25 || (direction<0 && speed<=.25) ? .01 : .25));
}
