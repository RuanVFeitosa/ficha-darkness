const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const WEAPON_DAMAGE={
 'soco ou chute':'1d6+2','coronhada':'1d8+2','cassetete':'2d6','soqueira':'2d6+1','punhal':'2d6+1','faca de combate':'2d8+1','martelo':'2d10+1','facao':'2d10+1','espada leve':'2d10+1','espada media':'3d8+1','machado de lenhador':'3d10','espada pesada':'3d10+1',
 'arco':'2d10+1','arco convencional':'2d10+1','pistola':'2d10+3','submetralhadora':'3d8+2','revolver de alto calibre':'2d12+3','fuzil de assalto':'3d10+3','escopeta':'4d8+3','rifle de precisao':'3d12+4','armamento pesado':'4d12+2'
};
export function atualizarDanoArma(item){
 if(!item?.armaStatus)return item;
 const name=key(item.nome),type=key(item.armaStatus.tipo);
 const category=Object.keys(WEAPON_DAMAGE).find(entry=>name===entry||name.startsWith(entry+' '));
 const damage=WEAPON_DAMAGE[category]||WEAPON_DAMAGE[type];
 const status={...item.armaStatus};
 if(damage)status.dmg=damage;
 if(item.categoria==='armas-fogo'||['pistola','submetralhadora','revolver de alto calibre','fuzil de assalto','escopeta','rifle de precisao','armamento pesado','arco'].includes(type)){
  for(const field of ['hipfire','precision','control','mobility'])delete status[field];
 }
 return {...item,armaStatus:status};
}

export function rolarDanoTabela(formula,modificadores=[],random=Math.random,limite=8){
 const match=String(formula).replace(/\s/g,'').match(/^(\d+)d(4|6|8|10|12|20|100)([+-]\d+)?$/i);
 if(!match)throw new Error('Dano inválido');
 const quantidade=Math.max(0,Math.min(limite,Number(match[1])+modificadores.reduce((sum,value)=>sum+Math.sign(Number(value)||0),0)));
 const faces=Number(match[2]),bonus=Number(match[3]||0);
 const dados=Array.from({length:quantidade},()=>Math.floor(random()*faces)+1);
 return {dados,faces,formula:`${quantidade}d${faces}${bonus?`${bonus>0?'+':''}${bonus}`:''}`,total:Math.max(0,dados.reduce((sum,value)=>sum+value,bonus))};
}
