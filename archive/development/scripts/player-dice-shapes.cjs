const fs=require('fs'),r='frontend/src/';
fs.writeFileSync(r+'components/EspiralDice.jsx',`import React from 'react';
import '../CSS/EspiralDice.css';
export function EspiralDie({sides}) {
 return <span className={'espiral-die espiral-die-'+sides} role="img" aria-label={'Dado de '+sides+' faces'}><span>{sides}</span></span>;
}
export default function EspiralDice({value}) {
 const parts=String(value ?? '').split(/([△⬡◇⬟⬢d](?:12|10|8|6|4)\\b)/gi);
 return <>{parts.map((part,i)=>/^[△⬡◇⬟⬢d](12|10|8|6|4)$/i.test(part)?<EspiralDie key={i} sides={Number(part.slice(1))}/>:part)}</>;
}
`);
fs.writeFileSync(r+'CSS/EspiralDice.css',`.espiral-die{display:inline-grid!important;place-items:center;vertical-align:middle;width:2em;height:2em;min-width:2em;background:#eee;color:#111!important;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);font:700 13px/1 "Courier New",monospace;letter-spacing:0;text-shadow:none;margin:2px 3px}.espiral-die>span{color:#111!important}.espiral-die-4{clip-path:polygon(50% 0,100% 100%,0 100%)}.espiral-die-4>span{transform:translateY(4px)}.espiral-die-6{clip-path:inset(2px round 1px)}.espiral-die-8{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}.espiral-die-10{clip-path:polygon(50% 0,100% 38%,81% 100%,19% 100%,0 38%)}.pj-resumo-atributos .espiral-die{font-size:12px}.dm-espiral-attributes .espiral-die{font-size:16px}\n`);
function e(f,fn){let s=fs.readFileSync(r+f,'utf8');fs.writeFileSync(r+f,"import EspiralDice from '../components/EspiralDice';\n"+fn(s));}
e('components/CharacterDossier.jsx',s=>s.replace('{String(a.valor)}','{ficha.sistema===\'espiral\'?<EspiralDice value={a.valor}/>:String(a.valor)}'));
for(const f of ['components/EspiralSummary.jsx','components/DossierModal.jsx'])e(f,s=>s.replaceAll('{a.valor}','{<EspiralDice value={a.valor}/>}'));
for(const [f,ex] of [['components/BuildCatalog.jsx','e.damage'],['pages/lojaEspiral.jsx','item.damage']])e(f,s=>s.replaceAll('{espiralDiceText('+ex+')}','{<EspiralDice value={'+ex+'}/>}').replace(/import \{ espiralDiceText \}[^\n]*\n/,''));
e('pages/transformacaoEspiral.jsx',s=>s.replace('{espiralDie(current * 2 + 2)}','{<EspiralDice value={espiralDie(current * 2 + 2)}/>}').replace('{`ESTÁGIO ${next} · ${espiralDie(next * 2 + 2)}`}','{<>ESTÁGIO {next} · <EspiralDice value={espiralDie(next * 2 + 2)}/></>}'));
e('pages/cadastroPersonagem.jsx',s=>s.replace('<strong>{espiralDie([4,6,8,10,12][sheet.attributes[key]-1])}</strong>','<strong><EspiralDice value={espiralDie([4,6,8,10,12][sheet.attributes[key]-1])}/></strong>'));
