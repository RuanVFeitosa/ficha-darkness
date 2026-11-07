import {normalizeWeather,WEATHER_PRESETS,cinematicWeather} from './tabletopWeather';
test('weather presets retain precipitation and safely normalize imported visibility',()=>{
 expect(normalizeWeather({preset:'chuva'})).toMatchObject({rain:.82,wind:.48});
 expect(normalizeWeather({preset:'noite'}).skyColor).toBe(WEATHER_PRESETS.noite.skyColor);
 expect(normalizeWeather({fogNear:30,fogFar:5,rain:99,wind:-99,skyColor:'invalid'})).toMatchObject({fogNear:30,fogFar:31,rain:1,wind:-1,skyColor:WEATHER_PRESETS.dia.skyColor});
});
test('cinematic daylight follows the source timeline and can seek backwards without changing precipitation',()=>{
 const weather={...WEATHER_PRESETS.chuva,clock:{enabled:true,running:true,minutes:540,rate:120}};
 const morning=cinematicWeather(weather,0),evening=cinematicWeather(weather,300);
 expect(evening.skyColor).not.toBe(morning.skyColor);
 expect(evening.rain).toBe(.82);
 expect(cinematicWeather(weather,0)).toEqual(morning);
 expect(cinematicWeather({...weather,clock:{...weather.clock,running:false}},300)).toEqual(cinematicWeather({...weather,clock:{...weather.clock,running:false}},0));
});
