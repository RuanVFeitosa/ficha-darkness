import React, {useId,useState} from 'react';
import '../../styles/SessionReferenceTabs.css';

const tables={
 lesion:{label:'Lesão',dice:'1d20',rows:[
  ['1–4','Morte Súbita','Você morre! Hora de criar um personagem novo.'],
  ['5–9','Morte Lenta','O ferimento é fatal, mas gera um surto de adrenalina que permite a você agir uma última vez. Você recupera 1 PV e, se estava inconsciente, acorda, podendo agir na rodada seguinte. Contudo, ao fim dela, você morre. Nenhum efeito pode impedir isso. Use esse tempo para um último ato heroico ou, pelo menos, para dizer suas últimas palavras.'],
  ['10','Laceração Profunda','Uma ferida que reduz sua capacidade física. Perde 2 PV. Você pode ter este ferimento permanentemente mais de uma vez; seus efeitos se acumulam.'],
  ['11','Sem Olho','Você perde o uso de um olho. Sofre −1 em Percepção e Pontaria.'],
  ['12','Sem Mão','Você perde o uso de uma mão ou de um braço (o membro pode ter sido decepado ou inutilizado, como por ter nervos rompidos ou ossos estilhaçados). Só pode empunhar um item e, em tarefas que precisam das duas mãos, sofre uma redução de passo ou até mesmo falha automaticamente, a critério do mestre.'],
  ['13','Sem Pé','Você perde o uso de um pé ou de uma perna (o membro pode ter sido decepado ou inutilizado, como por ter nervos rompidos ou ossos estilhaçados). Sofre duas reduções de passo em testes da ação movimentar-se e em testes de perseguição a pé.'],
  ['14','Tendão Comprometido','Um de seus tendões tem sua capacidade reduzida, diminuindo sua agilidade e rapidez. Sofre −2 em Acrobacia.'],
  ['15','Músculo Comprometido','Um de seus músculos tem sua capacidade reduzida, diminuindo sua força e rapidez. Sofre −2 em Atletismo.'],
  ['16','Órgão Interno Comprometido','Um de seus órgãos internos, como coração, pulmão ou fígado, tem sua capacidade reduzida. Sofre −2 em Vigor.'],
  ['17','Órgão Sensorial Comprometido','Um de seus órgãos sensoriais, como um olho, um ouvido ou o nariz, tem sua capacidade reduzida. Sofre −2 em Percepção.'],
  ['18','Cicatriz Assustadora','Sofre −2 em Persuasão, mas recebe +1 em Intimidar.'],
  ['19','Contusão','Reduz seu Físico em um passo até o fim da cena.'],
  ['20+','Surto de Adrenalina','O ferimento não deixa sequelas e causa um surto de adrenalina que faz você recuperar 1 PV!'],
 ]},
 trauma:{label:'Trauma',dice:'1d20',rows:[
  ['1–4','Colapso Total','Sua mente sucumbe perante o horror. Seu corpo continua vivo, mas torna-se uma casca oca… Hora de criar um novo personagem.'],
  ['5–6','Transtorno de Estresse Pós-Traumático','Sempre que você sofre dano emocional, aumenta esse dano em +1.'],
  ['7–8','Degradação Cognitiva','O medo corroeu sua capacidade de raciocínio. Sofre −1 em Mente.'],
  ['9–10','Mácula Psíquica','Sua visão de mundo se torna mais cinzenta. Sofre −1 em Emoção.'],
  ['11–12','Chaga da Alma','Algo em seu espírito se quebra. Perde 2 PD.'],
  ['13–14','Retração Defensiva','O trauma faz você se retrair e evitar contatos sociais. Sofre −2 em Persuasão e Intuição.'],
  ['15–17','Pânico','Recebe um dado de pavor.'],
  ['18–19','Estupor Catatônico','Perde sua ação na próxima rodada.'],
  ['20+','Injeção de Ânimo','O trauma não deixa sequelas e causa uma injeção de ânimo que faz você recuperar 1 PD!'],
 ]},
 crisis:{label:'Crise',dice:'1d6',rows:[
  ['1','Congelamento','Na próxima vez, escolha entre realizar uma Ação Padrão ou uma Ação de Movimento.'],
  ['2','Fuga Instintiva','Sua próxima movimentação deve, quando possível, aumentar sua distância da origem da Crise.'],
  ['3','Foco Estreito','Receba +1 dado contra a ameaça, mas −1 dado em ações não relacionadas a ela até sua próxima vez.'],
  ['4','Desorganização','Perca Mira, preparação ou outra vantagem temporária que estivesse mantendo.'],
  ['5','Isolamento','Não recebe bônus de auxílio até o final de sua próxima vez.'],
  ['6','Sobrecarga','Receba 2 Dados de Pressão para a próxima Rolagem relevante.'],
 ]},
 rupture:{label:'Ruptura',dice:'1d6',rows:[
  ['1','Paralisia','Até o fim da próxima vez, pode realizar apenas Ações Livres e uma Ação de Movimento.'],
  ['2','Fuga','Recebe +1 dado para escapar da origem da Ruptura, mas −1 dado para permanecer voluntariamente diante dela.'],
  ['3','Confronto','Recebe +1 dado contra a origem da Ruptura, mas −1 dado em ações não relacionadas a ela.'],
  ['4','Desligamento','Sofre −1 dado em Controle Mental, Propósito e Influência até o fim da Cena, mas ignora o próximo Abalo.'],
  ['5','Colapso','Não pode realizar Ação Padrão na próxima vez.'],
  ['6','Fixação','Escolha uma pessoa, objetivo ou tarefa. Receba +1 dado em ações diretamente relacionadas, mas −1 dado para abandoná-la.'],
 ]},
};

