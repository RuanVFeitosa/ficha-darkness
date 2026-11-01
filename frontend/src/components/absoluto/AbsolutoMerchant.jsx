import React,{useState} from 'react';

export default function AbsolutoMerchant({items,renderIcon,formatPrice,onAdd,conflict}){
 const [selectedId,setSelectedId]=useState('');
 const selected=items.find(item=>item.id===selectedId);
 const stat=item=>item.armaStatus?.dmg||item.dano||item.cura||(item.defesaBonus?`+${item.defesaBonus} DEF`:'');
 const blocked=selected&&conflict(selected);
 return <div className="abs-merchant-catalog">
  {!selected ? <section className="abs-merchant-cards" aria-label="Catálogo">
   <div className="merchant-list-heading"><span>SUPRIMENTOS DISPONÍVEIS</span><small>{String(items.length).padStart(2,'0')}</small></div>
   <div className="abs-merchant-card-grid">{items.length?items.map(item=><button type="button" key={item.id} className="abs-merchant-card" onClick={()=>setSelectedId(item.id)}><span className="abs-merchant-card-art" aria-hidden="true">{renderIcon(item,3)}</span><span className="abs-merchant-card-name">{item.nome}<small>{item.armaStatus?.tipo||item.categoria}</small></span><span className="abs-merchant-card-footer"><span>{stat(item)}</span><strong>{formatPrice(item)}</strong></span><span className="abs-merchant-card-action">Ver detalhes ↗</span></button>):<p className="abs-store-empty">Nenhum item encontrado. Tente outra busca.</p>}</div>
  </section> : <section className="merchant-inspection abs-merchant-detail" aria-label="Item selecionado">
   <button type="button" className="abs-merchant-back" onClick={()=>setSelectedId('')}>← Voltar aos itens</button>
   {selected&&<div key={selected.id} className="merchant-inspection-content">
    <header><span>{selected.armaStatus?.tipo||selected.categoria}</span><small>ABSOLUTO · ARSENAL DE HELENA</small></header>
    <div className="merchant-display" aria-hidden="true"><div className="merchant-display-object">{renderIcon(selected,9)}</div><span className="merchant-display-label">{selected.nome}</span></div>
    <div className="merchant-item-title"><h2>{selected.nome}</h2><button type="button" disabled={Boolean(blocked)} onClick={()=>onAdd(selected)} title={blocked?`Área já protegida por ${blocked.nome}`:'Separar para compra'}>{blocked?'Já protegido':'Separar'} <span aria-hidden="true">＋</span></button></div>
    <div className="merchant-specification"><div><h3>Características</h3><p>{selected.detalhe}</p>{selected.entrega&&<p>{selected.entrega}</p>}{selected.efeito&&<p>{selected.efeito}</p>}</div><dl>
     {stat(selected)&&<div><dt>{selected.cura?'Cura':selected.defesaBonus?'Proteção':'Dano'}</dt><dd>{stat(selected)}</dd></div>}
     {selected.bonusDano&&<div><dt>Bônus de dano</dt><dd>{selected.bonusDano}</dd></div>}
     {selected.bonusTeste&&<div><dt>Teste</dt><dd>{selected.bonusTeste}</dd></div>}
     {selected.armaStatus?.mag&&<div><dt>Capacidade</dt><dd>{selected.armaStatus.mag}</dd></div>}
     {selected.armaStatus?.recarga&&<div><dt>Recarga</dt><dd>{selected.armaStatus.recarga}</dd></div>}
     {selected.tipoArma&&<div><dt>Compatível</dt><dd>{selected.tipoArma}</dd></div>}
     {selected.quantidade>0&&<div><dt>Quantidade</dt><dd>{selected.quantidade}</dd></div>}
     {selected.usos&&<div><dt>Usos</dt><dd>{selected.usos}</dd></div>}
     {selected.armaStatus?.alcance&&<div><dt>Alcance</dt><dd>{selected.armaStatus.alcance}</dd></div>}
     {selected.armaStatus?.disparosSemDesvantagem&&<div><dt>Disparos sem desvantagem</dt><dd>{selected.armaStatus.disparosSemDesvantagem}</dd></div>}
     {selected.resistencia&&<div><dt>Resistência</dt><dd>{selected.resistencia}</dd></div>}
     <div><dt>Preço</dt><dd>{formatPrice(selected)}</dd></div>
    </dl></div>
   </div>}
  </section>}
 </div>;
}
