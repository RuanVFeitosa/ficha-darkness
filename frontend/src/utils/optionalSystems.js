export const OPTIONAL_SYSTEMS = {
 ammo: {name: 'Contagem de balas', rules: 'Cada ataque com arma de fogo consome uma bala, mesmo se errar. Recarregar transfere munição da reserva para o carregador.'},
 survival: {name: 'Fome e sede', rules: 'O mestre ajusta os contadores de fome e sede de cada personagem conforme a passagem do tempo.'},
};
export const bounded = (value, max = 9999) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
export function applyOptionalAction(state, action) {
 const systems = JSON.parse(JSON.stringify(state.optionalSystems || []));
 if (action.type === 'optionalCreate') {
  const preset = OPTIONAL_SYSTEMS[action.kind];
  if (!action.id || systems.some(s => s.id === action.id)) throw new Error('Identificação de sistema inválida.');
  if (!preset && !String(action.name || '').trim()) throw new Error('Informe o nome do sistema.');
  if (preset && systems.some(s => s.kind === action.kind)) throw new Error('Este sistema já está cadastrado.');
  if (systems.length >= 20) throw new Error('Limite de 20 sistemas por campanha.');
  systems.push({id: action.id, kind: preset ? action.kind : 'custom', name: preset?.name || String(action.name).trim().slice(0,100), rules: preset?.rules || String(action.rules || '').slice(0,4000), enabled: false, participants: {}});
 } else {
  const system = systems.find(s => s.id === action.id);
  if (!system) throw new Error('Sistema não encontrado.');
  if (action.type === 'optionalToggle') system.enabled = !system.enabled;
  else if (action.type === 'optionalEdit') {system.rules = String(action.rules || '').slice(0,4000); system.name = String(action.name || system.name).trim().slice(0,100) || system.name;}
  else if (action.type === 'optionalRemove') systems.splice(systems.indexOf(system),1);
  else if (action.type === 'optionalSurvival' && system.kind === 'survival') {
   if (!['hunger','thirst'].includes(action.key)) throw new Error('Contador inválido.');
   system.participants ||= {};
   const person = system.participants[action.playerId] ||= {hunger:0,thirst:0};
   person[action.key] = bounded(Number(person[action.key] || 0) + Number(action.delta || 0), 10);
  } else throw new Error('Ação inválida.');
 }
 return {...state, optionalSystems:systems, revision:state.revision+1};
}
export const ammoEnabled = campaign => (campaign?.mecanicasEspeciais?.optionalSystems || []).some(s => s.kind === 'ammo' && s.enabled);
export function weaponAmmo(item) {
 const capacity = bounded(item.armaStatus?.mag);
 return {capacity, loaded:bounded(item.municaoAtual ?? capacity,capacity), reserve:bounded(item.municaoReserva ?? 0)};
}
export function changeWeaponAmmo(item, action, value) {
 const {capacity,loaded,reserve} = weaponAmmo(item);
 if (!capacity) return item;
 if (action === 'fire') {if (!loaded) throw new Error('Arma sem balas. Recarregue antes de atacar.'); return {...item,municaoAtual:loaded-1,municaoReserva:reserve};}
 if (action === 'reload') {const count=Math.min(capacity-loaded,reserve);return {...item,municaoAtual:loaded+count,municaoReserva:reserve-count};}
 return {...item,municaoAtual:loaded,municaoReserva:bounded(value)};
}
