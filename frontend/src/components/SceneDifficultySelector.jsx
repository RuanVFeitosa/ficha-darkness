import React from 'react';
import {difficultyOptions} from '../utils/sceneDifficulty';
export default function SceneDifficultySelector({scene,enemies,selected,onChange,readOnly=false}) {
 const options=difficultyOptions(scene,enemies);
 if(readOnly) {const active=options.find(option=>option.id===selected) || options[0];return <div className="tt3-difficulty-selector"><span>{active.category} · {active.label}</span><strong>Dificuldade {active.value} · definida pelo mestre</strong></div>;}
 return <label className="tt3-difficulty-selector">Contexto da rolagem<select aria-label="Contexto da rolagem" value={selected} onChange={event=>onChange(event.target.value)}>{['Ambiente','Combate','Conflitos'].map(category=><optgroup key={category} label={category}>{options.filter(option=>option.category===category).map(option=><option key={option.id} value={option.id}>{option.label} · Dificuldade {option.value}</option>)}</optgroup>)}</select></label>;
}