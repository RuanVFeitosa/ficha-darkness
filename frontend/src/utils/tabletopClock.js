const DAY = 1440;
export const DEFAULT_SESSION_CLOCK = { enabled:false, running:true, minutes:540, rate:10, anchor:0 };
export function normalizeSessionClock(value = {}) {
  return { ...DEFAULT_SESSION_CLOCK, ...value,
    minutes:Math.max(0, Number(value.minutes ?? DEFAULT_SESSION_CLOCK.minutes) || 0),
    rate:Math.max(1, Math.min(120, Number(value.rate) || 10)),
    anchor:Number(value.anchor) || 0,
  };
}
export function sessionMinutes(value, now = Date.now()) {
  const clock = normalizeSessionClock(value);
  // A heartbeat from the master's session renews this window. A closed session stops advancing.
  const elapsed = clock.enabled && clock.running && clock.anchor ? Math.max(0, Math.min(30000, now - clock.anchor)) : 0;
  return clock.minutes + elapsed / 60000 * clock.rate;
}
export function changeSessionClock(value, patch, now = Date.now()) {
  return { ...normalizeSessionClock(value), minutes:sessionMinutes(value,now), anchor:now, ...patch };
}
export function formatSessionTime(minutes) {
  const time = ((Math.floor(minutes) % DAY) + DAY) % DAY;
  return `${String(Math.floor(time / 60)).padStart(2,'0')}:${String(time % 60).padStart(2,'0')}`;
}
function mixColor(a,b,t) {
  const channels = [1,3,5].map(index => Math.round(parseInt(a.slice(index,index+2),16)*(1-t)+parseInt(b.slice(index,index+2),16)*t));
  return `#${channels.map(value => value.toString(16).padStart(2,'0')).join('')}`;
}
export function daylightWeather(weather, minutes, presets) {
  if (!weather.clock?.enabled) return weather;
  const keys = [[0,'noite'],[300,'noite'],[420,'tarde'],[540,'dia'],[720,'sol'],[990,'dia'],[1080,'tarde'],[1200,'noite'],[1440,'noite']];
  const time = ((minutes % DAY) + DAY) % DAY;
  const index = keys.findIndex(([minute]) => minute > time);
  const [start,a] = keys[index-1], [end,b] = keys[index];
  const linear = (time-start)/(end-start), t = linear*linear*(3-2*linear);
  const result = {...weather};
  for (const field of ['skyColor','fogColor','sunColor']) result[field] = mixColor(presets[a][field],presets[b][field],t);
  for (const field of ['ambient','sun','sunSize']) result[field] = presets[a][field]*(1-t)+presets[b][field]*t;
  const angle = (time-360)/DAY*Math.PI*2;
  result.sunPosition = [Math.cos(angle)*30, Math.max(0.5,Math.sin(angle)*22), -20];
  // Precipitation and wind remain independent of the hour.
  const cloud = Math.max(Number(weather.rain)||0, Number(weather.snow)||0, weather.preset==='nublado' ? .7 : 0);
  result.sun *= 1-cloud*.75;
  result.skyColor = mixColor(result.skyColor,weather.skyColor,cloud*.6);
  result.ambient *= 1-cloud*.3;
  return result;
}
