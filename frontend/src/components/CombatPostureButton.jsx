import React from 'react';
import {normalizeTokenAnimation} from '../utils/tokenAnimation';
export default function CombatPostureButton({active,animation,onChange,onNotice}) {
 const config=normalizeTokenAnimation(animation);
 function toggle(){
  if(active){onChange(false);onNotice?.('Postura normal ativada.');return;}
  if(!config.combatBackImage && !config.combatImage){onNotice?.('Esta ficha ainda não tem uma versão de combate. Adicione Combate de frente ou Combate de costas no Estúdio de Tokens e salve.');return;}
  onChange(true);
  onNotice?.(config.combatBackImage ? 'Postura de combate ativada.' : 'Postura de combate ativada com a imagem de frente. Adicione Combate de costas no Estúdio para manter a visão por trás.');
 }
 return <button type="button" className="tt3-combat-posture" aria-pressed={active} onClick={toggle}>{active ? 'Sair da postura de combate' : 'Postura de combate'}</button>;
}
