export function pageTransitionSystem(search) {
  const params=new URLSearchParams(search);
  const explicit=params.get('sistema');
  if(explicit) return explicit==='espiral' ? 'espiral' : 'darkness';
  const master=params.get('mestre')==='1' || params.get('papel')==='mestre' || params.get('criarMapa3d')==='1';
  if(master) {
    try {if(localStorage.getItem('darkness_dashboard_sistema')==='espiral') return 'espiral';} catch {}
  }
  return 'darkness';
}