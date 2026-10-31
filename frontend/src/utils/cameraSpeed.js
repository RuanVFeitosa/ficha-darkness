export const CAMERA_SPEED_KEY='darkness:tabletop:camera-speed';
export function normalizeCameraSpeed(value){
 const number=Number(value);
 return Number.isFinite(number)?Math.max(.25,Math.min(5,Math.round(number*100)/100)):1;
}