export default function SessionReferenceTabs({children}) {
 const [active,setActive]=useState('difficulty');
 const [selected,setSelected]=useState({lesion:0,trauma:0});
 const id=useId();
 const tabs=[['difficulty','Dificuldade'],...Object.entries(tables).map(([key,value])=>[key,value.label])];
 const table=tables[active];
 const compact=active==='lesion'||active==='trauma';
 const row=compact?table.rows[selected[active]]:null;
 return <section className={`shield-session-reference${compact?' shield-session-reference-compact':''}`} aria-label="Consulta da sessão">
  <div role="tablist" aria-label="Tabelas da sessão">{tabs.map(([key,label],index)=><button key={key} type="button" role="tab" id={`${id}-${key}`} aria-selected={active===key} aria-controls={`${id}-panel`} tabIndex={active===key?0:-1} onClick={()=>setActive(key)} onKeyDown={event=>{
   const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
   if(next!==null){event.preventDefault();setActive(tabs[next][0]);event.currentTarget.parentElement.children[next].focus();}
  }}>{label}</button>)}</div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${active}`} tabIndex={0}>
   <div hidden={active!=='difficulty'}>{children}</div>
   {compact && <div className="shield-reference-browser">
    <div><h3>{table.label} · {table.dice}</h3><div className="shield-reference-options" role="group" aria-label={`Resultados de ${table.label}`}>{table.rows.map(([value,name],index)=><button type="button" key={value} aria-pressed={selected[active]===index} onClick={()=>setSelected(current=>({...current,[active]:index}))}><b>{value}</b><span>{name}</span></button>)}</div></div>
    <article className="shield-reference-effect" aria-live="polite"><span>{table.dice} · {row[0]}</span><h3>{row[1]}</h3><p>{row[2]}</p></article>
   </div>}
   {table && !compact && <table className="shield-session-table"><caption>{table.label} · {table.dice}</caption><thead><tr><th scope="col">{table.dice} · {table.label}</th><th scope="col">Efeito</th></tr></thead><tbody>{table.rows.map(([value,name,effect])=><tr key={value}><th scope="row"><span>{value}</span> — {name}</th><td>{effect}</td></tr>)}</tbody></table>}
  </div>
 </section>;
}
