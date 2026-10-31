import {tokenFlashlight,playerFlashlightPatch,flashlightModeActive,toggleFlashlightMode} from './flashlightAccess';
test('jogador tem UV disponível por padrão e bloqueio prevalece sobre modo salvo ou atualização atrasada',()=>{
 const lanterna={ativa:true,modo:'uv',alcance:25};
 expect(tokenFlashlight({lanterna}).modo).toBe('uv');
 expect(tokenFlashlight({uvPermitida:false,lanterna})).toMatchObject({ativa:true,modo:'normal',alcance:25});
 expect(playerFlashlightPatch({uvPermitida:false},{uvPermitida:true,lanterna})).toEqual({lanterna:{...lanterna,modo:'normal'}});
 expect(playerFlashlightPatch({}, {lanterna})).toEqual({lanterna});
});

test('cada botão liga seu modo e só apaga quando o próprio modo já está ativo',()=>{
 let light={ativa:false,modo:'normal',alcance:25};
 light=toggleFlashlightMode(light,'uv');
 expect(light).toEqual({ativa:true,modo:'uv',alcance:25});
 expect(flashlightModeActive(light,'normal')).toBe(false);
 expect(flashlightModeActive(light,'uv')).toBe(true);
 light=toggleFlashlightMode(light,'normal');
 expect(light).toEqual({ativa:true,modo:'normal',alcance:25});
 expect(flashlightModeActive(light,'uv')).toBe(false);
 light=toggleFlashlightMode(light,'normal');
 expect(light.ativa).toBe(false);
 light=toggleFlashlightMode(light,'uv');
 light=toggleFlashlightMode(light,'uv');
 expect(light).toMatchObject({ativa:false,modo:'uv'});
 light=toggleFlashlightMode(light,'normal');
 expect(light).toMatchObject({ativa:true,modo:'normal'});
});
