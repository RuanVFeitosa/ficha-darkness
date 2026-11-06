export function visibleToPlayer(value,playerId,master=false) {
 if(master)return true;
 if(value?.hidden)return false;
 if(value?.audience==null)return true;
 const aliases=new Set([String(playerId),String(playerId).replace(/^(espiral|darkness):/,'')]);
 return Array.isArray(value.audience) && value.audience.some(id=>aliases.has(String(id)) || aliases.has(String(id).replace(/^(espiral|darkness):/,'')));
}
export function localCameraMotion(motion,reduction=1) {
 const factor=Math.max(0,Math.min(1,Number(reduction)||0));
 return {...motion,intensity:motion.intensity*factor};
}
export function audioZoneGain(zone,listener,blocked=false) {
 const radius=Math.max(.1,Number(zone.radius)||5);
 const distance=Math.hypot(listener[0]-(Number(zone.x)||0),listener[1]-(Number(zone.y)||0),listener[2]-(Number(zone.z)||0));
 const gain=Math.max(0,1-distance/radius);
 return gain*gain*Math.max(0,Math.min(1,Number(zone.volume) || 0))*(blocked ? .22 : 1);
}
export function nearInteraction(feet,point,height=.65) {
 return Math.hypot(feet[0]-point[0],feet[1]-point[1],feet[2]-point[2])<=Math.max(.7,height*2.5);
}
