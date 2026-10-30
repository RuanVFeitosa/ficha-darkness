import { normalizeSessionClock, sessionMinutes, changeSessionClock, formatSessionTime, daylightWeather } from './tabletopClock';

test('tempo usa duração real, velocidade e pausa sem saltos ao trocar os controles', () => {
  const initial={enabled:true,running:true,minutes:540,rate:10,anchor:100000};
  expect(sessionMinutes(initial,130000)).toBe(545);
  const paused=changeSessionClock(initial,{running:false},130000);
  expect(sessionMinutes(paused,999999)).toBe(545);
  const resumed=changeSessionClock(paused,{running:true,rate:60},200000);
  expect(sessionMinutes(resumed,210000)).toBe(555);
  expect(normalizeSessionClock().minutes).toBe(540);
});

test('uma sessão encerrada não deixa o relógio avançar durante horas fora do jogo', () => {
  const clock={enabled:true,running:true,minutes:540,rate:10,anchor:100000};
  expect(sessionMinutes(clock,100000+86400000)).toBe(545);
});

test('horário atravessa meia-noite e o ciclo é contínuo', () => {
  expect(formatSessionTime(1445)).toBe('00:05');
  const presets=Object.fromEntries(['noite','tarde','dia','sol'].map((key,index) => [key,{skyColor:['#000000','#884422','#88bbdd','#99ccff'][index],fogColor:'#888888',sunColor:'#ffffff',ambient:index*.3,sun:index,sunSize:1}]));
  const weather={clock:{enabled:true},rain:.8,snow:0,wind:.4,skyColor:'#445566'};
  const before=daylightWeather(weather,1439.99,presets),after=daylightWeather(weather,1440.01,presets);
  expect(before.skyColor).toBe(after.skyColor);
  expect(after).toMatchObject({rain:.8,snow:0,wind:.4});
  expect(daylightWeather(weather,720,presets).ambient).toBeGreaterThan(after.ambient);
  expect(daylightWeather({...weather,clock:{enabled:false}},720,presets).skyColor).toBe('#445566');
});
