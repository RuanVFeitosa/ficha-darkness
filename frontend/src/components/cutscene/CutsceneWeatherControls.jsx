import React from 'react';
import {WEATHER_PRESETS,normalizeWeather} from '../../utils/tabletopWeather';
import {normalizeSessionClock,formatSessionTime} from '../../utils/tabletopClock';

export default function CutsceneWeatherControls({value,onChange,disabled=false}) {
 const weather=normalizeWeather(value),clock=normalizeSessionClock(weather.clock);
 const patch=change=>onChange(normalizeWeather({...weather,...change,preset:'custom',label:'Personalizado'}));
 const changeClock=change=>patch({clock:{...clock,anchor:0,...change}});
 return <details className="cs-weather-controls"><summary>Clima e iluminação</summary><fieldset disabled={disabled}>
  <label>Atmosfera<select value={weather.preset} onChange={event=>onChange({...WEATHER_PRESETS[event.target.value],clock:{...clock,enabled:false}})}><option value="custom" disabled>Personalizado</option>{Object.entries(WEATHER_PRESETS).map(([key,preset])=><option key={key} value={key}>{preset.label}</option>)}</select></label>
  <label className="cs-check"><input type="checkbox" checked={Boolean(clock.enabled)} onChange={event=>changeClock({enabled:event.target.checked})}/>Iluminação pelo horário</label>
  <label>Horário<input type="time" aria-label="Horário da cinemática" value={formatSessionTime(clock.minutes)} onChange={event=>{if(event.target.value){const [hours,minutes]=event.target.value.split(':').map(Number);changeClock({minutes:hours*60+minutes});}}}/></label>
  <label className="cs-check"><input type="checkbox" checked={Boolean(clock.running)} onChange={event=>changeClock({running:event.target.checked})}/>Avançar horário durante o clipe</label>
  <label>Velocidade do tempo<select value={clock.rate} onChange={event=>changeClock({rate:Number(event.target.value)})}>{[1,5,10,30,60,120].map(rate=><option key={rate} value={rate}>{rate}×</option>)}</select></label>
  {['skyColor','fogColor','sunColor'].map((key,index)=><label key={key}>{['Cor do céu','Cor da neblina','Cor da luz'][index]}<input type="color" value={weather[key]} onChange={event=>patch({[key]:event.target.value})}/></label>)}
  {[['ambient','Luz ambiente',0,1.5,.01],['sun','Força do sol',0,3,.01],['sunSize','Tamanho do sol',.3,2.5,.01],['rain','Chuva',0,1,.01],['snow','Neve',0,1,.01],['wind','Vento',-1,1,.01],['fogNear','Início da névoa',1,30,.1],['fogFar','Alcance visual',8,100,.5]].map(([key,label,min,max,step])=><label key={key}>{label}<span aria-hidden="true">{weather[key]}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={weather[key]} onChange={event=>patch({[key]:Number(event.target.value)})}/></label>)}
  <p className="cs-help">O clima fica salvo neste plano. O horário acompanha a timeline ao pausar ou voltar o cursor.</p>
 </fieldset></details>;
}
