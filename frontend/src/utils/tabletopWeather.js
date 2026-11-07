import {daylightWeather,normalizeSessionClock} from './tabletopClock';
export const WEATHER_PRESETS = {
  dia: { preset:"dia", label:"Dia", skyColor:"#7db9df", fogColor:"#bfd9e5", sunColor:"#fff0bd", ambient:0.92, sun:2.05, sunSize:1.05, sunPosition:[11,14,-25], fogNear:20, fogFar:75, rain:0, snow:0, wind:0.12 },
  sol: { preset:"sol", label:"Sol forte", skyColor:"#48a4df", fogColor:"#a9d5e9", sunColor:"#fff2af", ambient:1, sun:2.55, sunSize:1.25, sunPosition:[12,15,-25], fogNear:24, fogFar:90, rain:0, snow:0, wind:0.08 },
  tarde: { preset:"tarde", label:"Tarde", skyColor:"#b36f62", fogColor:"#d39a79", sunColor:"#ff9a4f", ambient:0.58, sun:1.7, sunSize:1.35, sunPosition:[14,5,-24], fogNear:16, fogFar:62, rain:0, snow:0, wind:0.16 },
  noite: { preset:"noite", label:"Noite", skyColor:"#07121f", fogColor:"#101d28", sunColor:"#7596bb", ambient:0.13, sun:0.08, sunSize:0.8, sunPosition:[-12,12,-25], fogNear:12, fogFar:52, rain:0, snow:0, wind:0.12 },
  nublado: { preset:"nublado", label:"Nublado", skyColor:"#657178", fogColor:"#879195", sunColor:"#d8e0df", ambient:0.62, sun:0.7, sunSize:1, sunPosition:[9,13,-25], fogNear:12, fogFar:45, rain:0, snow:0, wind:0.35 },
  chuva: { preset:"chuva", label:"Chuva", skyColor:"#25343c", fogColor:"#40515a", sunColor:"#a9c1cb", ambient:0.38, sun:0.38, sunSize:1, sunPosition:[9,12,-25], fogNear:8, fogFar:32, rain:0.82, snow:0, wind:0.48 },
  neve: { preset:"neve", label:"Neve", skyColor:"#9da9ad", fogColor:"#d8dfe0", sunColor:"#f1f7ff", ambient:0.78, sun:0.75, sunSize:1, sunPosition:[8,12,-25], fogNear:7, fogFar:29, rain:0, snow:0.72, wind:0.22 },
  ato3: { preset:"ato3", label:"Ato III", skyColor:"#53070a", fogColor:"#260205", sunColor:"#ff392e", ambient:0.24, sun:1.05, sunSize:1.7, sunPosition:[13,7,-24], fogNear:6, fogFar:34, rain:0.12, snow:0, wind:0.58 },
};
export const DEFAULT_WEATHER = WEATHER_PRESETS.dia;
export function normalizeWeather(value={}) {
 const preset=WEATHER_PRESETS[value?.preset] || DEFAULT_WEATHER;
 const weather={...preset};
 for(const key of [...Object.keys(DEFAULT_WEATHER),'clock'])if(value?.[key]!==undefined)weather[key]=value[key];
 const bounded=(key,min,max)=>{const number=Number(weather[key]);weather[key]=Number.isFinite(number)?Math.max(min,Math.min(max,number)):preset[key];};
 for(const [key,min,max] of [['ambient',0,1.5],['sun',0,3],['sunSize',.3,2.5],['rain',0,1],['snow',0,1],['wind',-1,1],['fogNear',1,100],['fogFar',2,200]])bounded(key,min,max);
 weather.fogFar=Math.max(weather.fogNear+1,weather.fogFar);
 for(const key of ['skyColor','fogColor','sunColor'])if(!/^#[\da-f]{6}$/i.test(weather[key]))weather[key]=preset[key];
 if(!Array.isArray(weather.sunPosition) || weather.sunPosition.length!==3 || !weather.sunPosition.every(Number.isFinite))weather.sunPosition=preset.sunPosition;
 return weather;
}
export function cinematicWeather(value,seconds=0){
 const weather=normalizeWeather(value),clock=normalizeSessionClock(weather.clock);
 const minutes=clock.minutes+(clock.enabled && clock.running?Math.max(0,seconds)/60*clock.rate:0);
 return daylightWeather(weather,minutes,WEATHER_PRESETS);
}
