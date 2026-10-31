import React from 'react';
import NumberInput from '../ui/NumberInput';
import {normalizeCameraSpeed} from '../../utils/cameraSpeed';
export default function CameraSpeedControls({value,onChange}){
 const speed=normalizeCameraSpeed(value);
 const change=next=>onChange(normalizeCameraSpeed(next));
 return <section className="tt3-camera-speed"><span className="tt3-kicker">NAVEGAÇÃO</span><h3>Velocidade da câmera</h3><p>Ajuste o deslocamento, a rotação e o zoom para navegar com conforto. Sua preferência fica salva neste navegador.</p><label>Multiplicador<NumberInput aria-label="Velocidade da câmera" min="0.25" max="5" step="0.25" value={speed} onChange={event=>{if(event.target.value!=='')change(event.target.value);}}/></label><input aria-label="Ajuste rápido de velocidade da câmera" type="range" min="0.25" max="5" step="0.25" value={speed} onChange={event=>change(event.target.value)}/><div><button type="button" disabled={speed<=.25} onClick={()=>change(speed-.25)}>− Diminuir</button><output>{speed.toFixed(2)}×</output><button type="button" disabled={speed>=5} onClick={()=>change(speed+.25)}>+ Aumentar</button></div><button type="button" className="tt3-primary" onClick={()=>change(1)}>Restaurar padrão · 1×</button><small>De 0,25× a 5×. Este ajuste não altera a velocidade dos personagens.</small></section>;
}
