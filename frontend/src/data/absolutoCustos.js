const texto = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const CUSTOS_RITOS = {iniciante:2, intermediario:3, avancado:4, experiente:5, absoluto:6};
export function custoUsoRito(rito={}) {
 const circulo=Number.parseInt(rito.circulo,10);
 return circulo>=1 && circulo<=5 ? circulo+1 : CUSTOS_RITOS[texto(rito.nivelRito || rito.nivel)] ?? 2;
}
export function converterCustoUso(habilidade={}) {
 const grupo=texto(habilidade.grupo);
 if(!['aptidao','habilidade absoluta'].includes(grupo)) return habilidade;
 const anterior=habilidade.custoLegado ?? habilidade.custo;
 const valor=Number.parseInt(anterior,10)||0;
 const categoria=texto(habilidade.categoriaUso);
 const passiva=texto(anterior).includes('passiva') || categoria==='passiva' || String(anterior).trim()==='0 PE';
 const custo=passiva ? 0 : grupo==='habilidade absoluta' ? (valor>10 ? 5 : 4) : ({basica:1,avancada:2,superior:3}[categoria] ?? (valor<=3 ? 1 : valor<=6 ? 2 : 3));
 const categoriaUso=passiva ? 'Passiva' : grupo==='habilidade absoluta' ? 'Absoluta' : ['','Básica','Avançada','Superior'][custo];
 return {...habilidade,custoLegado:anterior,custoAtivacao:custo,categoriaUso,custo:`${custo} PE${passiva ? ' · Passiva' : ''}`};
}
